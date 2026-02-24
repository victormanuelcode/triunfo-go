<?php
class Company {
    private $conn;
    private $table_name = "empresa";

    public $id_empresa;
    public $nombre;
    public $nit;
    public $direccion;
    public $telefono;
    public $logo;
    public $lema;
    public $usuario_id;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener la configuración de la empresa (asumimos que solo hay 1 registro)
    public function get() {
        $query = "SELECT * FROM " . $this->table_name . " LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Crear o actualizar la configuración
    public function save() {
        // Verificar si ya existe un registro
        $queryCheck = "SELECT id_empresa FROM " . $this->table_name . " LIMIT 0,1";
        $stmtCheck = $this->conn->prepare($queryCheck);
        $stmtCheck->execute();

        if ($stmtCheck->rowCount() > 0) {
            // Actualizar
            $row = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            $this->id_empresa = $row['id_empresa'];

            $query = "UPDATE " . $this->table_name . "
                      SET nombre = :nombre,
                          nit = :nit,
                          direccion = :direccion,
                          telefono = :telefono,
                          lema = :lema
                      WHERE id_empresa = :id_empresa";
            
            // Si se sube logo, actualizarlo también
            if (!empty($this->logo)) {
                $query = "UPDATE " . $this->table_name . "
                          SET nombre = :nombre,
                              nit = :nit,
                              direccion = :direccion,
                              telefono = :telefono,
                              lema = :lema,
                              logo = :logo
                          WHERE id_empresa = :id_empresa";
            }
        } else {
            // Insertar
            $query = "INSERT INTO " . $this->table_name . "
                      SET nombre = :nombre,
                          nit = :nit,
                          direccion = :direccion,
                          telefono = :telefono,
                          lema = :lema";
            
            if (!empty($this->logo)) {
                $query .= ", logo = :logo";
            }
        }

        $stmt = $this->conn->prepare($query);

        // Saneamiento de datos
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->nit = htmlspecialchars(strip_tags($this->nit));
        $this->direccion = htmlspecialchars(strip_tags($this->direccion));
        $this->telefono = htmlspecialchars(strip_tags($this->telefono));
        $this->lema = htmlspecialchars(strip_tags($this->lema));

        // Vincular parámetros
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":nit", $this->nit);
        $stmt->bindParam(":direccion", $this->direccion);
        $stmt->bindParam(":telefono", $this->telefono);
        $stmt->bindParam(":lema", $this->lema);

        if ($stmtCheck->rowCount() > 0) {
             $stmt->bindParam(":id_empresa", $this->id_empresa);
        }

        if (!empty($this->logo)) {
            $this->logo = htmlspecialchars(strip_tags($this->logo));
            $stmt->bindParam(":logo", $this->logo);
        }

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>