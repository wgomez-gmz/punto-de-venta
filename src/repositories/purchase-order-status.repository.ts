import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {PurchaseOrderStatus, PurchaseOrderStatusRelations} from '../models';

export class PurchaseOrderStatusRepository extends DefaultCrudRepository<
  PurchaseOrderStatus,
  typeof PurchaseOrderStatus.prototype.id,
  PurchaseOrderStatusRelations
> {
  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(PurchaseOrderStatus, dataSource);
  }
}
