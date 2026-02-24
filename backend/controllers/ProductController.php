<?php
include_once __DIR__ . '/../models/Product.php';
include_once __DIR__ . '/../models/InventoryMovement.php';

/**
 * Controlador para la gestión de productos.
 * Maneja las operaciones CRUD, subida de imágenes y control de stock.
 */
class ProductController {
    private $db;
    private $product;
    private $movement;

    /**
     * Constructor de la clase.
     * 
     * @param PDO $db Conexión a la base de datos
     */
    public function __construct($db) {
        $this->db = $db;
        $this->product = new Product($db);
        $this->movement = new InventoryMovement($db);
    }

    /**
     * Obtiene una lista paginada de productos.
     * Soporta parámetros GET para paginación (page, limit).
     * Retorna un JSON con los datos y metadatos de paginación.
     * 
     * @return void
     */
    public function getAll() {
        // Obtener parámetros de paginación
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        
        // Validar que no sean negativos
        if ($limit < 1) $limit = 10;
        if ($page < 1) $page = 1;

        $offset = ($page - 1) * $limit;

        // Obtener productos paginados
        $stmt = $this->product->read($limit, $offset);
        $products_arr = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $item = [
                "id_producto" => $row['id_producto'],
                "nombre" => $row['nombre'],
                "descripcion" => $row['descripcion'],
                "categoria_id" => $row['categoria_id'],
                "unidad_medida_id" => $row['unidad_medida_id'],
                "precio_compra" => $row['precio_compra'],
                "precio_venta" => $row['precio_venta'],
                "stock_actual" => $row['stock_actual'],
                "stock_minimo" => $row['stock_minimo'],
                "imagen" => $row['imagen'],
                "estado" => $row['estado'],
                "creado_en" => $row['creado_en'],
                "categoria_nombre" => $row['categoria_nombre'] ?? null,
                "proveedor_id" => $row['proveedor_id'] ?? null,
                "proveedor_nombre" => $row['proveedor_nombre'] ?? null
            ];
            $products_arr[] = $item;
        }

        // Obtener total para metadata
        $total_rows = $this->product->count();
        $total_pages = ceil($total_rows / $limit);
        
        echo json_encode([
            "data" => $products_arr,
            "meta" => [
                "current_page" => $page,
                "limit" => $limit,
                "total_items" => $total_rows,
                "total_pages" => $total_pages
            ]
        ]);
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
                "proveedor_id" => $this->product->proveedor_id, // Añadir proveedor
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

