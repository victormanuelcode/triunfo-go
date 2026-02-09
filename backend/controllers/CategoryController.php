<?php
include_once __DIR__ . '/../models/Category.php';

class CategoryController {
    private $db;
    private $category;

    public function __construct($db) {
        $this->db = $db;
        $this->category = new Category($db);
    }

    // Obtener todas las categorías
    public function getAll() {
        $stmt = $this->category->read();
        $num = $stmt->rowCount();

        if ($num > 0) {
            $categories_arr = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                extract($row);
                $category_item = [
                    "id_categoria" => $id_categoria,
                    "nombre" => $nombre,
                    "descripcion" => $descripcion,
                    "creado_en" => $creado_en
                ];
                array_push($categories_arr, $category_item);
            }
            http_response_code(200);
            echo json_encode($categories_arr);
        } else {
            http_response_code(200); // 200 OK pero array vacío
            echo json_encode([]);
        }
    }

    // Crear una categoría
    public function create() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->nombre)) {
            $this->category->nombre = $data->nombre;
            $this->category->descripcion = isset($data->descripcion) ? $data->descripcion : null;

            if ($this->category->create()) {
                http_response_code(201);
                echo json_encode(["message" => "Categoría creada exitosamente."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo crear la categoría."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. Se requiere nombre."]);
        }
    }

    // Obtener una categoría por ID
    public function getOne($id) {
        $this->category->id_categoria = $id;
        if ($this->category->readOne()) {
            $category_arr = [
                "id_categoria" => $this->category->id_categoria,
                "nombre" => $this->category->nombre,
                "descripcion" => $this->category->descripcion,
                "creado_en" => $this->category->creado_en
            ];
            http_response_code(200);
            echo json_encode($category_arr);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Categoría no encontrada."]);
        }
    }

    // Actualizar una categoría
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));
        
        $this->category->id_categoria = $id;

        if (!empty($data->nombre)) {
            $this->category->nombre = $data->nombre;
            $this->category->descripcion = isset($data->descripcion) ? $data->descripcion : null;

            if ($this->category->update()) {
                http_response_code(200);
                echo json_encode(["message" => "Categoría actualizada."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo actualizar la categoría."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos."]);
        }
    }

    // Eliminar una categoría
    public function delete($id) {
        $this->category->id_categoria = $id;

        if ($this->category->delete()) {
            http_response_code(200);
            echo json_encode(["message" => "Categoría eliminada."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo eliminar la categoría."]);
        }
    }
}
?>
