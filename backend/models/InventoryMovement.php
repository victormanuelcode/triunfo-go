<?php
/**
 * Clase InventoryMovement
 * 
 * Gestiona el registro y consulta de los movimientos de inventario (entradas y salidas),
 * permitiendo la trazabilidad de los cambios en el stock de productos.
 */
class InventoryMovement {
    private $conn;
    private $table_name = "movimientos_inventario";

    public $id_movimiento;
    public $tipo; // 'entrada', 'salida'
    public $producto_id;
    public $lote_id;
    public $cantidad;
    public $fecha;
    public $descripcion;
    public $referencia;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Registra un nuevo movimiento de inventario.
     * 
     * @return boolean True si el registro fue exitoso, False en caso contrario.
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET tipo = :tipo,
                      producto_id = :producto_id,
                      lote_id = :lote_id,
                      cantidad = :cantidad,
                      descripcion = :descripcion,
                      referencia = :referencia";

        $stmt = $this->conn->prepare($query);

        // Saneamiento de datos
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        $this->referencia = htmlspecialchars(strip_tags($this->referencia));

        // Vincular parámetros
        $stmt->bindParam(":tipo", $this->tipo);
        $stmt->bindParam(":producto_id", $this->producto_id);
        $stmt->bindValue(":lote_id", $this->lote_id !== null ? (int)$this->lote_id : null, $this->lote_id !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindParam(":cantidad", $this->cantidad);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":referencia", $this->referencia);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Obtiene el historial de movimientos con filtros opcionales.
     * 
     * @param string $from Fecha inicial (Y-m-d)
     * @param string $to Fecha final (Y-m-d)
     * @param string $type Tipo de movimiento (entrada, salida, todos)
     * @param string $search Término de búsqueda (producto, referencia)
     * @return PDOStatement Resultado de la consulta.
     */
    public function getAll($from = null, $to = null, $type = null, $search = null) {
        $query = "SELECT m.*, p.nombre as producto_nombre, p.imagen as producto_imagen, 
                         c.nombre as categoria_nombre, f.id_factura, l.numero_lote
                  FROM " . $this->table_name . " m
                  LEFT JOIN productos p ON m.producto_id = p.id_producto
                  LEFT JOIN lotes_producto l ON m.lote_id = l.id_lote
                  LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
                  LEFT JOIN facturas f ON m.referencia = f.numero_factura
                  WHERE 1=1";

        if (!empty($from)) {
            $query .= " AND DATE(m.fecha) >= :from";
        }
        if (!empty($to)) {
            $query .= " AND DATE(m.fecha) <= :to";
        }
        if (!empty($type) && $type !== 'todos') {
            $query .= " AND m.tipo = :type";
        }
        if (!empty($search)) {
            $query .= " AND (p.nombre LIKE :search OR m.referencia LIKE :search OR m.descripcion LIKE :search)";
        }
        
        $query .= " ORDER BY m.fecha DESC";
        
        $stmt = $this->conn->prepare($query);

        if (!empty($from)) $stmt->bindParam(":from", $from);
        if (!empty($to)) $stmt->bindParam(":to", $to);
        if (!empty($type) && $type !== 'todos') $stmt->bindParam(":type", $type);
        if (!empty($search)) {
            $searchTerm = "%{$search}%";
            $stmt->bindParam(":search", $searchTerm);
        }

        $stmt->execute();
        return $stmt;
    }

    /**
     * Obtiene estadísticas de movimientos para el mes actual.
     */
    public function getSummaryStats() {
        $currentMonth = date('Y-m');
        
        $stats = [
            'total_movimientos' => 0,
            'entradas_mes' => 0,
            'salidas_mes' => 0,
            'ajustes_mes' => 0
        ];

        // Total histórico
        $queryTotal = "SELECT COUNT(*) as total FROM " . $this->table_name;
        $stmt = $this->conn->prepare($queryTotal);
        $stmt->execute();
        $stats['total_movimientos'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Entradas mes
        $queryIn = "SELECT COUNT(*) as total FROM " . $this->table_name . " 
                   WHERE tipo = 'entrada' AND DATE_FORMAT(fecha, '%Y-%m') = :mes";
        $stmt = $this->conn->prepare($queryIn);
        $stmt->bindParam(':mes', $currentMonth);
        $stmt->execute();
        $stats['entradas_mes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Salidas mes
        $queryOut = "SELECT COUNT(*) as total FROM " . $this->table_name . " 
                    WHERE tipo = 'salida' AND DATE_FORMAT(fecha, '%Y-%m') = :mes";
        $stmt = $this->conn->prepare($queryOut);
        $stmt->bindParam(':mes', $currentMonth);
        $stmt->execute();
        $stats['salidas_mes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Ajustes mes (referencia contiene 'AJUSTE' o 'MANUAL')
        $queryAdj = "SELECT COUNT(*) as total FROM " . $this->table_name . " 
                    WHERE (referencia LIKE '%AJUSTE%' OR referencia LIKE '%MANUAL%') 
                    AND DATE_FORMAT(fecha, '%Y-%m') = :mes";
        $stmt = $this->conn->prepare($queryAdj);
        $stmt->bindParam(':mes', $currentMonth);
        $stmt->execute();
        $stats['ajustes_mes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        return $stats;
    }

    /**
     * Obtiene el historial de movimientos de un producto específico.
     * 
     * @param int $product_id ID del producto.
     * @return PDOStatement Resultado de la consulta filtrada por producto.
     */
    public function getByProduct($product_id) {
        $query = "SELECT m.*, p.nombre as producto_nombre 
                  FROM " . $this->table_name . " m
                  LEFT JOIN productos p ON m.producto_id = p.id_producto
                  WHERE m.producto_id = ?
                  ORDER BY m.fecha DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $product_id);
        $stmt->execute();
        return $stmt;
    }
}?>
