import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {PurchaseOrderStatus} from '../models';
import {UpdatePurchaseOrderStatusDto} from '../models/dto/update-purchase-order-status.dto';
import {PurchaseOrderStatusRepository} from '../repositories';
import {UsersRepository} from '../repositories/users.repository';
import {PurchaseOrderService} from '../services';

export class PurchaseOrderStatusController {
  constructor(
    @repository(PurchaseOrderStatusRepository)
    public purchaseOrderStatusRepository: PurchaseOrderStatusRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @service() public purchaseOrderService: PurchaseOrderService,
  ) { }

  @post('/purchase-order-statuses')
  @response(200, {
    description: 'PurchaseOrderStatus model instance',
    content: {'application/json': {schema: getModelSchemaRef(PurchaseOrderStatus)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderStatus, {
            title: 'NewPurchaseOrderStatus',
            exclude: ['id'],
          }),
        },
      },
    })
    purchaseOrderStatus: Omit<PurchaseOrderStatus, 'id'>,
  ): Promise<PurchaseOrderStatus> {
    return this.purchaseOrderStatusRepository.create(purchaseOrderStatus);
  }

  @get('/purchase-order-statuses/count')
  @response(200, {
    description: 'PurchaseOrderStatus model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(PurchaseOrderStatus) where?: Where<PurchaseOrderStatus>,
  ): Promise<Count> {
    return this.purchaseOrderStatusRepository.count(where);
  }

  @get('/purchase-order-statuses')
  @response(200, {
    description: 'Array of PurchaseOrderStatus model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PurchaseOrderStatus, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(PurchaseOrderStatus) filter?: Filter<PurchaseOrderStatus>,
  ): Promise<PurchaseOrderStatus[]> {
    return this.purchaseOrderStatusRepository.find(filter);
  }

  @patch('/purchase-order-statuses')
  @response(200, {
    description: 'PurchaseOrderStatus PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderStatus, {partial: true}),
        },
      },
    })
    purchaseOrderStatus: PurchaseOrderStatus,
    @param.where(PurchaseOrderStatus) where?: Where<PurchaseOrderStatus>,
  ): Promise<Count> {
    return this.purchaseOrderStatusRepository.updateAll(purchaseOrderStatus, where);
  }

  @get('/purchase-order-statuses/{id}')
  @response(200, {
    description: 'PurchaseOrderStatus model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PurchaseOrderStatus, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(PurchaseOrderStatus, {exclude: 'where'}) filter?: FilterExcludingWhere<PurchaseOrderStatus>
  ): Promise<PurchaseOrderStatus> {
    return this.purchaseOrderStatusRepository.findById(id, filter);
  }

  @patch('/purchase-order-statuses/{id}')
  @response(204, {
    description: 'PurchaseOrderStatus PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrderStatus, {partial: true}),
        },
      },
    })
    purchaseOrderStatus: PurchaseOrderStatus,
  ): Promise<void> {
    await this.purchaseOrderStatusRepository.updateById(id, purchaseOrderStatus);
  }

  @put('/purchase-order-statuses/{id}')
  @response(204, {
    description: 'PurchaseOrderStatus PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() purchaseOrderStatus: PurchaseOrderStatus,
  ): Promise<void> {
    await this.purchaseOrderStatusRepository.replaceById(id, purchaseOrderStatus);
  }

  @del('/purchase-order-statuses/{id}')
  @response(204, {
    description: 'PurchaseOrderStatus DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.purchaseOrderStatusRepository.deleteById(id);
  }

  @post('/purchase-order-statuses/update-purchase-order-status')
  @authenticate('jwt')
  @response(200, {
    description: 'Purchase order status updated successfully',
    content: {'application/json': {schema: {type: 'object'}}},
  })
  async updatePurchaseOrderStatus(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              purchaseOrderId: {type: 'number'},
              purchaseOrderStatusId: {type: 'number'},
            },
            required: ['purchaseOrderId', 'purchaseOrderStatusId'],
          },
        },
      },
    })
    updateStatusDto: UpdatePurchaseOrderStatusDto,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<{message: string; success: boolean}> {
    // Check if user is admin or super_admin
    const user = await this.usersRepository.findById(currentUserProfile.id, {
      include: [{relation: 'role'}],
    });
    if (!user.role || (user.role.key !== 'admin' && user.role.key !== 'super_admin')) {
      throw new Error('Access denied. Admin or Super Admin role required.');
    }

    // Validate that the purchase order exists
    const purchaseOrder = await this.purchaseOrderService.purchaseOrderRepository.findById(updateStatusDto.purchaseOrderId);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found.');
    }

    // Validate that the status exists
    const status = await this.purchaseOrderStatusRepository.findById(updateStatusDto.purchaseOrderStatusId);
    if (!status) {
      throw new Error('Purchase order status not found.');
    }

    // Get current purchase order to track previous status
    const currentOrder = await this.purchaseOrderService.purchaseOrderRepository.findById(updateStatusDto.purchaseOrderId);

    // Update the purchase order with new current status
    await this.purchaseOrderService.purchaseOrderRepository.updateById(updateStatusDto.purchaseOrderId, {
      currentStatusId: updateStatusDto.purchaseOrderStatusId
    });

    // Create history entry for the status change
    await this.purchaseOrderService.purchaseOrderHistoryRepository.create({
      purchaseOrderId: updateStatusDto.purchaseOrderId,
      previousStatusId: currentOrder.currentStatusId,
      newStatusId: updateStatusDto.purchaseOrderStatusId,
      userId: currentUserProfile.id, // Track who made the change
    });

    try {
      await this.purchaseOrderService.sendOrderStatusNotification(
        updateStatusDto.purchaseOrderId,
        status.name,
        status.key,
      );
    } catch (error) {
      console.error(`Notification failed [order-status:${updateStatusDto.purchaseOrderId}:${status.key}]`, error);
    }

    return {
      message: 'Purchase order status updated successfully',
      success: true,
    };
  }
}
