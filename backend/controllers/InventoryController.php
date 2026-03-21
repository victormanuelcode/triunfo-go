<?php
include_once __DIR__ . '/../models/InventoryMovement.php';

/**
 * Clase InventoryController
 * 
 * Controlador para gestionar los movimientos de inventario.
 * Permite consultar el historial de entradas y salidas de productos.
 */
class InventoryController {
    private $db;
    private $movement;

    /**
     * Constructor de la clase.
     * 
     * @param PDO $db Conexión a la base de datos.
     */
    public function __construct($db) {
        $this->db = $db;
        $this->movement = new InventoryMovement($db);
    }

    /**
     * Obtiene todos los movimientos de inventario registrados.
     * Soporta filtros por GET: from, to, type, search
     * 
     * @return void Retorna JSON con la lista de movimientos.
     */
    public function getAll() {
        $from = isset($_GET['from']) ? $_GET['from'] : null;
        $to = isset($_GET['to']) ? $_GET['to'] : null;
        $type = isset($_GET['type']) ? $_GET['type'] : null;
        $search = isset($_GET['search']) ? $_GET['search'] : null;

        $stmt = $this->movement->getAll($from, $to, $type, $search);
        $num = $stmt->rowCount();

        if ($num > 0) {
            $movements_arr = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($movements_arr, $row);
            }
            http_response_code(200);
            echo json_encode($movements_arr);
        } else {
            http_response_code(200);
            echo json_encode([]);
        }
    }

    /**
     * Obtiene estadísticas de movimientos (KPIs).
     */
    public function getSummary() {
        $stats = $this->movement->getSummaryStats();
        http_response_code(200);
        echo json_encode($stats);
    }

    /**
     * Realiza un ajuste manual de stock (entrada o salida).
     * 
     * @return void
     */
    public function adjust() {
        // Obtener datos del body
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->producto_id) || !isset($data->cantidad) || !isset($data->tipo) || !isset($data->razon) || !isset($data->lote_id)) {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. Se requiere producto_id, lote_id, cantidad, tipo y razon."]);
            return;
        }

        $producto_id = $data->producto_id;
        $lote_id = (int)$data->lote_id;
        $cantidad = (int)$data->cantidad;
        $tipo = $data->tipo; // 'entrada' o 'salida'
        $razon = $data->razon;

        if ($lote_id <= 0) {
            http_response_code(400);
            echo json_encode(["message" => "lote_id inválido."]);
            return;
        }

        if ($cantidad <= 0) {
            http_response_code(400);
            echo json_encode(["message" => "La cantidad debe ser mayor a 0."]);
            return;
        }

        if ($tipo !== 'entrada' && $tipo !== 'salida') {
            http_response_code(400);
            echo json_encode(["message" => "Tipo de movimiento inválido."]);
            return;
        }

        // Iniciar transacción
        try {
            $this->db->beginTransaction();

            include_once __DIR__ . '/../models/ProductLot.php';
            $lotModel = new ProductLot($this->db);

            $lot = $lotModel->getLotById($lote_id);
            if (!$lot) {
                throw new Exception("Lote no encontrado.");
            }
            if ((int)$lot['producto_id'] !== (int)$producto_id) {
                throw new Exception("El lote no pertenece al producto indicado.");
            }

            if ($tipo === 'entrada') {
                $lotModel->restoreLot($lote_id, $cantidad);
            } else {
                $lotModel->consumeLot($lote_id, $cantidad);
            }

            include_once __DIR__ . '/../models/Product.php';
            $product = new Product($this->db);
            $product->id_producto = $producto_id;
            
            if (!$product->updateStock($cantidad, $tipo)) {
                throw new Exception("No se pudo actualizar el stock. Verifique si hay suficiente stock para la salida.");
            }

            // 2. Registrar movimiento
            $this->movement->producto_id = $producto_id;
            $this->movement->lote_id = $lote_id;
            $this->movement->tipo = $tipo;
            $this->movement->cantidad = $cantidad;
            $this->movement->descripcion = "Ajuste Manual: " . $razon;
            $this->movement->referencia = "AJUSTE";
            
            if (!$this->movement->create()) {
                throw new Exception("Error al registrar el movimiento.");
            }

            $this->db->commit();
            
            http_response_code(200);
            echo json_encode(["message" => "Ajuste de inventario realizado con éxito."]);

        } catch (Exception $e) {
            $this->db->rollBack();
            http_response_code(503);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }
}
