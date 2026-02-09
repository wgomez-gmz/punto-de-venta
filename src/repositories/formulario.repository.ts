import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Formulario, FormularioRelations, CampoFormulario} from '../models';
import {CampoFormularioRepository} from './campo-formulario.repository';

export class FormularioRepository extends DefaultCrudRepository<
  Formulario,
  typeof Formulario.prototype.id,
  FormularioRelations
> {

  public readonly campoFormularios: HasManyRepositoryFactory<CampoFormulario, typeof Formulario.prototype.id>;
  /*public readonly campos: HasManyRepositoryFactory<
    CampoFormulario,
    typeof CampoFormulario.prototype.id
  >;*/

  constructor(
    @inject('datasources.DB') dataSource: DbDataSource,
    @inject.getter('repositories.CampoFormularioRepository')
    protected campoFormularioRepositoryGetter: Getter<CampoFormularioRepository>,
  ) {
    super(Formulario, dataSource);
    this.campoFormularios = this.createHasManyRepositoryFactoryFor('campoFormularios', campoFormularioRepositoryGetter,);
    this.registerInclusionResolver('campoFormularios', this.campoFormularios.inclusionResolver);
    /*this.campos = this.createHasManyRepositoryFactoryFor(
      'campos',
      campoFormularioRepositoryGetter,
    );*/
  }
}
