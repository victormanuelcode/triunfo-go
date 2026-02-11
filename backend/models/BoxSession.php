<?php
class BoxSession {
    private $conn;
    private $table_name = "caja_sesiones";

    public $id_sesion;
    public $usuario_id;
    public $monto_apertura;
    public $monto_cierre;
    public $fecha_apertura;
    public $fecha_cierre;
    public $estado;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function open() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET usuario_id = :usuario_id,
                      monto_apertura = :monto_apertura,
                      fecha_apertura = NOW(),
                      estado = 'abierta'";

        $stmt = $this->conn->prepare($query);

        $this->usuario_id = htmlspecialchars(strip_tags($this->usuario_id));
        $this->monto_apertura = htmlspecialchars(strip_tags($this->monto_apertura));

        $stmt->bindParam(":usuario_id", $this->usuario_id);
        $stmt->bindParam(":monto_apertura", $this->monto_apertura);

        if ($stmt->execute()) {
            $this->id_sesion = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function close() {
        $query = "UPDATE " . $this->table_name . "
                  SET monto_cierre = :monto_cierre,
                      fecha_cierre = NOW(),
                      estado = 'cerrada'
                  WHERE id_sesion = :id_sesion";

        $stmt = $this->conn->prepare($query);

        $this->monto_cierre = htmlspecialchars(strip_tags($this->monto_cierre));
        $this->id_sesion = htmlspecialchars(strip_tags($this->id_sesion));

        $stmt->bindParam(":monto_cierre", $this->monto_cierre);
        $stmt->bindParam(":id_sesion", $this->id_sesion);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function getCurrentSession($usuario_id) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE usuario_id = :usuario_id AND estado = 'abierta'
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario_id", $usuario_id);
        $stmt->execute();

        return $stmt;
    }

    public function getSummary($sesion_id) {
        // Obtener total vendido en esta sesión
        $query = "SELECT SUM(total) as total_ventas 
                  FROM facturas 
                  WHERE sesion_id = :sesion_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":sesion_id", $sesion_id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
