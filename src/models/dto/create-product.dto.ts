import {model, property} from '@loopback/repository';

@model()
export class CreateProductDto {
  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

  @property({
    type: 'number',
  })
  discountedPrice?: number;

  @property({
    type: 'string',
  })
  discountStartDate?: string;

  @property({
    type: 'string',
  })
  discountEndDate?: string;

  @property({
    type: 'string',
  })
  sku?: string;

  @property({
    type: 'string',
  })
  gtin?: string;

  @property({
    type: 'boolean',
  })
  discountScheduled?: boolean;

  @property({
    type: 'array',
    itemType: 'number',
    required: true,
  })
  categories: number[];

  @property({
    type: 'number',
    required: true,
  })
  stock: number;

  @property({
    type: 'boolean',
  })
  isVirtual?: boolean;

  @property({
    type: 'string',
  })
  shortDescription?: string;

  @property({
    type: 'string',
  })
  completeDescription?: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  attributes?: Array<{
    id?: number;
    name: string;
    value: string;
    visible: boolean;
    usedInVariations: boolean;
  }>;

  @property({
    type: 'array',
    itemType: 'object',
  })
  variations?: Array<{
    id?: number;
    combination: string;
    stock: number;
    price: number;
    discountedPrice?: number;
    discountStartDate?: string;
    discountEndDate?: string;
    sku?: string;
    discountScheduled?: boolean;
  }>;

  @property({
    type: 'array',
    itemType: 'string',
  })
  images?: string[];
}
