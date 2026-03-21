<?php
class ProductLot {
    private $conn;
    private $table_name = "lotes_producto";

    public function __construct($db) {
        $this->conn = $db;
        $this->ensureSchema();
    }

    private function ensureSchema() {
        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id_lote INT(11) NOT NULL AUTO_INCREMENT,
            producto_id INT(11) NOT NULL,
            proveedor_id INT(11) NULL,
            numero_lote VARCHAR(50) NULL,
            fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
            precio_venta DECIMAL(10,2) NOT NULL,
            cantidad_inicial INT(11) NOT NULL,
            cantidad_disponible INT(11) NOT NULL,
            estado ENUM('activo','agotado') NOT NULL DEFAULT 'activo',
            creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id_lote),
            KEY idx_producto_id (producto_id),
            KEY idx_proveedor_id (proveedor_id),
            KEY idx_fecha_creacion (fecha_creacion)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
        $this->conn->exec($sql);

        $this->ensureColumnExists('detalle_factura', 'lote_id', "INT(11) NULL AFTER producto_id");
        $this->ensureColumnExists('movimientos_inventario', 'lote_id', "INT(11) NULL AFTER producto_id");
    }

    private function ensureColumnExists($tableName, $columnName, $columnDefinitionSql) {
        $query = "SELECT COUNT(*) as cnt
                  FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = :table
                    AND COLUMN_NAME = :col";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':table', $tableName);
        $stmt->bindValue(':col', $columnName);
        $stmt->execute();
        $cnt = (int)($stmt->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);
        if ($cnt > 0) return;

        $alter = "ALTER TABLE {$tableName} ADD COLUMN {$columnName} {$columnDefinitionSql}";
        $this->conn->exec($alter);
    }

    public function createLot($producto_id, $cantidad, $precio_venta, $costo_unitario = 0, $proveedor_id = null, $numero_lote = null) {
        if ($cantidad <= 0) {
            throw new Exception("La cantidad del lote debe ser mayor a cero.");
        }
        if ($precio_venta <= 0) {
            throw new Exception("El precio de venta del lote debe ser mayor a cero.");
        }

        $this->conn->beginTransaction();
        try {
            $query = "INSERT INTO {$this->table_name}
                      (producto_id, proveedor_id, numero_lote, costo_unitario, precio_venta, cantidad_inicial, cantidad_disponible, estado)
                      VALUES
                      (:producto_id, :proveedor_id, :numero_lote, :costo_unitario, :precio_venta, :cantidad_inicial, :cantidad_disponible, 'activo')";
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':producto_id', (int)$producto_id, PDO::PARAM_INT);
            $stmt->bindValue(':proveedor_id', $proveedor_id !== null ? (int)$proveedor_id : null, $proveedor_id !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
            $stmt->bindValue(':numero_lote', $numero_lote !== null ? (string)$numero_lote : null, $numero_lote !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
            $stmt->bindValue(':costo_unitario', (float)$costo_unitario);
            $stmt->bindValue(':precio_venta', (float)$precio_venta);
            $stmt->bindValue(':cantidad_inicial', (int)$cantidad, PDO::PARAM_INT);
            $stmt->bindValue(':cantidad_disponible', (int)$cantidad, PDO::PARAM_INT);
            if (!$stmt->execute()) {
                throw new Exception("No se pudo crear el lote.");
            }

            $loteId = (int)$this->conn->lastInsertId();

            $stmtStock = $this->conn->prepare("UPDATE productos SET stock_actual = stock_actual + :cantidad WHERE id_producto = :producto_id");
            $stmtStock->bindValue(':cantidad', (int)$cantidad, PDO::PARAM_INT);
            $stmtStock->bindValue(':producto_id', (int)$producto_id, PDO::PARAM_INT);
            if (!$stmtStock->execute()) {
                throw new Exception("No se pudo actualizar el stock del producto.");
            }

            $stmtMov = $this->conn->prepare("INSERT INTO movimientos_inventario (tipo, producto_id, lote_id, cantidad, descripcion, referencia, fecha)
                                             VALUES ('entrada', :producto_id, :lote_id, :cantidad, :descripcion, :referencia, NOW())");
            $stmtMov->bindValue(':producto_id', (int)$producto_id, PDO::PARAM_INT);
            $stmtMov->bindValue(':lote_id', (int)$loteId, PDO::PARAM_INT);
            $stmtMov->bindValue(':cantidad', (int)$cantidad, PDO::PARAM_INT);
            $stmtMov->bindValue(':descripcion', 'Ingreso por lote');
            $ref = $numero_lote !== null ? (string)$numero_lote : ('LOTE-' . $loteId);
            $stmtMov->bindValue(':referencia', $ref);
            if (!$stmtMov->execute()) {
                throw new Exception("No se pudo registrar movimiento del lote.");
            }

            $this->conn->commit();
            return $loteId;
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function getLotsByProduct($producto_id) {
        $query = "SELECT id_lote, producto_id, proveedor_id, numero_lote, fecha_creacion, costo_unitario, precio_venta,
                         cantidad_inicial, cantidad_disponible, estado
                  FROM {$this->table_name}
                  WHERE producto_id = :producto_id
                  ORDER BY fecha_creacion ASC, id_lote ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':producto_id', (int)$producto_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }

    public function getLotById($lote_id) {
        $query = "SELECT id_lote, producto_id, proveedor_id, numero_lote, fecha_creacion, costo_unitario, precio_venta,
                         cantidad_inicial, cantidad_disponible, estado
                  FROM {$this->table_name}
                  WHERE id_lote = :id_lote
                  LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id_lote', (int)$lote_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function ensureDefaultLotFromProduct($producto_id) {
        $stmt = $this->conn->prepare("SELECT id_lote FROM {$this->table_name} WHERE producto_id = :pid LIMIT 1");
        $stmt->bindValue(':pid', (int)$producto_id, PDO::PARAM_INT);
        $stmt->execute();
        $exists = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($exists) return;

        $p = $this->conn->prepare("SELECT id_producto, stock_actual, precio_venta, precio_compra FROM productos WHERE id_producto = :pid LIMIT 1");
        $p->bindValue(':pid', (int)$producto_id, PDO::PARAM_INT);
        $p->execute();
        $prod = $p->fetch(PDO::FETCH_ASSOC);
        if (!$prod) return;

        $stock = (int)($prod['stock_actual'] ?? 0);
        $precioVenta = (float)($prod['precio_venta'] ?? 0);
        $precioCompra = (float)($prod['precio_compra'] ?? 0);
        if ($stock <= 0 || $precioVenta <= 0) return;

        $query = "INSERT INTO {$this->table_name}
                  (producto_id, proveedor_id, numero_lote, costo_unitario, precio_venta, cantidad_inicial, cantidad_disponible, estado)
                  VALUES
                  (:producto_id, NULL, NULL, :costo_unitario, :precio_venta, :cantidad_inicial, :cantidad_disponible, 'activo')";
        $stmtIns = $this->conn->prepare($query);
        $stmtIns->bindValue(':producto_id', (int)$producto_id, PDO::PARAM_INT);
        $stmtIns->bindValue(':costo_unitario', (float)$precioCompra);
        $stmtIns->bindValue(':precio_venta', (float)$precioVenta);
        $stmtIns->bindValue(':cantidad_inicial', (int)$stock, PDO::PARAM_INT);
        $stmtIns->bindValue(':cantidad_disponible', (int)$stock, PDO::PARAM_INT);
        $stmtIns->execute();
    }

    public function allocateFifo($producto_id, $cantidad, $excludedLotIds = []) {
        if ($cantidad <= 0) {
            throw new Exception("La cantidad debe ser mayor a cero.");
        }

        $this->ensureDefaultLotFromProduct($producto_id);

        $query = "SELECT id_lote, cantidad_disponible, precio_venta
                  FROM {$this->table_name}
                  WHERE producto_id = :producto_id
                    AND cantidad_disponible > 0
                    AND estado = 'activo'
                  ORDER BY fecha_creacion ASC, id_lote ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':producto_id', (int)$producto_id, PDO::PARAM_INT);
        $stmt->execute();

        $remaining = (int)$cantidad;
        $allocations = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $loteId = (int)$row['id_lote'];
            if (in_array($loteId, $excludedLotIds, true)) continue;

            $available = (int)$row['cantidad_disponible'];
            if ($available <= 0) continue;

            $take = $available >= $remaining ? $remaining : $available;
            $allocations[] = [
                'lote_id' => $loteId,
                'cantidad' => $take,
                'precio_unitario' => (float)$row['precio_venta']
            ];
            $remaining -= $take;
            if ($remaining <= 0) break;
        }

        if ($remaining > 0) {
            throw new Exception("Stock insuficiente para el producto ID: {$producto_id}.");
        }

        return $allocations;
    }

    public function allocateWithPreferredLot($producto_id, $cantidad, $preferredLotId) {
        if ($preferredLotId === null) {
            return $this->allocateFifo($producto_id, $cantidad);
        }

        $lot = $this->getLotById($preferredLotId);
        if (!$lot) {
            throw new Exception("Lote no encontrado: {$preferredLotId}.");
        }
        if ((int)$lot['producto_id'] !== (int)$producto_id) {
            throw new Exception("El lote {$preferredLotId} no pertenece al producto {$producto_id}.");
        }

        $preferredAvailable = (int)($lot['cantidad_disponible'] ?? 0);
        $takePreferred = $preferredAvailable > 0 ? min((int)$cantidad, $preferredAvailable) : 0;

        $allocations = [];
        $remaining = (int)$cantidad;
        if ($takePreferred > 0) {
            $allocations[] = [
                'lote_id' => (int)$preferredLotId,
                'cantidad' => (int)$takePreferred,
                'precio_unitario' => (float)$lot['precio_venta']
            ];
            $remaining -= (int)$takePreferred;
        }

        if ($remaining > 0) {
            $rest = $this->allocateFifo($producto_id, $remaining, [(int)$preferredLotId]);
            $allocations = array_merge($allocations, $rest);
        }

        return $allocations;
    }

    public function consumeLot($lote_id, $cantidad) {
        $query = "UPDATE {$this->table_name}
                  SET cantidad_disponible = cantidad_disponible - :cantidad,
                      estado = CASE WHEN (cantidad_disponible - :cantidad2) <= 0 THEN 'agotado' ELSE 'activo' END
                  WHERE id_lote = :id_lote
                    AND cantidad_disponible >= :cantidad3";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':cantidad', (int)$cantidad, PDO::PARAM_INT);
        $stmt->bindValue(':cantidad2', (int)$cantidad, PDO::PARAM_INT);
        $stmt->bindValue(':cantidad3', (int)$cantidad, PDO::PARAM_INT);
        $stmt->bindValue(':id_lote', (int)$lote_id, PDO::PARAM_INT);
        $stmt->execute();
        if ($stmt->rowCount() < 1) {
            throw new Exception("Stock insuficiente en lote ID: {$lote_id}.");
        }
        return true;
    }

    public function restoreLot($lote_id, $cantidad) {
        $query = "UPDATE {$this->table_name}
                  SET cantidad_disponible = cantidad_disponible + :cantidad,
                      estado = 'activo'
                  WHERE id_lote = :id_lote";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':cantidad', (int)$cantidad, PDO::PARAM_INT);
        $stmt->bindValue(':id_lote', (int)$lote_id, PDO::PARAM_INT);
        $stmt->execute();
        if ($stmt->rowCount() < 1) {
            throw new Exception("No se pudo restaurar stock del lote ID: {$lote_id}.");
        }
        return true;
    }
}
?>
