<?php
include_once __DIR__ . '/../models/InventoryMovement.php';

class InventoryController {
    private $db;
    private $movement;

    public function __construct($db) {
        $this->db = $db;
        $this->movement = new InventoryMovement($db);
    }

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