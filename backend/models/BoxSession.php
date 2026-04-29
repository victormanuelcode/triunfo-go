<?php
/**
 * Clase BoxSession
 * 
 * Gestiona las sesiones de caja (apertura y cierre), permitiendo el control
 * de flujo de efectivo por usuario.
 */
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

    private function isMissingTable(Throwable $e): bool {
        $msg = $e->getMessage();
        // 42S02 = Base table or view not found
        return ($e instanceof PDOException && $e->getCode() === '42S02') ||
               (is_string($msg) && stripos($msg, 'Base table or view not found') !== false) ||
               (is_string($msg) && stripos($msg, "doesn't exist") !== false);
    }

    /**
     * Abre una nueva sesión de caja para un usuario.
     * 
     * @return boolean True si se abrió correctamente, False en caso contrario.
     */
    public function open() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET usuario_id = :usuario_id,
                      monto_apertura = :monto_apertura,
                      fecha_apertura = NOW(),
                      estado = 'abierta'";

        $stmt = $this->conn->prepare($query);

        // Saneamiento de datos
        $this->usuario_id = htmlspecialchars(strip_tags($this->usuario_id));
        $this->monto_apertura = htmlspecialchars(strip_tags($this->monto_apertura));

        // Vincular parámetros
        $stmt->bindParam(":usuario_id", $this->usuario_id);
        $stmt->bindParam(":monto_apertura", $this->monto_apertura);

        if ($stmt->execute()) {
            $this->id_sesion = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    /**
     * Cierra una sesión de caja existente, registrando los totales y diferencias.
     * 
     * @return boolean True si se cerró correctamente, False en caso contrario.
     */
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

        // Vincular parámetros
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

    /**
     * Obtiene la sesión actual abierta para un usuario específico.
     * 
     * @param int $usuario_id ID del usuario.
     * @return PDOStatement Resultado de la consulta.
     */
    public function getCurrentSession($usuario_id) {
        $query = "SELECT * FROM " . $this->table_name . "
                  WHERE usuario_id = :usuario_id AND estado = 'abierta'
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario_id", $usuario_id);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Obtiene una sesión por su ID.
     * 
     * @param int $id ID de la sesión.
     * @return array|false Datos de la sesión o false si no existe.
     */
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id_sesion = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Obtiene un resumen de ventas asociado a una sesión de caja.
     * 
     * @param int $sesion_id ID de la sesión.
     * @return array Array asociativo con los totales por método de pago.
     */
    public function getSummary($sesion_id) {
        $buildSalesOnly = function () use ($sesion_id) {
            $query = "SELECT 
                        IFNULL(SUM(total), 0) as total_ventas,
                        IFNULL(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) as total_efectivo,
                        IFNULL(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) as total_tarjeta,
                        IFNULL(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) as total_transferencia,
                        IFNULL(SUM(CASE WHEN metodo_pago = 'otros' THEN total ELSE 0 END), 0) as total_otros,
                        0 as total_egresos,
                        0 as egresos_efectivo,
                        0 as egresos_tarjeta,
                        0 as egresos_transferencia,
                        0 as egresos_otros
                      FROM facturas
                      WHERE sesion_id = :sesion_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":sesion_id", $sesion_id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        };

        // Intentar con egresos; si la tabla aún no existe, caer a ventas-only
        try {
            $query = "SELECT 
                        IFNULL(v.total_ventas, 0) as total_ventas,
                        IFNULL(v.total_efectivo, 0) as total_efectivo,
                        IFNULL(v.total_tarjeta, 0) as total_tarjeta,
                        IFNULL(v.total_transferencia, 0) as total_transferencia,
                        IFNULL(v.total_otros, 0) as total_otros,
                        IFNULL(e.total_egresos, 0) as total_egresos,
                        IFNULL(e.egresos_efectivo, 0) as egresos_efectivo,
                        IFNULL(e.egresos_tarjeta, 0) as egresos_tarjeta,
                        IFNULL(e.egresos_transferencia, 0) as egresos_transferencia,
                        IFNULL(e.egresos_otros, 0) as egresos_otros
                      FROM
                        (SELECT 
                            SUM(total) as total_ventas,
                            SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
                            SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
                            SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END) as total_transferencia,
                            SUM(CASE WHEN metodo_pago = 'otros' THEN total ELSE 0 END) as total_otros
                         FROM facturas 
                         WHERE sesion_id = :sesion_id_v
                        ) v
                      LEFT JOIN
                        (SELECT
                            SUM(monto) as total_egresos,
                            SUM(CASE WHEN metodo_pago = 'efectivo' THEN monto ELSE 0 END) as egresos_efectivo,
                            SUM(CASE WHEN metodo_pago = 'tarjeta' THEN monto ELSE 0 END) as egresos_tarjeta,
                            SUM(CASE WHEN metodo_pago = 'transferencia' THEN monto ELSE 0 END) as egresos_transferencia,
                            SUM(CASE WHEN metodo_pago = 'otros' THEN monto ELSE 0 END) as egresos_otros
                         FROM egresos
                         WHERE sesion_id = :sesion_id_e
                        ) e
                      ON 1=1";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":sesion_id_v", $sesion_id);
            $stmt->bindParam(":sesion_id_e", $sesion_id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            if ($this->isMissingTable($e) && stripos($e->getMessage(), 'egresos') !== false) {
                return $buildSalesOnly();
            }
            throw $e;
        } catch (Throwable $e) {
            // Último fallback para no romper /box/status
            return $buildSalesOnly();
        }
    }
}
