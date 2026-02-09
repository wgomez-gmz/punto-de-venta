import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  PurchaseOrderResponse,
  PurchaseOrder,
} from '../models';
import {PurchaseOrderResponseRepository} from '../repositories';

export class PurchaseOrderResponsePurchaseOrderController {
  constructor(
    @repository(PurchaseOrderResponseRepository)
    public purchaseOrderResponseRepository: PurchaseOrderResponseRepository,
  ) { }

  @get('/purchase-order-responses/{id}/purchase-order', {
    responses: {
      '200': {
        description: 'PurchaseOrder belonging to PurchaseOrderResponse',
        content: {
          'application/json': {
            schema: getModelSchemaRef(PurchaseOrder),
          },
        },
      },
    },
  })
  async getPurchaseOrder(
    @param.path.number('id') id: typeof PurchaseOrderResponse.prototype.id,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrderResponseRepository.purchaseOrder(id);
  }
}
