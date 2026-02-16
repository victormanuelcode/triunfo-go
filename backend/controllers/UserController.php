<?php
include_once __DIR__ . '/../models/User.php';

class UserController {
    private $db;
    private $user;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
    }

    public function getAll() {
        $stmt = $this->user->getAll();
        $num = $stmt->rowCount();

        if ($num > 0) {
            $users_arr = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                extract($row);
                $user_item = [
                    "id_usuario" => $id_usuario,
                    "nombre" => $nombre,
                    "usuario" => $usuario,
                    "email" => $email,
                    "rol_id" => $rol_id,
                    "nombre_rol" => $nombre_rol
                ];
                array_push($users_arr, $user_item);
            }
            http_response_code(200);
            echo json_encode($users_arr);
        } else {
            http_response_code(200); // OK pero vacío
            echo json_encode([]);
        }
    }

    public function getOne($id) {
        $this->user->id_usuario = $id;
        $stmt = $this->user->getOne();
        $num = $stmt->rowCount();

        if($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            http_response_code(200);
            echo json_encode($row);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
        }
    }

    public function getProfile($tokenData) {
        $id = $tokenData['id_usuario'];
        $this->user->id_usuario = $id;
        $stmt = $this->user->getOne();
        $num = $stmt->rowCount();

        if($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            // No devolver contraseña
            unset($row['contrasena']);
            http_response_code(200);
            echo json_encode($row);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
        }
    }

    public function updateProfile($tokenData) {
        $id = $tokenData['id_usuario'];
        $data = json_decode(file_get_contents("php://input"));
        
        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        // Obtener datos actuales
        $oldUser = new User($this->db);
        $oldUser->id_usuario = $id;
        $stmt = $oldUser->getOne();
        if ($stmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
            return;
        }
        $currentUserData = $stmt->fetch(PDO::FETCH_ASSOC);

        // Solo permitir cambiar ciertos campos
        $newNombre = $data->nombre ?? $currentUserData['nombre'];
        $newUsuario = $data->usuario ?? $currentUserData['usuario'];
        $newEmail = isset($data->email) ? $data->email : $currentUserData['email'];
        
        // El rol NO se puede cambiar desde el perfil personal
        $newRolId = $currentUserData['rol_id'];

        // Validaciones
        if (strlen($newNombre) < 3 || strlen($newUsuario) < 3) {
            http_response_code(400);
            echo json_encode(["message" => "Nombre y usuario deben tener al menos 3 caracteres."]);
            return;
        }

        if ($newEmail !== '' && $newEmail !== null && !filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["message" => "Correo electrónico inválido."]);
            return;
        }

        if (isset($data->contrasena) && $data->contrasena !== '') {
            if (strlen($data->contrasena) < 6) {
                http_response_code(400);
                echo json_encode(["message" => "La contraseña debe tener al menos 6 caracteres."]);
                return;
            }
            $this->user->contrasena = $data->contrasena;
        }

        $this->user->id_usuario = $id;
        $this->user->nombre = $newNombre;
        $this->user->usuario = $newUsuario;
        $this->user->email = $newEmail;
        $this->user->rol_id = $newRolId;

        if($this->user->update()){
            http_response_code(200);
            echo json_encode(["message" => "Perfil actualizado correctamente."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo actualizar el perfil."]);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));
        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        // Obtener usuario actual
        $oldUser = new User($this->db);
        $oldUser->id_usuario = $id;
        $stmt = $oldUser->getOne();
        if ($stmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
            return;
        }
        $currentUserData = $stmt->fetch(PDO::FETCH_ASSOC);

        $newNombre = $data->nombre ?? $currentUserData['nombre'];
        $newUsuario = $data->usuario ?? $currentUserData['usuario'];
        $newEmail = isset($data->email) ? $data->email : $currentUserData['email'];
        $newRolId = isset($data->rol_id) ? $data->rol_id : $currentUserData['rol_id'];

        // Validaciones
        if (strlen($newNombre) < 3 || strlen($newUsuario) < 3) {
            http_response_code(400);
            echo json_encode(["message" => "Nombre y usuario deben tener al menos 3 caracteres."]);
            return;
        }

        if ($newEmail !== '' && $newEmail !== null && !filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["message" => "Correo electrónico inválido."]);
            return;
        }

        if (isset($data->contrasena) && $data->contrasena !== '') {
            if (strlen($data->contrasena) < 6) {
                http_response_code(400);
                echo json_encode(["message" => "La contraseña debe tener al menos 6 caracteres."]);
                return;
            }
            $this->user->contrasena = $data->contrasena;
        }

        if ($newRolId && !in_array((int)$newRolId, [1, 2], true)) {
            http_response_code(400);
            echo json_encode(["message" => "Rol inválido."]);
            return;
        }

        $this->user->id_usuario = $id;
        $this->user->nombre = $newNombre;
        $this->user->usuario = $newUsuario;
        $this->user->email = $newEmail;
        $this->user->rol_id = $newRolId;

        if($this->user->update()){
            http_response_code(200);
            echo json_encode(["message" => "Usuario actualizado."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo actualizar el usuario."]);
        }
    }

    public function delete($id) {
        $this->user->id_usuario = $id;
        if($this->user->delete()){
            http_response_code(200);
            echo json_encode(["message" => "Usuario eliminado."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo eliminar el usuario."]);
        }
    }

    public function register() {
        $data = json_decode(file_get_contents("php://input"));

        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        if (!empty($data->nombre) && !empty($data->usuario) && !empty($data->contrasena)) {
            if (strlen($data->nombre) < 3 || strlen($data->usuario) < 3) {
                http_response_code(400);
                echo json_encode(["message" => "Nombre y usuario deben tener al menos 3 caracteres."]);
                return;
            }

            if (strlen($data->contrasena) < 6) {
                http_response_code(400);
                echo json_encode(["message" => "La contraseña debe tener al menos 6 caracteres."]);
                return;
            }

            if (isset($data->email) && $data->email !== '' && !filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(["message" => "Correo electrónico inválido."]);
                return;
            }

            $rolId = isset($data->rol_id) ? (int)$data->rol_id : 2;
            if (!in_array($rolId, [1, 2], true)) {
                http_response_code(400);
                echo json_encode(["message" => "Rol inválido."]);
                return;
            }

            $this->user->nombre = $data->nombre;
            $this->user->usuario = $data->usuario;
            $this->user->contrasena = $data->contrasena;
            $this->user->email = isset($data->email) ? $data->email : null;
            $this->user->rol_id = $rolId;

            if($this->user->userExists()){
                http_response_code(400);
                echo json_encode(["message" => "El nombre de usuario ya existe."]);
                return;
            }

            if ($this->user->create()) {
                http_response_code(201);
                echo json_encode(["message" => "Usuario creado exitosamente."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo crear el usuario."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. Se requiere nombre, usuario y contrasena."]);
        }
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"));

        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        if (empty($data->usuario) || empty($data->contrasena)) {
            http_response_code(400);
            echo json_encode(["message" => "Faltan datos de inicio de sesión."]);
            return;
        }

        $this->user->usuario = $data->usuario;
        $stmt = $this->user->login();
        $num = $stmt->rowCount();

        if ($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($data->contrasena, $row['contrasena'])) {
                
                // Generar JWT
                $secret_key = $_ENV['JWT_SECRET'];
                if (empty($secret_key)) {
                    http_response_code(500);
                    echo json_encode(["message" => "Error de configuración del servidor (JWT_SECRET)."]);
                    return;
                }
                $issuer_claim = "http://localhost/proyecto_final";
                $audience_claim = "http://localhost/proyecto_final";
                $issuedat_claim = time(); // Issued at
                $expire_claim = $issuedat_claim + 28800; // Expira en 8 horas (jornada laboral)
                $jti = bin2hex(random_bytes(16));

                $token = array(
                    "iss" => $issuer_claim,
                    "aud" => $audience_claim,
                    "iat" => $issuedat_claim,
                    "nbf" => $issuedat_claim,
                    "exp" => $expire_claim,
                    "jti" => $jti,
                    "data" => array(
                        "id_usuario" => $row['id_usuario'],
                        "nombre" => $row['nombre'],
                        "email" => $row['email'],
                        "rol_id" => $row['rol_id']
                    )
                );

                $jwt = \Firebase\JWT\JWT::encode($token, $secret_key, 'HS256');

                http_response_code(200);
                echo json_encode([
                    "message" => "Login exitoso.",
                    "token" => $jwt,
                    "user_id" => $row['id_usuario'],
                    "nombre" => $row['nombre'],
                    "email" => $row['email'],
                    "rol_id" => $row['rol_id'],
                    "expires_in" => $expire_claim
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Contraseña incorrecta."]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Usuario no encontrado."]);
        }
    }

    public function logout() {
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
        $authHeader = $headers['Authorization'] ?? ($headers['authorization'] ?? null);
        if (!$authHeader) {
            http_response_code(400);
            echo json_encode(["message" => "No se proporcionó token."]);
            return;
        }
        $parts = explode(" ", $authHeader);
        if (count($parts) < 2) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de token inválido."]);
            return;
        }
        $jwt = $parts[1];
        try {
            $secret_key = $_ENV['JWT_SECRET'];
            if (empty($secret_key)) {
                throw new Exception("Error de configuración del servidor (JWT_SECRET).");
            }
            $decoded = \Firebase\JWT\JWT::decode($jwt, new \Firebase\JWT\Key($secret_key, 'HS256'));
            $jti = property_exists($decoded, 'jti') ? $decoded->jti : null;
            $exp = property_exists($decoded, 'exp') ? (int)$decoded->exp : 0;
            if (!$jti) {
                http_response_code(400);
                echo json_encode(["message" => "El token no tiene identificador."]);
                return;
            }
            include_once __DIR__ . '/../models/JwtBlacklist.php';
            $blacklist = new \JwtBlacklist($this->db);
            $blacklist->add($jti, $exp);
            http_response_code(200);
            echo json_encode(["message" => "Sesión cerrada correctamente."]);
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => "Token inválido.", "error" => $e->getMessage()]);
        }
    }
}
?>
