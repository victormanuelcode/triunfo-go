-- Añade monto_recibido (efectivo / cambio) usado por Invoice::create().
-- Ejecutar una vez si aparece: Unknown column 'monto_recibido' in 'INSERT INTO'
-- mysql -u ... -p triunfo_go_php < backend/db/migrate_facturas_monto_recibido.sql

ALTER TABLE facturas
  ADD COLUMN monto_recibido DECIMAL(10,2) NOT NULL DEFAULT 0
  AFTER total;
