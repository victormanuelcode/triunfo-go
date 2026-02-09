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
    public $proveedor_id; // Nuevo campo para proveedor

    public function __construct($db) {
        $this->conn = $db;
    }

    // Leer productos
    public function read() {
        $query = "SELECT p.*, c.nombre as categoria_nombre, pr.nombre as proveedor_nombre, pp.proveedor_id
                  FROM " . $this->table_name . " p
                  LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
                  LEFT JOIN proveedor_producto pp ON p.id_producto = pp.producto_id
                  LEFT JOIN proveedores pr ON pp.proveedor_id = pr.id_proveedor
                  WHERE p.estado = 'activo'
                  GROUP BY p.id_producto
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
            $this->id_producto = $this->conn->lastInsertId();

            // Guardar proveedor si existe
            if (!empty($this->proveedor_id)) {
                $query_prov = "INSERT INTO proveedor_producto (proveedor_id, producto_id) VALUES (:proveedor_id, :producto_id)";
                $stmt_prov = $this->conn->prepare($query_prov);
                $stmt_prov->bindParam(":proveedor_id", $this->proveedor_id);
                $stmt_prov->bindParam(":producto_id", $this->id_producto);
                $stmt_prov->execute();
            }

            // Si hay stock inicial, registrar movimiento
            if ($this->stock_actual > 0) {
                // $this->id_producto ya está seteado arriba
                $query_mov = "INSERT INTO movimientos_inventario 
                              SET tipo='entrada', producto_id=:producto_id, 
                                  cantidad=:cantidad, descripcion='Stock Inicial', 
                                  referencia='CREACION'";
                
                $stmt_mov = $this->conn->prepare($query_mov);
                $stmt_mov->bindParam(":producto_id", $this->id_producto);
                $stmt_mov->bindParam(":cantidad", $this->stock_actual);
                $stmt_mov->execute();
            }
            return true;
        }
        return false;
    }

    // Leer un producto
    public function readOne() {
        $query = "SELECT p.*, c.nombre as categoria_nombre, pp.proveedor_id 
                  FROM " . $this->table_name . " p
                  LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
                  LEFT JOIN proveedor_producto pp ON p.id_producto = pp.producto_id
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
            $this->proveedor_id = $row['proveedor_id']; // Asignar proveedor_id
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
            // Actualizar proveedor
            // Primero eliminamos relación anterior (asumimos 1 proveedor por producto para simplificar edición)
            $del_prov = "DELETE FROM proveedor_producto WHERE producto_id = :producto_id";
            $stmt_del = $this->conn->prepare($del_prov);
            $stmt_del->bindParam(":producto_id", $this->id_producto);
            $stmt_del->execute();

            // Insertamos nuevo si existe
            if (!empty($this->proveedor_id)) {
                $query_prov = "INSERT INTO proveedor_producto (proveedor_id, producto_id) VALUES (:proveedor_id, :producto_id)";
                $stmt_prov = $this->conn->prepare($query_prov);
                $stmt_prov->bindParam(":proveedor_id", $this->proveedor_id);
                $stmt_prov->bindParam(":producto_id", $this->id_producto);
                $stmt_prov->execute();
            }

            return true;
        }
        return false;
    }

    // Eliminar producto (Soft Delete)
    public function delete() {
        // En lugar de borrar, cambiamos el estado a 'inactivo'
        $query = "UPDATE " . $this->table_name . " SET estado = 'inactivo' WHERE id_producto = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_producto);

        if ($stmt->execute()) {
            // Registrar movimiento de salida por baja
            // Primero obtenemos el stock actual para registrar qué se perdió
            $check = "SELECT stock_actual FROM " . $this->table_name . " WHERE id_producto = ?";
            $stmtCheck = $this->conn->prepare($check);
            $stmtCheck->bindParam(1, $this->id_producto);
            $stmtCheck->execute();
            $currentStock = $stmtCheck->fetchColumn();

            if ($currentStock > 0) {
                $query_mov = "INSERT INTO movimientos_inventario 
                              SET tipo='salida', producto_id=:producto_id, 
                                  cantidad=:cantidad, descripcion='Baja de Producto (Eliminado)', 
                                  referencia='BAJA'";
                $stmt_mov = $this->conn->prepare($query_mov);
                $stmt_mov->bindParam(":producto_id", $this->id_producto);
                $stmt_mov->bindParam(":cantidad", $currentStock);
                $stmt_mov->execute();
                
                // Opcional: poner stock a 0
                $zero = 0;
                $updateStock = $this->conn->prepare("UPDATE " . $this->table_name . " SET stock_actual = 0 WHERE id_producto = ?");
                $updateStock->bindParam(1, $this->id_producto);
                $updateStock->execute();
            }

            return true;
        }
        return false;
    }
}
?>
