<?php
class Supplier {
    private $conn;
    private $table_name = "proveedores";

    public $id_proveedor;
    public $nombre;
    public $nit;
    public $telefono;
    public $direccion;
    public $email;
    public $creado_en;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene todos los proveedores ordenados alfabéticamente.
     * 
     * @return PDOStatement Resultado de la consulta.
     */
    public function read() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY nombre ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Obtiene los datos de un proveedor específico por su ID.
     * 
     * @return boolean True si el proveedor existe.
     */
    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id_proveedor = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_proveedor);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->nombre = $row['nombre'];
            $this->nit = $row['nit'];
            $this->telefono = $row['telefono'];
            $this->direccion = $row['direccion'];
            $this->email = $row['email'];
            $this->creado_en = $row['creado_en'];
            return true;
        }
        return false;
    }

    /**
     * Crea un nuevo proveedor.
     * 
     * @return boolean True si la creación fue exitosa.
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET nombre=:nombre, nit=:nit, telefono=:telefono, direccion=:direccion, email=:email";

        $stmt = $this->conn->prepare($query);

        // Saneamiento de datos
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->nit = htmlspecialchars(strip_tags($this->nit));
        $this->telefono = htmlspecialchars(strip_tags($this->telefono));
        $this->direccion = htmlspecialchars(strip_tags($this->direccion));
        $this->email = htmlspecialchars(strip_tags($this->email));

        // Vincular parámetros
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":nit", $this->nit);
        $stmt->bindParam(":telefono", $this->telefono);
        $stmt->bindParam(":direccion", $this->direccion);
        $stmt->bindParam(":email", $this->email);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Actualiza la información de un proveedor existente.
     * 
     * @return boolean True si la actualización fue exitosa.
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET nombre = :nombre,
                      nit = :nit,
                      telefono = :telefono,
                      direccion = :direccion,
                      email = :email
                  WHERE id_proveedor = :id_proveedor";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->nit = htmlspecialchars(strip_tags($this->nit));
        $this->telefono = htmlspecialchars(strip_tags($this->telefono));
        $this->direccion = htmlspecialchars(strip_tags($this->direccion));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->id_proveedor = htmlspecialchars(strip_tags($this->id_proveedor));

        // Vincular parámetros
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":nit", $this->nit);
        $stmt->bindParam(":telefono", $this->telefono);
        $stmt->bindParam(":direccion", $this->direccion);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":id_proveedor", $this->id_proveedor);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Elimina un proveedor.
     * 
     * @return boolean True si la eliminación fue exitosa.
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id_proveedor = ?";
        $stmt = $this->conn->prepare($query);
        $this->id_proveedor = htmlspecialchars(strip_tags($this->id_proveedor));
        $stmt->bindParam(1, $this->id_proveedor);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>