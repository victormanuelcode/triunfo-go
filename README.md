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

### Endpoints Disponibles:

#### 🔐 Autenticación
- `POST /login`: Iniciar sesión.
- `POST /register`: Registrar nuevo usuario (Rol Cajero por defecto).

#### 📦 Productos
- `GET /products`: Listar todos.
- `GET /products/:id`: Obtener uno.
- `POST /products`: Crear producto.
- `PUT /products/:id`: Actualizar.
- `DELETE /products/:id`: Eliminar.

#### 🏷 Categorías
- `GET /categories`: Listar todas.
- `POST /categories`: Crear.
- `PUT /categories/:id`: Editar.
- `DELETE /categories/:id`: Eliminar.

#### 🧾 Ventas (Facturación)
- `POST /invoices`: Crear venta (Recibe JSON con items, total, cliente).
  - *Nota:* Esta acción descuenta stock automáticamente en una transacción ACID.

---

## 🖥 Frontend (Interfaz)

### Módulos:
1. **Login (`login.html`)**: Acceso al sistema. Redirección basada en roles.
2. **Inventario (`index.html`)**:
   - Listado de productos con indicadores de stock.
   - Modal para Crear/Editar productos (carga categorías dinámicamente).
3. **Categorías (`categorias.html`)**:
   - Gestión CRUD de familias de productos.
4. **Punto de Venta (`ventas.html`)**:
   - **Panel Izquierdo:** Buscador y catálogo visual de productos.
   - **Panel Derecho:** Carrito de compras interactivo.
   - **Proceso:** Selección -> Cálculo -> Confirmación -> Actualización de Stock.

---

## ⚙️ Instalación y Configuración

1. **Requisitos:** XAMPP (Apache + MySQL).
2. **Base de Datos:**
   - Crear BD `triunfo_go_php` en phpMyAdmin.
   - Importar script `backend/triunfo_go_php.sql` (si existe) o estructura actual.
   - Asegurar existencia de "Cliente General" (ID 1).
3. **Configuración:**
   - Verificar credenciales en `backend/config/Database.php`.
4. **Ejecución:**
   - Abrir navegador en `http://localhost/proyecto_final/frontend/login.html`.

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
- [ ] **Reportes/Historial**: Visualización de ventas realizadas (Pendiente).
- [ ] **Gestión de Clientes**: CRUD de clientes (Pendiente).

---

