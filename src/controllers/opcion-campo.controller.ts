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
import {OpcionCampo} from '../models';
import {OpcionCampoRepository} from '../repositories';

export class OpcionCampoController {
  constructor(
    @repository(OpcionCampoRepository)
    public opcionCampoRepository : OpcionCampoRepository,
  ) {}

  @post('/opcion-campos')
  @response(200, {
    description: 'OpcionCampo model instance',
    content: {'application/json': {schema: getModelSchemaRef(OpcionCampo)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OpcionCampo, {
            title: 'NewOpcionCampo',
            exclude: ['id'],
          }),
        },
      },
    })
    opcionCampo: Omit<OpcionCampo, 'id'>,
  ): Promise<OpcionCampo> {
    return this.opcionCampoRepository.create(opcionCampo);
  }

  @get('/opcion-campos/count')
  @response(200, {
    description: 'OpcionCampo model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(OpcionCampo) where?: Where<OpcionCampo>,
  ): Promise<Count> {
    return this.opcionCampoRepository.count(where);
  }

  @get('/opcion-campos')
  @response(200, {
    description: 'Array of OpcionCampo model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(OpcionCampo, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(OpcionCampo) filter?: Filter<OpcionCampo>,
  ): Promise<OpcionCampo[]> {
    return this.opcionCampoRepository.find(filter);
  }

  @patch('/opcion-campos')
  @response(200, {
    description: 'OpcionCampo PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OpcionCampo, {partial: true}),
        },
      },
    })
    opcionCampo: OpcionCampo,
    @param.where(OpcionCampo) where?: Where<OpcionCampo>,
  ): Promise<Count> {
    return this.opcionCampoRepository.updateAll(opcionCampo, where);
  }

  @get('/opcion-campos/{id}')
  @response(200, {
    description: 'OpcionCampo model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(OpcionCampo, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(OpcionCampo, {exclude: 'where'}) filter?: FilterExcludingWhere<OpcionCampo>
  ): Promise<OpcionCampo> {
    return this.opcionCampoRepository.findById(id, filter);
  }

  @patch('/opcion-campos/{id}')
  @response(204, {
    description: 'OpcionCampo PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OpcionCampo, {partial: true}),
        },
      },
    })
    opcionCampo: OpcionCampo,
  ): Promise<void> {
    await this.opcionCampoRepository.updateById(id, opcionCampo);
  }

  @put('/opcion-campos/{id}')
  @response(204, {
    description: 'OpcionCampo PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() opcionCampo: OpcionCampo,
  ): Promise<void> {
    await this.opcionCampoRepository.replaceById(id, opcionCampo);
  }

  @del('/opcion-campos/{id}')
  @response(204, {
    description: 'OpcionCampo DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.opcionCampoRepository.deleteById(id);
  }
}
