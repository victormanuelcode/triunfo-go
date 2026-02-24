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
     * 
     * @return void Retorna JSON con la lista de movimientos.
     */
    public function getAll() {
        $stmt = $this->movement->getAll();
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
}
?>