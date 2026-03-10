import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {Product} from './product.model';
import {Users} from './users.model';

@model()
export class ProductViewHistory extends BaseEntity {
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
    type: 'date',
    required: true,
    default: () => new Date().toISOString(),
  })
  lastViewedAt: string;

  constructor(data?: Partial<ProductViewHistory>) {
    super(data);
  }
}

export interface ProductViewHistoryRelations {}

export type ProductViewHistoryWithRelations = ProductViewHistory & ProductViewHistoryRelations;
