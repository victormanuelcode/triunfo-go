<?php
/**
 * Clase JwtBlacklist
 * 
 * Gestiona una lista negra de tokens JWT para permitir la invalidación (logout)
 * antes de su expiración natural. Utiliza una tabla en base de datos.
 */
class JwtBlacklist {
    private $conn;
    private $table_name = "jwt_blacklist";

    public function __construct($db) {
        $this->conn = $db;
        $this->ensureTable();
    }

    /**
     * Asegura que la tabla de lista negra exista en la base de datos.
     * Crea la tabla si no existe.
     */
    private function ensureTable() {
        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            jti VARCHAR(64) PRIMARY KEY,
            exp INT UNSIGNED NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        $this->conn->exec($sql);
    }

    /**
     * Añade un identificador de token (JTI) a la lista negra.
     * 
     * @param string $jti ID único del token JWT.
     * @param int $exp Timestamp de expiración del token.
     * @return boolean True si se insertó correctamente.
     */
    public function add($jti, $exp) {
        $query = "REPLACE INTO {$this->table_name} (jti, exp) VALUES (:jti, :exp)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':jti', $jti);
        $stmt->bindParam(':exp', $exp, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Verifica si un token (por su JTI) está en la lista negra.
     * 
     * @param string $jti ID único del token.
     * @return boolean True si el token está en la lista negra (invalidado).
     */
    public function exists($jti) {
        $query = "SELECT jti FROM {$this->table_name} WHERE jti = :jti LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':jti', $jti);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
?>
