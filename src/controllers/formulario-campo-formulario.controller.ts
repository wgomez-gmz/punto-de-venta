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
  Formulario,
} from '../models';
import {FormularioRepository} from '../repositories';

export class FormularioCampoFormularioController {
  constructor(
    @repository(FormularioRepository) protected formularioRepository: FormularioRepository,
  ) { }

  @get('/formularios/{id}/campo-formularios', {
    responses: {
      '200': {
        description: 'Array of Formulario has many CampoFormulario',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(CampoFormulario)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<CampoFormulario>,
  ): Promise<CampoFormulario[]> {
    return this.formularioRepository.campoFormularios(id).find(filter);
  }

  @post('/formularios/{id}/campo-formularios', {
    responses: {
      '200': {
        description: 'Formulario model instance',
        content: {'application/json': {schema: getModelSchemaRef(CampoFormulario)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Formulario.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CampoFormulario, {
            title: 'NewCampoFormularioInFormulario',
            exclude: ['id', 'creationDate'],
            optional: ['formularioId']
          }),
        },
      },
    }) campoFormulario: Omit<CampoFormulario, 'id'>,
  ): Promise<CampoFormulario> {
    return this.formularioRepository.campoFormularios(id).create(campoFormulario);
  }

  @patch('/formularios/{id}/campo-formularios', {
    responses: {
      '200': {
        description: 'Formulario.CampoFormulario PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CampoFormulario, {partial: true}),
        },
      },
    })
    campoFormulario: Partial<CampoFormulario>,
    @param.query.object('where', getWhereSchemaFor(CampoFormulario)) where?: Where<CampoFormulario>,
  ): Promise<Count> {
    return this.formularioRepository.campoFormularios(id).patch(campoFormulario, where);
  }

  @del('/formularios/{id}/campo-formularios', {
    responses: {
      '200': {
        description: 'Formulario.CampoFormulario DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(CampoFormulario)) where?: Where<CampoFormulario>,
  ): Promise<Count> {
    return this.formularioRepository.campoFormularios(id).delete(where);
  }
}
