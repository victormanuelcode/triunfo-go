<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Clase AuthMiddleware
 * 
 * Maneja la autenticación y autorización mediante JWT (JSON Web Tokens).
 * Verifica la validez de los tokens y gestiona el control de acceso basado en roles.
 */
class AuthMiddleware {
    private $secret_key;
    private $algorithm;
    private $db;
    private $blacklist;

    /**
     * Constructor de la clase.
     * 
     * @param PDO $db Conexión a la base de datos para verificar lista negra de tokens.
     * @throws Exception Si JWT_SECRET no está configurado.
     */
    public function __construct($db) {
        $this->secret_key = $_ENV['JWT_SECRET'];
        if (empty($this->secret_key)) {
            throw new Exception("JWT_SECRET no está configurado en el entorno.");
        }
        $this->algorithm = 'HS256';
        $this->db = $db;
        include_once __DIR__ . '/../models/JwtBlacklist.php';
        $this->blacklist = new JwtBlacklist($db);
    }

    /**
     * Valida el token JWT presente en los encabezados de la solicitud.
     * 
     * Verifica la firma, expiración y si el token ha sido revocado (lista negra).
     * Si es válido, retorna los datos del usuario (payload).
     * Si no, termina la ejecución con un código HTTP 401.
     * 
     * @return array Datos del usuario decodificados del token.
     */
    public function validateToken() {
        $headers = apache_request_headers();
        $authHeader = null;

        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) { // A veces llega en minúscula
            $authHeader = $headers['authorization'];
        }

        if (!$authHeader) {
            http_response_code(401);
            echo json_encode(["message" => "Acceso denegado. No se proporcionó token."]);
            exit();
        }

        $arr = explode(" ", $authHeader);
        if (count($arr) < 2) {
            http_response_code(401);
            echo json_encode(["message" => "Formato de token inválido."]);
            exit();
        }

        $jwt = $arr[1];

        try {
            $decoded = JWT::decode($jwt, new Key($this->secret_key, $this->algorithm));

            $jti = property_exists($decoded, 'jti') ? $decoded->jti : null;
            if ($jti && $this->blacklist->exists($jti)) {
                http_response_code(401);
                echo json_encode(["message" => "Token revocado. Inicie sesión nuevamente."]);
                exit();
            }

            return (array) $decoded->data;

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                "message" => "Acceso denegado.",
                "error" => $e->getMessage()
            ]);
            exit();
        }
    }

    /**
     * Verifica que el usuario tenga uno de los roles permitidos.
     * 
     * Primero valida el token y luego comprueba el rol del usuario.
     * Si no tiene permiso, termina la ejecución con un código HTTP 403.
     * 
     * @param array $allowedRoles Lista de IDs de roles permitidos.
     * @return array Datos del usuario si tiene permiso.
     */
    public function requireRole($allowedRoles = []) {
        $userData = $this->validateToken();
        
        if (!in_array($userData['rol_id'], $allowedRoles)) {
            http_response_code(403);
            echo json_encode(["message" => "Acceso prohibido. No tiene permisos suficientes."]);
            exit();
        }
        
        return $userData;
    }
}
?>
