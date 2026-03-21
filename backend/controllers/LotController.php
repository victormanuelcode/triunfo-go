<?php
include_once __DIR__ . '/../models/ProductLot.php';

class LotController {
    private $db;
    private $lot;

    public function __construct($db) {
        $this->db = $db;
        $this->lot = new ProductLot($db);
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        $productoId = isset($data['producto_id']) ? (int)$data['producto_id'] : 0;
        $cantidad = isset($data['cantidad']) ? (int)$data['cantidad'] : 0;
        $precioVenta = isset($data['precio_venta']) ? (float)$data['precio_venta'] : 0;
        $costoUnitario = isset($data['costo_unitario']) ? (float)$data['costo_unitario'] : 0;
        $proveedorId = isset($data['proveedor_id']) && $data['proveedor_id'] !== '' ? (int)$data['proveedor_id'] : null;
        $numeroLote = isset($data['numero_lote']) && $data['numero_lote'] !== '' ? (string)$data['numero_lote'] : null;

        if ($productoId <= 0 || $cantidad <= 0 || $precioVenta <= 0) {
            http_response_code(400);
            echo json_encode(["message" => "producto_id, cantidad y precio_venta son requeridos."]);
            return;
        }

        try {
            $loteId = $this->lot->createLot($productoId, $cantidad, $precioVenta, $costoUnitario, $proveedorId, $numeroLote);
            http_response_code(201);
            echo json_encode([
                "message" => "Lote creado correctamente.",
                "id_lote" => $loteId
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    public function getByProduct($productId) {
        $productId = (int)$productId;
        if ($productId <= 0) {
            http_response_code(400);
            echo json_encode(["message" => "ID de producto inválido."]);
            return;
        }

        try {
            $stmt = $this->lot->getLotsByProduct($productId);
            $rows = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $rows[] = $row;
            }
            echo json_encode(["data" => $rows]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error consultando lotes."]);
        }
    }
}
?>

