import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {PaymentMethod, PaymentMethodField, PaymentMethodFieldRelations} from '../models';
import {PaymentMethodRepository} from './payment-method.repository';

export class PaymentMethodFieldRepository extends DefaultCrudRepository<
  PaymentMethodField,
  typeof PaymentMethodField.prototype.id,
  PaymentMethodFieldRelations
> {
  public readonly paymentMethod: BelongsToAccessor<
    PaymentMethod,
    typeof PaymentMethodField.prototype.id
  >;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @inject.getter('repositories.PaymentMethodRepository')
    protected paymentMethodRepositoryGetter: Getter<PaymentMethodRepository>,
  ) {
    super(PaymentMethodField, dataSource);
    this.paymentMethod = this.createBelongsToAccessorFor(
      'paymentMethod',
      paymentMethodRepositoryGetter,
    );
  }
}
