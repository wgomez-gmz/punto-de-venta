import {BindingScope, injectable, service} from '@loopback/core';
import {IsolationLevel, repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {CreatePurchaseOrderDto} from '../models/dto/create-purchase-order.dto';
import {PurchaseOrder} from '../models/purchase-order.model';
import {CartItemRepository, CouponRepository, CouponUsageRepository, PurchaseOrderRepository, UsersRepository} from '../repositories';
import {ProductVariationRepository} from '../repositories/product-variation.repository';
import {ProductRepository} from '../repositories/product.repository';
import {PurchaseOrderHistoryRepository} from '../repositories/purchase-order-history.repository';
import {PurchaseOrderItemRepository} from '../repositories/purchase-order-item.repository';
import {PurchaseOrderResponseRepository} from '../repositories/purchase-order-response.repository';
import {PurchaseOrderStatusRepository} from '../repositories/purchase-order-status.repository';
import {CartServiceService} from './cart-service.service';
import {EmailService} from './email.service';
import {PaymentGatewayClientService} from './payment-gateway-client.service';

@injectable({scope: BindingScope.TRANSIENT})
export class PurchaseOrderService {
  constructor(
    @repository(PurchaseOrderRepository)
    public purchaseOrderRepository: PurchaseOrderRepository,
    @repository(PurchaseOrderItemRepository)
    public purchaseOrderItemRepository: PurchaseOrderItemRepository,
    @repository(PurchaseOrderResponseRepository)
    public purchaseOrderResponseRepository: PurchaseOrderResponseRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(ProductVariationRepository)
    public productVariationRepository: ProductVariationRepository,
    @repository(PurchaseOrderHistoryRepository)
    public purchaseOrderHistoryRepository: PurchaseOrderHistoryRepository,
    @repository(PurchaseOrderStatusRepository)
    public purchaseOrderStatusRepository: PurchaseOrderStatusRepository,
    @repository(CartItemRepository)
    public cartItemRepository: CartItemRepository,
    @repository(CouponRepository)
    public couponRepository: CouponRepository,
    @repository(CouponUsageRepository)
    public couponUsageRepository: CouponUsageRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @service() public cartService: CartServiceService,
    @service() public emailService: EmailService,
    @service() public paymentGatewayClientService: PaymentGatewayClientService,
  ) { }

  async createPurchaseOrder(
    currentUserProfile: UserProfile,
    createPurchaseOrderDto: CreatePurchaseOrderDto
  ): Promise<PurchaseOrder> {
    const {formResponses, cartItems, total, paymentMethod, couponCode} = createPurchaseOrderDto;

    const dataSource = this.purchaseOrderRepository.dataSource;
    if (!dataSource) {
      throw new Error('DataSource not available for purchaseOrderRepository');
    }

    const tx = await dataSource.beginTransaction({
      isolationLevel: IsolationLevel.READ_COMMITTED,
    });

    try {
      // Get current cart data from database to ensure integrity
      const currentCart = await this.cartService.getCurrentUserCart(currentUserProfile);

      // Validate that the cart items from the request match the current cart
      if (!currentCart.cart || !currentCart.cart.cartItems) {
        throw new HttpErrors.BadRequest('No active cart found for the user');
      }

      const dbCartItems = currentCart.cart.cartItems.filter((item: any) => item.enable === true);
      const enabledCartItems = cartItems.filter(item => item.enable === true);

      if (dbCartItems.length !== enabledCartItems.length) {
        throw new HttpErrors.BadRequest('Enabled cart items count mismatch between request and database');
      }

      // Check each enabled cart item for integrity
      for (const requestItem of enabledCartItems) {
        const dbItem = dbCartItems.find((item: any) =>
          item.productId === requestItem.productId &&
          item.productVariationId === requestItem.productVariationId
        );

        if (!dbItem) {
          throw new HttpErrors.BadRequest(
            `Cart item not found in database: productId ${requestItem.productId}, variationId ${requestItem.productVariationId}`
          );
        }

        if (dbItem.quantity !== requestItem.quantity) {
          throw new HttpErrors.BadRequest(
            `Quantity mismatch for productId ${requestItem.productId}: request ${requestItem.quantity}, database ${dbItem.quantity}`
          );
        }

        if (dbItem.price !== requestItem.price) {
          throw new HttpErrors.BadRequest(
            `Price mismatch for productId ${requestItem.productId}: request ${requestItem.price}, database ${dbItem.price}`
          );
        }

        if (dbItem.discountedPrice !== requestItem.discountedPrice) {
          throw new HttpErrors.BadRequest(
            `Discounted price mismatch for productId ${requestItem.productId}: request ${requestItem.discountedPrice}, database ${dbItem.discountedPrice}`
          );
        }

        // Validate stock availability
        if (requestItem.productVariationId) {
          // Check variation stock
          const variationStock = dbItem.productVariation?.stock ?? 0;
          if (variationStock < requestItem.quantity) {
            throw new HttpErrors.BadRequest(
              `Insufficient stock for product variation ${requestItem.productVariationId}: available ${variationStock}, requested ${requestItem.quantity}`
            );
          }
        } else {
          // Check product stock
          const productStock = dbItem.product?.stock ?? 0;
          if (productStock < requestItem.quantity) {
            throw new HttpErrors.BadRequest(
              `Insufficient stock for product ${requestItem.productId}: available ${productStock}, requested ${requestItem.quantity}`
            );
          }
        }
      }

      const subtotal = Number(enabledCartItems.reduce((sum, item) => {
        const itemPrice = item.discountEnable && item.discountedPrice ? item.discountedPrice : (item.price ?? 0);
        return sum + (itemPrice * item.quantity);
      }, 0).toFixed(2));

      const couponValidation = couponCode
        ? await this.validateCoupon(couponCode, subtotal, Number(currentUserProfile.id))
        : null;
      const discountTotal = couponValidation?.discountAmount || 0;
      const calculatedTotal = Number(Math.max(subtotal - discountTotal, 0).toFixed(2));

      if (Number(total.toFixed(2)) !== calculatedTotal) {
        throw new HttpErrors.BadRequest('El total enviado no coincide con el total calculado por el servidor.');
      }

      // Create the purchase order
      const purchaseOrder = await this.purchaseOrderRepository.create({
        usersId: currentUserProfile.id,
        subtotal,
        discountTotal,
        couponCode: couponValidation?.coupon.code,
        couponSnapshot: couponValidation?.coupon,
        total: calculatedTotal,
        paymentMethodSnapshot: paymentMethod,
        currentStatusId: undefined, // Will be set after status creation
      }, {transaction: tx});

      // Create purchase order items and deduct stock (only for enabled cart items)
      for (const cartItem of enabledCartItems) {
        await this.purchaseOrderItemRepository.create({
          purchaseOrderId: purchaseOrder.id!,
          productId: cartItem.productId,
          productVariationId: cartItem.productVariationId,
          quantity: cartItem.quantity,
          price: cartItem.price || cartItem.product.price,
          discountedPrice: cartItem.discountedPrice,
          productSnapshot: cartItem.product,
          productVariationSnapshot: cartItem.productVariation,
        }, {transaction: tx});

        // Deduct stock
        if (cartItem.productVariationId) {
          // Deduct from product variation stock
          const productVariation = await this.productVariationRepository.findById(
            cartItem.productVariationId,
            undefined,
            {transaction: tx}
          );
          const newStock = productVariation.stock - cartItem.quantity;
          await this.productVariationRepository.updateById(cartItem.productVariationId, {stock: newStock}, {transaction: tx});
        } else {
          // Deduct from product stock
          const product = await this.productRepository.findById(
            cartItem.productId,
            undefined,
            {transaction: tx}
          );
          const newStock = product.stock - cartItem.quantity;
          await this.productRepository.updateById(cartItem.productId, {stock: newStock}, {transaction: tx});
        }
      }

      const currentUser = await this.usersRepository.findById(Number(currentUserProfile.id), {
        include: [{relation: 'people'}],
      }, {transaction: tx});

      const provider = await this.paymentGatewayClientService.ensureProvider(paymentMethod);
      const paymentIntent = await this.paymentGatewayClientService.createPaymentIntent({
        providerKey: provider.key,
        merchantReference: `PO-${purchaseOrder.id}`,
        externalOrderId: String(purchaseOrder.id),
        amount: calculatedTotal,
        currency: 'MXN',
        customerId: String(currentUserProfile.id),
        customerEmail: currentUser.people?.email || currentUser.username,
        description: `Orden ${purchaseOrder.id} del ecommerce`,
        metadata: {
          purchaseOrderId: purchaseOrder.id,
          userId: Number(currentUserProfile.id),
          paymentMethodId: paymentMethod?.id,
          paymentMethodName: paymentMethod?.name,
          subtotal,
          discountTotal,
          couponCode: couponValidation?.coupon?.code,
        },
        callbackUrls: {
          successUrl: `${process.env.PAYMENT_SUCCESS_URL || 'http://127.0.0.1:5000/client/payment-return'}?purchaseOrderId=${purchaseOrder.id}&flow=success`,
          cancelUrl: `${process.env.PAYMENT_CANCEL_URL || 'http://127.0.0.1:5000/client/payment-return'}?purchaseOrderId=${purchaseOrder.id}&flow=cancel`,
        },
      });

      await this.purchaseOrderRepository.updateById(purchaseOrder.id!, {
        paymentIntentId: paymentIntent.id,
        paymentIntentSnapshot: paymentIntent,
      }, {transaction: tx});

      // Remove sold cart items from the cart (use dbCartItems to avoid trusting request ids)
      for (const cartItem of dbCartItems) {
        await this.cartItemRepository.deleteById(cartItem.id, {transaction: tx});
      }

      // Store form responses
      for (const formResponse of formResponses) {
        await this.purchaseOrderResponseRepository.create({
          purchaseOrderId: purchaseOrder.id!,
          pregunta: formResponse.pregunta,
          respuesta: formResponse.respuesta,
          formularioId: formResponse.formularioId,
        }, {transaction: tx});
      }

      // Set initial status to "pending_payment"
      const pendingStatus = await this.purchaseOrderStatusRepository.findOne({
        where: {key: 'pending_payment'}
      }, {transaction: tx});

      if (!pendingStatus) {
        throw new HttpErrors.InternalServerError('Missing purchase order status: pending_payment');
      }

      // Update the purchase order with current status
      await this.purchaseOrderRepository.updateById(purchaseOrder.id!, {
        currentStatusId: pendingStatus.id!
      }, {transaction: tx});

      // Create history entry for the initial status
      await this.purchaseOrderHistoryRepository.create({
        purchaseOrderId: purchaseOrder.id!,
        previousStatusId: undefined, // No previous status for new orders
        newStatusId: pendingStatus.id!,
        userId: undefined, // System-generated status change
      }, {transaction: tx});

      if (couponValidation?.coupon.id) {
        await this.couponUsageRepository.create({
          couponId: couponValidation.coupon.id,
          usersId: Number(currentUserProfile.id),
          purchaseOrderId: purchaseOrder.id!,
          discountAmount: couponValidation.discountAmount,
        }, {transaction: tx});

        await this.couponRepository.updateById(couponValidation.coupon.id, {
          usageCount: (couponValidation.coupon.usageCount || 0) + 1,
        }, {transaction: tx});
      }

      await tx.commit();
      const savedOrder = await this.purchaseOrderRepository.findById(purchaseOrder.id!, {
        include: [{relation: 'currentStatus'}],
      });
      await this.sendOrderCreatedNotification(savedOrder);
      return savedOrder;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  async confirmPurchaseOrderPayment(
    currentUserProfile: UserProfile,
    purchaseOrderId: number,
    body: {providerReference?: string; metadata?: object},
  ): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(purchaseOrderId);
    this.ensureOrderOwnership(order, currentUserProfile);

    if (!order.paymentIntentId) {
      throw new HttpErrors.BadRequest('La orden no tiene un intent de pago asociado.');
    }

    const paymentIntent = await this.paymentGatewayClientService.confirmPaymentIntent(
      order.paymentIntentId,
      body,
    );

    await this.purchaseOrderRepository.updateById(purchaseOrderId, {
      paymentIntentSnapshot: paymentIntent,
    });

    await this.updateOrderStatusByPaymentIntent(order, paymentIntent);
    return this.getOrderDetailForUser(purchaseOrderId, currentUserProfile);
  }

  async cancelPurchaseOrderPayment(
    currentUserProfile: UserProfile,
    purchaseOrderId: number,
    body: {reason?: string},
  ): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(purchaseOrderId);
    this.ensureOrderOwnership(order, currentUserProfile);

    if (!order.paymentIntentId) {
      throw new HttpErrors.BadRequest('La orden no tiene un intent de pago asociado.');
    }

    const paymentIntent = await this.paymentGatewayClientService.cancelPaymentIntent(
      order.paymentIntentId,
      body,
    );

    await this.purchaseOrderRepository.updateById(purchaseOrderId, {
      paymentIntentSnapshot: paymentIntent,
    });

    await this.updateOrderStatusByPaymentIntent(order, paymentIntent);
    return this.getOrderDetailForUser(purchaseOrderId, currentUserProfile);
  }

  async retryPurchaseOrderPayment(
    currentUserProfile: UserProfile,
    purchaseOrderId: number,
    body: {paymentMethod?: any},
  ): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(purchaseOrderId, {
      include: [
        {relation: 'currentStatus'},
        {relation: 'purchaseOrderItems'},
      ],
    });
    this.ensureOrderOwnership(order, currentUserProfile);

    const currentStatusKey = (order as any).currentStatus?.key;
    if (!['pending_payment', 'cancelled'].includes(currentStatusKey)) {
      throw new HttpErrors.UnprocessableEntity('Solo puedes reintentar el pago en ordenes pendientes o canceladas.');
    }

    const selectedPaymentMethod = body.paymentMethod || order.paymentMethodSnapshot;
    if (!selectedPaymentMethod?.name) {
      throw new HttpErrors.BadRequest('Debes indicar un metodo de pago valido.');
    }

    if (order.paymentIntentId) {
      try {
        await this.paymentGatewayClientService.cancelPaymentIntent(order.paymentIntentId, {
          reason: 'El cliente decidio reintentar o cambiar el metodo de pago.',
        });
      } catch (error) {
        // Ignored on purpose: old intents may already be closed or expired.
      }
    }

    const currentUser = await this.usersRepository.findById(Number(currentUserProfile.id), {
      include: [{relation: 'people'}],
    });

    const provider = await this.paymentGatewayClientService.ensureProvider(selectedPaymentMethod);
    const paymentIntent = await this.paymentGatewayClientService.createPaymentIntent({
      providerKey: provider.key,
      merchantReference: `PO-${order.id}`,
      externalOrderId: String(order.id),
      amount: Number(order.total || 0),
      currency: 'MXN',
      customerId: String(currentUserProfile.id),
      customerEmail: currentUser.people?.email || currentUser.username,
      description: `Reintento de orden ${order.id} del ecommerce`,
      metadata: {
        purchaseOrderId: order.id,
        userId: Number(currentUserProfile.id),
        paymentMethodId: selectedPaymentMethod?.id,
        paymentMethodName: selectedPaymentMethod?.name,
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        couponCode: order.couponCode,
        retry: true,
      },
      callbackUrls: {
        successUrl: `${process.env.PAYMENT_SUCCESS_URL || 'http://127.0.0.1:5000/client/payment-return'}?purchaseOrderId=${order.id}&flow=success`,
        cancelUrl: `${process.env.PAYMENT_CANCEL_URL || 'http://127.0.0.1:5000/client/payment-return'}?purchaseOrderId=${order.id}&flow=cancel`,
      },
    });

    await this.purchaseOrderRepository.updateById(order.id!, {
      paymentMethodSnapshot: selectedPaymentMethod,
      paymentIntentId: paymentIntent.id,
      paymentIntentSnapshot: paymentIntent,
    });

    return this.getOrderDetailForUser(order.id!, currentUserProfile);
  }

  async syncPurchaseOrderPaymentFromGateway(body: {
    paymentIntentId: number;
    externalOrderId?: string;
    merchantReference?: string;
    status: string;
    providerKey: string;
    providerReference?: string;
    captureReference?: string;
    refundedAmount?: number;
    amount: number;
    currency: string;
    providerPayload?: object;
  }): Promise<PurchaseOrder> {
    let order: PurchaseOrder | null = null;

    if (body.externalOrderId) {
      order = await this.purchaseOrderRepository.findById(Number(body.externalOrderId));
    }

    if (!order && body.paymentIntentId) {
      order = await this.purchaseOrderRepository.findOne({
        where: {paymentIntentId: body.paymentIntentId},
      });
    }

    if (!order) {
      throw new HttpErrors.NotFound('No se encontro una orden asociada al intent de pago.');
    }

    const mergedPaymentIntentSnapshot = {
      ...(order.paymentIntentSnapshot || {}),
      id: body.paymentIntentId,
      providerKey: body.providerKey,
      externalOrderId: body.externalOrderId,
      merchantReference: body.merchantReference,
      status: body.status,
      providerReference: body.providerReference,
      captureReference: body.captureReference,
      refundedAmount: body.refundedAmount,
      amount: body.amount,
      currency: body.currency,
      providerPayload: body.providerPayload,
    };

    await this.purchaseOrderRepository.updateById(order.id!, {
      paymentIntentId: body.paymentIntentId,
      paymentIntentSnapshot: mergedPaymentIntentSnapshot,
    });

    await this.updateOrderStatusByPaymentIntent(order, mergedPaymentIntentSnapshot);
    return this.purchaseOrderRepository.findById(order.id!, {
      include: [{relation: 'currentStatus'}],
    });
  }

  private async validateCoupon(code: string, subtotal: number, usersId: number): Promise<any> {
    const normalizedCode = String(code || '').trim().toUpperCase();
    const coupon = await this.couponRepository.findOne({
      where: {code: normalizedCode},
    });

    if (!coupon || !coupon.isActive) {
      throw new HttpErrors.NotFound('El cupon no esta disponible.');
    }

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      throw new HttpErrors.UnprocessableEntity('El cupon aun no esta vigente.');
    }
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      throw new HttpErrors.UnprocessableEntity('El cupon ya expiro.');
    }
    if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
      throw new HttpErrors.UnprocessableEntity('El monto minimo para aplicar este cupon no se cumple.');
    }
    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      throw new HttpErrors.UnprocessableEntity('El cupon ya alcanzo su limite de uso.');
    }

    const usageCount = await this.couponUsageRepository.count({
      couponId: coupon.id,
      usersId,
    });
    if (coupon.perUserLimit && usageCount.count >= coupon.perUserLimit) {
      throw new HttpErrors.UnprocessableEntity('Ya utilizaste este cupon el numero maximo de veces permitido.');
    }

    let discountAmount = coupon.discountType === 'fixed'
      ? coupon.discountValue
      : subtotal * (coupon.discountValue / 100);

    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }

    return {
      coupon,
      discountAmount: Number(discountAmount.toFixed(2)),
    };
  }

  private ensureOrderOwnership(order: PurchaseOrder, currentUserProfile: UserProfile): void {
    if (Number(order.usersId) !== Number(currentUserProfile.id)) {
      throw new HttpErrors.Forbidden('No tienes acceso a esta orden.');
    }
  }

  private async updateOrderStatusByPaymentIntent(
    order: PurchaseOrder,
    paymentIntent: any,
  ): Promise<void> {
    const statusKey = ['paid', 'authorized'].includes(paymentIntent.status)
      ? 'payment_confirmed'
      : paymentIntent.status === 'canceled'
        ? 'cancelled'
        : ['refunded', 'partially_refunded'].includes(paymentIntent.status)
          ? 'refunded'
          : paymentIntent.status === 'failed'
            ? 'cancelled'
        : 'pending_payment';

    const targetStatus = await this.purchaseOrderStatusRepository.findOne({
      where: {key: statusKey},
    });

    if (!targetStatus?.id || targetStatus.id === order.currentStatusId) {
      return;
    }

    await this.purchaseOrderRepository.updateById(order.id!, {
      currentStatusId: targetStatus.id,
    });

    await this.purchaseOrderHistoryRepository.create({
      purchaseOrderId: order.id!,
      previousStatusId: order.currentStatusId,
      newStatusId: targetStatus.id,
      userId: undefined,
    });

    await this.sendOrderStatusNotification(order.id!, targetStatus.name, statusKey === 'payment_confirmed');
  }

  async getOrderDetailForUser(
    purchaseOrderId: number,
    currentUserProfile: UserProfile,
  ): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(purchaseOrderId, {
      include: [
        {relation: 'purchaseOrderItems'},
        {relation: 'currentStatus'},
        {relation: 'purchaseOrderResponses'},
      ],
    });

    this.ensureOrderOwnership(order, currentUserProfile);
    return order;
  }

  async sendOrderStatusNotification(
    purchaseOrderId: number,
    statusName?: string,
    paymentConfirmed?: boolean,
  ): Promise<void> {
    const order = await this.purchaseOrderRepository.findById(purchaseOrderId, {
      include: [{relation: 'currentStatus'}],
    });
    const user = await this.usersRepository.findById(Number(order.usersId), {
      include: [{relation: 'people'}],
    });

    const recipientEmail = (user as any).people?.email || user.email || user.username;
    if (!recipientEmail) {
      return;
    }

    const customerName = [
      (user as any).people?.name,
      (user as any).people?.firstLastName,
    ].filter(Boolean).join(' ').trim() || user.username;

    const payload = {
      orderId: order.id!,
      customerName,
      total: Number(order.total || 0),
      statusName: statusName || (order as any).currentStatus?.name,
      paymentMethodName: order.paymentMethodSnapshot?.displayName,
      detailUrl: `${process.env.FRONTEND_APP_URL || 'http://localhost:5000'}/client/orders/${order.id}`,
    };

    if (paymentConfirmed) {
      await this.emailService.sendOrderPaymentConfirmedEmail(recipientEmail, payload);
      return;
    }

    await this.emailService.sendOrderStatusEmail(recipientEmail, payload);
  }

  private async sendOrderCreatedNotification(order: PurchaseOrder): Promise<void> {
    const user = await this.usersRepository.findById(Number(order.usersId), {
      include: [{relation: 'people'}],
    });

    const recipientEmail = (user as any).people?.email || user.email || user.username;
    if (!recipientEmail) {
      return;
    }

    const customerName = [
      (user as any).people?.name,
      (user as any).people?.firstLastName,
    ].filter(Boolean).join(' ').trim() || user.username;

    await this.emailService.sendOrderCreatedEmail(recipientEmail, {
      orderId: order.id!,
      customerName,
      total: Number(order.total || 0),
      statusName: (order as any).currentStatus?.name,
      paymentMethodName: order.paymentMethodSnapshot?.displayName,
      detailUrl: `${process.env.FRONTEND_APP_URL || 'http://localhost:5000'}/client/orders/${order.id}`,
    });
  }
}
