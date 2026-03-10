import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, HasOneRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Cart, People, Role, UserAddress, UserCredentials, UserPermission, Users, UsersRelations, PurchaseOrder} from '../models';
import {CartRepository} from './cart.repository';
import {PeopleRepository} from './people.repository';
import {RoleRepository} from './role.repository';
import {UserCredentialsRepository} from './user-credentials.repository';
import {UserPermissionRepository} from './user-permission.repository';
import {PurchaseOrderRepository} from './purchase-order.repository';
import {UserAddressRepository} from './user-address.repository';

export class UsersRepository extends DefaultCrudRepository<
  Users,
  typeof Users.prototype.id,
  UsersRelations
> {

  public readonly userCredentials: HasOneRepositoryFactory<UserCredentials, typeof Users.prototype.id>;

  public readonly role: BelongsToAccessor<Role, typeof Users.prototype.id>;

  public readonly cart: HasOneRepositoryFactory<Cart, typeof Users.prototype.id>;

  public readonly people: HasOneRepositoryFactory<People, typeof Users.prototype.id>;

  public readonly userPermissions: HasManyRepositoryFactory<UserPermission, typeof Users.prototype.id>;

  public readonly purchaseOrders: HasManyRepositoryFactory<PurchaseOrder, typeof Users.prototype.id>;

  public readonly addresses: HasManyRepositoryFactory<UserAddress, typeof Users.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource, @repository.getter('UserCredentialsRepository') protected userCredentialsRepositoryGetter: Getter<UserCredentialsRepository>, @repository.getter('RoleRepository') protected roleRepositoryGetter: Getter<RoleRepository>, @repository.getter('CartRepository') protected cartRepositoryGetter: Getter<CartRepository>, @repository.getter('PeopleRepository') protected peopleRepositoryGetter: Getter<PeopleRepository>, @repository.getter('UserPermissionRepository') protected userPermissionRepositoryGetter: Getter<UserPermissionRepository>, @repository.getter('PurchaseOrderRepository') protected purchaseOrderRepositoryGetter: Getter<PurchaseOrderRepository>, @repository.getter('UserAddressRepository') protected userAddressRepositoryGetter: Getter<UserAddressRepository>,
  ) {
    super(Users, dataSource);
    this.addresses = this.createHasManyRepositoryFactoryFor('addresses', userAddressRepositoryGetter,);
    this.registerInclusionResolver('addresses', this.addresses.inclusionResolver);
    this.purchaseOrders = this.createHasManyRepositoryFactoryFor('purchaseOrders', purchaseOrderRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrders', this.purchaseOrders.inclusionResolver);
    this.people = this.createHasOneRepositoryFactoryFor('people', peopleRepositoryGetter);
    this.registerInclusionResolver('people', this.people.inclusionResolver);
    this.cart = this.createHasOneRepositoryFactoryFor('cart', cartRepositoryGetter);
    this.registerInclusionResolver('cart', this.cart.inclusionResolver);
    this.role = this.createBelongsToAccessorFor('role', roleRepositoryGetter,);
    this.registerInclusionResolver('role', this.role.inclusionResolver);

    this.userCredentials = this.createHasOneRepositoryFactoryFor('userCredentials', userCredentialsRepositoryGetter);
    this.registerInclusionResolver('userCredentials', this.userCredentials.inclusionResolver);
    this.userPermissions = this.createHasManyRepositoryFactoryFor('userPermissions', userPermissionRepositoryGetter);
    this.registerInclusionResolver('userPermissions', this.userPermissions.inclusionResolver);
  }

  async findCredentials(
    userId: typeof Users.prototype.id,
  ): Promise<UserCredentials | undefined> {
    try {
      return await this.userCredentials(userId).get();
    } catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }

}
