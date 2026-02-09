import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity, Product, ProductVariation} from '.';
import {Cart} from './cart.model';

@model()
export class CartItem extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  quantity: number;

  /**
   * Whether this cart item is enabled/active
   */
  @property({
    type: 'boolean',
    required: true,
    default: true,
  })
  enable: boolean;

  @belongsTo(() => Cart)
  cartId: number;

  @belongsTo(() => Product)
  productId: number;

  @belongsTo(() => ProductVariation)
  productVariationId: number;
  /*@belongsTo(() => Cart)
  cartId: number;

  @belongsTo(() => Product)
  productId: number;

  @belongsTo(() => ProductVariation)
  productVariationId?: number;*/

  constructor(data?: Partial<CartItem>) {
    super(data);
  }
}

export interface CartItemRelations {
  /*cart?: Cart;
  product?: Product;
  productVariation?: ProductVariation;*/
}

export type CartItemWithRelations = CartItem & CartItemRelations;
