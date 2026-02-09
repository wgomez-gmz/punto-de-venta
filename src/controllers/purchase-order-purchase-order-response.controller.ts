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
  PurchaseOrderResponse,
} from '../models';
import {PurchaseOrderRepository} from '../repositories';

export class PurchaseOrderPurchaseOrderResponseController {
  constructor(
    @repository(PurchaseOrderRepository) protected purchaseOrderRepository: PurchaseOrderRepository,
  ) { }

  @get('/purchase-orders/{id}/purchase-order-responses', {
    responses: {
      '200': {
        description: 'Array of PurchaseOrder has many PurchaseOrderResponse',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(PurchaseOrderResponse)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<PurchaseOrderResponse>,
  ): Promise<PurchaseOrderResponse[]> {
    return this.purchaseOrderRepository.purchaseOrderResponses(id).find(filter);
  }

  @post('/purchase-orders/{id}/purchase-order-responses', {
    responses: {
      '200': {
        description: 'PurchaseOrder model instance',
        content: {'application/json': {schema: getModelSchemaRef(PurchaseOrderResponse)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof PurchaseOrder.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderResponse, {
            title: 'NewPurchaseOrderResponseInPurchaseOrder',
            exclude: ['id'],
            optional: ['purchaseOrderId']
          }),
        },
      },
    }) purchaseOrderResponse: Omit<PurchaseOrderResponse, 'id'>,
  ): Promise<PurchaseOrderResponse> {
    return this.purchaseOrderRepository.purchaseOrderResponses(id).create(purchaseOrderResponse);
  }

  @patch('/purchase-orders/{id}/purchase-order-responses', {
    responses: {
      '200': {
        description: 'PurchaseOrder.PurchaseOrderResponse PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderResponse, {partial: true}),
        },
      },
    })
    purchaseOrderResponse: Partial<PurchaseOrderResponse>,
    @param.query.object('where', getWhereSchemaFor(PurchaseOrderResponse)) where?: Where<PurchaseOrderResponse>,
  ): Promise<Count> {
    return this.purchaseOrderRepository.purchaseOrderResponses(id).patch(purchaseOrderResponse, where);
  }

  @del('/purchase-orders/{id}/purchase-order-responses', {
    responses: {
      '200': {
        description: 'PurchaseOrder.PurchaseOrderResponse DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(PurchaseOrderResponse)) where?: Where<PurchaseOrderResponse>,
  ): Promise<Count> {
    return this.purchaseOrderRepository.purchaseOrderResponses(id).delete(where);
  }
}
