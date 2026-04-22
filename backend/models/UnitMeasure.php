<?php
/**
 * Clase UnitMeasure
 * 
 * Gestiona las unidades de medida utilizadas para cuantificar los productos
 * (ej. Kilogramo, Litro, Unidad, Caja).
 */
class UnitMeasure {
    private $conn;
    private $table_name = "unidades_medida";

    public $id_unidad;
    public $nombre;
    public $abreviatura;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene todas las unidades de medida ordenadas alfabéticamente.
     * 
     * @return PDOStatement Resultado de la consulta.
     */
    public function read() {
        $query = "SELECT id_unidad, nombre, abreviatura FROM " . $this->table_name . " ORDER BY nombre ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Crea una nueva unidad de medida.
     * 
     * @return boolean True si la creación fue exitosa.
     */
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

    /**
     * Obtiene los datos de una unidad de medida específica por su ID.
     * 
     * @return boolean True si la unidad existe.
     */
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

    /**
     * Elimina una unidad de medida.
     * 
     * @return boolean True si la eliminación fue exitosa, False si falla (ej. restricción de FK).
     */
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