<?php
/**
 * Clase Product
 * 
 * Gestiona el catálogo de productos, incluyendo inventario, precios,
 * relaciones con categorías, proveedores y movimientos automáticos de stock.
 */
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
    public $tipo_venta;
    public $unidad_base;
    public $fraccion_minima;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene una lista paginada de productos activos.
     * Incluye información de categorías y proveedores.
     * 
     * @param int $limit Límite de resultados por página.
     * @param int $offset Desplazamiento para paginación.
     * @return PDOStatement Resultado de la consulta.
     */
    public function read($limit = 10, $offset = 0) {
        $query = "SELECT p.*, c.nombre as categoria_nombre, pr.nombre as proveedor_nombre, pp.proveedor_id
                  FROM " . $this->table_name . " p
                  LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
                  LEFT JOIN proveedor_producto pp ON p.id_producto = pp.producto_id
                  LEFT JOIN proveedores pr ON pp.proveedor_id = pr.id_proveedor
                  WHERE p.estado = 'activo'
                  GROUP BY p.id_producto
                  ORDER BY p.creado_en DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Cuenta el total de productos activos en el sistema.
     * 
     * @return int Número total de productos.
     */
    public function count() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE estado = 'activo'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    /**
     * Crea un nuevo producto y registra su stock inicial si es mayor a cero.
     * También asocia el producto a un proveedor si se especifica.
     * 
     * @return boolean True si el producto se creó correctamente.
     */
    public function create() {
        $stockInicial = (float)($this->stock_actual ?? 0);
        $query = "INSERT INTO " . $this->table_name . " 
                  SET nombre=:nombre, descripcion=:descripcion, categoria_id=:categoria_id, 
                      unidad_medida_id=:unidad_medida_id, tipo_venta=:tipo_venta, unidad_base=:unidad_base, fraccion_minima=:fraccion_minima,
                      precio_compra=:precio_compra, 
                      precio_venta=:precio_venta, stock_actual=0, 
                      stock_minimo=:stock_minimo, imagen=:imagen, estado=:estado";
        
        $stmt = $this->conn->prepare($query);

        // Sanitización básica
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        $this->estado = htmlspecialchars(strip_tags($this->estado));
        $this->tipo_venta = ($this->tipo_venta === 'peso') ? 'peso' : 'unidad';
        $this->unidad_base = $this->unidad_base ? (string)$this->unidad_base : ($this->tipo_venta === 'peso' ? 'kg' : 'unidad');
        $this->fraccion_minima = max((float)($this->fraccion_minima ?? ($this->tipo_venta === 'peso' ? 0.001 : 1)), $this->tipo_venta === 'peso' ? 0.001 : 1);
        // Los numéricos se manejan directamente

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":categoria_id", $this->categoria_id);
        $stmt->bindParam(":unidad_medida_id", $this->unidad_medida_id);
        $stmt->bindParam(":tipo_venta", $this->tipo_venta);
        $stmt->bindParam(":unidad_base", $this->unidad_base);
        $stmt->bindParam(":fraccion_minima", $this->fraccion_minima);
        $stmt->bindParam(":precio_compra", $this->precio_compra);
        $stmt->bindParam(":precio_venta", $this->precio_venta);
        $stmt->bindParam(":stock_minimo", $this->stock_minimo);
        $stmt->bindParam(":imagen", $this->imagen);
        $stmt->bindParam(":estado", $this->estado);

        $this->conn->beginTransaction();
        try {
            if (!$stmt->execute()) {
                $this->conn->rollBack();
                return false;
            }

            $this->id_producto = $this->conn->lastInsertId();

            // Guardar proveedor si existe
            if (!empty($this->proveedor_id)) {
                $query_prov = "INSERT INTO proveedor_producto (proveedor_id, producto_id) VALUES (:proveedor_id, :producto_id)";
                $stmt_prov = $this->conn->prepare($query_prov);
                $stmt_prov->bindParam(":proveedor_id", $this->proveedor_id);
                $stmt_prov->bindParam(":producto_id", $this->id_producto);
                $stmt_prov->execute();
            }

            if ($stockInicial > 0) {
                include_once __DIR__ . '/ProductLot.php';
                $lotModel = new ProductLot($this->conn);
                $lotModel->createLot(
                    $this->id_producto,
                    $stockInicial,
                    (float)$this->precio_venta,
                    (float)$this->precio_compra,
                    !empty($this->proveedor_id) ? (int)$this->proveedor_id : null,
                    null
                );
            }

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
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
            $this->tipo_venta = $row['tipo_venta'] ?? 'unidad';
            $this->unidad_base = $row['unidad_base'] ?? ($this->tipo_venta === 'peso' ? 'kg' : 'unidad');
            $this->fraccion_minima = isset($row['fraccion_minima']) ? (float)$row['fraccion_minima'] : ($this->tipo_venta === 'peso' ? 0.001 : 1);
            return true;
        }
        return false;
    }

    // Actualizar producto
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET nombre=:nombre, descripcion=:descripcion, categoria_id=:categoria_id, 
                      unidad_medida_id=:unidad_medida_id, tipo_venta=:tipo_venta, unidad_base=:unidad_base, fraccion_minima=:fraccion_minima,
                      precio_compra=:precio_compra, 
                      precio_venta=:precio_venta, stock_minimo=:stock_minimo, imagen=:imagen, estado=:estado
                  WHERE id_producto=:id_producto";
        
        $stmt = $this->conn->prepare($query);

        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        $this->estado = htmlspecialchars(strip_tags($this->estado));
        $this->id_producto = htmlspecialchars(strip_tags($this->id_producto));
        $this->tipo_venta = ($this->tipo_venta === 'peso') ? 'peso' : 'unidad';
        $this->unidad_base = $this->unidad_base ? (string)$this->unidad_base : ($this->tipo_venta === 'peso' ? 'kg' : 'unidad');
        $this->fraccion_minima = max((float)($this->fraccion_minima ?? ($this->tipo_venta === 'peso' ? 0.001 : 1)), $this->tipo_venta === 'peso' ? 0.001 : 1);

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":categoria_id", $this->categoria_id);
        $stmt->bindParam(":unidad_medida_id", $this->unidad_medida_id);
        $stmt->bindParam(":tipo_venta", $this->tipo_venta);
        $stmt->bindParam(":unidad_base", $this->unidad_base);
        $stmt->bindParam(":fraccion_minima", $this->fraccion_minima);
        $stmt->bindParam(":precio_compra", $this->precio_compra);
        $stmt->bindParam(":precio_venta", $this->precio_venta);
        // $stmt->bindParam(":stock_actual", $this->stock_actual); // Eliminado para evitar sobreescritura accidental
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

    /**
     * Realiza un borrado lógico (soft delete) del producto cambiando su estado a inactivo.
     * Si hay stock remanente, registra una salida por baja.
     * 
     * @return boolean True si la operación fue exitosa.
     */
    public function delete() {
        $query = "UPDATE " . $this->table_name . " SET estado = 'inactivo' WHERE id_producto = :id";
        $stmt = $this->conn->prepare($query);
        $this->id_producto = htmlspecialchars(strip_tags($this->id_producto));
        $stmt->bindParam(":id", $this->id_producto);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Actualiza el stock de un producto de manera atómica.
     * 
     * @param float $cantidad Cantidad a ajustar (positiva).
     * @param string $tipo 'entrada' (suma) o 'salida' (resta).
     * @return boolean True si se actualizó correctamente.
     */
    public function updateStock($cantidad, $tipo) {
        $cantidad = (float)$cantidad;
        if ($cantidad <= 0) return false;
        if ($tipo === 'entrada') {
            $query = "UPDATE " . $this->table_name . " SET stock_actual = stock_actual + :cantidad WHERE id_producto = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":cantidad", $cantidad);
            $stmt->bindParam(":id", $this->id_producto);
        } elseif ($tipo === 'salida') {
            // Usamos nombres distintos para evitar error de parámetros duplicados en algunos drivers PDO
            $query = "UPDATE " . $this->table_name . " SET stock_actual = stock_actual - :cantidad WHERE id_producto = :id AND stock_actual >= :cantidad_check";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":cantidad", $cantidad);
            $stmt->bindParam(":cantidad_check", $cantidad);
            $stmt->bindParam(":id", $this->id_producto);
        } else {
            return false;
        }

        if ($stmt->execute()) {
            return $stmt->rowCount() > 0; // Verificar que realmente se actualizó
        }
        return false;
    }
}
