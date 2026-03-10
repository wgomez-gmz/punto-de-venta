import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CouponUsage, CouponUsageRelations} from '../models';

export class CouponUsageRepository extends DefaultCrudRepository<
  CouponUsage,
  typeof CouponUsage.prototype.id,
  CouponUsageRelations
> {
  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(CouponUsage, dataSource);
  }
}
