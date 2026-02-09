import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  OpcionCampo,
  CampoFormulario,
} from '../models';
import {OpcionCampoRepository} from '../repositories';

export class OpcionCampoCampoFormularioController {
  constructor(
    @repository(OpcionCampoRepository)
    public opcionCampoRepository: OpcionCampoRepository,
  ) { }

  @get('/opcion-campos/{id}/campo-formulario', {
    responses: {
      '200': {
        description: 'CampoFormulario belonging to OpcionCampo',
        content: {
          'application/json': {
            schema: getModelSchemaRef(CampoFormulario),
          },
        },
      },
    },
  })
  async getCampoFormulario(
    @param.path.number('id') id: typeof OpcionCampo.prototype.id,
  ): Promise<CampoFormulario> {
    return this.opcionCampoRepository.campoFormulario(id);
  }
}
