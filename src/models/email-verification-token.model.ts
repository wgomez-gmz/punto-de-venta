import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity, Users} from '.';

@model()
export class EmailVerificationToken extends BaseEntity {
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
  tokenHash: string;

  @property({
    type: 'date',
    required: true,
  })
  expiresAt: string;

  @property({
    type: 'date',
  })
  usedAt?: string;

  @property({
    type: 'string',
  })
  requestedFor?: string;

  @belongsTo(() => Users)
  usersId: number;

  constructor(data?: Partial<EmailVerificationToken>) {
    super(data);
  }
}

export interface EmailVerificationTokenRelations {
  users?: Users;
}

export type EmailVerificationTokenWithRelations =
  EmailVerificationToken & EmailVerificationTokenRelations;
