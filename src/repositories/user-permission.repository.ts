import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {UserPermission, UserPermissionRelations} from '../models';

export class UserPermissionRepository extends DefaultCrudRepository<
  UserPermission,
  typeof UserPermission.prototype.id,
  UserPermissionRelations
> {

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(UserPermission, dataSource);
  }
}
