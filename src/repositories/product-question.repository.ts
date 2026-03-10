import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProductQuestion, ProductQuestionRelations} from '../models';

export class ProductQuestionRepository extends DefaultCrudRepository<
  ProductQuestion,
  typeof ProductQuestion.prototype.id,
  ProductQuestionRelations
> {
  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(ProductQuestion, dataSource);
  }
}
