import {model, property, belongsTo, hasMany} from '@loopback/repository';
import {BaseEntity} from './base-entity.model';
import {Formulario} from './formulario.model';
import {OpcionCampo} from './opcion-campo.model';

/**
 * CampoFormulario model representing form fields
 */
@model()
export class CampoFormulario extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;
  /**
   * Field label
   */
  @property({
    type: 'string',
    required: true,
  })
  etiqueta: string;

  /**
   * Field type (text, email, select, radio, checkbox, textarea)
   */
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: ['text', 'email', 'select', 'radio', 'checkbox', 'textarea'],
    },
  })
  tipo: 'text' | 'email' | 'select' | 'radio' | 'checkbox' | 'textarea';

  /**
   * Placeholder text
   */
  @property({
    type: 'string',
  })
  placeholder?: string;

  /**
   * Whether the field is required
   */
  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  requerido: boolean;

  /**
   * Display order
   */
  @property({
    type: 'number',
    required: true,
  })
  orden: number;

  /**
   * Layout span (full, half, third)
   */
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: ['full', 'half', 'third'],
    },
  })
  layoutSpan: 'full' | 'half' | 'third';

  /**
   * Whether the field is visible
   */
  @property({
    type: 'boolean',
    required: true,
    default: true,
  })
  visible: boolean;

  /**
   * Field dependencies (JSON object)
   */
  @property({
    type: 'object',
  })
  dependencias?: object;

  /**
   * Field validation rules (JSON object)
   */
  @property({
    type: 'object',
  })
  validacion?: object;

  @belongsTo(() => Formulario)
  formularioId: number;

  @hasMany(() => OpcionCampo)
  opcionCampos: OpcionCampo[];

  /**
   * Form this field belongs to
   * /
  @belongsTo(() => Formulario)
  formulario: Formulario;*/

  /**
   * Field options for select, radio, checkbox types
   * /
  @hasMany(() => OpcionCampo, {keyTo: 'campoFormularioId'})
  opciones: OpcionCampo[];*/

  constructor(data?: Partial<CampoFormulario>) {
    super(data);
  }
}

export interface CampoFormularioRelations {
  //formulario?: Formulario;
  //opciones?: OpcionCampo[];
}

export type CampoFormularioWithRelations = CampoFormulario & CampoFormularioRelations;
