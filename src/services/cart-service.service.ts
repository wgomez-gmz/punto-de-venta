import {BindingScope, injectable, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {CartDto, CartItemDto, CartResponseDto} from '../models/dto/cart.dto';
import {ProductDto} from '../models/dto/product-list.dto';
import {CartItemRepository, CartRepository, ProductImagesRepository} from '../repositories';
import {ProductServiceService} from './product-service.service';

@injectable({scope: BindingScope.TRANSIENT})
export class CartServiceService {
  constructor(
    @repository(CartRepository)
    public cartRepository: CartRepository,
    @repository(CartItemRepository)
    public cartItemRepository: CartItemRepository,
    @repository(ProductImagesRepository)
    public productImagesRepository: ProductImagesRepository,
    @service() public productServiceService: ProductServiceService,
  ) { }

  /**
   * Parses a date string in dd/mm/yyyy format to a Date object
   * @param dateString - Date string in dd/mm/yyyy format
   * @returns Date object
   */
  /*private parseDateString(dateString: string): Date {
    const parts = dateString.split('/');
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${dateString}. Expected dd/mm/yyyy`);
    }
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }*/

  /**
   * Validates if a discount is currently active based on start and end dates
   * @param discountStartDate - Start date of the discount (optional)
   * @param discountEndDate - End date of the discount (optional)
   * @returns true if discount is active, false otherwise
   */
  /*private isDiscountActive(discountStartDate?: string, discountEndDate?: string): boolean {
    const now = getLocalDate(new Date());

    // If dates are empty, discount is always active
    if (!discountStartDate && !discountEndDate) {
      return true;
    }

    // If only start date exists and current date >= start date, discount is active
    if (discountStartDate && !discountEndDate) {
      const startDate = this.parseDateString(discountStartDate);
      startDate.setHours(0, 0, 0, 0);
      const startOfDay = getLocalDate(startDate);
      return now >= startOfDay;
    }

    // If both dates exist, check if current date is within range
    if (discountStartDate && discountEndDate) {
      const startDate = this.parseDateString(discountStartDate);
      startDate.setHours(0, 0, 0, 0);
      const startOfDay = getLocalDate(startDate);

      const endDate = this.parseDateString(discountEndDate);
      endDate.setHours(23, 59, 59, 999);
      const endOfDay = getLocalDate(endDate);

      return now >= startOfDay && now <= endOfDay;
    }

    // If only end date exists, discount is not active (invalid configuration)
    return false;
  }*/

  /**
   * Determines pricing information for a cart item based on product or variation
   * @param product - The product object
   * @param productVariation - The product variation object (optional)
   * @param hasVariation - Whether the cart item has a variation
   * @returns Object with price, discountedPrice, and discountEnable
   */
  /*public getPricingInfo(product: any, productVariation: any, hasVariation: boolean) {
    let price: number | undefined;
    let discountedPrice: number | undefined;
    let discountEnable = false;

    if (hasVariation && productVariation) {
      // Use price and discountedPrice from product variation
      price = productVariation.price;
      discountedPrice = productVariation.discountedPrice;
      discountEnable = this.productServiceService.isDiscountActive(productVariation.discountStartDate, productVariation.discountEndDate) &&
        discountedPrice !== undefined && discountedPrice > 0 && discountedPrice < price!;
    } else if (product) {
      // Use price and discountedPrice from product
      price = product.price;
      discountedPrice = product.discountedPrice;
      discountEnable = this.isDiscountActive(product.discountStartDate, product.discountEndDate) &&
        discountedPrice !== undefined && discountedPrice > 0 && discountedPrice < price!;
    }

    return {price, discountedPrice, discountEnable};
  }*/

  async getCurrentUserCart(currentUserProfile: UserProfile): Promise<CartResponseDto> {
    const userId = currentUserProfile.id;

    // Get the cart with cartItems, and include product and productVariation details
    const cart = await this.cartRepository.findOne({
      where: {usersId: userId},
      include: [
        {
          relation: 'cartItems',
          scope: {
            include: [
              {
                relation: 'product',
              },
              {
                relation: 'productVariation',
              },
            ],
          },
        },
      ],
    });

    if (!cart) {
      // Return empty cart if none exists
      return {
        user: currentUserProfile,
        cart: undefined,
      };
    }

    // Map to DTO with attachmentId computed for products
    const cartDto: CartDto = {
      id: cart.id,
      usersId: cart.usersId,
      creationDate: cart.creationDate,
      cartItems: [],
    };

    if (cart.cartItems) {
      for (const cartItem of cart.cartItems) {
        const product = (cartItem as any).product;
        let productDto: ProductDto | undefined = undefined;

        if (product) {
          // Compute AttachmentId from ProductImages with lowest order and enabled=true
          const productImages = await this.productImagesRepository.find({
            where: {productId: product.id},
          });
          const enabledImages = productImages.filter(pi => pi.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
          const attachmentId = enabledImages.length > 0 ? enabledImages[0].attachmentId : 0;

          // Map product to ProductListDto format
          productDto = {
            id: product.id,
            creationDate: product.creationDate,
            updateDate: product.updateDate,
            status: product.status,
            name: product.name,
            shortDescription: product.shortDescription,
            completeDescription: product.completeDescription,
            description: product.description,
            barcode: product.barcode,
            price: product.price,
            discountedPrice: product.discountedPrice,
            discountStartDate: product.discountStartDate,
            discountEndDate: product.discountEndDate,
            sku: product.sku,
            gtin: product.gtin,
            discountScheduled: product.discountScheduled,
            cost: product.cost,
            stock: product.stock,
            minStock: product.minStock,
            categories: product.categories,
            attachments: product.attachments,
            attributes: product.attributes,
            variations: product.variations,
            attachmentId: attachmentId,
          };
        }

        // Determine price, discountedPrice, and discountEnable
        const productVariation = (cartItem as any).productVariation;
        const hasVariation = !!(productVariation && cartItem.productVariationId);
        const {price, discountedPrice, discountEnable} = this.productServiceService.getPricingInfo(product, productVariation, hasVariation);

        const cartItemDto: CartItemDto = {
          id: cartItem.id,
          quantity: cartItem.quantity,
          enable: cartItem.enable,
          cartId: cartItem.cartId,
          productId: cartItem.productId,
          productVariationId: cartItem.productVariationId,
          creationDate: cartItem.creationDate,
          product: productDto,
          productVariation: productVariation,
          price: price,
          discountedPrice: discountedPrice,
          discountEnable: discountEnable,
        };

        cartDto.cartItems!.push(cartItemDto);
      }
    }

    return {
      user: currentUserProfile,
      cart: cartDto,
    };
  }

  async updateCartItemQuantity(productId: number, productVariationId?: number, quantity?: number, cartId?: number): Promise<CartItemDto> {
    // Build where clause
    const where: any = {
      cartId: cartId,
      productId: productId,
      productVariationId: productVariationId !== undefined ? productVariationId : null,
    };

    // Find the cart item
    const cartItem: any = await this.cartItemRepository.findOne({
      where: where,
    });

    if (!cartItem) {
      throw new HttpErrors.NotFound('Cart item not found');
    }

    // Update the quantity
    cartItem.quantity = quantity;
    await this.cartItemRepository.updateById(cartItem.id!, cartItem);

    // Get the updated cart item with relations for response
    const updatedCartItem = await this.cartItemRepository.findById(cartItem.id!, {
      include: [
        {
          relation: 'product',
        },
        {
          relation: 'productVariation',
        },
      ],
    });

    // Map to DTO with attachmentId
    const product = (updatedCartItem as any).product;
    let productDto: ProductDto | undefined = undefined;

    if (product) {
      // Compute AttachmentId from ProductImages with lowest order and enabled=true
      const productImages = await this.productImagesRepository.find({
        where: {productId: product.id},
      });
      const enabledImages = productImages.filter(pi => pi.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
      const attachmentId = enabledImages.length > 0 ? enabledImages[0].attachmentId : 0;

      // Map product to ProductListDto format
      productDto = {
        id: product.id,
        creationDate: product.creationDate,
        updateDate: product.updateDate,
        status: product.status,
        name: product.name,
        shortDescription: product.shortDescription,
        completeDescription: product.completeDescription,
        description: product.description,
        barcode: product.barcode,
        price: product.price,
        discountedPrice: product.discountedPrice,
        discountStartDate: product.discountStartDate,
        discountEndDate: product.discountEndDate,
        sku: product.sku,
        gtin: product.gtin,
        discountScheduled: product.discountScheduled,
        cost: product.cost,
        stock: product.stock,
        minStock: product.minStock,
        categories: product.categories,
        attachments: product.attachments,
        attributes: product.attributes,
        variations: product.variations,
        attachmentId: attachmentId,
      };
    }

    // Determine price, discountedPrice, and discountEnable
    const productVariation = (updatedCartItem as any).productVariation;
    const hasVariation = !!(productVariation && updatedCartItem.productVariationId);
    const {price, discountedPrice, discountEnable} = this.productServiceService.getPricingInfo(product, productVariation, hasVariation);

    const cartItemDto: CartItemDto = {
      id: updatedCartItem.id,
      quantity: updatedCartItem.quantity,
      enable: updatedCartItem.enable,
      cartId: updatedCartItem.cartId,
      productId: updatedCartItem.productId,
      productVariationId: updatedCartItem.productVariationId,
      creationDate: updatedCartItem.creationDate,
      product: productDto,
      productVariation: productVariation,
      price: price,
      discountedPrice: discountedPrice,
      discountEnable: discountEnable,
    };

    return cartItemDto;
  }
}
