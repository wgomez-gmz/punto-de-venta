import {belongsTo, hasMany, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {CartItem} from './cart-item.model';
import {Users} from './users.model';

@model()
export class Cart extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @hasMany(() => CartItem)
  cartItems: CartItem[];

  @belongsTo(() => Users)
  usersId: number;

  constructor(data?: Partial<Cart>) {
    super(data);
  }
}

export interface CartRelations {
  users?: Users;
  cartItems?: CartItem[];
}

export type CartWithRelations = Cart & CartRelations;
