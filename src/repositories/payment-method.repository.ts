import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {PaymentMethod, PaymentMethodField, PaymentMethodRelations} from '../models';
import {PaymentMethodFieldRepository} from './payment-method-field.repository';

export class PaymentMethodRepository extends DefaultCrudRepository<
  PaymentMethod,
  typeof PaymentMethod.prototype.id,
  PaymentMethodRelations
> {
  public readonly fields: HasManyRepositoryFactory<
    PaymentMethodField,
    typeof PaymentMethodField.prototype.id
  >;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @inject.getter('repositories.PaymentMethodFieldRepository')
    protected paymentMethodFieldRepositoryGetter: Getter<PaymentMethodFieldRepository>,
  ) {
    super(PaymentMethod, dataSource);
    this.fields = this.createHasManyRepositoryFactoryFor(
      'fields',
      paymentMethodFieldRepositoryGetter,
    );
  }
}
