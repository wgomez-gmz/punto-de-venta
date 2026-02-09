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
  PurchaseOrderItem,
} from '../models';
import {PurchaseOrderRepository} from '../repositories';

export class PurchaseOrderPurchaseOrderItemController {
  constructor(
    @repository(PurchaseOrderRepository) protected purchaseOrderRepository: PurchaseOrderRepository,
  ) { }

  @get('/purchase-orders/{id}/purchase-order-items', {
    responses: {
      '200': {
        description: 'Array of PurchaseOrder has many PurchaseOrderItem',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(PurchaseOrderItem)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<PurchaseOrderItem>,
  ): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderRepository.purchaseOrderItems(id).find(filter);
  }

  @post('/purchase-orders/{id}/purchase-order-items', {
    responses: {
      '200': {
        description: 'PurchaseOrder model instance',
        content: {'application/json': {schema: getModelSchemaRef(PurchaseOrderItem)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof PurchaseOrder.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderItem, {
            title: 'NewPurchaseOrderItemInPurchaseOrder',
            exclude: ['id'],
            optional: ['purchaseOrderId']
          }),
        },
      },
    }) purchaseOrderItem: Omit<PurchaseOrderItem, 'id'>,
  ): Promise<PurchaseOrderItem> {
    return this.purchaseOrderRepository.purchaseOrderItems(id).create(purchaseOrderItem);
  }

  @patch('/purchase-orders/{id}/purchase-order-items', {
    responses: {
      '200': {
        description: 'PurchaseOrder.PurchaseOrderItem PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderItem, {partial: true}),
        },
      },
    })
    purchaseOrderItem: Partial<PurchaseOrderItem>,
    @param.query.object('where', getWhereSchemaFor(PurchaseOrderItem)) where?: Where<PurchaseOrderItem>,
  ): Promise<Count> {
    return this.purchaseOrderRepository.purchaseOrderItems(id).patch(purchaseOrderItem, where);
  }

  @del('/purchase-orders/{id}/purchase-order-items', {
    responses: {
      '200': {
        description: 'PurchaseOrder.PurchaseOrderItem DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(PurchaseOrderItem)) where?: Where<PurchaseOrderItem>,
  ): Promise<Count> {
    return this.purchaseOrderRepository.purchaseOrderItems(id).delete(where);
  }
}
