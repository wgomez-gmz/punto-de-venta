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
import {PurchaseOrder} from '../models';
import {CreatePurchaseOrderDto} from '../models/dto/create-purchase-order.dto';
import {PurchaseOrderRepository} from '../repositories';
import {UsersRepository} from '../repositories/users.repository';
import {PurchaseOrderService} from '../services';

export class PurchaseOrderController {
  constructor(
    @repository(PurchaseOrderRepository)
    public purchaseOrderRepository: PurchaseOrderRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @service() public purchaseOrderService: PurchaseOrderService,
    //@inject(SecurityBindings.USER) private currentUserProfile: UserProfile,
  ) { }

  @post('/purchase-orders')
  @authenticate('jwt')
  @response(200, {
    description: 'PurchaseOrder model instance',
    content: {'application/json': {schema: getModelSchemaRef(PurchaseOrder)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreatePurchaseOrderDto),
        },
      },
    })
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrderService.createPurchaseOrder(currentUserProfile, createPurchaseOrderDto);
  }

  @get('/purchase-orders/count')
  @response(200, {
    description: 'PurchaseOrder model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(PurchaseOrder) where?: Where<PurchaseOrder>,
  ): Promise<Count> {
    return this.purchaseOrderRepository.count(where);
  }

  @get('/purchase-orders')
  @response(200, {
    description: 'Array of PurchaseOrder model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PurchaseOrder, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(PurchaseOrder) filter?: Filter<PurchaseOrder>,
  ): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find(filter);
  }

  @patch('/purchase-orders')
  @response(200, {
    description: 'PurchaseOrder PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrder, {partial: true}),
        },
      },
    })
    purchaseOrder: PurchaseOrder,
    @param.where(PurchaseOrder) where?: Where<PurchaseOrder>,
  ): Promise<Count> {
    return this.purchaseOrderRepository.updateAll(purchaseOrder, where);
  }

  @get('/purchase-orders/{id}')
  @response(200, {
    description: 'PurchaseOrder model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PurchaseOrder, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(PurchaseOrder, {exclude: 'where'}) filter?: FilterExcludingWhere<PurchaseOrder>
  ): Promise<PurchaseOrder> {
    return this.purchaseOrderRepository.findById(id, filter);
  }

  @patch('/purchase-orders/{id}')
  @response(204, {
    description: 'PurchaseOrder PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrder, {partial: true}),
        },
      },
    })
    purchaseOrder: PurchaseOrder,
  ): Promise<void> {
    await this.purchaseOrderRepository.updateById(id, purchaseOrder);
  }

  @put('/purchase-orders/{id}')
  @response(204, {
    description: 'PurchaseOrder PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() purchaseOrder: PurchaseOrder,
  ): Promise<void> {
    await this.purchaseOrderRepository.replaceById(id, purchaseOrder);
  }

  @del('/purchase-orders/{id}')
  @response(204, {
    description: 'PurchaseOrder DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.purchaseOrderRepository.deleteById(id);
  }

  @get('/purchase-orders/{id}/detail')
  @authenticate('jwt')
  @response(200, {
    description: 'Detailed purchase order information for order view',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PurchaseOrder, {includeRelations: true}),
      },
    },
  })
  async getOrderDetail(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<PurchaseOrder> {
    // Get the order with all related data
    const order = await this.purchaseOrderRepository.findById(id, {
      include: [
        {
          relation: 'purchaseOrderItems'
        },
        {
          relation: 'currentStatus'
        },
        {
          relation: 'purchaseOrderHistory',
          scope: {
            order: ['creationDate DESC'],
            include: [
              {
                relation: 'user',
                scope: {
                  fields: ['id', 'username', 'email']
                }
              }
            ]
          }
        },
        {
          relation: 'purchaseOrderResponses'
        },
        {
          relation: 'users',
          scope: {
            fields: ['id', 'username', 'email'],
            include: [
              {
                relation: 'people',
                scope: {
                  fields: ['id', 'firstName', 'lastName', 'phone', 'address']
                }
              }
            ]
          }
        }
      ]
    });

    // Check if user owns this order or is admin
    console.log('user id', currentUserProfile.id);
    console.log('order user id', order.usersId);
    if (order.usersId !== currentUserProfile.id) {
      const user = await this.usersRepository.findById(currentUserProfile.id, {
        include: [{relation: 'role'}],
      });
      /*if (!user.role || user.role.key !== 'admin') {
        throw new Error('Access denied. You can only view your own orders.');
      }*/
    }

    return order;
  }

  @get('/purchase-orders/admin')
  @authenticate('jwt')
  @response(200, {
    description: 'Paginated array of PurchaseOrder model instances for admin with filtering',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: getModelSchemaRef(PurchaseOrder, {includeRelations: true}),
            },
            count: {
              type: 'number',
            },
            limit: {
              type: 'number',
            },
            offset: {
              type: 'number',
            },
          },
        },
      },
    },
  })
  async findForAdmin(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.filter(PurchaseOrder) filter?: Filter<PurchaseOrder>,
    @param.query.boolean('active') active?: boolean,
    @param.query.number('orderNumber') orderNumber?: number,
    @param.query.number('currentStatusId') currentStatusId?: number,
  ): Promise<{
    data: PurchaseOrder[];
    count: number;
    limit?: number;
    offset?: number;
  }> {
    // Check if user is admin or super_admin
    const user = await this.usersRepository.findById(currentUserProfile.id, {
      include: [{relation: 'role'}],
    });
    console.log('user role', user.role);
    if (!user.role || (user.role.key !== 'admin' && user.role.key !== 'super_admin')) {
      throw new Error('Access denied. Admin or Super Admin role required.');
    }

    // Build where clause
    const whereConditions: any[] = [];

    // Add existing filter conditions
    if (filter?.where) {
      whereConditions.push(filter.where);
    }

    // Filter by active status (currentStatusId references PurchaseOrderStatus with isActive = true)
    if (active !== undefined) {
      if (active) {
        whereConditions.push({currentStatusId: {neq: null}}); // Has an active status
      } else {
        whereConditions.push({currentStatusId: null}); // No current status (inactive)
      }
    }

    // Filter by order number (id)
    if (orderNumber !== undefined) {
      whereConditions.push({id: orderNumber});
    }

    // Filter by specific status ID
    if (currentStatusId !== undefined) {
      whereConditions.push({currentStatusId: currentStatusId});
    }

    const where = whereConditions.length > 1 ? {and: whereConditions} : whereConditions[0] || {};

    const include = [
      {
        relation: 'purchaseOrderItems'
      },
      {
        relation: 'currentStatus'
      },
      {
        relation: 'purchaseOrderHistory',
        scope: {
          order: ['creationDate DESC'],
          include: [
            {
              relation: 'user',
              scope: {
                fields: ['id', 'username', 'email']
              }
            }
          ]
        }
      },
      {
        relation: 'users',
        scope: {
          fields: ['id', 'username', 'email'],
          include: [
            {
              relation: 'people',
              scope: {
                fields: ['id', 'firstName', 'lastName', 'phone', 'address']
              }
            }
          ]
        }
      }
    ];

    const modifiedFilter = {
      ...filter,
      where,
      include: include,
      order: filter?.order || ['creationDate DESC']
    };

    const [data, count] = await Promise.all([
      this.purchaseOrderRepository.find(modifiedFilter),
      this.purchaseOrderRepository.count(where)
    ]);

    return {
      data,
      count: count.count,
      limit: filter?.limit,
      offset: filter?.offset
    };
  }

  @get('/purchase-orders/my')
  @authenticate('jwt')
  @response(200, {
    description: 'Paginated array of PurchaseOrder model instances for current user with detailed information',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: getModelSchemaRef(PurchaseOrder, {includeRelations: true}),
            },
            count: {
              type: 'number',
            },
            limit: {
              type: 'number',
            },
            offset: {
              type: 'number',
            },
          },
        },
      },
    },
  })
  async findMyOrders(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.filter(PurchaseOrder) filter?: Filter<PurchaseOrder>,
    @param.query.string('startDate') startDate?: string,
    @param.query.string('endDate') endDate?: string,
  ): Promise<{
    data: PurchaseOrder[];
    count: number;
    limit?: number;
    offset?: number;
  }> {
    // Build where clause for user's orders
    const whereConditions: any[] = [{usersId: currentUserProfile.id}];

    // Add existing filter conditions
    if (filter?.where) {
      whereConditions.push(filter.where);
    }

    // Add date range filtering if provided
    if (startDate) {
      // Parse DD/MM/YYYY format
      const parts = startDate.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JavaScript months are 0-based
        const year = parseInt(parts[2]);
        const start = new Date(year, month, day);
        if (!isNaN(start.getTime())) {
          whereConditions.push({creationDate: {gte: start}});
        }
      }
    }
    if (endDate) {
      // Parse DD/MM/YYYY format
      const parts = endDate.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JavaScript months are 0-based
        const year = parseInt(parts[2]);
        const end = new Date(year, month, day);
        if (!isNaN(end.getTime())) {
          // Set end date to end of day
          end.setHours(23, 59, 59, 999);
          whereConditions.push({creationDate: {lte: end}});
        }
      }
    }

    const where = whereConditions.length > 1 ? {and: whereConditions} : whereConditions[0] || {};

    const include = [
      {
        relation: 'purchaseOrderItems'
      },
      {
        relation: 'currentStatus'
      },
      {
        relation: 'purchaseOrderHistory',
        scope: {
          order: ['creationDate DESC'],
          include: [
            {
              relation: 'user',
              scope: {
                fields: ['id', 'username', 'email']
              }
            }
          ]
        }
      },
      {
        relation: 'users',
        scope: {
          fields: ['id', 'username', 'email']
        }
      }
    ];

    const modifiedFilter = {
      ...filter,
      where,
      include: include,
      order: filter?.order || ['creationDate DESC']
    };

    const [data, count] = await Promise.all([
      this.purchaseOrderRepository.find(modifiedFilter),
      this.purchaseOrderRepository.count(where)
    ]);

    return {
      data,
      count: count.count,
      limit: filter?.limit,
      offset: filter?.offset
    };
  }
}
