import {hasMany, model, property} from '@loopback/repository';
import {BaseEntity} from './base-entity.model';
import {CampoFormulario} from './campo-formulario.model';

/**
 * Formulario model representing configurable forms
 */
@model()
export class Formulario extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  /**
   * Name of the form
   */
  @property({
    type: 'string',
    required: true,
  })
  nombre: string;

  /**
   * Description of the form
   */
  @property({
    type: 'string',
  })
  descripcion?: string;

  /**
   * Whether the form is active
   */
  @property({
    type: 'boolean',
    required: true,
    default: true,
  })
  activo: boolean;

  /**
    * Version of the form for tracking changes
    */
  @property({
    type: 'number',
    required: true,
    default: 1,
  })
  version: number;

  /**
    * Unique key identifier for the form
    */
  @property({
    type: 'string',
    required: true,
  })
  key: string;

  @hasMany(() => CampoFormulario)
  campoFormularios: CampoFormulario[];

  /**
   * Form fields associated with this form
   * /
  @hasMany(() => CampoFormulario, {keyTo: 'formularioId'})
  campos: CampoFormulario[];*/

  constructor(data?: Partial<Formulario>) {
    super(data);
  }
}

export interface FormularioRelations {
  //campos?: CampoFormulario[];
}

export type FormularioWithRelations = Formulario & FormularioRelations;
