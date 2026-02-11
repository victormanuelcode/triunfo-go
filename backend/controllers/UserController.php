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

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));
        $this->user->id_usuario = $id;
        
        if(!empty($data->nombre) && !empty($data->usuario)){
            $this->user->nombre = $data->nombre;
            $this->user->usuario = $data->usuario;
            $this->user->email = isset($data->email) ? $data->email : null;
            $this->user->rol_id = isset($data->rol_id) ? $data->rol_id : null;
            $this->user->contrasena = isset($data->contrasena) ? $data->contrasena : null; // Opcional

            if($this->user->update()){
                http_response_code(200);
                echo json_encode(["message" => "Usuario actualizado."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo actualizar el usuario."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos."]);
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

        if (!empty($data->nombre) && !empty($data->usuario) && !empty($data->contrasena)) {
            $this->user->nombre = $data->nombre;
            $this->user->usuario = $data->usuario;
            $this->user->contrasena = $data->contrasena;
            $this->user->email = isset($data->email) ? $data->email : null;
            $this->user->rol_id = isset($data->rol_id) ? $data->rol_id : 2; // Default 2 (Cajero) si no se envía

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

        if(empty($data->usuario) || empty($data->contrasena)){
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
                // Aquí se debería generar un JWT (JSON Web Token)
                http_response_code(200);
                echo json_encode([
                    "message" => "Login exitoso.",
                    "user_id" => $row['id_usuario'],
                    "nombre" => $row['nombre'],
                    "email" => $row['email'],
                    "rol_id" => $row['rol_id']
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
}
?>