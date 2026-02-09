import {hasMany, model, property} from '@loopback/repository';
import {Attachment} from './attachment.model';
import {BaseEntity} from './base-entity.model';
import {Category} from './category.model';
import {ProductAttribute} from './product-attribute.model';
import {ProductCategories} from './product-categories.model';
import {ProductImages} from './product-images.model';
import {ProductVariation} from './product-variation.model';

/**
 * Product model representing items for sale
 */
@model()
export class Product extends BaseEntity {
  /**
   * Unique identifier for the product
   */
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  /**
   * Name of the product
   */
  @property({
    type: 'string',
    required: true,
  })
  name: string;

  /**
   * Short description of the product
   */
  @property({
    type: 'string',
    mysql: {
      dataType: 'LONGTEXT',
    },
  })
  shortDescription?: string;

  /**
   * Complete description of the product
   */
  @property({
    type: 'string',
    mysql: {
      dataType: 'LONGTEXT',
    },
  })
  completeDescription?: string;

  /**
   * Description of the product
   */
  @property({
    type: 'string',
  })
  description?: string;

  /**
   * Barcode for product identification
   */
  @property({
    type: 'string',
  })
  barcode?: string;

  /**
    * Selling price of the product
    */
  @property({
    type: 'number',
    required: true,
  })
  price: number;

  /**
   * Discounted price of the product
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
   * SKU (Stock Keeping Unit) of the product
   */
  @property({
    type: 'string',
  })
  sku?: string;

  /**
   * GTIN (Global Trade Item Number) of the product
   */
  @property({
    type: 'string',
  })
  gtin?: string;

  /**
   * Whether the discount is scheduled
   */
  @property({
    type: 'boolean',
  })
  discountScheduled?: boolean;

  /**
   * Cost price of the product
   */
  @property({
    type: 'number',
  })
  cost?: number;

  /**
   * Current stock quantity
   */
  @property({
    type: 'number',
    required: true,
  })
  stock: number;

  /**
     * Minimum stock level before reorder
     */
  @property({
    type: 'number',
  })
  minStock?: number;

  /**
   * Whether the product is virtual (digital/downloadable)
   */
  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  isVirtual: boolean;

  /**
   * Categories associated with this product through ProductCategories
   */
  @hasMany(() => Category, {through: {model: () => ProductCategories, keyFrom: 'productId', keyTo: 'categoryId'}})
  categories: Category[];

  /**
    * Attachments associated with this product through ProductImages
    */
  @hasMany(() => Attachment, {through: {model: () => ProductImages, keyFrom: 'productId', keyTo: 'attachmentId'}})
  attachments: Attachment[];

  /**
    * Attributes associated with this product
    */
  @hasMany(() => ProductAttribute, {keyTo: 'productId'})
  attributes: ProductAttribute[];

  /**
   * Variations associated with this product
   */
  @hasMany(() => ProductVariation, {keyTo: 'productId'})
  variations: ProductVariation[];

  constructor(data?: Partial<Product>) {
    super(data);
  }
}

export interface ProductRelations {
  categories?: any;
  attachments?: any;
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
}

export type ProductWithRelations = Product & ProductRelations;
