import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Coupon, CouponRelations} from '../models';

export class CouponRepository extends DefaultCrudRepository<
  Coupon,
  typeof Coupon.prototype.id,
  CouponRelations
> {
  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(Coupon, dataSource);
  }
}
