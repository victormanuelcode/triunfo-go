<?php
include_once __DIR__ . '/../models/BoxSession.php';

/**
 * Clase BoxController
 * 
 * Controlador para gestionar las operaciones de caja (apertura, cierre y consulta de estado).
 * Interactúa con el modelo BoxSession.
 */
class BoxController {
    private $db;
    private $boxSession;

    /**
     * Constructor de la clase.
     * 
     * @param PDO $db Conexión a la base de datos.
     */
    public function __construct($db) {
        $this->db = $db;
        $this->boxSession = new BoxSession($db);
    }

    /**
     * Obtiene el estado actual de la caja para un usuario específico.
     * 
     * @return void Retorna JSON con el estado de la sesión o null si no hay sesión abierta.
     */
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
            $row['total_efectivo'] = $summary['total_efectivo'] ? $summary['total_efectivo'] : 0;
            $row['total_tarjeta'] = $summary['total_tarjeta'] ? $summary['total_tarjeta'] : 0;
            $row['total_transferencia'] = $summary['total_transferencia'] ? $summary['total_transferencia'] : 0;
            $row['total_otros'] = $summary['total_otros'] ? $summary['total_otros'] : 0;
            $row['total_egresos'] = $summary['total_egresos'] ? $summary['total_egresos'] : 0;
            $row['egresos_efectivo'] = $summary['egresos_efectivo'] ? $summary['egresos_efectivo'] : 0;
            $row['egresos_tarjeta'] = $summary['egresos_tarjeta'] ? $summary['egresos_tarjeta'] : 0;
            $row['egresos_transferencia'] = $summary['egresos_transferencia'] ? $summary['egresos_transferencia'] : 0;
            $row['egresos_otros'] = $summary['egresos_otros'] ? $summary['egresos_otros'] : 0;
            
            http_response_code(200);
            echo json_encode($row);
        } else {
            http_response_code(200); // OK, pero null (sin sesión)
            echo json_encode(null);
        }
    }

    /**
     * Abre una nueva sesión de caja.
     * Recibe los datos mediante JSON en el cuerpo de la petición.
     * 
     * @return void Retorna JSON con el resultado de la operación.
     */
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
                // Notificación al usuario: caja abierta
                include_once __DIR__ . '/../models/Notification.php';
                try {
                    $notif = new Notification($this->db);
                    $notif->create((int)$this->boxSession->usuario_id, "Caja abierta", "Tu caja ha sido abierta correctamente.", "info");
                } catch (\Throwable $e) {}
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

    /**
     * Cierra la sesión de caja actual.
     * Calcula diferencias entre el monto esperado y el reportado por el cajero.
     * 
     * @return void Retorna JSON con el resumen del cierre.
     */
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

            // Obtener resumen de ventas del sistema para calcular diferencias
            $summary = $this->boxSession->getSummary($data->id_sesion);
            $totalVentasSistema = (float)($summary['total_ventas'] ?? 0);
            $totalEgresosSistema = (float)($summary['total_egresos'] ?? 0);
            
            // Obtener datos de la sesión para el monto de apertura
            $session = $this->boxSession->getById($data->id_sesion);
            if (!$session) {
                http_response_code(404);
                echo json_encode(["message" => "Sesión de caja no encontrada."]);
                return;
            }
            $montoApertura = (float)$session['monto_apertura'];

            $this->boxSession->id_sesion = $data->id_sesion;
            $this->boxSession->monto_cierre = $montoCierre; // Lo que contó el cajero (Total General)

            // Desglose del sistema (Teórico)
            $this->boxSession->total_efectivo = (float)($summary['total_efectivo'] ?? 0);
            $this->boxSession->total_tarjeta = (float)($summary['total_tarjeta'] ?? 0);
            $this->boxSession->total_transferencia = (float)($summary['total_transferencia'] ?? 0);
            $this->boxSession->total_otros = (float)($summary['total_otros'] ?? 0);

            // Calcular diferencia: Monto Cierre (Contado) - (Monto Apertura + Total Ventas - Total Egresos)
            // Total Esperado en Caja = Monto Apertura + Total Ventas - Total Egresos
            $totalEsperado = $montoApertura + $totalVentasSistema - $totalEgresosSistema;
            $this->boxSession->diferencia = $montoCierre - $totalEsperado; 

            if ($this->boxSession->close()) {
                // Notificación al usuario: caja cerrada
                include_once __DIR__ . '/../models/Notification.php';
                try {
                    $notif = new Notification($this->db);
                    $notif->create((int)$session['usuario_id'], "Caja cerrada", "Has cerrado tu caja. Diferencia: " . number_format($this->boxSession->diferencia, 0, ',', '.'), ($this->boxSession->diferencia == 0 ? 'info' : 'warning'));
                } catch (\Throwable $e) {}
                http_response_code(200);
                echo json_encode([
                    "message" => "Caja cerrada exitosamente.",
                    "resumen" => [
                        "sistema_total" => $totalVentasSistema,
                        "sistema_egresos_total" => $totalEgresosSistema,
                        "contado_cajero" => $montoCierre,
                        "diferencia_calculada" => $this->boxSession->diferencia,
                        "desglose" => [
                            "efectivo" => $this->boxSession->total_efectivo,
                            "tarjeta" => $this->boxSession->total_tarjeta,
                            "transferencia" => $this->boxSession->total_transferencia,
                            "egresos_efectivo" => (float)($summary['egresos_efectivo'] ?? 0),
                            "egresos_tarjeta" => (float)($summary['egresos_tarjeta'] ?? 0),
                            "egresos_transferencia" => (float)($summary['egresos_transferencia'] ?? 0),
                            "egresos_otros" => (float)($summary['egresos_otros'] ?? 0)
                        ]
                    ]
                ]);
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
