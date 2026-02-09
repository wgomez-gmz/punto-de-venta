import bcrypt from 'bcryptjs';
import {PuntoDeVentaApplication} from './application';
import {CampoFormularioRepository, FormularioRepository, OpcionCampoRepository, PurchaseOrderStatusRepository, UsersRepository} from './repositories';
import {PaymentMethodFieldRepository} from './repositories/payment-method-field.repository';
import {PaymentMethodRepository} from './repositories/payment-method.repository';
import {PermissionRepository} from './repositories/permission.repository';
import {RolePermissionRepository} from './repositories/role-permission.repository';
import {RoleRepository} from './repositories/role.repository';

export async function seed() {
  const app = new PuntoDeVentaApplication();
  await app.boot();

  const roleRepository = await app.getRepository(RoleRepository);
  const permissionRepository = await app.getRepository(PermissionRepository);
  const rolePermissionRepository = await app.getRepository(RolePermissionRepository);
  const paymentMethodRepository = await app.getRepository(PaymentMethodRepository);
  const paymentMethodFieldRepository = await app.getRepository(PaymentMethodFieldRepository);
  const purchaseOrderStatusRepository = await app.getRepository(PurchaseOrderStatusRepository);
  const userRepository = await app.getRepository(UsersRepository);
  const formularioRepository = await app.getRepository(FormularioRepository);
  const campoFormularioRepository = await app.getRepository(CampoFormularioRepository);
  const opcionCampoRepository = await app.getRepository(OpcionCampoRepository);

  console.log('Seeding initial roles and permissions...');

  // Define permissions
  const permissions = [
    // SuperAdmin permissions
    {name: 'Acceso total al sistema', key: 'full_system_access'},
    {name: 'Gestión de usuarios, roles y permisos', key: 'manage_users_roles_permissions'},
    {name: 'Configuración general del e-commerce', key: 'configure_ecommerce'},

    // Administrador de Tienda permissions
    {name: 'Gestionar productos', key: 'manage_products'},
    {name: 'Gestionar categorías', key: 'manage_categories'},
    {name: 'Gestionar descuentos', key: 'manage_discounts'},
    {name: 'Gestionar cupones', key: 'manage_coupons'},
    {name: 'Ver y gestionar pedidos', key: 'view_manage_orders'},
    {name: 'Control de inventario', key: 'inventory_control'},
    {name: 'Gestionar clientes', key: 'manage_customers'},
    {name: 'Generar reportes', key: 'generate_reports'},

    // Gerente de Ventas permissions
    {name: 'Ver pedidos y ventas', key: 'view_orders_sales'},
    {name: 'Aprobar devoluciones/reembolsos', key: 'approve_returns_refunds'},
    {name: 'Consultar reportes de ventas', key: 'view_sales_reports'},

    // Operador Logístico permissions
    {name: 'Ver pedidos pendientes de envío', key: 'view_pending_shipments'},
    {name: 'Actualizar estado de pedido', key: 'update_order_status'},
    {name: 'Gestionar guías de envío', key: 'manage_shipping_guides'},

    // Cajero (POS) permissions
    {name: 'Crear ventas en punto físico', key: 'create_pos_sales'},
    {name: 'Procesar pagos', key: 'process_payments'},
    {name: 'Emitir facturas/tickets', key: 'issue_invoices_tickets'},
    {name: 'Cierre de caja', key: 'cash_register_closure'},

    // Soporte / Atención al Cliente permissions
    {name: 'Ver pedidos de clientes', key: 'view_customer_orders'},
    {name: 'Gestionar tickets de soporte', key: 'manage_support_tickets'},
    {name: 'Procesar devoluciones o cambios', key: 'process_returns_exchanges'},

    // Cliente permissions
    {name: 'Registro/login', key: 'register_login'},
    {name: 'Ver y comprar productos', key: 'view_purchase_products'},
    {name: 'Historial de pedidos', key: 'order_history'},
    {name: 'Actualizar datos personales', key: 'update_personal_data'},
    {name: 'Crear tickets de soporte', key: 'create_support_tickets'},

    // Vendedor (si hay marketplace) permissions
    {name: 'Subir productos propios', key: 'upload_own_products'},
    {name: 'Ver ventas propias', key: 'view_own_sales'},
    {name: 'Gestionar inventario de sus productos', key: 'manage_own_inventory'},
    {name: 'Consultar comisiones', key: 'view_commissions'},
  ];

  // Create permissions
  const createdPermissions = [];
  for (const perm of permissions) {
    const existing = await permissionRepository.findOne({where: {key: perm.key}});
    if (!existing) {
      const created = await permissionRepository.create(perm);
      createdPermissions.push(created);
      console.log(`Created permission: ${perm.name}`);
    } else {
      createdPermissions.push(existing);
    }
  }

  // Define roles and their permissions
  const rolesData = [
    {
      name: 'SuperAdmin',
      key: 'super_admin',
      permissions: ['full_system_access', 'manage_users_roles_permissions', 'configure_ecommerce']
    },
    {
      name: 'Administrador de Tienda',
      key: 'store_admin',
      permissions: ['manage_products', 'manage_categories', 'manage_discounts', 'manage_coupons', 'view_manage_orders', 'inventory_control', 'manage_customers', 'generate_reports']
    },
    {
      name: 'Gerente de Ventas',
      key: 'sales_manager',
      permissions: ['view_orders_sales', 'approve_returns_refunds', 'view_sales_reports']
    },
    {
      name: 'Operador Logístico',
      key: 'logistic_operator',
      permissions: ['view_pending_shipments', 'update_order_status', 'manage_shipping_guides']
    },
    {
      name: 'Cajero',
      key: 'cashier',
      permissions: ['create_pos_sales', 'process_payments', 'issue_invoices_tickets', 'cash_register_closure']
    },
    {
      name: 'Soporte',
      key: 'support',
      permissions: ['view_customer_orders', 'manage_support_tickets', 'process_returns_exchanges']
    },
    {
      name: 'Cliente',
      key: 'customer',
      permissions: ['register_login', 'view_purchase_products', 'order_history', 'update_personal_data', 'create_support_tickets']
    },
    {
      name: 'Vendedor',
      key: 'seller',
      permissions: ['upload_own_products', 'view_own_sales', 'manage_own_inventory', 'view_commissions']
    }
  ];

  // Create roles and assign permissions
  for (const roleData of rolesData) {
    const existingRole = await roleRepository.findOne({where: {key: roleData.key}});
    let role;
    if (!existingRole) {
      role = await roleRepository.create({
        name: roleData.name,
        key: roleData.key
      });
      console.log(`Created role: ${roleData.name}`);
    } else {
      role = existingRole;
    }

    // Assign permissions to role
    for (const permKey of roleData.permissions) {
      const permission = createdPermissions.find(p => p.key === permKey);
      if (permission) {
        const existingRelation = await rolePermissionRepository.findOne({
          where: {roleId: role.id, permissionId: permission.id}
        });
        if (!existingRelation) {
          await rolePermissionRepository.create({
            roleId: role.id,
            permissionId: permission.id
          });
          console.log(`Assigned permission ${permKey} to role ${roleData.name}`);
        }
      }
    }
  }

  console.log('Seeding purchase order statuses...');

  // Define purchase order statuses for e-commerce
  const purchaseOrderStatuses = [
    {
      name: 'Pendiente de Pago',
      key: 'pending_payment',
      description: 'El pedido ha sido creado pero el pago no ha sido procesado',
      order: 1,
      isActive: true,
    },
    {
      name: 'Pago Confirmado',
      key: 'payment_confirmed',
      description: 'El pago ha sido confirmado y procesado exitosamente',
      order: 2,
      isActive: true,
    },
    {
      name: 'Procesando',
      key: 'processing',
      description: 'El pedido está siendo preparado para envío',
      order: 3,
      isActive: true,
    },
    {
      name: 'Enviado',
      key: 'shipped',
      description: 'El pedido ha sido enviado al cliente',
      order: 4,
      isActive: true,
    },
    {
      name: 'Entregado',
      key: 'delivered',
      description: 'El pedido ha sido entregado exitosamente',
      order: 5,
      isActive: true,
    },
    {
      name: 'Cancelado',
      key: 'cancelled',
      description: 'El pedido ha sido cancelado',
      order: 6,
      isActive: true,
    },
    {
      name: 'Reembolsado',
      key: 'refunded',
      description: 'El pedido ha sido reembolsado',
      order: 7,
      isActive: true,
    },
    {
      name: 'Devuelto',
      key: 'returned',
      description: 'El pedido ha sido devuelto por el cliente',
      order: 8,
      isActive: true,
    },
  ];

  // Create purchase order statuses
  for (const statusData of purchaseOrderStatuses) {
    const existingStatus = await purchaseOrderStatusRepository.findOne({where: {key: statusData.key}});
    if (!existingStatus) {
      await purchaseOrderStatusRepository.create(statusData);
      console.log(`Created purchase order status: ${statusData.name}`);
    }
  }

  console.log('Seeding payment methods...');

  // Define payment methods
  const paymentMethodsData = [
    {
      name: 'paypal',
      displayName: 'PayPal',
      description: 'Pago a través de PayPal',
      type: 'online' as const,
      isActive: true,
      fields: [
        {name: 'clientId', type: 'string'},
        {name: 'clientSecret', type: 'string'},
        {name: 'mode', type: 'string'}, // sandbox or live
      ],
    },
    {
      name: 'openpay',
      displayName: 'Openpay',
      description: 'Pago a través de Openpay',
      type: 'online' as const,
      isActive: true,
      fields: [
        {name: 'merchantId', type: 'string'},
        {name: 'privateKey', type: 'string'},
        {name: 'publicKey', type: 'string'},
      ],
    },
    {
      name: 'conecta',
      displayName: 'Conecta',
      description: 'Pago a través de Conecta',
      type: 'online' as const,
      isActive: true,
      fields: [
        {name: 'apiKey', type: 'string'},
        {name: 'secretKey', type: 'string'},
        {name: 'merchantId', type: 'string'},
      ],
    },
    {
      name: 'transferencia',
      displayName: 'Transferencia Bancaria',
      description: 'Pago mediante transferencia bancaria',
      type: 'offline' as const,
      isActive: true,
      fields: [
        {name: 'bankName', type: 'string'},
        {name: 'accountNumber', type: 'string'},
        {name: 'accountHolder', type: 'string'},
        {name: 'clabe', type: 'string'},
      ],
    },
    {
      name: 'contra_entrega',
      displayName: 'Contra Entrega',
      description: 'Pago contra entrega',
      type: 'offline' as const,
      isActive: true,
      fields: [
        {name: 'instructions', type: 'string'},
      ],
    },
  ];

  // Create payment methods and their fields
  for (const pmData of paymentMethodsData) {
    const existingPM = await paymentMethodRepository.findOne({where: {name: pmData.name}});
    let paymentMethod;
    if (!existingPM) {
      paymentMethod = await paymentMethodRepository.create({
        name: pmData.name,
        displayName: pmData.displayName,
        description: pmData.description,
        type: pmData.type,
        isActive: pmData.isActive,
      });
      console.log(`Created payment method: ${pmData.displayName}`);
    } else {
      paymentMethod = existingPM;
    }

    // Create fields for this payment method
    for (const field of pmData.fields) {
      const existingField = await paymentMethodFieldRepository.findOne({
        where: {name: field.name, paymentMethodId: paymentMethod.id}
      });
      if (!existingField) {
        await paymentMethodFieldRepository.create({
          name: field.name,
          type: field.type,
          paymentMethodId: paymentMethod.id!,
        });
        console.log(`Created field ${field.name} for ${pmData.displayName}`);
      }
    }
  }

  console.log('Seeding forms...');

  // Define checkout contact form
  const checkoutFormData = {
    nombre: 'Formulario de Contacto - Checkout',
    descripcion: 'Formulario para recopilar información de contacto durante el proceso de checkout',
    activo: true,
    version: 1,
    key: 'checkout_contact_form',
    campos: [
      {
        etiqueta: 'Nombre',
        tipo: 'text' as const,
        placeholder: 'Ingresa tu nombre completo',
        requerido: true,
        orden: 1,
        layoutSpan: 'half' as const,
        visible: true,
        validacion: {
          minLength: 2,
          maxLength: 50,
          pattern: '^[a-zA-ZÀ-ÿ\\s]+$'
        }
      },
      {
        etiqueta: 'Apellido',
        tipo: 'text' as const,
        placeholder: 'Ingresa tus apellidos',
        requerido: true,
        orden: 2,
        layoutSpan: 'half' as const,
        visible: true,
        validacion: {
          minLength: 2,
          maxLength: 50,
          pattern: '^[a-zA-ZÀ-ÿ\\s]+$'
        }
      },
      {
        etiqueta: 'Correo Electrónico',
        tipo: 'email' as const,
        placeholder: 'correo@ejemplo.com',
        requerido: true,
        orden: 3,
        layoutSpan: 'full' as const,
        visible: true,
        validacion: {
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        }
      },
      {
        etiqueta: 'Teléfono',
        tipo: 'text' as const,
        placeholder: '+52 55 1234 5678',
        requerido: true,
        orden: 4,
        layoutSpan: 'full' as const,
        visible: true,
        validacion: {
          pattern: '^[+]?[0-9\\s()-]{10,15}$',
          minLength: 10,
          maxLength: 15
        }
      },
      {
        etiqueta: 'Tipo de Documento',
        tipo: 'select' as const,
        requerido: true,
        orden: 5,
        layoutSpan: 'half' as const,
        visible: true,
        opciones: [
          {etiqueta: 'DNI', valor: 'dni', orden: 1, activo: true},
          {etiqueta: 'Cédula', valor: 'cedula', orden: 2, activo: true},
          {etiqueta: 'Pasaporte', valor: 'pasaporte', orden: 3, activo: true},
          {etiqueta: 'Otro', valor: 'otro', orden: 4, activo: true}
        ]
      },
      {
        etiqueta: 'Número de Documento',
        tipo: 'text' as const,
        placeholder: 'Ingresa tu número de documento',
        requerido: true,
        orden: 6,
        layoutSpan: 'half' as const,
        visible: true,
        validacion: {
          minLength: 5,
          maxLength: 20,
          pattern: '^[a-zA-Z0-9]+$'
        }
      },
      {
        etiqueta: 'País',
        tipo: 'select' as const,
        requerido: true,
        orden: 7,
        layoutSpan: 'half' as const,
        visible: true,
        opciones: [
          {etiqueta: 'México', valor: 'mexico', orden: 1, activo: true},
          {etiqueta: 'Estados Unidos', valor: 'estados_unidos', orden: 2, activo: true},
          {etiqueta: 'Canadá', valor: 'canada', orden: 3, activo: true},
          {etiqueta: 'Otro', valor: 'otro', orden: 4, activo: true}
        ]
      },
      {
        etiqueta: 'Estado/Provincia',
        tipo: 'text' as const,
        placeholder: 'Ingresa tu estado o provincia',
        requerido: true,
        orden: 8,
        layoutSpan: 'half' as const,
        visible: true,
        validacion: {
          minLength: 2,
          maxLength: 50
        }
      },
      {
        etiqueta: 'Ciudad',
        tipo: 'text' as const,
        placeholder: 'Ingresa tu ciudad',
        requerido: true,
        orden: 9,
        layoutSpan: 'half' as const,
        visible: true,
        validacion: {
          minLength: 2,
          maxLength: 50
        }
      },
      {
        etiqueta: 'Código Postal',
        tipo: 'text' as const,
        placeholder: '12345',
        requerido: true,
        orden: 10,
        layoutSpan: 'half' as const,
        visible: true,
        validacion: {
          pattern: '^[0-9]{5,10}$',
          minLength: 5,
          maxLength: 10
        }
      },
      {
        etiqueta: 'Dirección',
        tipo: 'textarea' as const,
        placeholder: 'Ingresa tu dirección completa',
        requerido: true,
        orden: 11,
        layoutSpan: 'full' as const,
        visible: true,
        validacion: {
          minLength: 10,
          maxLength: 200
        }
      },
      {
        etiqueta: 'Referencias',
        tipo: 'textarea' as const,
        placeholder: 'Punto de referencia para la entrega (opcional)',
        requerido: false,
        orden: 12,
        layoutSpan: 'full' as const,
        visible: true,
        validacion: {
          maxLength: 300
        }
      },
      {
        etiqueta: 'Notas Especiales',
        tipo: 'textarea' as const,
        placeholder: 'Instrucciones especiales para la entrega (opcional)',
        requerido: false,
        orden: 13,
        layoutSpan: 'full' as const,
        visible: true,
        validacion: {
          maxLength: 500
        }
      },
      {
        etiqueta: '¿Crear cuenta?',
        tipo: 'checkbox' as const,
        requerido: false,
        orden: 14,
        layoutSpan: 'full' as const,
        visible: true,
        opciones: [
          {etiqueta: 'Sí, crear una cuenta para futuras compras', valor: 'crear_cuenta', orden: 1, activo: true}
        ]
      },
      {
        etiqueta: 'Acepto los términos y condiciones',
        tipo: 'checkbox' as const,
        requerido: true,
        orden: 15,
        layoutSpan: 'full' as const,
        visible: true,
        opciones: [
          {etiqueta: 'He leído y acepto los términos y condiciones', valor: 'terminos', orden: 1, activo: true}
        ]
      }
    ]
  };

  // Create checkout contact form
  const existingForm = await formularioRepository.findOne({where: {key: checkoutFormData.key}});
  let formulario;
  if (!existingForm) {
    formulario = await formularioRepository.create({
      nombre: checkoutFormData.nombre,
      descripcion: checkoutFormData.descripcion,
      activo: checkoutFormData.activo,
      version: checkoutFormData.version,
      key: checkoutFormData.key,
    });
    console.log(`Created form: ${checkoutFormData.nombre}`);

    // Create form fields
    for (const campoData of checkoutFormData.campos) {
      const campo = await campoFormularioRepository.create({
        formularioId: formulario.id!,
        etiqueta: campoData.etiqueta,
        tipo: campoData.tipo,
        placeholder: campoData.placeholder,
        requerido: campoData.requerido,
        orden: campoData.orden,
        layoutSpan: campoData.layoutSpan,
        visible: campoData.visible,
        validacion: campoData.validacion,
      });
      console.log(`Created field: ${campoData.etiqueta}`);

      // Create field options if they exist
      if (campoData.opciones) {
        for (const opcionData of campoData.opciones) {
          await opcionCampoRepository.create({
            campoFormularioId: campo.id!,
            etiqueta: opcionData.etiqueta,
            valor: opcionData.valor,
            orden: opcionData.orden,
            activo: opcionData.activo,
          });
          console.log(`Created option: ${opcionData.etiqueta}`);
        }
      }
    }
  } else {
    formulario = existingForm;
  }

  console.log('Seeding users...');

  // Create admin user
  const adminRole = await roleRepository.findOne({where: {key: 'super_admin'}});
  const customerRole = await roleRepository.findOne({where: {key: 'customer'}});

  if (adminRole) {
    const adminUser = await userRepository.findOne({where: {email: 'admin@punto-venta.com'}});
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUserCreated = await userRepository.create({
        username: 'admin@punto-venta.com',
        email: 'admin@punto-venta.com',
        roleId: adminRole.id,
      });

      // Create user credentials
      await userRepository.userCredentials(adminUserCreated.id!).create({
        password: hashedPassword,
      });

      console.log('Created admin user: admin@punto-venta.com');
    }
  }

  if (customerRole) {
    const customerUser = await userRepository.findOne({where: {email: 'customer@punto-venta.com'}});
    if (!customerUser) {
      const hashedPassword = await bcrypt.hash('customer123', 10);
      const customerUserCreated = await userRepository.create({
        username: 'customer@punto-venta.com',
        email: 'customer@punto-venta.com',
        roleId: customerRole.id,
      });

      // Create user credentials
      await userRepository.userCredentials(customerUserCreated.id!).create({
        password: hashedPassword,
      });

      console.log('Created customer user: customer@punto-venta.com');
    }
  }

  console.log('Seeding completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Cannot seed database', err);
  process.exit(1);
});
