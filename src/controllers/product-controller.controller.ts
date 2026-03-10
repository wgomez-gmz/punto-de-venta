import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where
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
import {CreateProductDto, Product, ProductDto} from '../models';
import {AttachmentRepository, ProductRepository, ProductReviewRepository} from '../repositories';
import {ProductAttributeRepository} from '../repositories/product-attribute.repository';
import {ProductCategoriesRepository} from '../repositories/product-categories.repository';
import {ProductImagesRepository} from '../repositories/product-images.repository';
import {ProductVariationRepository} from '../repositories/product-variation.repository';
import {ProductServiceService} from '../services';
import {decodeBase64Image, saveImageBuffer} from '../utils/file-utils';

export class ProductControllerController {
  constructor(
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(AttachmentRepository)
    public attachmentRepository: AttachmentRepository,
    @repository(ProductCategoriesRepository)
    public productCategoriesRepository: ProductCategoriesRepository,
    @repository(ProductImagesRepository)
    public productImagesRepository: ProductImagesRepository,
    @repository(ProductAttributeRepository)
    public productAttributeRepository: ProductAttributeRepository,
    @repository(ProductVariationRepository)
    public productVariationRepository: ProductVariationRepository,
    @repository(ProductReviewRepository)
    public productReviewRepository: ProductReviewRepository,
    @service() public productServiceService: ProductServiceService,
  ) { }

