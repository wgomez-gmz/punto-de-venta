import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CampoFormulario, CampoFormularioRelations, Formulario, OpcionCampo} from '../models';
import {FormularioRepository} from './formulario.repository';
import {OpcionCampoRepository} from './opcion-campo.repository';

export class CampoFormularioRepository extends DefaultCrudRepository<
  CampoFormulario,
  typeof CampoFormulario.prototype.id,
  CampoFormularioRelations
> {

  public readonly formulario: BelongsToAccessor<Formulario, typeof CampoFormulario.prototype.id>;

  public readonly opcionCampos: HasManyRepositoryFactory<OpcionCampo, typeof CampoFormulario.prototype.id>;
  /*public readonly opciones: HasManyRepositoryFactory<
    OpcionCampo,
    typeof OpcionCampo.prototype.id
  >;

  public readonly formulario: BelongsToAccessor<
    Formulario,
    typeof CampoFormulario.prototype.id
  >;*/

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @inject.getter('repositories.OpcionCampoRepository')
    protected opcionCampoRepositoryGetter: Getter<OpcionCampoRepository>,
    @inject.getter('repositories.FormularioRepository')
    protected formularioRepositoryGetter: Getter<FormularioRepository>,
  ) {
    super(CampoFormulario, dataSource);
    this.opcionCampos = this.createHasManyRepositoryFactoryFor('opcionCampos', opcionCampoRepositoryGetter,);
    this.registerInclusionResolver('opcionCampos', this.opcionCampos.inclusionResolver);
    this.formulario = this.createBelongsToAccessorFor('formulario', formularioRepositoryGetter,);
    this.registerInclusionResolver('formulario', this.formulario.inclusionResolver);
    /*this.opciones = this.createHasManyRepositoryFactoryFor(
      'opciones',
      opcionCampoRepositoryGetter,
    );
    this.formulario = this.createBelongsToAccessorFor(
      'formulario',
      formularioRepositoryGetter,
    );*/
  }
}
