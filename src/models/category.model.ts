import {model, property} from '@loopback/repository';
import {BaseEntity} from './base-entity.model';

@model()
export class Category extends BaseEntity {
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
  })
  description?: string;

  @property({
    type: 'string',
    required: true,
  })
  key: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  products?: any[];

  constructor(data?: Partial<Category>) {
    super(data);
  }
}

export interface CategoryRelations {
  products?: any[];
}

export type CategoryWithRelations = Category & CategoryRelations;
