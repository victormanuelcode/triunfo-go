<?php
include_once __DIR__ . '/../models/Client.php';

class ClientController {
    private $db;
    private $client;

    public function __construct($db) {
        $this->db = $db;
        $this->client = new Client($db);
    }

    public function getAll() {
        $stmt = $this->client->read();
        $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($clients);
    }

    public function getOne($id) {
        $this->client->id_cliente = $id;
        if ($this->client->readOne()) {
            echo json_encode([
                "id_cliente" => $this->client->id_cliente,
                "nombre" => $this->client->nombre,
                "documento" => $this->client->documento,
                "telefono" => $this->client->telefono,
                "direccion" => $this->client->direccion,
                "email" => $this->client->email
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Cliente no encontrado"]);
        }
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->nombre)) {
            $this->client->nombre = $data->nombre;
            $this->client->documento = $data->documento ?? '';
            $this->client->telefono = $data->telefono ?? '';
            $this->client->direccion = $data->direccion ?? '';
            $this->client->email = $data->email ?? '';

            if ($this->client->create()) {
                http_response_code(201);
                echo json_encode(["message" => "Cliente creado exitosamente"]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo crear el cliente"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. El nombre es obligatorio."]);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));

        $this->client->id_cliente = $id;
        $this->client->nombre = $data->nombre;
        $this->client->documento = $data->documento ?? '';
        $this->client->telefono = $data->telefono ?? '';
        $this->client->direccion = $data->direccion ?? '';
        $this->client->email = $data->email ?? '';

        if ($this->client->update()) {
            echo json_encode(["message" => "Cliente actualizado exitosamente"]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo actualizar el cliente"]);
        }
    }

    public function delete($id) {
        $this->client->id_cliente = $id;
        if ($this->client->delete()) {
            echo json_encode(["message" => "Cliente eliminado"]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se puede eliminar el cliente (posiblemente tiene facturas asociadas)"]);
        }
    }
}
?>
