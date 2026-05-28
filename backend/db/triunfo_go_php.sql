-- phpMyAdmin SQL Dump
-- version 5.2.3-2.fc44
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 28-05-2026 a las 20:31:27
-- Versión del servidor: 11.8.6-MariaDB
-- Versión de PHP: 8.5.6

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
(1, 1, 9000.00, 98.52, '2026-02-11 18:25:58', '2026-04-29 08:54:26', 'cerrada'),
(2, 2, 9000.00, NULL, '2026-02-11 18:43:17', NULL, 'abierta'),
(3, 3, 222220.00, NULL, '2026-04-29 08:49:11', NULL, 'abierta'),
(4, 1, 10000.00, NULL, '2026-04-29 08:54:39', NULL, 'abierta');

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
(13, 13, 4, 2, 'L-BASE-002', 2000.00, 1.000, 6000.00, 6000.00),
(14, 14, 3, 12, 'L-20260415-12', 4200.00, 1.000, 6500.00, 6500.00),
(15, 15, 5, 5, '7785', 0.00, 1.000, 80020.00, 80020.00),
(16, 16, 4, 2, 'L-BASE-002', 2000.00, 1.000, 6000.00, 6000.00),
(17, 17, 5, 5, '7785', 0.00, 1.000, 80020.00, 80020.00),
(18, 18, 4, 2, 'L-BASE-002', 2000.00, 2.000, 6000.00, 12000.00),
(19, 19, 3, 12, 'L-20260415-12', 4200.00, 1.000, 6500.00, 6500.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `egresos`
--

CREATE TABLE `egresos` (
  `id_egreso` int(11) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `concepto` varchar(150) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','transferencia','tarjeta','otros') NOT NULL DEFAULT 'efectivo',
  `usuario_id` int(11) NOT NULL,
  `sesion_id` int(11) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `egresos`
--

INSERT INTO `egresos` (`id_egreso`, `fecha`, `concepto`, `descripcion`, `monto`, `metodo_pago`, `usuario_id`, `sesion_id`, `creado_en`) VALUES
(1, '2026-04-29 07:17:00', 'transporte', NULL, 50000.00, 'efectivo', 1, 1, '2026-04-29 12:17:53');

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
  `monto_recibido` decimal(10,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` enum('efectivo','transferencia','credito') DEFAULT 'efectivo',
  `observaciones` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `sesion_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `facturas`
--

INSERT INTO `facturas` (`id_factura`, `numero_factura`, `fecha`, `cliente_id`, `usuario_id`, `total`, `monto_recibido`, `metodo_pago`, `observaciones`, `creado_en`, `sesion_id`) VALUES
(1, 'FAC-1770606173', '2026-02-08 22:02:53', 1, NULL, 5000.00, 0.00, 'efectivo', '', '2026-02-09 03:02:53', NULL),
(2, 'FAC-1770644416', '2026-02-09 08:40:16', 2, NULL, 96000.00, 0.00, 'efectivo', '', '2026-02-09 13:40:16', NULL),
(3, 'FAC-1770649571', '2026-02-09 10:06:11', NULL, NULL, 6000.00, 0.00, 'efectivo', '', '2026-02-09 15:06:11', NULL),
(4, 'FAC-1770653536', '2026-02-09 11:12:16', NULL, 1, 6000.00, 0.00, 'efectivo', '', '2026-02-09 16:12:16', NULL),
(5, 'FAC-1770827730', '2026-02-11 11:35:30', NULL, 1, 6000.00, 0.00, 'efectivo', '', '2026-02-11 16:35:30', NULL),
(6, 'FAC-1770853024', '2026-02-11 18:37:04', NULL, 1, 6000.00, 0.00, 'efectivo', '', '2026-02-11 23:37:04', NULL),
(7, 'FAC-1770853407', '2026-02-11 18:43:27', NULL, 2, 6000.00, 0.00, 'efectivo', '', '2026-02-11 23:43:27', NULL),
(8, 'FAC-1770910615', '2026-02-12 10:36:55', NULL, 1, 5000.00, 0.00, 'efectivo', '', '2026-02-12 15:36:55', 5),
(9, 'FAC-1776827695', '2026-04-21 22:14:55', NULL, 2, 7000.00, 0.00, 'efectivo', '', '2026-04-22 03:14:55', 2),
(10, 'FAC-1776859994', '2026-04-22 07:13:14', NULL, 2, 21000.00, 0.00, 'efectivo', '', '2026-04-22 12:13:14', 2),
(11, 'FAC-1777238535', '2026-04-26 16:22:15', NULL, 2, 320080.00, 0.00, 'efectivo', '', '2026-04-26 21:22:15', 2),
(12, 'FAC-1777289665', '2026-04-27 06:34:25', NULL, 1, 6000.00, 0.00, 'efectivo', '', '2026-04-27 11:34:25', 1),
(13, 'FAC-1777290279', '2026-04-27 06:44:39', NULL, 1, 6000.00, 0.00, 'efectivo', '', '2026-04-27 11:44:39', 1),
(14, 'FAC-1777466368', '2026-04-29 07:39:28', NULL, 1, 6500.00, 0.00, 'efectivo', '', '2026-04-29 12:39:28', 1),
(15, 'FAC-1777470236', '2026-04-29 08:43:56', NULL, 1, 80020.00, 0.00, 'efectivo', '', '2026-04-29 13:43:56', 1),
(16, 'FAC-1777479861', '2026-04-29 11:24:21', NULL, 1, 6000.00, 0.00, 'efectivo', '', '2026-04-29 16:24:21', 4),
(17, 'FAC-1778767834', '2026-05-14 09:10:34', NULL, 1, 80020.00, 0.00, 'efectivo', '', '2026-05-14 14:10:34', 4),
(18, 'FAC-1779984089', '2026-05-28 11:01:29', NULL, 1, 12000.00, 0.00, 'efectivo', '', '2026-05-28 16:01:29', 4),
(19, 'FAC-1779984489', '2026-05-28 11:08:09', NULL, 2, 6500.00, 7000.00, 'efectivo', '', '2026-05-28 16:08:09', 2);

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
('05c53a755312d03ed73cab6ee0b27120', 1777499203, '2026-04-29 13:48:58'),
('0e011a8a3af9a0293672301c507e36b8', 1779503621, '2026-05-22 18:34:22'),
('126413614d0afb4a20a45b8e7431786b', 1776855811, '2026-04-22 03:15:15'),
('231aea0a0307d1ca5f65d260e2248c9b', 1777502806, '2026-04-29 14:47:03'),
('2f458005129f3f7948ed076397e51415', 1777367801, '2026-04-28 01:22:31'),
('2ff2ab41d17da7b2266dc09321771826', 1776852520, '2026-04-22 03:03:05'),
('31f9494d95718f2d3e8947a9d731f06c', 1778626291, '2026-05-12 16:27:46'),
('327432a9bd370ab18ca054091577731c', 1777499429, '2026-04-29 13:54:49'),
('33995c51373d16f43dd23ee8810b64ba', 1779833541, '2026-05-26 14:13:28'),
('35283e02033be54a3c17d309f4153ad4', 1780012620, '2026-05-28 16:03:50'),
('36877e8ad390d515f24c31179aa0e646', 1777367752, '2026-04-28 01:16:38'),
('42b9354985a9c2e13fd0b1834819815a', 1777499346, '2026-04-29 13:50:26'),
('4a3d3bee545f0febec92744b4a64bb4a', 1780013499, '2026-05-28 16:12:34'),
('4fd20845d4e7e95160e2adc38e7a10c6', 1778624665, '2026-05-12 14:40:02'),
('533086b83b0330ef830092765c885435', 1780013398, '2026-05-28 16:10:37'),
('5528fc2354bcb876b66fa10c4444cce0', 1777265243, '2026-04-26 21:20:43'),
('5779c85832711f3a27ce93202bea11b3', 1778632069, '2026-05-12 16:29:22'),
('58ee19f92d3e99368be1cabfacef1dbd', 1778009526, '2026-05-05 12:39:55'),
('61b453010a55a9ac6efa06fc5842b921', 1778013619, '2026-05-05 12:48:02'),
('781968b3bb55f1596abcfeb408c9356e', 1780000864, '2026-05-28 15:03:23'),
('7d2e5edabd017e8bcf6a340899965568', 1777267280, '2026-04-26 21:23:02'),
('81b3de2b93ca3cd9132231aa9af7023f', 1777491975, '2026-04-29 13:46:41'),
('89f7f4c6a29ba56b4bcf180a11cf0b67', 1779503952, '2026-05-22 18:54:26'),
('a3dad0c88cdfdbba0478a4cd9d9b6407', 1779504871, '2026-05-22 18:54:41'),
('b03787d398de4d58e6cef63f89de3b45', 1779831973, '2026-05-26 14:09:52'),
('b0bd5843090e8b45cdc81249712a19e1', 1778625605, '2026-05-12 14:51:25'),
('b0f83ff01e8a390a9d31f244e8b9a128', 1779833459, '2026-05-26 14:12:18'),
('c0f67a60954853a68363007a30a529a4', 1780013206, '2026-05-28 16:09:22'),
('c37c15b297563c028266ecb2c8064101', 1779828050, '2026-05-26 12:40:56'),
('cc27815e6bc1b0b65ba7aa2bd9a0c63e', 1777316909, '2026-04-27 16:32:14'),
('cd0ca54e4a6a7a16ab792b1d83717b5c', 1777499980, '2026-04-29 14:46:43'),
('d48c73c749a1c8ae49633ce4bf74a7f0', 1779502606, '2026-05-22 18:17:31'),
('dee67a0b779309a45f58cd7d9e09136e', 1776888750, '2026-04-22 12:28:58'),
('e70f6b8a69c47b969c0b73ee88109684', 1776886508, '2026-04-22 12:12:00'),
('ecb3d8f383ec86226fc6f200a2215657', 1778632167, '2026-05-12 16:30:03');

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
(2, 4, 1, 'L-BASE-002', '2026-03-17 07:47:58', NULL, 2000.00, 6000.00, 40.000, 11.000, 'activo', NULL, '2026-03-17 07:47:58', '2026-05-28 16:01:29'),
(3, 5, 1, 'L-BASE-003', '2026-03-17 07:47:58', NULL, 0.00, 6920.00, 92.000, 0.000, 'inactivo', NULL, '2026-03-17 07:47:58', '2026-04-15 09:11:30'),
(4, 5, 1, NULL, '2026-03-24 07:35:50', NULL, 300.00, 7000.00, 6.000, 2.000, 'agotado', NULL, '2026-03-24 07:35:50', '2026-04-22 12:13:14'),
(5, 5, 1, '7785', '2026-03-24 10:04:07', NULL, 0.00, 80020.00, 77.000, 63.000, 'activo', NULL, '2026-03-24 10:04:07', '2026-05-14 14:10:34'),
(6, 5, 1, '5555', '2026-03-24 11:36:12', NULL, 0.00, 90020.00, 8.000, 0.000, 'inactivo', NULL, '2026-03-24 11:36:12', '2026-04-15 09:12:23'),
(7, 5, NULL, 'L-20260328-7', '2026-03-27 19:38:24', NULL, 0.00, 6920.00, 2.000, 0.000, 'inactivo', NULL, '2026-03-27 19:38:24', '2026-03-27 19:38:24'),
(8, 4, NULL, 'L-20260328-8', '2026-03-27 19:41:45', NULL, 0.00, 9000.00, 2.000, 0.000, 'inactivo', NULL, '2026-03-27 19:41:45', '2026-03-27 19:41:46'),
(9, 5, NULL, 'L-20260328-9', '2026-03-27 19:43:51', NULL, 0.00, 6920.00, 2.000, 0.000, 'inactivo', NULL, '2026-03-27 19:43:51', '2026-03-27 19:43:51'),
(10, 5, NULL, 'L-20260328-10', '2026-03-27 19:44:57', NULL, 0.00, 6920.00, 2.000, 0.000, 'inactivo', NULL, '2026-03-27 19:44:57', '2026-03-27 19:44:57'),
(11, 5, NULL, 'L-20260405-11', '2026-04-04 19:38:47', NULL, 0.00, 6920.00, 2.000, 0.000, 'inactivo', NULL, '2026-04-04 19:38:47', '2026-04-04 19:38:47'),
(12, 3, 1, 'L-20260415-12', '2026-04-15 08:48:08', NULL, 4200.00, 6500.00, 15.000, 8.000, 'activo', NULL, '2026-04-15 08:48:08', '2026-05-28 16:08:09'),
(13, 6, 1, 'L-20260415-13', '2026-04-15 08:55:00', NULL, 4500.00, 7000.00, 20.000, 0.000, 'inactivo', NULL, '2026-04-15 08:55:00', '2026-04-29 13:43:45'),
(14, 7, 1, 'L-20260526-14', '2026-05-26 08:47:46', NULL, 7000.00, 6000.00, 5500.000, 5500.000, 'activo', NULL, '2026-05-26 13:47:46', '2026-05-26 13:47:46'),
(15, 4, 1, 'L-20260526-15', '2026-05-26 09:16:22', NULL, 0.00, 9000.00, 2000.000, 2000.000, 'activo', NULL, '2026-05-26 14:16:22', '2026-05-26 14:16:22'),
(16, 8, NULL, 'L-20260526-16', '2026-05-26 09:16:59', NULL, 0.00, 2000.00, 2000.000, 2000.000, 'activo', NULL, '2026-05-26 14:16:59', '2026-05-26 14:16:59');

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
(41, 'salida', 4, 2, 'L-BASE-002', 1.000, '2026-04-27 06:44:39', 'Venta Factura FAC-1777290279', 'FAC-1777290279', '2026-04-27 11:44:39'),
(42, 'salida', 3, 12, 'L-20260415-12', 1.000, '2026-04-29 07:39:28', 'Venta Factura FAC-1777466368', 'FAC-1777466368', '2026-04-29 12:39:28'),
(43, 'salida', 6, 13, 'L-20260415-13', 6.000, '2026-04-29 08:43:45', 'Lote eliminado/inactivado', 'L-20260415-13', '2026-04-29 13:43:45'),
(44, 'salida', 5, 5, '7785', 1.000, '2026-04-29 08:43:56', 'Venta Factura FAC-1777470236', 'FAC-1777470236', '2026-04-29 13:43:56'),
(45, 'salida', 3, 12, 'L-20260415-12', 5.000, '2026-04-29 09:03:10', 'Ajuste Manual: podridos', 'AJUSTE', '2026-04-29 14:03:10'),
(46, 'salida', 4, 2, 'L-BASE-002', 1.000, '2026-04-29 11:24:21', 'Venta Factura FAC-1777479861', 'FAC-1777479861', '2026-04-29 16:24:21'),
(47, 'salida', 5, 5, '7785', 1.000, '2026-05-14 09:10:34', 'Venta Factura FAC-1778767834', 'FAC-1778767834', '2026-05-14 14:10:34'),
(48, 'entrada', 7, 14, 'L-20260526-14', 5500.000, '2026-05-26 08:47:46', 'Ingreso por lote', 'L-20260526-14', '2026-05-26 13:47:46'),
(49, 'entrada', 4, 15, 'L-20260526-15', 2000.000, '2026-05-26 09:16:22', 'Ingreso por lote', 'L-20260526-15', '2026-05-26 14:16:22'),
(50, 'entrada', 8, 16, 'L-20260526-16', 2000.000, '2026-05-26 09:16:59', 'Ingreso por lote', 'L-20260526-16', '2026-05-26 14:16:59'),
(51, 'salida', 4, 2, 'L-BASE-002', 2.000, '2026-05-28 11:01:29', 'Venta Factura FAC-1779984089', 'FAC-1779984089', '2026-05-28 16:01:29'),
(52, 'salida', 3, 12, 'L-20260415-12', 1.000, '2026-05-28 11:08:09', 'Venta Factura FAC-1779984489', 'FAC-1779984489', '2026-05-28 16:08:09');

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
(8, 1, 'Caja abierta', 'Tu caja ha sido abierta correctamente.', 'info', 'leido', '2026-04-08 15:00:26'),
(9, NULL, 'Caja abierta', 'Tu caja ha sido abierta correctamente.', 'info', 'leido', '2026-04-29 13:49:11'),
(10, 1, 'Caja cerrada', 'Has cerrado tu caja. Diferencia: -57.421', 'warning', 'leido', '2026-04-29 13:54:26'),
(11, 1, 'Caja abierta', 'Tu caja ha sido abierta correctamente.', 'info', 'leido', '2026-04-29 13:54:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Volcado de datos para la tabla `password_resets`
--

INSERT INTO `password_resets` (`id`, `email`, `code_hash`, `expires_at`, `used_at`, `created_at`) VALUES
(17, 'victenno@gmail.com', '$2y$12$l3dZy75qg3emV2qmTrYYkuNybtMK47G8ygK6P.0qB/4wJdWlez3i2', '2026-05-22 18:52:10', '2026-05-28 11:12:39', '2026-05-22 18:37:10'),
(18, 'holltenk@gmail.com', '$2y$12$PTPUp9W5v78xHHY0rIzDGeDvdFo55ozWbfIslciqjJjLq6/XFQusS', '2026-05-22 18:53:01', '2026-05-22 13:38:58', '2026-05-22 18:38:01'),
(19, 'victenno@gmail.com', '$2y$12$Ajap4wHkd/2xpLcYhn9nY.Ct5.9bIkm//oFrc741.qn8hFS7RPmpm', '2026-05-28 16:27:40', NULL, '2026-05-28 16:12:40');

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
(3, 'papa llanera', '', 2, NULL, 'unidad', 'unidad', 1.000, 0.00, 6000.00, 8.000, 0.000, 'uploads/products/6989ebd918ebd.jpeg', 'activo', '2026-03-17 07:47:58', '2026-05-28 16:08:09'),
(4, 'aguacate', '', 3, NULL, 'unidad', 'unidad', 1.000, 0.00, 9000.00, 2011.000, 0.000, 'uploads/products/6989f6c6b0ad4.jpeg', 'activo', '2026-03-17 07:47:58', '2026-05-28 16:01:29'),
(5, 'papa linterna', '', 2, NULL, 'unidad', 'unidad', 1.000, 0.00, 6920.00, 65.000, 5.000, 'uploads/products/69931d3b9c3ba.jpg', 'activo', '2026-03-17 07:47:58', '2026-05-14 14:10:34'),
(6, 'Producto QA', 'producto de prueba', 2, 2, 'unidad', 'unidad', 1.000, 3000.00, 8000.00, 0.000, 5.000, 'uploads/products/69ef8f1cd625c.jpg', 'activo', '2026-04-15 08:55:00', '2026-04-29 15:55:29'),
(7, 'lechuga', 'lechugosa', 3, 2, 'peso', 'kg', 1.000, 7000.00, 6000.00, 5500.000, 5.000, 'uploads/products/6a15a4a5a18c1.png', 'inactivo', '2026-05-26 13:47:46', '2026-05-26 13:49:42'),
(8, 'lechuga', 'lechugosa', 2, 2, 'peso', 'kg', 1.666, 0.00, 2000.00, 2000.000, 5.000, NULL, 'activo', '2026-05-26 14:16:59', '2026-05-26 14:16:59');

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
(13, 1, 6, '2026-04-29 15:55:29'),
(15, 1, 7, '2026-05-26 13:48:21');

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
(2, 2, 2, '2026-02-11 23:23:01'),
(6, 6, 1, '2026-05-26 13:53:44');

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
(1, 'Admin Prueba', 'admin', '$2y$10$xR/qC3vL5XXJhQWgPNOxbeQVZW/runeUu1ckH7/FmsEzkvRr8HEvO', 'victenno@gmail.com', '2026-02-09 02:15:20', '', '', '{\"sidebarCollapsed\":false}'),
(2, 'Cajero', 'Cajero', '$2y$12$Wpd95c4wu8dAsRhcLh993.vl6.p9QvfENgyVlC4ZF7Zb/IoPSjKg6', 'holltenk@gmail.com', '2026-02-11 23:23:01', NULL, NULL, NULL),
(6, 'alejandra', 'aleja', '$2y$12$5t0bYIGgk7vM.rhSun89CekKYJCEBgHMMNRrPyRuhm4TVU486M.MS', 'kellyalejandradiaztorres07@gmail.com', '2026-05-26 13:53:44', NULL, NULL, NULL);

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
-- Indices de la tabla `egresos`
--
ALTER TABLE `egresos`
  ADD PRIMARY KEY (`id_egreso`),
  ADD KEY `idx_egresos_fecha` (`fecha`),
  ADD KEY `idx_egresos_metodo` (`metodo_pago`),
  ADD KEY `idx_egresos_usuario` (`usuario_id`),
  ADD KEY `idx_egresos_sesion` (`sesion_id`);

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
-- Indices de la tabla `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_expires` (`expires_at`);

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
  MODIFY `id_sesion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `egresos`
--
ALTER TABLE `egresos`
  MODIFY `id_egreso` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id_empresa` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id_factura` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `lotes_producto`
--
ALTER TABLE `lotes_producto`
  MODIFY `id_lote` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id_movimiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `proveedor_producto`
--
ALTER TABLE `proveedor_producto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `roles_user`
--
ALTER TABLE `roles_user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `unidades_medida`
--
ALTER TABLE `unidades_medida`
  MODIFY `id_unidad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
-- Filtros para la tabla `egresos`
--
ALTER TABLE `egresos`
  ADD CONSTRAINT `egresos_ibfk_sesion` FOREIGN KEY (`sesion_id`) REFERENCES `caja_sesiones` (`id_sesion`) ON DELETE SET NULL,
  ADD CONSTRAINT `egresos_ibfk_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuario`);

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
