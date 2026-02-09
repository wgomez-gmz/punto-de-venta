import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {PurchaseOrderItem, PurchaseOrderItemRelations, PurchaseOrder} from '../models';
import {PurchaseOrderRepository} from './purchase-order.repository';

export class PurchaseOrderItemRepository extends DefaultCrudRepository<
  PurchaseOrderItem,
  typeof PurchaseOrderItem.prototype.id,
  PurchaseOrderItemRelations
> {

  public readonly purchaseOrder: BelongsToAccessor<PurchaseOrder, typeof PurchaseOrderItem.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource, @repository.getter('PurchaseOrderRepository') protected purchaseOrderRepositoryGetter: Getter<PurchaseOrderRepository>,
  ) {
    super(PurchaseOrderItem, dataSource);
    this.purchaseOrder = this.createBelongsToAccessorFor('purchaseOrder', purchaseOrderRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrder', this.purchaseOrder.inclusionResolver);
  }
}
