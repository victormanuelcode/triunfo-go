<?php
include_once __DIR__ . '/../models/Product.php';

class ProductController {
    private $db;
    private $product;

    public function __construct($db) {
        $this->db = $db;
        $this->product = new Product($db);
    }

    public function getAll() {
        $stmt = $this->product->read();
        $products_arr = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($products_arr, $row);
        }
        
        echo json_encode($products_arr);
    }

    public function getOne($id) {
        $this->product->id_producto = $id;
        if ($this->product->readOne()) {
            $product_arr = [
                "id_producto" => $this->product->id_producto,
                "nombre" => $this->product->nombre,
                "descripcion" => $this->product->descripcion,
                "categoria_id" => $this->product->categoria_id,
                "unidad_medida_id" => $this->product->unidad_medida_id,
                "precio_compra" => $this->product->precio_compra,
                "precio_venta" => $this->product->precio_venta,
                "stock_actual" => $this->product->stock_actual,
                "stock_minimo" => $this->product->stock_minimo,
                "imagen" => $this->product->imagen,
                "estado" => $this->product->estado,
                "creado_en" => $this->product->creado_en
            ];
            echo json_encode($product_arr);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Producto no encontrado."]);
        }
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->nombre) && !empty($data->precio_venta)) {
            $this->product->nombre = $data->nombre;
            $this->product->descripcion = isset($data->descripcion) ? $data->descripcion : null;
            $this->product->categoria_id = isset($data->categoria_id) ? $data->categoria_id : null;
            $this->product->unidad_medida_id = isset($data->unidad_medida_id) ? $data->unidad_medida_id : null;
            $this->product->precio_compra = isset($data->precio_compra) ? $data->precio_compra : 0;
            $this->product->precio_venta = $data->precio_venta;
            $this->product->stock_actual = isset($data->stock_actual) ? $data->stock_actual : 0;
            $this->product->stock_minimo = isset($data->stock_minimo) ? $data->stock_minimo : 5;
            $this->product->imagen = isset($data->imagen) ? $data->imagen : null;
            $this->product->estado = isset($data->estado) ? $data->estado : 'activo';

            if ($this->product->create()) {
                http_response_code(201);
                echo json_encode(["message" => "Producto creado exitosamente."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo crear el producto."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. Se requiere nombre y precio de venta."]);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));
        $this->product->id_producto = $id;

        if (!empty($data->nombre)) {
            $this->product->nombre = $data->nombre;
            $this->product->descripcion = isset($data->descripcion) ? $data->descripcion : null;
            $this->product->categoria_id = isset($data->categoria_id) ? $data->categoria_id : null;
            $this->product->unidad_medida_id = isset($data->unidad_medida_id) ? $data->unidad_medida_id : null;
            $this->product->precio_compra = isset($data->precio_compra) ? $data->precio_compra : 0;
            $this->product->precio_venta = isset($data->precio_venta) ? $data->precio_venta : 0;
            $this->product->stock_actual = isset($data->stock_actual) ? $data->stock_actual : 0;
            $this->product->stock_minimo = isset($data->stock_minimo) ? $data->stock_minimo : 0;
            $this->product->imagen = isset($data->imagen) ? $data->imagen : null;
            $this->product->estado = isset($data->estado) ? $data->estado : 'activo';

            if ($this->product->update()) {
                http_response_code(200);
                echo json_encode(["message" => "Producto actualizado."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo actualizar el producto."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos."]);
        }
    }

    public function delete($id) {
        $this->product->id_producto = $id;
        if ($this->product->delete()) {
            http_response_code(200);
            echo json_encode(["message" => "Producto eliminado."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo eliminar el producto."]);
        }
    }
}
?>
