import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {PaymentMethod, PaymentMethodField, PaymentMethodFieldValue, PaymentMethodFieldValueRelations} from '../models';
import {PaymentMethodFieldRepository} from './payment-method-field.repository';
import {PaymentMethodRepository} from './payment-method.repository';

export class PaymentMethodFieldValueRepository extends DefaultCrudRepository<
  PaymentMethodFieldValue,
  typeof PaymentMethodFieldValue.prototype.id,
  PaymentMethodFieldValueRelations
> {
  public readonly paymentMethod: BelongsToAccessor<
    PaymentMethod,
    typeof PaymentMethodFieldValue.prototype.id
  >;

  public readonly paymentMethodField: BelongsToAccessor<
    PaymentMethodField,
    typeof PaymentMethodFieldValue.prototype.id
  >;

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @inject.getter('repositories.PaymentMethodRepository')
    protected paymentMethodRepositoryGetter: Getter<PaymentMethodRepository>,
    @inject.getter('repositories.PaymentMethodFieldRepository')
    protected paymentMethodFieldRepositoryGetter: Getter<PaymentMethodFieldRepository>,
  ) {
    super(PaymentMethodFieldValue, dataSource);
    this.paymentMethod = this.createBelongsToAccessorFor(
      'paymentMethod',
      paymentMethodRepositoryGetter,
    );
    this.paymentMethodField = this.createBelongsToAccessorFor(
      'paymentMethodField',
      paymentMethodFieldRepositoryGetter,
    );
  }
}
