import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {RolePermission, RolePermissionRelations} from '../models';

export class RolePermissionRepository extends DefaultCrudRepository<
  RolePermission,
  typeof RolePermission.prototype.id,
  RolePermissionRelations
> {

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(RolePermission, dataSource);
  }
}
