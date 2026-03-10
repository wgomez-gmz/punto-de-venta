import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {Product} from './product.model';
import {Users} from './users.model';

@model()
export class ProductQuestion extends BaseEntity {
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
    type: 'string',
    required: true,
  })
  question: string;

  @property({
    type: 'string',
  })
  answer?: string;

  @property({
    type: 'number',
  })
  answeredByUserId?: number;

  @property({
    type: 'date',
  })
  answeredAt?: string;

  @property({
    type: 'boolean',
    default: true,
  })
  isPublished?: boolean;

  constructor(data?: Partial<ProductQuestion>) {
    super(data);
  }
}

export interface ProductQuestionRelations {}

export type ProductQuestionWithRelations = ProductQuestion & ProductQuestionRelations;
