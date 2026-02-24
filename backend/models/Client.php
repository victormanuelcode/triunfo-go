<?php
class Client {
    private $conn;
    private $table_name = "clientes";

    public $id_cliente;
    public $nombre;
    public $documento;
    public $telefono;
    public $direccion;
    public $email;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY nombre ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id_cliente = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_cliente);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->nombre = $row['nombre'];
            $this->documento = $row['documento'];
            $this->telefono = $row['telefono'];
            $this->direccion = $row['direccion'];
            $this->email = $row['email'];
            return true;
        }
        return false;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET nombre=:nombre, documento=:documento, telefono=:telefono, 
                      direccion=:direccion, email=:email";
        
        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->documento = htmlspecialchars(strip_tags($this->documento));
        $this->telefono = htmlspecialchars(strip_tags($this->telefono));
        $this->direccion = htmlspecialchars(strip_tags($this->direccion));
        $this->email = htmlspecialchars(strip_tags($this->email));

        // Vincular parámetros
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":documento", $this->documento);
        $stmt->bindParam(":telefono", $this->telefono);
        $stmt->bindParam(":direccion", $this->direccion);
        $stmt->bindParam(":email", $this->email);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET nombre=:nombre, documento=:documento, telefono=:telefono, 
                      direccion=:direccion, email=:email 
                  WHERE id_cliente=:id_cliente";
        
        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->documento = htmlspecialchars(strip_tags($this->documento));
        $this->telefono = htmlspecialchars(strip_tags($this->telefono));
        $this->direccion = htmlspecialchars(strip_tags($this->direccion));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->id_cliente = htmlspecialchars(strip_tags($this->id_cliente));

        // Bind
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":documento", $this->documento);
        $stmt->bindParam(":telefono", $this->telefono);
        $stmt->bindParam(":direccion", $this->direccion);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":id_cliente", $this->id_cliente);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        // En lugar de borrar físicamente, verificamos si tiene facturas
        // Si tiene facturas, lo ideal sería un Soft Delete (estado=inactivo), 
        // pero la tabla no tiene campo estado. 
        // Intentaremos borrar y capturaremos error de llave foránea.
        
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE id_cliente = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $this->id_cliente);

            if ($stmt->execute()) {
                return true;
            }
            return false;
        } catch (PDOException $e) {
            // Error 1451: Integridad referencial
            return false;
        }
    }
}
?>
