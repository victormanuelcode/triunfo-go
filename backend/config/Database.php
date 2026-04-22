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

    private function env(string $key, ?string $default = null): ?string {
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return (string) $_ENV[$key];
        }
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
            return (string) $_SERVER[$key];
        }
        $value = getenv($key);
        if ($value !== false && $value !== '') {
            return (string) $value;
        }
        return $default;
    }

    /**
     * Constructor de la clase.
     * Inicializa las propiedades de conexión desde las variables de entorno.
     */
    public function __construct() {
        $this->host = $this->env('DB_HOST', 'localhost') ?? 'localhost';
        $this->db_name = $this->env('DB_NAME', '') ?? '';
        $this->username = $this->env('DB_USER', 'root') ?? 'root';
        $this->password = $this->env('DB_PASS', '') ?? '';
        $this->port = $this->env('DB_PORT', null); // opcional, por defecto 3306
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
