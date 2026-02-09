import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {OpcionCampo, OpcionCampoRelations, CampoFormulario} from '../models';
import {CampoFormularioRepository} from './campo-formulario.repository';

export class OpcionCampoRepository extends DefaultCrudRepository<
  OpcionCampo,
  typeof OpcionCampo.prototype.id,
  OpcionCampoRelations
> {

  public readonly campoFormulario: BelongsToAccessor<CampoFormulario, typeof OpcionCampo.prototype.id>;
  /*public readonly campoFormulario: BelongsToAccessor<
    CampoFormulario,
    typeof OpcionCampo.prototype.id
  >;*/

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @inject.getter('repositories.CampoFormularioRepository')
    protected campoFormularioRepositoryGetter: Getter<CampoFormularioRepository>,
  ) {
    super(OpcionCampo, dataSource);
    this.campoFormulario = this.createBelongsToAccessorFor('campoFormulario', campoFormularioRepositoryGetter,);
    this.registerInclusionResolver('campoFormulario', this.campoFormulario.inclusionResolver);
    /*/this.campoFormulario = this.createBelongsToAccessorFor(
      'campoFormulario',
      campoFormularioRepositoryGetter,
    );*/
  }
}
