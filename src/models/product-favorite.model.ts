import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {Product} from './product.model';
import {Users} from './users.model';

@model()
export class ProductFavorite extends BaseEntity {
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

  constructor(data?: Partial<ProductFavorite>) {
    super(data);
  }
}

export interface ProductFavoriteRelations {}

export type ProductFavoriteWithRelations = ProductFavorite & ProductFavoriteRelations;
