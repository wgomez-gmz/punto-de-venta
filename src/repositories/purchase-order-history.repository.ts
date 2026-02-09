import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {PurchaseOrderHistory, PurchaseOrderHistoryRelations} from '../models';
import {Users} from '../models/users.model';
import {UsersRepository} from './users.repository';

export class PurchaseOrderHistoryRepository extends DefaultCrudRepository<
  PurchaseOrderHistory,
  typeof PurchaseOrderHistory.prototype.id,
  PurchaseOrderHistoryRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof PurchaseOrderHistory.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource, @repository.getter('UsersRepository') protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(PurchaseOrderHistory, dataSource);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
