import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {PurchaseOrderResponse, PurchaseOrderResponseRelations, PurchaseOrder} from '../models';
import {PurchaseOrderRepository} from './purchase-order.repository';

export class PurchaseOrderResponseRepository extends DefaultCrudRepository<
  PurchaseOrderResponse,
  typeof PurchaseOrderResponse.prototype.id,
  PurchaseOrderResponseRelations
> {

  public readonly purchaseOrder: BelongsToAccessor<PurchaseOrder, typeof PurchaseOrderResponse.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource, @repository.getter('PurchaseOrderRepository') protected purchaseOrderRepositoryGetter: Getter<PurchaseOrderRepository>,
  ) {
    super(PurchaseOrderResponse, dataSource);
    this.purchaseOrder = this.createBelongsToAccessorFor('purchaseOrder', purchaseOrderRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrder', this.purchaseOrder.inclusionResolver);
  }
}
