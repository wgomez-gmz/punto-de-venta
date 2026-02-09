import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Attachment, PromotionCarousel, PromotionCarouselRelations} from '../models';
import {AttachmentRepository} from './attachment.repository';

export class PromotionCarouselRepository extends DefaultCrudRepository<
  PromotionCarousel,
  typeof PromotionCarousel.prototype.id,
  PromotionCarouselRelations
> {
  public readonly attachment: BelongsToAccessor<Attachment, typeof PromotionCarousel.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @inject.getter('repositories.AttachmentRepository')
    protected attachmentRepositoryGetter: Getter<AttachmentRepository>,
  ) {
    super(PromotionCarousel, dataSource);
    this.attachment = this.createBelongsToAccessorFor('attachment', attachmentRepositoryGetter);
    this.registerInclusionResolver('attachment', this.attachment.inclusionResolver);
  }
}
