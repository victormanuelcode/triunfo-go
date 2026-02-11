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
        $stmt = $this->invoice->read();
        $invoices_arr = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($invoices_arr, $row);
        }
        
        echo json_encode($invoices_arr);
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

        if (!empty($data['items']) && !empty($data['total'])) {
            $this->invoice->cliente_id = isset($data['cliente_id']) ? $data['cliente_id'] : null; // Nullable por ahora
            $this->invoice->usuario_id = isset($data['usuario_id']) ? $data['usuario_id'] : null; // Nuevo: trazabilidad
            $this->invoice->sesion_id = isset($data['sesion_id']) ? $data['sesion_id'] : null;
            $this->invoice->total = $data['total'];
            $this->invoice->metodo_pago = isset($data['metodo_pago']) ? $data['metodo_pago'] : 'efectivo';
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
