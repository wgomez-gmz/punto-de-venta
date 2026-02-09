import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {Permission} from './permission.model';
import {Role} from './role.model';

@model()
export class RolePermission extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @belongsTo(() => Role)
  roleId: number;

  @belongsTo(() => Permission)
  permissionId: number;

  constructor(data?: Partial<RolePermission>) {
    super(data);
  }
}

export interface RolePermissionRelations {
  role?: Role;
  permission?: Permission;
}

export type RolePermissionWithRelations = RolePermission & RolePermissionRelations;
