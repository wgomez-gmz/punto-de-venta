import {
  repository,
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
} from '@loopback/rest';
import {
  Formulario,
} from '../models';
import {FormularioRepository} from '../repositories';

export class FormularioController {
  constructor(
    @repository(FormularioRepository)
    public formularioRepository: FormularioRepository,
  ) { }

  @get('/formularios/by-key/{key}', {
    responses: {
      '200': {
        description: 'Formulario with full structure by key',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Formulario),
          },
        },
      },
    },
  })
  async getFormByKey(
    @param.path.string('key') key: string,
  ): Promise<Formulario | null> {
    return this.formularioRepository.findOne({
      where: {key},
      include: [
        {
          relation: 'campoFormularios',
          scope: {
            include: [
              {
                relation: 'opcionCampos'
              }
            ]
          }
        }
      ]
    });
  }
}
