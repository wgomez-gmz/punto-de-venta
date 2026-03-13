import {BindingScope, injectable} from '@loopback/core';
import nodemailer, {Transporter} from 'nodemailer';

export type OrderEmailPayload = {
  orderId: number;
  customerName: string;
  total: number;
  statusName?: string;
  paymentMethodName?: string;
  detailUrl?: string;
};

@injectable({scope: BindingScope.SINGLETON})
export class EmailService {
  private transporter: Transporter | null = null;
  private initialized = false;

  private get sender(): string {
    return process.env.EMAIL_FROM || 'no-reply@punto-venta.local';
  }

  private get frontendBaseUrl(): string {
    return process.env.FRONTEND_APP_URL || 'http://localhost:5000';
  }

  private isEnabled(): boolean {
    return process.env.EMAIL_ENABLED === 'true';
  }

  private shouldExposePreview(): boolean {
    return process.env.EMAIL_PREVIEW_MODE === 'true';
  }

  private initializeTransporter(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    if (!this.isEnabled()) {
      return;
    }

    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 587);
    const secure = process.env.EMAIL_SECURE === 'true';
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (!host || !user || !pass) {
      console.warn('Email service enabled but SMTP configuration is incomplete.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string, text?: string): Promise<void> {
    this.initializeTransporter();

    if (!this.isEnabled() || !this.transporter) {
      console.log(`[EMAIL DISABLED] To: ${to} | Subject: ${subject}`);
      if (this.shouldExposePreview()) {
        console.log(html);
      }
      return;
    }

    await this.transporter.sendMail({
      from: this.sender,
      to,
      subject,
      html,
      text,
    });
  }

  async sendAccountConfirmationEmail(to: string, customerName: string): Promise<void> {
    const safeName = customerName || 'cliente';
    const loginUrl = `${this.frontendBaseUrl}/login-client`;
    await this.sendMail(
      to,
      'Confirmacion de cuenta',
      `
        <h2>Bienvenido a Punto de Venta</h2>
        <p>Hola ${safeName}, tu cuenta fue creada correctamente.</p>
        <p>Ya puedes iniciar sesion y comenzar a comprar.</p>
        <p><a href="${loginUrl}">Ir al inicio de sesion</a></p>
      `,
      `Hola ${safeName}, tu cuenta fue creada correctamente. Inicia sesion en ${loginUrl}`,
    );
  }

  async sendEmailVerificationEmail(to: string, customerName: string, verificationUrl: string): Promise<void> {
    const safeName = customerName || 'cliente';
    await this.sendMail(
      to,
      'Verifica tu correo electronico',
      `
        <h2>Activa tu cuenta</h2>
        <p>Hola ${safeName}, gracias por crear tu cuenta.</p>
        <p>Para activar tu acceso, verifica tu correo electronico en el siguiente enlace:</p>
        <p><a href="${verificationUrl}">Verificar mi correo</a></p>
        <p>Este enlace expira en 24 horas.</p>
        <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
      `,
      `Hola ${safeName}. Verifica tu correo y activa tu cuenta aqui: ${verificationUrl}. El enlace expira en 24 horas.`,
    );
  }

  async sendPasswordResetEmail(to: string, customerName: string, resetUrl: string): Promise<void> {
    const safeName = customerName || 'cliente';
    await this.sendMail(
      to,
      'Recuperacion de contrasena',
      `
        <h2>Recuperacion de contrasena</h2>
        <p>Hola ${safeName}, recibimos una solicitud para restablecer tu contrasena.</p>
        <p>Este enlace expira en 1 hora.</p>
        <p><a href="${resetUrl}">Restablecer contrasena</a></p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      `,
      `Hola ${safeName}. Restablece tu contrasena aqui: ${resetUrl}. El enlace expira en 1 hora.`,
    );
  }

  async sendOrderCreatedEmail(to: string, payload: OrderEmailPayload): Promise<void> {
    await this.sendMail(
      to,
      `Confirmacion de pedido #${payload.orderId}`,
      `
        <h2>Tu pedido fue recibido</h2>
        <p>Hola ${payload.customerName}, recibimos tu pedido #${payload.orderId}.</p>
        <p>Total: ${payload.total.toFixed(2)} MXN</p>
        <p>Metodo de pago: ${payload.paymentMethodName || 'No disponible'}</p>
        ${payload.detailUrl ? `<p><a href="${payload.detailUrl}">Ver detalles del pedido</a></p>` : ''}
      `,
      `Pedido #${payload.orderId} recibido. Total: ${payload.total.toFixed(2)} MXN.`,
    );
  }

  async sendOrderStatusEmail(to: string, payload: OrderEmailPayload): Promise<void> {
    await this.sendMail(
      to,
      `Actualizacion de pedido #${payload.orderId}`,
      `
        <h2>Actualizacion de tu pedido</h2>
        <p>Hola ${payload.customerName}, tu pedido #${payload.orderId} ahora esta en estado: <strong>${payload.statusName || 'Actualizado'}</strong>.</p>
        ${payload.detailUrl ? `<p><a href="${payload.detailUrl}">Consultar pedido</a></p>` : ''}
      `,
      `Tu pedido #${payload.orderId} ahora esta en estado: ${payload.statusName || 'Actualizado'}.`,
    );
  }

  async sendOrderPaymentConfirmedEmail(to: string, payload: OrderEmailPayload): Promise<void> {
    await this.sendMail(
      to,
      `Pago confirmado de pedido #${payload.orderId}`,
      `
        <h2>Pago confirmado</h2>
        <p>Hola ${payload.customerName}, el pago de tu pedido #${payload.orderId} fue confirmado.</p>
        <p>Total: ${payload.total.toFixed(2)} MXN</p>
        ${payload.detailUrl ? `<p><a href="${payload.detailUrl}">Ver pedido</a></p>` : ''}
      `,
      `El pago de tu pedido #${payload.orderId} fue confirmado.`,
    );
  }

  async sendOrderShippedEmail(to: string, payload: OrderEmailPayload): Promise<void> {
    await this.sendMail(
      to,
      `Pedido enviado #${payload.orderId}`,
      `
        <h2>Tu pedido va en camino</h2>
        <p>Hola ${payload.customerName}, tu pedido #${payload.orderId} fue enviado.</p>
        <p>Total: ${payload.total.toFixed(2)} MXN</p>
        ${payload.detailUrl ? `<p><a href="${payload.detailUrl}">Ver seguimiento del pedido</a></p>` : ''}
      `,
      `Tu pedido #${payload.orderId} fue enviado y va en camino.`,
    );
  }

  async sendOrderDeliveredEmail(to: string, payload: OrderEmailPayload): Promise<void> {
    await this.sendMail(
      to,
      `Pedido entregado #${payload.orderId}`,
      `
        <h2>Pedido entregado</h2>
        <p>Hola ${payload.customerName}, tu pedido #${payload.orderId} fue entregado correctamente.</p>
        <p>Gracias por tu compra.</p>
        ${payload.detailUrl ? `<p><a href="${payload.detailUrl}">Ver detalles del pedido</a></p>` : ''}
      `,
      `Tu pedido #${payload.orderId} fue entregado correctamente.`,
    );
  }

  isPreviewModeEnabled(): boolean {
    return this.shouldExposePreview();
  }
}
