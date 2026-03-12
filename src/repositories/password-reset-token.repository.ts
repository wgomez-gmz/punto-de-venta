import {inject, Getter} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {PasswordResetToken, PasswordResetTokenRelations, Users} from '../models';
import {UsersRepository} from './users.repository';

export class PasswordResetTokenRepository extends DefaultCrudRepository<
  PasswordResetToken,
  typeof PasswordResetToken.prototype.id,
  PasswordResetTokenRelations
> {
  public readonly users: BelongsToAccessor<Users, typeof PasswordResetToken.prototype.id>;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @repository.getter('UsersRepository') protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(PasswordResetToken, dataSource);
    this.users = this.createBelongsToAccessorFor('users', usersRepositoryGetter);
    this.registerInclusionResolver('users', this.users.inclusionResolver);
  }
}
