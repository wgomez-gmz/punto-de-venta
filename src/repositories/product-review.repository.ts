import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProductReview, ProductReviewRelations} from '../models';

export class ProductReviewRepository extends DefaultCrudRepository<
  ProductReview,
  typeof ProductReview.prototype.id,
  ProductReviewRelations
> {
  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(ProductReview, dataSource);
  }
}
