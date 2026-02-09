import {model, property} from '@loopback/repository';
import {ProductDto} from './product-list.dto';

@model()
export class CartItemDto {
  @property({
    type: 'number',
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  quantity: number;

  @property({
    type: 'boolean',
    required: true,
    default: true,
  })
  enable: boolean;

  @property({
    type: 'number',
  })
  cartId: number;

  @property({
    type: 'number',
    required: true,
  })
  productId: number;

  @property({
    type: 'number',
  })
  productVariationId?: number;

  @property({
    type: 'string',
  })
  creationDate?: string;

  @property({
    type: ProductDto,
  })
  product?: ProductDto;

  @property({
    type: 'object',
  })
  productVariation?: any;

  @property({
    type: 'number',
  })
  price?: number;

  @property({
    type: 'number',
  })
  discountedPrice?: number;

  @property({
    type: 'boolean',
  })
  discountEnable?: boolean;
}

@model()
export class CartDto {
  @property({
    type: 'number',
  })
  id?: number;

  @property({
    type: 'number',
  })
  usersId: number;

  @property({
    type: 'string',
  })
  creationDate?: string;

  @property({
    type: 'array',
    itemType: CartItemDto,
  })
  cartItems?: CartItemDto[];
}

@model()
export class CartResponseDto {
  @property({
    type: 'object',
  })
  user: any;

  @property({
    type: CartDto,
  })
  cart?: CartDto;
}
