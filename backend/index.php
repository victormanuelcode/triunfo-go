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
include_once 'controllers/SupplierController.php';
include_once 'controllers/CompanyController.php';
include_once 'controllers/InventoryController.php';
include_once 'controllers/BoxController.php';
include_once 'utils/AuthMiddleware.php';

$database = new Database();
$db = $database->getConnection();

$router = new Router();
$auth = new AuthMiddleware(); // Instancia del middleware de autenticación

$userController = new UserController($db);
$categoryController = new CategoryController($db);
$productController = new ProductController($db);
$invoiceController = new InvoiceController($db);
$reportController = new ReportController($db);
$clientController = new ClientController($db);
$unitController = new UnitMeasureController($db);
$supplierController = new SupplierController($db);
$companyController = new CompanyController($db);
$inventoryController = new InventoryController($db);
$boxController = new BoxController($db);

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
$router->add('GET', '/users', function() use ($userController, $auth) {
    $auth->requireRole([1]); // Solo Admin
    $userController->getAll();
});
$router->add('GET', '/users/{id}', function($id) use ($userController, $auth) {
    $auth->requireRole([1]);
    $userController->getOne($id);
});
$router->add('POST', '/users', function() use ($userController, $auth) {
    $auth->requireRole([1]);
    $userController->register();
});
$router->add('PUT', '/users/{id}', function($id) use ($userController, $auth) {
    $auth->requireRole([1]);
    $userController->update($id);
});
$router->add('DELETE', '/users/{id}', function($id) use ($userController, $auth) {
    $auth->requireRole([1]);
    $userController->delete($id);
});

$router->add('POST', '/register', function() use ($userController) {
    // Registro público o restringido? Por ahora dejemos público si es primer usuario, pero idealmente protegido
    // $userController->register(); 
    // MEJOR: Bloquear registro público en producción
    http_response_code(403);
    echo json_encode(["message" => "El registro público está deshabilitado."]);
});

$router->add('POST', '/login', function() use ($userController) {
    $userController->login();
});

// Rutas de Clientes (Protegidas: Admin y Cajero)
$router->add('GET', '/clients', function() use ($clientController, $auth) {
    $auth->validateToken(); // Requiere login
    $clientController->getAll();
});
$router->add('GET', '/clients/{id}', function($id) use ($clientController, $auth) {
    $auth->validateToken();
    $clientController->getOne($id);
});
$router->add('POST', '/clients', function() use ($clientController, $auth) {
    $auth->validateToken();
    $clientController->create();
});
$router->add('PUT', '/clients/{id}', function($id) use ($clientController, $auth) {
    $auth->validateToken();
    $clientController->update($id);
});
$router->add('DELETE', '/clients/{id}', function($id) use ($clientController, $auth) {
    $auth->requireRole([1]); // Solo Admin puede borrar clientes
    $clientController->delete($id);
});

// Rutas de Proveedores
$router->add('GET', '/suppliers', function() use ($supplierController, $auth) {
    $auth->requireRole([1]); // Solo Admin gestiona proveedores
    $supplierController->getAll();
});
$router->add('GET', '/suppliers/{id}', function($id) use ($supplierController, $auth) {
    $auth->requireRole([1]);
    $supplierController->getOne($id);
});
$router->add('POST', '/suppliers', function() use ($supplierController, $auth) {
    $auth->requireRole([1]);
    $supplierController->create();
});
$router->add('PUT', '/suppliers/{id}', function($id) use ($supplierController, $auth) {
    $auth->requireRole([1]);
    $supplierController->update($id);
});
$router->add('DELETE', '/suppliers/{id}', function($id) use ($supplierController, $auth) {
    $auth->requireRole([1]);
    $supplierController->delete($id);
});

// Rutas de Categorías
$router->add('GET', '/categories', function() use ($categoryController, $auth) {
    $auth->validateToken(); // Cajero puede necesitar ver categorías
    $categoryController->getAll();
});
$router->add('GET', '/categories/{id}', function($id) use ($categoryController, $auth) {
    $auth->validateToken();
    $categoryController->getOne($id);
});
$router->add('POST', '/categories', function() use ($categoryController, $auth) {
    $auth->requireRole([1]); // Solo Admin gestiona
    $categoryController->create();
});
$router->add('PUT', '/categories/{id}', function($id) use ($categoryController, $auth) {
    $auth->requireRole([1]);
    $categoryController->update($id);
});
$router->add('DELETE', '/categories/{id}', function($id) use ($categoryController, $auth) {
    $auth->requireRole([1]);
    $categoryController->delete($id);
});

