import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  CampoFormulario,
  Formulario,
} from '../models';
import {CampoFormularioRepository} from '../repositories';

export class CampoFormularioFormularioController {
  constructor(
    @repository(CampoFormularioRepository)
    public campoFormularioRepository: CampoFormularioRepository,
  ) { }

  @get('/campo-formularios/{id}/formulario', {
    responses: {
      '200': {
        description: 'Formulario belonging to CampoFormulario',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Formulario),
          },
        },
      },
    },
  })
  async getFormulario(
    @param.path.number('id') id: typeof CampoFormulario.prototype.id,
  ): Promise<Formulario> {
    return this.campoFormularioRepository.formulario(id);
  }
}
