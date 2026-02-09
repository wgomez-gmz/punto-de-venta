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
import {Role, RolePermission} from '../models';
import {PermissionRepository} from '../repositories/permission.repository';
import {RolePermissionRepository} from '../repositories/role-permission.repository';
import {RoleRepository} from '../repositories/role.repository';

export class RoleControllerController {
  constructor(
    @repository(RoleRepository)
    public roleRepository: RoleRepository,
    @repository(RolePermissionRepository)
    public rolePermissionRepository: RolePermissionRepository,
    @repository(PermissionRepository)
    public permissionRepository: PermissionRepository,
  ) { }

  @post('/roles')
  @response(200, {
    description: 'Role model instance',
    content: {'application/json': {schema: getModelSchemaRef(Role)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Role, {
            title: 'NewRole',
            exclude: ['id', 'creationDate'],
          }),
        },
      },
    })
    role: Omit<Role, 'id'>,
  ): Promise<Role> {
    return this.roleRepository.create(role);
  }

  @get('/roles/count')
  @response(200, {
    description: 'Role model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Role) where?: Where<Role>,
  ): Promise<Count> {
    return this.roleRepository.count(where);
  }

  @get('/roles')
  @response(200, {
    description: 'Array of Role model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Role, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Role) filter?: Filter<Role>,
  ): Promise<Role[]> {
    return this.roleRepository.find(filter);
  }

  @patch('/roles')
  @response(200, {
    description: 'Role PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Role, {partial: true}),
        },
      },
    })
    role: Role,
    @param.where(Role) where?: Where<Role>,
  ): Promise<Count> {
    return this.roleRepository.updateAll(role, where);
  }

  @get('/roles/{id}')
  @response(200, {
    description: 'Role model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Role, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Role, {exclude: 'where'}) filter?: FilterExcludingWhere<Role>
  ): Promise<Role> {
    return this.roleRepository.findById(id, filter);
  }

  @patch('/roles/{id}')
  @response(204, {
    description: 'Role PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Role, {partial: true, exclude: ['creationDate']}),
        },
      },
    })
    role: Role,
  ): Promise<void> {
    await this.roleRepository.updateById(id, role);
  }

  @put('/roles/{id}')
  @response(204, {
    description: 'Role PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Role, {
            exclude: ['creationDate'],
          }),
        },
      },
    })
    role: Omit<Role, 'creationDate'>,
  ): Promise<void> {
    await this.roleRepository.replaceById(id, role);
  }

  @del('/roles/{id}')
  @response(204, {
    description: 'Role DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.roleRepository.deleteById(id);
  }

  @post('/roles/{id}/permissions')
  @response(200, {
    description: 'Assign permission to role',
    content: {'application/json': {schema: getModelSchemaRef(RolePermission)}},
  })
  async assignPermission(
    @param.path.number('id') roleId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              permissionId: {type: 'number'},
            },
            required: ['permissionId'],
          },
        },
      },
    })
    data: {permissionId: number},
  ): Promise<RolePermission> {
    return this.rolePermissionRepository.create({
      roleId,
      permissionId: data.permissionId,
    });
  }

  @del('/roles/{roleId}/permissions/{permissionId}')
  @response(204, {
    description: 'Remove permission from role',
  })
  async removePermission(
    @param.path.number('roleId') roleId: number,
    @param.path.number('permissionId') permissionId: number,
  ): Promise<void> {
    await this.rolePermissionRepository.deleteAll({
      roleId,
      permissionId,
    });
  }

  @get('/roles/{id}/permissions')
  @response(200, {
    description: 'Array of Permission model instances for the role',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(RolePermission, {includeRelations: true}),
        },
      },
    },
  })
  async getRolePermissions(
    @param.path.number('id') id: number,
  ): Promise<RolePermission[]> {
    return this.rolePermissionRepository.find({
      where: {roleId: id},
      include: ['permission'],
    });
  }
}
