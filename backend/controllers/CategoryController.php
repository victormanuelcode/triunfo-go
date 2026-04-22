<?php
include_once __DIR__ . '/../models/Category.php';

/**
 * Clase CategoryController
 * 
 * Controlador para gestionar las categorías de productos.
 * Permite listar, crear, obtener, actualizar y eliminar categorías.
 */
class CategoryController {
    private $db;
    private $category;

    /**
     * Constructor de la clase.
     * 
     * @param PDO $db Conexión a la base de datos.
     */
    public function __construct($db) {
        $this->db = $db;
        $this->category = new Category($db);
    }

    /**
     * Obtiene todas las categorías registradas.
     * 
     * @return void Retorna JSON con la lista de categorías.
     */
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

    /**
     * Crea una nueva categoría.
     * 
     * @return void Retorna JSON con el resultado de la creación.
     */
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

    /**
     * Obtiene una categoría específica por su ID.
     * 
     * @param int $id ID de la categoría.
     * @return void Retorna JSON con los datos de la categoría.
     */
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

    /**
     * Actualiza una categoría existente.
     * 
     * @param int $id ID de la categoría a actualizar.
     * @return void Retorna JSON con el resultado de la actualización.
     */
    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));
        
        $this->category->id_categoria = $id;

        // Obtener categoría actual
        $oldCategory = new Category($this->db);
        $oldCategory->id_categoria = $id;
        if (!$oldCategory->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Categoría no encontrada."]);
            return;
        }

        $newName = !empty($data->nombre) ? $data->nombre : $oldCategory->nombre;

        if (!empty($newName)) {
            $this->category->nombre = $newName;
            $this->category->descripcion = isset($data->descripcion) ? $data->descripcion : $oldCategory->descripcion;

            if ($this->category->update()) {
                http_response_code(200);
                echo json_encode(["message" => "Categoría actualizada."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo actualizar la categoría."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "El nombre no puede estar vacío."]);
        }
    }

    /**
     * Elimina una categoría.
     * 
     * @param int $id ID de la categoría a eliminar.
     * @return void Retorna JSON con el resultado de la eliminación.
     */
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
