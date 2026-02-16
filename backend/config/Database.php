<?php
class Database {
    private string $host;
    private string $db_name;
    private string $username;
    private string $password;
    private ?string $port = null;

    public function __construct() {
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->db_name = $_ENV['DB_NAME'] ?? '';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? '';
        $this->port = $_ENV['DB_PORT'] ?? null; // opcional, por defecto 3306
    }

    public function getConnection(): PDO {
        $portSegment = $this->port ? ";port={$this->port}" : "";
        $dsn = "mysql:host={$this->host}{$portSegment};dbname={$this->db_name};charset=utf8mb4";

        return new PDO($dsn, $this->username, $this->password, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
}
?>
