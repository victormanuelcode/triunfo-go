<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    private $secret_key;
    private $algorithm;

    public function __construct() {
        // En producción, esto debe venir de variables de entorno
        $this->secret_key = $_ENV['JWT_SECRET'] ?? 'tu_clave_secreta_super_segura_triunfogo'; 
        $this->algorithm = 'HS256';
    }

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
            
            // Retornar datos del usuario decodificados para usarlos si se necesita
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

    // Función auxiliar para verificar roles específicos
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