<?php
include_once __DIR__ . '/../models/Invoice.php';
include_once __DIR__ . '/../models/BoxSession.php';

/**
 * Clase InvoiceController
 * 
 * Controlador para gestionar las facturas de venta.
 * Permite listar, consultar detalles y crear nuevas ventas.
 */
class InvoiceController {
    private $db;
    private $invoice;

    /**
     * Constructor de la clase.
     * 
     * @param PDO $db Conexión a la base de datos.
     */
    public function __construct($db) {
        $this->db = $db;
        $this->invoice = new Invoice($db);
    }

    /**
     * Obtiene el historial de facturas con paginación.
     * Acepta parámetros GET 'limit' y 'page'.
     * 
     * @return void Retorna JSON con los datos paginados y metadatos.
     */
    public function getAll() {
        try {
            // Paginación
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $usuarioId = isset($_GET['usuario_id']) ? (int)$_GET['usuario_id'] : null;
            
            if ($limit < 1) $limit = 10;
            if ($page < 1) $page = 1;
            if ($usuarioId !== null && $usuarioId < 1) $usuarioId = null;

            $offset = ($page - 1) * $limit;

            $stmt = $this->invoice->read($limit, $offset, $usuarioId);
            $invoices_arr = [];
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($invoices_arr, $row);
            }
            
            // Metadata
            $total_rows = $this->invoice->count($usuarioId);
            $total_pages = ceil($total_rows / $limit);

            echo json_encode([
                "data" => $invoices_arr,
                "meta" => [
                    "current_page" => $page,
                    "limit" => $limit,
                    "total_items" => $total_rows,
                    "total_pages" => $total_pages
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            error_log("Error en InvoiceController::getAll: " . $e->getMessage());
            echo json_encode([
                "data" => [],
                "meta" => [
                    "current_page" => 1,
                    "limit" => 10,
                    "total_items" => 0,
                    "total_pages" => 0
                ],
                "error" => $e->getMessage()
            ]);
        }
    }

    /**
     * Obtiene los detalles de una factura específica.
     * Incluye información del cliente, usuario y productos vendidos.
     * 
     * @param int $id ID de la factura a consultar.
     * @return void Retorna JSON con los detalles de la factura.
     */
    public function getOne($id) {
        $this->invoice->id_factura = $id;
        if ($this->invoice->readOne()) {
            $invoice_arr = [
                "id_factura" => $this->invoice->id_factura,
                "numero_factura" => $this->invoice->numero_factura,
                "fecha" => $this->invoice->fecha,
                "cliente_nombre" => $this->invoice->cliente_nombre,
                "cliente_documento" => $this->invoice->cliente_documento,
                "cliente_direccion" => $this->invoice->cliente_direccion,
                "cliente_telefono" => $this->invoice->cliente_telefono,
                "cliente_email" => $this->invoice->cliente_email,
                "usuario_nombre" => $this->invoice->usuario_nombre,
                "total" => $this->invoice->total,
                "monto_recibido" => $this->invoice->monto_recibido,
                "metodo_pago" => $this->invoice->metodo_pago,
                "observaciones" => $this->invoice->observaciones,
                "estado" => $this->invoice->estado,
                "detalles" => $this->invoice->detalles
            ];
            echo json_encode($invoice_arr);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Factura no encontrada."]);
        }
    }

    /**
     * Anula una factura existente.
     * 
     * @param int $id ID de la factura a anular.
     */
    public function annul($id) {
        $this->invoice->id_factura = $id;

        // Cargar factura para verificar existencia y estado
        if (!$this->invoice->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Factura no encontrada."]);
            return;
        }

        try {
            if ($this->invoice->annul()) {
                http_response_code(200);
                echo json_encode(["message" => "Factura anulada correctamente."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo anular la factura."]);
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    /**
     * Crea una nueva factura de venta.
     * Valida los datos de entrada, stock y método de pago antes de procesar.
     * 
     * @return void Retorna JSON con el resultado de la venta.
     */
    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        if (!empty($data['items'])) {
            foreach ($data['items'] as $item) {
                if (!is_array($item)) {
                    http_response_code(400);
                    echo json_encode(["message" => "Cada ítem debe ser un objeto válido."]);
                    return;
                }

                if (isset($item['lotes']) && is_array($item['lotes']) && !empty($item['lotes'])) {
                    foreach ($item['lotes'] as $sel) {
                        if (!is_array($sel) || !isset($sel['lote_id'], $sel['cantidad'])) {
                            http_response_code(400);
                            echo json_encode(["message" => "Cada lote debe incluir lote_id y cantidad."]);
                            return;
                        }
                        $cantSel = round((float)$sel['cantidad'], 3);
                        $loteId = (int)$sel['lote_id'];
                        if ($cantSel <= 0 || $loteId <= 0) {
                            http_response_code(400);
                            echo json_encode(["message" => "lote_id y cantidad deben ser mayores a cero."]);
                            return;
                        }
                    }
                    continue;
                }

                if (!isset($item['producto_id'], $item['cantidad'])) {
                    http_response_code(400);
                    echo json_encode(["message" => "Cada ítem debe incluir producto_id y cantidad."]);
                    return;
                }
                $cantidad = round((float)$item['cantidad'], 3);
                $productoId = (int)$item['producto_id'];
                if ($cantidad <= 0 || $productoId <= 0) {
                    http_response_code(400);
                    echo json_encode(["message" => "producto_id y cantidad deben ser mayores a cero."]);
                    return;
                }
            }

            $this->invoice->cliente_id = isset($data['cliente_id']) ? $data['cliente_id'] : null; // Nullable por ahora
            $this->invoice->usuario_id = isset($data['usuario_id']) ? $data['usuario_id'] : null; // Nuevo: trazabilidad

            if (empty($this->invoice->usuario_id)) {
                http_response_code(400);
                echo json_encode(["message" => "usuario_id es requerido."]);
                return;
            }
            
            // Validar sesión de caja activa
            $boxSession = new BoxSession($this->db);
            $stmtSession = $boxSession->getCurrentSession($this->invoice->usuario_id);
            $currentSession = $stmtSession->fetch(PDO::FETCH_ASSOC);

            if (!$currentSession) {
                http_response_code(400);
                echo json_encode(["message" => "No hay una caja abierta para este usuario. Por favor abra caja antes de realizar una venta."]);
                return;
            }

            $this->invoice->sesion_id = $currentSession['id_sesion'];
            $this->invoice->total = isset($data['total']) ? (float)$data['total'] : 0;
            $this->invoice->metodo_pago = isset($data['metodo_pago']) ? $data['metodo_pago'] : 'efectivo';

            // Validar metodo de pago
            $metodosValidos = $this->invoice->getAllowedPaymentMethods() ?? ['efectivo', 'tarjeta', 'transferencia', 'otros', 'credito'];
            if (!in_array($this->invoice->metodo_pago, $metodosValidos)) {
                http_response_code(400);
                echo json_encode(["message" => "Método de pago inválido. Permitidos: " . implode(', ', $metodosValidos)]);
                return;
            }
            $this->invoice->observaciones = isset($data['observaciones']) ? $data['observaciones'] : '';
            $this->invoice->items = $data['items'];

            if ($this->invoice->create()) {
                http_response_code(201);
                echo json_encode([
                    "message" => "Venta registrada exitosamente.",
                    "id_factura" => $this->invoice->id_factura,
                    "numero_factura" => $this->invoice->numero_factura,
                    "total" => $this->invoice->total
                ]);
            } else {
                $message = $this->invoice->last_error ?: "No se pudo registrar la venta. Verifique stock o datos.";
                http_response_code(400);
                echo json_encode(["message" => $message]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. Se requieren items."]);
        }
    }

    public function quote() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        if (empty($data['items']) || !is_array($data['items'])) {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. Se requieren items."]);
            return;
        }

        $usuarioId = isset($data['usuario_id']) ? $data['usuario_id'] : null;
        if (empty($usuarioId)) {
            http_response_code(400);
            echo json_encode(["message" => "usuario_id es requerido."]);
            return;
        }

        $boxSession = new BoxSession($this->db);
        $stmtSession = $boxSession->getCurrentSession($usuarioId);
        $currentSession = $stmtSession->fetch(PDO::FETCH_ASSOC);
        if (!$currentSession) {
            http_response_code(400);
            echo json_encode(["message" => "No hay una caja abierta para este usuario."]);
            return;
        }

        try {
            $quote = $this->invoice->quoteItems($data['items']);
            echo json_encode([
                "total" => $quote['total'],
                "lines" => $quote['lines']
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }
}
?>
