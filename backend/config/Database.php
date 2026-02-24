<?php
/**
 * Clase Database
 * 
 * Gestiona la conexión a la base de datos MySQL utilizando PDO.
 * Obtiene las credenciales de las variables de entorno o usa valores por defecto.
 */
class Database {
    private string $host;
    private string $db_name;
    private string $username;
    private string $password;
    private ?string $port = null;

    /**
     * Constructor de la clase.
     * Inicializa las propiedades de conexión desde las variables de entorno.
     */
    public function __construct() {
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->db_name = $_ENV['DB_NAME'] ?? '';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? '';
        $this->port = $_ENV['DB_PORT'] ?? null; // opcional, por defecto 3306
    }

    /**
     * Obtiene una instancia de conexión a la base de datos.
     * 
     * Configura el DSN (Data Source Name) y las opciones de PDO para
     * manejo de errores y modo de fetch.
     * 
     * @return PDO Objeto de conexión PDO configurado.
     * @throws PDOException Si falla la conexión.
     */
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
