<?php
/**
 * Clase Invoice
 * 
 * Gestiona el ciclo de vida de las facturas de venta.
 * Incluye la creación de cabeceras y detalles, actualización de inventario,
 * registro de movimientos y consultas de historial.
 * Utiliza transacciones para garantizar la integridad de los datos.
 */
class Invoice {
    private $conn;
    private $table_name = "facturas";

    public $id_factura;
    public $numero_factura;
    public $cliente_id;
    public $usuario_id; // Nuevo campo trazabilidad
    public $sesion_id; // Nuevo campo para control de caja
    public $cliente_nombre;
    public $cliente_documento;
    public $cliente_direccion;
    public $cliente_telefono;
    public $cliente_email;
    public $usuario_nombre;
    public $estado; // Nuevo campo estado (pagada, anulada)
    public $total;
    public $monto_recibido;
    public $metodo_pago;
    public $observaciones;
    public $fecha;
    public $last_error = null;
    public $items = []; // Array de productos a vender
    public $detalles = []; // Array para lectura de detalles

    public function __construct($db) {
        $this->conn = $db;
    }

    private function buildSaleLines($items, $lotModel) {
        if (!is_array($items) || empty($items)) {
            throw new Exception("Items inválidos.");
        }

        $lines = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                throw new Exception("Ítem inválido.");
            }

            $productoId = isset($item['producto_id']) ? (int)$item['producto_id'] : 0;
            $cantidad = isset($item['cantidad']) ? (int)$item['cantidad'] : 0;
            $preferredLotId = isset($item['lote_id']) ? (int)$item['lote_id'] : null;

            if (isset($item['lotes']) && is_array($item['lotes']) && !empty($item['lotes'])) {
                foreach ($item['lotes'] as $sel) {
                    if (!is_array($sel) || !isset($sel['lote_id'], $sel['cantidad'])) {
                        throw new Exception("Selección de lote inválida.");
                    }
                    $loteId = (int)$sel['lote_id'];
                    $cantSel = (int)$sel['cantidad'];
                    if ($loteId <= 0 || $cantSel <= 0) {
                        throw new Exception("Selección de lote inválida.");
                    }
                    $lot = $lotModel->getLotById($loteId);
                    if (!$lot) {
                        throw new Exception("Lote no encontrado: {$loteId}.");
                    }
                    if ($productoId > 0 && (int)$lot['producto_id'] !== $productoId) {
                        throw new Exception("El lote {$loteId} no pertenece al producto {$productoId}.");
                    }
                    if ((int)$lot['cantidad_disponible'] < $cantSel) {
                        throw new Exception("Stock insuficiente en lote ID: {$loteId}.");
                    }

                    $lines[] = [
                        'producto_id' => (int)$lot['producto_id'],
                        'lote_id' => $loteId,
                        'cantidad' => $cantSel,
                        'precio_unitario' => (float)$lot['precio_venta'],
                        'subtotal' => (float)$lot['precio_venta'] * $cantSel
                    ];
                }
                continue;
            }

            if ($productoId <= 0 || $cantidad <= 0) {
                throw new Exception("Cada ítem debe incluir producto_id y cantidad.");
            }

