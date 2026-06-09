-- Añade tarjeta y otros al ENUM de facturas (POS cajero usa efectivo/tarjeta/transferencia).
-- Ejecutar una vez si aparece: Método de pago inválido al vender con tarjeta.
-- mysql -u ... -p triunfo_go_php < backend/db/migrate_facturas_metodo_pago.sql

ALTER TABLE facturas
  MODIFY COLUMN metodo_pago ENUM('efectivo','transferencia','tarjeta','credito','otros') NOT NULL DEFAULT 'efectivo';
