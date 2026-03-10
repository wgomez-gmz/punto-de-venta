import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {Users} from './users.model';

@model()
export class UserAddress extends BaseEntity {
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
  recipientName: string;

  @property({
    type: 'string',
    required: true,
  })
  contactPhone: string;

  @property({
    type: 'string',
    required: true,
    length: 5,
  })
  postalCode: string;

  @property({
    type: 'string',
    required: true,
    default: 'Mexico',
  })
  country: string;

  @property({
    type: 'string',
    required: true,
  })
  state: string;

  @property({
    type: 'string',
    required: true,
  })
  municipality: string;

  @property({
    type: 'string',
    required: true,
  })
  city: string;

  @property({
    type: 'string',
    required: true,
  })
  neighborhood: string;

  @property({
    type: 'string',
    required: true,
  })
  street: string;

  @property({
    type: 'string',
    required: true,
  })
  exteriorNumber: string;

  @property({
    type: 'string',
  })
  interiorNumber?: string;

  @property({
    type: 'string',
  })
  betweenStreets?: string;

  @property({
    type: 'string',
  })
  reference?: string;

  @property({
    type: 'string',
  })
  deliveryInstructions?: string;

  @property({
    type: 'string',
    default: 'home',
  })
  addressType?: string;

  @property({
    type: 'string',
  })
  alias?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isDefault?: boolean;

  @belongsTo(() => Users)
  usersId: number;

  constructor(data?: Partial<UserAddress>) {
    super(data);
  }
}

export interface UserAddressRelations {
  users?: Users;
}

export type UserAddressWithRelations = UserAddress & UserAddressRelations;
