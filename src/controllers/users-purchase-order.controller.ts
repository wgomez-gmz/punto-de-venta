import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Users,
  PurchaseOrder,
} from '../models';
import {UsersRepository} from '../repositories';

export class UsersPurchaseOrderController {
  constructor(
    @repository(UsersRepository) protected usersRepository: UsersRepository,
  ) { }

  @get('/users/{id}/purchase-orders', {
    responses: {
      '200': {
        description: 'Array of Users has many PurchaseOrder',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(PurchaseOrder)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<PurchaseOrder>,
  ): Promise<PurchaseOrder[]> {
    return this.usersRepository.purchaseOrders(id).find(filter);
  }

  @post('/users/{id}/purchase-orders', {
    responses: {
      '200': {
        description: 'Users model instance',
        content: {'application/json': {schema: getModelSchemaRef(PurchaseOrder)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Users.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrder, {
            title: 'NewPurchaseOrderInUsers',
            exclude: ['id'],
            optional: ['usersId']
          }),
        },
      },
    }) purchaseOrder: Omit<PurchaseOrder, 'id'>,
  ): Promise<PurchaseOrder> {
    return this.usersRepository.purchaseOrders(id).create(purchaseOrder);
  }

  @patch('/users/{id}/purchase-orders', {
    responses: {
      '200': {
        description: 'Users.PurchaseOrder PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrder, {partial: true}),
        },
      },
    })
    purchaseOrder: Partial<PurchaseOrder>,
    @param.query.object('where', getWhereSchemaFor(PurchaseOrder)) where?: Where<PurchaseOrder>,
  ): Promise<Count> {
    return this.usersRepository.purchaseOrders(id).patch(purchaseOrder, where);
  }

  @del('/users/{id}/purchase-orders', {
    responses: {
      '200': {
        description: 'Users.PurchaseOrder DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(PurchaseOrder)) where?: Where<PurchaseOrder>,
  ): Promise<Count> {
    return this.usersRepository.purchaseOrders(id).delete(where);
  }
}
