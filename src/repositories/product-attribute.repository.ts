import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProductAttribute, ProductAttributeRelations} from '../models';

export class ProductAttributeRepository extends DefaultCrudRepository<
  ProductAttribute,
  typeof ProductAttribute.prototype.id,
  ProductAttributeRelations
> {
  constructor(@inject('datasources.DB') dataSource: DbDataSource) {
    super(ProductAttribute, dataSource);
  }
}
