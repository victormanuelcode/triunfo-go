<?php
include_once __DIR__ . '/../models/Expense.php';
include_once __DIR__ . '/../models/BoxSession.php';

/**
 * Controlador para egresos (gastos).
 * Permite registrar y consultar egresos, opcionalmente ligados a una sesión de caja.
 */
class ExpenseController {
    private $db;
    private $expense;
    private $boxSession;

    public function __construct($db) {
        $this->db = $db;
        $this->expense = new Expense($db);
        $this->boxSession = new BoxSession($db);
    }

    public function getAll(array $tokenData) {
        $filters = [
            'search' => $_GET['search'] ?? null,
            'from' => $_GET['from'] ?? null,
            'to' => $_GET['to'] ?? null,
            'metodo_pago' => $_GET['metodo_pago'] ?? null,
            'sesion_id' => $_GET['sesion_id'] ?? null,
        ];

        // Admin puede filtrar por usuario_id; cajero solo ve los suyos
        if (($tokenData['rol_id'] ?? null) == 1) {
            if (isset($_GET['usuario_id']) && $_GET['usuario_id'] !== '') {
                $filters['usuario_id'] = (int)$_GET['usuario_id'];
            }
        } else {
            $filters['usuario_id'] = (int)($tokenData['id_usuario'] ?? 0);
        }

        $stmt = $this->expense->read($filters);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($items);
    }

    public function getOne($id, array $tokenData) {
        $this->expense->id_egreso = (int)$id;
        $row = $this->expense->readOne();

        if (!$row) {
            http_response_code(404);
            echo json_encode(["message" => "Egreso no encontrado."]);
            return;
        }

        // Permisos: admin o dueño del egreso
        if (($tokenData['rol_id'] ?? null) != 1 && (int)($row['usuario_id'] ?? 0) !== (int)($tokenData['id_usuario'] ?? 0)) {
            http_response_code(403);
            echo json_encode(["message" => "Acceso prohibido."]);
            return;
        }

        echo json_encode($row);
    }

    public function create(array $tokenData) {
        $data = json_decode(file_get_contents("php://input"));
        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        $concepto = trim((string)($data->concepto ?? ''));
        $monto = isset($data->monto) ? (float)$data->monto : null;

        if ($concepto === '' || !is_numeric($monto) || $monto <= 0) {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. Concepto y monto (>0) son obligatorios."]);
            return;
        }

        $metodo = (string)($data->metodo_pago ?? 'efectivo');
        $allowedMethods = ['efectivo', 'transferencia', 'tarjeta', 'otros'];
        if (!in_array($metodo, $allowedMethods, true)) {
            http_response_code(400);
            echo json_encode(["message" => "Método de pago inválido."]);
            return;
        }

        $usuarioId = (int)($tokenData['id_usuario'] ?? 0);
        if ($usuarioId <= 0) {
            http_response_code(401);
            echo json_encode(["message" => "Usuario no autenticado."]);
            return;
        }

        $sesionId = isset($data->sesion_id) ? (int)$data->sesion_id : null;
        if ($sesionId) {
            $session = $this->boxSession->getById($sesionId);
            if (!$session) {
                http_response_code(400);
                echo json_encode(["message" => "Sesión de caja inválida."]);
                return;
            }
            // Si no es admin, solo puede registrar en su propia sesión abierta
            if (($tokenData['rol_id'] ?? null) != 1) {
                if ((int)$session['usuario_id'] !== $usuarioId || ($session['estado'] ?? '') !== 'abierta') {
                    http_response_code(403);
                    echo json_encode(["message" => "No tiene permisos para registrar egresos en esa caja."]);
                    return;
                }
            }
        } else {
            // Si no se envía sesión, intentar ligar a la sesión abierta del usuario (si existe)
            $stmt = $this->boxSession->getCurrentSession($usuarioId);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row && isset($row['id_sesion'])) {
                $sesionId = (int)$row['id_sesion'];
            }
        }

