import {model, property} from '@loopback/repository';
import {BaseEntity} from './base-entity.model';

/**
 * ProductAttribute model representing attributes for products
 */
@model()
export class ProductAttribute extends BaseEntity {
  /**
   * Unique identifier for the product attribute
   */
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  /**
   * Product ID this attribute belongs to
   */
  @property({
    type: 'number',
    required: true,
  })
  productId: number;

  /**
   * Name of the attribute
   */
  @property({
    type: 'string',
    required: true,
  })
  name: string;

  /**
   * Value of the attribute
   */
  @property({
    type: 'string',
    required: true,
  })
  value: string;

  /**
   * Whether the attribute is visible on the product page
   */
  @property({
    type: 'boolean',
    required: true,
    default: true,
  })
  visible: boolean;

  /**
   * Whether the attribute is used for variations
   */
  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  usedInVariations: boolean;

  constructor(data?: Partial<ProductAttribute>) {
    super(data);
  }
}

export interface ProductAttributeRelations {
  // define navigational properties here
}

export type ProductAttributeWithRelations = ProductAttribute & ProductAttributeRelations;