// Rutas de Unidades de Medida
$router->add('GET', '/units', function() use ($unitController, $auth) {
    $auth->validateToken(); // Admin y Cajero
    $unitController->getAll();
});
$router->add('GET', '/units/{id}', function($id) use ($unitController, $auth) {
    $auth->validateToken();
    $unitController->getOne($id);
});
$router->add('POST', '/units', function() use ($unitController, $auth) {
    $auth->requireRole([1]); // Solo Admin
    $unitController->create();
});
$router->add('PUT', '/units/{id}', function($id) use ($unitController, $auth) {
    $auth->requireRole([1]);
    $unitController->update($id);
});
$router->add('DELETE', '/units/{id}', function($id) use ($unitController, $auth) {
    $auth->requireRole([1]);
    $unitController->delete($id);
});

// Rutas de Productos
$router->add('GET', '/products', function() use ($productController, $auth) {
    $auth->validateToken(); // Admin y Cajero
    $productController->getAll();
});
$router->add('GET', '/products/{id}', function($id) use ($productController, $auth) {
    $auth->validateToken();
    $productController->getOne($id);
});
$router->add('POST', '/products', function() use ($productController, $auth) {
    $auth->requireRole([1]); // Solo Admin
    $productController->create();
});
$router->add('PUT', '/products/{id}', function($id) use ($productController, $auth) {
    $auth->requireRole([1]);
    $productController->update($id);
});
// Soporte para actualización con imagen vía POST (FormData)
$router->add('POST', '/products/{id}', function($id) use ($productController, $auth) {
    $auth->requireRole([1]);
    $productController->update($id);
});
$router->add('DELETE', '/products/{id}', function($id) use ($productController, $auth) {
    $auth->requireRole([1]);
    $productController->delete($id);
});

// Rutas de Ventas (Facturas)
$router->add('GET', '/invoices', function() use ($invoiceController, $auth) {
    $auth->validateToken(); // Admin y Cajero pueden ver historial
    $invoiceController->getAll();
});
$router->add('GET', '/invoices/{id}', function($id) use ($invoiceController, $auth) {
    $auth->validateToken();
    $invoiceController->getOne($id);
});
$router->add('POST', '/invoices', function() use ($invoiceController, $auth) {
    $auth->validateToken(); // Cajero crea facturas
    $invoiceController->create();
});

// Rutas de Reportes
$router->add('GET', '/reports/dashboard', function() use ($reportController, $auth) {
    $auth->requireRole([1]); // Solo Admin ve dashboard completo
    $reportController->getDashboardData();
});

// Rutas de Empresa (Configuración)
$router->add('GET', '/company', function() use ($companyController, $auth) {
    $auth->validateToken(); // Admin y Cajero (para ticket)
    $companyController->get();
});
$router->add('POST', '/company', function() use ($companyController, $auth) {
    $auth->requireRole([1]); // Solo Admin
    $companyController->save();
});

// Rutas de Inventario (Movimientos)
$router->add('GET', '/inventory/movements', function() use ($inventoryController, $auth) {
    $auth->validateToken();
    $inventoryController->getAll();
});

// Rutas de Caja (Apertura/Cierre)
$router->add('GET', '/box/status', function() use ($boxController, $auth) {
    $auth->validateToken(); // Cajero consulta su estado
    $boxController->getStatus();
});
$router->add('POST', '/box/open', function() use ($boxController, $auth) {
    $auth->validateToken(); // Cajero abre caja
    $boxController->open();
});
$router->add('POST', '/box/close', function() use ($boxController, $auth) {
    $auth->validateToken(); // Cajero cierra caja
    $boxController->close();
});

// Despachar la ruta
$router->dispatch($_SERVER['REQUEST_METHOD'], $request_uri);
?>
