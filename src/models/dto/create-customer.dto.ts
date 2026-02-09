export class CreateCustomerDto {
  // People fields
  name: string;
  firstLastName: string;
  secondLastName?: string;
  birthday?: Date;
  phone?: string;
  email: string;

  // Credentials
  password: string;
}
