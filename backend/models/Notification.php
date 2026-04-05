<?php
class Notification {
    private $conn;
    private $table = "notificaciones";

    public $id;
    public $usuario_id;
    public $titulo;
    public $mensaje;
    public $tipo;
    public $estado;
    public $creado_en;

    public function __construct($db) {
        $this->conn = $db;
        $this->ensureSchema();
    }

    private function ensureSchema() {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS {$this->table} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NULL,
                titulo VARCHAR(150) NOT NULL,
                mensaje VARCHAR(500) NOT NULL,
                tipo ENUM('info','warning','alert') NOT NULL DEFAULT 'info',
                estado ENUM('nuevo','leido') NOT NULL DEFAULT 'nuevo',
                creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_usuario (usuario_id),
                CONSTRAINT fk_notif_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
            $this->conn->exec($sql);
        } catch (\Throwable $e) {
            // Silenciar si no se puede crear; evita romper flujo
        }
    }

    public function create($usuario_id, $titulo, $mensaje, $tipo = 'info') {
        $q = "INSERT INTO {$this->table} (usuario_id, titulo, mensaje, tipo) VALUES (:usuario_id, :titulo, :mensaje, :tipo)";
        $stmt = $this->conn->prepare($q);
        $uid = $usuario_id !== null ? intval($usuario_id) : null;
        $stmt->bindParam(':usuario_id', $uid);
        $stmt->bindParam(':titulo', $titulo);
        $stmt->bindParam(':mensaje', $mensaje);
        $stmt->bindParam(':tipo', $tipo);
        return $stmt->execute();
    }

    public function getForUser($usuario_id, $only_unread = false, $limit = 50) {
        $condEstado = $only_unread ? "AND n.estado = 'nuevo'" : "";
        $q = "SELECT n.id, n.usuario_id, n.titulo, n.mensaje, n.tipo, n.estado, n.creado_en
              FROM {$this->table} n
              WHERE (n.usuario_id = :uid OR n.usuario_id IS NULL) {$condEstado}
              ORDER BY n.creado_en DESC
              LIMIT :lim";
        $stmt = $this->conn->prepare($q);
        $uid = intval($usuario_id);
        $stmt->bindParam(':uid', $uid, PDO::PARAM_INT);
        $lim = intval($limit);
        $stmt->bindParam(':lim', $lim, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }

    public function markRead($id) {
        $q = "UPDATE {$this->table} SET estado='leido' WHERE id = :id";
        $stmt = $this->conn->prepare($q);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
?>
