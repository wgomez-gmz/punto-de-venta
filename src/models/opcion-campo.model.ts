import {model, property, belongsTo} from '@loopback/repository';
import {BaseEntity} from './base-entity.model';
import {CampoFormulario} from './campo-formulario.model';

/**
 * OpcionCampo model representing field options for select, radio, checkbox fields
 */
@model()
export class OpcionCampo extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;
  /**
   * Option label (visible text)
   */
  @property({
    type: 'string',
    required: true,
  })
  etiqueta: string;

  /**
   * Option value (internal value)
   */
  @property({
    type: 'string',
    required: true,
  })
  valor: string;

  /**
   * Display order
   */
  @property({
    type: 'number',
    required: true,
  })
  orden: number;

  /**
   * Whether the option is active/visible
   */
  @property({
    type: 'boolean',
    required: true,
    default: true,
  })
  activo: boolean;

  @belongsTo(() => CampoFormulario)
  campoFormularioId: number;

  /**
   * Form field this option belongs to
   */
  /*@belongsTo(() => CampoFormulario)
  campoFormulario: CampoFormulario;*/

  constructor(data?: Partial<OpcionCampo>) {
    super(data);
  }
}

export interface OpcionCampoRelations {
  //campoFormulario?: CampoFormulario;
}

export type OpcionCampoWithRelations = OpcionCampo & OpcionCampoRelations;
