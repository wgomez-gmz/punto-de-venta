import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, HttpErrors, param, patch, post, requestBody, response} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {UserAddress} from '../models';
import {UserAddressRepository} from '../repositories';

const MEXICO_POSTAL_CODE_REGEX = /^(0[1-9]\d{3}|[1-9]\d{4})$/;

export class UserAddressControllerController {
  constructor(
    @repository(UserAddressRepository)
    public userAddressRepository: UserAddressRepository,
  ) { }

  @post('/postal-codes/validate')
  @response(200, {
    description: 'Postal code validation result',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            valid: {type: 'boolean'},
            message: {type: 'string'},
          },
        },
      },
    },
  })
  async validatePostalCode(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['postalCode'],
            properties: {
              postalCode: {type: 'string'},
            },
          },
        },
      },
    })
    body: {postalCode: string},
  ): Promise<{valid: boolean; message: string}> {
    return this.getPostalCodeValidation(body.postalCode);
  }

  @get('/users/me/addresses')
  @authenticate('jwt')
  @response(200, {
    description: 'Current user addresses',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(UserAddress),
        },
      },
    },
  })
  async findMyAddresses(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<UserAddress[]> {
    return this.userAddressRepository.find({
      where: {usersId: Number(currentUserProfile.id)},
      order: ['isDefault DESC', 'creationDate DESC'],
    });
  }

  @post('/users/me/addresses')
  @authenticate('jwt')
  @response(200, {
    description: 'Address created for current user',
    content: {'application/json': {schema: getModelSchemaRef(UserAddress)}},
  })
  async createMyAddress(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserAddress, {
            title: 'NewUserAddress',
            exclude: ['id', 'creationDate', 'usersId'],
          }),
        },
      },
    })
    address: Omit<UserAddress, 'id' | 'usersId'>,
  ): Promise<UserAddress> {
    this.ensureValidPostalCode(address.postalCode);
    const userId = Number(currentUserProfile.id);
    await this.ensureDefaultAddressState(userId, !!address.isDefault);
    return this.userAddressRepository.create({
      ...address,
      usersId: userId,
    });
  }

  @patch('/users/me/addresses/{id}')
  @authenticate('jwt')
  @response(200, {
    description: 'Address updated for current user',
    content: {'application/json': {schema: getModelSchemaRef(UserAddress)}},
  })
  async updateMyAddress(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserAddress, {
            partial: true,
            exclude: ['creationDate', 'usersId'],
          }),
        },
      },
    })
    address: Partial<UserAddress>,
  ): Promise<UserAddress> {
    const existingAddress = await this.ensureOwnership(id, Number(currentUserProfile.id));
    if (address.postalCode) {
      this.ensureValidPostalCode(address.postalCode);
    }
    if (address.isDefault) {
      await this.ensureDefaultAddressState(existingAddress.usersId, true, id);
    }
    await this.userAddressRepository.updateById(id, {
      ...address,
      updateDate: new Date().toISOString(),
    });
    return this.userAddressRepository.findById(id);
  }

  @del('/users/me/addresses/{id}')
  @authenticate('jwt')
  @response(204, {
    description: 'Address deleted for current user',
  })
  async deleteMyAddress(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<void> {
    const existingAddress = await this.ensureOwnership(id, Number(currentUserProfile.id));
    await this.userAddressRepository.deleteById(id);
    if (existingAddress.isDefault) {
      const replacement = await this.userAddressRepository.findOne({
        where: {usersId: existingAddress.usersId},
        order: ['creationDate DESC'],
      });
      if (replacement?.id) {
        await this.userAddressRepository.updateById(replacement.id, {isDefault: true});
      }
    }
  }

  @get('/addresses')
  @authenticate('jwt')
  @response(200, {
    description: 'Array of address instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(UserAddress, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(UserAddress) filter?: Filter<UserAddress>,
  ): Promise<UserAddress[]> {
    return this.userAddressRepository.find(filter);
  }

  @get('/addresses/count')
  @authenticate('jwt')
  @response(200, {
    description: 'Address count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(UserAddress) where?: Where<UserAddress>,
  ): Promise<Count> {
    return this.userAddressRepository.count(where);
  }

  @get('/addresses/{id}')
  @authenticate('jwt')
  @response(200, {
    description: 'Address instance',
    content: {'application/json': {schema: getModelSchemaRef(UserAddress, {includeRelations: true})}},
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(UserAddress, {exclude: 'where'}) filter?: FilterExcludingWhere<UserAddress>,
  ): Promise<UserAddress> {
    return this.userAddressRepository.findById(id, filter);
  }

  private getPostalCodeValidation(postalCode: string): {valid: boolean; message: string} {
    const normalizedPostalCode = String(postalCode || '').trim();
    if (!MEXICO_POSTAL_CODE_REGEX.test(normalizedPostalCode)) {
      return {
        valid: false,
        message: 'El codigo postal debe tener 5 digitos y corresponder al formato mexicano.',
      };
    }

    if (normalizedPostalCode === '00000') {
      return {
        valid: false,
        message: 'El codigo postal ingresado no es valido.',
      };
    }

    return {
      valid: true,
      message: 'Codigo postal valido.',
    };
  }

  private ensureValidPostalCode(postalCode: string): void {
    const validation = this.getPostalCodeValidation(postalCode);
    if (!validation.valid) {
      throw new HttpErrors.UnprocessableEntity(validation.message);
    }
  }

  private async ensureDefaultAddressState(userId: number, wantsDefault: boolean, excludeId?: number): Promise<void> {
    const addresses = await this.userAddressRepository.find({
      where: {usersId: userId},
    });
    const hasExistingAddresses = addresses.some(address => address.id !== excludeId);
    const shouldForceDefault = !hasExistingAddresses;
    if (wantsDefault || shouldForceDefault) {
      for (const address of addresses) {
        if (address.id !== excludeId && address.isDefault) {
          await this.userAddressRepository.updateById(address.id!, {isDefault: false});
        }
      }
    }
  }

  private async ensureOwnership(id: number, userId: number): Promise<UserAddress> {
    const address = await this.userAddressRepository.findById(id);
    if (address.usersId !== userId) {
      throw new HttpErrors.Forbidden('La direccion no pertenece al usuario autenticado.');
    }
    return address;
  }
}