    /**
     * Crea un nuevo producto.
     * Procesa los datos del formulario o JSON y la imagen subida.
     * 
     * @return void
     */
    public function create() {
        $data = $this->processRequestData();

        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        if (!empty($data['nombre']) && isset($data['precio_venta'])) {
            $precioVenta = (float) $data['precio_venta'];
            $precioCompra = isset($data['precio_compra']) ? (float) $data['precio_compra'] : 0;
            $stockActual = isset($data['stock_actual']) ? (int) $data['stock_actual'] : 0;
            $stockMinimo = isset($data['stock_minimo']) ? (int) $data['stock_minimo'] : 5;

            if ($precioVenta <= 0) {
                http_response_code(400);
                echo json_encode(["message" => "El precio de venta debe ser mayor a cero."]);
                return;
            }

            if ($precioCompra < 0) {
                http_response_code(400);
                echo json_encode(["message" => "El precio de compra no puede ser negativo."]);
                return;
            }

            if ($stockActual < 0 || $stockMinimo < 0) {
                http_response_code(400);
                echo json_encode(["message" => "El stock no puede ser negativo."]);
                return;
            }

            $this->product->nombre = $data['nombre'];
            $this->product->descripcion = $data['descripcion'] ?? null;
            $this->product->categoria_id = $data['categoria_id'] ?? null;
            $this->product->unidad_medida_id = $data['unidad_medida_id'] ?? null;
            $this->product->proveedor_id = $data['proveedor_id'] ?? null;
            $this->product->precio_compra = $precioCompra;
            $this->product->precio_venta = $precioVenta;
            $this->product->stock_actual = $stockActual;
            $this->product->stock_minimo = $stockMinimo;
            $this->product->estado = $data['estado'] ?? 'activo';
            
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

        $oldProduct = new Product($this->db);
        $oldProduct->id_producto = $id;
        $oldProduct->readOne();

        if (!empty($data['nombre']) || !empty($oldProduct->nombre)) {
            $precioVenta = isset($data['precio_venta']) ? (float) $data['precio_venta'] : (float) $oldProduct->precio_venta;
            $precioCompra = isset($data['precio_compra']) ? (float) $data['precio_compra'] : (float) $oldProduct->precio_compra;
            $stockActual = isset($data['stock_actual']) ? (int) $data['stock_actual'] : (int) $oldProduct->stock_actual;
            $stockMinimo = isset($data['stock_minimo']) ? (int) $data['stock_minimo'] : (int) $oldProduct->stock_minimo;

            if ($precioVenta < 0 || $precioCompra < 0) {
                http_response_code(400);
                echo json_encode(["message" => "Los precios no pueden ser negativos."]);
                return;
            }

            if ($stockActual < 0 || $stockMinimo < 0) {
                http_response_code(400);
                echo json_encode(["message" => "El stock no puede ser negativo."]);
                return;
            }

            $this->product->nombre = $data['nombre'] ?? $oldProduct->nombre;
            $this->product->descripcion = array_key_exists('descripcion', $data) ? $data['descripcion'] : $oldProduct->descripcion;
            $this->product->categoria_id = $data['categoria_id'] ?? $oldProduct->categoria_id;
            $this->product->unidad_medida_id = $data['unidad_medida_id'] ?? $oldProduct->unidad_medida_id;
            $this->product->proveedor_id = $data['proveedor_id'] ?? $oldProduct->proveedor_id;
            $this->product->precio_compra = $precioCompra;
            $this->product->precio_venta = $precioVenta;
            $this->product->stock_actual = $stockActual;
            $this->product->stock_minimo = $stockMinimo;
            $this->product->estado = $data['estado'] ?? $oldProduct->estado ?? 'activo';

            $newImage = $this->handleImageUpload();
            $this->product->imagen = $newImage ? $newImage : $oldProduct->imagen;

            if ($this->product->update()) {
                // Registrar movimiento si hubo cambio de stock
                $oldStock = (int)$oldProduct->stock_actual;
                $newStock = (int)$this->product->stock_actual;
                $diff = $newStock - $oldStock;

                if ($diff !== 0) {
                    $this->movement->producto_id = $id;
                    $this->movement->cantidad = abs($diff);
                    $this->movement->tipo = $diff > 0 ? 'entrada' : 'salida';
                    $this->movement->descripcion = "Ajuste manual de stock (Edición de producto)";
                    $this->movement->referencia = "MANUAL-" . date('YmdHis');
                    $this->movement->create();
                }

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

    /**
     * Procesa los datos de la solicitud entrante.
     * Maneja tanto solicitudes JSON como form-data.
     * 
     * @return array Datos de la solicitud procesados
     */
    private function processRequestData() {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'application/json') !== false) {
            return (array) json_decode(file_get_contents("php://input"), true);
        }
        return $_POST;
    }

    /**
     * Maneja la subida de imágenes del producto.
     * Valida el tipo de archivo y lo guarda en el servidor.
     * 
     * @return string|null Ruta relativa de la imagen guardada o null si no se subió o hubo error
     */
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
                // Validar MIME type real
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $fileTmpPath);
                finfo_close($finfo);

                $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

                if (in_array($mimeType, $allowedMimeTypes)) {
                    $newFileName = uniqid() . '.' . $fileExt;
                    $dest_path = $uploadDir . $newFileName;

                    if (move_uploaded_file($fileTmpPath, $dest_path)) {
                        // Return relative path for DB
                        return 'uploads/products/' . $newFileName;
                    }
                }
            }
        }
        return null;
    }
}
?>
