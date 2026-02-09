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
import {PurchaseOrderItem} from '../models';
import {PurchaseOrderItemRepository} from '../repositories';

export class PurchaseOrderItemController {
  constructor(
    @repository(PurchaseOrderItemRepository)
    public purchaseOrderItemRepository : PurchaseOrderItemRepository,
  ) {}

  @post('/purchase-order-items')
  @response(200, {
    description: 'PurchaseOrderItem model instance',
    content: {'application/json': {schema: getModelSchemaRef(PurchaseOrderItem)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderItem, {
            title: 'NewPurchaseOrderItem',
            exclude: ['id'],
          }),
        },
      },
    })
    purchaseOrderItem: Omit<PurchaseOrderItem, 'id'>,
  ): Promise<PurchaseOrderItem> {
    return this.purchaseOrderItemRepository.create(purchaseOrderItem);
  }

  @get('/purchase-order-items/count')
  @response(200, {
    description: 'PurchaseOrderItem model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(PurchaseOrderItem) where?: Where<PurchaseOrderItem>,
  ): Promise<Count> {
    return this.purchaseOrderItemRepository.count(where);
  }

  @get('/purchase-order-items')
  @response(200, {
    description: 'Array of PurchaseOrderItem model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PurchaseOrderItem, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(PurchaseOrderItem) filter?: Filter<PurchaseOrderItem>,
  ): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderItemRepository.find(filter);
  }

  @patch('/purchase-order-items')
  @response(200, {
    description: 'PurchaseOrderItem PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderItem, {partial: true}),
        },
      },
    })
    purchaseOrderItem: PurchaseOrderItem,
    @param.where(PurchaseOrderItem) where?: Where<PurchaseOrderItem>,
  ): Promise<Count> {
    return this.purchaseOrderItemRepository.updateAll(purchaseOrderItem, where);
  }

  @get('/purchase-order-items/{id}')
  @response(200, {
    description: 'PurchaseOrderItem model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PurchaseOrderItem, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(PurchaseOrderItem, {exclude: 'where'}) filter?: FilterExcludingWhere<PurchaseOrderItem>
  ): Promise<PurchaseOrderItem> {
    return this.purchaseOrderItemRepository.findById(id, filter);
  }

  @patch('/purchase-order-items/{id}')
  @response(204, {
    description: 'PurchaseOrderItem PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderItem, {partial: true}),
        },
      },
    })
    purchaseOrderItem: PurchaseOrderItem,
  ): Promise<void> {
    await this.purchaseOrderItemRepository.updateById(id, purchaseOrderItem);
  }

  @put('/purchase-order-items/{id}')
  @response(204, {
    description: 'PurchaseOrderItem PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() purchaseOrderItem: PurchaseOrderItem,
  ): Promise<void> {
    await this.purchaseOrderItemRepository.replaceById(id, purchaseOrderItem);
  }

  @del('/purchase-order-items/{id}')
  @response(204, {
    description: 'PurchaseOrderItem DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.purchaseOrderItemRepository.deleteById(id);
  }
}
