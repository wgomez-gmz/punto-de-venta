import {hasMany, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {RolePermission} from './role-permission.model';

@model()
export class Role extends BaseEntity {
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
  key: string;

  @hasMany(() => RolePermission)
  rolePermissions: RolePermission[];

  constructor(data?: Partial<Role>) {
    super(data);
  }
}

export interface RoleRelations {
  rolePermissions?: RolePermission[];
}

export type RoleWithRelations = Role & RoleRelations;
