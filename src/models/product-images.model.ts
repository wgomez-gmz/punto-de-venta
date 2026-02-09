import {belongsTo, model, property} from '@loopback/repository';
import {Attachment} from './attachment.model';
import {BaseEntity} from './base-entity.model';
import {Product} from './product.model';

/**
 * ProductImages model representing the many-to-many relationship between products and attachments
 */
@model()
export class ProductImages extends BaseEntity {
  /**
   * Product ID
   */
  @property({
    type: 'number',
    required: true,
  })
  productId: number;

  /**
   * Attachment ID
   */
  @property({
    type: 'number',
    required: true,
  })
  attachmentId: number;

  @belongsTo(() => Product)
  product: Product;

  @belongsTo(() => Attachment)
  attachment: Attachment;

  /**
   * Indicates if this is the main image for the product
   */
  @property({
    type: 'boolean',
    default: false,
  })
  isMain?: boolean;

  /**
   * Order of the image for sorting
   */
  @property({
    type: 'number',
    default: 0,
  })
  order?: number;

  /**
   * Indicates if the image is enabled
   */
  @property({
    type: 'boolean',
    default: true,
  })
  enabled?: boolean;

  constructor(data?: Partial<ProductImages>) {
    super(data);
  }
}

export interface ProductImagesRelations {
  product?: any;
  attachment?: any;
}

export type ProductImagesWithRelations = ProductImages & ProductImagesRelations;
