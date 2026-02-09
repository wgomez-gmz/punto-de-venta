import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {PurchaseOrder} from './purchase-order.model';

@model()
export class PurchaseOrderResponse extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @belongsTo(() => PurchaseOrder)
  purchaseOrderId: number;

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

  constructor(data?: Partial<PurchaseOrderResponse>) {
    super(data);
  }
}

export interface PurchaseOrderResponseRelations {
  // describe navigational properties here
}

export type PurchaseOrderResponseWithRelations = PurchaseOrderResponse & PurchaseOrderResponseRelations;
