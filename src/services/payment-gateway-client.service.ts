import {BindingScope, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import http from 'http';
import https from 'https';
import {URL} from 'url';

@injectable({scope: BindingScope.TRANSIENT})
export class PaymentGatewayClientService {
  private readonly baseUrl = (process.env.PAYMENT_GATEWAY_BASE_URL || 'http://127.0.0.1:3010').replace(/\/$/, '');

  async ensureProvider(paymentMethod: any): Promise<any> {
    const providerKey = String(paymentMethod?.name || '').trim().toLowerCase();
    if (!providerKey) {
      throw new HttpErrors.BadRequest('No fue posible determinar el proveedor de pago.');
    }

    const providers = await this.request('/payment-providers');
    const existingProvider = Array.isArray(providers)
      ? providers.find((provider: any) => provider.key === providerKey)
      : null;

    if (existingProvider) {
      return existingProvider;
    }

    return this.request('/payment-providers', {
      method: 'POST',
      body: {
        key: providerKey,
        displayName: paymentMethod.displayName || providerKey,
        description: paymentMethod.description,
        type: paymentMethod.type === 'offline' ? 'offline' : 'gateway',
        environment: paymentMethod.isSandbox ? 'sandbox' : 'production',
        isActive: paymentMethod.isActive !== false,
        supportsRefunds: paymentMethod.type !== 'offline',
        supportsPartialRefunds: paymentMethod.type !== 'offline',
        settings: {
          source: 'punto-de-venta',
          paymentMethodId: paymentMethod.id,
        },
      },
    });
  }

  async createPaymentIntent(body: {
    providerKey: string;
    merchantReference: string;
    externalOrderId: string;
    amount: number;
    currency: string;
    customerId?: string;
    customerEmail?: string;
    description?: string;
    metadata?: object;
    callbackUrls?: object;
  }): Promise<any> {
    return this.request('/payment-intents', {
      method: 'POST',
      body,
    });
  }

  async confirmPaymentIntent(paymentIntentId: number, body: {providerReference?: string; metadata?: object}): Promise<any> {
    return this.request(`/payment-intents/${paymentIntentId}/confirm`, {
      method: 'POST',
      body,
    });
  }

  async cancelPaymentIntent(paymentIntentId: number, body: {reason?: string}): Promise<any> {
    return this.request(`/payment-intents/${paymentIntentId}/cancel`, {
      method: 'POST',
      body,
    });
  }

  async getProviders(): Promise<any[]> {
    return this.request('/payment-providers');
  }

  async createProvider(body: object): Promise<any> {
    return this.request('/payment-providers', {
      method: 'POST',
      body,
    });
  }

  async updateProvider(providerId: number, body: object): Promise<any> {
    return this.request(`/payment-providers/${providerId}`, {
      method: 'PATCH',
      body,
    });
  }

  private async request(path: string, options?: {method?: string; body?: object}): Promise<any> {
    const url = new URL(`${this.baseUrl}${path}`);
    const transport = url.protocol === 'https:' ? https : http;
    const payload = options?.body ? JSON.stringify(options.body) : undefined;

    return new Promise((resolve, reject) => {
      const request = transport.request(
        url,
        {
          method: options?.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(payload ? {'Content-Length': Buffer.byteLength(payload)} : {}),
          },
        },
        response => {
          let rawData = '';

          response.on('data', chunk => {
            rawData += chunk;
          });

          response.on('end', () => {
            const parsedBody = rawData ? JSON.parse(rawData) : null;
            if ((response.statusCode || 500) >= 400) {
              reject(new HttpErrors.BadGateway(
                parsedBody?.error?.message ||
                parsedBody?.message ||
                `La pasarela de pagos respondio con error ${response.statusCode}.`,
              ));
              return;
            }

            resolve(parsedBody);
          });
        },
      );

      request.on('error', error => {
        reject(new HttpErrors.BadGateway(
          `No fue posible comunicarse con la pasarela de pagos: ${error.message || 'error de red'}.`,
        ));
      });

      if (payload) {
        request.write(payload);
      }

      request.end();
    });
  }
}
