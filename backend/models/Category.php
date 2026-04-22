<?php
/**
 * Clase Category
 * 
 * Gestiona las categorías de productos, permitiendo organizar el inventario
 * de manera lógica.
 */
class Category {
    private $conn;
    private $table_name = "categorias";

    public $id_categoria;
    public $nombre;
    public $descripcion;
    public $creado_en;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene todas las categorías ordenadas alfabéticamente.
     * 
     * @return PDOStatement Resultado de la consulta.
     */
    public function read() {
        $query = "SELECT id_categoria, nombre, descripcion, creado_en FROM " . $this->table_name . " ORDER BY nombre ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Crea una nueva categoría.
     * 
     * @return boolean True si la creación fue exitosa.
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET nombre=:nombre, descripcion=:descripcion";
        $stmt = $this->conn->prepare($query);

        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":descripcion", $this->descripcion);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Leer una categoría individual
    public function readOne() {
        $query = "SELECT id_categoria, nombre, descripcion, creado_en FROM " . $this->table_name . " WHERE id_categoria = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_categoria);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->nombre = $row['nombre'];
            $this->descripcion = $row['descripcion'];
            $this->creado_en = $row['creado_en'];
            return true;
        }
        return false;
    }

    /**
     * Actualiza la información de una categoría existente.
     * 
     * @return boolean True si la actualización fue exitosa.
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . " SET nombre=:nombre, descripcion=:descripcion WHERE id_categoria=:id_categoria";
        $stmt = $this->conn->prepare($query);

        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        $this->id_categoria = htmlspecialchars(strip_tags($this->id_categoria));

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":descripcion", $this->descripcion);
        $stmt->bindParam(":id_categoria", $this->id_categoria);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Eliminar categoría
    public function delete() {
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE id_categoria = ?";
            $stmt = $this->conn->prepare($query);
            
            $this->id_categoria = htmlspecialchars(strip_tags($this->id_categoria));
            $stmt->bindParam(1, $this->id_categoria);

            if ($stmt->execute()) {
                return true;
            }
            return false;
        } catch (PDOException $e) {
            // Error por restricción de llave foránea (tiene productos asociados)
            return false;
        }
    }
}
?>
