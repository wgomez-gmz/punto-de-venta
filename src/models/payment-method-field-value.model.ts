import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from './base-entity.model';
import {PaymentMethodField} from './payment-method-field.model';
import {PaymentMethod} from './payment-method.model';

/**
 * PaymentMethodFieldValue model representing values for payment method fields
 */
@model()
export class PaymentMethodFieldValue extends BaseEntity {
  /**
   * Value of the field
   */
  @property({
    type: 'string',
    required: true,
  })
  value: string;

  /**
   * Whether this value is for sandbox environment
   */
  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  isSandbox: boolean;

  /**
   * Foreign key to PaymentMethod
   */
  @belongsTo(() => PaymentMethod, {}, {
    type: 'number',
    required: true,
  })
  paymentMethodId: number;

  /**
   * Foreign key to PaymentMethodField
   */
  @belongsTo(() => PaymentMethodField, {}, {
    type: 'number',
    required: true,
  })
  paymentMethodFieldId: number;

  constructor(data?: Partial<PaymentMethodFieldValue>) {
    super(data);
  }
}

export interface PaymentMethodFieldValueRelations {
  paymentMethod?: PaymentMethod;
  paymentMethodField?: PaymentMethodField;
}

export type PaymentMethodFieldValueWithRelations = PaymentMethodFieldValue & PaymentMethodFieldValueRelations;
