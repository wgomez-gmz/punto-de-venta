import {BindingScope, injectable, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {UserProfile} from '@loopback/security';
import {CreatePurchaseOrderDto} from '../models/dto/create-purchase-order.dto';
import {PurchaseOrder} from '../models/purchase-order.model';
import {CartItemRepository, PurchaseOrderRepository} from '../repositories';
import {ProductVariationRepository} from '../repositories/product-variation.repository';
import {ProductRepository} from '../repositories/product.repository';
import {PurchaseOrderHistoryRepository} from '../repositories/purchase-order-history.repository';
import {PurchaseOrderItemRepository} from '../repositories/purchase-order-item.repository';
import {PurchaseOrderResponseRepository} from '../repositories/purchase-order-response.repository';
import {PurchaseOrderStatusRepository} from '../repositories/purchase-order-status.repository';
import {CartServiceService} from './cart-service.service';

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
    @service() public cartService: CartServiceService,
  ) { }

  async createPurchaseOrder(
    currentUserProfile: UserProfile,
    createPurchaseOrderDto: CreatePurchaseOrderDto
  ): Promise<PurchaseOrder> {
    const {formResponses, cartItems, total, paymentMethod} = createPurchaseOrderDto;

    // Get current cart data from database to ensure integrity
    const currentCart = await this.cartService.getCurrentUserCart(currentUserProfile);

    // Validate that the cart items from the request match the current cart
    if (!currentCart.cart || !currentCart.cart.cartItems) {
      throw new Error('No active cart found for the user');
    }

    const dbCartItems = currentCart.cart.cartItems.filter((item: any) => item.enable === true);
    const enabledCartItems = cartItems.filter(item => item.enable === true);

    console.log('dbCartItems', dbCartItems);
    console.log('enabledCartItems', enabledCartItems);
    if (dbCartItems.length !== enabledCartItems.length) {
      throw new Error('Enabled cart items count mismatch between request and database');
    }

    // Check each enabled cart item for integrity
    for (const requestItem of enabledCartItems) {
      const dbItem = dbCartItems.find((item: any) =>
        item.productId === requestItem.productId &&
        item.productVariationId === requestItem.productVariationId
      );

      if (!dbItem) {
        throw new Error(`Cart item not found in database: productId ${requestItem.productId}, variationId ${requestItem.productVariationId}`);
      }

      if (dbItem.quantity !== requestItem.quantity) {
        throw new Error(`Quantity mismatch for productId ${requestItem.productId}: request ${requestItem.quantity}, database ${dbItem.quantity}`);
      }

      if (dbItem.price !== requestItem.price) {
        throw new Error(`Price mismatch for productId ${requestItem.productId}: request ${requestItem.price}, database ${dbItem.price}`);
      }

      if (dbItem.discountedPrice !== requestItem.discountedPrice) {
        throw new Error(`Discounted price mismatch for productId ${requestItem.productId}: request ${requestItem.discountedPrice}, database ${dbItem.discountedPrice}`);
      }

      // Validate stock availability
      if (requestItem.productVariationId) {
        // Check variation stock
        const variationStock = dbItem.productVariation?.stock ?? 0;
        if (variationStock < requestItem.quantity) {
          throw new Error(`Insufficient stock for product variation ${requestItem.productVariationId}: available ${variationStock}, requested ${requestItem.quantity}`);
        }
      } else {
        // Check product stock
        const productStock = dbItem.product?.stock ?? 0;
        if (productStock < requestItem.quantity) {
          throw new Error(`Insufficient stock for product ${requestItem.productId}: available ${productStock}, requested ${requestItem.quantity}`);
        }
      }
    }

    // Create the purchase order
    const purchaseOrder = await this.purchaseOrderRepository.create({
      usersId: currentUserProfile.id,
      total,
      paymentMethodSnapshot: paymentMethod,
      currentStatusId: undefined, // Will be set after status creation
    });

    // Create purchase order items and deduct stock (only for enabled cart items)
    for (const cartItem of enabledCartItems) {
      const purchaseOrderItem = await this.purchaseOrderItemRepository.create({
        purchaseOrderId: purchaseOrder.id!,
        productId: cartItem.productId,
        productVariationId: cartItem.productVariationId,
        quantity: cartItem.quantity,
        price: cartItem.price || cartItem.product.price,
        discountedPrice: cartItem.discountedPrice,
        productSnapshot: cartItem.product,
        productVariationSnapshot: cartItem.productVariation,
      });

      // Deduct stock
      if (cartItem.productVariationId) {
        // Deduct from product variation stock
        const productVariation = await this.productVariationRepository.findById(cartItem.productVariationId);
        const newStock = productVariation.stock - cartItem.quantity;
        await this.productVariationRepository.updateById(cartItem.productVariationId, {stock: newStock});
      } else {
        // Deduct from product stock
        const product = await this.productRepository.findById(cartItem.productId);
        const newStock = product.stock - cartItem.quantity;
        await this.productRepository.updateById(cartItem.productId, {stock: newStock});
      }
    }

    // Remove sold cart items from the cart
    for (const cartItem of enabledCartItems) {
      await this.cartItemRepository.deleteById(cartItem.id);
    }

    // Store form responses
    for (const formResponse of formResponses) {
      await this.purchaseOrderResponseRepository.create({
        purchaseOrderId: purchaseOrder.id!,
        pregunta: formResponse.pregunta,
        respuesta: formResponse.respuesta,
        formularioId: formResponse.formularioId,
      });
    }

    // Set initial status to "pending_payment"
    const pendingStatus = await this.purchaseOrderStatusRepository.findOne({
      where: {key: 'pending_payment'}
    });
    if (pendingStatus) {
      // Update the purchase order with current status
      await this.purchaseOrderRepository.updateById(purchaseOrder.id!, {
        currentStatusId: pendingStatus.id!
      });

      // Create history entry for the initial status
      await this.purchaseOrderHistoryRepository.create({
        purchaseOrderId: purchaseOrder.id!,
        previousStatusId: undefined, // No previous status for new orders
        newStatusId: pendingStatus.id!,
        userId: undefined, // System-generated status change
      });
    }

    return purchaseOrder;
  }
}
