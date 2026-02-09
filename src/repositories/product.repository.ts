import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasManyRepositoryFactory, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Attachment, Category, Product, ProductCategories, ProductImages, ProductRelations} from '../models';
import {ProductAttribute} from '../models/product-attribute.model';
import {ProductVariation} from '../models/product-variation.model';
import {AttachmentRepository} from './attachment.repository';
import {CategoryRepository} from './category.repository';
import {ProductAttributeRepository} from './product-attribute.repository';
import {ProductCategoriesRepository} from './product-categories.repository';
import {ProductImagesRepository} from './product-images.repository';
import {ProductVariationRepository} from './product-variation.repository';

export class ProductRepository extends DefaultCrudRepository<
  Product,
  typeof Product.prototype.id,
  ProductRelations
> {
  public readonly categories: HasManyThroughRepositoryFactory<
    Category,
    typeof Category.prototype.id,
    ProductCategories,
    typeof ProductCategories.prototype.id
  >;

  public readonly attachments: HasManyThroughRepositoryFactory<
    Attachment,
    typeof Attachment.prototype.id,
    ProductImages,
    typeof ProductImages.prototype.id
  >;

  public readonly attributes: HasManyRepositoryFactory<
    ProductAttribute,
    typeof ProductAttribute.prototype.id
  >;

  public readonly variations: HasManyRepositoryFactory<
    ProductVariation,
    typeof ProductVariation.prototype.id
  >;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @inject.getter('repositories.CategoryRepository')
    protected categoryRepositoryGetter: Getter<CategoryRepository>,
    @inject.getter('repositories.ProductCategoriesRepository')
    protected productCategoriesRepositoryGetter: Getter<ProductCategoriesRepository>,
    @inject.getter('repositories.AttachmentRepository')
    protected attachmentRepositoryGetter: Getter<AttachmentRepository>,
    @inject.getter('repositories.ProductImagesRepository')
    protected productImagesRepositoryGetter: Getter<ProductImagesRepository>,
    @inject.getter('repositories.ProductAttributeRepository')
    protected productAttributeRepositoryGetter: Getter<ProductAttributeRepository>,
    @inject.getter('repositories.ProductVariationRepository')
    protected productVariationRepositoryGetter: Getter<ProductVariationRepository>,
  ) {
    super(Product, dataSource);
    this.categories = this.createHasManyThroughRepositoryFactoryFor(
      'categories',
      categoryRepositoryGetter,
      productCategoriesRepositoryGetter,
    );
    this.attachments = this.createHasManyThroughRepositoryFactoryFor(
      'attachments',
      attachmentRepositoryGetter,
      productImagesRepositoryGetter,
    );
    this.attributes = this.createHasManyRepositoryFactoryFor(
      'attributes',
      productAttributeRepositoryGetter,
    );
    this.variations = this.createHasManyRepositoryFactoryFor(
      'variations',
      productVariationRepositoryGetter,
    );
  }
}
