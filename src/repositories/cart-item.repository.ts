import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Cart, CartItem, CartItemRelations, Product, ProductVariation} from '../models';
import {CartRepository} from './cart.repository';
import {ProductVariationRepository} from './product-variation.repository';
import {ProductRepository} from './product.repository';

export class CartItemRepository extends DefaultCrudRepository<
  CartItem,
  typeof CartItem.prototype.id,
  CartItemRelations
> {

  public readonly cart: BelongsToAccessor<Cart, typeof CartItem.prototype.id>;

  public readonly product: BelongsToAccessor<Product, typeof CartItem.prototype.id>;

  public readonly productVariation: BelongsToAccessor<ProductVariation, typeof CartItem.prototype.id>;


  constructor(
    @inject('datasources.DB') dataSource: DbDataSource, @repository.getter('CartRepository') protected cartRepositoryGetter: Getter<CartRepository>, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>, @repository.getter('ProductVariationRepository') protected productVariationRepositoryGetter: Getter<ProductVariationRepository>,

  ) {
    super(CartItem, dataSource);
    this.productVariation = this.createBelongsToAccessorFor('productVariation', productVariationRepositoryGetter,);
    this.registerInclusionResolver('productVariation', this.productVariation.inclusionResolver);
    this.product = this.createBelongsToAccessorFor('product', productRepositoryGetter,);
    this.registerInclusionResolver('product', this.product.inclusionResolver);
    this.cart = this.createBelongsToAccessorFor('cart', cartRepositoryGetter,);
    this.registerInclusionResolver('cart', this.cart.inclusionResolver);
  }
}
