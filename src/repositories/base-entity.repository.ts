import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {BaseEntity, BaseEntityRelations} from '../models';

export class BaseEntityRepository extends DefaultCrudRepository<
  BaseEntity,
  typeof BaseEntity.prototype.id,
  BaseEntityRelations
> {

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(BaseEntity, dataSource);
  }
}
