import {RequestBodyParserOptions} from '@loopback/rest';

export type Credentials = {
  username: string;
  passwordUser: string;
};


export const schemaCreateUser = {
  type: 'object',
  required: ['username', 'name', 'firstLastName', 'passwordUser'],
  properties: {
    username: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    passwordUser: {
      type: 'string',
    },
    firstLastName: {
      type: 'string',
    },
    secondLastName: {
      type: 'string',
    },
    email: {
      type: 'string',
      //format: 'email',
    },

  },
};

export type userData = {
  id: number,
  username: string,
  passwordUser: string,
  status: number,
  name: string,
  firstLastName: string,
  secondLastName: string,
  birthday: string,
  phone: string,
  enterpriseEmail: string
  email: string,
  note: string
  userUpdateId: number,
  userCreateId: number,
  updateDate: Date
  emailgroupId?: number | undefined,
  emailGroupNameOtm?: string | undefined
}

export const requestBodyCreateUser: Partial<RequestBodyParserOptions> = {
  content: {
    'application/json': {
      schema: schemaCreateUser,
    },
  },
};
