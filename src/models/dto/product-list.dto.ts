import {model, property} from '@loopback/repository';

@model()
export class ProductDto {
  @property({
    type: 'number',
  })
  id?: number;

  @property({
    type: 'string',
  })
  creationDate?: string;

  @property({
    type: 'string',
  })
  updateDate?: string;

  @property({
    type: 'number',
  })
  status?: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
  })
  shortDescription?: string;

  @property({
    type: 'string',
  })
  completeDescription?: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'string',
  })
  barcode?: string;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

  @property({
    type: 'number',
  })
  originalPrice?: number;

  @property({
    type: 'number',
  })
  finalPrice?: number;

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
    type: 'number',
  })
  cost?: number;

  @property({
    type: 'number',
    required: true,
  })
  stock: number;

  @property({
    type: 'number',
  })
  minStock?: number;

  @property({
    type: 'boolean',
  })
  isVirtual?: boolean;

  @property({
    type: 'array',
    itemType: 'object',
  })
  categories?: any[];

  @property({
    type: 'array',
    itemType: 'object',
  })
  attachments?: any[];

  @property({
    type: 'array',
    itemType: 'object',
  })
  attributes?: any[];

  @property({
    type: 'array',
    itemType: 'object',
  })
  variations?: any[];

  @property({
    type: 'number',
  })
  attachmentId?: number;


  @property({
    type: 'boolean',
  })
  discountEnable?: boolean;


}
