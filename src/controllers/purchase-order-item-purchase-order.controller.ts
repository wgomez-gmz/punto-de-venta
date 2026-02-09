import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  PurchaseOrderItem,
  PurchaseOrder,
} from '../models';
import {PurchaseOrderItemRepository} from '../repositories';

export class PurchaseOrderItemPurchaseOrderController {
  constructor(
    @repository(PurchaseOrderItemRepository)
    public purchaseOrderItemRepository: PurchaseOrderItemRepository,
  ) { }

  @get('/purchase-order-items/{id}/purchase-order', {
    responses: {
      '200': {
        description: 'PurchaseOrder belonging to PurchaseOrderItem',
        content: {
          'application/json': {
            schema: getModelSchemaRef(PurchaseOrder),
          },
        },
      },
    },
  })
  async getPurchaseOrder(
    @param.path.number('id') id: typeof PurchaseOrderItem.prototype.id,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrderItemRepository.purchaseOrder(id);
  }
}
