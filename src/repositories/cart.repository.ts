import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Cart, CartItem, CartRelations, Users} from '../models';
import {CartItemRepository} from './cart-item.repository';
import {UsersRepository} from './users.repository';

export class CartRepository extends DefaultCrudRepository<
  Cart,
  typeof Cart.prototype.id,
  CartRelations
> {

  public readonly cartItems: HasManyRepositoryFactory<CartItem, typeof Cart.prototype.id>;

  public readonly users: BelongsToAccessor<Users, typeof Cart.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource, @repository.getter('CartItemRepository') protected cartItemRepositoryGetter: Getter<CartItemRepository>, @repository.getter('UsersRepository') protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(Cart, dataSource);
    this.users = this.createBelongsToAccessorFor('users', usersRepositoryGetter,);
    this.registerInclusionResolver('users', this.users.inclusionResolver);
    this.cartItems = this.createHasManyRepositoryFactoryFor('cartItems', cartItemRepositoryGetter,);
    this.registerInclusionResolver('cartItems', this.cartItems.inclusionResolver);
  }
}
