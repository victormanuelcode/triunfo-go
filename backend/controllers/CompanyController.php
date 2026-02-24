<?php
include_once __DIR__ . '/../models/Company.php';

/**
 * Clase CompanyController
 * 
 * Controlador para gestionar la configuración de la empresa.
 * Permite obtener y guardar los datos generales como nombre, NIT, logo, etc.
 */
class CompanyController {
    private $db;
    private $company;

    /**
     * Constructor de la clase.
     * 
     * @param PDO $db Conexión a la base de datos.
     */
    public function __construct($db) {
        $this->db = $db;
        $this->company = new Company($db);
    }

    /**
     * Obtiene la configuración actual de la empresa.
     * Si no existe configuración, devuelve un objeto con campos vacíos.
     * 
     * @return void Retorna JSON con los datos de la empresa.
     */
    public function get() {
        $stmt = $this->company->get();
        $num = $stmt->rowCount();

        if ($num > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            http_response_code(200);
            echo json_encode($row);
        } else {
            // Si no hay configuración, devolver objeto vacío o valores por defecto
            http_response_code(200);
            echo json_encode([
                "nombre" => "",
                "nit" => "",
                "direccion" => "",
                "telefono" => "",
                "lema" => "",
                "logo" => ""
            ]);
        }
    }

    /**
     * Guarda o actualiza la configuración de la empresa.
     * Maneja la subida del logo si se proporciona en la petición.
     * 
     * @return void Retorna JSON con el resultado de la operación.
     */
    public function save() {
        // Manejo de FormData (con archivo)
        // Para PUT/POST con archivos, mejor usar POST siempre en este caso y manejar lógica interna
        
        if (!empty($_POST['nombre'])) {
            $this->company->nombre = $_POST['nombre'];
            $this->company->nit = isset($_POST['nit']) ? $_POST['nit'] : '';
            $this->company->direccion = isset($_POST['direccion']) ? $_POST['direccion'] : '';
            $this->company->telefono = isset($_POST['telefono']) ? $_POST['telefono'] : '';
            $this->company->lema = isset($_POST['lema']) ? $_POST['lema'] : '';

            // Manejo de imagen (Logo)
            if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../uploads/company/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                $fileName = uniqid() . '_' . basename($_FILES['logo']['name']);
                $targetPath = $uploadDir . $fileName;

                if (move_uploaded_file($_FILES['logo']['tmp_name'], $targetPath)) {
                    $this->company->logo = $fileName;
                }
            }

            if ($this->company->save()) {
                http_response_code(200);
                echo json_encode(["message" => "Configuración guardada exitosamente."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "No se pudo guardar la configuración."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos. El nombre es obligatorio."]);
        }
    }
}
?>