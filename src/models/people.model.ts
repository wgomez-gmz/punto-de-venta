import {model, property} from '@loopback/repository';
import {BaseEntity} from '.';

@model()
export class People extends BaseEntity {
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
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  firstLastName: string;

  @property({
    type: 'string',
  })
  secondLastName?: string;

  @property({
    type: 'date',
  })
  birthday?: Date;

  @property({
    type: 'string',
  })
  phone?: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
  })
  enterpriseEmail?: string;

  @property({
    type: 'string',
  })
  note?: string;

  @property({
    type: 'number',
  })
  userCreateId?: number;

  @property({
    type: 'number',
  })
  usersId?: number;

  constructor(data?: Partial<People>) {
    super(data);
  }
}

export interface PeopleRelations {
  // describe navigational properties here
}

export type PeopleWithRelations = People & PeopleRelations;
