<?php
include_once __DIR__ . '/../models/Product.php';
include_once __DIR__ . '/../models/InventoryMovement.php';

/**
 * Controlador para la gesti?n de productos.
 * Maneja las operaciones CRUD, subida de im?genes y control de stock.
 */
class ProductController {
    private $db;
    private $product;
    private $movement;
    private $lastImageUploadError = null;

    /**
     * Constructor de la clase.
     * 
     * @param PDO $db Conexi?n a la base de datos
     */
    public function __construct($db) {
        $this->db = $db;
        $this->product = new Product($db);
        $this->movement = new InventoryMovement($db);
    }

    /**
     * Obtiene una lista paginada de productos.
     * Soporta par?metros GET para paginaci?n (page, limit).
     * Retorna un JSON con los datos y metadatos de paginaci?n.
     * 
     * @return void
     */
    public function getAll() {
        // Obtener par?metros de paginaci?n
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
                "proveedor_nombre" => $row['proveedor_nombre'] ?? null,
                "tipo_venta" => $row['tipo_venta'] ?? 'unidad',
                "unidad_base" => $row['unidad_base'] ?? (($row['tipo_venta'] ?? 'unidad') === 'peso' ? 'kg' : 'unidad'),
                "fraccion_minima" => isset($row['fraccion_minima']) ? (float)$row['fraccion_minima'] : (($row['tipo_venta'] ?? 'unidad') === 'peso' ? 0.001 : 1)
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
                "proveedor_id" => $this->product->proveedor_id, // A?adir proveedor
                "precio_compra" => $this->product->precio_compra,
                "precio_venta" => $this->product->precio_venta,
                "stock_actual" => $this->product->stock_actual,
                "stock_minimo" => $this->product->stock_minimo,
                "imagen" => $this->product->imagen,
                "estado" => $this->product->estado,
                "creado_en" => $this->product->creado_en,
                "tipo_venta" => $this->product->tipo_venta ?? 'unidad',
                "unidad_base" => $this->product->unidad_base ?? (($this->product->tipo_venta ?? 'unidad') === 'peso' ? 'kg' : 'unidad'),
                "fraccion_minima" => isset($this->product->fraccion_minima) ? (float)$this->product->fraccion_minima : (($this->product->tipo_venta ?? 'unidad') === 'peso' ? 0.001 : 1)
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
            echo json_encode(["message" => "Formato de datos inv?lido."]);
            return;
        }

