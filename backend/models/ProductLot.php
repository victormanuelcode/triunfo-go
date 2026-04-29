<?php
class ProductLot {
    private $conn;
    private $table_name = "lotes_producto";
    private $allowed_statuses = ['activo', 'agotado', 'inactivo', 'bloqueado', 'cuarentena', 'vencido'];

    public function __construct($db) {
        $this->conn = $db;
    }

    private function toQty($value) {
        return round((float)$value, 3);
    }

    public function createLot($producto_id, $cantidad, $precio_venta, $costo_unitario = 0, $proveedor_id = null, $numero_lote = null) {
        $cantidad = $this->toQty($cantidad);
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
            $stmt->bindValue(':cantidad_inicial', $cantidad);
            $stmt->bindValue(':cantidad_disponible', $cantidad);
            if (!$stmt->execute()) {
                throw new Exception("No se pudo crear el lote.");
            }

            $loteId = (int)$this->conn->lastInsertId();

            if ($numero_lote === null) {
                $defaultNumero = 'L-' . date('Ymd') . '-' . $loteId;
                $up = $this->conn->prepare("UPDATE {$this->table_name} SET numero_lote = :num WHERE id_lote = :id");
                $up->bindValue(':num', $defaultNumero);
                $up->bindValue(':id', $loteId, PDO::PARAM_INT);
                $up->execute();
                $numero_lote = $defaultNumero;
            }

            $stmtStock = $this->conn->prepare("UPDATE productos SET stock_actual = stock_actual + :cantidad WHERE id_producto = :producto_id");
            $stmtStock->bindValue(':cantidad', $cantidad);
            $stmtStock->bindValue(':producto_id', (int)$producto_id, PDO::PARAM_INT);
            if (!$stmtStock->execute()) {
                throw new Exception("No se pudo actualizar el stock del producto.");
            }

            $stmtMov = $this->conn->prepare("INSERT INTO movimientos_inventario (tipo, producto_id, lote_id, numero_lote_snapshot, cantidad, descripcion, referencia, fecha)
                                             VALUES ('entrada', :producto_id, :lote_id, :numero_lote_snapshot, :cantidad, :descripcion, :referencia, NOW())");
            $stmtMov->bindValue(':producto_id', (int)$producto_id, PDO::PARAM_INT);
            $stmtMov->bindValue(':lote_id', (int)$loteId, PDO::PARAM_INT);
            $stmtMov->bindValue(':numero_lote_snapshot', $numero_lote !== null ? (string)$numero_lote : null, $numero_lote !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
            $stmtMov->bindValue(':cantidad', $cantidad);
            $stmtMov->bindValue(':descripcion', 'Ingreso por lote');
            $ref = (string)$numero_lote;
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
                         cantidad_inicial, cantidad_disponible, estado, fecha_vencimiento, motivo_estado
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
                         cantidad_inicial, cantidad_disponible, estado, fecha_vencimiento, motivo_estado
                  FROM {$this->table_name}
                  WHERE id_lote = :id_lote
                  LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id_lote', (int)$lote_id, PDO::PARAM_INT);
        $stmt->execute();
        $lot = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        return $this->appendLotEditabilityMeta($lot);
    }

    public function getLotDetail($lote_id) {
        $query = "SELECT l.id_lote, l.producto_id, l.proveedor_id, l.numero_lote, l.fecha_creacion,
                         l.costo_unitario, l.precio_venta, l.cantidad_inicial, l.cantidad_disponible, l.estado,
                         l.fecha_vencimiento, l.motivo_estado,
                         p.nombre AS producto_nombre, p.descripcion AS producto_descripcion, p.imagen AS producto_imagen,
                         pr.nombre AS proveedor_nombre, pr.nit AS proveedor_nit, pr.telefono AS proveedor_telefono
                  FROM {$this->table_name} l
                  LEFT JOIN productos p ON l.producto_id = p.id_producto
                  LEFT JOIN proveedores pr ON l.proveedor_id = pr.id_proveedor
                  WHERE l.id_lote = :id_lote
                  LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id_lote', (int)$lote_id, PDO::PARAM_INT);
        $stmt->execute();
        $lot = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        if (!$lot) {
            return null;
        }

        $lot = $this->appendLotEditabilityMeta($lot);
        $lot['cantidad_vendida'] = max(0, (float)$lot['cantidad_inicial'] - (float)$lot['cantidad_disponible']);
        $lot['timeline'] = $this->getLotTimeline((int)$lote_id);
        return $lot;
    }

    private function getLotTimeline($lote_id) {
        $query = "SELECT m.id_movimiento, m.tipo, m.cantidad, m.fecha, m.descripcion, m.referencia,
                         m.numero_lote_snapshot, f.id_factura, f.numero_factura, f.estado AS factura_estado
                  FROM movimientos_inventario m
                  LEFT JOIN facturas f ON m.referencia = f.numero_factura
                  WHERE m.lote_id = :id_lote
                  ORDER BY m.fecha ASC, m.id_movimiento ASC";
        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':id_lote', (int)$lote_id, PDO::PARAM_INT);
            $stmt->execute();
        } catch (PDOException $e) {
            if ($e->getCode() === '42S22' && stripos($e->getMessage(), 'estado') !== false) {
                $query2 = "SELECT m.id_movimiento, m.tipo, m.cantidad, m.fecha, m.descripcion, m.referencia,
                                  m.numero_lote_snapshot, f.id_factura, f.numero_factura, NULL AS factura_estado
                           FROM movimientos_inventario m
                           LEFT JOIN facturas f ON m.referencia = f.numero_factura
                           WHERE m.lote_id = :id_lote
                           ORDER BY m.fecha ASC, m.id_movimiento ASC";
                $stmt = $this->conn->prepare($query2);
                $stmt->bindValue(':id_lote', (int)$lote_id, PDO::PARAM_INT);
                $stmt->execute();
            } else {
                throw $e;
            }
        }

        $timeline = [];
        $saldo = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $categoria = 'movimiento';
            $descripcion = (string)($row['descripcion'] ?? '');
            $referencia = (string)($row['referencia'] ?? '');
            $facturaId = isset($row['id_factura']) ? (int)$row['id_factura'] : 0;
            $cantidad = (float)($row['cantidad'] ?? 0);

            if ($facturaId > 0 || stripos($descripcion, 'Venta Factura') !== false) {
                $categoria = 'venta';
            } elseif (stripos($descripcion, 'Anulación Factura') !== false || stripos($referencia, 'ANULACION') !== false) {
                $categoria = 'anulacion';
            } elseif (stripos($descripcion, 'Regularización') !== false) {
                $categoria = 'regularizacion';
            } elseif (stripos($descripcion, 'Ingreso por lote') !== false || stripos($descripcion, 'Compra') !== false) {
                $categoria = 'creacion';
            } elseif (stripos($descripcion, 'Lote eliminado') !== false || stripos($descripcion, 'inactivado') !== false || stripos($descripcion, 'Cambio de estado') !== false) {
                $categoria = 'estado';
            } elseif (stripos($referencia, 'AJUSTE') !== false || stripos($descripcion, 'Ajuste') !== false || stripos($descripcion, 'Manual') !== false) {
                $categoria = 'ajuste';
            }

            if (($row['tipo'] ?? '') === 'entrada') {
                $saldo += $cantidad;
            } else {
                $saldo -= $cantidad;
            }

            $timeline[] = [
                'id_movimiento' => (int)$row['id_movimiento'],
                'tipo' => $row['tipo'],
                'categoria' => $categoria,
                'cantidad' => $cantidad,
                'fecha' => $row['fecha'],
                'descripcion' => $descripcion,
                'referencia' => $referencia,
                'numero_lote_snapshot' => $row['numero_lote_snapshot'],
                'saldo_resultante' => $saldo,
                'id_factura' => $facturaId > 0 ? $facturaId : null,
                'numero_factura' => $row['numero_factura'] ?? null,
                'factura_estado' => $row['factura_estado'] ?? null
            ];
        }

