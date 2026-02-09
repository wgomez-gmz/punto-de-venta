import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Attachment, Product, ProductImages, ProductImagesRelations} from '../models';
import {AttachmentRepository} from './attachment.repository';
import {ProductRepository} from './product.repository';

export class ProductImagesRepository extends DefaultCrudRepository<
  ProductImages,
  typeof ProductImages.prototype.id,
  ProductImagesRelations
> {
  public readonly product: BelongsToAccessor<Product, typeof ProductImages.prototype.id>;

  public readonly attachment: BelongsToAccessor<Attachment, typeof ProductImages.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @inject.getter('repositories.ProductRepository')
    protected productRepositoryGetter: Getter<ProductRepository>,
    @inject.getter('repositories.AttachmentRepository')
    protected attachmentRepositoryGetter: Getter<AttachmentRepository>,
  ) {
    super(ProductImages, dataSource);
    this.product = this.createBelongsToAccessorFor('product', productRepositoryGetter);
    this.registerInclusionResolver('product', this.product.inclusionResolver);
    this.attachment = this.createBelongsToAccessorFor('attachment', attachmentRepositoryGetter);
    this.registerInclusionResolver('attachment', this.attachment.inclusionResolver);
  }
}
