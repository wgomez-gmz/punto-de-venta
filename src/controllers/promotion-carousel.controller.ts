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
import {CreatePromotionCarouselDto, PromotionCarousel} from '../models';
import {PromotionCarouselRepository} from '../repositories';
import {AttachmentRepository} from '../repositories/attachment.repository';
import {decodeBase64Image, saveImageBuffer} from '../utils/file-utils';
import {getLocalDate} from '../utils/resource';

export class PromotionCarouselController {
  constructor(
    @repository(PromotionCarouselRepository)
    public promotionCarouselRepository: PromotionCarouselRepository,
    @repository(AttachmentRepository)
    public attachmentRepository: AttachmentRepository,
  ) { }

  @post('/promotion-carousel')
  @response(200, {
    description: 'PromotionCarousel model instance',
    content: {'application/json': {schema: getModelSchemaRef(PromotionCarousel)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['image'],
            properties: {
              image: {type: 'string'},
              title: {type: 'string'},
              description: {type: 'string'},
              enabled: {type: 'boolean'},
              startDate: {type: 'string', format: 'date'},
              endDate: {type: 'string', format: 'date'},
              order: {type: 'number'},
            },
          },
        },
      },
    })
    createPromotionCarouselDto: CreatePromotionCarouselDto,
  ): Promise<PromotionCarousel> {
    // Handle image upload
    const base64Image = createPromotionCarouselDto.image;
    const decodedImage = decodeBase64Image(base64Image);
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${decodedImage.extension}`;
    const url = await saveImageBuffer(decodedImage.buffer, fileName);

    const attachmentData = {
      mimeType: decodedImage.mimeType,
      url: url,
      fileName: fileName,
      size: decodedImage.buffer.length,
    };

    const savedAttachment = await this.attachmentRepository.create(attachmentData);

    // Process endDate if provided
    let processedEndDate = createPromotionCarouselDto.endDate;
    if (createPromotionCarouselDto.endDate) {
      // Parse date string as local date (YYYY-MM-DD) and set to end of day
      const [year, month, day] = createPromotionCarouselDto.endDate.split('-').map(Number);
      const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      processedEndDate = getLocalDate(endDate).toISOString().slice(0, 19).replace('T', ' ');
    }

    // Create promotion carousel
    const promotionCarouselData = {
      attachmentId: savedAttachment.id!,
      title: createPromotionCarouselDto.title,
      description: createPromotionCarouselDto.description,
      enabled: createPromotionCarouselDto.enabled ?? true,
      startDate: createPromotionCarouselDto.startDate,
      endDate: processedEndDate,
      order: createPromotionCarouselDto.order ?? 0,
    };

    return this.promotionCarouselRepository.create(promotionCarouselData);
  }

  @get('/promotion-carousel/count')
  @response(200, {
    description: 'PromotionCarousel model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(PromotionCarousel) where?: Where<PromotionCarousel>,
  ): Promise<Count> {
    return this.promotionCarouselRepository.count(where);
  }

  @get('/promotion-carousel')
  @response(200, {
    description: 'Paginated array of PromotionCarousel model instances',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: getModelSchemaRef(PromotionCarousel, {includeRelations: true}),
            },
            total: {type: 'number'},
            page: {type: 'number'},
            limit: {type: 'number'},
          },
        },
      },
    },
  })
  async find(
    @param.query.number('page') page: number = 1,
    @param.query.number('limit') limit: number = 10,
    @param.query.string('title') title?: string,
    @param.query.string('status') status?: 'active' | 'inactive' | 'all',
    @param.query.string('startDate') startDate?: string,
    @param.query.string('endDate') endDate?: string,
  ): Promise<{data: PromotionCarousel[]; total: number; page: number; limit: number}> {
    const offset = (page - 1) * limit;

    const where: any = {};

    if (title) {
      where.title = {like: `%${title}%`};
    }

    if (status && status !== 'all') {
      where.enabled = status === 'active';
    }

    if (startDate || endDate) {
      where.or = [];
      if (startDate) {
        where.or.push({startDate: {gte: startDate}});
      }
      if (endDate) {
        where.or.push({endDate: {lte: endDate}});
      }
    }

    const filter: Filter<PromotionCarousel> = {
      where,
      include: [{relation: 'attachment'}],
      limit,
      offset,
      order: ['order ASC', 'creationDate DESC'],
    };

    const [data, total] = await Promise.all([
      this.promotionCarouselRepository.find(filter),
      this.promotionCarouselRepository.count(where),
    ]);

    // Ensure dates are returned as formatted strings
    data.forEach(item => {
      if (item.startDate) {
        const date = typeof item.startDate === 'string' ? new Date(item.startDate) : item.startDate;
        item.startDate = date.toISOString().slice(0, 19).replace('T', ' ');
      }
      if (item.endDate) {
        const date = typeof item.endDate === 'string' ? new Date(item.endDate) : item.endDate;
        item.endDate = date.toISOString().slice(0, 19).replace('T', ' ');
      }
    });

    return {data, total: total.count, page, limit};
  }

  @get('/promotion-carousel/active')
  @response(200, {
    description: 'Array of active PromotionCarousel items within date range',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PromotionCarousel, {includeRelations: true}),
        },
      },
    },
  })
  async getActive(): Promise<PromotionCarousel[]> {
    const now = getLocalDate(new Date());
    const currentDateTime = now.toISOString().slice(0, 19).replace('T', ' ');

    const filter: Filter<PromotionCarousel> = {
      where: {
        and: [
          {enabled: true},
          {startDate: {lte: currentDateTime}},
          {
            or: [
              {endDate: {gte: currentDateTime}},
              {endDate: undefined}
            ]
          }
        ]
      },
      include: [{relation: 'attachment'}],
      order: ['order ASC'],
    };

    const data = await this.promotionCarouselRepository.find(filter);

    // Format dates
    data.forEach(item => {
      if (item.startDate) {
        const date = typeof item.startDate === 'string' ? new Date(item.startDate) : item.startDate;
        item.startDate = date.toISOString().slice(0, 19).replace('T', ' ');
      }
      if (item.endDate) {
        const date = typeof item.endDate === 'string' ? new Date(item.endDate) : item.endDate;
        item.endDate = date.toISOString().slice(0, 19).replace('T', ' ');
      }
    });

    return data;
  }

  @patch('/promotion-carousel')
  @response(200, {
    description: 'PromotionCarousel PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PromotionCarousel, {partial: true}),
        },
      },
    })
    promotionCarousel: PromotionCarousel,
    @param.where(PromotionCarousel) where?: Where<PromotionCarousel>,
  ): Promise<Count> {
    return this.promotionCarouselRepository.updateAll(promotionCarousel, where);
  }

  @get('/promotion-carousel/{id}')
  @response(200, {
    description: 'PromotionCarousel model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PromotionCarousel, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(PromotionCarousel, {exclude: 'where'}) filter?: FilterExcludingWhere<PromotionCarousel>
  ): Promise<PromotionCarousel> {
    const item = await this.promotionCarouselRepository.findById(id, filter);

    // Format dates
    if (item.startDate) {
      const date = typeof item.startDate === 'string' ? new Date(item.startDate) : item.startDate;
      item.startDate = date.toISOString().slice(0, 19).replace('T', ' ');
    }
    if (item.endDate) {
      const date = typeof item.endDate === 'string' ? new Date(item.endDate) : item.endDate;
      item.endDate = date.toISOString().slice(0, 19).replace('T', ' ');
    }

    return item;
  }

  @patch('/promotion-carousel/{id}')
  @response(204, {
    description: 'PromotionCarousel PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              title: {type: 'string'},
              description: {type: 'string'},
              enabled: {type: 'boolean'},
              startDate: {type: 'string'},
              endDate: {type: 'string'},
            },
          },
        },
      },
    })
    updateData: {title?: string; description?: string; enabled?: boolean; startDate?: string; endDate?: string},
  ): Promise<void> {
    // If endDate is provided, set it to 23:59:59.999 of that date
    if (updateData.endDate) {
      // Parse date string as local date (YYYY-MM-DD) and set to end of day
      const [year, month, day] = updateData.endDate.split('-').map(Number);
      const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      updateData.endDate = getLocalDate(endDate).toISOString().slice(0, 19).replace('T', ' ');
    }

    await this.promotionCarouselRepository.updateById(id, updateData);
  }

  @put('/promotion-carousel/{id}')
  @response(204, {
    description: 'PromotionCarousel PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              title: {type: 'string'},
              description: {type: 'string'},
              enabled: {type: 'boolean'},
              startDate: {type: 'string', format: 'date'},
              endDate: {type: 'string', format: 'date'},
            },
          },
        },
      },
    })
    updateData: {title?: string; description?: string; enabled?: boolean; startDate?: string; endDate?: string},
  ): Promise<void> {
    // If endDate is provided, set it to 23:59:59.999 of that date
    if (updateData.endDate) {
      // Parse date string as local date (YYYY-MM-DD) and set to end of day
      const [year, month, day] = updateData.endDate.split('-').map(Number);
      const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      updateData.endDate = getLocalDate(endDate).toISOString().slice(0, 19).replace('T', ' ');
    }

    await this.promotionCarouselRepository.updateById(id, updateData);
  }

  @del('/promotion-carousel/{id}')
  @response(204, {
    description: 'PromotionCarousel DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.promotionCarouselRepository.deleteById(id);
  }
}