        $this->expense->fecha = isset($data->fecha) && trim((string)$data->fecha) !== '' ? (string)$data->fecha : null;
        $this->expense->concepto = $concepto;
        $this->expense->descripcion = isset($data->descripcion) ? (string)$data->descripcion : null;
        $this->expense->monto = $monto;
        $this->expense->metodo_pago = $metodo;
        $this->expense->usuario_id = $usuarioId;
        $this->expense->sesion_id = $sesionId;

        if ($this->expense->create()) {
            http_response_code(201);
            echo json_encode(["message" => "Egreso creado exitosamente.", "id_egreso" => $this->expense->id_egreso]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo crear el egreso."]);
        }
    }

    public function update($id, array $tokenData) {
        $data = json_decode(file_get_contents("php://input"));
        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        $this->expense->id_egreso = (int)$id;
        $current = $this->expense->readOne();
        if (!$current) {
            http_response_code(404);
            echo json_encode(["message" => "Egreso no encontrado."]);
            return;
        }

        $isAdmin = (($tokenData['rol_id'] ?? null) == 1);
        $userId = (int)($tokenData['id_usuario'] ?? 0);
        if (!$isAdmin && (int)($current['usuario_id'] ?? 0) !== $userId) {
            http_response_code(403);
            echo json_encode(["message" => "Acceso prohibido."]);
            return;
        }

        $concepto = isset($data->concepto) ? trim((string)$data->concepto) : (string)($current['concepto'] ?? '');
        $monto = isset($data->monto) ? (float)$data->monto : (float)($current['monto'] ?? 0);
        if ($concepto === '' || $monto <= 0) {
            http_response_code(400);
            echo json_encode(["message" => "Concepto y monto (>0) son obligatorios."]);
            return;
        }

        $metodo = isset($data->metodo_pago) ? (string)$data->metodo_pago : (string)($current['metodo_pago'] ?? 'efectivo');
        $allowedMethods = ['efectivo', 'transferencia', 'tarjeta', 'otros'];
        if (!in_array($metodo, $allowedMethods, true)) {
            http_response_code(400);
            echo json_encode(["message" => "Método de pago inválido."]);
            return;
        }

        $sesionId = array_key_exists('sesion_id', (array)$data) ? $data->sesion_id : ($current['sesion_id'] ?? null);
        $sesionId = ($sesionId === '' || $sesionId === null) ? null : (int)$sesionId;
        if ($sesionId) {
            $session = $this->boxSession->getById((int)$sesionId);
            if (!$session) {
                http_response_code(400);
                echo json_encode(["message" => "Sesión de caja inválida."]);
                return;
            }
            if (!$isAdmin) {
                if ((int)$session['usuario_id'] !== $userId || ($session['estado'] ?? '') !== 'abierta') {
                    http_response_code(403);
                    echo json_encode(["message" => "No tiene permisos para asociar este egreso a esa caja."]);
                    return;
                }
            }
        }

        $this->expense->fecha = isset($data->fecha) ? (string)$data->fecha : (string)($current['fecha'] ?? null);
        $this->expense->concepto = $concepto;
        $this->expense->descripcion = isset($data->descripcion) ? (string)$data->descripcion : ($current['descripcion'] ?? null);
        $this->expense->monto = $monto;
        $this->expense->metodo_pago = $metodo;
        $this->expense->sesion_id = $sesionId;

        if ($this->expense->update()) {
            http_response_code(200);
            echo json_encode(["message" => "Egreso actualizado exitosamente."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo actualizar el egreso."]);
        }
    }

    public function delete($id, array $tokenData) {
        // Por seguridad: borrar solo admin
        if (($tokenData['rol_id'] ?? null) != 1) {
            http_response_code(403);
            echo json_encode(["message" => "Acceso prohibido."]);
            return;
        }

        $this->expense->id_egreso = (int)$id;
        if ($this->expense->delete()) {
            http_response_code(200);
            echo json_encode(["message" => "Egreso eliminado exitosamente."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo eliminar el egreso."]);
        }
    }
}
?>

