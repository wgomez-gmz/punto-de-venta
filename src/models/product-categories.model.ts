import {model, property} from '@loopback/repository';
import {BaseEntity} from './base-entity.model';

/**
 * ProductCategories model representing the many-to-many relationship between products and categories
 */
@model()
export class ProductCategories extends BaseEntity {
  /**
   * Product ID
   */
  @property({
    type: 'number',
    required: true,
  })
  productId: number;

  /**
   * Category ID
   */
  @property({
    type: 'number',
    required: true,
  })
  categoryId: number;

  constructor(data?: Partial<ProductCategories>) {
    super(data);
  }
}

export interface ProductCategoriesRelations {
  product?: any;
  category?: any;
}

export type ProductCategoriesWithRelations = ProductCategories & ProductCategoriesRelations;
