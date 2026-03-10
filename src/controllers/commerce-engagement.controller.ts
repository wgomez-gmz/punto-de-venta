import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {del, get, getModelSchemaRef, HttpErrors, param, patch, post, requestBody, response} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {Coupon, ProductQuestion, ProductReview} from '../models';
import {
  CouponRepository,
  CouponUsageRepository,
  ProductCategoriesRepository,
  ProductFavoriteRepository,
  ProductQuestionRepository,
  ProductRepository,
  ProductReviewRepository,
  ProductViewHistoryRepository,
  PurchaseOrderItemRepository,
  PurchaseOrderRepository,
  UsersRepository,
} from '../repositories';
import {ProductServiceService} from '../services';

export class CommerceEngagementController {
  constructor(
    @repository(CouponRepository)
    public couponRepository: CouponRepository,
    @repository(CouponUsageRepository)
    public couponUsageRepository: CouponUsageRepository,
    @repository(ProductReviewRepository)
    public productReviewRepository: ProductReviewRepository,
    @repository(ProductQuestionRepository)
    public productQuestionRepository: ProductQuestionRepository,
    @repository(ProductFavoriteRepository)
    public productFavoriteRepository: ProductFavoriteRepository,
    @repository(ProductViewHistoryRepository)
    public productViewHistoryRepository: ProductViewHistoryRepository,
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(ProductCategoriesRepository)
    public productCategoriesRepository: ProductCategoriesRepository,
    @repository(PurchaseOrderRepository)
    public purchaseOrderRepository: PurchaseOrderRepository,
    @repository(PurchaseOrderItemRepository)
    public purchaseOrderItemRepository: PurchaseOrderItemRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @service() public productServiceService: ProductServiceService,
  ) { }

