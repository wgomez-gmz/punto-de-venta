import {Entity, model, property} from '@loopback/repository';
import {getLocalDate} from '../utils/resource';

@model()
export class BaseEntity extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
    required: true,
    default: () => getLocalDate(new Date())
  })
  creationDate: string;

  @property({
    type: 'date',
    default: () => getLocalDate(new Date())
  })
  updateDate?: string;

  @property({
    type: 'number',
    default: 1,
  })
  status?: number;

  constructor(data?: Partial<BaseEntity>) {
    super(data);
  }
}

export interface BaseEntityRelations {
  // describe navigational properties here
}

export type BaseEntityWithRelations = BaseEntity & BaseEntityRelations;
