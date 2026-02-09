import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {PurchaseOrder, PurchaseOrderHistory, PurchaseOrderItem, PurchaseOrderRelations, PurchaseOrderResponse, PurchaseOrderStatus, Users} from '../models';
import {PurchaseOrderHistoryRepository} from './purchase-order-history.repository';
import {PurchaseOrderItemRepository} from './purchase-order-item.repository';
import {PurchaseOrderResponseRepository} from './purchase-order-response.repository';
import {PurchaseOrderStatusRepository} from './purchase-order-status.repository';
import {UsersRepository} from './users.repository';

export class PurchaseOrderRepository extends DefaultCrudRepository<
  PurchaseOrder,
  typeof PurchaseOrder.prototype.id,
  PurchaseOrderRelations
> {

  public readonly currentStatus: BelongsToAccessor<PurchaseOrderStatus, typeof PurchaseOrder.prototype.id>;

  public readonly purchaseOrderHistory: HasManyRepositoryFactory<PurchaseOrderHistory, typeof PurchaseOrder.prototype.id>;

  public readonly purchaseOrderItems: HasManyRepositoryFactory<PurchaseOrderItem, typeof PurchaseOrder.prototype.id>;

  public readonly purchaseOrderResponses: HasManyRepositoryFactory<PurchaseOrderResponse, typeof PurchaseOrder.prototype.id>;

  public readonly users: BelongsToAccessor<Users, typeof PurchaseOrder.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource, @repository.getter('PurchaseOrderHistoryRepository') protected purchaseOrderHistoryRepositoryGetter: Getter<PurchaseOrderHistoryRepository>, @repository.getter('PurchaseOrderStatusRepository') protected purchaseOrderStatusRepositoryGetter: Getter<PurchaseOrderStatusRepository>, @repository.getter('PurchaseOrderItemRepository') protected purchaseOrderItemRepositoryGetter: Getter<PurchaseOrderItemRepository>, @repository.getter('PurchaseOrderResponseRepository') protected purchaseOrderResponseRepositoryGetter: Getter<PurchaseOrderResponseRepository>, @repository.getter('UsersRepository') protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(PurchaseOrder, dataSource);
    this.users = this.createBelongsToAccessorFor('users', usersRepositoryGetter,);
    this.registerInclusionResolver('users', this.users.inclusionResolver);
    this.purchaseOrderResponses = this.createHasManyRepositoryFactoryFor('purchaseOrderResponses', purchaseOrderResponseRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrderResponses', this.purchaseOrderResponses.inclusionResolver);
    this.purchaseOrderItems = this.createHasManyRepositoryFactoryFor('purchaseOrderItems', purchaseOrderItemRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrderItems', this.purchaseOrderItems.inclusionResolver);
    this.purchaseOrderHistory = this.createHasManyRepositoryFactoryFor('purchaseOrderHistory', purchaseOrderHistoryRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrderHistory', this.purchaseOrderHistory.inclusionResolver);
    this.currentStatus = this.createBelongsToAccessorFor('currentStatus', purchaseOrderStatusRepositoryGetter,);
    this.registerInclusionResolver('currentStatus', this.currentStatus.inclusionResolver);
  }
}
