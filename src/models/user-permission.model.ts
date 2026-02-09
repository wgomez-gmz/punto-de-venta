import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from '.';
import {Permission} from './permission.model';
import {Users} from './users.model';

@model()
export class UserPermission extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @belongsTo(() => Users)
  usersId: number;

  @belongsTo(() => Permission)
  permissionId: number;

  constructor(data?: Partial<UserPermission>) {
    super(data);
  }
}

export interface UserPermissionRelations {
  user?: Users;
  permission?: Permission;
}

export type UserPermissionWithRelations = UserPermission & UserPermissionRelations;
