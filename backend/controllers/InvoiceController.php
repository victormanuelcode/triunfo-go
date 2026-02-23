<?php
include_once __DIR__ . '/../models/Invoice.php';

class InvoiceController {
    private $db;
    private $invoice;

    public function __construct($db) {
        $this->db = $db;
        $this->invoice = new Invoice($db);
    }

    public function getAll() {
        // Paginación
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        
        if ($limit < 1) $limit = 10;
        if ($page < 1) $page = 1;

        $offset = ($page - 1) * $limit;

        $stmt = $this->invoice->read($limit, $offset);
        $invoices_arr = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($invoices_arr, $row);
        }
        
        // Metadata
        $total_rows = $this->invoice->count();
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
    }

    public function getOne($id) {
        $this->invoice->id_factura = $id;
        if ($this->invoice->readOne()) {
            $invoice_arr = [
                "id_factura" => $this->invoice->id_factura,
                "numero_factura" => $this->invoice->numero_factura,
                "fecha" => $this->invoice->fecha,
                "cliente_nombre" => $this->invoice->cliente_nombre,
                "usuario_nombre" => $this->invoice->usuario_nombre,
                "total" => $this->invoice->total,
                "metodo_pago" => $this->invoice->metodo_pago,
                "observaciones" => $this->invoice->observaciones,
                "detalles" => $this->invoice->detalles
            ];
            echo json_encode($invoice_arr);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Factura no encontrada."]);
        }
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        if (!empty($data['items']) && isset($data['total'])) {
            $total = (float) $data['total'];
            if ($total <= 0) {
                http_response_code(400);
                echo json_encode(["message" => "El total de la venta debe ser mayor a cero."]);
                return;
            }

            foreach ($data['items'] as $item) {
                if (!isset($item['producto_id'], $item['cantidad'], $item['precio_unitario'])) {
                    http_response_code(400);
                    echo json_encode(["message" => "Cada ítem debe incluir producto_id, cantidad y precio_unitario."]);
                    return;
                }
                $cantidad = (int) $item['cantidad'];
                $precioUnitario = (float) $item['precio_unitario'];
                if ($cantidad <= 0 || $precioUnitario <= 0) {
                    http_response_code(400);
                    echo json_encode(["message" => "Cantidad y precio unitario deben ser mayores a cero."]);
                    return;
                }
            }

            $this->invoice->cliente_id = isset($data['cliente_id']) ? $data['cliente_id'] : null; // Nullable por ahora
            $this->invoice->usuario_id = isset($data['usuario_id']) ? $data['usuario_id'] : null; // Nuevo: trazabilidad
            $this->invoice->sesion_id = isset($data['sesion_id']) ? $data['sesion_id'] : null;
            $this->invoice->total = $total;
            $this->invoice->metodo_pago = isset($data['metodo_pago']) ? $data['metodo_pago'] : 'efectivo';

            // Validar metodo de pago
            $metodosValidos = ['efectivo', 'tarjeta', 'transferencia', 'otros'];
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
                    "numero_factura" => $this->invoice->numero_factura
                ]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo registrar la venta. Verifique stock o datos."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. Se requieren items y total."]);
        }
    }
}
?>
