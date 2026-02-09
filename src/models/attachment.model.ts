import {model, property} from '@loopback/repository';
import {BaseEntity} from './base-entity.model';

@model()
export class Attachment extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  mimeType: string;

  @property({
    type: 'string',
  })
  url?: string;

  @property({
    type: 'string',
  })
  fileName?: string;

  @property({
    type: 'number',
  })
  size?: number;

  constructor(data?: Partial<Attachment>) {
    super(data);
  }
}

export interface AttachmentRelations {
  // No direct relations, handled through ProductImages
}

export type AttachmentWithRelations = Attachment & AttachmentRelations;