  @post('/coupons')
  @authenticate('jwt')
  @response(200, {
    description: 'Coupon created',
    content: {'application/json': {schema: getModelSchemaRef(Coupon)}},
  })
  async createCoupon(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Coupon, {
            title: 'NewCoupon',
            exclude: ['id', 'creationDate', 'usageCount'],
          }),
        },
      },
    })
    coupon: Omit<Coupon, 'id'>,
  ): Promise<Coupon> {
    await this.ensureAdminAccess(Number(currentUserProfile.id));
    return this.couponRepository.create({
      ...coupon,
      code: coupon.code.toUpperCase().trim(),
      usageCount: 0,
    });
  }

  @get('/coupons')
  @authenticate('jwt')
  @response(200, {
    description: 'Coupons list',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Coupon),
        },
      },
    },
  })
  async findCoupons(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<Coupon[]> {
    await this.ensureAdminAccess(Number(currentUserProfile.id));
    return this.couponRepository.find({order: ['creationDate DESC']});
  }

  @patch('/coupons/{id}')
  @authenticate('jwt')
  @response(200, {
    description: 'Coupon updated',
    content: {'application/json': {schema: getModelSchemaRef(Coupon)}},
  })
  async updateCoupon(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Coupon, {partial: true, exclude: ['creationDate']}),
        },
      },
    })
    coupon: Partial<Coupon>,
  ): Promise<Coupon> {
    await this.ensureAdminAccess(Number(currentUserProfile.id));
    await this.couponRepository.updateById(id, {
      ...coupon,
      ...(coupon.code ? {code: coupon.code.toUpperCase().trim()} : {}),
    });
    return this.couponRepository.findById(id);
  }

  @post('/coupons/validate')
  @authenticate('jwt')
  @response(200, {
    description: 'Coupon validation',
  })
  async validateCoupon(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['code', 'subtotal'],
            properties: {
              code: {type: 'string'},
              subtotal: {type: 'number'},
            },
          },
        },
      },
    })
    body: {code: string; subtotal: number},
  ): Promise<any> {
    return this.getCouponValidation(body.code, body.subtotal, Number(currentUserProfile.id));
  }

  @get('/products/{productId}/reviews')
  @response(200, {
    description: 'Product reviews',
  })
  async getProductReviews(
    @param.path.number('productId') productId: number,
  ): Promise<any> {
    const reviews = await this.productReviewRepository.find({
      where: {productId},
      order: ['creationDate DESC'],
    });

    const data = await Promise.all(reviews.map(async review => {
      const user = await this.usersRepository.findById(review.usersId, {
        include: [{relation: 'people'}],
      });
      return {
        ...review,
        userName: [user.people?.name, user.people?.firstLastName].filter(Boolean).join(' ') || user.username,
      };
    }));

    return {
      data,
      summary: await this.getReviewSummary(productId),
    };
  }

  @post('/products/{productId}/reviews')
  @authenticate('jwt')
  @response(200, {
    description: 'Review created or updated',
    content: {'application/json': {schema: getModelSchemaRef(ProductReview)}},
  })
  async upsertProductReview(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('productId') productId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['rating', 'comment'],
            properties: {
              rating: {type: 'number'},
              title: {type: 'string'},
              comment: {type: 'string'},
            },
          },
        },
      },
    })
    body: {rating: number; title?: string; comment: string},
  ): Promise<ProductReview> {
    if (body.rating < 1 || body.rating > 5) {
      throw new HttpErrors.UnprocessableEntity('La calificacion debe estar entre 1 y 5.');
    }

    const usersId = Number(currentUserProfile.id);
    const verifiedPurchase = await this.hasPurchasedProduct(usersId, productId);
    const existingReview = await this.productReviewRepository.findOne({
      where: {productId, usersId},
    });

    if (existingReview?.id) {
      await this.productReviewRepository.updateById(existingReview.id, {
        rating: body.rating,
        title: body.title,
        comment: body.comment,
        verifiedPurchase,
      });
      return this.productReviewRepository.findById(existingReview.id);
    }

    return this.productReviewRepository.create({
      productId,
      usersId,
      rating: body.rating,
      title: body.title,
      comment: body.comment,
      verifiedPurchase,
    });
  }

  @get('/products/{productId}/questions')
  @response(200, {
    description: 'Product questions',
  })
  async getProductQuestions(
    @param.path.number('productId') productId: number,
  ): Promise<any[]> {
    const questions = await this.productQuestionRepository.find({
      where: {productId, isPublished: true},
      order: ['creationDate DESC'],
    });

    return Promise.all(questions.map(async question => {
      const user = await this.usersRepository.findById(question.usersId, {
        include: [{relation: 'people'}],
      });
      return {
        ...question,
        userName: [user.people?.name, user.people?.firstLastName].filter(Boolean).join(' ') || user.username,
      };
    }));
  }

  @post('/products/{productId}/questions')
  @authenticate('jwt')
  @response(200, {
    description: 'Product question created',
    content: {'application/json': {schema: getModelSchemaRef(ProductQuestion)}},
  })
  async createProductQuestion(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('productId') productId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['question'],
            properties: {
              question: {type: 'string'},
            },
          },
        },
      },
    })
    body: {question: string},
  ): Promise<ProductQuestion> {
    return this.productQuestionRepository.create({
      productId,
      usersId: Number(currentUserProfile.id),
      question: body.question,
      isPublished: true,
    });
  }

  @patch('/product-questions/{id}/answer')
  @authenticate('jwt')
  @response(200, {
    description: 'Product question answered',
    content: {'application/json': {schema: getModelSchemaRef(ProductQuestion)}},
  })
  async answerProductQuestion(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['answer'],
            properties: {
              answer: {type: 'string'},
            },
          },
        },
      },
    })
    body: {answer: string},
  ): Promise<ProductQuestion> {
    await this.ensureAdminAccess(Number(currentUserProfile.id));
    await this.productQuestionRepository.updateById(id, {
      answer: body.answer,
      answeredByUserId: Number(currentUserProfile.id),
      answeredAt: new Date().toISOString(),
    });
    return this.productQuestionRepository.findById(id);
  }

  @get('/admin/product-questions')
  @authenticate('jwt')
  @response(200, {
    description: 'Admin product questions',
  })
  async getAdminProductQuestions(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('status') status?: string,
  ): Promise<any[]> {
    await this.ensureAdminAccess(Number(currentUserProfile.id));

    const questions = await this.productQuestionRepository.find({
      order: ['creationDate DESC'],
    });
    const filteredQuestions = questions.filter((question) => {
      if (status === 'pending') {
        return !question.answer;
      }
      if (status === 'answered') {
        return !!question.answer;
      }
      return true;
    });

    return Promise.all(filteredQuestions.map(async question => {
      const [user, product] = await Promise.all([
        this.usersRepository.findById(question.usersId, {
          include: [{relation: 'people'}],
        }),
        this.productRepository.findById(question.productId),
      ]);

      return {
        ...question,
        userName: [user.people?.name, user.people?.firstLastName].filter(Boolean).join(' ') || user.username,
        productName: product.name,
      };
    }));
  }

  @post('/products/{productId}/favorite')
  @authenticate('jwt')
  @response(200, {
    description: 'Product favorited',
  })
  async addFavorite(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('productId') productId: number,
  ): Promise<{favorite: boolean}> {
    const usersId = Number(currentUserProfile.id);
    const existingFavorite = await this.productFavoriteRepository.findOne({
      where: {productId, usersId},
    });

    if (!existingFavorite) {
      await this.productFavoriteRepository.create({
        productId,
        usersId,
      });
    }

    return {favorite: true};
  }

  @del('/products/{productId}/favorite')
  @authenticate('jwt')
  @response(200, {
    description: 'Product unfavorited',
  })
  async removeFavorite(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('productId') productId: number,
  ): Promise<{favorite: boolean}> {
    await this.productFavoriteRepository.deleteAll({
      productId,
      usersId: Number(currentUserProfile.id),
    });
    return {favorite: false};
  }

  @get('/users/me/favorites')
  @authenticate('jwt')
  @response(200, {
    description: 'Favorite products for current user',
  })
  async getMyFavorites(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<any[]> {
    const favorites = await this.productFavoriteRepository.find({
      where: {usersId: Number(currentUserProfile.id)},
      order: ['creationDate DESC'],
    });

    return Promise.all(
      favorites.map(async favorite => this.buildProductCard(favorite.productId, Number(currentUserProfile.id))),
    );
  }

  @post('/products/{productId}/view')
  @authenticate('jwt')
  @response(200, {
    description: 'Product view registered',
  })
  async registerProductView(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('productId') productId: number,
  ): Promise<{registered: boolean}> {
    const usersId = Number(currentUserProfile.id);
    const existingRecord = await this.productViewHistoryRepository.findOne({
      where: {productId, usersId},
    });

    if (existingRecord?.id) {
      await this.productViewHistoryRepository.updateById(existingRecord.id, {
        lastViewedAt: new Date().toISOString(),
      });
    } else {
      await this.productViewHistoryRepository.create({
        productId,
        usersId,
        lastViewedAt: new Date().toISOString(),
      });
    }

    return {registered: true};
  }

  @get('/users/me/recently-viewed')
  @authenticate('jwt')
  @response(200, {
    description: 'Recently viewed products',
  })
  async getRecentlyViewed(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.number('limit') limit = 8,
  ): Promise<any[]> {
    const views = await this.productViewHistoryRepository.find({
      where: {usersId: Number(currentUserProfile.id)},
      order: ['lastViewedAt DESC'],
      limit,
    });

    return Promise.all(
      views.map(async view => this.buildProductCard(view.productId, Number(currentUserProfile.id))),
    );
  }

  @get('/products/{productId}/related')
  @response(200, {
    description: 'Related products',
  })
  async getRelatedProducts(
    @param.path.number('productId') productId: number,
    @param.query.number('limit') limit = 4,
  ): Promise<any[]> {
    const categories = await this.productCategoriesRepository.find({
      where: {productId},
    });
    const categoryIds = categories.map(category => category.categoryId);

    if (categoryIds.length === 0) {
      return [];
    }

    const productCategories = await this.productCategoriesRepository.find({
      where: {
        categoryId: {inq: categoryIds},
      },
    });

    const relatedIds = [...new Set(
      productCategories
        .map(category => category.productId)
        .filter(id => id !== productId),
    )].slice(0, limit);

    return Promise.all(relatedIds.map(async id => this.buildProductCard(id)));
  }

  private async buildProductCard(productId: number, usersId?: number): Promise<any> {
    const product = await this.productServiceService.findByIdDto(productId);
    const reviewSummary = await this.getReviewSummary(productId);
    const isFavorite = usersId
      ? !!(await this.productFavoriteRepository.findOne({where: {productId, usersId}}))
      : false;

    return {
      ...product,
      rating: reviewSummary.rating,
      reviewCount: reviewSummary.reviewCount,
      isFavorite,
    };
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

  private async hasPurchasedProduct(usersId: number, productId: number): Promise<boolean> {
    const purchaseItems = await this.purchaseOrderItemRepository.find({
      where: {productId},
    });
    if (purchaseItems.length === 0) {
      return false;
    }

    const orderIds = purchaseItems.map(item => item.purchaseOrderId);
    const order = await this.purchaseOrderRepository.findOne({
      where: {
        id: {inq: orderIds},
        usersId,
      },
    });
    return !!order;
  }

  private async getCouponValidation(code: string, subtotal: number, usersId: number): Promise<any> {
    const normalizedCode = String(code || '').trim().toUpperCase();
    const coupon = await this.couponRepository.findOne({
      where: {code: normalizedCode},
    });

    if (!coupon || !coupon.isActive) {
      throw new HttpErrors.NotFound('El cupon no esta disponible.');
    }

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      throw new HttpErrors.UnprocessableEntity('El cupon aun no esta vigente.');
    }
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      throw new HttpErrors.UnprocessableEntity('El cupon ya expiro.');
    }
    if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
      throw new HttpErrors.UnprocessableEntity('El monto minimo para aplicar este cupon no se cumple.');
    }
    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      throw new HttpErrors.UnprocessableEntity('El cupon ya alcanzo su limite de uso.');
    }

    const userCouponUsage = await this.couponUsageRepository.count({
      couponId: coupon.id,
      usersId,
    });
    if (coupon.perUserLimit && userCouponUsage.count >= coupon.perUserLimit) {
      throw new HttpErrors.UnprocessableEntity('Ya utilizaste este cupon el numero maximo de veces permitido.');
    }

    let discountAmount = coupon.discountType === 'fixed'
      ? coupon.discountValue
      : subtotal * (coupon.discountValue / 100);

    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }

    discountAmount = Number(discountAmount.toFixed(2));
    const total = Number(Math.max(subtotal - discountAmount, 0).toFixed(2));

    return {
      valid: true,
      coupon,
      subtotal,
      discountAmount,
      total,
    };
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
