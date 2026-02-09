import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {Cart} from '../models';
import {CartItemDto, CartResponseDto} from '../models/dto/cart.dto';
import {CartItemRepository, CartRepository} from '../repositories';
import {ProductImagesRepository} from '../repositories/product-images.repository';
import {CartServiceService} from '../services';

export class CartControllerController {
  constructor(
    @repository(CartRepository)
    public cartRepository: CartRepository,
    @repository(CartItemRepository)
    public cartItemRepository: CartItemRepository,
    @repository(ProductImagesRepository)
    public productImagesRepository: ProductImagesRepository,
    @service() public cartServiceService: CartServiceService,
  ) { }



  @post('/carts')
  @response(200, {
    description: 'Cart model instance',
    content: {'application/json': {schema: getModelSchemaRef(Cart)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cart, {
            title: 'NewCart',
            exclude: ['id', 'creationDate'],
          }),
        },
      },
    })
    cart: Omit<Cart, 'id'>,
  ): Promise<Cart> {
    return this.cartRepository.create(cart);
  }

  @get('/carts/count')
  @response(200, {
    description: 'Cart model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Cart) where?: Where<Cart>,
  ): Promise<Count> {
    return this.cartRepository.count(where);
  }

  @get('/carts')
  @response(200, {
    description: 'Array of Cart model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Cart, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Cart) filter?: Filter<Cart>,
  ): Promise<Cart[]> {
    return this.cartRepository.find(filter);
  }

  @patch('/carts')
  @response(200, {
    description: 'Cart PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cart, {partial: true}),
        },
      },
    })
    cart: Cart,
    @param.where(Cart) where?: Where<Cart>,
  ): Promise<Count> {
    return this.cartRepository.updateAll(cart, where);
  }

  @get('/carts/{id}')
  @response(200, {
    description: 'Cart model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Cart, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Cart, {exclude: 'where'}) filter?: FilterExcludingWhere<Cart>
  ): Promise<Cart> {
    return this.cartRepository.findById(id, filter);
  }

  @patch('/carts/{id}')
  @response(204, {
    description: 'Cart PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cart, {partial: true, exclude: ['creationDate']}),
        },
      },
    })
    cart: Cart,
  ): Promise<void> {
    await this.cartRepository.updateById(id, cart);
  }

  @put('/carts/{id}')
  @response(204, {
    description: 'Cart PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Cart, {
            exclude: ['creationDate'],
          }),
        },
      },
    })
    cart: Omit<Cart, 'creationDate'>,
  ): Promise<void> {
    await this.cartRepository.replaceById(id, cart);
  }

  @del('/carts/{id}')
  @response(204, {
    description: 'Cart DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.cartRepository.deleteById(id);
  }

  @get('/cart')
  @authenticate('jwt')
  @response(200, {
    description: 'Current user cart with details',
    content: {'application/json': {schema: getModelSchemaRef(CartResponseDto)}},
  })
  async getCurrentUserCart(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<CartResponseDto> {
    return this.cartServiceService.getCurrentUserCart(currentUserProfile);
  }

  @patch('/carts/{cartId}/items')
  @authenticate('jwt')
  @response(200, {
    description: 'Cart item quantity updated',
    content: {'application/json': {schema: getModelSchemaRef(CartItemDto)}},
  })
  async updateCartItemQuantity(
    @param.path.number('cartId') cartId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              productId: {type: 'number'},
              productVariationId: {type: 'number', nullable: true},
              quantity: {type: 'number', minimum: 1},
            },
            required: ['productId', 'quantity'],
          },
        },
      },
    })
    data: {productId: number; productVariationId?: number; quantity: number},
  ): Promise<CartItemDto> {

    return this.cartServiceService.updateCartItemQuantity(data.productId, data.productVariationId, data.quantity, cartId);

  }

  @del('/carts/{cartId}/cart-items/{cartItemId}')
  @authenticate('jwt')
  @response(204, {
    description: 'Cart item deleted successfully',
  })
  async deleteCartItem(
    @param.path.number('cartId') cartId: number,
    @param.path.number('cartItemId') cartItemId: number,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<void> {
    // Verify the cart belongs to the current user
    const cart = await this.cartRepository.findOne({
      where: {id: cartId, usersId: currentUserProfile.id}
    });

    if (!cart) {
      throw new HttpErrors.NotFound('Cart not found or does not belong to user');
    }

    // Verify the cart item exists and belongs to the cart
    const cartItem = await this.cartItemRepository.findOne({
      where: {id: cartItemId, cartId: cartId}
    });

    if (!cartItem) {
      throw new HttpErrors.NotFound('Cart item not found');
    }

    await this.cartItemRepository.deleteById(cartItemId);
  }
}
