import {model, property} from '@loopback/repository';
import {BaseEntity} from '.';

@model()
export class PurchaseOrderStatus extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  key: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'number',
    required: true,
    default: 0,
  })
  order: number;

  @property({
    type: 'boolean',
    required: true,
    default: true,
  })
  isActive: boolean;

  constructor(data?: Partial<PurchaseOrderStatus>) {
    super(data);
  }
}

export interface PurchaseOrderStatusRelations {
  // describe navigational properties here
}

export type PurchaseOrderStatusWithRelations = PurchaseOrderStatus & PurchaseOrderStatusRelations;
