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
  CampoFormulario,
  OpcionCampo,
} from '../models';
import {CampoFormularioRepository} from '../repositories';

export class CampoFormularioOpcionCampoController {
  constructor(
    @repository(CampoFormularioRepository) protected campoFormularioRepository: CampoFormularioRepository,
  ) { }

  @get('/campo-formularios/{id}/opcion-campos', {
    responses: {
      '200': {
        description: 'Array of CampoFormulario has many OpcionCampo',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(OpcionCampo)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<OpcionCampo>,
  ): Promise<OpcionCampo[]> {
    return this.campoFormularioRepository.opcionCampos(id).find(filter);
  }

  @post('/campo-formularios/{id}/opcion-campos', {
    responses: {
      '200': {
        description: 'CampoFormulario model instance',
        content: {'application/json': {schema: getModelSchemaRef(OpcionCampo)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof CampoFormulario.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OpcionCampo, {
            title: 'NewOpcionCampoInCampoFormulario',
            exclude: ['id', 'creationDate'],
            optional: ['campoFormularioId']
          }),
        },
      },
    }) opcionCampo: Omit<OpcionCampo, 'id'>,
  ): Promise<OpcionCampo> {
    return this.campoFormularioRepository.opcionCampos(id).create(opcionCampo);
  }

  @patch('/campo-formularios/{id}/opcion-campos', {
    responses: {
      '200': {
        description: 'CampoFormulario.OpcionCampo PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OpcionCampo, {partial: true}),
        },
      },
    })
    opcionCampo: Partial<OpcionCampo>,
    @param.query.object('where', getWhereSchemaFor(OpcionCampo)) where?: Where<OpcionCampo>,
  ): Promise<Count> {
    return this.campoFormularioRepository.opcionCampos(id).patch(opcionCampo, where);
  }

  @del('/campo-formularios/{id}/opcion-campos', {
    responses: {
      '200': {
        description: 'CampoFormulario.OpcionCampo DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(OpcionCampo)) where?: Where<OpcionCampo>,
  ): Promise<Count> {
    return this.campoFormularioRepository.opcionCampos(id).delete(where);
  }
}
