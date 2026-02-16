-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-02-2026 a las 14:57:50
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `triunfo_go_php`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `caja_sesiones`
--

CREATE TABLE `caja_sesiones` (
  `id_sesion` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `monto_apertura` decimal(10,2) NOT NULL,
  `monto_cierre` decimal(10,2) DEFAULT NULL,
  `fecha_apertura` datetime DEFAULT current_timestamp(),
  `fecha_cierre` datetime DEFAULT NULL,
  `estado` enum('abierta','cerrada') DEFAULT 'abierta'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `caja_sesiones`
--

INSERT INTO `caja_sesiones` (`id_sesion`, `usuario_id`, `monto_apertura`, `monto_cierre`, `fecha_apertura`, `fecha_cierre`, `estado`) VALUES
(1, 1, 9000.00, NULL, '2026-02-11 18:25:58', NULL, 'abierta'),
(2, 2, 9000.00, NULL, '2026-02-11 18:43:17', NULL, 'abierta');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nombre`, `descripcion`, `creado_en`) VALUES
(2, 'Tuberculos', 'Papas, yucas y otros', '2026-02-09 02:28:37'),
(3, 'aguacates', '....', '2026-02-09 14:59:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `documento` varchar(20) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id_cliente`, `nombre`, `documento`, `telefono`, `direccion`, `email`, `creado_en`) VALUES
(1, 'Cliente General', '852666', '0000000000', 'Local', 'general@triunfogo.com', '2026-02-09 03:00:51'),
(2, 'Farid tin', '785958', '3135285844', 'nose', 'lesheritoomg@gmail.com', '2026-02-09 13:40:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_factura`
--

CREATE TABLE `detalle_factura` (
  `id_detalle` int(11) NOT NULL,
  `factura_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_factura`
--

INSERT INTO `detalle_factura` (`id_detalle`, `factura_id`, `producto_id`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 1, 1, 5000.00, 5000.00),
(2, 2, 3, 16, 6000.00, 96000.00),
(3, 3, 3, 1, 6000.00, 6000.00),
(4, 4, 3, 1, 6000.00, 6000.00),
(5, 5, 3, 1, 6000.00, 6000.00),
(6, 6, 3, 1, 6000.00, 6000.00),
(7, 7, 3, 1, 6000.00, 6000.00),
(8, 8, 1, 2, 2500.00, 5000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresa`
--

CREATE TABLE `empresa` (
  `id_empresa` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `nit` varchar(20) DEFAULT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `lema` varchar(255) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id_factura` int(11) NOT NULL,
  `numero_factura` varchar(30) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `cliente_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','transferencia','credito') DEFAULT 'efectivo',
  `observaciones` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `sesion_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `facturas`
--

INSERT INTO `facturas` (`id_factura`, `numero_factura`, `fecha`, `cliente_id`, `usuario_id`, `total`, `metodo_pago`, `observaciones`, `creado_en`, `sesion_id`) VALUES
(1, 'FAC-1770606173', '2026-02-08 22:02:53', 1, NULL, 5000.00, 'efectivo', '', '2026-02-09 03:02:53', NULL),
(2, 'FAC-1770644416', '2026-02-09 08:40:16', 2, NULL, 96000.00, 'efectivo', '', '2026-02-09 13:40:16', NULL),
(3, 'FAC-1770649571', '2026-02-09 10:06:11', NULL, NULL, 6000.00, 'efectivo', '', '2026-02-09 15:06:11', NULL),
(4, 'FAC-1770653536', '2026-02-09 11:12:16', NULL, 1, 6000.00, 'efectivo', '', '2026-02-09 16:12:16', NULL),
(5, 'FAC-1770827730', '2026-02-11 11:35:30', NULL, 1, 6000.00, 'efectivo', '', '2026-02-11 16:35:30', NULL),
(6, 'FAC-1770853024', '2026-02-11 18:37:04', NULL, 1, 6000.00, 'efectivo', '', '2026-02-11 23:37:04', NULL),
(7, 'FAC-1770853407', '2026-02-11 18:43:27', NULL, 2, 6000.00, 'efectivo', '', '2026-02-11 23:43:27', NULL),
(8, 'FAC-1770910615', '2026-02-12 10:36:55', NULL, 1, 5000.00, 'efectivo', '', '2026-02-12 15:36:55', 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jwt_blacklist`
--

CREATE TABLE `jwt_blacklist` (
  `jti` varchar(64) NOT NULL,
  `exp` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_inventario`
--

CREATE TABLE `movimientos_inventario` (
  `id_movimiento` int(11) NOT NULL,
  `tipo` enum('entrada','salida') NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `descripcion` varchar(255) DEFAULT NULL,
  `referencia` varchar(50) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimientos_inventario`
--

INSERT INTO `movimientos_inventario` (`id_movimiento`, `tipo`, `producto_id`, `cantidad`, `fecha`, `descripcion`, `referencia`, `creado_en`) VALUES
(1, 'entrada', 3, 40, '2026-02-09 06:49:10', 'Stock Inicial', 'CREACION', '2026-02-09 11:49:10'),
(2, 'salida', 1, 49, '2026-02-09 06:53:16', 'Baja de Producto (Eliminado)', 'BAJA', '2026-02-09 11:53:16'),
(3, 'salida', 3, 16, '2026-02-09 08:40:16', 'Venta Factura FAC-1770644416', 'FAC-1770644416', '2026-02-09 13:40:16'),
(4, 'entrada', 4, 30, '2026-02-09 10:01:26', 'Stock Inicial', 'CREACION', '2026-02-09 15:01:26'),
(5, 'salida', 3, 1, '2026-02-09 10:06:11', 'Venta Factura FAC-1770649571', 'FAC-1770649571', '2026-02-09 15:06:11'),
(6, 'salida', 3, 1, '2026-02-09 11:12:16', 'Venta Factura FAC-1770653536', 'FAC-1770653536', '2026-02-09 16:12:16'),
(7, 'salida', 3, 1, '2026-02-11 11:35:30', 'Venta Factura FAC-1770827730', 'FAC-1770827730', '2026-02-11 16:35:30'),
(8, 'salida', 3, 1, '2026-02-11 18:37:04', 'Venta Factura FAC-1770853024', 'FAC-1770853024', '2026-02-11 23:37:04'),
(9, 'salida', 3, 1, '2026-02-11 18:43:27', 'Venta Factura FAC-1770853407', 'FAC-1770853407', '2026-02-11 23:43:27'),
(10, 'salida', 1, 2, '2026-02-12 10:36:55', 'Venta Factura FAC-1770910615', 'FAC-1770910615', '2026-02-12 15:36:55'),
(11, 'entrada', 5, 92, '2026-02-16 08:35:55', 'Stock Inicial', 'CREACION', '2026-02-16 13:35:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `unidad_medida_id` int(11) DEFAULT NULL,
  `precio_compra` decimal(10,2) NOT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `stock_actual` int(11) DEFAULT 0,
  `stock_minimo` int(11) DEFAULT 0,
  `imagen` varchar(255) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_producto`, `nombre`, `descripcion`, `categoria_id`, `unidad_medida_id`, `precio_compra`, `precio_venta`, `stock_actual`, `stock_minimo`, `imagen`, `estado`, `creado_en`, `actualizado_en`) VALUES
(1, 'papa pastusa', '', 2, NULL, 0.00, 5000.00, -2, 0, NULL, 'inactivo', '2026-02-09 02:22:21', '2026-02-12 15:36:55'),
(3, 'papa llanera', '', 2, 1, 0.00, 6000.00, 19, 0, 'uploads/products/6989ebd918ebd.jpeg', 'activo', '2026-02-09 11:49:10', '2026-02-11 23:43:27'),
(4, 'aguacate', '', 3, 1, 0.00, 9000.00, 30, 0, 'uploads/products/6989f6c6b0ad4.jpeg', 'activo', '2026-02-09 15:01:26', '2026-02-16 13:31:19'),
(5, 'papa linterna', '', 2, 1, 0.00, 6920.00, 92, 5, 'uploads/products/69931d3b9c3ba.jpg', 'activo', '2026-02-16 13:35:55', '2026-02-16 13:35:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `id_proveedor` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `nit` varchar(20) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id_proveedor`, `nombre`, `nit`, `telefono`, `direccion`, `email`, `creado_en`) VALUES
(1, 'aguacatesS:A', '8520741', '32145', '58583ss', 'aguacases@gmail.com', '2026-02-09 14:54:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedor_producto`
--

CREATE TABLE `proveedor_producto` (
  `id` int(11) NOT NULL,
  `proveedor_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedor_producto`
--

INSERT INTO `proveedor_producto` (`id`, `proveedor_id`, `producto_id`, `creado_en`) VALUES
(2, 1, 4, '2026-02-16 13:31:19'),
(4, 1, 3, '2026-02-16 13:31:40'),
(5, 1, 5, '2026-02-16 13:35:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre`, `descripcion`, `creado_en`) VALUES
(1, 'admin', 'Administrador general del sistema', '2026-02-08 17:35:31'),
(2, 'cajero', 'Encargado de ventas y facturación', '2026-02-08 17:35:31');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles_user`
--

CREATE TABLE `roles_user` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `rol_id` int(11) NOT NULL,
  `asignado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles_user`
--

INSERT INTO `roles_user` (`id`, `usuario_id`, `rol_id`, `asignado_en`) VALUES
(1, 1, 1, '2026-02-09 02:45:30'),
(2, 2, 2, '2026-02-11 23:23:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidades_medida`
--

CREATE TABLE `unidades_medida` (
  `id_unidad` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `abreviatura` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `unidades_medida`
--

INSERT INTO `unidades_medida` (`id_unidad`, `nombre`, `abreviatura`) VALUES
(1, 'kilogramo', 'kg');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `usuario`, `contrasena`, `email`, `creado_en`) VALUES
(1, 'Admin Prueba', 'admin', '$2y$10$xR/qC3vL5XXJhQWgPNOxbeQVZW/runeUu1ckH7/FmsEzkvRr8HEvO', 'admin@prueba.com', '2026-02-09 02:15:20'),
(2, 'Cajero', 'Cajero', '$2y$10$C0angHCc734aQhSaciVunupsEjs7mr0kLlZOMtePH1h3gSb/F1aGG', 'Cajero@gmail.com', '2026-02-11 23:23:01');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `caja_sesiones`
--
ALTER TABLE `caja_sesiones`
  ADD PRIMARY KEY (`id_sesion`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`);

--
-- Indices de la tabla `detalle_factura`
--
ALTER TABLE `detalle_factura`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `factura_id` (`factura_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `empresa`
--
ALTER TABLE `empresa`
  ADD PRIMARY KEY (`id_empresa`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id_factura`),
  ADD UNIQUE KEY `numero_factura` (`numero_factura`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `facturas_ibfk_2` (`usuario_id`);

--
-- Indices de la tabla `jwt_blacklist`
--
ALTER TABLE `jwt_blacklist`
  ADD PRIMARY KEY (`jti`);

--
-- Indices de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD PRIMARY KEY (`id_movimiento`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_producto`),
  ADD KEY `categoria_id` (`categoria_id`),
  ADD KEY `unidad_medida_id` (`unidad_medida_id`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id_proveedor`);

--
-- Indices de la tabla `proveedor_producto`
--
ALTER TABLE `proveedor_producto`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `proveedor_id` (`proveedor_id`,`producto_id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `roles_user`
--
ALTER TABLE `roles_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`,`rol_id`),
  ADD KEY `rol_id` (`rol_id`);

--
-- Indices de la tabla `unidades_medida`
--
ALTER TABLE `unidades_medida`
  ADD PRIMARY KEY (`id_unidad`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `caja_sesiones`
--
ALTER TABLE `caja_sesiones`
  MODIFY `id_sesion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `detalle_factura`
--
ALTER TABLE `detalle_factura`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id_empresa` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id_factura` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id_movimiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `proveedor_producto`
--
ALTER TABLE `proveedor_producto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `roles_user`
--
ALTER TABLE `roles_user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `unidades_medida`
--
ALTER TABLE `unidades_medida`
  MODIFY `id_unidad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_factura`
--
ALTER TABLE `detalle_factura`
  ADD CONSTRAINT `detalle_factura_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id_factura`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_factura_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id_producto`);

--
-- Filtros para la tabla `empresa`
--
ALTER TABLE `empresa`
  ADD CONSTRAINT `empresa_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id_cliente`),
  ADD CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD CONSTRAINT `movimientos_inventario_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id_producto`);

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id_categoria`),
  ADD CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`unidad_medida_id`) REFERENCES `unidades_medida` (`id_unidad`);

--
-- Filtros para la tabla `proveedor_producto`
--
ALTER TABLE `proveedor_producto`
  ADD CONSTRAINT `proveedor_producto_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id_proveedor`) ON DELETE CASCADE,
  ADD CONSTRAINT `proveedor_producto_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `roles_user`
--
ALTER TABLE `roles_user`
  ADD CONSTRAINT `roles_user_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `roles_user_ibfk_2` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
