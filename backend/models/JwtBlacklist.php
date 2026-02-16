<?php
class JwtBlacklist {
    private $conn;
    private $table_name = "jwt_blacklist";

    public function __construct($db) {
        $this->conn = $db;
        $this->ensureTable();
    }

    private function ensureTable() {
        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            jti VARCHAR(64) PRIMARY KEY,
            exp INT UNSIGNED NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        $this->conn->exec($sql);
    }

    public function add($jti, $exp) {
        $query = "REPLACE INTO {$this->table_name} (jti, exp) VALUES (:jti, :exp)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':jti', $jti);
        $stmt->bindParam(':exp', $exp, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function exists($jti) {
        $query = "SELECT jti FROM {$this->table_name} WHERE jti = :jti LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':jti', $jti);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
?>
