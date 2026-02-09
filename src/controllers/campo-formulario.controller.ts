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
import {CampoFormulario} from '../models';
import {CampoFormularioRepository} from '../repositories';

export class CampoFormularioController {
  constructor(
    @repository(CampoFormularioRepository)
    public campoFormularioRepository : CampoFormularioRepository,
  ) {}

  @post('/campo-formularios')
  @response(200, {
    description: 'CampoFormulario model instance',
    content: {'application/json': {schema: getModelSchemaRef(CampoFormulario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CampoFormulario, {
            title: 'NewCampoFormulario',
            exclude: ['id'],
          }),
        },
      },
    })
    campoFormulario: Omit<CampoFormulario, 'id'>,
  ): Promise<CampoFormulario> {
    return this.campoFormularioRepository.create(campoFormulario);
  }

  @get('/campo-formularios/count')
  @response(200, {
    description: 'CampoFormulario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(CampoFormulario) where?: Where<CampoFormulario>,
  ): Promise<Count> {
    return this.campoFormularioRepository.count(where);
  }

  @get('/campo-formularios')
  @response(200, {
    description: 'Array of CampoFormulario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CampoFormulario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(CampoFormulario) filter?: Filter<CampoFormulario>,
  ): Promise<CampoFormulario[]> {
    return this.campoFormularioRepository.find(filter);
  }

  @patch('/campo-formularios')
  @response(200, {
    description: 'CampoFormulario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CampoFormulario, {partial: true}),
        },
      },
    })
    campoFormulario: CampoFormulario,
    @param.where(CampoFormulario) where?: Where<CampoFormulario>,
  ): Promise<Count> {
    return this.campoFormularioRepository.updateAll(campoFormulario, where);
  }

  @get('/campo-formularios/{id}')
  @response(200, {
    description: 'CampoFormulario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CampoFormulario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(CampoFormulario, {exclude: 'where'}) filter?: FilterExcludingWhere<CampoFormulario>
  ): Promise<CampoFormulario> {
    return this.campoFormularioRepository.findById(id, filter);
  }

  @patch('/campo-formularios/{id}')
  @response(204, {
    description: 'CampoFormulario PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CampoFormulario, {partial: true}),
        },
      },
    })
    campoFormulario: CampoFormulario,
  ): Promise<void> {
    await this.campoFormularioRepository.updateById(id, campoFormulario);
  }

  @put('/campo-formularios/{id}')
  @response(204, {
    description: 'CampoFormulario PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() campoFormulario: CampoFormulario,
  ): Promise<void> {
    await this.campoFormularioRepository.replaceById(id, campoFormulario);
  }

  @del('/campo-formularios/{id}')
  @response(204, {
    description: 'CampoFormulario DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.campoFormularioRepository.deleteById(id);
  }
}