  @post('/products')
  @response(200, {
    description: 'Product model instance',
    content: {'application/json': {schema: getModelSchemaRef(Product)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreateProductDto),
        },
      },
    })
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    // Create the product
    const productData = {
      name: createProductDto.name,
      price: createProductDto.price,
      discountedPrice: createProductDto.discountedPrice,
      discountStartDate: createProductDto.discountStartDate,
      discountEndDate: createProductDto.discountEndDate,
      sku: createProductDto.sku,
      gtin: createProductDto.gtin,
      discountScheduled: createProductDto.discountScheduled,
      stock: createProductDto.stock,
      shortDescription: createProductDto.shortDescription,
      completeDescription: createProductDto.completeDescription,
    };

    const product = await this.productRepository.create(productData);

    // Handle categories
    if (createProductDto.categories && createProductDto.categories.length > 0) {
      for (const categoryId of createProductDto.categories) {
        await this.productCategoriesRepository.create({
          productId: product.id!,
          categoryId: categoryId,
        });
      }
    }

    // Handle images if provided
    if (createProductDto.images && createProductDto.images.length > 0) {
      for (let i = 0; i < createProductDto.images.length; i++) {
        const base64Image = createProductDto.images[i];
        try {
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

          // Create ProductImages entry
          const productImageData = {
            productId: product.id!,
            attachmentId: savedAttachment.id!,
            isMain: i === 0, // First image is main
            order: i,
            enabled: true,
          };

          await this.productImagesRepository.create(productImageData);
        } catch (error) {
          console.error(`Error processing image ${i}:`, error);
          // Continue with other images
        }
      }
    }

    // Handle attributes if provided
    if (createProductDto.attributes && createProductDto.attributes.length > 0) {
      for (const attribute of createProductDto.attributes) {
        await this.productAttributeRepository.create({
          productId: product.id!,
          name: attribute.name,
          value: attribute.value,
          visible: attribute.visible,
          usedInVariations: attribute.usedInVariations,
        });
      }
    }

    // Handle variations if provided
    if (createProductDto.variations && createProductDto.variations.length > 0) {
      for (const variation of createProductDto.variations) {
        await this.productVariationRepository.create({
          productId: product.id!,
          combination: variation.combination,
          stock: variation.stock,
          price: variation.price,
          discountedPrice: variation.discountedPrice,
          discountStartDate: variation.discountStartDate,
          discountEndDate: variation.discountEndDate,
          sku: variation.sku,
          discountScheduled: variation.discountScheduled,
        });
      }
    }

    return product;
  }

  @get('/products/count')
  @response(200, {
    description: 'Product model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Product) where?: Where<Product>,
  ): Promise<Count> {
    return this.productRepository.count(where);
  }

  @get('/products')
  @response(200, {
    description: 'Array of Product model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ProductDto),
        },
      },
    },
  })
  async find(
    @param.filter(Product) filter?: Filter<Product>,
  ): Promise<ProductDto[]> {
    // Set default limit to 12 for pagination
    if (!filter) {
      filter = {limit: 12};
    } else if (filter.limit === undefined) {
      filter.limit = 12;
    }

    const products = await this.productRepository.find(filter);
    return Promise.all(products.map(async product => {
      product.categories = await this.productRepository.categories(product.id!).find();
      //product.attachments = await this.productRepository.attachments(product.id!).find();
      //product.attributes = await this.productRepository.attributes(product.id!).find();
      //product.variations = await this.productRepository.variations(product.id!).find();

      // Compute AttachmentId from ProductImages with lowest order and enabled=true
      const productImages = await this.productImagesRepository.find({
        where: {productId: product.id},
      });
      const enabledImages = productImages.filter(pi => pi.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
      const attachmentId = enabledImages.length > 0 ? enabledImages[0].attachmentId : 0;

      return {
        ...product,
        attachmentId: attachmentId,
        ...(await this.getReviewSummary(product.id!)),
      } as ProductDto;
    }));
  }

  private async getReviewSummary(productId: number): Promise<{rating: number; reviewCount: number}> {
    const reviews = await this.productReviewRepository.find({where: {productId}});
    if (reviews.length === 0) {
      return {rating: 0, reviewCount: 0};
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return {
      rating: Number((totalRating / reviews.length).toFixed(1)),
      reviewCount: reviews.length,
    };
  }

  @patch('/products')
  @response(200, {
    description: 'Product PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Product, {partial: true}),
        },
      },
    })
    product: Product,
    @param.where(Product) where?: Where<Product>,
  ): Promise<Count> {
    return this.productRepository.updateAll(product, where);
  }

  @get('/products/{id}')
  @response(200, {
    description: 'Product model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Product, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    //@param.filter(Product, {exclude: 'where'}) filter?: FilterExcludingWhere<Product>
  ): Promise<ProductDto | undefined> {
    /*const product = await this.productRepository.findById(id);//, filter
    // Load category ids
    const productCategories = await this.productCategoriesRepository.find({where: {productId: id}});
    product.categories = productCategories.map(pc => pc.categoryId);
    // Load attachment ids
    const productImages = await this.productImagesRepository.find({where: {productId: id}});
    product.attachments = productImages.map(pi => pi.attachmentId);
    // Load attributes
    product.attributes = await this.productRepository.attributes(id).find();
    // Load variations
    product.variations = await this.productRepository.variations(id).find();

    // Compute AttachmentId from ProductImages with lowest order and enabled=true
    const enabledImages = productImages.filter(pi => pi.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (enabledImages.length > 0) {
      (product as any).AttachmentId = enabledImages[0].attachmentId;

    }*/

    const product = await this.productServiceService.findByIdDto(id);

    return product;
  }

  @patch('/products/{id}')
  @response(204, {
    description: 'Product PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreateProductDto),
        },
      },
    })
    productUpdate: CreateProductDto,
  ): Promise<void> {
    // Update the main product data
    const productData = {
      name: productUpdate.name,
      price: productUpdate.price,
      discountedPrice: productUpdate.discountedPrice,
      discountStartDate: productUpdate.discountStartDate,
      discountEndDate: productUpdate.discountEndDate,
      sku: productUpdate.sku,
      gtin: productUpdate.gtin,
      discountScheduled: productUpdate.discountScheduled,
      stock: productUpdate.stock,
      shortDescription: productUpdate.shortDescription,
      completeDescription: productUpdate.completeDescription,
    };

    await this.productRepository.updateById(id, productData);

    // Handle categories
    if (productUpdate.categories !== undefined) {
      // Delete existing categories
      await this.productCategoriesRepository.deleteAll({productId: id});
      // Add new categories
      if (productUpdate.categories.length > 0) {
        for (const categoryId of productUpdate.categories) {
          await this.productCategoriesRepository.create({
            productId: id,
            categoryId: categoryId,
          });
        }
      }
    }

    // Handle attributes
    if (productUpdate.attributes !== undefined) {
      // Get existing attributes
      const existingAttributes = await this.productAttributeRepository.find({where: {productId: id}});
      const existingAttributeIds = existingAttributes.map(attr => attr.id).filter(id => id !== undefined) as number[];

      // Attributes to keep/update
      const updatedAttributeIds: number[] = [];

      for (const attribute of productUpdate.attributes) {
        if (attribute.id && existingAttributeIds.includes(attribute.id)) {
          // Update existing attribute
          await this.productAttributeRepository.updateById(attribute.id, {
            name: attribute.name,
            value: attribute.value,
            visible: attribute.visible,
            usedInVariations: attribute.usedInVariations,
          });
          updatedAttributeIds.push(attribute.id);
        } else {
          // Create new attribute
          const newAttribute = await this.productAttributeRepository.create({
            productId: id,
            name: attribute.name,
            value: attribute.value,
            visible: attribute.visible,
            usedInVariations: attribute.usedInVariations,
          });
          updatedAttributeIds.push(newAttribute.id!);
        }
      }

      // Delete attributes not in the update
      const attributesToDelete = existingAttributeIds.filter(id => id && !updatedAttributeIds.includes(id));
      for (const attrId of attributesToDelete) {
        if (attrId) {
          await this.productAttributeRepository.deleteById(attrId);
        }
      }
    }

    // Handle variations
    if (productUpdate.variations !== undefined) {
      // Get existing variations
      const existingVariations = await this.productVariationRepository.find({where: {productId: id}});
      const existingVariationIds = existingVariations.map(v => v.id).filter(id => id !== undefined) as number[];

      // Variations to keep/update
      const updatedVariationIds: number[] = [];

      for (const variation of productUpdate.variations) {
        if (variation.id && existingVariationIds.includes(variation.id)) {
          // Update existing variation
          await this.productVariationRepository.updateById(variation.id, {
            combination: variation.combination,
            stock: variation.stock,
            price: variation.price,
            discountedPrice: variation.discountedPrice,
            discountStartDate: variation.discountStartDate,
            discountEndDate: variation.discountEndDate,
            sku: variation.sku,
            discountScheduled: variation.discountScheduled,
          });
          updatedVariationIds.push(variation.id);
        } else {
          // Create new variation
          const newVariation = await this.productVariationRepository.create({
            productId: id,
            combination: variation.combination,
            stock: variation.stock,
            price: variation.price,
            discountedPrice: variation.discountedPrice,
            discountStartDate: variation.discountStartDate,
            discountEndDate: variation.discountEndDate,
            sku: variation.sku,
            discountScheduled: variation.discountScheduled,
          });
          updatedVariationIds.push(newVariation.id!);
        }
      }

      // Delete variations not in the update
      const variationsToDelete = existingVariationIds.filter(id => !updatedVariationIds.includes(id));
      for (const varId of variationsToDelete) {
        await this.productVariationRepository.deleteById(varId);
      }
    }
  }

  @put('/products/{id}')
  @response(204, {
    description: 'Product PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Product, {
            exclude: ['creationDate'],
          }),
        },
      },
    })
    product: Omit<Product, 'creationDate'>,
  ): Promise<void> {
    await this.productRepository.replaceById(id, product);
  }

  @get('/products/{id}/images')
  @response(200, {
    description: 'Array of Product Images',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {type: 'number'},
              productId: {type: 'number'},
              attachmentId: {type: 'number'},
              isMain: {type: 'boolean'},
              order: {type: 'number'},
              enabled: {type: 'boolean'},
              attachment: {
                type: 'object',
                properties: {
                  id: {type: 'number'},
                  mimeType: {type: 'string'},
                  url: {type: 'string'},
                  fileName: {type: 'string'},
                  size: {type: 'number'},
                },
              },
            },
          },
        },
      },
    },
  })
  async getProductImages(@param.path.number('id') id: number): Promise<any[]> {
    const productImages = await this.productImagesRepository.find({
      where: {productId: id},
      order: ['order ASC'],
    });

    // Load attachment details for each image
    const imagesWithAttachments = await Promise.all(
      productImages.map(async (pi) => {
        const attachment = await this.attachmentRepository.findById(pi.attachmentId);
        return {
          ...pi,
          attachment: {
            id: attachment.id,
            mimeType: attachment.mimeType,
            url: attachment.url,
            fileName: attachment.fileName,
            size: attachment.size,
          },
        };
      })
    );

    return imagesWithAttachments;
  }

  @put('/products/{id}/images')
  @response(204, {
    description: 'Product images updated successfully',
  })
  async updateProductImages(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                attachmentId: {type: 'number'},
                order: {type: 'number'},
                enabled: {type: 'boolean'},
                isMain: {type: 'boolean'},
              },
              required: ['attachmentId', 'order', 'enabled'],
            },
          },
        },
      },
    })
    images: Array<{attachmentId: number; order: number; enabled: boolean; isMain?: boolean}>,
  ): Promise<void> {
    // Delete existing images
    await this.productImagesRepository.deleteAll({productId: id});

    // Create new images
    for (const image of images) {
      await this.productImagesRepository.create({
        productId: id,
        attachmentId: image.attachmentId,
        order: image.order,
        enabled: image.enabled,
        isMain: image.isMain || false,
      });
    }
  }

  @post('/products/{id}/add-images')
  @response(200, {
    description: 'Images added to product successfully',
  })
  async addImagesToProduct(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              images: {
                type: 'array',
                items: {type: 'string'},
              },
            },
            required: ['images'],
          },
        },
      },
    })
    body: {images: string[]},
  ): Promise<void> {
    // Find the maximum order for existing images
    const existingImages = await this.productImagesRepository.find({
      where: {productId: id},
      order: ['order DESC'],
      limit: 1,
    });
    let maxOrder = existingImages.length > 0 ? existingImages[0].order || 0 : 0;

    // Process each image
    for (let i = 0; i < body.images.length; i++) {
      const base64Image = body.images[i];
      try {
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

        // Create ProductImages entry
        const productImageData = {
          productId: id,
          attachmentId: savedAttachment.id!,
          isMain: false, // Appended images are not main
          order: maxOrder + i + 1,
          enabled: true,
        };

        await this.productImagesRepository.create(productImageData);
      } catch (error) {
        console.error(`Error processing image ${i}:`, error);
        // Continue with other images
      }
    }
  }

  @del('/products/{productId}/images/{imageId}')
  @response(204, {
    description: 'Product image deleted successfully',
  })
  async deleteProductImage(
    @param.path.number('productId') productId: number,
    @param.path.number('imageId') imageId: number,
  ): Promise<void> {
    // Find the product image to ensure it belongs to the product
    const productImage = await this.productImagesRepository.findOne({
      where: {id: imageId, productId: productId},
    });

    if (!productImage) {
      throw new Error('Product image not found or does not belong to the specified product');
    }

    // Delete the product image record
    await this.productImagesRepository.deleteById(imageId);
  }

  @del('/products/{id}')
  @response(204, {
    description: 'Product DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.productRepository.deleteById(id);
  }
}
