import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProductViewHistory, ProductViewHistoryRelations} from '../models';

export class ProductViewHistoryRepository extends DefaultCrudRepository<
  ProductViewHistory,
  typeof ProductViewHistory.prototype.id,
  ProductViewHistoryRelations
> {
  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(ProductViewHistory, dataSource);
  }
}
