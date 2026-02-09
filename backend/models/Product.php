<?php
class Product {
    private $conn;
    private $table_name = "productos";

    public $id_producto;
    public $nombre;
    public $descripcion;
    public $categoria_id;
    public $unidad_medida_id;
    public $precio_compra;
    public $precio_venta;
    public $stock_actual;
    public $stock_minimo;
    public $imagen;
    public $estado;
    public $creado_en;
    public $actualizado_en;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Leer productos
    public function read() {
        $query = "SELECT p.*, c.nombre as categoria_nombre 
                  FROM " . $this->table_name . " p
                  LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
                  ORDER BY p.creado_en DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Crear producto
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET nombre=:nombre, descripcion=:descripcion, categoria_id=:categoria_id, 
                      unidad_medida_id=:unidad_medida_id, precio_compra=:precio_compra, 
                      precio_venta=:precio_venta, stock_actual=:stock_actual, 
                      stock_minimo=:stock_minimo, imagen=:imagen, estado=:estado";
        
        $stmt = $this->conn->prepare($query);

        // Sanitización básica
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        $this->estado = htmlspecialchars(strip_tags($this->estado));
        // Los numéricos se manejan directamente

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":categoria_id", $this->categoria_id);
        $stmt->bindParam(":unidad_medida_id", $this->unidad_medida_id);
        $stmt->bindParam(":precio_compra", $this->precio_compra);
        $stmt->bindParam(":precio_venta", $this->precio_venta);
        $stmt->bindParam(":stock_actual", $this->stock_actual);
        $stmt->bindParam(":stock_minimo", $this->stock_minimo);
        $stmt->bindParam(":imagen", $this->imagen);
        $stmt->bindParam(":estado", $this->estado);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Leer un producto
    public function readOne() {
        $query = "SELECT p.*, c.nombre as categoria_nombre 
                  FROM " . $this->table_name . " p
                  LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
                  WHERE p.id_producto = ? LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_producto);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->nombre = $row['nombre'];
            $this->descripcion = $row['descripcion'];
            $this->categoria_id = $row['categoria_id'];
            $this->unidad_medida_id = $row['unidad_medida_id'];
            $this->precio_compra = $row['precio_compra'];
            $this->precio_venta = $row['precio_venta'];
            $this->stock_actual = $row['stock_actual'];
            $this->stock_minimo = $row['stock_minimo'];
            $this->imagen = $row['imagen'];
            $this->estado = $row['estado'];
            $this->creado_en = $row['creado_en'];
            return true;
        }
        return false;
    }

    // Actualizar producto
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET nombre=:nombre, descripcion=:descripcion, categoria_id=:categoria_id, 
                      unidad_medida_id=:unidad_medida_id, precio_compra=:precio_compra, 
                      precio_venta=:precio_venta, stock_actual=:stock_actual, 
                      stock_minimo=:stock_minimo, imagen=:imagen, estado=:estado
                  WHERE id_producto=:id_producto";
        
        $stmt = $this->conn->prepare($query);

        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        $this->estado = htmlspecialchars(strip_tags($this->estado));
        $this->id_producto = htmlspecialchars(strip_tags($this->id_producto));

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":categoria_id", $this->categoria_id);
        $stmt->bindParam(":unidad_medida_id", $this->unidad_medida_id);
        $stmt->bindParam(":precio_compra", $this->precio_compra);
        $stmt->bindParam(":precio_venta", $this->precio_venta);
        $stmt->bindParam(":stock_actual", $this->stock_actual);
        $stmt->bindParam(":stock_minimo", $this->stock_minimo);
        $stmt->bindParam(":imagen", $this->imagen);
        $stmt->bindParam(":estado", $this->estado);
        $stmt->bindParam(":id_producto", $this->id_producto);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Eliminar producto
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id_producto = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_producto);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
