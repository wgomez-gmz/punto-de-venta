import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  CartItem,
  Cart,
} from '../models';
import {CartItemRepository} from '../repositories';

export class CartItemCartController {
  constructor(
    @repository(CartItemRepository)
    public cartItemRepository: CartItemRepository,
  ) { }

  @get('/cart-items/{id}/cart', {
    responses: {
      '200': {
        description: 'Cart belonging to CartItem',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Cart),
          },
        },
      },
    },
  })
  async getCart(
    @param.path.number('id') id: typeof CartItem.prototype.id,
  ): Promise<Cart> {
    return this.cartItemRepository.cart(id);
  }
}
