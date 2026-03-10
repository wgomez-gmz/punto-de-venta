import {model, property} from '@loopback/repository';
import {BaseEntity} from '.';

@model()
export class Coupon extends BaseEntity {
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
  code: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'string',
    required: true,
    default: 'percent',
  })
  discountType: string;

  @property({
    type: 'number',
    required: true,
  })
  discountValue: number;

  @property({
    type: 'number',
    default: 0,
  })
  minimumOrderAmount?: number;

  @property({
    type: 'number',
  })
  maxDiscountAmount?: number;

  @property({
    type: 'date',
  })
  startDate?: string;

  @property({
    type: 'date',
  })
  endDate?: string;

  @property({
    type: 'number',
  })
  usageLimit?: number;

  @property({
    type: 'number',
    default: 0,
  })
  usageCount?: number;

  @property({
    type: 'number',
    default: 1,
  })
  perUserLimit?: number;

  @property({
    type: 'boolean',
    default: true,
  })
  isActive?: boolean;

  constructor(data?: Partial<Coupon>) {
    super(data);
  }
}

export interface CouponRelations {}

export type CouponWithRelations = Coupon & CouponRelations;
