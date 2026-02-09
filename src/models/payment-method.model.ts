import {hasMany, model, property} from '@loopback/repository';
import {BaseEntity} from './base-entity.model';
import {PaymentMethodField} from './payment-method-field.model';

/**
 * PaymentMethod model representing payment method configurations
 */
@model()
export class PaymentMethod extends BaseEntity {
  /**
   * Name of the payment method
   */
  @property({
    type: 'string',
    required: true,
  })
  name: string;

  /**
   * Display name for the payment method
   */
  @property({
    type: 'string',
    required: true,
  })
  displayName: string;

  /**
   * Description of the payment method
   */
  @property({
    type: 'string',
  })
  description?: string;

  /**
   * Type of payment method
   */
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: ['online', 'offline'],
    },
  })
  type: 'online' | 'offline';

  /**
   * Whether the payment method is active
   */
  @property({
    type: 'boolean',
    required: true,
    default: true,
  })
  isActive: boolean;

  /**
   * Whether this payment method is for sandbox/testing environment
   */
  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  isSandbox: boolean;

  /**
   * Fields associated with this payment method
   */
  @hasMany(() => PaymentMethodField, {keyTo: 'paymentMethodId'})
  fields: PaymentMethodField[];

  constructor(data?: Partial<PaymentMethod>) {
    super(data);
  }
}

export interface PaymentMethodRelations {
  fields?: PaymentMethodField[];
}

export type PaymentMethodWithRelations = PaymentMethod & PaymentMethodRelations;
