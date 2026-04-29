<?php
class Expense {
    private $conn;
    private $table_name = "egresos";

    public $id_egreso;
    public $fecha;
    public $concepto;
    public $descripcion;
    public $monto;
    public $metodo_pago;
    public $usuario_id;
    public $sesion_id;
    public $creado_en;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read(array $filters = []) {
        $query = "SELECT 
                    e.*,
                    u.nombre as usuario_nombre
                  FROM " . $this->table_name . " e
                  LEFT JOIN usuarios u ON e.usuario_id = u.id_usuario";

        $conditions = [];
        $params = [];

        if (!empty($filters['from'])) {
            $conditions[] = "DATE(e.fecha) >= :from";
            $params[':from'] = $filters['from'];
        }
        if (!empty($filters['to'])) {
            $conditions[] = "DATE(e.fecha) <= :to";
            $params[':to'] = $filters['to'];
        }
        if (!empty($filters['metodo_pago'])) {
            $conditions[] = "e.metodo_pago = :metodo_pago";
            $params[':metodo_pago'] = $filters['metodo_pago'];
        }
        if (!empty($filters['usuario_id'])) {
            $conditions[] = "e.usuario_id = :usuario_id";
            $params[':usuario_id'] = (int)$filters['usuario_id'];
        }
        if (array_key_exists('sesion_id', $filters) && $filters['sesion_id'] !== null && $filters['sesion_id'] !== '') {
            $conditions[] = "e.sesion_id = :sesion_id";
            $params[':sesion_id'] = (int)$filters['sesion_id'];
        }
        if (!empty($filters['search'])) {
            $conditions[] = "(e.concepto LIKE :q OR e.descripcion LIKE :q)";
            $params[':q'] = '%' . $filters['search'] . '%';
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " ORDER BY e.fecha DESC, e.id_egreso DESC";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT e.*, u.nombre as usuario_nombre
                  FROM " . $this->table_name . " e
                  LEFT JOIN usuarios u ON e.usuario_id = u.id_usuario
                  WHERE e.id_egreso = ? LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_egreso);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->fecha = $row['fecha'];
            $this->concepto = $row['concepto'];
            $this->descripcion = $row['descripcion'];
            $this->monto = $row['monto'];
            $this->metodo_pago = $row['metodo_pago'];
            $this->usuario_id = $row['usuario_id'];
            $this->sesion_id = $row['sesion_id'];
            $this->creado_en = $row['creado_en'];
            return $row;
        }
        return false;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET fecha = :fecha,
                      concepto = :concepto,
                      descripcion = :descripcion,
                      monto = :monto,
                      metodo_pago = :metodo_pago,
                      usuario_id = :usuario_id,
                      sesion_id = :sesion_id";

        $stmt = $this->conn->prepare($query);

        $fecha = $this->fecha ? $this->fecha : null;
        $concepto = htmlspecialchars(strip_tags((string)$this->concepto));
        $descripcion = $this->descripcion !== null ? htmlspecialchars(strip_tags((string)$this->descripcion)) : null;
        $monto = (float)$this->monto;
        $metodo = htmlspecialchars(strip_tags((string)$this->metodo_pago));
        $usuario = (int)$this->usuario_id;
        $sesion = ($this->sesion_id !== null && $this->sesion_id !== '') ? (int)$this->sesion_id : null;

        if (!$fecha) {
            $stmt->bindValue(":fecha", date('Y-m-d H:i:s'));
        } else {
            $stmt->bindValue(":fecha", $fecha);
        }

        $stmt->bindValue(":concepto", $concepto);
        $stmt->bindValue(":descripcion", $descripcion);
        $stmt->bindValue(":monto", $monto);
        $stmt->bindValue(":metodo_pago", $metodo);
        $stmt->bindValue(":usuario_id", $usuario);
        $stmt->bindValue(":sesion_id", $sesion, $sesion === null ? PDO::PARAM_NULL : PDO::PARAM_INT);

        if ($stmt->execute()) {
            $this->id_egreso = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET fecha = :fecha,
                      concepto = :concepto,
                      descripcion = :descripcion,
                      monto = :monto,
                      metodo_pago = :metodo_pago,
                      sesion_id = :sesion_id
                  WHERE id_egreso = :id_egreso";

        $stmt = $this->conn->prepare($query);

        $id = (int)$this->id_egreso;
        $fecha = $this->fecha ? $this->fecha : date('Y-m-d H:i:s');
        $concepto = htmlspecialchars(strip_tags((string)$this->concepto));
        $descripcion = $this->descripcion !== null ? htmlspecialchars(strip_tags((string)$this->descripcion)) : null;
        $monto = (float)$this->monto;
        $metodo = htmlspecialchars(strip_tags((string)$this->metodo_pago));
        $sesion = ($this->sesion_id !== null && $this->sesion_id !== '') ? (int)$this->sesion_id : null;

        $stmt->bindValue(":fecha", $fecha);
        $stmt->bindValue(":concepto", $concepto);
        $stmt->bindValue(":descripcion", $descripcion);
        $stmt->bindValue(":monto", $monto);
        $stmt->bindValue(":metodo_pago", $metodo);
        $stmt->bindValue(":sesion_id", $sesion, $sesion === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindValue(":id_egreso", $id, PDO::PARAM_INT);

        if ($stmt->execute()) return true;
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id_egreso = ?";
        $stmt = $this->conn->prepare($query);
        $id = htmlspecialchars(strip_tags((string)$this->id_egreso));
        $stmt->bindParam(1, $id);
        if ($stmt->execute()) return true;
        return false;
    }

    public function getSummaryBySession(int $sesion_id): array {
        $query = "SELECT 
                    SUM(monto) as total_egresos,
                    SUM(CASE WHEN metodo_pago = 'efectivo' THEN monto ELSE 0 END) as egresos_efectivo,
                    SUM(CASE WHEN metodo_pago = 'tarjeta' THEN monto ELSE 0 END) as egresos_tarjeta,
                    SUM(CASE WHEN metodo_pago = 'transferencia' THEN monto ELSE 0 END) as egresos_transferencia,
                    SUM(CASE WHEN metodo_pago = 'otros' THEN monto ELSE 0 END) as egresos_otros
                  FROM " . $this->table_name . "
                  WHERE sesion_id = :sesion_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":sesion_id", $sesion_id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : [];
    }
}
?>

