<?php
include_once __DIR__ . '/../models/User.php';

/**
 * Controlador para la gestión de usuarios y autenticación.
 * Maneja operaciones CRUD de usuarios, login, logout y perfil.
 */
class UserController {
    private $db;
    private $user;

    /**
     * Constructor de la clase.
     * 
     * @param PDO $db Conexión a la base de datos
     */
    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
    }

    public function uploadAvatar($tokenData) {
        $id = $tokenData['id_usuario'];
        if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(["message" => "Archivo inválido."]);
            return;
        }
        $file = $_FILES['avatar'];
        $mime = null;
        if (class_exists('finfo')) {
            $fi = new finfo(FILEINFO_MIME_TYPE);
            $mime = $fi->file($file['tmp_name']);
        }
        if (!$mime && function_exists('mime_content_type')) {
            $mime = mime_content_type($file['tmp_name']);
        }
        if (!$mime) {
            $mime = $file['type'];
        }
        $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (!isset($allowed[$mime])) {
            http_response_code(400);
            echo json_encode(["message" => "Formato no soportado."]);
            return;
        }
        $ext = $allowed[$mime];
        $uploadDir = __DIR__ . '/../uploads/avatars/';
        if (!file_exists($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }
        $base = preg_replace('/[^A-Za-z0-9_\.-]/', '_', basename($file['name']));
        $name = uniqid() . '_' . $base;
        $target = $uploadDir . $name;
        if (!move_uploaded_file($file['tmp_name'], $target)) {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo guardar el archivo."]);
            return;
        }
        $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/'); // ej: /triunfo-go/backend
        $appBase = preg_replace('#/backend$#', '', $scriptDir);
        if ($appBase === '' || $appBase === '.') {
            $appBase = '';
        }
        $url = $appBase . '/backend/uploads/avatars/' . $name;

        $old = new User($this->db);
        $old->id_usuario = $id;
        $stmt = $old->getOne();
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
            return;
        }
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->user->id_usuario = $id;
        $this->user->nombre = $row['nombre'];
        $this->user->usuario = $row['usuario'];
        $this->user->email = $row['email'];
        $this->user->telefono = $row['telefono'] ?? null;
        $this->user->avatar_url = $url;
        $this->user->preferencias = $row['preferencias'] ?? null;
        if ($this->user->update()) {
            http_response_code(200);
            echo json_encode(["message" => "Avatar actualizado.", "avatar_url" => $url]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo actualizar el avatar."]);
        }
    }

    /**
     * Obtiene todos los usuarios.
     * 
     * @return void
     */
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
                    "nombre_rol" => $nombre_rol,
                    "estado" => $row['estado'] ?? 'activo',
                    "tiene_historial" => !empty($row['tiene_historial'])
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

    /**
     * Obtiene los detalles de un usuario específico.
     * 
     * @param int $id ID del usuario
     * @return void
     */
    public function getOne($id) {
        $this->user->id_usuario = $id;
        $stmt = $this->user->getOne();
        $num = $stmt->rowCount();

        if($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $row['tiene_historial'] = $this->user->hasOperationalHistory($id);
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

    /**
     * Actualiza el perfil del usuario autenticado.
     * Permite cambiar nombre, usuario, email y contraseña.
     * 
     * @param array $tokenData Datos extraídos del token JWT
     * @return void
     */
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

        // Perfil propio: actualizar email, telefono, avatar_url, preferencias
        $newEmail = isset($data->email) ? $data->email : $currentUserData['email'];
        $telefono = isset($data->telefono) ? $data->telefono : $currentUserData['telefono'];
        $avatar = isset($data->avatar_url) ? $data->avatar_url : $currentUserData['avatar_url'];
        $preferencias = isset($data->preferencias) ? (is_string($data->preferencias) ? $data->preferencias : json_encode($data->preferencias)) : $currentUserData['preferencias'];

        if ($newEmail !== '' && $newEmail !== null && !filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["message" => "Correo electrónico inválido."]);
            return;
        }

        $this->user->id_usuario = $id;
        $this->user->nombre = $currentUserData['nombre'];
        $this->user->usuario = $currentUserData['usuario'];
        $this->user->email = $newEmail;
        $this->user->telefono = $telefono;
        $this->user->avatar_url = $avatar;
        $this->user->preferencias = $preferencias;

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

        if (($currentUserData['estado'] ?? 'activo') === 'inactivo') {
            http_response_code(400);
            echo json_encode(["message" => "No se puede editar un usuario inactivo. Actívelo primero desde la lista."]);
            return;
        }

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

    public function delete($id, $tokenData = null) {
        $this->user->id_usuario = $id;
        $stmt = $this->user->getOne();
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
            return;
        }

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $currentUserId = isset($tokenData['id_usuario']) ? (int)$tokenData['id_usuario'] : 0;

        if ($currentUserId > 0 && $currentUserId === (int)$id) {
            http_response_code(400);
            echo json_encode(["message" => "No puede eliminar o desactivar su propia cuenta."]);
            return;
        }

        if (($row['estado'] ?? 'activo') === 'inactivo') {
            http_response_code(400);
            echo json_encode(["message" => "El usuario ya está inactivo. Puede reactivarlo desde la lista."]);
            return;
        }

        $tieneHistorial = $this->user->hasOperationalHistory($id);

        if ($tieneHistorial) {
            if ($this->user->inactivate()) {
                http_response_code(200);
                echo json_encode([
                    "message" => "Usuario inactivado. Tiene ventas, caja o egresos registrados y no puede eliminarse.",
                    "action" => "inactivated",
                    "can_reactivate" => true,
                    "tiene_historial" => true
                ]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo inactivar el usuario."]);
            }
            return;
        }

        if ($this->user->hardDelete()) {
            http_response_code(200);
            echo json_encode([
                "message" => "Usuario eliminado permanentemente.",
                "action" => "deleted"
            ]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo eliminar el usuario."]);
        }
    }

    public function updateStatus($id, $tokenData = null) {
        $data = (array) json_decode(file_get_contents("php://input"), true);
        $estado = $data['estado'] ?? null;

        if (!in_array($estado, ['activo', 'inactivo'], true)) {
            http_response_code(400);
            echo json_encode(["message" => "Estado inválido. Use 'activo' o 'inactivo'."]);
            return;
        }

        $currentUserId = isset($tokenData['id_usuario']) ? (int)$tokenData['id_usuario'] : 0;
        if ($currentUserId > 0 && $currentUserId === (int)$id && $estado === 'inactivo') {
            http_response_code(400);
            echo json_encode(["message" => "No puede desactivar su propia cuenta."]);
            return;
        }

        $this->user->id_usuario = $id;
        $stmt = $this->user->getOne();
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
            return;
        }

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $estadoActual = $row['estado'] ?? 'activo';

        if ($estadoActual === $estado) {
            http_response_code(200);
            echo json_encode([
                "message" => $estado === 'activo' ? "El usuario ya está activo." : "El usuario ya está inactivo.",
                "estado" => $estado
            ]);
            return;
        }

        $ok = $estado === 'activo' ? $this->user->activate() : $this->user->inactivate();
        if ($ok) {
            http_response_code(200);
            echo json_encode([
                "message" => $estado === 'activo' ? "Usuario reactivado correctamente." : "Usuario desactivado correctamente.",
                "estado" => $estado,
                "action" => $estado === 'activo' ? "activated" : "inactivated"
            ]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo actualizar el estado del usuario."]);
        }
    }

    /**
     * Registra un nuevo usuario en el sistema.
     * Valida datos requeridos, duplicidad de usuario y rol válido.
     * 
     * @return void
     */
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

    /**
     * Inicia sesión de usuario.
     * Verifica credenciales y genera token JWT si son correctas.
     * 
     * @return void
     */
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
            if (($row['estado'] ?? 'activo') === 'inactivo') {
                http_response_code(403);
                echo json_encode(["message" => "Usuario inactivo. Contacte al administrador."]);
                return;
            }
            if (password_verify($data->contrasena, $row['contrasena'])) {
                
                // Generar JWT
                $secret_key = $_ENV['JWT_SECRET'];
                if (empty($secret_key)) {
                    http_response_code(500);
                    echo json_encode(["message" => "Error de configuración del servidor (JWT_SECRET)."]);
                    return;
                }
                $scheme = $_SERVER['REQUEST_SCHEME'] ?? (($_SERVER['HTTPS'] ?? '') ? 'https' : 'http');
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
                $appBase = preg_replace('#/backend$#', '', $scriptDir);
                if ($appBase === '' || $appBase === '.') {
                    $appBase = '';
                }
                $origin = $scheme . '://' . $host;
                $issuer_claim = $origin . $appBase;
                $audience_claim = $origin . $appBase;
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

    /**
     * Cierra la sesión del usuario.
     * Invalida el token JWT añadiéndolo a la lista negra.
     * 
     * @return void
     */
    public function logout() {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null);
        if (!$authHeader) {
            $headers = [];
            if (function_exists('getallheaders')) {
                $headers = getallheaders();
            } elseif (function_exists('apache_request_headers')) {
                $headers = apache_request_headers();
            } else {
                foreach ($_SERVER as $key => $value) {
                    if (strncmp($key, 'HTTP_', 5) === 0) {
                        $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
                        $headers[$name] = $value;
                    }
                }
            }
            $authHeader = $headers['Authorization'] ?? ($headers['authorization'] ?? null);
        }
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
            $secret_key = $_ENV['JWT_SECRET'] ?? '';
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

    /**
     * Paso 1 del flujo de recuperación: genera y envía un código de 6 dígitos por correo.
     *
     * Endpoint: POST /password-reset/request
     * Body JSON: { "email": "usuario@ejemplo.com" }
     *
     * El código se guarda hasheado en password_resets, expira a los 15 minutos
     * y solo puede usarse una vez. Si el correo no está registrado, responde
     * igual que en el caso exitoso para no revelar cuentas existentes.
     *
     * @return void
     */
    public function requestPasswordReset() {
        $data = json_decode(file_get_contents("php://input"));

        if (!is_object($data) || empty($data->email)) {
            http_response_code(400);
            echo json_encode(["message" => "Ingrese un correo electrónico válido."]);
            return;
        }

        $email = trim(strtolower($data->email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["message" => "Correo electrónico inválido."]);
            return;
        }

        // Respuesta genérica: misma en éxito y si el email no existe (anti-enumeración).
        $genericOk = [
            "message" => "Si el correo está registrado, recibirás un código de verificación en los próximos minutos."
        ];

        $userRow = $this->user->findByEmail($email);
        if (!$userRow) {
            http_response_code(200);
            echo json_encode($genericOk);
            return;
        }

        include_once __DIR__ . '/../models/PasswordReset.php';
        $passwordReset = new PasswordReset($this->db);

        // Rate limit: máximo 3 solicitudes por email en una ventana de 15 minutos.
        if ($passwordReset->countRecentRequests($email, 15) >= 3) {
            http_response_code(429);
            echo json_encode(["message" => "Demasiados intentos. Espera unos minutos antes de volver a intentar."]);
            return;
        }

        // Código numérico de 6 dígitos; en BD se persiste hasheado (bcrypt).
        $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        if (!$passwordReset->create($email, $code, 15)) {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo generar el código. Intente más tarde."]);
            return;
        }

        include_once __DIR__ . '/../utils/MailService.php';
        $mailService = new MailService();
        $sent = $mailService->sendPasswordResetCode(
            $userRow['email'],
            $userRow['nombre'],
            $code,
            15
        );

        if (!$sent) {
            http_response_code(503);
            $driver = strtolower(trim($_ENV['MAIL_DRIVER'] ?? 'smtp'));
            // Pistas según el driver configurado en backend/.env.
            $hint = ($driver === 'smtp' || $driver === 'mail')
                ? 'Configure MAIL_HOST, MAIL_USERNAME y MAIL_PASSWORD en backend/.env. En Fedora ejecute: sudo setsebool -P httpd_can_network_connect 1'
                : 'Revise que el servidor pueda escribir en backend/logs/mail.log.';
            if ($mailService->getLastError()) {
                $hint .= ' Detalle: ' . $mailService->getLastError();
            }
            echo json_encode(["message" => "No se pudo enviar el correo. " . $hint]);
            return;
        }

        http_response_code(200);
        $response = $genericOk;
        // En desarrollo: indicar dónde leer el código si no hay SMTP real.
        if ($mailService->usedLogFallback()) {
            $logPath = $mailService->getLastLogPath();
            $response['dev_hint'] = 'SELinux bloquea el correo real. Código guardado en ' . ($logPath ?: 'backend/logs/mail.log')
                . '. Para Gmail directo ejecute: sudo setsebool -P httpd_can_network_connect 1';
        } elseif (strtolower(trim($_ENV['MAIL_DRIVER'] ?? '')) === 'log') {
            $logPath = $mailService->getLastLogPath();
            if ($logPath) {
                $response['dev_hint'] = 'Modo desarrollo: el código está en ' . $logPath;
            }
        }
        echo json_encode($response);
    }

    /**
     * Paso 2 del flujo de recuperación: valida el código y actualiza la contraseña.
     *
     * Endpoint: POST /password-reset/confirm
     * Body JSON: {
     *   "email": "...",
     *   "codigo": "123456",
     *   "contrasena": "...",
     *   "contrasena_confirmacion": "..."
     * }
     *
     * verifyAndConsume comprueba el hash, la expiración y marca el código como usado.
     *
     * @return void
     */
    public function resetPassword() {
        $data = json_decode(file_get_contents("php://input"));

        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        $email = isset($data->email) ? trim(strtolower($data->email)) : '';
        $code = isset($data->codigo) ? trim($data->codigo) : '';
        $password = $data->contrasena ?? '';
        $passwordConfirm = $data->contrasena_confirmacion ?? '';

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["message" => "Correo electrónico inválido."]);
            return;
        }

        if (!preg_match('/^\d{6}$/', $code)) {
            http_response_code(400);
            echo json_encode(["message" => "El código debe tener 6 dígitos."]);
            return;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(["message" => "La contraseña debe tener al menos 6 caracteres."]);
            return;
        }

        if ($password !== $passwordConfirm) {
            http_response_code(400);
            echo json_encode(["message" => "Las contraseñas no coinciden."]);
            return;
        }

        include_once __DIR__ . '/../models/PasswordReset.php';
        $passwordReset = new PasswordReset($this->db);

        // Valida hash y expiración; el código queda consumido (un solo uso).
        if (!$passwordReset->verifyAndConsume($email, $code)) {
            http_response_code(400);
            echo json_encode(["message" => "Código inválido o expirado. Solicita uno nuevo."]);
            return;
        }

        $userRow = $this->user->findByEmail($email);
        if (!$userRow) {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
            return;
        }

        if (!$this->user->updatePassword($userRow['id_usuario'], $password)) {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo actualizar la contraseña."]);
            return;
        }

        http_response_code(200);
        echo json_encode(["message" => "Contraseña actualizada correctamente. Ya puedes iniciar sesión."]);
    }
}
?>