        return array_reverse($timeline);
    }

    private function lotHasProtectedHistory($lote_id) {
        $lote_id = (int)$lote_id;
        if ($lote_id <= 0) return false;

        $stmtInvoice = $this->conn->prepare("SELECT COUNT(*) AS total FROM detalle_factura WHERE lote_id = :lote_id");
        $stmtInvoice->bindValue(':lote_id', $lote_id, PDO::PARAM_INT);
        $stmtInvoice->execute();
        $invoiceCount = (int)($stmtInvoice->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        if ($invoiceCount > 0) {
            return true;
        }

        $stmtMov = $this->conn->prepare("SELECT COUNT(*) AS total
                                         FROM movimientos_inventario
                                         WHERE lote_id = :lote_id
                                           AND NOT (tipo = 'entrada' AND descripcion = 'Ingreso por lote')");
        $stmtMov->bindValue(':lote_id', $lote_id, PDO::PARAM_INT);
        $stmtMov->execute();
        $movementCount = (int)($stmtMov->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

        return $movementCount > 0;
    }

    private function appendLotEditabilityMeta($lot) {
        if (!$lot) return null;
        $locked = $this->lotHasProtectedHistory((int)($lot['id_lote'] ?? 0));
        $lot['identidad_bloqueada'] = $locked;
        $lot['campos_identidad_editables'] = !$locked;
        return $lot;
    }

    private function normalizeLotStatus($estado) {
        $value = strtolower(trim((string)$estado));
        if ($value === '') {
            return null;
        }
        if (!in_array($value, $this->allowed_statuses, true)) {
            throw new Exception("Estado de lote no válido.");
        }
        return $value;
    }

    private function normalizeLotDate($value) {
        $raw = trim((string)$value);
        if ($raw === '') {
            return null;
        }
        $date = date_create($raw);
        if (!$date) {
            throw new Exception("La fecha de vencimiento no es válida.");
        }
        return $date->format('Y-m-d');
    }

    private function getProductLotAvailabilityMeta($producto_id) {
        $stmt = $this->conn->prepare("SELECT p.id_producto, p.nombre, p.stock_actual,
                                             COUNT(l.id_lote) AS total_lotes,
                                             SUM(CASE WHEN l.estado = 'activo' AND l.cantidad_disponible > 0 THEN 1 ELSE 0 END) AS lotes_activos_disponibles
                                      FROM productos p
                                      LEFT JOIN {$this->table_name} l ON p.id_producto = l.producto_id
                                      WHERE p.id_producto = :pid
                                      GROUP BY p.id_producto, p.nombre, p.stock_actual
                                      LIMIT 1");
        $stmt->bindValue(':pid', (int)$producto_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function getRegularizationCandidates(): PDOStatement {
        $query = "SELECT p.id_producto, p.nombre, p.stock_actual, p.precio_venta, p.precio_compra,
                         pp.proveedor_id, pr.nombre AS proveedor_nombre,
                         COUNT(l.id_lote) AS total_lotes
                  FROM productos p
                  LEFT JOIN proveedor_producto pp ON p.id_producto = pp.producto_id
                  LEFT JOIN proveedores pr ON pp.proveedor_id = pr.id_proveedor
                  LEFT JOIN {$this->table_name} l ON p.id_producto = l.producto_id
                  WHERE p.estado = 'activo'
                  GROUP BY p.id_producto, p.nombre, p.stock_actual, p.precio_venta, p.precio_compra, pp.proveedor_id, pr.nombre
                  HAVING p.stock_actual > 0 AND COUNT(l.id_lote) = 0
                  ORDER BY p.nombre ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function regularizeProductStock($producto_id, $precio_venta = null, $costo_unitario = 0, $proveedor_id = null, $numero_lote = null) {
        $producto_id = (int)$producto_id;
        if ($producto_id <= 0) {
            throw new Exception("producto_id inválido.");
        }
        if ($costo_unitario !== null && (float)$costo_unitario < 0) {
            throw new Exception("El costo unitario no puede ser negativo.");
        }

        $stmt = $this->conn->prepare("SELECT p.id_producto, p.nombre, p.stock_actual, p.precio_venta, p.precio_compra
                                      FROM productos p
                                      WHERE p.id_producto = :producto_id
                                      LIMIT 1");
        $stmt->bindValue(':producto_id', $producto_id, PDO::PARAM_INT);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$product) {
            throw new Exception("Producto no encontrado.");
        }

        $stockActual = $this->toQty($product['stock_actual'] ?? 0);
        if ($stockActual <= 0) {
            throw new Exception("El producto no tiene stock pendiente por regularizar.");
        }

        $stmtLots = $this->conn->prepare("SELECT COUNT(*) AS total FROM {$this->table_name} WHERE producto_id = :producto_id");
        $stmtLots->bindValue(':producto_id', $producto_id, PDO::PARAM_INT);
        $stmtLots->execute();
        $totalLots = (int)($stmtLots->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
        if ($totalLots > 0) {
            throw new Exception("El producto ya tiene lotes registrados. La regularización solo aplica a productos sin lotes.");
        }

        $precioVentaFinal = $precio_venta !== null ? (float)$precio_venta : (float)($product['precio_venta'] ?? 0);
        if ($precioVentaFinal <= 0) {
            throw new Exception("Debe indicar un precio de venta válido para regularizar.");
        }
        $costoFinal = $costo_unitario !== null ? (float)$costo_unitario : (float)($product['precio_compra'] ?? 0);

        $this->conn->beginTransaction();
        try {
            $query = "INSERT INTO {$this->table_name}
                      (producto_id, proveedor_id, numero_lote, costo_unitario, precio_venta, cantidad_inicial, cantidad_disponible, estado)
                      VALUES
                      (:producto_id, :proveedor_id, :numero_lote, :costo_unitario, :precio_venta, :cantidad_inicial, :cantidad_disponible, 'activo')";
            $stmtInsert = $this->conn->prepare($query);
            $stmtInsert->bindValue(':producto_id', $producto_id, PDO::PARAM_INT);
            $stmtInsert->bindValue(':proveedor_id', $proveedor_id !== null ? (int)$proveedor_id : null, $proveedor_id !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
            $stmtInsert->bindValue(':numero_lote', $numero_lote !== null ? (string)$numero_lote : null, $numero_lote !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
            $stmtInsert->bindValue(':costo_unitario', $costoFinal);
            $stmtInsert->bindValue(':precio_venta', $precioVentaFinal);
            $stmtInsert->bindValue(':cantidad_inicial', $stockActual);
            $stmtInsert->bindValue(':cantidad_disponible', $stockActual);
            if (!$stmtInsert->execute()) {
                throw new Exception("No se pudo crear el lote de regularización.");
            }

            $loteId = (int)$this->conn->lastInsertId();
            if ($numero_lote === null) {
                $numero_lote = 'REG-' . date('Ymd') . '-' . $loteId;
                $stmtNumero = $this->conn->prepare("UPDATE {$this->table_name} SET numero_lote = :numero_lote WHERE id_lote = :id_lote");
                $stmtNumero->bindValue(':numero_lote', $numero_lote);
                $stmtNumero->bindValue(':id_lote', $loteId, PDO::PARAM_INT);
                $stmtNumero->execute();
            }

            $stmtMov = $this->conn->prepare("INSERT INTO movimientos_inventario (tipo, producto_id, lote_id, numero_lote_snapshot, cantidad, descripcion, referencia, fecha)
                                             VALUES ('entrada', :producto_id, :lote_id, :numero_lote_snapshot, :cantidad, :descripcion, :referencia, NOW())");
            $stmtMov->bindValue(':producto_id', $producto_id, PDO::PARAM_INT);
            $stmtMov->bindValue(':lote_id', $loteId, PDO::PARAM_INT);
            $stmtMov->bindValue(':numero_lote_snapshot', $numero_lote !== null ? (string)$numero_lote : null, $numero_lote !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
            $stmtMov->bindValue(':cantidad', $stockActual);
            $stmtMov->bindValue(':descripcion', 'Regularización inicial de stock sin lotes');
            $stmtMov->bindValue(':referencia', (string)$numero_lote);
            if (!$stmtMov->execute()) {
                throw new Exception("No se pudo registrar el movimiento de regularización.");
            }

            $this->conn->commit();
            return $loteId;
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    public function allocateFifo($producto_id, $cantidad, $excludedLotIds = []) {
        $cantidad = $this->toQty($cantidad);
        if ($cantidad <= 0) {
            throw new Exception("La cantidad debe ser mayor a cero.");
        }

        $query = "SELECT id_lote, cantidad_disponible, precio_venta
                  FROM {$this->table_name}
                  WHERE producto_id = :producto_id
                    AND cantidad_disponible > 0
                    AND estado = 'activo'
                  ORDER BY fecha_creacion ASC, id_lote ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':producto_id', (int)$producto_id, PDO::PARAM_INT);
        $stmt->execute();

        $remaining = $cantidad;
        $allocations = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $loteId = (int)$row['id_lote'];
            if (in_array($loteId, $excludedLotIds, true)) continue;

            $available = (float)$row['cantidad_disponible'];
            if ($available <= 0) continue;

            $take = $available >= $remaining ? $remaining : $available;
            $take = $this->toQty($take);
            $allocations[] = [
                'lote_id' => $loteId,
                'cantidad' => $take,
                'precio_unitario' => (float)$row['precio_venta']
            ];
            $remaining -= $take;
            if ($remaining <= 0.0001) break;
        }

        if ($remaining > 0.0001) {
            $meta = $this->getProductLotAvailabilityMeta($producto_id);
            if ($meta) {
                $productName = trim((string)($meta['nombre'] ?? '')) ?: ('ID ' . (int)$producto_id);
                $stockActual = (float)($meta['stock_actual'] ?? 0);
                $totalLotes = (int)($meta['total_lotes'] ?? 0);
                $lotesActivos = (int)($meta['lotes_activos_disponibles'] ?? 0);

                if ($totalLotes === 0 && $stockActual > 0) {
                    throw new Exception("El producto {$productName} tiene stock pero no tiene lotes regularizados. Debes regularizar sus lotes antes de vender.");
                }
                if ($totalLotes === 0) {
                    throw new Exception("El producto {$productName} no tiene lotes registrados.");
                }
                if ($lotesActivos === 0) {
                    throw new Exception("El producto {$productName} no tiene lotes activos disponibles.");
                }
            }
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
        if (strtolower((string)($lot['estado'] ?? 'activo')) !== 'activo') {
            throw new Exception("El lote {$preferredLotId} no está activo para la venta.");
        }

        $cantidad = $this->toQty($cantidad);
        $preferredAvailable = (float)($lot['cantidad_disponible'] ?? 0);
        if ($preferredAvailable <= 0) {
            $numero = !empty($lot['numero_lote']) ? (string)$lot['numero_lote'] : ('#' . (int)$preferredLotId);
            throw new Exception("El lote {$numero} no tiene unidades disponibles.");
        }
        if ($preferredAvailable < (int)$cantidad) {
            $numero = !empty($lot['numero_lote']) ? (string)$lot['numero_lote'] : ('#' . (int)$preferredLotId);
            throw new Exception("El lote {$numero} solo tiene {$preferredAvailable} unidades disponibles. Reduce la cantidad o vuelve a modo FIFO.");
        }

        return [[
            'lote_id' => (int)$preferredLotId,
            'cantidad' => $cantidad,
            'precio_unitario' => (float)$lot['precio_venta']
        ]];
    }

    public function consumeLot($lote_id, $cantidad) {
        $cantidad = $this->toQty($cantidad);
        $query = "UPDATE {$this->table_name}
                  SET cantidad_disponible = cantidad_disponible - :cantidad,
                      estado = CASE WHEN (cantidad_disponible - :cantidad2) <= 0 THEN 'agotado' ELSE 'activo' END
                  WHERE id_lote = :id_lote
                    AND cantidad_disponible >= :cantidad3";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':cantidad', $cantidad);
        $stmt->bindValue(':cantidad2', $cantidad);
        $stmt->bindValue(':cantidad3', $cantidad);
        $stmt->bindValue(':id_lote', (int)$lote_id, PDO::PARAM_INT);
        $stmt->execute();
        if ($stmt->rowCount() < 1) {
            throw new Exception("Stock insuficiente en lote ID: {$lote_id}.");
        }
        return true;
    }

    public function restoreLot($lote_id, $cantidad) {
        $cantidad = $this->toQty($cantidad);
        $query = "UPDATE {$this->table_name}
                  SET cantidad_disponible = cantidad_disponible + :cantidad,
                      estado = 'activo'
                  WHERE id_lote = :id_lote";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':cantidad', $cantidad);
        $stmt->bindValue(':id_lote', (int)$lote_id, PDO::PARAM_INT);
        $stmt->execute();
        if ($stmt->rowCount() < 1) {
            throw new Exception("No se pudo restaurar stock del lote ID: {$lote_id}.");
        }
        return true;
    }

    public function updateLot($lote_id, $fields) {
        $lote_id = (int)$lote_id;
        if ($lote_id <= 0) {
            throw new Exception("ID de lote inválido.");
        }
        $currentLot = $this->getLotById($lote_id);
        if (!$currentLot) {
            throw new Exception("Lote no encontrado.");
        }
        $precioVenta = isset($fields['precio_venta']) ? (float)$fields['precio_venta'] : null;
        if ($precioVenta !== null && $precioVenta <= 0) {
            throw new Exception("El precio de venta del lote debe ser mayor a cero.");
        }
        $costoUnitario = isset($fields['costo_unitario']) ? (float)$fields['costo_unitario'] : null;
        if ($costoUnitario !== null && $costoUnitario < 0) {
            throw new Exception("El costo unitario no puede ser negativo.");
        }
        $proveedorId = array_key_exists('proveedor_id', $fields) ? $fields['proveedor_id'] : null;
        $numeroLote = array_key_exists('numero_lote', $fields) ? $fields['numero_lote'] : null;
        $estado = array_key_exists('estado', $fields) ? $this->normalizeLotStatus($fields['estado']) : null;
        $fechaVencimiento = array_key_exists('fecha_vencimiento', $fields) ? $this->normalizeLotDate($fields['fecha_vencimiento']) : null;
        $motivoEstado = array_key_exists('motivo_estado', $fields) ? trim((string)$fields['motivo_estado']) : null;
        if ($motivoEstado === '') {
            $motivoEstado = null;
        }
        if ($motivoEstado !== null && strlen($motivoEstado) > 255) {
            throw new Exception("El motivo del estado no puede exceder 255 caracteres.");
        }
        $identityLocked = $this->lotHasProtectedHistory($lote_id);

        if ($identityLocked) {
            $wantsNumeroChange = $numeroLote !== null;
            $wantsProveedorChange = $proveedorId !== null;
            $wantsCostoChange = $costoUnitario !== null;
            if ($wantsNumeroChange || $wantsProveedorChange || $wantsCostoChange) {
                throw new Exception("No se puede modificar numero de lote, proveedor ni costo unitario porque el lote ya tiene historial.");
            }
        }

        $sets = [];
        $params = [':id_lote' => $lote_id];
        if ($precioVenta !== null) {
            $sets[] = "precio_venta = :precio_venta";
            $params[':precio_venta'] = $precioVenta;
        }
        if ($costoUnitario !== null) {
            $sets[] = "costo_unitario = :costo_unitario";
            $params[':costo_unitario'] = $costoUnitario;
        }
        if ($proveedorId !== null) {
            if ($proveedorId === '' || $proveedorId === 0) {
                $sets[] = "proveedor_id = NULL";
            } else {
                $sets[] = "proveedor_id = :proveedor_id";
                $params[':proveedor_id'] = (int)$proveedorId;
            }
        }
        if ($numeroLote !== null) {
            if ($numeroLote === '') {
                $sets[] = "numero_lote = NULL";
            } else {
                $sets[] = "numero_lote = :numero_lote";
                $params[':numero_lote'] = (string)$numeroLote;
            }
        }
        if ($estado !== null) {
            if ($estado === 'agotado' && (int)($currentLot['cantidad_disponible'] ?? 0) > 0) {
                throw new Exception("No puedes marcar el lote como agotado mientras tenga unidades disponibles.");
            }
            if ($estado === 'inactivo' && strtolower((string)($currentLot['estado'] ?? 'activo')) !== 'inactivo') {
                throw new Exception("Usa la opción de inactivar lote para pasar a estado inactivo.");
            }
            $requiresReason = in_array($estado, ['bloqueado', 'cuarentena', 'vencido'], true);
            $finalReason = $motivoEstado !== null ? $motivoEstado : (($currentLot['motivo_estado'] ?? null) ?: null);
            $finalExpiry = $fechaVencimiento !== null ? $fechaVencimiento : (($currentLot['fecha_vencimiento'] ?? null) ?: null);
            if ($requiresReason && $finalReason === null) {
                throw new Exception("Debes indicar un motivo para el estado seleccionado.");
            }
            if ($estado === 'vencido' && $finalExpiry === null) {
                throw new Exception("Debes indicar una fecha de vencimiento para marcar el lote como vencido.");
            }
            $sets[] = "estado = :estado";
            $params[':estado'] = $estado;
        }
        if (array_key_exists('fecha_vencimiento', $fields)) {
            if ($fechaVencimiento === null) {
                $sets[] = "fecha_vencimiento = NULL";
            } else {
                $sets[] = "fecha_vencimiento = :fecha_vencimiento";
                $params[':fecha_vencimiento'] = $fechaVencimiento;
            }
        }
        if (array_key_exists('motivo_estado', $fields)) {
            if ($motivoEstado === null) {
                $sets[] = "motivo_estado = NULL";
            } else {
                $sets[] = "motivo_estado = :motivo_estado";
                $params[':motivo_estado'] = $motivoEstado;
            }
        }

        if (count($sets) === 0) {
            return true;
        }

        $this->conn->beginTransaction();
        try {
            $query = "UPDATE {$this->table_name} SET " . implode(", ", $sets) . " WHERE id_lote = :id_lote";
            $stmt = $this->conn->prepare($query);
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }
            if (!$stmt->execute()) {
                throw new Exception("No se pudo actualizar el lote.");
            }

            $currentState = strtolower((string)($currentLot['estado'] ?? 'activo'));
            if ($estado !== null && $estado !== $currentState) {
                $reasonForLog = $motivoEstado !== null ? $motivoEstado : (($currentLot['motivo_estado'] ?? null) ?: null);
                $expiryForLog = $fechaVencimiento !== null ? $fechaVencimiento : (($currentLot['fecha_vencimiento'] ?? null) ?: null);
                $desc = "Cambio de estado: {$currentState} -> {$estado}";
                if ($reasonForLog !== null) {
                    $desc .= ". Motivo: {$reasonForLog}";
                }
                if ($expiryForLog !== null) {
                    $desc .= ". Vence: {$expiryForLog}";
                }
                $stmtMov = $this->conn->prepare("INSERT INTO movimientos_inventario (tipo, producto_id, lote_id, numero_lote_snapshot, cantidad, descripcion, referencia, fecha)
                                                 VALUES ('entrada', :producto_id, :lote_id, :numero_lote_snapshot, 0, :descripcion, :referencia, NOW())");
                $stmtMov->bindValue(':producto_id', (int)$currentLot['producto_id'], PDO::PARAM_INT);
                $stmtMov->bindValue(':lote_id', $lote_id, PDO::PARAM_INT);
                $stmtMov->bindValue(':numero_lote_snapshot', !empty($currentLot['numero_lote']) ? (string)$currentLot['numero_lote'] : null, !empty($currentLot['numero_lote']) ? PDO::PARAM_STR : PDO::PARAM_NULL);
                $stmtMov->bindValue(':descripcion', $desc);
                $stmtMov->bindValue(':referencia', 'CAMBIO_ESTADO');
                if (!$stmtMov->execute()) {
                    throw new Exception("No se pudo registrar el cambio de estado del lote.");
                }
            }

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw $e;
        }
    }

    public function restockLot($lote_id, $cantidad, $precio_venta = null, $costo_unitario = null) {
        $lote_id = (int)$lote_id;
        $cantidad = $this->toQty($cantidad);
        if ($lote_id <= 0 || $cantidad <= 0) {
            throw new Exception("lote_id y cantidad deben ser mayores a cero.");
        }
        throw new Exception("Por trazabilidad, las compras deben crear un lote nuevo. Reabastecer un lote existente está deshabilitado.");
    }

    public function inactivateLot($lote_id) {
        $lote_id = (int)$lote_id;
        if ($lote_id <= 0) {
            throw new Exception("ID de lote inválido.");
        }

        $this->conn->beginTransaction();
        try {
            $lot = $this->getLotById($lote_id);
            if (!$lot) throw new Exception("Lote no encontrado.");
            $producto_id = (int)$lot['producto_id'];
            $disponible = (float)($lot['cantidad_disponible'] ?? 0);
            $estado = (string)($lot['estado'] ?? '');
            if ($estado === 'inactivo') {
                $this->conn->commit();
                return true;
            }

            $stmt = $this->conn->prepare("UPDATE {$this->table_name} SET estado='inactivo', cantidad_disponible=0 WHERE id_lote = :id_lote");
            $stmt->bindValue(':id_lote', $lote_id, PDO::PARAM_INT);
            if (!$stmt->execute()) {
                throw new Exception("No se pudo inactivar el lote.");
            }

            if ($disponible > 0) {
                $stmtStock = $this->conn->prepare("UPDATE productos SET stock_actual = GREATEST(stock_actual - :cantidad, 0) WHERE id_producto = :producto_id");
                $stmtStock->bindValue(':cantidad', $disponible);
                $stmtStock->bindValue(':producto_id', $producto_id, PDO::PARAM_INT);
                if (!$stmtStock->execute()) {
                    throw new Exception("No se pudo actualizar el stock del producto.");
                }

                $stmtMov = $this->conn->prepare("INSERT INTO movimientos_inventario (tipo, producto_id, lote_id, numero_lote_snapshot, cantidad, descripcion, referencia, fecha)
                                                 VALUES ('salida', :producto_id, :lote_id, :numero_lote_snapshot, :cantidad, :descripcion, :referencia, NOW())");
                $stmtMov->bindValue(':producto_id', $producto_id, PDO::PARAM_INT);
                $stmtMov->bindValue(':lote_id', $lote_id, PDO::PARAM_INT);
                $stmtMov->bindValue(':numero_lote_snapshot', $lot['numero_lote'] ? (string)$lot['numero_lote'] : null, $lot['numero_lote'] ? PDO::PARAM_STR : PDO::PARAM_NULL);
                $stmtMov->bindValue(':cantidad', $disponible);
                $stmtMov->bindValue(':descripcion', 'Lote eliminado/inactivado');
                $ref = $lot['numero_lote'] ? (string)$lot['numero_lote'] : ('LOTE-' . $lote_id);
                $stmtMov->bindValue(':referencia', $ref);
                $stmtMov->execute();
            }

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }
}
?>
