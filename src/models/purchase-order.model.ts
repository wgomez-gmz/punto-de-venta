import {belongsTo, hasMany, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {PurchaseOrderHistory} from './purchase-order-history.model';
import {PurchaseOrderItem} from './purchase-order-item.model';
import {PurchaseOrderResponse} from './purchase-order-response.model';
import {PurchaseOrderStatus} from './purchase-order-status.model';
import {Users} from './users.model';

@model()
export class PurchaseOrder extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @belongsTo(() => PurchaseOrderStatus)
  currentStatusId: number;

  @hasMany(() => PurchaseOrderHistory)
  purchaseOrderHistory: PurchaseOrderHistory[];

  @hasMany(() => PurchaseOrderItem)
  purchaseOrderItems: PurchaseOrderItem[];

  @hasMany(() => PurchaseOrderResponse)
  purchaseOrderResponses: PurchaseOrderResponse[];

  @belongsTo(() => Users)
  usersId: number;

  @property({
    type: 'number',
    required: true,
  })
  total: number;

  @property({
    type: 'number',
  })
  subtotal?: number;

  @property({
    type: 'number',
    default: 0,
  })
  discountTotal?: number;

  @property({
    type: 'string',
  })
  couponCode?: string;

  @property({
    type: 'object',
  })
  couponSnapshot?: any;

  @property({
    type: 'object',
    required: true,
  })
  paymentMethodSnapshot: any;

  constructor(data?: Partial<PurchaseOrder>) {
    super(data);
  }
}

export interface PurchaseOrderRelations {
  currentStatus?: PurchaseOrderStatus;
  purchaseOrderHistory?: PurchaseOrderHistory[];
  purchaseOrderItems?: PurchaseOrderItem[];
  purchaseOrderResponses?: PurchaseOrderResponse[];
  users?: Users;
}

export type PurchaseOrderWithRelations = PurchaseOrder & PurchaseOrderRelations;
