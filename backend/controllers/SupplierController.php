<?php
include_once __DIR__ . '/../models/Supplier.php';

class SupplierController {
    private $db;
    private $supplier;

    public function __construct($db) {
        $this->db = $db;
        $this->supplier = new Supplier($db);
    }

    public function getAll() {
        $stmt = $this->supplier->read();
        $num = $stmt->rowCount();
        $suppliers_arr = [];

        if ($num > 0) {
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                extract($row);
                $supplier_item = [
                    "id_proveedor" => $id_proveedor,
                    "nombre" => $nombre,
                    "nit" => $nit,
                    "telefono" => $telefono,
                    "direccion" => $direccion,
                    "email" => $email,
                    "creado_en" => $creado_en
                ];
                array_push($suppliers_arr, $supplier_item);
            }
        }
        echo json_encode($suppliers_arr);
    }

    public function getOne($id) {
        $this->supplier->id_proveedor = $id;
        if ($this->supplier->readOne()) {
            $supplier_arr = [
                "id_proveedor" => $this->supplier->id_proveedor,
                "nombre" => $this->supplier->nombre,
                "nit" => $this->supplier->nit,
                "telefono" => $this->supplier->telefono,
                "direccion" => $this->supplier->direccion,
                "email" => $this->supplier->email,
                "creado_en" => $this->supplier->creado_en
            ];
            echo json_encode($supplier_arr);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Proveedor no encontrado."]);
        }
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"));

        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        if (!empty($data->nombre)) {
            if (isset($data->email) && $data->email !== '' && !filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(["message" => "Correo electrónico inválido."]);
                return;
            }

            $this->supplier->nombre = $data->nombre;
            $this->supplier->nit = isset($data->nit) ? $data->nit : null;
            $this->supplier->telefono = isset($data->telefono) ? $data->telefono : null;
            $this->supplier->direccion = isset($data->direccion) ? $data->direccion : null;
            $this->supplier->email = isset($data->email) ? $data->email : null;

            if ($this->supplier->create()) {
                http_response_code(201);
                echo json_encode(["message" => "Proveedor creado exitosamente."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo crear el proveedor."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. El nombre es obligatorio."]);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));

        if (!is_object($data)) {
            http_response_code(400);
            echo json_encode(["message" => "Formato de datos inválido."]);
            return;
        }

        // Obtener proveedor actual
        $oldSupplier = new Supplier($this->db);
        $oldSupplier->id_proveedor = $id;
        if (!$oldSupplier->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Proveedor no encontrado."]);
            return;
        }

        if (isset($data->email) && $data->email !== '' && !filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["message" => "Correo electrónico inválido."]);
            return;
        }

        $this->supplier->id_proveedor = $id;
        $this->supplier->nombre = $data->nombre ?? $oldSupplier->nombre;
        $this->supplier->nit = $data->nit ?? $oldSupplier->nit;
        $this->supplier->telefono = $data->telefono ?? $oldSupplier->telefono;
        $this->supplier->direccion = $data->direccion ?? $oldSupplier->direccion;
        $this->supplier->email = isset($data->email) ? $data->email : $oldSupplier->email;

        if ($this->supplier->update()) {
            http_response_code(200);
            echo json_encode(["message" => "Proveedor actualizado exitosamente."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo actualizar el proveedor."]);
        }
    }

    public function delete($id) {
        $this->supplier->id_proveedor = $id;

        if ($this->supplier->delete()) {
            http_response_code(200);
            echo json_encode(["message" => "Proveedor eliminado exitosamente."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo eliminar el proveedor."]);
        }
    }
}
?>
