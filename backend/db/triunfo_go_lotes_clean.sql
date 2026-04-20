DROP DATABASE IF EXISTS triunfo_go_lotes;
CREATE DATABASE triunfo_go_lotes CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE triunfo_go_lotes;

CREATE TABLE usuarios (
  id_usuario INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  email VARCHAR(100) DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE roles (
  id_rol INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_rol),
  UNIQUE KEY uq_roles_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE roles_user (
  id INT(11) NOT NULL AUTO_INCREMENT,
  usuario_id INT(11) NOT NULL,
  rol_id INT(11) NOT NULL,
  asignado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_rol (usuario_id, rol_id),
  KEY idx_roles_user_rol_id (rol_id),
  CONSTRAINT fk_roles_user_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_roles_user_rol FOREIGN KEY (rol_id) REFERENCES roles (id_rol) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE categorias (
  id_categoria INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE unidades_medida (
  id_unidad INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  abreviatura VARCHAR(10) NOT NULL,
  PRIMARY KEY (id_unidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE clientes (
  id_cliente INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  documento VARCHAR(20) DEFAULT NULL,
  telefono VARCHAR(20) DEFAULT NULL,
  direccion VARCHAR(150) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE proveedores (
  id_proveedor INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  nit VARCHAR(20) DEFAULT NULL,
  telefono VARCHAR(20) DEFAULT NULL,
  direccion VARCHAR(150) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_proveedor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE productos (
  id_producto INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  categoria_id INT(11) DEFAULT NULL,
  unidad_medida_id INT(11) DEFAULT NULL,
  precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_actual INT(11) DEFAULT 0,
  stock_minimo INT(11) DEFAULT 0,
  imagen VARCHAR(255) DEFAULT NULL,
  estado ENUM('activo','inactivo') DEFAULT 'activo',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_producto),
  KEY idx_productos_categoria_id (categoria_id),
  KEY idx_productos_unidad_medida_id (unidad_medida_id),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id_categoria) ON DELETE SET NULL,
  CONSTRAINT fk_productos_unidad FOREIGN KEY (unidad_medida_id) REFERENCES unidades_medida (id_unidad) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE proveedor_producto (
  id INT(11) NOT NULL AUTO_INCREMENT,
  proveedor_id INT(11) NOT NULL,
  producto_id INT(11) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_proveedor_producto (proveedor_id, producto_id),
  KEY idx_proveedor_producto_producto (producto_id),
  CONSTRAINT fk_pp_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id_proveedor) ON DELETE CASCADE,
  CONSTRAINT fk_pp_producto FOREIGN KEY (producto_id) REFERENCES productos (id_producto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE caja_sesiones (
  id_sesion INT(11) NOT NULL AUTO_INCREMENT,
  usuario_id INT(11) NOT NULL,
  monto_apertura DECIMAL(10,2) NOT NULL,
  monto_cierre DECIMAL(10,2) DEFAULT NULL,
  total_efectivo DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_tarjeta DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_transferencia DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_otros DECIMAL(10,2) NOT NULL DEFAULT 0,
  diferencia DECIMAL(10,2) NOT NULL DEFAULT 0,
  fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATETIME DEFAULT NULL,
  estado ENUM('abierta','cerrada') DEFAULT 'abierta',
  PRIMARY KEY (id_sesion),
  KEY idx_caja_usuario (usuario_id),
  CONSTRAINT fk_caja_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE facturas (
  id_factura INT(11) NOT NULL AUTO_INCREMENT,
  numero_factura VARCHAR(30) NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  cliente_id INT(11) DEFAULT NULL,
  usuario_id INT(11) DEFAULT NULL,
  sesion_id INT(11) DEFAULT NULL,
  estado ENUM('pagada','anulada','pendiente') NOT NULL DEFAULT 'pagada',
  total DECIMAL(10,2) NOT NULL,
  monto_recibido DECIMAL(10,2) NOT NULL DEFAULT 0,
  metodo_pago ENUM('efectivo','tarjeta','transferencia','otros') NOT NULL DEFAULT 'efectivo',
  observaciones VARCHAR(255) DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_factura),
  UNIQUE KEY uq_numero_factura (numero_factura),
  KEY idx_facturas_cliente (cliente_id),
  KEY idx_facturas_usuario (usuario_id),
  KEY idx_facturas_sesion (sesion_id),
  CONSTRAINT fk_facturas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id_cliente) ON DELETE SET NULL,
  CONSTRAINT fk_facturas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
  CONSTRAINT fk_facturas_sesion FOREIGN KEY (sesion_id) REFERENCES caja_sesiones (id_sesion) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE lotes_producto (
  id_lote INT(11) NOT NULL AUTO_INCREMENT,
  producto_id INT(11) NOT NULL,
  proveedor_id INT(11) NULL,
  numero_lote VARCHAR(50) NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_vencimiento DATE NULL,
  costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_venta DECIMAL(10,2) NOT NULL,
  cantidad_inicial INT(11) NOT NULL,
  cantidad_disponible INT(11) NOT NULL,
  estado ENUM('activo','agotado','inactivo','bloqueado','cuarentena','vencido') NOT NULL DEFAULT 'activo',
  motivo_estado VARCHAR(255) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_lote),
  KEY idx_lotes_producto (producto_id),
  KEY idx_lotes_proveedor (proveedor_id),
  KEY idx_lotes_fecha (fecha_creacion),
  CONSTRAINT fk_lotes_producto FOREIGN KEY (producto_id) REFERENCES productos (id_producto) ON DELETE CASCADE,
  CONSTRAINT fk_lotes_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id_proveedor) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE detalle_factura (
  id_detalle INT(11) NOT NULL AUTO_INCREMENT,
  factura_id INT(11) NOT NULL,
  producto_id INT(11) NOT NULL,
  lote_id INT(11) NULL,
  lote_numero_snapshot VARCHAR(50) NULL,
  costo_unitario_snapshot DECIMAL(10,2) NOT NULL DEFAULT 0,
  cantidad INT(11) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_detalle),
  KEY idx_det_factura (factura_id),
  KEY idx_det_producto (producto_id),
  KEY idx_det_lote (lote_id),
  CONSTRAINT fk_det_factura FOREIGN KEY (factura_id) REFERENCES facturas (id_factura) ON DELETE CASCADE,
  CONSTRAINT fk_det_producto FOREIGN KEY (producto_id) REFERENCES productos (id_producto) ON DELETE RESTRICT,
  CONSTRAINT fk_det_lote FOREIGN KEY (lote_id) REFERENCES lotes_producto (id_lote) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE movimientos_inventario (
  id_movimiento INT(11) NOT NULL AUTO_INCREMENT,
  tipo ENUM('entrada','salida') NOT NULL,
  producto_id INT(11) NOT NULL,
  lote_id INT(11) NULL,
  numero_lote_snapshot VARCHAR(50) NULL,
  cantidad INT(11) NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  descripcion VARCHAR(255) DEFAULT NULL,
  referencia VARCHAR(50) DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_movimiento),
  KEY idx_mov_producto (producto_id),
  KEY idx_mov_lote (lote_id),
  CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES productos (id_producto) ON DELETE RESTRICT,
  CONSTRAINT fk_mov_lote FOREIGN KEY (lote_id) REFERENCES lotes_producto (id_lote) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE empresa (
  id_empresa INT(11) NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  nit VARCHAR(20) DEFAULT NULL,
  direccion VARCHAR(150) DEFAULT NULL,
  telefono VARCHAR(20) DEFAULT NULL,
  logo VARCHAR(255) DEFAULT NULL,
  lema VARCHAR(255) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  usuario_id INT(11) DEFAULT NULL,
  PRIMARY KEY (id_empresa),
  KEY idx_empresa_usuario (usuario_id),
  CONSTRAINT fk_empresa_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE jwt_blacklist (
  jti VARCHAR(64) NOT NULL,
  exp INT(10) UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (jti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE notificaciones (
  id INT NOT NULL AUTO_INCREMENT,
  usuario_id INT(11) NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje VARCHAR(500) NOT NULL,
  tipo ENUM('info','warning','alert') NOT NULL DEFAULT 'info',
  estado ENUM('nuevo','leido') NOT NULL DEFAULT 'nuevo',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notificaciones_usuario (usuario_id),
  CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
