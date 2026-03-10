import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {Product} from './product.model';
import {Users} from './users.model';

@model()
export class ProductReview extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @belongsTo(() => Product)
  productId: number;

  @belongsTo(() => Users)
  usersId: number;

  @property({
    type: 'number',
    required: true,
  })
  rating: number;

  @property({
    type: 'string',
  })
  title?: string;

  @property({
    type: 'string',
    required: true,
  })
  comment: string;

  @property({
    type: 'boolean',
    default: false,
  })
  verifiedPurchase?: boolean;

  constructor(data?: Partial<ProductReview>) {
    super(data);
  }
}

export interface ProductReviewRelations {}

export type ProductReviewWithRelations = ProductReview & ProductReviewRelations;
