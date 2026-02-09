import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProductCategories, ProductCategoriesRelations} from '../models';

export class ProductCategoriesRepository extends DefaultCrudRepository<
  ProductCategories,
  typeof ProductCategories.prototype.id,
  ProductCategoriesRelations
> {
  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(ProductCategories, dataSource);
  }
}
