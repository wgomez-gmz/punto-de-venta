import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {Coupon} from './coupon.model';
import {PurchaseOrder} from './purchase-order.model';
import {Users} from './users.model';

@model()
export class CouponUsage extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @belongsTo(() => Coupon)
  couponId: number;

  @belongsTo(() => Users)
  usersId: number;

  @belongsTo(() => PurchaseOrder)
  purchaseOrderId: number;

  @property({
    type: 'number',
    required: true,
  })
  discountAmount: number;

  constructor(data?: Partial<CouponUsage>) {
    super(data);
  }
}

export interface CouponUsageRelations {}

export type CouponUsageWithRelations = CouponUsage & CouponUsageRelations;
