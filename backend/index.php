<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

include_once 'config/Database.php';
include_once 'utils/Router.php';
include_once 'controllers/UserController.php';
include_once 'controllers/CategoryController.php';
include_once 'controllers/ProductController.php';
include_once 'controllers/InvoiceController.php';
include_once 'controllers/ReportController.php';
include_once 'controllers/ClientController.php';
include_once 'controllers/UnitMeasureController.php';

$database = new Database();
$db = $database->getConnection();

$router = new Router();
$userController = new UserController($db);
$categoryController = new CategoryController($db);
$productController = new ProductController($db);
$invoiceController = new InvoiceController($db);
$reportController = new ReportController($db);
$clientController = new ClientController($db);
$unitController = new UnitMeasureController($db);

$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/proyecto_final/backend'; 

if (strpos($request_uri, $base_path) === 0) {
    $request_uri = substr($request_uri, strlen($base_path));
}

// Definir rutas
$router->add('GET', '/', function() {
    echo json_encode(["message" => "Bienvenido a la API de TRIUNFO GO"]);
});

$router->add('GET', '/test-db', function() use ($db) {
    if ($db) {
        echo json_encode(["message" => "Conexión a base de datos exitosa"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error de conexión a base de datos"]);
    }
});

// Rutas de Usuario
$router->add('POST', '/register', function() use ($userController) {
    $userController->register();
});

$router->add('POST', '/login', function() use ($userController) {
    $userController->login();
});

// Rutas de Clientes
$router->add('GET', '/clients', function() use ($clientController) {
    $clientController->getAll();
});
$router->add('GET', '/clients/{id}', function($id) use ($clientController) {
    $clientController->getOne($id);
});
$router->add('POST', '/clients', function() use ($clientController) {
    $clientController->create();
});
$router->add('PUT', '/clients/{id}', function($id) use ($clientController) {
    $clientController->update($id);
});
$router->add('DELETE', '/clients/{id}', function($id) use ($clientController) {
    $clientController->delete($id);
});

// Rutas de Categorías
$router->add('GET', '/categories', function() use ($categoryController) {
    $categoryController->getAll();
});
$router->add('GET', '/categories/{id}', function($id) use ($categoryController) {
    $categoryController->getOne($id);
});
$router->add('POST', '/categories', function() use ($categoryController) {
    $categoryController->create();
});
$router->add('PUT', '/categories/{id}', function($id) use ($categoryController) {
    $categoryController->update($id);
});
$router->add('DELETE', '/categories/{id}', function($id) use ($categoryController) {
    $categoryController->delete($id);
});

// Rutas de Unidades de Medida
$router->add('GET', '/units', function() use ($unitController) {
    $unitController->getAll();
});
$router->add('GET', '/units/{id}', function($id) use ($unitController) {
    $unitController->getOne($id);
});
$router->add('POST', '/units', function() use ($unitController) {
    $unitController->create();
});
$router->add('PUT', '/units/{id}', function($id) use ($unitController) {
    $unitController->update($id);
});
$router->add('DELETE', '/units/{id}', function($id) use ($unitController) {
    $unitController->delete($id);
});

// Rutas de Productos
$router->add('GET', '/products', function() use ($productController) {
    $productController->getAll();
});
$router->add('GET', '/products/{id}', function($id) use ($productController) {
    $productController->getOne($id);
});
$router->add('POST', '/products', function() use ($productController) {
    $productController->create();
});
$router->add('PUT', '/products/{id}', function($id) use ($productController) {
    $productController->update($id);
});
// Soporte para actualización con imagen vía POST (FormData)
$router->add('POST', '/products/{id}', function($id) use ($productController) {
    $productController->update($id);
});
$router->add('DELETE', '/products/{id}', function($id) use ($productController) {
    $productController->delete($id);
});

// Rutas de Ventas (Facturas)
$router->add('GET', '/invoices', function() use ($invoiceController) {
    $invoiceController->getAll();
});
$router->add('GET', '/invoices/{id}', function($id) use ($invoiceController) {
    $invoiceController->getOne($id);
});
$router->add('POST', '/invoices', function() use ($invoiceController) {
    $invoiceController->create();
});

// Rutas de Reportes
$router->add('GET', '/reports/dashboard', function() use ($reportController) {
    $reportController->getDashboardData();
});

// Despachar la ruta
$router->dispatch($_SERVER['REQUEST_METHOD'], $request_uri);
?>
