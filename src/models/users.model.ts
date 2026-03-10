import {belongsTo, hasMany, hasOne, model, property} from '@loopback/repository';
import {BaseEntity, UserPermission} from '.';
import {Cart} from './cart.model';
import {People} from './people.model';
import {UserAddress} from './user-address.model';
import {Role} from './role.model';
import {UserCredentials} from './user-credentials.model';
import {PurchaseOrder} from './purchase-order.model';

/**
 * User model representing a system user
 */
@model()
export class Users extends BaseEntity {
  /**
   * Unique identifier for the user
   */
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  /**
   * Unique username for the user
   */
  @property({
    type: 'string',
    required: true,
  })
  username: string;

  /**
   * Authentication token for the user
   */
  @property({
    type: 'string',
  })
  token?: string;

  /**
   * Email address of the user
   */
  @property({
    type: 'string',
  })
  email?: string;

  /**
   * User credentials relationship
   */
  @hasOne(() => UserCredentials)
  userCredentials: UserCredentials;

  /**
   * Role ID that the user belongs to
   */
  @belongsTo(() => Role)
  roleId: number;

  /**
   * User's shopping cart
   */
  @hasOne(() => Cart)
  cart: Cart;

  @hasOne(() => People)
  people: People;

  @hasMany(() => UserPermission)
  userPermissions: UserPermission[];

  @hasMany(() => PurchaseOrder)
  purchaseOrders: PurchaseOrder[];

  @hasMany(() => UserAddress)
  addresses: UserAddress[];

  constructor(data?: Partial<Users>) {
    super(data);
  }
}

export interface UsersRelations {
  userCredentials?: UserCredentials;
  role?: Role;
  cart?: Cart;
  userPermissions?: UserPermission[];
  addresses?: UserAddress[];
}

export type UsersWithRelations = Users & UsersRelations;
