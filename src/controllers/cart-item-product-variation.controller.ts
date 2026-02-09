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
  ProductVariation,
} from '../models';
import {CartItemRepository} from '../repositories';

export class CartItemProductVariationController {
  constructor(
    @repository(CartItemRepository)
    public cartItemRepository: CartItemRepository,
  ) { }

  @get('/cart-items/{id}/product-variation', {
    responses: {
      '200': {
        description: 'ProductVariation belonging to CartItem',
        content: {
          'application/json': {
            schema: getModelSchemaRef(ProductVariation),
          },
        },
      },
    },
  })
  async getProductVariation(
    @param.path.number('id') id: typeof CartItem.prototype.id,
  ): Promise<ProductVariation> {
    return this.cartItemRepository.productVariation(id);
  }
}
