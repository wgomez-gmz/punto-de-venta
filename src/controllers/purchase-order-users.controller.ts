import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  PurchaseOrder,
  Users,
} from '../models';
import {PurchaseOrderRepository} from '../repositories';

export class PurchaseOrderUsersController {
  constructor(
    @repository(PurchaseOrderRepository)
    public purchaseOrderRepository: PurchaseOrderRepository,
  ) { }

  @get('/purchase-orders/{id}/users', {
    responses: {
      '200': {
        description: 'Users belonging to PurchaseOrder',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Users),
          },
        },
      },
    },
  })
  async getUsers(
    @param.path.number('id') id: typeof PurchaseOrder.prototype.id,
  ): Promise<Users> {
    return this.purchaseOrderRepository.users(id);
  }
}
