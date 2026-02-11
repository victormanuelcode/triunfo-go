<?php
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

    // Registrar un movimiento
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET tipo = :tipo,
                      producto_id = :producto_id,
                      cantidad = :cantidad,
                      descripcion = :descripcion,
                      referencia = :referencia";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        $this->referencia = htmlspecialchars(strip_tags($this->referencia));

        // Bind
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

    // Obtener historial completo
    public function getAll() {
        $query = "SELECT m.*, p.nombre as producto_nombre, p.codigo_barras 
                  FROM " . $this->table_name . " m
                  LEFT JOIN productos p ON m.producto_id = p.id_producto
                  ORDER BY m.fecha DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Obtener historial por producto
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