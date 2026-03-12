import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {EmailVerificationToken, EmailVerificationTokenRelations, Users} from '../models';
import {UsersRepository} from './users.repository';

export class EmailVerificationTokenRepository extends DefaultCrudRepository<
  EmailVerificationToken,
  typeof EmailVerificationToken.prototype.id,
  EmailVerificationTokenRelations
> {
  public readonly users: BelongsToAccessor<Users, typeof EmailVerificationToken.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @repository.getter('UsersRepository') protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(EmailVerificationToken, dataSource);
    this.users = this.createBelongsToAccessorFor('users', usersRepositoryGetter);
    this.registerInclusionResolver('users', this.users.inclusionResolver);
  }
}
