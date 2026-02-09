import {model, property} from '@loopback/repository';

/**
 * DTO for payment method form fields with values
 */
@model()
export class PaymentMethodFormField {
  @property({
    type: 'number',
    required: true,
  })
  id: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  type: string;

  @property({
    type: 'string',
    required: true,
  })
  value: string;
}

/**
 * DTO for payment method form
 */
@model()
export class PaymentMethodFormDto {
  @property({
    type: 'number',
    required: true,
  })
  paymentMethodId: number;

  @property({
    type: 'string',
    required: true,
  })
  paymentMethodName: string;

  @property({
    type: 'boolean',
    required: true,
  })
  isSandbox: boolean;

  @property({
    type: 'array',
    itemType: PaymentMethodFormField,
    required: true,
  })
  fields: PaymentMethodFormField[];
}

/**
 * DTO for saving payment method form field values
 */
@model()
export class PaymentMethodFormSaveField {
  @property({
    type: 'number',
    required: true,
  })
  id: number;

  @property({
    type: 'string',
    required: true,
  })
  value: string;
}

/**
 * DTO for saving payment method form values
 */
@model()
export class PaymentMethodFormSaveDto {
  @property({
    type: 'boolean',
    required: true,
  })
  isSandbox: boolean;

  @property({
    type: 'array',
    itemType: PaymentMethodFormSaveField,
    required: true,
  })
  fields: PaymentMethodFormSaveField[];
}
