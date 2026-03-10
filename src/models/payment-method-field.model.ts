import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from './base-entity.model';
import {PaymentMethod} from './payment-method.model';

/**
 * PaymentMethodField model representing fields for payment methods
 */
@model()
export class PaymentMethodField extends BaseEntity {
  /**
   * Name of the field
   */
  @property({
    type: 'string',
    required: true,
  })
  name: string;

  /**
   * Type of the field (string, number, etc.)
   */
  @property({
    type: 'string',
    required: true,
  })
  type: string;

  /**
   * Foreign key to PaymentMethod
   */
  @belongsTo(() => PaymentMethod, {}, {
    type: 'number',
    required: true,
  })
  paymentMethodId: number;

  constructor(data?: Partial<PaymentMethodField>) {
    super(data);
  }
}

export interface PaymentMethodFieldRelations {
  paymentMethod?: PaymentMethod;
}

export type PaymentMethodFieldWithRelations = PaymentMethodField & PaymentMethodFieldRelations;
