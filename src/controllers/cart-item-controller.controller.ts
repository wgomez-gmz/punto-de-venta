import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
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
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {CartItem} from '../models';
import {CartItemRepository, CartRepository, ProductRepository, ProductVariationRepository} from '../repositories';

export class CartItemControllerController {
  constructor(
    @repository(CartItemRepository)
    public cartItemRepository: CartItemRepository,
    @repository(CartRepository)
    public cartRepository: CartRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(ProductVariationRepository)
    public productVariationRepository: ProductVariationRepository,
  ) { }

  @post('/cart-items')
  @response(200, {
    description: 'CartItem model instance',
    content: {'application/json': {schema: getModelSchemaRef(CartItem)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CartItem, {
            title: 'NewCartItem',
            exclude: ['id', 'creationDate'],
          }),
        },
      },
    })
    cartItem: Omit<CartItem, 'id'>,
  ): Promise<CartItem> {
    return this.cartItemRepository.create(cartItem);
  }

  @post('/cart-items/add')
  @authenticate('jwt')
  @response(200, {
    description: 'CartItem added or updated',
    content: {'application/json': {schema: getModelSchemaRef(CartItem)}},
  })
  async addCartItem(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              productId: {type: 'number'},
              productVariationId: {type: 'number'},
            },
            required: ['productId'],
          },
        },
      },
    })
    data: {productId: number; productVariationId?: number},
  ): Promise<CartItem> {
    const userId = currentUserProfile.id;

    // Check if user has a cart
    let cart = await this.cartRepository.findOne({where: {usersId: userId}});

    if (!cart) {
      // Create a new cart
      cart = await this.cartRepository.create({usersId: userId});
    }

    // Check if cart item already exists
    const whereClause: any = {
      cartId: cart.id,
      productId: data.productId,
    };
    if (data.productVariationId !== undefined) {
      whereClause.productVariationId = data.productVariationId;
    } else {
      whereClause.productVariationId = null;
    }
    const existingCartItem = await this.cartItemRepository.findOne({
      where: whereClause,
    });

    if (existingCartItem) {
      // Update quantity
      existingCartItem.quantity += 1;
      await this.cartItemRepository.updateById(existingCartItem.id!, existingCartItem);
      return existingCartItem;
    } else {
      // Create new cart item
      const cartItemData: any = {
        cartId: cart.id,
        productId: data.productId,
        quantity: 1,
      };
      if (data.productVariationId !== undefined) {
        cartItemData.productVariationId = data.productVariationId;
      }
      const newCartItem = await this.cartItemRepository.create(cartItemData);
      return newCartItem;
    }
  }

  @get('/cart-items/count')
  @response(200, {
    description: 'CartItem model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(CartItem) where?: Where<CartItem>,
  ): Promise<Count> {
    return this.cartItemRepository.count(where);
  }

  @get('/cart-items')
  @response(200, {
    description: 'Array of CartItem model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CartItem, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(CartItem) filter?: Filter<CartItem>,
  ): Promise<CartItem[]> {
    return this.cartItemRepository.find(filter);
  }

  @patch('/cart-items')
  @response(200, {
    description: 'CartItem PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CartItem, {partial: true}),
        },
      },
    })
    cartItem: CartItem,
    @param.where(CartItem) where?: Where<CartItem>,
  ): Promise<Count> {
    return this.cartItemRepository.updateAll(cartItem, where);
  }

  @get('/cart-items/{id}')
  @response(200, {
    description: 'CartItem model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CartItem, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(CartItem, {exclude: 'where'}) filter?: FilterExcludingWhere<CartItem>
  ): Promise<CartItem> {
    return this.cartItemRepository.findById(id, filter);
  }

  @patch('/cart-items/{id}')
  @response(204, {
    description: 'CartItem PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CartItem, {partial: true, exclude: ['creationDate']}),
        },
      },
    })
    cartItem: CartItem,
  ): Promise<void> {
    await this.cartItemRepository.updateById(id, cartItem);
  }

  @put('/cart-items/{id}')
  @response(204, {
    description: 'CartItem PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CartItem, {
            exclude: ['creationDate'],
          }),
        },
      },
    })
    cartItem: Omit<CartItem, 'creationDate'>,
  ): Promise<void> {
    await this.cartItemRepository.replaceById(id, cartItem);
  }

  @del('/cart-items/{id}')
  @response(204, {
    description: 'CartItem DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.cartItemRepository.deleteById(id);
  }
}
