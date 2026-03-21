# 🛒 TRIUNFO GO - Sistema de Inventario y Ventas

Sistema web para la gestión de inventario y punto de venta (POS), desarrollado con PHP nativo (Backend) y HTML/JS/CSS (Frontend).

## 📋 Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Backend (API REST)](#backend-api-rest)
5. [Frontend (Interfaz)](#frontend-interfaz)
6. [Instalación y Configuración](#instalación-y-configuración)
7. [Estado del Proyecto](#estado-del-proyecto)

---

## 🚀 Descripción General
**TRIUNFO GO** permite administrar productos, categorías y realizar ventas de manera eficiente.
- **Roles:** Administrador (Acceso total), Cajero (Ventas).
- **Funcionalidades:** Login seguro, CRUD de Productos y Categorías, Punto de Venta con descuento de stock automático.

---

## 🏗 Arquitectura del Proyecto
El proyecto sigue una arquitectura **Cliente-Servidor** separada:

### Backend (`/backend`)
- **Lenguaje:** PHP 7.4+ (Puro, sin frameworks).
- **Patrón:** MVC (Modelo-Vista-Controlador) adaptado a API.
- **Base de Datos:** MySQL (Uso de PDO para seguridad).
- **Seguridad:** Hash de contraseñas (Bcrypt), CORS habilitado.
- **Enrutamiento:** Router personalizado (`utils/Router.php`).

### Frontend (`/frontend`)
- **Tecnologías:** HTML5, CSS3, JavaScript (ES6+).
- **Estilo:** CSS Nativo (Flexbox/Grid).
- **Comunicación:** `fetch` API para consumir el Backend.
- **SPA Feel:** Navegación rápida y carga dinámica de contenidos.

---

## 💾 Estructura de Base de Datos
Nombre de la BD: `triunfo_go_php`

### Tablas Principales:
1. **usuarios**: `id_usuario`, `nombre`, `usuario`, `contrasena`, `email`, `estado`.
2. **roles**: `id_rol`, `nombre` (Admin, Cajero).
3. **roles_user**: Tabla pivote para relación N:M entre usuarios y roles.
4. **categorias**: `id_categoria`, `nombre`, `descripcion`.
5. **productos**: `id_producto`, `nombre`, `precio_venta`, `stock_actual`, `categoria_id`.
6. **facturas**: `id_factura`, `numero_factura`, `total`, `fecha`.
7. **detalle_factura**: Relación productos-factura con precio histórico.
8. **clientes**: `id_cliente`, `nombre` (Cliente General por defecto ID 1).

---

## 🔌 Backend (API REST)
URL Base: `http://localhost/proyecto_final/backend`

> Todos los endpoints (excepto `/login`, `/test-db` y `/`) requieren **token JWT** en el header:  
> `Authorization: Bearer {token}`

### Índice de endpoints
- [Salud y utilitarios](#salud-y-utilitarios)
- [Autenticación y usuarios](#autenticación-y-usuarios)
- [Clientes](#clientes)
- [Proveedores](#proveedores)
- [Categorías](#categorías)
- [Unidades de medida](#unidades-de-medida)
- [Productos](#productos)
- [Ventas / Facturas](#ventas--facturas)
- [Reportes](#reportes)
- [Empresa](#empresa)
- [Inventario (movimientos)](#inventario-movimientos)
- [Caja](#caja)

---

### Salud y utilitarios

#### `GET /`  
Mensaje de bienvenida a la API.

#### `GET /test-db`  
Verifica la conexión a la base de datos.  
**Uso:**  
```bash
curl http://localhost/proyecto_final/backend/test-db
```

---

### Autenticación y usuarios

#### `POST /login`  
Inicia sesión y devuelve un JWT.

- **Body (JSON):**
  ```json
  {
    "usuario": "admin",
    "contrasena": "tu_password"
  }
  ```
- **Respuesta:**  
  Datos del usuario + `token` JWT.

#### `POST /logout`  
Revoca el token actual (cierra sesión en backend).  
Requiere header `Authorization` válido.

#### `GET /profile`  
Obtiene el perfil del usuario autenticado (datos básicos).  
- **Auth:** cualquier usuario logueado.

#### `PUT /profile`  
Actualiza datos del usuario autenticado.  
- **Body (JSON):** campos editables de perfil.

#### `GET /users`  
Lista todos los usuarios.  
- **Auth:** solo rol **Admin (1)**.

#### `GET /users/{id}`  
Obtiene un usuario por ID.  
- **Auth:** solo Admin.

#### `POST /users`  
Crea un nuevo usuario (por ejemplo, un Cajero).  
- **Auth:** solo Admin.
- **Body (JSON):** datos de usuario (nombre, usuario, contraseña, rol, etc.).

#### `PUT /users/{id}`  
Actualiza usuario existente.  
- **Auth:** solo Admin.

#### `DELETE /users/{id}`  
Elimina (o desactiva) un usuario.  
- **Auth:** solo Admin.

> `POST /register` está deshabilitado para registro público en producción (retorna 403).

---

### Clientes

#### `GET /clients`  
Lista todos los clientes.  
- **Auth:** Admin y Cajero.

#### `GET /clients/{id}`  
Obtiene un cliente por ID.  
- **Auth:** Admin y Cajero.

#### `POST /clients`  
Crea un cliente.  
- **Auth:** Admin y Cajero.
- **Body (JSON):** nombre, documento, teléfono, dirección, email.

#### `PUT /clients/{id}`  
Actualiza un cliente.  
- **Auth:** Admin y Cajero.

#### `DELETE /clients/{id}`  
Elimina un cliente.  
- **Auth:** solo Admin.

---

### Proveedores

#### `GET /suppliers`  
Lista proveedores.  
- **Auth:** solo Admin.

#### `GET /suppliers/{id}`  
Obtiene proveedor por ID.  
- **Auth:** solo Admin.

#### `POST /suppliers`  
Crea proveedor.  
- **Auth:** solo Admin.
- **Body (JSON):** nombre, nit, teléfono, dirección, email.

#### `PUT /suppliers/{id}`  
Actualiza proveedor.  
- **Auth:** solo Admin.

#### `DELETE /suppliers/{id}`  
Elimina proveedor.  
- **Auth:** solo Admin.

---

### Categorías

#### `GET /categories`  
Lista categorías.  
- **Auth:** Admin y Cajero.

#### `GET /categories/{id}`  
Obtiene categoría por ID.  
- **Auth:** Admin y Cajero.

#### `POST /categories`  
Crea categoría.  
- **Auth:** solo Admin.

#### `PUT /categories/{id}`  
Actualiza categoría.  
- **Auth:** solo Admin.

#### `DELETE /categories/{id}`  
Elimina categoría.  
- **Auth:** solo Admin.

---

### Unidades de medida

#### `GET /units`  
Lista unidades de medida.  
- **Auth:** Admin y Cajero.

#### `GET /units/{id}`  
Obtiene unidad por ID.  
- **Auth:** Admin y Cajero.

#### `POST /units`  
Crea unidad de medida.  
- **Auth:** solo Admin.
- **Body (JSON):** nombre, abreviatura.

#### `PUT /units/{id}`  
Actualiza unidad.  
- **Auth:** solo Admin.

#### `DELETE /units/{id}`  
Elimina unidad.  
- **Auth:** solo Admin.

---

### Productos

#### `GET /products`  
Lista productos con paginación.  
- **Query params opcionales:** `?limit=10&page=1`.  
- **Respuesta:**
  ```json
  {
    "data": [ /* productos */ ],
    "meta": {
      "current_page": 1,
      "limit": 10,
      "total_items": 25,
      "total_pages": 3
    }
  }
  ```
- **Auth:** Admin y Cajero.

#### `GET /products/{id}`  
Obtiene un producto por ID.  
- **Auth:** Admin y Cajero.

#### `POST /products`  
Crea producto.  
- **Auth:** solo Admin.  
- **Body:**  
  - `application/json` (sin imagen)  
  - o `multipart/form-data` (con campo `imagen` para subir foto).

#### `PUT /products/{id}`  
Actualiza producto (JSON).  
- **Auth:** solo Admin.

#### `POST /products/{id}`  
Actualiza producto permitiendo imagen vía `FormData`.  
- **Auth:** solo Admin.  
- **Body:** `multipart/form-data`.

#### `DELETE /products/{id}`  
Elimina (soft delete) un producto.  
- **Auth:** solo Admin.

---

### Lotes (Trazabilidad y precio por lote)

Los lotes permiten manejar el inventario con trazabilidad (FIFO) y con precio de venta por lote.

#### `GET /products/{id}/lots`
Lista los lotes de un producto (FIFO: más antiguo primero).
- **Auth:** Admin y Cajero.

#### `POST /lots`
Crea un lote (entrada de inventario) para un producto.
- **Auth:** solo Admin.
- **Body (JSON):**
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

---

### Ventas / Facturas

#### `GET /invoices`  
Lista facturas con paginación.  
- **Query params:** `?limit=10&page=1`.  
- **Respuesta:** mismo formato `{ data, meta }`.  
- **Auth:** Admin y Cajero.

#### `GET /invoices/{id}`  
Obtiene detalle completo de una factura (cabecera + items).  
- **Auth:** Admin y Cajero.

#### `POST /invoices`  
Registra una venta/factura.  
- **Auth:** Admin y Cajero.  
- **Body (JSON) (nuevo con lotes):**
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
- El backend calcula el total real usando precio por lote, descuenta stock y guarda trazabilidad (detalle_factura.lote_id y movimientos_inventario.lote_id).

#### `POST /invoices/quote`
Cotiza una venta antes de cobrar (devuelve total real y desglose por lotes).
- **Auth:** Admin y Cajero.
- **Body (JSON):**
  ```json
  {
    "usuario_id": 2,
    "items": [
      { "producto_id": 5, "cantidad": 3, "lote_id": 101 }
    ]
  }
  ```

---

### Reportes

#### `GET /reports/dashboard`  
Devuelve datos para dashboard de administrador:  
- Ventas últimos días.  
- Top productos.  
- Productos con stock bajo.  
- KPIs generales.  
- **Auth:** solo Admin.

---

### Empresa

#### `GET /company`  
Obtiene datos de la empresa (nombre, NIT, dirección, etc.).  
- **Auth:** Admin y Cajero.

#### `POST /company`  
Crea/actualiza datos de la empresa.  
- **Auth:** solo Admin.  
- **Body:** `multipart/form-data` (permite subir logo).

---

### Inventario (movimientos)

#### `GET /inventory/movements`  
Lista movimientos de inventario (entradas/salidas).  
- **Auth:** Admin y Cajero.  
- **Uso típico:** reportes y auditoría de stock.

#### `GET /inventory/summary`
Devuelve KPIs/resumen de movimientos para el módulo de inventario.
- **Auth:** Admin y Cajero.

#### `POST /inventory/adjust`
Registra un ajuste manual de inventario (entrada/salida) **por lote**.
- **Auth:** solo Admin.
- **Body (JSON):**
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
Obtiene el estado de caja del usuario (sesión abierta, totales por método, etc.).  
- **Auth:** Admin y Cajero.
- **Uso:** pantallas de dashboard/cajero.

#### `POST /box/open`  
Abre una nueva sesión de caja.  
- **Auth:** Cajero.  
- **Body (JSON):**
  ```json
  {
    "monto_apertura": 50000
  }
  ```

#### `POST /box/close`  
Cierra la sesión de caja actual.  
- **Auth:** Cajero.  
- **Body (JSON):**
  ```json
  {
    "monto_cierre": 120000,
    "observaciones": "Turno mañana"
  }
  ```
- Calcula totales por método de pago y diferencia vs sistema.

---

## 🖥 Frontend (Interfaz)

### Módulos:
1. **Login**: `frontend/views/auth/login.html`.
2. **Admin**:
   - Dashboard: `frontend/views/admin/dashboard.html`.
   - Inventario: `frontend/views/admin/productos.html` (incluye gestión de lotes).
   - Movimientos: `frontend/views/admin/movimientos.html` (ajustes por lote).
   - Facturación/Historial: `frontend/views/admin/historial.html`.
3. **Cajero**:
   - POS/Caja: `frontend/views/cashier/ventas.html` (muestra desglose por lotes).
   - Historial: `frontend/views/cashier/historial.html`.

---

## ⚙️ Instalación y Configuración

1. **Requisitos:** XAMPP (Apache + MySQL) + Composer.
2. **Base de Datos:**
   - Crear BD `triunfo_go_php` en phpMyAdmin.
   - Importar el SQL base (ej: `backend/db/triunfo_go_php(1).sql`) o el SQL actualizado con lotes.
3. **Backend (dependencias):**
   - Entrar a `backend/` y ejecutar `composer install`.
4. **Configuración:**
   - Ajustar credenciales en `backend/.env` (DB_HOST, DB_NAME, DB_USER, DB_PASS, JWT_SECRET).
5. **Ejecución:**
   - Login: `http://localhost/proyecto_final/frontend/views/auth/login.html`.

---

## ✅ Estado del Proyecto (Seguimiento)

- [x] **Configuración Inicial**: Estructura de carpetas y Conexión BD.
- [x] **Autenticación**: Login funcional con roles.
- [x] **Gestión de Categorías**: CRUD completo.
- [x] **Gestión de Productos**: CRUD completo con asignación de categorías.
- [x] **Punto de Venta (Ventas)**:
    - [x] Interfaz POS.
    - [x] Carrito de compras JS.
    - [x] Backend de facturación con transacción.
    - [x] Descuento de stock automático.
- [x] **Gestión de Clientes**: CRUD de clientes.
- [x] **Reportes/Historial**: visualización de ventas realizadas.
- [x] **Caja**: apertura/cierre y sesión por usuario.
- [x] **Lotes**: FIFO, selección manual y precio por lote.

---
