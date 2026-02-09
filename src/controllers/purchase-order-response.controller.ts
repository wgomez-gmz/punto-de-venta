import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {PurchaseOrderResponse} from '../models';
import {PurchaseOrderResponseRepository} from '../repositories';

export class PurchaseOrderResponseController {
  constructor(
    @repository(PurchaseOrderResponseRepository)
    public purchaseOrderResponseRepository : PurchaseOrderResponseRepository,
  ) {}

  @post('/purchase-order-responses')
  @response(200, {
    description: 'PurchaseOrderResponse model instance',
    content: {'application/json': {schema: getModelSchemaRef(PurchaseOrderResponse)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderResponse, {
            title: 'NewPurchaseOrderResponse',
            exclude: ['id'],
          }),
        },
      },
    })
    purchaseOrderResponse: Omit<PurchaseOrderResponse, 'id'>,
  ): Promise<PurchaseOrderResponse> {
    return this.purchaseOrderResponseRepository.create(purchaseOrderResponse);
  }

  @get('/purchase-order-responses/count')
  @response(200, {
    description: 'PurchaseOrderResponse model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(PurchaseOrderResponse) where?: Where<PurchaseOrderResponse>,
  ): Promise<Count> {
    return this.purchaseOrderResponseRepository.count(where);
  }

  @get('/purchase-order-responses')
  @response(200, {
    description: 'Array of PurchaseOrderResponse model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PurchaseOrderResponse, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(PurchaseOrderResponse) filter?: Filter<PurchaseOrderResponse>,
  ): Promise<PurchaseOrderResponse[]> {
    return this.purchaseOrderResponseRepository.find(filter);
  }

  @patch('/purchase-order-responses')
  @response(200, {
    description: 'PurchaseOrderResponse PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderResponse, {partial: true}),
        },
      },
    })
    purchaseOrderResponse: PurchaseOrderResponse,
    @param.where(PurchaseOrderResponse) where?: Where<PurchaseOrderResponse>,
  ): Promise<Count> {
    return this.purchaseOrderResponseRepository.updateAll(purchaseOrderResponse, where);
  }

  @get('/purchase-order-responses/{id}')
  @response(200, {
    description: 'PurchaseOrderResponse model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PurchaseOrderResponse, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(PurchaseOrderResponse, {exclude: 'where'}) filter?: FilterExcludingWhere<PurchaseOrderResponse>
  ): Promise<PurchaseOrderResponse> {
    return this.purchaseOrderResponseRepository.findById(id, filter);
  }

  @patch('/purchase-order-responses/{id}')
  @response(204, {
    description: 'PurchaseOrderResponse PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderResponse, {partial: true}),
        },
      },
    })
    purchaseOrderResponse: PurchaseOrderResponse,
  ): Promise<void> {
    await this.purchaseOrderResponseRepository.updateById(id, purchaseOrderResponse);
  }

  @put('/purchase-order-responses/{id}')
  @response(204, {
    description: 'PurchaseOrderResponse PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() purchaseOrderResponse: PurchaseOrderResponse,
  ): Promise<void> {
    await this.purchaseOrderResponseRepository.replaceById(id, purchaseOrderResponse);
  }

  @del('/purchase-order-responses/{id}')
  @response(204, {
    description: 'PurchaseOrderResponse DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.purchaseOrderResponseRepository.deleteById(id);
  }
}
