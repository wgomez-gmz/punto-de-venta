import {TokenService, UserService} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {omit} from 'lodash';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {PasswordHasherBindings, TokenServiceBindings, UserServiceBindings} from '../keys';
import {People, Role, UserPermission, Users} from '../models';
import {CreateCustomerDto} from '../models/dto/create-customer.dto';
import {PermissionRepository, UserPermissionRepository, UsersRepository} from '../repositories';
import {RoleRepository} from '../repositories/role.repository';
import {UserAddressRepository} from '../repositories/user-address.repository';
import {PasswordHasher} from '../services/hash.password.bcryptjs';
import {Credentials, requestBodyCreateUser, userData} from '../specs/user.specs';

export class UserControllerController {
  constructor(
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(UserPermissionRepository)
    public userPermissionRepository: UserPermissionRepository,
    @repository(PermissionRepository)
    public permissionRepository: PermissionRepository,
    @repository(RoleRepository)
    public roleRepository: RoleRepository,
    @repository(UserAddressRepository)
    public userAddressRepository: UserAddressRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<Users, Credentials>,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
  ) { }

  @post('/users')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(Users)}},
  })
  async create(
    @requestBody(requestBodyCreateUser)
    user: userData,
  ): Promise<Users> {
    let password;
    const userCreateId = user.userCreateId;
    // let updateDate = user.updateDate
    const foundUser = await this.usersRepository.findOne({
      where: {username: user.username},
    });
    if (foundUser) {
      throw new HttpErrors[406](`Ya existe el usuario: ${user.username}`);
    }

    const people = {
      name: user.name.toUpperCase(),
      firstLastName: user.firstLastName.toUpperCase(),
      secondLastName: user.secondLastName.toUpperCase(),
      birthday: user.birthday,
      phone: user.phone,
      email: user.email,
      enterpriseEmail: user.enterpriseEmail,
      note: user.note,
      userCreateId: userCreateId,
    };

    const savedUser = await this.usersRepository.create(
      omit(user, [
        'passwordUser',
        'name',
        'firstLastName',
        'secondLastName',
        'birthday',
        'phone',
        'enterpriseEmail',
        'email',
        'userUpdateId',
        'updateDate',
      ]),
    );

    password = await this.passwordHasher.hashPassword(user.passwordUser);
    await this.usersRepository
      .userCredentials(savedUser.id)
      .create({password});

    await this.usersRepository.people(savedUser.id).create(people);
    return savedUser;
  }

  @post('/users/customer')
  @response(200, {
    description: 'Customer user model instance',
    content: {'application/json': {schema: getModelSchemaRef(Users)}},
  })
  async createCustomer(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'firstLastName', 'email', 'password'],
            properties: {
              name: {type: 'string'},
              firstLastName: {type: 'string'},
              secondLastName: {type: 'string'},
              birthday: {type: 'string', format: 'date'},
              phone: {type: 'string'},
              email: {type: 'string'},
              password: {type: 'string'},
            },
          },
        },
      },
    })
    customerData: CreateCustomerDto,
  ): Promise<Users> {
    // Check if username already exists (using email as username)
    const foundUser = await this.usersRepository.findOne({
      where: {username: customerData.email},
    });
    if (foundUser) {
      throw new HttpErrors[406](`Ya existe el usuario: ${customerData.email}`);
    }

    // Find customer role
    const customerRole = await this.roleRepository.findOne({
      where: {key: 'customer'},
    });
    if (!customerRole) {
      throw new HttpErrors[500]('Rol de cliente no encontrado');
    }

    // Create user
    const userData = {
      username: customerData.email,
      roleId: customerRole.id,
      status: 1, // Active
    };
    const savedUser = await this.usersRepository.create(userData);

    // Hash password and create user credentials
    const hashedPassword = await this.passwordHasher.hashPassword(customerData.password);
    await this.usersRepository
      .userCredentials(savedUser.id)
      .create({password: hashedPassword});

    // Create people
    const peopleData = {
      name: customerData.name.toUpperCase(),
      firstLastName: customerData.firstLastName.toUpperCase(),
      secondLastName: customerData.secondLastName?.toUpperCase(),
      birthday: customerData.birthday,
      phone: customerData.phone,
      email: customerData.email,
    };
    await this.usersRepository.people(savedUser.id).create(peopleData);

    return savedUser;
  }

  @post('/users/login')
  @response(200, {
    description: 'User login',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            token: {type: 'string'},
            user: getModelSchemaRef(Users),
            role: {
              ...getModelSchemaRef(Role),
              nullable: true,
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['username', 'passwordUser'],
            properties: {
              username: {type: 'string'},
              passwordUser: {type: 'string'},
            },
          },
        },
      },
    })
    credentials: Credentials,
  ): Promise<{token: string; user: Users; role: Role | null}> {
    const user = await this.userService.verifyCredentials(credentials);
    const userProfile = this.userService.convertToUserProfile(user);
    const token = await this.jwtService.generateToken(userProfile);

    // Get the role from the user relation (loaded by verifyCredentials)
    const role = (user as any).role || null;

    return {token, user, role};
  }

  @get('/users/me')
  @authenticate('jwt')
  @response(200, {
    description: 'Current authenticated user',
    content: {'application/json': {schema: getModelSchemaRef(Users, {includeRelations: true})}},
  })
  async getCurrentUser(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<Users> {
    return this.usersRepository.findById(Number(currentUserProfile.id), {
      include: [
        {relation: 'role'},
        {relation: 'people'},
        {relation: 'addresses'},
      ],
    });
  }

  @patch('/users/me/profile')
  @authenticate('jwt')
  @response(200, {
    description: 'Current authenticated user updated',
    content: {'application/json': {schema: getModelSchemaRef(Users, {includeRelations: true})}},
  })
  async updateCurrentUserProfile(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {type: 'string'},
              name: {type: 'string'},
              firstLastName: {type: 'string'},
              secondLastName: {type: 'string'},
              phone: {type: 'string'},
              birthday: {type: 'string', format: 'date'},
            },
          },
        },
      },
    })
    profileData: Partial<People> & {email?: string},
  ): Promise<Users> {
    const userId = Number(currentUserProfile.id);
    const currentUser = await this.usersRepository.findById(userId, {
      include: [{relation: 'people'}],
    });

    if (profileData.email) {
      const duplicatedUser = await this.usersRepository.findOne({
        where: {
          username: profileData.email,
          id: {neq: userId},
        },
      });
      if (duplicatedUser) {
        throw new HttpErrors.Conflict('El correo electronico ya esta registrado.');
      }
      await this.usersRepository.updateById(userId, {
        email: profileData.email,
        username: profileData.email,
      });
    }

    const peoplePayload: Partial<People> = {
      name: profileData.name?.toUpperCase(),
      firstLastName: profileData.firstLastName?.toUpperCase(),
      secondLastName: profileData.secondLastName?.toUpperCase(),
      phone: profileData.phone,
      birthday: profileData.birthday,
      email: profileData.email,
    };

    const cleanedPeoplePayload = Object.fromEntries(
      Object.entries(peoplePayload).filter(([, value]) => value !== undefined),
    );

    if ((currentUser as any).people?.id) {
      await this.usersRepository.people(userId).patch(cleanedPeoplePayload);
    } else if (Object.keys(cleanedPeoplePayload).length > 0) {
      await this.usersRepository.people(userId).create({
        ...cleanedPeoplePayload,
        email: profileData.email ?? currentUser.email ?? currentUser.username,
        name: profileData.name?.toUpperCase() ?? currentUser.username,
        firstLastName: profileData.firstLastName?.toUpperCase() ?? 'N/A',
      });
    }

    return this.getCurrentUser(currentUserProfile);
  }

  @get('/users/customers')
  @authenticate('jwt')
  @response(200, {
    description: 'Registered customers list for admin',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: getModelSchemaRef(Users, {includeRelations: true}),
            },
            count: {type: 'number'},
          },
        },
      },
    },
  })
  async getCustomers(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('search') search?: string,
    @param.query.number('status') status?: number,
  ): Promise<{data: Users[]; count: number}> {
    await this.ensureAdminAccess(Number(currentUserProfile.id));
    const customerRole = await this.roleRepository.findOne({
      where: {key: 'customer'},
    });
    if (!customerRole?.id) {
      return {data: [], count: 0};
    }

    const users = await this.usersRepository.find({
      where: {
        roleId: customerRole.id,
        ...(status !== undefined ? {status} : {}),
      },
      include: [
        {relation: 'people'},
        {relation: 'addresses'},
        {relation: 'role'},
      ],
      order: ['creationDate DESC'],
    });

    const normalizedSearch = String(search || '').trim().toLowerCase();
    const filteredUsers = normalizedSearch
      ? users.filter(user => {
        const people = (user as any).people;
        const candidateValues = [
          user.username,
          user.email,
          people?.name,
          people?.firstLastName,
          people?.secondLastName,
          people?.phone,
        ];
        return candidateValues.some(value => String(value || '').toLowerCase().includes(normalizedSearch));
      })
      : users;

    return {
      data: filteredUsers,
      count: filteredUsers.length,
    };
  }

  @patch('/users/{id}/status')
  @authenticate('jwt')
  @response(200, {
    description: 'User status updated',
    content: {'application/json': {schema: getModelSchemaRef(Users, {includeRelations: true})}},
  })
  async updateUserStatus(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status'],
            properties: {
              status: {type: 'number'},
            },
          },
        },
      },
    })
    body: {status: number},
  ): Promise<Users> {
    await this.ensureAdminAccess(Number(currentUserProfile.id));
    await this.usersRepository.updateById(id, {
      status: body.status,
    });
    return this.usersRepository.findById(id, {
      include: [
        {relation: 'people'},
        {relation: 'addresses'},
        {relation: 'role'},
      ],
    });
  }

  /*@post('/users')
  @response(200, {
    description: 'Users model instance',
    content: {'application/json': {schema: getModelSchemaRef(Users)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Users, {
            title: 'NewUsers',
            exclude: ['id'],
          }),
        },
      },
    })
    users: Omit<Users, 'id'>,
  ): Promise<Users> {
    return this.usersRepository.create(users);
  }*/

  @get('/users/count')
  @response(200, {
    description: 'Users model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Users) where?: Where<Users>,
  ): Promise<Count> {
    return this.usersRepository.count(where);
  }

  @get('/users')
  @response(200, {
    description: 'Array of Users model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Users, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Users) filter?: Filter<Users>,
  ): Promise<Users[]> {
    return this.usersRepository.find(filter);
  }

  @patch('/users')
  @response(200, {
    description: 'Users PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Users, {partial: true}),
        },
      },
    })
    users: Users,
    @param.where(Users) where?: Where<Users>,
  ): Promise<Count> {
    return this.usersRepository.updateAll(users, where);
  }

  @get('/users/{id}')
  @response(200, {
    description: 'Users model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Users, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Users, {exclude: 'where'}) filter?: FilterExcludingWhere<Users>
  ): Promise<Users> {
    return this.usersRepository.findById(id, filter);
  }

  @patch('/users/{id}')
  @response(204, {
    description: 'Users PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Users, {partial: true, exclude: ['creationDate']}),
        },
      },
    })
    users: Users,
  ): Promise<void> {
    await this.usersRepository.updateById(id, users);
  }

  @put('/users/{id}')
  @response(204, {
    description: 'Users PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Users, {
            exclude: ['creationDate'],
          }),
        },
      },
    })
    users: Omit<Users, 'creationDate'>,
  ): Promise<void> {
    await this.usersRepository.replaceById(id, users);
  }

  @del('/users/{id}')
  @response(204, {
    description: 'Users DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.usersRepository.deleteById(id);
  }

  @post('/users/{id}/permissions')
  @response(200, {
    description: 'Assign permission to user',
    content: {'application/json': {schema: getModelSchemaRef(UserPermission)}},
  })
  async assignPermission(
    @param.path.number('id') userId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              permissionId: {type: 'number'},
            },
            required: ['permissionId'],
          },
        },
      },
    })
    data: {permissionId: number},
  ): Promise<UserPermission> {
    return this.userPermissionRepository.create({
      usersId: userId,
      permissionId: data.permissionId,
    });
  }

  @del('/users/{userId}/permissions/{permissionId}')
  @response(204, {
    description: 'Remove permission from user',
  })
  async removePermission(
    @param.path.number('userId') userId: number,
    @param.path.number('permissionId') permissionId: number,
  ): Promise<void> {
    await this.userPermissionRepository.deleteAll({
      usersId: userId,
      permissionId,
    });
  }

  @get('/users/{id}/permissions')
  @response(200, {
    description: 'Array of Permission model instances for the user',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(UserPermission, {includeRelations: true}),
        },
      },
    },
  })
  async getUserPermissions(
    @param.path.number('id') id: number,
  ): Promise<UserPermission[]> {
    return this.userPermissionRepository.find({
      where: {usersId: id},
      include: ['permission'],
    });
  }

  private async ensureAdminAccess(userId: number): Promise<void> {
    const user = await this.usersRepository.findById(userId, {
      include: [{relation: 'role'}],
    });
    const roleKey = (user as any).role?.key;
    if (!roleKey || !['admin', 'administrator', 'super_admin', 'store_admin'].includes(roleKey)) {
      throw new HttpErrors.Forbidden('No tienes permisos para realizar esta accion.');
    }
  }
}
