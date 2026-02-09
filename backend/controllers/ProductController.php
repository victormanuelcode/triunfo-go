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
        $data = $this->processRequestData();

        if (!empty($data['nombre']) && !empty($data['precio_venta'])) {
            $this->product->nombre = $data['nombre'];
            $this->product->descripcion = $data['descripcion'] ?? null;
            $this->product->categoria_id = $data['categoria_id'] ?? null;
            $this->product->unidad_medida_id = $data['unidad_medida_id'] ?? null;
            $this->product->precio_compra = $data['precio_compra'] ?? 0;
            $this->product->precio_venta = $data['precio_venta'];
            $this->product->stock_actual = $data['stock_actual'] ?? 0;
            $this->product->stock_minimo = $data['stock_minimo'] ?? 5;
            $this->product->estado = $data['estado'] ?? 'activo';
            
            // Handle Image Upload
            $this->product->imagen = $this->handleImageUpload() ?? ($data['imagen'] ?? null);

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
        $data = $this->processRequestData();
        $this->product->id_producto = $id;

        // Retrieve existing product to keep old image if no new one is uploaded
        $oldProduct = new Product($this->db);
        $oldProduct->id_producto = $id;
        $oldProduct->readOne();

        if (!empty($data['nombre'])) {
            $this->product->nombre = $data['nombre'];
            $this->product->descripcion = $data['descripcion'] ?? null;
            $this->product->categoria_id = $data['categoria_id'] ?? null;
            $this->product->unidad_medida_id = $data['unidad_medida_id'] ?? null;
            $this->product->precio_compra = $data['precio_compra'] ?? 0;
            $this->product->precio_venta = $data['precio_venta'] ?? 0;
            $this->product->stock_actual = $data['stock_actual'] ?? 0;
            $this->product->stock_minimo = $data['stock_minimo'] ?? 0;
            $this->product->estado = $data['estado'] ?? 'activo';

            // Handle Image Upload
            $newImage = $this->handleImageUpload();
            $this->product->imagen = $newImage ? $newImage : $oldProduct->imagen;

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
            echo json_encode(["message" => "Producto eliminado (Soft Delete)."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo eliminar el producto."]);
        }
    }

    private function processRequestData() {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'application/json') !== false) {
            return (array) json_decode(file_get_contents("php://input"), true);
        }
        return $_POST;
    }

    private function handleImageUpload() {
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/products/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileTmpPath = $_FILES['imagen']['tmp_name'];
            $fileName = $_FILES['imagen']['name'];
            $fileSize = $_FILES['imagen']['size'];
            $fileType = $_FILES['imagen']['type'];
            
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowedFileExtensions = ['jpg', 'gif', 'png', 'jpeg', 'webp'];

            if (in_array($fileExt, $allowedFileExtensions)) {
                $newFileName = uniqid() . '.' . $fileExt;
                $dest_path = $uploadDir . $newFileName;

                if (move_uploaded_file($fileTmpPath, $dest_path)) {
                    // Return relative path for DB
                    return 'uploads/products/' . $newFileName;
                }
            }
        }
        return null;
    }
}
?>
