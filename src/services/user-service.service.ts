import { /* inject, */ BindingScope, injectable} from '@loopback/core';

import {UserService} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {PasswordHasherBindings} from '../keys';
import {Users} from '../models';
import {UsersRepository} from '../repositories';
import {Credentials} from '../specs/user.specs';
import {PasswordHasher} from './hash.password.bcryptjs';

@injectable({scope: BindingScope.TRANSIENT})
export class UserServiceService implements UserService<Users, Credentials> {
  constructor(
    @repository(UsersRepository) public userRepository: UsersRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
  ) { }
  /*
   * Add service methods here
   */

  async verifyCredentials(credentials: Credentials): Promise<Users> {
    const invalidCredentialsError = 'Usuario o contraseña invalidas.';
    // validateCredentials(credentials);

    const foundUser = await this.userRepository.findOne({
      fields: {
        id: true,
        username: true,
        status: true,
        emailVerified: true,
        roleId: true,
        //clientId: true,
        //acceptTerms: true,
        //contactXId:true
      },
      where: {username: String(credentials.username || '').trim().toLowerCase()},
      //where: {email: credentials.email},
      include: [{
        relation: 'people',

        scope: {

          fields: {
            id: true,
            name: true,
            firstLastName: true,
            secondLastName: true,
            phone: true,
            email: true,
            birthday: true
          }
        }
      }, {
        relation: 'role',
        scope: {
          fields: {
            id: true,
            name: true,
            key: true
          }
        }
      }]
    });

    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    } else {
      if (foundUser.emailVerified === false) {
        throw new HttpErrors.Unauthorized(
          'Debes verificar tu correo electronico antes de iniciar sesion.',
        );
      }
      if (foundUser.status == 0) {
        throw new HttpErrors.Unauthorized(
          'Tu cuenta no esta disponible para iniciar sesion.',
        );
      }
    }

    const credentialsFound = await this.userRepository.findCredentials(
      foundUser.id,
    );
    if (!credentialsFound) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const passwordMatched = await this.passwordHasher.comparePassword(
      credentials.passwordUser,
      credentialsFound.password,
    );

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }
    return foundUser;
  }

  convertToUserProfile(user: Users): UserProfile {
    // since first name and lastName are optional, no error is thrown if not provided
    return {
      [securityId]: String(user.id),
      username: user.username,
      //roles: user.role,
    };
  }





}
