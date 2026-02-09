<?php
class UnitMeasure {
    private $conn;
    private $table_name = "unidades_medida";

    public $id_unidad;
    public $nombre;
    public $abreviatura;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Leer todas las unidades
    public function read() {
        $query = "SELECT id_unidad, nombre, abreviatura FROM " . $this->table_name . " ORDER BY nombre ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Crear unidad
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET nombre=:nombre, abreviatura=:abreviatura";
        $stmt = $this->conn->prepare($query);

        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->abreviatura = htmlspecialchars(strip_tags($this->abreviatura));

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":abreviatura", $this->abreviatura);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Leer una unidad individual
    public function readOne() {
        $query = "SELECT id_unidad, nombre, abreviatura FROM " . $this->table_name . " WHERE id_unidad = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_unidad);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->nombre = $row['nombre'];
            $this->abreviatura = $row['abreviatura'];
            return true;
        }
        return false;
    }

    // Actualizar unidad
    public function update() {
        $query = "UPDATE " . $this->table_name . " SET nombre=:nombre, abreviatura=:abreviatura WHERE id_unidad=:id_unidad";
        $stmt = $this->conn->prepare($query);

        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->abreviatura = htmlspecialchars(strip_tags($this->abreviatura));
        $this->id_unidad = htmlspecialchars(strip_tags($this->id_unidad));

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":abreviatura", $this->abreviatura);
        $stmt->bindParam(":id_unidad", $this->id_unidad);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Eliminar unidad
    public function delete() {
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE id_unidad = ?";
            $stmt = $this->conn->prepare($query);
            
            $this->id_unidad = htmlspecialchars(strip_tags($this->id_unidad));
            $stmt->bindParam(1, $this->id_unidad);

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