-- phpMyAdmin SQL Dump
-- version 5.2.3-1.fc43
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 29-04-2026 a las 11:06:37
-- Versión del servidor: 10.11.16-MariaDB
-- Versión de PHP: 8.4.20

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
  `lote_id` int(11) DEFAULT NULL,
  `lote_numero_snapshot` varchar(50) DEFAULT NULL,
  `costo_unitario_snapshot` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cantidad` decimal(12,3) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_factura`
--

INSERT INTO `detalle_factura` (`id_detalle`, `factura_id`, `producto_id`, `lote_id`, `lote_numero_snapshot`, `costo_unitario_snapshot`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 1, 3, 'L-BASE-003', 0.00, 1.000, 5000.00, 5000.00),
(2, 2, 3, 2, 'L-BASE-002', 2000.00, 16.000, 6000.00, 96000.00),
(3, 3, 3, 3, 'L-BASE-003', 0.00, 1.000, 6000.00, 6000.00),
(4, 4, 3, 3, 'L-BASE-003', 0.00, 1.000, 6000.00, 6000.00),
(5, 5, 3, 3, 'L-BASE-003', 0.00, 1.000, 6000.00, 6000.00),
(6, 6, 3, 2, 'L-BASE-002', 2000.00, 1.000, 6000.00, 6000.00),
(7, 7, 3, 1, 'L-BASE-001', 0.00, 1.000, 6000.00, 6000.00),
(9, 9, 5, 4, NULL, 300.00, 1.000, 7000.00, 7000.00),
(10, 10, 5, 4, NULL, 300.00, 3.000, 7000.00, 21000.00),
(11, 11, 5, 5, '7785', 0.00, 4.000, 80020.00, 320080.00),
(12, 12, 4, 2, 'L-BASE-002', 2000.00, 1.000, 6000.00, 6000.00),
(13, 13, 4, 2, 'L-BASE-002', 2000.00, 1.000, 6000.00, 6000.00);

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
(8, 'FAC-1770910615', '2026-02-12 10:36:55', NULL, 1, 5000.00, 'efectivo', '', '2026-02-12 15:36:55', 5),
(9, 'FAC-1776827695', '2026-04-21 22:14:55', NULL, 2, 7000.00, 'efectivo', '', '2026-04-22 03:14:55', 2),
(10, 'FAC-1776859994', '2026-04-22 07:13:14', NULL, 2, 21000.00, 'efectivo', '', '2026-04-22 12:13:14', 2),
(11, 'FAC-1777238535', '2026-04-26 16:22:15', NULL, 2, 320080.00, 'efectivo', '', '2026-04-26 21:22:15', 2),
(12, 'FAC-1777289665', '2026-04-27 06:34:25', NULL, 1, 6000.00, 'efectivo', '', '2026-04-27 11:34:25', 1),
(13, 'FAC-1777290279', '2026-04-27 06:44:39', NULL, 1, 6000.00, 'efectivo', '', '2026-04-27 11:44:39', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jwt_blacklist`
--

CREATE TABLE `jwt_blacklist` (
  `jti` varchar(64) NOT NULL,
  `exp` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `jwt_blacklist`
--

INSERT INTO `jwt_blacklist` (`jti`, `exp`, `created_at`) VALUES
('126413614d0afb4a20a45b8e7431786b', 1776855811, '2026-04-22 03:15:15'),
('2f458005129f3f7948ed076397e51415', 1777367801, '2026-04-28 01:22:31'),
('2ff2ab41d17da7b2266dc09321771826', 1776852520, '2026-04-22 03:03:05'),
('36877e8ad390d515f24c31179aa0e646', 1777367752, '2026-04-28 01:16:38'),
('5528fc2354bcb876b66fa10c4444cce0', 1777265243, '2026-04-26 21:20:43'),
('7d2e5edabd017e8bcf6a340899965568', 1777267280, '2026-04-26 21:23:02'),
('cc27815e6bc1b0b65ba7aa2bd9a0c63e', 1777316909, '2026-04-27 16:32:14'),
('dee67a0b779309a45f58cd7d9e09136e', 1776888750, '2026-04-22 12:28:58'),
('e70f6b8a69c47b969c0b73ee88109684', 1776886508, '2026-04-22 12:12:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lotes_producto`
--

CREATE TABLE `lotes_producto` (
  `id_lote` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `proveedor_id` int(11) DEFAULT NULL,
  `numero_lote` varchar(50) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_vencimiento` date DEFAULT NULL,
  `costo_unitario` decimal(10,2) NOT NULL DEFAULT 0.00,
  `precio_venta` decimal(10,2) NOT NULL,
  `cantidad_inicial` decimal(12,3) NOT NULL,
  `cantidad_disponible` decimal(12,3) NOT NULL,
  `estado` enum('activo','agotado','inactivo','bloqueado','cuarentena','vencido') NOT NULL DEFAULT 'activo',
  `motivo_estado` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `lotes_producto`
--

INSERT INTO `lotes_producto` (`id_lote`, `producto_id`, `proveedor_id`, `numero_lote`, `fecha_creacion`, `fecha_vencimiento`, `costo_unitario`, `precio_venta`, `cantidad_inicial`, `cantidad_disponible`, `estado`, `motivo_estado`, `creado_en`, `actualizado_en`) VALUES
(1, 3, 1, 'L-BASE-001', '2026-03-17 07:47:58', NULL, 0.00, 6000.00, 19.000, 0.000, 'inactivo', NULL, '2026-03-17 07:47:58', '2026-04-15 08:48:22'),
(2, 4, 1, 'L-BASE-002', '2026-03-17 07:47:58', NULL, 2000.00, 6000.00, 40.000, 14.000, 'activo', NULL, '2026-03-17 07:47:58', '2026-04-27 11:44:39'),
(3, 5, 1, 'L-BASE-003', '2026-03-17 07:47:58', NULL, 0.00, 6920.00, 92.000, 0.000, 'inactivo', NULL, '2026-03-17 07:47:58', '2026-04-15 09:11:30'),
(4, 5, 1, NULL, '2026-03-24 07:35:50', NULL, 300.00, 7000.00, 6.000, 2.000, 'agotado', NULL, '2026-03-24 07:35:50', '2026-04-22 12:13:14'),
(5, 5, 1, '7785', '2026-03-24 10:04:07', NULL, 0.00, 80020.00, 77.000, 65.000, 'activo', NULL, '2026-03-24 10:04:07', '2026-04-26 21:22:15'),
(6, 5, 1, '5555', '2026-03-24 11:36:12', NULL, 0.00, 90020.00, 8.000, 0.000, 'inactivo', NULL, '2026-03-24 11:36:12', '2026-04-15 09:12:23'),
(7, 5, NULL, 'L-20260328-7', '2026-03-27 19:38:24', NULL, 0.00, 6920.00, 2.000, 0.000, 'inactivo', NULL, '2026-03-27 19:38:24', '2026-03-27 19:38:24'),
(8, 4, NULL, 'L-20260328-8', '2026-03-27 19:41:45', NULL, 0.00, 9000.00, 2.000, 0.000, 'inactivo', NULL, '2026-03-27 19:41:45', '2026-03-27 19:41:46'),
(9, 5, NULL, 'L-20260328-9', '2026-03-27 19:43:51', NULL, 0.00, 6920.00, 2.000, 0.000, 'inactivo', NULL, '2026-03-27 19:43:51', '2026-03-27 19:43:51'),
(10, 5, NULL, 'L-20260328-10', '2026-03-27 19:44:57', NULL, 0.00, 6920.00, 2.000, 0.000, 'inactivo', NULL, '2026-03-27 19:44:57', '2026-03-27 19:44:57'),
(11, 5, NULL, 'L-20260405-11', '2026-04-04 19:38:47', NULL, 0.00, 6920.00, 2.000, 0.000, 'inactivo', NULL, '2026-04-04 19:38:47', '2026-04-04 19:38:47'),
(12, 3, 1, 'L-20260415-12', '2026-04-15 08:48:08', NULL, 4200.00, 6500.00, 15.000, 15.000, 'activo', NULL, '2026-04-15 08:48:08', '2026-04-15 08:48:08'),
(13, 6, 1, 'L-20260415-13', '2026-04-15 08:55:00', NULL, 4500.00, 7000.00, 20.000, 6.000, 'agotado', NULL, '2026-04-15 08:55:00', '2026-04-15 09:48:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_inventario`
--

CREATE TABLE `movimientos_inventario` (
  `id_movimiento` int(11) NOT NULL,
  `tipo` enum('entrada','salida') NOT NULL,
  `producto_id` int(11) NOT NULL,
  `lote_id` int(11) DEFAULT NULL,
  `numero_lote_snapshot` varchar(50) DEFAULT NULL,
  `cantidad` decimal(12,3) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `descripcion` varchar(255) DEFAULT NULL,
  `referencia` varchar(50) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimientos_inventario`
--

INSERT INTO `movimientos_inventario` (`id_movimiento`, `tipo`, `producto_id`, `lote_id`, `numero_lote_snapshot`, `cantidad`, `fecha`, `descripcion`, `referencia`, `creado_en`) VALUES
(1, 'entrada', 3, 3, 'L-BASE-003', 40.000, '2026-02-09 06:49:10', 'Stock Inicial', 'CREACION', '2026-02-09 11:49:10'),
(2, 'salida', 1, 2, 'L-BASE-002', 49.000, '2026-02-09 06:53:16', 'Baja de Producto (Eliminado)', 'BAJA', '2026-02-09 11:53:16'),
(3, 'salida', 3, 3, 'L-BASE-003', 16.000, '2026-02-09 08:40:16', 'Venta Factura FAC-1770644416', 'FAC-1770644416', '2026-02-09 13:40:16'),
(4, 'entrada', 4, 4, NULL, 30.000, '2026-02-09 10:01:26', 'Stock Inicial', 'CREACION', '2026-02-09 15:01:26'),
(5, 'salida', 3, 5, '7785', 1.000, '2026-02-09 10:06:11', 'Venta Factura FAC-1770649571', 'FAC-1770649571', '2026-02-09 15:06:11'),
(6, 'salida', 3, 6, '5555', 1.000, '2026-02-09 11:12:16', 'Venta Factura FAC-1770653536', 'FAC-1770653536', '2026-02-09 16:12:16'),
(7, 'salida', 3, 7, 'L-20260328-7', 1.000, '2026-02-11 11:35:30', 'Venta Factura FAC-1770827730', 'FAC-1770827730', '2026-02-11 16:35:30'),
(8, 'salida', 3, 7, 'L-20260328-7', 1.000, '2026-02-11 18:37:04', 'Venta Factura FAC-1770853024', 'FAC-1770853024', '2026-02-11 23:37:04'),
(9, 'salida', 3, 7, 'L-20260328-7', 1.000, '2026-02-11 18:43:27', 'Venta Factura FAC-1770853407', 'FAC-1770853407', '2026-02-11 23:43:27'),
(10, 'salida', 1, 8, 'L-20260328-8', 2.000, '2026-02-12 10:36:55', 'Venta Factura FAC-1770910615', 'FAC-1770910615', '2026-02-12 15:36:55'),
(11, 'entrada', 5, 8, 'L-20260328-8', 92.000, '2026-02-16 08:35:55', 'Stock Inicial', 'CREACION', '2026-02-16 13:35:55'),
(37, 'salida', 5, 4, NULL, 1.000, '2026-04-21 22:14:55', 'Venta Factura FAC-1776827695', 'FAC-1776827695', '2026-04-22 03:14:55'),
(38, 'salida', 5, 4, NULL, 3.000, '2026-04-22 07:13:14', 'Venta Factura FAC-1776859994', 'FAC-1776859994', '2026-04-22 12:13:14'),
(39, 'salida', 5, 5, '7785', 4.000, '2026-04-26 16:22:15', 'Venta Factura FAC-1777238535', 'FAC-1777238535', '2026-04-26 21:22:15'),
(40, 'salida', 4, 2, 'L-BASE-002', 1.000, '2026-04-27 06:34:25', 'Venta Factura FAC-1777289665', 'FAC-1777289665', '2026-04-27 11:34:25'),
(41, 'salida', 4, 2, 'L-BASE-002', 1.000, '2026-04-27 06:44:39', 'Venta Factura FAC-1777290279', 'FAC-1777290279', '2026-04-27 11:44:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `titulo` varchar(150) NOT NULL,
  `mensaje` varchar(500) NOT NULL,
  `tipo` enum('info','warning','alert') NOT NULL DEFAULT 'info',
  `estado` enum('nuevo','leido') NOT NULL DEFAULT 'nuevo',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `estado`, `creado_en`) VALUES
(1, 2, 'Caja abierta', 'Tu caja ha sido abierta correctamente.', 'info', 'leido', '2026-03-27 19:44:57'),
(2, 2, 'Caja cerrada', 'Has cerrado tu caja. Diferencia: -6.920', 'warning', 'leido', '2026-03-27 19:44:58'),
(3, 2, 'Caja abierta', 'Tu caja ha sido abierta correctamente.', 'info', 'leido', '2026-04-04 19:38:46'),
(4, 2, 'Caja cerrada', 'Has cerrado tu caja. Diferencia: -6.920', 'warning', 'leido', '2026-04-04 19:38:48'),
(5, 1, 'Caja cerrada', 'Has cerrado tu caja. Diferencia: -320.000', 'warning', 'leido', '2026-04-08 14:54:36'),
(6, 1, 'Caja abierta', 'Tu caja ha sido abierta correctamente.', 'info', 'leido', '2026-04-08 14:54:43'),
(7, 1, 'Caja cerrada', 'Has cerrado tu caja. Diferencia: -5.000', 'warning', 'leido', '2026-04-08 15:00:20'),
(8, 1, 'Caja abierta', 'Tu caja ha sido abierta correctamente.', 'info', 'leido', '2026-04-08 15:00:26');

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
  `tipo_venta` enum('unidad','peso') NOT NULL DEFAULT 'unidad',
  `unidad_base` varchar(20) NOT NULL DEFAULT 'unidad',
  `fraccion_minima` decimal(12,3) NOT NULL DEFAULT 1.000,
  `precio_compra` decimal(10,2) NOT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `stock_actual` decimal(12,3) NOT NULL DEFAULT 0.000,
  `stock_minimo` decimal(12,3) NOT NULL DEFAULT 5.000,
  `imagen` varchar(255) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_producto`, `nombre`, `descripcion`, `categoria_id`, `unidad_medida_id`, `tipo_venta`, `unidad_base`, `fraccion_minima`, `precio_compra`, `precio_venta`, `stock_actual`, `stock_minimo`, `imagen`, `estado`, `creado_en`, `actualizado_en`) VALUES
(1, 'papa pastusa', '', 2, NULL, 'unidad', 'unidad', 1.000, 0.00, 5000.00, 0.000, 0.000, NULL, 'inactivo', '2026-03-17 07:47:58', '2026-03-17 07:47:58'),
(3, 'papa llanera', '', 2, NULL, 'unidad', 'unidad', 1.000, 0.00, 6000.00, 15.000, 0.000, 'uploads/products/6989ebd918ebd.jpeg', 'activo', '2026-03-17 07:47:58', '2026-04-15 08:48:08'),
(4, 'aguacate', '', 3, NULL, 'unidad', 'unidad', 1.000, 0.00, 9000.00, 14.000, 0.000, 'uploads/products/6989f6c6b0ad4.jpeg', 'activo', '2026-03-17 07:47:58', '2026-04-27 11:44:39'),
(5, 'papa linterna', '', 2, NULL, 'unidad', 'unidad', 1.000, 0.00, 6920.00, 67.000, 5.000, 'uploads/products/69931d3b9c3ba.jpg', 'activo', '2026-03-17 07:47:58', '2026-04-26 21:22:15'),
(6, 'Producto QA', 'producto de prueba', 2, 2, 'unidad', 'unidad', 1.000, 3000.00, 80000.00, 6.000, 5.000, 'uploads/products/69ef8f1cd625c.jpg', 'activo', '2026-04-15 08:55:00', '2026-04-28 01:42:31');

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
(1, 1, 4, '2026-03-17 07:47:58'),
(2, 1, 3, '2026-03-17 07:47:58'),
(3, 1, 5, '2026-03-17 07:47:58'),
(12, 1, 6, '2026-04-28 01:42:31');

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
(2, 'kilogramo', 'kg');

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
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `telefono` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `preferencias` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `usuario`, `contrasena`, `email`, `creado_en`, `telefono`, `avatar_url`, `preferencias`) VALUES
(1, 'Admin Prueba', 'admin', '$2y$10$xR/qC3vL5XXJhQWgPNOxbeQVZW/runeUu1ckH7/FmsEzkvRr8HEvO', 'admin@prueba.com', '2026-02-09 02:15:20', NULL, NULL, NULL),
(2, 'Cajero', 'Cajero', '$2y$10$C0angHCc734aQhSaciVunupsEjs7mr0kLlZOMtePH1h3gSb/F1aGG', 'Cajero@gmail.com', '2026-02-11 23:23:01', NULL, NULL, NULL);

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
  ADD KEY `producto_id` (`producto_id`),
  ADD KEY `idx_det_lote` (`lote_id`);

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
-- Indices de la tabla `lotes_producto`
--
ALTER TABLE `lotes_producto`
  ADD PRIMARY KEY (`id_lote`),
  ADD KEY `idx_lotes_producto` (`producto_id`),
  ADD KEY `idx_lotes_proveedor` (`proveedor_id`),
  ADD KEY `idx_lotes_fecha` (`fecha_creacion`);

--
-- Indices de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD PRIMARY KEY (`id_movimiento`),
  ADD KEY `producto_id` (`producto_id`),
  ADD KEY `idx_mov_lote` (`lote_id`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notificaciones_usuario` (`usuario_id`);

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
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id_empresa` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id_factura` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `lotes_producto`
--
ALTER TABLE `lotes_producto`
  MODIFY `id_lote` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id_movimiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `proveedor_producto`
--
ALTER TABLE `proveedor_producto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

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
  MODIFY `id_unidad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  ADD CONSTRAINT `detalle_factura_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id_producto`),
  ADD CONSTRAINT `detalle_factura_ibfk_3` FOREIGN KEY (`lote_id`) REFERENCES `lotes_producto` (`id_lote`) ON DELETE SET NULL;

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
-- Filtros para la tabla `lotes_producto`
--
ALTER TABLE `lotes_producto`
  ADD CONSTRAINT `lotes_producto_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE,
  ADD CONSTRAINT `lotes_producto_ibfk_2` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id_proveedor`) ON DELETE SET NULL;

--
-- Filtros para la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD CONSTRAINT `movimientos_inventario_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id_producto`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_2` FOREIGN KEY (`lote_id`) REFERENCES `lotes_producto` (`id_lote`) ON DELETE SET NULL;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;

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
