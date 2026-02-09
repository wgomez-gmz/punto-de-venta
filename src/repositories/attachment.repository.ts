import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Attachment, AttachmentRelations} from '../models';

export class AttachmentRepository extends DefaultCrudRepository<
  Attachment,
  typeof Attachment.prototype.id,
  AttachmentRelations
> {
  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
  ) {
    super(Attachment, dataSource);
  }
}
