<?php
class User {
    private $conn;
    private $table_name = "usuarios";

    public $id_usuario;
    public $nombre;
    public $usuario;
    public $contrasena;
    public $email;
    public $rol_id; // Propiedad para guardar el rol

    public function __construct($db) {
        $this->conn = $db;
    }

    // Método para obtener todos los usuarios con sus roles
    public function getAll() {
        $query = "SELECT 
                    u.id_usuario, 
                    u.nombre, 
                    u.usuario, 
                    u.email, 
                    ru.rol_id,
                    r.nombre as nombre_rol
                  FROM " . $this->table_name . " u
                  LEFT JOIN roles_user ru ON u.id_usuario = ru.usuario_id
                  LEFT JOIN roles r ON ru.rol_id = r.id_rol
                  ORDER BY u.id_usuario DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Método para obtener un usuario por ID
    public function getOne() {
        $query = "SELECT 
                    u.id_usuario, 
                    u.nombre, 
                    u.usuario, 
                    u.email, 
                    ru.rol_id 
                  FROM " . $this->table_name . " u
                  LEFT JOIN roles_user ru ON u.id_usuario = ru.usuario_id
                  WHERE u.id_usuario = ?
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_usuario);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        // 1. Insertar usuario
        $query = "INSERT INTO " . $this->table_name . " SET nombre=:nombre, usuario=:usuario, contrasena=:contrasena, email=:email";
        $stmt = $this->conn->prepare($query);

        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->usuario = htmlspecialchars(strip_tags($this->usuario));
        $this->contrasena = htmlspecialchars(strip_tags($this->contrasena));
        $this->email = htmlspecialchars(strip_tags($this->email));

        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":usuario", $this->usuario);
        $password_hash = password_hash($this->contrasena, PASSWORD_BCRYPT);
        $stmt->bindParam(":contrasena", $password_hash);
        $stmt->bindParam(":email", $this->email);

        if ($stmt->execute()) {
            // 2. Obtener el ID insertado
            $this->id_usuario = $this->conn->lastInsertId();

            // 3. Asignar rol por defecto (2 = Cajero/Empleado) en tabla roles_user
            // Si $this->rol_id viene seteado, usarlo, sino usar 2.
            $rol_asignar = isset($this->rol_id) ? $this->rol_id : 2;

            $query_rol = "INSERT INTO roles_user (usuario_id, rol_id) VALUES (:usuario_id, :rol_id)";
            $stmt_rol = $this->conn->prepare($query_rol);
            $stmt_rol->bindParam(":usuario_id", $this->id_usuario);
            $stmt_rol->bindParam(":rol_id", $rol_asignar);

            if($stmt_rol->execute()){
                return true;
            }
        }
        return false;
    }

    // Método para actualizar usuario
    public function update() {
        // Si hay contraseña, actualizar todo. Si no, solo datos básicos.
        if(!empty($this->contrasena)){
            $query = "UPDATE " . $this->table_name . "
                      SET nombre = :nombre,
                          usuario = :usuario,
                          email = :email,
                          contrasena = :contrasena
                      WHERE id_usuario = :id_usuario";
        } else {
            $query = "UPDATE " . $this->table_name . "
                      SET nombre = :nombre,
                          usuario = :usuario,
                          email = :email
                      WHERE id_usuario = :id_usuario";
        }

        $stmt = $this->conn->prepare($query);

        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->usuario = htmlspecialchars(strip_tags($this->usuario));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->id_usuario = htmlspecialchars(strip_tags($this->id_usuario));

        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':usuario', $this->usuario);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':id_usuario', $this->id_usuario);

        if(!empty($this->contrasena)){
            $this->contrasena = htmlspecialchars(strip_tags($this->contrasena));
            $password_hash = password_hash($this->contrasena, PASSWORD_BCRYPT);
            $stmt->bindParam(':contrasena', $password_hash);
        }

        if($stmt->execute()){
            // Actualizar Rol
            if(isset($this->rol_id)){
                // Verificar si ya tiene rol asignado
                $check_rol = "SELECT id FROM roles_user WHERE usuario_id = ?";
                $stmt_check = $this->conn->prepare($check_rol);
                $stmt_check->bindParam(1, $this->id_usuario);
                $stmt_check->execute();

                if($stmt_check->rowCount() > 0){
                    $query_rol = "UPDATE roles_user SET rol_id = :rol_id WHERE usuario_id = :usuario_id";
                } else {
                    $query_rol = "INSERT INTO roles_user (usuario_id, rol_id) VALUES (:usuario_id, :rol_id)";
                }
                
                $stmt_rol = $this->conn->prepare($query_rol);
                $stmt_rol->bindParam(":rol_id", $this->rol_id);
                $stmt_rol->bindParam(":usuario_id", $this->id_usuario);
                $stmt_rol->execute();
            }
            return true;
        }
        return false;
    }

    // Método para eliminar usuario
    public function delete() {
        // Primero eliminar de roles_user
        $query_rol = "DELETE FROM roles_user WHERE usuario_id = ?";
        $stmt_rol = $this->conn->prepare($query_rol);
        $stmt_rol->bindParam(1, $this->id_usuario);
        $stmt_rol->execute();

        // Luego eliminar usuario
        $query = "DELETE FROM " . $this->table_name . " WHERE id_usuario = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_usuario);

        if($stmt->execute()){
            return true;
        }
        return false;
    }

    public function login() {
        // Consulta corregida con JOIN para obtener el rol real
        $query = "SELECT 
                    u.id_usuario, 
                    u.nombre, 
                    u.contrasena, 
                    u.email, 
                    ru.rol_id 
                  FROM " . $this->table_name . " u
                  LEFT JOIN roles_user ru ON u.id_usuario = ru.usuario_id
                  WHERE u.usuario = ? 
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->usuario);
        $stmt->execute();
        return $stmt;
    }
    
    public function userExists() {
        $query = "SELECT id_usuario FROM " . $this->table_name . " WHERE usuario = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->usuario);
        $stmt->execute();
        if($stmt->rowCount() > 0){
            return true;
        }
        return false;
    }
}
?>