            $allocations = $preferredLotId ? $lotModel->allocateWithPreferredLot($productoId, $cantidad, $preferredLotId) : $lotModel->allocateFifo($productoId, $cantidad);
            foreach ($allocations as $alloc) {
                $lines[] = [
                    'producto_id' => $productoId,
                    'lote_id' => (int)$alloc['lote_id'],
                    'cantidad' => (int)$alloc['cantidad'],
                    'precio_unitario' => (float)$alloc['precio_unitario'],
                    'subtotal' => (float)$alloc['precio_unitario'] * (int)$alloc['cantidad']
                ];
            }
        }

        $total = 0;
        foreach ($lines as $ln) {
            $total += (float)$ln['subtotal'];
        }

        return [
            'lines' => $lines,
            'total' => $total
        ];
    }

    private function getLotSnapshot($lotModel, $loteId) {
        $lot = $lotModel->getLotById((int)$loteId);
        if (!$lot) {
            throw new Exception("Lote no encontrado para snapshot: {$loteId}.");
        }

        return [
            'numero_lote' => isset($lot['numero_lote']) && $lot['numero_lote'] !== '' ? (string)$lot['numero_lote'] : null,
            'costo_unitario' => isset($lot['costo_unitario']) ? (float)$lot['costo_unitario'] : 0
        ];
    }

    public function quoteItems($items) {
        include_once __DIR__ . '/ProductLot.php';
        $lotModel = new ProductLot($this->conn);
        $sale = $this->buildSaleLines($items, $lotModel);
        return [
            "total" => $sale['total'],
            "lines" => $sale['lines']
        ];
    }

    /**
     * Obtiene el historial de facturas con paginación.
     * Incluye el nombre del cliente asociado.
     * 
     * @param int $limit Cantidad de registros por página.
     * @param int $offset Desplazamiento de registros.
     * @return PDOStatement Resultado de la consulta.
     */
    public function read($limit = 10, $offset = 0, $usuario_id = null) {
        $query = "SELECT f.id_factura, f.numero_factura, f.fecha, f.total, f.metodo_pago, f.estado, c.nombre as cliente_nombre 
                  FROM " . $this->table_name . " f 
                  LEFT JOIN clientes c ON f.cliente_id = c.id_cliente";

        if (!empty($usuario_id)) {
            $query .= " WHERE f.usuario_id = :usuario_id";
        }

        $query .= " 
                  ORDER BY f.fecha DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        if (!empty($usuario_id)) {
            $stmt->bindValue(':usuario_id', (int)$usuario_id, PDO::PARAM_INT);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Cuenta el total de facturas registradas en el sistema.
     * 
     * @return int Número total de facturas.
     */
    public function count($usuario_id = null) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " f";
        if (!empty($usuario_id)) {
            $query .= " WHERE f.usuario_id = :usuario_id";
        }
        $stmt = $this->conn->prepare($query);
        if (!empty($usuario_id)) {
            $stmt->bindValue(':usuario_id', (int)$usuario_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    /**
     * Obtiene una factura completa incluyendo sus detalles (productos).
     * Carga tanto la cabecera como los ítems asociados.
     * 
     * @return boolean True si la factura existe y se cargó correctamente.
     */
    public function readOne() {
        // 1. Obtener cabecera
        $query = "SELECT f.*, 
                         c.nombre as cliente_nombre, 
                         c.documento as cliente_documento,
                         c.direccion as cliente_direccion,
                         c.telefono as cliente_telefono,
                         c.email as cliente_email,
                         u.nombre as usuario_nombre
                  FROM " . $this->table_name . " f
                  LEFT JOIN clientes c ON f.cliente_id = c.id_cliente
                  LEFT JOIN usuarios u ON f.usuario_id = u.id_usuario
                  WHERE f.id_factura = ? LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_factura);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->numero_factura = $row['numero_factura'];
            $this->fecha = $row['fecha'];
            $this->cliente_id = $row['cliente_id'];
            $this->usuario_id = $row['usuario_id'];
            $this->sesion_id = $row['sesion_id'] ?? null;
            $this->total = $row['total'];
            $this->monto_recibido = $row['monto_recibido'] ?? 0;
            $this->metodo_pago = $row['metodo_pago'];
            $this->observaciones = $row['observaciones'];
            $this->estado = $row['estado']; // Cargar estado
            $this->cliente_nombre = $row['cliente_nombre'];
            $this->cliente_documento = $row['cliente_documento'];
            $this->cliente_direccion = $row['cliente_direccion'];
            $this->cliente_telefono = $row['cliente_telefono'];
            $this->cliente_email = $row['cliente_email'];
            $this->usuario_nombre = $row['usuario_nombre'];

            // 2. Obtener detalles
            $query_det = "SELECT d.*, p.nombre as producto_nombre, p.imagen as producto_imagen,
                                 COALESCE(d.lote_numero_snapshot, l.numero_lote) as lote_numero
                          FROM detalle_factura d
                          LEFT JOIN productos p ON d.producto_id = p.id_producto
                          LEFT JOIN lotes_producto l ON d.lote_id = l.id_lote
                          WHERE d.factura_id = ?";
            $stmt_det = $this->conn->prepare($query_det);
            $stmt_det->bindParam(1, $this->id_factura);
            $stmt_det->execute();
            
            // Limpiar detalles anteriores
            $this->detalles = [];
            while ($row_det = $stmt_det->fetch(PDO::FETCH_ASSOC)) {
                array_push($this->detalles, $row_det);
            }
            return true;
        }
        return false;
    }

    /**
     * Anula una factura y revierte el stock.
     * 
     * @return boolean True si la anulación fue exitosa.
     * @throws Exception Si la factura ya está anulada o falla la transacción.
     */
    public function annul() {
        if ($this->estado === 'anulada') {
            throw new Exception("La factura ya se encuentra anulada.");
        }

        try {
            include_once __DIR__ . '/ProductLot.php';
            $lotModel = new ProductLot($this->conn);

            $this->conn->beginTransaction();

            // 1. Actualizar estado de la factura
            $query = "UPDATE " . $this->table_name . " SET estado = 'anulada' WHERE id_factura = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id_factura);
            if (!$stmt->execute()) {
                throw new Exception("Error al actualizar estado de factura.");
            }

            // 2. Revertir stock y registrar movimientos
            foreach ($this->detalles as $detalle) {
                $producto_id = $detalle['producto_id'];
                $cantidad = $detalle['cantidad'];
                $lote_id = isset($detalle['lote_id']) ? $detalle['lote_id'] : null;

                // a. Devolver stock
                $queryStock = "UPDATE productos SET stock_actual = stock_actual + :cantidad WHERE id_producto = :id";
                $stmtStock = $this->conn->prepare($queryStock);
                $stmtStock->bindParam(':cantidad', $cantidad);
                $stmtStock->bindParam(':id', $producto_id);
                if (!$stmtStock->execute()) {
                    throw new Exception("Error al revertir stock del producto ID: " . $producto_id);
                }

                if (!empty($lote_id)) {
                    $lotModel->restoreLot((int)$lote_id, (int)$cantidad);
                }

                // b. Registrar movimiento de entrada (devolución)
                // Instanciamos InventoryMovement o hacemos query directa. 
                // Para mantener consistencia, query directa es más rápida aquí o instanciamos si está disponible.
                // Usaremos query directa para evitar dependencia circular o sobrecarga, 
                // pero lo ideal es reutilizar. Como estamos dentro de una transacción manual, 
                // InventoryMovement debería usar la misma conexión.
                
                $lotSnapshot = !empty($lote_id) ? $this->getLotSnapshot($lotModel, (int)$lote_id) : ['numero_lote' => null];
                $queryMov = "INSERT INTO movimientos_inventario 
                             (tipo, producto_id, lote_id, numero_lote_snapshot, cantidad, descripcion, referencia, fecha) 
                             VALUES ('entrada', :pid, :lid, :lot_num, :cant, :desc, :ref, NOW())";
                $stmtMov = $this->conn->prepare($queryMov);
                $tipo = 'entrada';
                $desc = "Anulación Factura " . $this->numero_factura;
                $ref = "ANULACION";
                
                $stmtMov->bindParam(':pid', $producto_id);
                $stmtMov->bindValue(':lid', !empty($lote_id) ? (int)$lote_id : null, !empty($lote_id) ? PDO::PARAM_INT : PDO::PARAM_NULL);
                $stmtMov->bindValue(':lot_num', $lotSnapshot['numero_lote'] ?? null, ($lotSnapshot['numero_lote'] ?? null) !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
                $stmtMov->bindParam(':cant', $cantidad);
                $stmtMov->bindParam(':desc', $desc);
                $stmtMov->bindParam(':ref', $ref);
                
                if (!$stmtMov->execute()) {
                     throw new Exception("Error al registrar movimiento de inventario.");
                }
            }

            $this->conn->commit();
            $this->estado = 'anulada';
            return true;

        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }


    /**
     * Crea una nueva factura de venta.
     * Realiza múltiples operaciones en una transacción:
     * 1. Inserta la cabecera de la factura.
     * 2. Inserta los detalles (productos vendidos).
     * 3. Descuenta el stock de los productos.
     * 4. Registra los movimientos de inventario (salida).
     * 
     * @return boolean True si la transacción se completó exitosamente.
     * @throws Exception Si ocurre algún error durante el proceso (capturado internamente).
     */
    public function create() {
        try {
            $this->last_error = null;
            include_once __DIR__ . '/ProductLot.php';
            $lotModel = new ProductLot($this->conn);

            // Iniciar transacción
            $this->conn->beginTransaction();

            // 1. Generar número de factura (simple por ahora: timestamp)
            $this->numero_factura = 'FAC-' . time();

            $sale = $this->buildSaleLines($this->items, $lotModel);
            $this->total = (float)$sale['total'];

            // 2. Insertar Factura
            $query = "INSERT INTO " . $this->table_name . " 
                      SET numero_factura=:numero_factura, 
                          cliente_id=:cliente_id, 
                          usuario_id=:usuario_id,
                          sesion_id=:sesion_id,
                          total=:total, 
                          metodo_pago=:metodo_pago, 
                          observaciones=:observaciones";
            
            $stmt = $this->conn->prepare($query);
            
            // Saneamiento de datos
            $this->observaciones = htmlspecialchars(strip_tags($this->observaciones ?? ''));
            
            // Asegurar que cliente_id sea NULL si está vacío
            if (empty($this->cliente_id)) {
                $this->cliente_id = null;
            }
            
            // Vincular parámetros
            $stmt->bindParam(":numero_factura", $this->numero_factura);
            $stmt->bindParam(":cliente_id", $this->cliente_id);
            $stmt->bindParam(":usuario_id", $this->usuario_id);
            $stmt->bindParam(":sesion_id", $this->sesion_id);
            $stmt->bindParam(":total", $this->total);
            $stmt->bindParam(":metodo_pago", $this->metodo_pago);
            $stmt->bindParam(":observaciones", $this->observaciones);

            if (!$stmt->execute()) {
                throw new Exception("Error al crear la factura encabezado.");
            }

            $this->id_factura = $this->conn->lastInsertId();

            // 3. Preparar consultas para Detalles y Movimientos (fuera del loop para optimizar)
            // a. Insertar Detalle
            $query_detail = "INSERT INTO detalle_factura 
                             SET factura_id=:factura_id, 
                                 producto_id=:producto_id, 
                                 lote_id=:lote_id,
                                 lote_numero_snapshot=:lote_numero_snapshot,
                                 costo_unitario_snapshot=:costo_unitario_snapshot,
                                 cantidad=:cantidad, 
                                 precio_unitario=:precio_unitario, 
                                 subtotal=:subtotal";
            $stmt_detail = $this->conn->prepare($query_detail);

            // b. Descontar Stock
            $query_stock = "UPDATE productos 
                            SET stock_actual = stock_actual - :cantidad 
                            WHERE id_producto = :producto_id
                              AND stock_actual >= :cantidad_check";
            $stmt_stock = $this->conn->prepare($query_stock);

            // c. Registrar Movimiento de Salida
            $query_mov = "INSERT INTO movimientos_inventario 
                          SET tipo='salida', producto_id=:producto_id, lote_id=:lote_id,
                              numero_lote_snapshot=:numero_lote_snapshot,
                              cantidad=:cantidad, descripcion=:descripcion, 
                              referencia=:referencia";
            $stmt_mov = $this->conn->prepare($query_mov);

            // 4. Procesar Items
            // Variables para vinculación
            $d_factura_id = $this->id_factura;
            $d_producto_id = 0;
            $d_lote_id = null;
            $d_lote_numero_snapshot = null;
            $d_costo_unitario_snapshot = 0;
            $d_cantidad = 0;
            $d_precio = 0;
            $d_subtotal = 0;
            
            // Vincular Detalle
            $stmt_detail->bindParam(":factura_id", $d_factura_id);
            $stmt_detail->bindParam(":producto_id", $d_producto_id);
            $stmt_detail->bindParam(":lote_id", $d_lote_id);
            $stmt_detail->bindParam(":lote_numero_snapshot", $d_lote_numero_snapshot);
            $stmt_detail->bindParam(":costo_unitario_snapshot", $d_costo_unitario_snapshot);
            $stmt_detail->bindParam(":cantidad", $d_cantidad);
            $stmt_detail->bindParam(":precio_unitario", $d_precio);
            $stmt_detail->bindParam(":subtotal", $d_subtotal);

            // Vincular Stock
            $s_cantidad = 0;
            $s_producto_id = 0;
            $stmt_stock->bindParam(":cantidad", $s_cantidad);
            $stmt_stock->bindParam(":cantidad_check", $s_cantidad);
            $stmt_stock->bindParam(":producto_id", $s_producto_id);

            // Vincular Movimiento
            $m_producto_id = 0;
            $m_lote_id = null;
            $m_numero_lote_snapshot = null;
            $m_cantidad = 0;
            $m_descripcion = "Venta Factura " . $this->numero_factura;
            $m_referencia = $this->numero_factura;

            $stmt_mov->bindParam(":producto_id", $m_producto_id);
            $stmt_mov->bindParam(":lote_id", $m_lote_id);
            $stmt_mov->bindParam(":numero_lote_snapshot", $m_numero_lote_snapshot);
            $stmt_mov->bindParam(":cantidad", $m_cantidad);
            $stmt_mov->bindParam(":descripcion", $m_descripcion);
            $stmt_mov->bindParam(":referencia", $m_referencia);

            foreach ($sale['lines'] as $line) {
                $d_producto_id = (int)$line['producto_id'];
                $d_lote_id = (int)$line['lote_id'];
                $lotSnapshot = $this->getLotSnapshot($lotModel, $d_lote_id);
                $d_lote_numero_snapshot = $lotSnapshot['numero_lote'];
                $d_costo_unitario_snapshot = (float)$lotSnapshot['costo_unitario'];
                $d_cantidad = (int)$line['cantidad'];
                $d_precio = (float)$line['precio_unitario'];
                $d_subtotal = (float)$line['subtotal'];

                $s_cantidad = (int)$line['cantidad'];
                $s_producto_id = (int)$line['producto_id'];

                $m_producto_id = (int)$line['producto_id'];
                $m_lote_id = (int)$line['lote_id'];
                $m_numero_lote_snapshot = $lotSnapshot['numero_lote'];
                $m_cantidad = (int)$line['cantidad'];

                if (!$stmt_detail->execute()) {
                    throw new Exception("Error al insertar detalle del producto ID: " . $d_producto_id);
                }

                $lotModel->consumeLot($m_lote_id, $m_cantidad);

                if (!$stmt_stock->execute()) {
                    throw new Exception("Error al actualizar stock del producto ID: " . $d_producto_id);
                }
                if ($stmt_stock->rowCount() < 1) {
                    throw new Exception("Stock insuficiente para el producto ID: " . $d_producto_id);
                }

                if (!$stmt_mov->execute()) {
                    throw new Exception("Error al registrar movimiento de inventario.");
                }
            }

            // Confirmar transacción
            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            // Revertir cambios si algo falla
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            $this->last_error = $e->getMessage();
            error_log($e->getMessage()); // Registrar error
            return false;
        }
    }
}
?>
