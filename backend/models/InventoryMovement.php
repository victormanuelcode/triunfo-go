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
        $stmt->bindParam(":cantidad", $this->cantidad);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":referencia", $this->referencia);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Obtiene el historial completo de movimientos de inventario.
     * 
     * @return PDOStatement Resultado de la consulta con todos los movimientos ordenados por fecha.
     */
    public function getAll() {
        $query = "SELECT m.*, p.nombre as producto_nombre 
                  FROM " . $this->table_name . " m
                  LEFT JOIN productos p ON m.producto_id = p.id_producto
                  ORDER BY m.fecha DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
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
}
?>