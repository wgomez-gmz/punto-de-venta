

import {TokenService, UserService} from '@loopback/authentication';
import {BindingKey} from '@loopback/context';
import {Users} from './models';
//import {EmailManager} from './services/email-service';
import {EmailService} from './services/email.service';
import {PasswordHasher} from './services/hash.password.bcryptjs';
import {Credentials} from './specs/user.specs';


export namespace TokenServiceConstants {
  export const TOKEN_SECRET_VALUE = 'myjwts3cr3t';
  export const TOKEN_EXPIRES_IN_VALUE = '3600';
}

export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.secret',
  );
  export const TOKEN_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.expires.in.seconds',
  );
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
}

export namespace PasswordHasherBindings {
  export const PASSWORD_HASHER = BindingKey.create<PasswordHasher>(
    'services.hasher',
  );
  export const ROUNDS = BindingKey.create<number>('services.hasher.round');
}

// export namespace PasswordHasherBindings {
//   export const PASSWORD_HASHER = BindingKey.create<PasswordHasher>(
//     'services.hasher',
//   );
//   export const ROUNDS = BindingKey.create<number>('services.hasher.round');
// }

export namespace UserServiceBindings {
  export const USER_SERVICE = BindingKey.create<UserService<Users, Credentials>>(
    'services.user.service',
  );
}

export namespace EmailServiceBindings {
  export const EMAIL_SERVICE = BindingKey.create<EmailService>(
    'services.email.service',
  );
}

/*export namespace EmailManagerBindings {
  export const SEND_MAIL = BindingKey.create<EmailManager>('services.email.service');
}*/

// export namespace MedicalRecordBindins {
//   export const MEDICAL_SERVICE = BindingKey.create<Object>(
//     'services.medical.record.service'
//   )
// }

// export const FILE_UPLOAD_SERVICE = BindingKey.create<FileUploadHandler>(
//   'services.FileUpload',
// );

// export namespace EmailManagerBindings {
//   export const SEND_MAIL = BindingKey.create<EmailManager>('services.email.service');
// }

/*export namespace EmailManagerBindings {
  export const SEND_MAIL = BindingKey.create<EmailManager>('services.email.send');
}

export const FILE_UPLOAD_SERVICE = BindingKey.create<FileUploadHandler>(
  'services.FileUpload',
);

export namespace SqlServerBindings {
  export const SQL_SERVER_SERVICE = BindingKey.create<SqlServerServices>(
    'services.sqlserver'
  );
}

export namespace BillingBindings {
  export const BILLING_SERVICE = BindingKey.create<BillingService>(
    'services.biling'
  );
}*/

/**
 * Binding key for the storage directory
 */
export const STORAGE_DIRECTORY = BindingKey.create<string>('storage.directory');
