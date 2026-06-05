<?php
/**
 * Clase User
 * 
 * Gestiona las operaciones relacionadas con los usuarios del sistema,
 * incluyendo autenticación (login), creación y administración de roles.
 */
class User {
    private $conn;
    private $table_name = "usuarios";

    public $id_usuario;
    public $nombre;
    public $usuario;
    public $contrasena;
    public $email;
    public $rol_id; // Propiedad para guardar el rol
    public $telefono;
    public $avatar_url;
    public $preferencias; // JSON/TEXT
    public $estado;

    public function __construct($db) {
        $this->conn = $db;
        $this->ensureProfileColumns();
        $this->ensureEstadoColumn();
    }

    /**
     * Obtiene todos los usuarios registrados junto con su rol.
     * 
     * @return PDOStatement Resultado de la consulta.
     */
    public function getAll() {
        $query = "SELECT 
                    u.id_usuario, 
                    u.nombre, 
                    u.usuario, 
                    u.email,
                    u.estado,
                    ru.rol_id,
                    r.nombre as nombre_rol,
                    (
                        EXISTS (SELECT 1 FROM facturas f WHERE f.usuario_id = u.id_usuario)
                        OR EXISTS (SELECT 1 FROM caja_sesiones cs WHERE cs.usuario_id = u.id_usuario)
                        OR EXISTS (SELECT 1 FROM egresos e WHERE e.usuario_id = u.id_usuario)
                    ) AS tiene_historial
                  FROM " . $this->table_name . " u
                  LEFT JOIN roles_user ru ON u.id_usuario = ru.usuario_id
                  LEFT JOIN roles r ON ru.rol_id = r.id_rol
                  ORDER BY u.id_usuario DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Obtiene los datos de un usuario específico por su ID.
     * 
     * @return PDOStatement Resultado de la consulta (un solo registro).
     */
    public function getOne() {
        $query = "SELECT 
                    u.id_usuario, 
                    u.nombre, 
                    u.usuario, 
                    u.email,
                    u.telefono,
                    u.avatar_url,
                    u.preferencias,
                    u.estado,
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

    /**
     * Crea un nuevo usuario en la base de datos y le asigna un rol.
     * 
     * @return boolean True si el usuario fue creado exitosamente.
     */
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

    /**
     * Actualiza la información de un usuario existente.
     * Si se proporciona contraseña, se actualiza y encripta; de lo contrario se mantiene la anterior.
     * 
     * @return boolean True si la actualización fue exitosa.
     */
    public function update() {
        // Si hay contraseña, actualizar todo. Si no, solo datos básicos.
        if(!empty($this->contrasena)){
            $query = "UPDATE " . $this->table_name . "
                      SET nombre = :nombre,
                          usuario = :usuario,
                          email = :email,
                          telefono = :telefono,
                          avatar_url = :avatar_url,
                          preferencias = :preferencias,
                          contrasena = :contrasena
                      WHERE id_usuario = :id_usuario";
        } else {
            $query = "UPDATE " . $this->table_name . "
                      SET nombre = :nombre,
                          usuario = :usuario,
                          email = :email,
                          telefono = :telefono,
                          avatar_url = :avatar_url,
                          preferencias = :preferencias
                      WHERE id_usuario = :id_usuario";
        }

        $stmt = $this->conn->prepare($query);

        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->usuario = htmlspecialchars(strip_tags($this->usuario));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->id_usuario = htmlspecialchars(strip_tags($this->id_usuario));
        $this->telefono = isset($this->telefono) ? htmlspecialchars(strip_tags($this->telefono)) : null;
        $this->avatar_url = isset($this->avatar_url) ? htmlspecialchars(strip_tags($this->avatar_url)) : null;
        $this->preferencias = isset($this->preferencias) ? $this->preferencias : null;

        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':usuario', $this->usuario);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':id_usuario', $this->id_usuario);
        $stmt->bindParam(':telefono', $this->telefono);
        $stmt->bindParam(':avatar_url', $this->avatar_url);
        $stmt->bindParam(':preferencias', $this->preferencias);

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

    private function ensureProfileColumns() {
        try {
            $this->conn->exec("ALTER TABLE {$this->table_name} ADD COLUMN telefono VARCHAR(20) NULL");
        } catch (\Throwable $e) {}
        try {
            $this->conn->exec("ALTER TABLE {$this->table_name} ADD COLUMN avatar_url VARCHAR(255) NULL");
        } catch (\Throwable $e) {}
        try {
            $this->conn->exec("ALTER TABLE {$this->table_name} ADD COLUMN preferencias TEXT NULL");
        } catch (\Throwable $e) {}
    }

    private function ensureEstadoColumn() {
        try {
            $this->conn->exec("ALTER TABLE {$this->table_name} ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'activo'");
        } catch (\Throwable $e) {}
    }

    /**
     * Indica si el usuario tiene actividad registrada (ventas, caja o egresos).
     */
    public function hasOperationalHistory($userId = null) {
        $id = (int)($userId ?? $this->id_usuario);
        if ($id <= 0) {
            return false;
        }

        $checks = [
            "SELECT COUNT(*) AS total FROM facturas WHERE usuario_id = :id",
            "SELECT COUNT(*) AS total FROM caja_sesiones WHERE usuario_id = :id",
            "SELECT COUNT(*) AS total FROM egresos WHERE usuario_id = :id",
        ];

        foreach ($checks as $sql) {
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (((int)($row['total'] ?? 0)) > 0) {
                return true;
            }
        }

        return false;
    }

    public function setEstado($estado) {
        $estado = $estado === 'inactivo' ? 'inactivo' : 'activo';

        $query = "UPDATE " . $this->table_name . " SET estado = :estado WHERE id_usuario = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':estado', $estado, PDO::PARAM_STR);
        $stmt->bindValue(':id', (int)$this->id_usuario, PDO::PARAM_INT);

        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    public function inactivate() {
        return $this->setEstado('inactivo');
    }

    public function activate() {
        return $this->setEstado('activo');
    }

    public function hardDelete() {
        $id = (int)$this->id_usuario;
        if ($id <= 0 || $this->hasOperationalHistory($id)) {
            return false;
        }

        $this->conn->beginTransaction();
        try {
            $stmtNotif = $this->conn->prepare("DELETE FROM notificaciones WHERE usuario_id = :id");
            $stmtNotif->bindValue(':id', $id, PDO::PARAM_INT);
            $stmtNotif->execute();

            $stmtRol = $this->conn->prepare("DELETE FROM roles_user WHERE usuario_id = :id");
            $stmtRol->bindValue(':id', $id, PDO::PARAM_INT);
            $stmtRol->execute();

            $stmt = $this->conn->prepare("DELETE FROM " . $this->table_name . " WHERE id_usuario = :id");
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            if ($stmt->rowCount() <= 0) {
                $this->conn->rollBack();
                return false;
            }

            $this->conn->commit();
            return true;
        } catch (\Throwable $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    public function login() {
        $query = "SELECT 
                    u.id_usuario, 
                    u.nombre, 
                    u.contrasena, 
                    u.email,
                    u.estado,
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
    
    /**
     * Comprueba si un nombre de usuario ya existe en la base de datos.
     * 
     * @return boolean True si el usuario ya existe, False si está disponible.
     */
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

    public function findByEmail($email) {
        $query = "SELECT id_usuario, nombre, usuario, email
                  FROM " . $this->table_name . "
                  WHERE LOWER(email) = LOWER(?)
                  LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $email);
        $stmt->execute();
        if ($stmt->rowCount() === 0) {
            return null;
        }
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updatePassword($id, $plainPassword) {
        $query = "UPDATE " . $this->table_name . "
                  SET contrasena = :contrasena
                  WHERE id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $passwordHash = password_hash($plainPassword, PASSWORD_BCRYPT);
        $stmt->bindParam(':contrasena', $passwordHash);
        $stmt->bindParam(':id_usuario', $id);
        return $stmt->execute();
    }
}
?>
