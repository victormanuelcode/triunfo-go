<?php
include_once __DIR__ . '/../models/UnitMeasure.php';

class UnitMeasureController {
    private $db;
    private $unit;

    public function __construct($db) {
        $this->db = $db;
        $this->unit = new UnitMeasure($db);
    }

    // Obtener todas las unidades
    public function getAll() {
        $stmt = $this->unit->read();
        $num = $stmt->rowCount();

        if ($num > 0) {
            $units_arr = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                extract($row);
                $unit_item = [
                    "id_unidad" => $id_unidad,
                    "nombre" => $nombre,
                    "abreviatura" => $abreviatura
                ];
                array_push($units_arr, $unit_item);
            }
            http_response_code(200);
            echo json_encode($units_arr);
        } else {
            http_response_code(200); // 200 OK pero array vacío
            echo json_encode([]);
        }
    }

    // Crear una unidad
    public function create() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->nombre) && !empty($data->abreviatura)) {
            $this->unit->nombre = $data->nombre;
            $this->unit->abreviatura = $data->abreviatura;

            if ($this->unit->create()) {
                http_response_code(201);
                echo json_encode(["message" => "Unidad creada exitosamente."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo crear la unidad."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. Se requiere nombre y abreviatura."]);
        }
    }

    // Obtener una unidad por ID
    public function getOne($id) {
        $this->unit->id_unidad = $id;
        if ($this->unit->readOne()) {
            $unit_arr = [
                "id_unidad" => $this->unit->id_unidad,
                "nombre" => $this->unit->nombre,
                "abreviatura" => $this->unit->abreviatura
            ];
            http_response_code(200);
            echo json_encode($unit_arr);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Unidad no encontrada."]);
        }
    }

    // Actualizar una unidad
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));
        
        $this->unit->id_unidad = $id;

        if (!empty($data->nombre) && !empty($data->abreviatura)) {
            $this->unit->nombre = $data->nombre;
            $this->unit->abreviatura = $data->abreviatura;

            if ($this->unit->update()) {
                http_response_code(200);
                echo json_encode(["message" => "Unidad actualizada."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo actualizar la unidad."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos."]);
        }
    }

    // Eliminar una unidad
    public function delete($id) {
        $this->unit->id_unidad = $id;

        if ($this->unit->delete()) {
            http_response_code(200);
            echo json_encode(["message" => "Unidad eliminada."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo eliminar la unidad. Posiblemente esté asociada a productos."]);
        }
    }
}
?>