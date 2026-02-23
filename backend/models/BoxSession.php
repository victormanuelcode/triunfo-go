<?php
class BoxSession {
    private $conn;
    private $table_name = "caja_sesiones";

    public $id_sesion;
    public $usuario_id;
    public $monto_apertura;
    public $monto_cierre;
    public $total_efectivo;
    public $total_tarjeta;
    public $total_transferencia;
    public $total_otros;
    public $diferencia;
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
                      total_efectivo = :total_efectivo,
                      total_tarjeta = :total_tarjeta,
                      total_transferencia = :total_transferencia,
                      total_otros = :total_otros,
                      diferencia = :diferencia,
                      fecha_cierre = NOW(),
                      estado = 'cerrada'
                  WHERE id_sesion = :id_sesion";

        $stmt = $this->conn->prepare($query);

        // Bind params
        $stmt->bindParam(":monto_cierre", $this->monto_cierre);
        $stmt->bindParam(":total_efectivo", $this->total_efectivo);
        $stmt->bindParam(":total_tarjeta", $this->total_tarjeta);
        $stmt->bindParam(":total_transferencia", $this->total_transferencia);
        $stmt->bindParam(":total_otros", $this->total_otros);
        $stmt->bindParam(":diferencia", $this->diferencia);
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
        $query = "SELECT 
                    SUM(total) as total_ventas,
                    SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
                    SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
                    SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END) as total_transferencia,
                    SUM(CASE WHEN metodo_pago = 'otros' THEN total ELSE 0 END) as total_otros
                  FROM facturas 
                  WHERE sesion_id = :sesion_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":sesion_id", $sesion_id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
