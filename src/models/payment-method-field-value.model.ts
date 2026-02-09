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
  @property({
    type: 'number',
    required: true,
  })
  paymentMethodId: number;

  /**
   * Foreign key to PaymentMethodField
   */
  @property({
    type: 'number',
    required: true,
  })
  paymentMethodFieldId: number;

  /**
   * Payment method this value belongs to
   */
  @belongsTo(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  /**
   * Payment method field this value belongs to
   */
  @belongsTo(() => PaymentMethodField)
  paymentMethodField: PaymentMethodField;

  constructor(data?: Partial<PaymentMethodFieldValue>) {
    super(data);
  }
}

export interface PaymentMethodFieldValueRelations {
  paymentMethod?: PaymentMethod;
  paymentMethodField?: PaymentMethodField;
}

export type PaymentMethodFieldValueWithRelations = PaymentMethodFieldValue & PaymentMethodFieldValueRelations;