        if (!empty($data['nombre']) && isset($data['precio_venta'])) {
            $precioVenta = (float) $data['precio_venta'];
            $precioCompra = isset($data['precio_compra']) ? (float) $data['precio_compra'] : 0;
            $stockActual = isset($data['stock_actual']) ? (float) $data['stock_actual'] : 0;
            $stockMinimo = isset($data['stock_minimo']) ? (float) $data['stock_minimo'] : 5;

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
            $this->product->tipo_venta = ($data['tipo_venta'] ?? 'unidad') === 'peso' ? 'peso' : 'unidad';
            $this->product->unidad_base = $data['unidad_base'] ?? ($this->product->tipo_venta === 'peso' ? 'kg' : 'unidad');
            $this->product->fraccion_minima = isset($data['fraccion_minima']) ? (float)$data['fraccion_minima'] : ($this->product->tipo_venta === 'peso' ? 0.001 : 1);
            
            $uploadedImage = $this->handleImageUpload();
            $this->product->imagen = $uploadedImage ?? ($data['imagen'] ?? null);

            if ($this->product->create()) {
                http_response_code(201);
                $response = [
                    "message" => "Producto creado exitosamente.",
                    "id_producto" => (int)$this->product->id_producto
                ];
                if (isset($_FILES['imagen']) && $uploadedImage === null && $this->lastImageUploadError) {
                    $response["warning"] = "Producto creado, pero la imagen no se pudo subir: " . $this->lastImageUploadError;
                }
                echo json_encode($response);
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
            $stockActual = isset($data['stock_actual']) ? (float) $data['stock_actual'] : (float) $oldProduct->stock_actual;
            $stockMinimo = isset($data['stock_minimo']) ? (float) $data['stock_minimo'] : (float) $oldProduct->stock_minimo;

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

            if (isset($data['stock_actual']) && abs((float)$stockActual - (float)$oldProduct->stock_actual) > 0.0001) {
                http_response_code(400);
                echo json_encode(["message" => "No se permite modificar stock desde edici?n de producto. Use entradas por lote o ajuste de inventario por lote."]);
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
            $this->product->tipo_venta = isset($data['tipo_venta'])
                ? (($data['tipo_venta'] === 'peso') ? 'peso' : 'unidad')
                : ($oldProduct->tipo_venta ?? 'unidad');
            $this->product->unidad_base = $data['unidad_base'] ?? ($oldProduct->unidad_base ?? ($this->product->tipo_venta === 'peso' ? 'kg' : 'unidad'));
            $this->product->fraccion_minima = isset($data['fraccion_minima'])
                ? (float)$data['fraccion_minima']
                : (isset($oldProduct->fraccion_minima) ? (float)$oldProduct->fraccion_minima : ($this->product->tipo_venta === 'peso' ? 0.001 : 1));

            $newImage = $this->handleImageUpload();
            $this->product->imagen = $newImage ? $newImage : $oldProduct->imagen;

            if ($this->product->update()) {
                http_response_code(200);
                $response = ["message" => "Producto actualizado."];
                if (isset($_FILES['imagen']) && $newImage === null && $this->lastImageUploadError) {
                    $response["warning"] = "Cambios guardados, pero la imagen no se pudo subir: " . $this->lastImageUploadError;
                }
                echo json_encode($response);
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
     * Maneja la subida de im?genes del producto.
     * Valida el tipo de archivo y lo guarda en el servidor.
     * 
     * @return string|null Ruta relativa de la imagen guardada o null si no se subi? o hubo error
     */
    private function handleImageUpload() {
        $this->lastImageUploadError = null;

        if (!isset($_FILES['imagen'])) {
            return null;
        }

        if ($_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
            $this->lastImageUploadError = 'No se pudo subir la imagen (error de carga).';
            return null;
        }

        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/products/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            if (!is_writable($uploadDir)) {
                @chmod($uploadDir, 0777);
            }

            $fileTmpPath = $_FILES['imagen']['tmp_name'];
            $fileName = $_FILES['imagen']['name'];
            
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowedFileExtensions = ['jpg', 'gif', 'png', 'jpeg', 'webp'];

            if (in_array($fileExt, $allowedFileExtensions, true)) {
                // Validar MIME type real cuando sea posible (sin romper si la extensi?n fileinfo no est? activa).
                $mimeType = '';
                if (class_exists('finfo')) {
                    $finfo = new finfo(FILEINFO_MIME_TYPE);
                    $mimeType = (string) $finfo->file($fileTmpPath);
                } elseif (function_exists('mime_content_type')) {
                    $mimeType = (string) mime_content_type($fileTmpPath);
                } else {
                    $mimeType = (string) ($_FILES['imagen']['type'] ?? '');
                }
                $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

                if (in_array($mimeType, $allowedMimeTypes, true)) {
                    $newFileName = uniqid() . '.' . $fileExt;
                    $dest_path = $uploadDir . $newFileName;

                    if (move_uploaded_file($fileTmpPath, $dest_path)) {
                        // Return relative path for DB
                        return 'uploads/products/' . $newFileName;
                    }

                    $this->lastImageUploadError = 'No se pudo mover la imagen al directorio de productos.';
                    return null;
                }

                $this->lastImageUploadError = 'El archivo no es una imagen v?lida. Formatos permitidos: JPG, PNG, GIF, WEBP.';
                return null;
            }

            $this->lastImageUploadError = 'Extensi?n de imagen no permitida. Use JPG, PNG, GIF o WEBP.';
            return null;
        }
        return null;
    }
}
?>
