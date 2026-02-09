import {belongsTo, model, property} from '@loopback/repository';
import {getLocalDate} from '../utils/resource';
import {Attachment} from './attachment.model';
import {BaseEntity} from './base-entity.model';

@model()
export class PromotionCarousel extends BaseEntity {
  @property({
    type: 'number',
    required: true,
  })
  attachmentId: number;

  @property({
    type: 'string',
  })
  title?: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'boolean',
    default: true,
  })
  enabled?: boolean;

  @property({
    type: 'string',
    default: () => getLocalDate(new Date()).toISOString()
  })
  startDate?: string;

  @property({
    type: 'string',
    default: () => getLocalDate(new Date()).toISOString()
  })
  endDate?: string;

  @property({
    type: 'number',
    default: 0,
  })
  order?: number;

  @belongsTo(() => Attachment)
  attachment: Attachment;

  constructor(data?: Partial<PromotionCarousel>) {
    super(data);
  }
}

export interface PromotionCarouselRelations {
  attachment?: Attachment;
}

export type PromotionCarouselWithRelations = PromotionCarousel & PromotionCarouselRelations;
