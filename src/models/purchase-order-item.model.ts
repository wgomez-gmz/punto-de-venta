import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {PurchaseOrder} from './purchase-order.model';

@model()
export class PurchaseOrderItem extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @belongsTo(() => PurchaseOrder)
  purchaseOrderId: number;

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
    type: 'number',
    required: true,
  })
  quantity: number;

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
    type: 'object',
    required: true,
  })
  productSnapshot: any;

  @property({
    type: 'object',
  })
  productVariationSnapshot?: any;

  constructor(data?: Partial<PurchaseOrderItem>) {
    super(data);
  }
}

export interface PurchaseOrderItemRelations {
  // describe navigational properties here
}

export type PurchaseOrderItemWithRelations = PurchaseOrderItem & PurchaseOrderItemRelations;
