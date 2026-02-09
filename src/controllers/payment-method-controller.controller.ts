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
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {PaymentMethod, PaymentMethodFieldValue, PaymentMethodFormDto, PaymentMethodFormField} from '../models';
import {PaymentMethodFieldRepository, PaymentMethodFieldValueRepository, PaymentMethodRepository} from '../repositories';

export class PaymentMethodControllerController {
  constructor(
    @repository(PaymentMethodRepository)
    public paymentMethodRepository: PaymentMethodRepository,
    @repository(PaymentMethodFieldRepository)
    public paymentMethodFieldRepository: PaymentMethodFieldRepository,
    @repository(PaymentMethodFieldValueRepository)
    public paymentMethodFieldValueRepository: PaymentMethodFieldValueRepository,
  ) { }

  @post('/payment-methods')
  @response(200, {
    description: 'PaymentMethod model instance',
    content: {'application/json': {schema: getModelSchemaRef(PaymentMethod)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PaymentMethod, {
            title: 'NewPaymentMethod',
            exclude: ['id'],
          }),
        },
      },
    })
    paymentMethod: Omit<PaymentMethod, 'id'>,
  ): Promise<PaymentMethod> {
    return this.paymentMethodRepository.create(paymentMethod);
  }

  @get('/payment-methods/count')
  @response(200, {
    description: 'PaymentMethod model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(PaymentMethod) where?: Where<PaymentMethod>,
  ): Promise<Count> {
    return this.paymentMethodRepository.count(where);
  }

  @get('/payment-methods')
  @response(200, {
    description: 'Array of PaymentMethod model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PaymentMethod, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(PaymentMethod) filter?: Filter<PaymentMethod>,
  ): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find(filter);
  }

  @patch('/payment-methods')
  @response(200, {
    description: 'PaymentMethod PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PaymentMethod, {partial: true}),
        },
      },
    })
    paymentMethod: PaymentMethod,
    @param.where(PaymentMethod) where?: Where<PaymentMethod>,
  ): Promise<Count> {
    return this.paymentMethodRepository.updateAll(paymentMethod, where);
  }

  @get('/payment-methods/{id}')
  @response(200, {
    description: 'PaymentMethod model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PaymentMethod, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(PaymentMethod, {exclude: 'where'}) filter?: FilterExcludingWhere<PaymentMethod>
  ): Promise<PaymentMethod> {
    return this.paymentMethodRepository.findById(id, filter);
  }

  @patch('/payment-methods/{id}')
  @response(204, {
    description: 'PaymentMethod PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PaymentMethod, {partial: true}),
        },
      },
    })
    paymentMethod: PaymentMethod,
  ): Promise<void> {
    await this.paymentMethodRepository.updateById(id, paymentMethod);
  }

  @put('/payment-methods/{id}')
  @response(204, {
    description: 'PaymentMethod PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() paymentMethod: PaymentMethod,
  ): Promise<void> {
    await this.paymentMethodRepository.replaceById(id, paymentMethod);
  }

  @del('/payment-methods/{id}')
  @response(204, {
    description: 'PaymentMethod DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.paymentMethodRepository.deleteById(id);
  }

  @post('/payment-methods/{id}/values')
  @response(200, {
    description: 'Set values for payment method fields',
  })
  async setPaymentMethodValues(
    @param.path.number('id') paymentMethodId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              values: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    fieldId: {type: 'number'},
                    value: {type: 'string'},
                    isSandbox: {type: 'boolean', default: false},
                  },
                  required: ['fieldId', 'value'],
                },
              },
            },
            required: ['values'],
          },
        },
      },
    })
    body: {values: Array<{fieldId: number; value: string; isSandbox?: boolean}>},
  ): Promise<void> {
    // Delete existing values for this payment method
    await this.paymentMethodFieldValueRepository.deleteAll({
      paymentMethodId: paymentMethodId,
    });

    // Create new values
    for (const valueData of body.values) {
      await this.paymentMethodFieldValueRepository.create({
        paymentMethodId: paymentMethodId,
        paymentMethodFieldId: valueData.fieldId,
        value: valueData.value,
        isSandbox: valueData.isSandbox || false,
      });
    }
  }

  @get('/payment-methods/{id}/values')
  @response(200, {
    description: 'Get values for payment method fields',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PaymentMethodFieldValue),
        },
      },
    },
  })
  async getPaymentMethodValues(
    @param.path.number('id') paymentMethodId: number,
    @param.query.boolean('isSandbox') isSandbox?: boolean,
  ): Promise<PaymentMethodFieldValue[]> {
    const where: Where<PaymentMethodFieldValue> = {paymentMethodId};
    if (isSandbox !== undefined) {
      where.isSandbox = isSandbox;
    }
    return this.paymentMethodFieldValueRepository.find({where});
  }

  @get('/payment-methods/{id}/form')
  @response(200, {
    description: 'Get payment method form with field values',
    content: {'application/json': {schema: getModelSchemaRef(PaymentMethodFormDto)}},
  })
  async getPaymentMethodForm(
    @param.path.number('id') id: number,
  ): Promise<PaymentMethodFormDto> {
    const paymentMethod = await this.paymentMethodRepository.findById(id);

    if (!paymentMethod) {
      throw new Error(`Payment method with id ${id} not found`);
    }

    const fieldsData = await this.paymentMethodFieldRepository.find({
      where: {paymentMethodId: id},
    });

    const fields: PaymentMethodFormField[] = [];

    for (const field of fieldsData) {
      const valueRecord = await this.paymentMethodFieldValueRepository.findOne({
        where: {
          paymentMethodId: id,
          paymentMethodFieldId: field.id,
          isSandbox: paymentMethod.isSandbox,
        },
      });

      fields.push({
        id: field.id!,
        name: field.name,
        type: field.type,
        value: valueRecord ? valueRecord.value : '',
      });
    }

    return {
      paymentMethodId: paymentMethod.id!,
      paymentMethodName: paymentMethod.name,
      isSandbox: paymentMethod.isSandbox,
      fields,
    };
  }

  @patch('/payment-methods/{paymentMethodId}/form')
  @response(200, {
    description: 'Save payment method form field values',
  })
  async savePaymentMethodForm(
    @param.path.number('paymentMethodId') paymentMethodId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              isSandbox: {type: 'boolean'},
              fields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {type: 'number'},
                    value: {type: 'string'},
                  },
                  required: ['id', 'value'],
                },
              },
            },
            required: ['isSandbox', 'fields'],
          },
        },
      },
    })
    formData: {isSandbox: boolean; fields: Array<{id: number; value: string}>},
  ): Promise<void> {
    // Validate that the payment method exists
    const paymentMethod = await this.paymentMethodRepository.findById(paymentMethodId);
    if (!paymentMethod) {
      throw new Error(`Payment method with id ${paymentMethodId} not found`);
    }

    // Process each field
    for (const field of formData.fields) {
      // Check if value already exists
      const existingValue = await this.paymentMethodFieldValueRepository.findOne({
        where: {
          paymentMethodId: paymentMethodId,
          paymentMethodFieldId: field.id,
          isSandbox: formData.isSandbox,
        },
      });

      if (existingValue) {
        // Update existing value
        await this.paymentMethodFieldValueRepository.updateById(existingValue.id!, {
          value: field.value,
        });
      } else {
        // Create new value
        await this.paymentMethodFieldValueRepository.create({
          paymentMethodId: paymentMethodId,
          paymentMethodFieldId: field.id,
          value: field.value,
          isSandbox: formData.isSandbox,
        });
      }
    }
  }
}
