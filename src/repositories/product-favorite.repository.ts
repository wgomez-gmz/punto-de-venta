import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProductFavorite, ProductFavoriteRelations} from '../models';

export class ProductFavoriteRepository extends DefaultCrudRepository<
  ProductFavorite,
  typeof ProductFavorite.prototype.id,
  ProductFavoriteRelations
> {
  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(ProductFavorite, dataSource);
  }
}
