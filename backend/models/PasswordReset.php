<?php
/**
 * Clase PasswordReset
 *
 * Gestiona los códigos de verificación para recuperación de contraseña.
 * Los códigos se almacenan hasheados, expiran a los 15 minutos y solo
 * pueden usarse una vez.
 */
class PasswordReset {
    private $conn;
    private $table_name = "password_resets";

    /**
     * @param PDO $db Conexión activa a la base de datos.
     */
    public function __construct($db) {
        $this->conn = $db;
        $this->ensureTable();
    }

    /**
     * Crea la tabla password_resets si aún no existe.
     * Mismo patrón que JwtBlacklist: migración automática al instanciar el modelo.
     */
    private function ensureTable() {
        $sql = "CREATE TABLE IF NOT EXISTS {$this->table_name} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL,
            code_hash VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            used_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        $this->conn->exec($sql);
    }

    /**
     * Invalida todos los códigos activos de un correo antes de generar uno nuevo.
     *
     * @param string $email Correo normalizado (minúsculas).
     * @return bool
     */
    public function invalidateForEmail($email) {
        $query = "UPDATE {$this->table_name}
                  SET used_at = NOW()
                  WHERE email = :email AND used_at IS NULL";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        return $stmt->execute();
    }

    /**
     * Genera y guarda un nuevo código de recuperación.
     *
     * @param string $email      Correo del usuario.
     * @param string $plainCode  Código en texto plano (6 dígitos); se hashea antes de guardar.
     * @param int    $ttlMinutes Minutos hasta la expiración (por defecto 15).
     * @return int|false         ID del registro insertado o false si falla.
     */
    public function create($email, $plainCode, $ttlMinutes = 15) {
        $this->invalidateForEmail($email);

        $codeHash = password_hash($plainCode, PASSWORD_BCRYPT);
        $expiresAt = date('Y-m-d H:i:s', time() + ($ttlMinutes * 60));

        $query = "INSERT INTO {$this->table_name} (email, code_hash, expires_at)
                  VALUES (:email, :code_hash, :expires_at)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':code_hash', $codeHash);
        $stmt->bindParam(':expires_at', $expiresAt);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    /**
     * Verifica un código y lo marca como usado si es válido y no ha expirado.
     *
     * @param string $email     Correo del usuario.
     * @param string $plainCode Código ingresado por el usuario.
     * @return bool True si el código es correcto y fue consumido.
     */
    public function verifyAndConsume($email, $plainCode) {
        $query = "SELECT id, code_hash, expires_at
                  FROM {$this->table_name}
                  WHERE email = :email AND used_at IS NULL
                  ORDER BY created_at DESC
                  LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            return false;
        }

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (strtotime($row['expires_at']) < time()) {
            return false;
        }
        if (!password_verify($plainCode, $row['code_hash'])) {
            return false;
        }

        $update = "UPDATE {$this->table_name} SET used_at = NOW() WHERE id = :id";
        $stmtUpdate = $this->conn->prepare($update);
        $stmtUpdate->bindParam(':id', $row['id']);
        $stmtUpdate->execute();

        return true;
    }

    /**
     * Cuenta solicitudes recientes de un correo para limitar abuso (rate limiting).
     *
     * @param string $email   Correo a consultar.
     * @param int    $minutes Ventana de tiempo en minutos (por defecto 15).
     * @return int Número de solicitudes en ese periodo.
     */
    public function countRecentRequests($email, $minutes = 15) {
        $query = "SELECT COUNT(*) AS total
                  FROM {$this->table_name}
                  WHERE email = :email
                    AND created_at >= DATE_SUB(NOW(), INTERVAL :minutes MINUTE)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':minutes', $minutes, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($row['total'] ?? 0);
    }
}
