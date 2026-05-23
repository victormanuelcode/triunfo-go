# TRIUNFO GO — Sistema de Inventario y Ventas

Sistema web para la gestión de inventario, punto de venta (POS), caja, reportes y administración de usuarios. Backend en PHP nativo (API REST) y frontend en HTML, CSS y JavaScript.

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Arquitectura del proyecto](#arquitectura-del-proyecto)
3. [Estructura de carpetas](#estructura-de-carpetas)
4. [Base de datos](#base-de-datos)
5. [Backend (API REST)](#backend-api-rest)
6. [Frontend (interfaz)](#frontend-interfaz)
7. [Instalación y configuración](#instalación-y-configuración)
8. [Variables de entorno](#variables-de-entorno)
9. [Recuperación de contraseña y correo](#recuperación-de-contraseña-y-correo)
10. [Pruebas y QA](#pruebas-y-qa)
11. [Estado del proyecto](#estado-del-proyecto)

---

## Descripción general

**TRIUNFO GO** permite administrar productos, categorías, proveedores, clientes y realizar ventas con control de stock por lotes (FIFO o selección manual).

### Roles

| ID | Rol | Permisos principales |
|----|-----|----------------------|
| 1 | Administrador | Acceso total: usuarios, proveedores, reportes, anulación de facturas, ajustes de inventario |
| 2 | Cajero | POS, caja, clientes, egresos propios, historial de ventas |

### Funcionalidades principales

- Autenticación con **JWT** (8 horas) y revocación en logout (`jwt_blacklist`)
- Recuperación de contraseña por correo con código de 6 dígitos
- CRUD de productos, categorías, clientes, proveedores y unidades de medida
- Inventario por **lotes** con trazabilidad, regularización y movimientos
- Punto de venta (POS) con cotización, cobro y ticket
- Sesiones de **caja** (apertura/cierre con totales por método de pago)
- **Egresos** (gastos) ligados opcionalmente a la sesión de caja
- Reportes y dashboard administrativo
- Notificaciones in-app (caja, alertas)
- Perfil de usuario con avatar y tema claro/oscuro
- Datos de empresa configurables (logo, NIT, etc.)

---

## Arquitectura del proyecto

Arquitectura **cliente-servidor** con frontend estático y backend API.

### Backend (`/backend`)

| Aspecto | Detalle |
|---------|---------|
| Lenguaje | PHP 7.4+ (sin framework) |
| Patrón | MVC adaptado a API REST |
| Base de datos | MySQL / MariaDB vía **PDO** |
| Enrutamiento | Router propio (`utils/Router.php`) + `.htaccess` |
| Autenticación | JWT (`firebase/php-jwt`) + blacklist en BD |
| Configuración | Variables de entorno (`vlucas/phpdotenv`) |
| Correo | PHPMailer (`phpmailer/phpmailer`) |

**Dependencias Composer** (`backend/composer.json`):

- `vlucas/phpdotenv` — carga de `.env`
- `firebase/php-jwt` — tokens JWT
- `phpmailer/phpmailer` — envío de correos

### Frontend (`/frontend`)

| Aspecto | Detalle |
|---------|---------|
| Tecnologías | HTML5, CSS3, JavaScript ES6+ |
| Estilo | CSS nativo (Flexbox/Grid), tema claro/oscuro |
| Comunicación | `fetch` contra `backend/index.php` |
| Auth | Token en `localStorage`, helpers en `js/auth.js` |
| Rutas | Vistas HTML por rol (`admin/`, `cashier/`, `auth/`, `common/`) |

La URL base de la API se detecta automáticamente según la ruta del proyecto (funciona en `/triunfo-go`, subcarpetas de Apache, etc.).

---

## Estructura de carpetas

```
triunfo-go/
├── backend/
│   ├── config/           # Database.php
│   ├── controllers/      # Controladores REST
│   ├── models/           # Acceso a datos y lógica de dominio
│   ├── utils/            # Router, AuthMiddleware, MailService
│   ├── uploads/          # Avatares, productos, logo empresa
│   ├── logs/             # mail.log (modo desarrollo)
│   ├── db/               # Scripts SQL
│   ├── index.php         # Punto de entrada API
│   ├── .env.example      # Plantilla de configuración
│   └── composer.json
├── frontend/
│   ├── views/            # Páginas HTML por módulo
│   ├── js/               # Lógica de interfaz
│   ├── css/              # Estilos
│   └── partials/         # Sidebar, topbar
├── QA_CHECKLIST.md       # Checklist de regresión
└── README.md
```

---

## Base de datos

**Nombre recomendado:** `triunfo_go_php`

### Scripts SQL disponibles

| Archivo | Uso |
|---------|-----|
| `backend/db/triunfo_go_php.sql` | Dump principal con datos de ejemplo |
| `backend/db/triunfo_go_lotes_clean.sql` | Esquema limpio orientado a lotes (BD `triunfo_go_lotes`) |
| `backend/db/migrate_facturas_monto_recibido.sql` | Migración: columna `monto_recibido` en facturas |

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Usuarios del sistema (nombre, usuario, email, contraseña bcrypt, avatar, preferencias) |
| `roles` / `roles_user` | Roles y relación N:M con usuarios |
| `categorias` | Categorías de productos |
| `unidades_medida` | Unidades (kg, und, etc.) |
| `productos` | Catálogo con stock, precio base, imagen, categoría |
| `lotes_producto` | Lotes por producto (precio, costo, cantidad disponible, proveedor) |
| `proveedores` / `proveedor_producto` | Proveedores y relación con productos |
| `clientes` | Clientes (incluye Cliente General, id 1) |
| `facturas` / `detalle_factura` | Ventas e ítems (con `lote_id` por línea) |
| `movimientos_inventario` | Entradas/salidas de stock (ajustes, ventas, compras) |
| `caja_sesiones` | Apertura y cierre de caja por usuario |
| `empresa` | Datos fiscales y logo de la empresa |
| `notificaciones` | Notificaciones por usuario o globales |
| `jwt_blacklist` | Tokens revocados en logout |
| `egresos` | Gastos registrados (opcionalmente por sesión de caja) |

### Tablas creadas automáticamente

Al usar ciertos módulos, el backend crea la tabla si no existe:

| Tabla | Modelo |
|-------|--------|
| `password_resets` | `PasswordReset.php` — códigos de recuperación de contraseña |

> Si usas el módulo de **egresos**, asegúrate de que la tabla `egresos` exista en tu BD. El código la consulta pero no incluye migración automática en el dump principal.

### Usuarios de prueba (dump incluido)

| Usuario | Rol | Notas |
|---------|-----|-------|
| `admin` | Admin | Contraseña definida en el SQL importado |
| `Cajero` | Cajero | Contraseña definida en el SQL importado |

---

## Backend (API REST)

**URL base:** `http://localhost/triunfo-go/backend`  
(Ajusta según tu instalación; también funciona como `.../backend/index.php/...` si el rewrite no está activo.)

### Autenticación

La mayoría de endpoints requieren header:

```
Authorization: Bearer {token}
```

**Endpoints públicos** (sin token):

- `GET /`
- `GET /test-db`
- `POST /login`
- `POST /password-reset/request`
- `POST /password-reset/confirm`

El token JWT expira a las **8 horas**. En logout se revoca mediante `jwt_blacklist`.

### Índice de endpoints

- [Salud y utilitarios](#salud-y-utilitarios)
- [Autenticación y usuarios](#autenticación-y-usuarios)
- [Recuperación de contraseña](#recuperación-de-contraseña)
- [Notificaciones](#notificaciones)
- [Clientes](#clientes)
- [Proveedores](#proveedores)
- [Categorías](#categorías)
- [Unidades de medida](#unidades-de-medida)
- [Productos](#productos)
- [Lotes](#lotes)
- [Ventas / Facturas](#ventas--facturas)
- [Reportes](#reportes)
- [Empresa](#empresa)
- [Inventario (movimientos)](#inventario-movimientos)
- [Caja](#caja)
- [Egresos (gastos)](#egresos-gastos)

---

### Salud y utilitarios

#### `GET /`

Mensaje de bienvenida a la API.

#### `GET /test-db`

Verifica la conexión a la base de datos.

```bash
curl http://localhost/triunfo-go/backend/test-db
```

---

### Autenticación y usuarios

#### `POST /login`

Inicia sesión y devuelve JWT.

**Body (JSON):**

```json
{
  "usuario": "admin",
  "contrasena": "tu_password"
}
```

**Respuesta:** datos del usuario + `token` + `expires_in`.

#### `POST /logout`

Revoca el token actual. Requiere `Authorization` válido.

#### `GET /profile`

Perfil del usuario autenticado.

#### `PUT /profile`

Actualiza datos del perfil (nombre, email, teléfono, preferencias).

#### `POST /profile/avatar`

Sube avatar (`multipart/form-data`, campo `avatar`: jpg/png/webp).

#### `GET /users`

Lista usuarios. **Auth:** solo Admin.

#### `GET /users/{id}`

Usuario por ID. **Auth:** solo Admin.

#### `POST /users`

Crea usuario. **Auth:** solo Admin.

#### `PUT /users/{id}`

Actualiza usuario. **Auth:** solo Admin.

#### `DELETE /users/{id}`

Elimina/desactiva usuario. **Auth:** solo Admin.

#### `POST /register`

Deshabilitado en producción (retorna **403**).

---

### Recuperación de contraseña

Flujo en dos pasos. Los códigos expiran a los **15 minutos**, se guardan hasheados y tienen límite de **3 solicitudes por email cada 15 minutos**.

#### `POST /password-reset/request`

Solicita código por correo.

**Body (JSON):**

```json
{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta:** siempre mensaje genérico (no revela si el email existe). En desarrollo puede incluir `dev_hint` con ruta del log si `MAIL_DRIVER=log`.

#### `POST /password-reset/confirm`

Restablece la contraseña con el código recibido.

**Body (JSON):**

```json
{
  "email": "usuario@ejemplo.com",
  "codigo": "123456",
  "contrasena": "nueva123",
  "contrasena_confirmacion": "nueva123"
}
```

---

### Notificaciones

#### `GET /notifications`

Lista notificaciones del usuario (incluye globales).

- **Query opcional:** `?only_unread=1`

#### `PATCH /notifications/{id}/read`

Marca una notificación como leída.

---

### Clientes

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/clients` | Admin, Cajero |
| GET | `/clients/{id}` | Admin, Cajero |
| POST | `/clients` | Admin, Cajero |
| PUT | `/clients/{id}` | Admin, Cajero |
| DELETE | `/clients/{id}` | Solo Admin |

---

### Proveedores

CRUD completo en `/suppliers` y `/suppliers/{id}`. **Auth:** solo Admin.

---

### Categorías

CRUD en `/categories` y `/categories/{id}`.

- Lectura: Admin y Cajero
- Escritura: solo Admin

---

### Unidades de medida

CRUD en `/units` y `/units/{id}`.

- Lectura: Admin y Cajero
- Escritura: solo Admin

---

### Productos

#### `GET /products`

Lista con paginación.

- **Query:** `?limit=10&page=1`
- **Respuesta:** `{ "data": [...], "meta": { "current_page", "limit", "total_items", "total_pages" } }`

#### `GET /products/{id}`

Detalle de producto.

#### `POST /products`

Crea producto. **Auth:** Admin.

- `application/json` (sin imagen)
- o `multipart/form-data` (campo `imagen`)

#### `PUT /products/{id}`

Actualiza producto (JSON). **Auth:** Admin.

#### `POST /products/{id}`

Actualiza producto con imagen vía `FormData`. **Auth:** Admin.

#### `DELETE /products/{id}`

Soft delete. **Auth:** Admin.

---

### Lotes

Inventario con trazabilidad FIFO y precio por lote.

#### `GET /products/{id}/lots`

Lotes del producto (FIFO: más antiguo primero). Admin y Cajero.

#### `GET /lots/{id}/detail`

Detalle de un lote. Admin y Cajero.

#### `GET /lots/regularization/candidates`

Productos candidatos a regularización de stock. Solo Admin.

#### `POST /lots`

Crea lote (entrada de inventario). Solo Admin.

```json
{
  "producto_id": 5,
  "cantidad": 20,
  "precio_venta": 6500,
  "costo_unitario": 4000,
  "proveedor_id": 1,
  "numero_lote": "L-2026-001"
}
```

`numero_lote` es opcional; si va vacío se genera como `L-YYYYMMDD-ID`.

#### `POST /lots/regularize`

Regulariza stock de un producto creando lote de ajuste. Solo Admin.

#### `PUT /lots/{id}`

Actualiza datos del lote. Solo Admin.

#### `POST /lots/{id}/restock`

Reabastecimiento sobre lote existente. Solo Admin.

#### `DELETE /lots/{id}`

Inactiva el lote (disponible 0). Solo Admin.

---

### Ventas / Facturas

#### `GET /invoices`

Lista facturas paginadas (`?limit=10&page=1`).

#### `GET /invoices/{id}`

Detalle completo (cabecera + ítems + lotes).

#### `POST /invoices`

Registra venta. Admin y Cajero.

```json
{
  "cliente_id": 1,
  "usuario_id": 2,
  "sesion_id": 3,
  "metodo_pago": "efectivo",
  "observaciones": "Entrega inmediata",
  "items": [
    {
      "producto_id": 1,
      "lotes": [
        { "lote_id": 101, "cantidad": 1 },
        { "lote_id": 102, "cantidad": 1 }
      ]
    }
  ]
}
```

El backend calcula totales por precio de lote, descuenta stock y registra trazabilidad en `detalle_factura` y `movimientos_inventario`.

#### `POST /invoices/quote`

Cotiza una venta antes de cobrar (total y desglose por lotes).

```json
{
  "usuario_id": 2,
  "items": [
    { "producto_id": 5, "cantidad": 3, "lote_id": 101 }
  ]
}
```

#### `POST /invoices/{id}/annul`

Anula factura y revierte stock. **Auth:** solo Admin.

---

### Reportes

#### `GET /reports/dashboard`

KPIs, ventas recientes, top productos, stock bajo, egresos del periodo. **Auth:** solo Admin.

---

### Empresa

#### `GET /company`

Datos de empresa. Admin y Cajero (ticket).

#### `POST /company`

Crea/actualiza empresa con logo (`multipart/form-data`). Solo Admin.

---

### Inventario (movimientos)

#### `GET /inventory/movements`

Historial de movimientos. Admin y Cajero.

#### `GET /inventory/summary`

Resumen/KPIs de inventario. Admin y Cajero.

#### `POST /inventory/adjust`

Ajuste manual por lote. Solo Admin.

```json
{
  "producto_id": 5,
  "lote_id": 101,
  "tipo": "salida",
  "cantidad": 2,
  "razon": "Ajuste por inventario físico"
}
```

---

### Caja

#### `GET /box/status`

Estado de caja del usuario (sesión abierta, totales por método, egresos).

#### `POST /box/open`

Abre sesión de caja.

```json
{
  "usuario_id": 2,
  "monto_apertura": 50000
}
```

#### `POST /box/close`

Cierra sesión y calcula diferencia.

```json
{
  "id_sesion": 3,
  "monto_cierre": 120000,
  "observaciones": "Turno mañana"
}
```

Fórmula esperada en caja: `monto_apertura + ventas - egresos`.

---

### Egresos (gastos)

#### `GET /expenses`

Lista egresos con filtros opcionales: `search`, `from`, `to`, `metodo_pago`, `sesion_id`, `usuario_id` (Admin).

- Admin: ve todos (puede filtrar por usuario)
- Cajero: solo los propios

#### `GET /expenses/{id}`

Detalle de un egreso.

#### `POST /expenses`

Registra egreso. Se asocia automáticamente a la sesión de caja abierta del usuario si no se envía `sesion_id`.

```json
{
  "concepto": "Compra insumos",
  "descripcion": "Papelería",
  "monto": 15000,
  "metodo_pago": "efectivo",
  "sesion_id": 3
}
```

Métodos válidos: `efectivo`, `transferencia`, `tarjeta`, `otros`.

#### `PUT /expenses/{id}` / `DELETE /expenses/{id}`

Actualiza o elimina egreso (permisos: Admin o dueño del registro).

---

## Frontend (interfaz)

**Entrada:** `http://localhost/triunfo-go/frontend/views/auth/login.html`

### Autenticación

| Vista | Archivo |
|-------|---------|
| Login | `frontend/views/auth/login.html` |
| Recuperar contraseña | `frontend/views/auth/recuperar-contrasena.html` |

### Administrador

| Módulo | Archivo |
|--------|---------|
| Dashboard | `frontend/views/admin/dashboard.html` |
| Productos / Lotes | `frontend/views/admin/productos.html` |
| Categorías | `frontend/views/admin/categorias.html` |
| Clientes | `frontend/views/admin/clientes.html` |
| Proveedores | `frontend/views/admin/proveedores.html` |
| Movimientos | `frontend/views/admin/movimientos.html` |
| Historial facturas | `frontend/views/admin/historial.html` |
| Nueva factura | `frontend/views/admin/nueva_factura.html` |
| Detalle factura | `frontend/views/admin/factura.html` |
| Reportes | `frontend/views/admin/reportes.html` |
| Egresos | `frontend/views/admin/egresos.html` |
| Usuarios | `frontend/views/admin/usuarios.html` |
| Configuración empresa | `frontend/views/admin/configuracion.html` |

### Cajero

| Módulo | Archivo |
|--------|---------|
| Dashboard | `frontend/views/cashier/dashboard.html` |
| POS / Ventas | `frontend/views/cashier/ventas.html` |
| Ticket | `frontend/views/cashier/ticket.html` |
| Historial | `frontend/views/cashier/historial.html` |
| Egresos | `frontend/views/cashier/egresos.html` |
| Configuración | `frontend/views/cashier/configuracion.html` |

### Común

| Módulo | Archivo |
|--------|---------|
| Perfil | `frontend/views/common/perfil.html` |
| Índice | `frontend/views/common/index.html` |

### JavaScript relevante

| Archivo | Función |
|---------|---------|
| `js/auth.js` | Token, roles, redirección, `API_BASE` |
| `js/login.js` | Formulario de login |
| `js/recuperar-contrasena.js` | Flujo de recuperación (2 pasos) |
| `js/notifications.js` | Campana de notificaciones |
| `js/cashier/pos/*` | Carrito, caja, checkout POS |
| `js/admin/inventory/*` | Productos, lotes, compras, regularización |

---

## Instalación y configuración

### Requisitos

- PHP 7.4+ con extensiones: `pdo_mysql`, `json`, `mbstring`, `openssl`
- Apache con `mod_rewrite` (recomendado)
- MySQL 5.7+ / MariaDB 10+
- [Composer](https://getcomposer.org/)

Compatible con **XAMPP**, **LAMP** o Apache en **Fedora/RHEL** (con ajustes SELinux para SMTP).

### Pasos

1. **Clonar o copiar** el proyecto en el directorio web de Apache  
   Ejemplo: `/var/www/html/triunfo-go`

2. **Crear la base de datos**

   ```sql
   CREATE DATABASE triunfo_go_php CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   ```

3. **Importar SQL**

   ```bash
   mysql -u root -p triunfo_go_php < backend/db/triunfo_go_php.sql
   ```

   Opcional: aplicar migraciones adicionales en `backend/db/`.

4. **Instalar dependencias PHP**

   ```bash
   cd backend
   composer install
   ```

5. **Configurar entorno**

   ```bash
   cp backend/.env.example backend/.env
   ```

   Editar `backend/.env` con credenciales de BD, `JWT_SECRET` y correo (ver sección siguiente).

6. **Permisos de escritura**

   El servidor web debe poder escribir en:

   - `backend/uploads/` (avatars, productos, logo)
   - `backend/logs/` (modo `MAIL_DRIVER=log`)

7. **Verificar instalación**

   - API: `http://localhost/triunfo-go/backend/test-db`
   - Login: `http://localhost/triunfo-go/frontend/views/auth/login.html`

### Apache / SELinux (Fedora)

Si SMTP falla por SELinux:

```bash
sudo setsebool -P httpd_can_network_connect 1
```

Asegúrate de que `AllowOverride All` esté habilitado para que funcione `backend/.htaccess`.

---

## Variables de entorno

Archivo: `backend/.env` (plantilla en `backend/.env.example`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Host MySQL | `localhost` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_NAME` | Nombre de BD | `triunfo_go_php` |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASS` | Contraseña MySQL | |
| `JWT_SECRET` | Clave secreta JWT (larga y aleatoria) | |
| `MAIL_DRIVER` | `log`, `smtp` o `mail` | `log` |
| `MAIL_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Puerto SMTP | `587` |
| `MAIL_USERNAME` | Usuario SMTP | |
| `MAIL_PASSWORD` | Contraseña SMTP | |
| `MAIL_ENCRYPTION` | `tls` o `ssl` | `tls` |
| `MAIL_FROM_ADDRESS` | Remitente | `noreply@triunfogo.com` |
| `MAIL_FROM_NAME` | Nombre remitente | `TRIUNFO GO` |

Si no existe `.env`, el backend intenta cargar `.env.example` como respaldo.

---

## Recuperación de contraseña y correo

### Modo desarrollo (`MAIL_DRIVER=log`)

Los códigos se escriben en `backend/logs/mail.log`. La respuesta API puede incluir `dev_hint` con la ruta exacta.

### Modo producción (`MAIL_DRIVER=smtp`)

Configura host, usuario y contraseña SMTP en `.env`. Gmail y otros proveedores suelen requerir contraseña de aplicación.

### Flujo de usuario

1. Ir a **Recuperar contraseña** desde el login
2. Ingresar email → recibir código de 6 dígitos
3. Ingresar código + nueva contraseña → confirmar

### Seguridad del flujo

- Respuesta genérica al solicitar código (no enumera emails)
- Código hasheado en BD, expira en 15 minutos, un solo uso
- Máximo 3 solicitudes por email cada 15 minutos

---

## Pruebas y QA

Checklist de regresión manual: [`QA_CHECKLIST.md`](QA_CHECKLIST.md)

Script automatizado (Windows PowerShell): `qa_run.ps1`

Verificaciones mínimas tras cambios:

- `GET /test-db` responde OK
- Login Admin y Cajero redirigen al dashboard correcto
- Crear lote, vender en POS, verificar stock y `detalle_factura.lote_id`
- Apertura/cierre de caja con egresos reflejados en totales

---

## Estado del proyecto

### Completado

- [x] Estructura MVC/API y conexión PDO con `.env`
- [x] Autenticación JWT + logout con blacklist
- [x] Recuperación de contraseña por correo
- [x] CRUD categorías, productos, clientes, proveedores, unidades
- [x] Inventario por lotes (FIFO, regularización, restock)
- [x] Movimientos y ajustes de inventario por lote
- [x] POS con cotización, carrito y ticket
- [x] Facturación con transacciones y trazabilidad por lote
- [x] Anulación de facturas (Admin)
- [x] Sesiones de caja (apertura/cierre)
- [x] Egresos ligados a caja
- [x] Reportes y dashboard administrativo
- [x] Notificaciones in-app
- [x] Perfil con avatar y tema claro/oscuro
- [x] Configuración de empresa (logo, datos fiscales)
- [x] Gestión de usuarios (Admin)

### Pendiente / mejoras

- [ ] Restringir rutas frontend por rol de forma estricta en todos los módulos
- [ ] Rate limit en verificación de código de recuperación
- [ ] Tabla `egresos` incluida en dump SQL principal
- [ ] Política de contraseñas más estricta (complejidad)
- [ ] Tests automatizados multiplataforma (actualmente `qa_run.ps1`)

---

**TRIUNFO GO** — Gestión agrícola e inventario · PHP + JavaScript
