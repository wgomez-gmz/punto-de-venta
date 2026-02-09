import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {Users} from './users.model';

@model()
export class PurchaseOrderHistory extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  purchaseOrderId: number;

  @property({
    type: 'number',
  })
  previousStatusId?: number;

  @property({
    type: 'number',
  })
  newStatusId: number;

  @belongsTo(() => Users)
  userId: number;

  constructor(data?: Partial<PurchaseOrderHistory>) {
    super(data);
  }
}

export interface PurchaseOrderHistoryRelations {
  user?: Users;
}

export type PurchaseOrderHistoryWithRelations = PurchaseOrderHistory & PurchaseOrderHistoryRelations;
