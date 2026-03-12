import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, HttpErrors, patch, post, requestBody, response} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {UsersRepository} from '../repositories';
import {PaymentGatewayClientService} from '../services';

export class PaymentGatewayAdminController {
  constructor(
    @service() public paymentGatewayClientService: PaymentGatewayClientService,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
  ) {}

  @get('/admin/payment-gateway/providers/paypal')
  @authenticate('jwt')
  @response(200, {
    description: 'PayPal provider settings',
  })
  async getPaypalProvider(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<any> {
    await this.ensureAdminAccess(currentUserProfile);
    const providers = await this.paymentGatewayClientService.getProviders();
    return providers.find((provider: any) => provider.key === 'paypal') || null;
  }

  @get('/payment-gateway/providers/paypal/public-config')
  @authenticate('jwt')
  @response(200, {
    description: 'PayPal public configuration for checkout',
  })
  async getPaypalPublicConfig(): Promise<any> {
    const providers = await this.paymentGatewayClientService.getProviders();
    const provider = providers.find((item: any) => item.key === 'paypal');

    if (!provider) {
      return null;
    }

    return {
      key: provider.key,
      displayName: provider.displayName,
      environment: provider.environment,
      isActive: provider.isActive,
      clientId: provider.settings?.clientId || '',
    };
  }

  @post('/admin/payment-gateway/providers/paypal')
  @authenticate('jwt')
  @response(200, {
    description: 'PayPal provider created',
  })
  async createPaypalProvider(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              displayName: {type: 'string'},
              description: {type: 'string'},
              environment: {type: 'string'},
              isActive: {type: 'boolean'},
              webhookPath: {type: 'string'},
              settings: {type: 'object'},
            },
          },
        },
      },
    })
    body: any,
  ): Promise<any> {
    await this.ensureAdminAccess(currentUserProfile);
    return this.paymentGatewayClientService.createProvider({
      key: 'paypal',
      displayName: body.displayName || 'PayPal',
      description: body.description || 'Pago con PayPal',
      type: 'gateway',
      environment: body.environment || 'sandbox',
      isActive: body.isActive !== false,
      supportsRefunds: true,
      supportsPartialRefunds: true,
      webhookPath: body.webhookPath || '/webhooks/paypal',
      settings: body.settings || {},
    });
  }

  @patch('/admin/payment-gateway/providers/paypal')
  @authenticate('jwt')
  @response(200, {
    description: 'PayPal provider updated',
  })
  async updatePaypalProvider(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              displayName: {type: 'string'},
              description: {type: 'string'},
              environment: {type: 'string'},
              isActive: {type: 'boolean'},
              webhookPath: {type: 'string'},
              settings: {type: 'object'},
            },
          },
        },
      },
    })
    body: any,
  ): Promise<any> {
    await this.ensureAdminAccess(currentUserProfile);
    const providers = await this.paymentGatewayClientService.getProviders();
    const provider = providers.find((item: any) => item.key === 'paypal');

    if (!provider?.id) {
      throw new HttpErrors.NotFound('El proveedor PayPal no existe en la pasarela.');
    }

    return this.paymentGatewayClientService.updateProvider(provider.id, body);
  }

  private async ensureAdminAccess(currentUserProfile: UserProfile): Promise<void> {
    const user = await this.usersRepository.findById(currentUserProfile.id, {
      include: [{relation: 'role'}],
    });

    const roleKey = (user as any).role?.key;
    if (!roleKey || !['admin', 'administrator', 'super_admin', 'store_admin'].includes(roleKey)) {
      throw new HttpErrors.Forbidden('No tienes permisos para administrar la pasarela de pago.');
    }
  }
}
