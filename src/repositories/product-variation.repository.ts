import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProductVariation, ProductVariationRelations} from '../models';

export class ProductVariationRepository extends DefaultCrudRepository<
  ProductVariation,
  typeof ProductVariation.prototype.id,
  ProductVariationRelations
> {
  constructor(@inject('datasources.DB') dataSource: DbDataSource) {
    super(ProductVariation, dataSource);
  }
}
