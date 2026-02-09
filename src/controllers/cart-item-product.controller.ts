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
  Product,
} from '../models';
import {CartItemRepository} from '../repositories';

export class CartItemProductController {
  constructor(
    @repository(CartItemRepository)
    public cartItemRepository: CartItemRepository,
  ) { }

  @get('/cart-items/{id}/product', {
    responses: {
      '200': {
        description: 'Product belonging to CartItem',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Product),
          },
        },
      },
    },
  })
  async getProduct(
    @param.path.number('id') id: typeof CartItem.prototype.id,
  ): Promise<Product> {
    return this.cartItemRepository.product(id);
  }
}
