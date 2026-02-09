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
  PurchaseOrder,
  PurchaseOrderStatus
} from '../models';
import {PurchaseOrderRepository} from '../repositories';

// This controller is no longer needed with the new single status approach
// Keeping it for backward compatibility but it should be deprecated

export class PurchaseOrderPurchaseOrderStatusController {
  constructor(
    @repository(PurchaseOrderRepository) protected purchaseOrderRepository: PurchaseOrderRepository,
  ) { }

  @get('/purchase-orders/{id}/purchase-order-statuses', {
    responses: {
      '200': {
        description: 'Array of PurchaseOrder has many PurchaseOrderStatus through PurchaseOrderHistory',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(PurchaseOrderStatus)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<PurchaseOrderStatus>,
  ): Promise<PurchaseOrderStatus[]> {
    // With the new single status approach, return the current status if it exists
    const order = await this.purchaseOrderRepository.findById(id, {
      include: [{
        relation: 'currentStatus',
        scope: filter
      }]
    });
    return order.currentStatus ? [order.currentStatus] : [];
  }

  @post('/purchase-orders/{id}/purchase-order-statuses', {
    responses: {
      '200': {
        description: 'create a PurchaseOrderStatus model instance',
        content: {'application/json': {schema: getModelSchemaRef(PurchaseOrderStatus)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof PurchaseOrder.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderStatus, {
            title: 'NewPurchaseOrderStatusInPurchaseOrder',
            exclude: ['id'],
          }),
        },
      },
    }) purchaseOrderStatus: Omit<PurchaseOrderStatus, 'id'>,
  ): Promise<PurchaseOrderStatus> {
    // With the new single status approach, this operation is not supported
    // Use the dedicated status update endpoint instead
    throw new Error('Direct status creation is not supported. Use the status update endpoint.');
  }

  @patch('/purchase-orders/{id}/purchase-order-statuses', {
    responses: {
      '200': {
        description: 'PurchaseOrder.PurchaseOrderStatus PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderStatus, {partial: true}),
        },
      },
    })
    purchaseOrderStatus: Partial<PurchaseOrderStatus>,
    @param.query.object('where', getWhereSchemaFor(PurchaseOrderStatus)) where?: Where<PurchaseOrderStatus>,
  ): Promise<Count> {
    // With the new single status approach, this operation is not supported
    // Use the dedicated status update endpoint instead
    throw new Error('Direct status patching is not supported. Use the status update endpoint.');
  }

  @del('/purchase-orders/{id}/purchase-order-statuses', {
    responses: {
      '200': {
        description: 'PurchaseOrder.PurchaseOrderStatus DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(PurchaseOrderStatus)) where?: Where<PurchaseOrderStatus>,
  ): Promise<Count> {
    // With the new single status approach, this operation is not supported
    // Status history is maintained for audit purposes
    throw new Error('Direct status deletion is not supported. Status history is preserved for audit purposes.');
  }
}
