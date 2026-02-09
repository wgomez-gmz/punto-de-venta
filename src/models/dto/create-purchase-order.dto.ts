import {model, property} from '@loopback/repository';

@model()
export class FormResponseDto {
  @property({
    type: 'object',
    required: true,
  })
  pregunta: any;

  @property({
    type: 'any',
    required: true,
  })
  respuesta: any;

  @property({
    type: 'number',
    required: true,
  })
  formularioId: number;
}

@model()
export class CartItemDto {
  @property({
    type: 'number',
    required: true,
  })
  id: number;

  @property({
    type: 'number',
    required: true,
  })
  quantity: number;

  @property({
    type: 'boolean',
    required: true,
  })
  enable: boolean;

  @property({
    type: 'number',
    required: true,
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
    required: true,
  })
  creationDate: string;

  @property({
    type: 'object',
    required: true,
  })
  product: any;

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
export class CreatePurchaseOrderDto {
  @property({
    type: 'array',
    itemType: 'object',
    required: true,
  })
  formResponses: FormResponseDto[];

  @property({
    type: 'array',
    itemType: 'object',
    required: true,
  })
  cartItems: CartItemDto[];

  @property({
    type: 'number',
    required: true,
  })
  total: number;

  @property({
    type: 'object',
    required: true,
  })
  paymentMethod: any;
}
