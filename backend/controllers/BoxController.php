<?php
include_once __DIR__ . '/../models/BoxSession.php';

class BoxController {
    private $db;
    private $boxSession;

    public function __construct($db) {
        $this->db = $db;
        $this->boxSession = new BoxSession($db);
    }

    public function getStatus() {
        if (!isset($_GET['usuario_id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Falta usuario_id"]);
            return;
        }

        $stmt = $this->boxSession->getCurrentSession($_GET['usuario_id']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            // Calcular total ventas actual
            $summary = $this->boxSession->getSummary($row['id_sesion']);
            $row['total_ventas'] = $summary['total_ventas'] ? $summary['total_ventas'] : 0;
            
            http_response_code(200);
            echo json_encode($row);
        } else {
            http_response_code(200); // OK, pero null (sin sesión)
            echo json_encode(null);
        }
    }

    public function open() {
        $data = json_decode(file_get_contents("php://input"));

        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        if (!empty($data->usuario_id) && isset($data->monto_apertura)) {
            $montoApertura = (float) $data->monto_apertura;
            if ($montoApertura < 0) {
                http_response_code(400);
                echo json_encode(["message" => "El monto de apertura no puede ser negativo."]);
                return;
            }
            // Verificar si ya tiene sesión abierta
            $stmt = $this->boxSession->getCurrentSession($data->usuario_id);
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(["message" => "El usuario ya tiene una caja abierta."]);
                return;
            }

            $this->boxSession->usuario_id = $data->usuario_id;
            $this->boxSession->monto_apertura = $montoApertura;

            if ($this->boxSession->open()) {
                http_response_code(201);
                echo json_encode(["message" => "Caja abierta exitosamente.", "id_sesion" => $this->boxSession->id_sesion]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Error al abrir la caja."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos."]);
        }
    }

    public function close() {
        $data = json_decode(file_get_contents("php://input"));

        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        if (!empty($data->id_sesion) && isset($data->monto_cierre)) {
            $montoCierre = (float) $data->monto_cierre;
            if ($montoCierre < 0) {
                http_response_code(400);
                echo json_encode(["message" => "El monto de cierre no puede ser negativo."]);
                return;
            }

            $this->boxSession->id_sesion = $data->id_sesion;
            $this->boxSession->monto_cierre = $montoCierre;

            if ($this->boxSession->close()) {
                http_response_code(200);
                echo json_encode(["message" => "Caja cerrada exitosamente."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Error al cerrar la caja."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos."]);
        }
    }
}
