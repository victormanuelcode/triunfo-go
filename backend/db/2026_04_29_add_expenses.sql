-- Agregar soporte de egresos (gastos) al sistema
-- Fecha: 2026-04-29

CREATE TABLE IF NOT EXISTS `egresos` (
  `id_egreso` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `concepto` varchar(150) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','transferencia','tarjeta','otros') NOT NULL DEFAULT 'efectivo',
  `usuario_id` int(11) NOT NULL,
  `sesion_id` int(11) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_egreso`),
  KEY `idx_egresos_fecha` (`fecha`),
  KEY `idx_egresos_metodo` (`metodo_pago`),
  KEY `idx_egresos_usuario` (`usuario_id`),
  KEY `idx_egresos_sesion` (`sesion_id`),
  CONSTRAINT `egresos_ibfk_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `egresos_ibfk_sesion` FOREIGN KEY (`sesion_id`) REFERENCES `caja_sesiones` (`id_sesion`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

