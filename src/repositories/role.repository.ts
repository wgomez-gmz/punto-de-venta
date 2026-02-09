import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Role, RolePermission, RoleRelations} from '../models';
import {RolePermissionRepository} from './role-permission.repository';

export class RoleRepository extends DefaultCrudRepository<
  Role,
  typeof Role.prototype.id,
  RoleRelations
> {

  public readonly rolePermissions: HasManyRepositoryFactory<RolePermission, typeof Role.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource, @repository.getter('RolePermissionRepository') protected rolePermissionRepositoryGetter: Getter<RolePermissionRepository>,
  ) {
    super(Role, dataSource);
    this.rolePermissions = this.createHasManyRepositoryFactoryFor('rolePermissions', rolePermissionRepositoryGetter,);
    this.registerInclusionResolver('rolePermissions', this.rolePermissions.inclusionResolver);
  }
}
