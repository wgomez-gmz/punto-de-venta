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
  param,
  patch,
  post,
  put,
  requestBody,
  response,
  Response,
  RestBindings
} from '@loopback/rest';
import * as fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';
import {Attachment} from '../models';
import {AttachmentRepository} from '../repositories';

const readFileAsync = promisify(fs.readFile);

export class AttachmentControllerController {
  constructor(
    @repository(AttachmentRepository)
    public attachmentRepository: AttachmentRepository,
  ) { }

  @post('/attachments')
  @response(200, {
    description: 'Attachment model instance',
    content: {'application/json': {schema: getModelSchemaRef(Attachment)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Attachment, {
            title: 'NewAttachment',
            exclude: ['id', 'creationDate'],
          }),
        },
      },
    })
    attachment: Omit<Attachment, 'id'>,
  ): Promise<Attachment> {
    return this.attachmentRepository.create(attachment);
  }

  @get('/attachments/count')
  @response(200, {
    description: 'Attachment model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Attachment) where?: Where<Attachment>,
  ): Promise<Count> {
    return this.attachmentRepository.count(where);
  }

  @get('/attachments')
  @response(200, {
    description: 'Array of Attachment model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Attachment, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Attachment) filter?: Filter<Attachment>,
  ): Promise<Attachment[]> {
    return this.attachmentRepository.find(filter);
  }

  @patch('/attachments')
  @response(200, {
    description: 'Attachment PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Attachment, {partial: true}),
        },
      },
    })
    attachment: Attachment,
    @param.where(Attachment) where?: Where<Attachment>,
  ): Promise<Count> {
    return this.attachmentRepository.updateAll(attachment, where);
  }

  @get('/attachments/{id}')
  @response(200, {
    description: 'Attachment model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Attachment, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Attachment, {exclude: 'where'}) filter?: FilterExcludingWhere<Attachment>
  ): Promise<Attachment> {
    return this.attachmentRepository.findById(id, filter);
  }

  @get('/attachments/{id}/image')
  @response(200, {
    description: 'Attachment image file',
    content: {
      '*/*': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async getImage(
    @param.path.number('id') id: number,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<void> {
    const attachment = await this.attachmentRepository.findById(id);
    if (!attachment || !attachment.url) {
      response.status(404).send('Attachment not found or has no file');
      return;
    }

    // Set the content-type header based on the attachment's mimeType
    if (attachment.mimeType) {
      response.setHeader('Content-Type', attachment.mimeType);
    }

    // Set content-disposition to inline with filename to display in browser
    if (attachment.fileName) {
      response.setHeader('Content-Disposition', `inline; filename="${attachment.fileName}"`);
    }

    const filePath = path.join(process.cwd(), 'public', attachment.url);
    const buffer = await readFileAsync(filePath);
    response.send(buffer);
  }

  @get('/attachments/{id}/base64')
  @response(200, {
    description: 'Attachment image as base64 string',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            base64: {type: 'string'},
            mimeType: {type: 'string'},
            fileName: {type: 'string'},
          },
        },
      },
    },
  })
  async getImageBase64(@param.path.number('id') id: number): Promise<{base64: string; mimeType: string; fileName: string}> {
    const attachment = await this.attachmentRepository.findById(id);
    if (!attachment || !attachment.url) {
      throw new Error('Attachment not found or has no file');
    }

    const filePath = path.join(process.cwd(), 'public', attachment.url);
    const buffer = await readFileAsync(filePath);
    const base64 = buffer.toString('base64');

    return {
      base64: `data:${attachment.mimeType};base64,${base64}`,
      mimeType: attachment.mimeType || '',
      fileName: attachment.fileName || '',
    };
  }

  @patch('/attachments/{id}')
  @response(204, {
    description: 'Attachment PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Attachment, {partial: true, exclude: ['creationDate']}),
        },
      },
    })
    attachment: Attachment,
  ): Promise<void> {
    await this.attachmentRepository.updateById(id, attachment);
  }

  @put('/attachments/{id}')
  @response(204, {
    description: 'Attachment PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Attachment, {
            exclude: ['creationDate'],
          }),
        },
      },
    })
    attachment: Omit<Attachment, 'creationDate'>,
  ): Promise<void> {
    await this.attachmentRepository.replaceById(id, attachment);
  }

  @del('/attachments/{id}')
  @response(204, {
    description: 'Attachment DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.attachmentRepository.deleteById(id);
  }
}
