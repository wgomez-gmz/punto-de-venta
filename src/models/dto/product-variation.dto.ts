import {model, property} from '@loopback/repository';

@model()
export class ProductVariationDto {
  @property({
    type: 'number',
  })
  id?: number;

  /**
   * Product ID this variation belongs to
   */
  @property({
    type: 'number',
    required: true,
  })
  productId: number;

  /**
   * Combination string describing the variation (e.g., "Color: Azul")
   */
  @property({
    type: 'string',
    required: true,
  })
  combination: string;

  /**
   * Stock quantity for this variation
   */
  @property({
    type: 'number',
    required: true,
  })
  stock: number;

  /**
   * Price for this variation
   */
  @property({
    type: 'number',
    required: true,
  })
  price: number;

  /**
   * Discounted price for this variation
   */
  @property({
    type: 'number',
  })
  discountedPrice?: number;

  /**
   * Start date for the discount
   */
  @property({
    type: 'string',
  })
  discountStartDate?: string;

  /**
   * End date for the discount
   */
  @property({
    type: 'string',
  })
  discountEndDate?: string;

  /**
   * SKU for this variation
   */
  @property({
    type: 'string',
  })
  sku?: string;

  /**
   * Whether the discount is scheduled for this variation
   */
  @property({
    type: 'boolean',
  })
  discountScheduled?: boolean;

  @property({
    type: 'boolean',
  })
  discountEnable?: boolean;




}
