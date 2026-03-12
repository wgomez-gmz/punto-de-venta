import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ProductDto} from '../models';
import {ProductCategoriesRepository, ProductImagesRepository, ProductRepository} from '../repositories';
import {getLocalDate} from '../utils/resource';

@injectable({scope: BindingScope.TRANSIENT})
export class ProductServiceService {
  constructor(/* Add @inject to inject parameters */

    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(ProductCategoriesRepository)
    public productCategoriesRepository: ProductCategoriesRepository,
    @repository(ProductImagesRepository)
    public productImagesRepository: ProductImagesRepository,

  ) { }

  /*
   * Add service methods here
   */

  /**
     * Parses a date string in dd/mm/yyyy format to a Date object
     * @param dateString - Date string in dd/mm/yyyy format
     * @returns Date object
     */
  public parseDateString(dateString: string): Date {
    const parts = dateString.split('/');
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${dateString}. Expected dd/mm/yyyy`);
    }
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  /**
   * Validates if a discount is currently active based on start and end dates
   * @param discountStartDate - Start date of the discount (optional)
   * @param discountEndDate - End date of the discount (optional)
   * @returns true if discount is active, false otherwise
   */
  public isDiscountActive(discountStartDate?: string, discountEndDate?: string): boolean {
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
  }

  /**
   * Determines pricing information for a cart item based on product or variation
   * @param product - The product object
   * @param productVariation - The product variation object (optional)
   * @param hasVariation - Whether the cart item has a variation
   * @returns Object with price, discountedPrice, and discountEnable
   */
  public getPricingInfo(product: any, productVariation: any, hasVariation: boolean) {
    let price: number | undefined;
    let discountedPrice: number | undefined;
    let discountEnable = false;

    if (hasVariation && productVariation) {
      // Use price and discountedPrice from product variation
      price = productVariation.price;
      discountedPrice = productVariation.discountedPrice;
      discountEnable = this.isDiscountActive(productVariation.discountStartDate, productVariation.discountEndDate) &&
        discountedPrice !== undefined && discountedPrice > 0 && discountedPrice < price!;
    } else if (product) {
      // Use price and discountedPrice from product
      price = product.price;
      discountedPrice = product.discountedPrice;
      discountEnable = this.isDiscountActive(product.discountStartDate, product.discountEndDate) &&
        discountedPrice !== undefined && discountedPrice > 0 && discountedPrice < price!;
    }

    return {price, discountedPrice, discountEnable};
  }

  public normalizePricing(price?: number, discountedPrice?: number, discountEnable?: boolean) {
    const originalPrice = price;
    const finalPrice = discountEnable && discountedPrice !== undefined
      ? discountedPrice
      : price;

    return {
      originalPrice,
      finalPrice,
      discountedPrice: discountEnable ? discountedPrice : undefined,
      discountEnable: Boolean(discountEnable),
    };
  }

  public async findById(id: number) {
    const product = await this.productRepository.findById(id);//, filter
    // Load category ids
    const productCategories = await this.productCategoriesRepository.find({where: {productId: id}});
    product.categories = productCategories.map(pc => pc.categoryId);
    // Load attachment ids
    const productImages = await this.productImagesRepository.find({where: {productId: id}});
    product.attachments = productImages.map(pi => pi.attachmentId);
    // Load attributes
    product.attributes = await this.productRepository.attributes(id).find();
    // Load variations
    product.variations = await this.productRepository.variations(id).find();

    // Compute AttachmentId from ProductImages with lowest order and enabled=true
    const enabledImages = productImages.filter(pi => pi.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (enabledImages.length > 0) {
      (product as any).AttachmentId = enabledImages[0].attachmentId;

    }
    return product;
  }


  public getPricingVariation(productVariation: any) {
    let price: number | undefined;
    let discountedPrice: number | undefined;
    let discountEnable = false;
    // Use price and discountedPrice from product variation
    price = productVariation.price;
    discountedPrice = productVariation.discountedPrice;
    discountEnable = this.isDiscountActive(productVariation.discountStartDate, productVariation.discountEndDate) &&
      discountedPrice !== undefined && discountedPrice > 0 && discountedPrice < price!;
    return {price, discountedPrice, discountEnable};
  }



  public async productVariationDto(productVariation: any) {
    let productVariationDto: any = undefined;

    const {price, discountedPrice, discountEnable} = this.getPricingVariation(productVariation);
    const normalizedPricing = this.normalizePricing(price, discountedPrice, discountEnable);

    if (productVariation) {
      productVariationDto = {
        id: productVariation.id,
        combination: productVariation.combination,
        stock: productVariation.stock,
        price: price,
        originalPrice: normalizedPricing.originalPrice,
        finalPrice: normalizedPricing.finalPrice,
        discountedPrice: normalizedPricing.discountedPrice,
        discountStartDate: productVariation.discountStartDate,
        discountEndDate: productVariation.discountEndDate,
        sku: productVariation.sku,
        discountScheduled: productVariation.discountScheduled,
        discountEnable: normalizedPricing.discountEnable,
      };
    }
    return productVariationDto;
  }


  public async prtoductDto(product: any) {

    let productDto: ProductDto | undefined = undefined;

    if (product) {
      // Compute AttachmentId from ProductImages with lowest order and enabled=true
      const productImages = await this.productImagesRepository.find({
        where: {productId: product.id},
      });
      const enabledImages = productImages.filter(pi => pi.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
      const attachmentId = enabledImages.length > 0 ? enabledImages[0].attachmentId : 0;

      let productVariationsDto: any[] = [];
      if (product.variations && product.variations.length > 0) {
        for (const variation of product.variations) {
          const variationDto = await this.productVariationDto(variation);
          if (variationDto) {
            productVariationsDto.push(variationDto);
          }
        }
      }
      //product.variations = productVariationsDto;


      // Obtener valor del prodcuto
      const {price, discountedPrice, discountEnable} = this.getPricingInfo(product, undefined, false);
      const normalizedPricing = this.normalizePricing(price, discountedPrice, discountEnable);
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
        price: price!,
        originalPrice: normalizedPricing.originalPrice,
        finalPrice: normalizedPricing.finalPrice,
        discountedPrice: normalizedPricing.discountedPrice,
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
        variations: productVariationsDto,
        attachmentId: attachmentId,
        discountEnable: normalizedPricing.discountEnable,
      };
    }
    return productDto;

  }

  public async findByIdDto(id: number) {
    const product = await this.productRepository.findById(id);//, filter
    // Load category ids
    const productCategories = await this.productCategoriesRepository.find({where: {productId: id}});
    product.categories = productCategories.map(pc => pc.categoryId);
    // Load attachment ids
    const productImages = await this.productImagesRepository.find({where: {productId: id}});
    product.attachments = productImages.map(pi => pi.attachmentId);
    // Load attributes
    product.attributes = await this.productRepository.attributes(id).find();
    // Load variations
    product.variations = await this.productRepository.variations(id).find();

    // Compute AttachmentId from ProductImages with lowest order and enabled=true
    const enabledImages = productImages.filter(pi => pi.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (enabledImages.length > 0) {
      (product as any).AttachmentId = enabledImages[0].attachmentId;

    }
    return this.prtoductDto(product);
  }

}
