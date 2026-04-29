<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Dependencias (Composer)
$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) {
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "message" => "Dependencias no instaladas. Ejecute: (cd backend && composer install)"
    ]);
    exit();
}

require_once $autoload;
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();
if (file_exists(__DIR__ . '/.env.example')) {
    Dotenv\Dotenv::createImmutable(__DIR__, '.env.example')->safeLoad();
}

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
include_once 'controllers/LotController.php';
include_once 'controllers/NotificationController.php';
include_once 'controllers/ExpenseController.php';
include_once 'utils/AuthMiddleware.php';

$database = new Database();
try {
    $db = $database->getConnection();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error de conexión a base de datos"]);
    exit();
}

$router = new Router();
$auth = new AuthMiddleware($db);

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
$lotController = new LotController($db);
$notificationController = new NotificationController($db);
$expenseController = new ExpenseController($db);

$request_uri = $_SERVER['REQUEST_URI'];

// Base path del backend (auto-detect) para que funcione al clonar en otra carpeta.
// Ej: /proyecto_final/backend o /triunfo-go/backend
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
$base_path = $scriptDir; // normalmente termina en /backend
if ($base_path === '' || $base_path === '.') {
    $base_path = '/backend';
}

if (strpos($request_uri, $base_path) === 0) {
    $request_uri = substr($request_uri, strlen($base_path));
}

// Si Apache no aplica rewrite, las rutas llegan como /index.php/login.
if (strpos($request_uri, '/index.php') === 0) {
    $request_uri = substr($request_uri, strlen('/index.php'));
    if ($request_uri === '') {
        $request_uri = '/';
    }
}

// Definir rutas
$router->add('GET', '/', function () {
    echo json_encode(["message" => "Bienvenido a la API de TRIUNFO GO"]);
});

$router->add('GET', '/test-db', function () use ($db) {
    if ($db) {
        echo json_encode(["message" => "Conexión a base de datos exitosa"]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Error de conexión a base de datos"]);
    }
});

// Rutas de Usuario
$router->add('GET', '/profile', function () use ($userController, $auth) {
    $tokenData = $auth->validateToken(); // Obtener datos del token
    $userController->getProfile($tokenData);
});
$router->add('PUT', '/profile', function () use ($userController, $auth) {
    $tokenData = $auth->validateToken();
    $userController->updateProfile($tokenData);
});
$router->add('POST', '/profile/avatar', function () use ($userController, $auth) {
    $tokenData = $auth->validateToken();
    $userController->uploadAvatar($tokenData);
});

$router->add('GET', '/users', function () use ($userController, $auth) {
    $auth->requireRole([1]); // Solo Admin
    $userController->getAll();
});
$router->add('GET', '/users/{id}', function ($id) use ($userController, $auth) {
    $auth->requireRole([1]);
    $userController->getOne($id);
});
$router->add('POST', '/users', function () use ($userController, $auth) {
    $auth->requireRole([1]);
    $userController->register();
});
$router->add('PUT', '/users/{id}', function ($id) use ($userController, $auth) {
    $auth->requireRole([1]);
    $userController->update($id);
});
$router->add('DELETE', '/users/{id}', function ($id) use ($userController, $auth) {
    $auth->requireRole([1]);
    $userController->delete($id);
});

$router->add('POST', '/register', function () use ($userController) {
    // Registro público o restringido? Por ahora dejemos público si es primer usuario, pero idealmente protegido
    // $userController->register(); 
    // MEJOR: Bloquear registro público en producción
    http_response_code(403);
    echo json_encode(["message" => "El registro público está deshabilitado."]);
});

$router->add('POST', '/login', function () use ($userController) {
    $userController->login();
});

// Logout con revocación de token
$router->add('POST', '/logout', function () use ($userController, $auth) {
    $auth->validateToken();
    $userController->logout();
});

// Rutas de Clientes (Protegidas: Admin y Cajero)
$router->add('GET', '/clients', function () use ($clientController, $auth) {
    $auth->validateToken(); // Requiere login
    $clientController->getAll();
});
$router->add('GET', '/clients/{id}', function ($id) use ($clientController, $auth) {
    $auth->validateToken();
    $clientController->getOne($id);
});
$router->add('POST', '/clients', function () use ($clientController, $auth) {
    $auth->validateToken();
    $clientController->create();
});
$router->add('PUT', '/clients/{id}', function ($id) use ($clientController, $auth) {
    $auth->validateToken();
    $clientController->update($id);
});
$router->add('DELETE', '/clients/{id}', function ($id) use ($clientController, $auth) {
    $auth->requireRole([1]); // Solo Admin puede borrar clientes
    $clientController->delete($id);
});

// Rutas de Proveedores
$router->add('GET', '/suppliers', function () use ($supplierController, $auth) {
    $auth->requireRole([1]); // Solo Admin gestiona proveedores
    $supplierController->getAll();
});
$router->add('GET', '/suppliers/{id}', function ($id) use ($supplierController, $auth) {
    $auth->requireRole([1]);
    $supplierController->getOne($id);
});
$router->add('POST', '/suppliers', function () use ($supplierController, $auth) {
    $auth->requireRole([1]);
    $supplierController->create();
});
$router->add('PUT', '/suppliers/{id}', function ($id) use ($supplierController, $auth) {
    $auth->requireRole([1]);
    $supplierController->update($id);
});
$router->add('DELETE', '/suppliers/{id}', function ($id) use ($supplierController, $auth) {
    $auth->requireRole([1]);
    $supplierController->delete($id);
});

// Rutas de Categorías
$router->add('GET', '/categories', function () use ($categoryController, $auth) {
    $auth->validateToken(); // Cajero puede necesitar ver categorías
    $categoryController->getAll();
});
$router->add('GET', '/categories/{id}', function ($id) use ($categoryController, $auth) {
    $auth->validateToken();
    $categoryController->getOne($id);
});
$router->add('POST', '/categories', function () use ($categoryController, $auth) {
    $auth->requireRole([1]); // Solo Admin gestiona
    $categoryController->create();
});
$router->add('PUT', '/categories/{id}', function ($id) use ($categoryController, $auth) {
    $auth->requireRole([1]);
    $categoryController->update($id);
});
$router->add('DELETE', '/categories/{id}', function ($id) use ($categoryController, $auth) {
    $auth->requireRole([1]);
    $categoryController->delete($id);
});

// Rutas de Unidades de Medida
$router->add('GET', '/units', function () use ($unitController, $auth) {
    $auth->validateToken(); // Admin y Cajero
    $unitController->getAll();
});
$router->add('GET', '/units/{id}', function ($id) use ($unitController, $auth) {
    $auth->validateToken();
    $unitController->getOne($id);
});
$router->add('POST', '/units', function () use ($unitController, $auth) {
    $auth->requireRole([1]); // Solo Admin
    $unitController->create();
});
$router->add('PUT', '/units/{id}', function ($id) use ($unitController, $auth) {
    $auth->requireRole([1]);
    $unitController->update($id);
});
$router->add('DELETE', '/units/{id}', function ($id) use ($unitController, $auth) {
    $auth->requireRole([1]);
    $unitController->delete($id);
});

// Rutas de Productos
$router->add('GET', '/products', function () use ($productController, $auth) {
    $auth->validateToken(); // Admin y Cajero
    $productController->getAll();
});
$router->add('GET', '/products/{id}', function ($id) use ($productController, $auth) {
    $auth->validateToken();
    $productController->getOne($id);
});
$router->add('POST', '/products', function () use ($productController, $auth) {
    $auth->requireRole([1]); // Solo Admin
    $productController->create();
});
$router->add('PUT', '/products/{id}', function ($id) use ($productController, $auth) {
    $auth->requireRole([1]);
    $productController->update($id);
});
// Soporte para actualización con imagen vía POST (FormData)
$router->add('POST', '/products/{id}', function ($id) use ($productController, $auth) {
    $auth->requireRole([1]);
    $productController->update($id);
});
$router->add('DELETE', '/products/{id}', function ($id) use ($productController, $auth) {
    $auth->requireRole([1]);
    $productController->delete($id);
});

$router->add('GET', '/products/{id}/lots', function ($id) use ($lotController, $auth) {
    $auth->validateToken();
    $lotController->getByProduct($id);
});

$router->add('GET', '/lots/regularization/candidates', function () use ($lotController, $auth) {
    $auth->requireRole([1]);
    $lotController->getRegularizationCandidates();
});
$router->add('GET', '/lots/{id}/detail', function ($id) use ($lotController, $auth) {
    $auth->validateToken();
    $lotController->getDetail($id);
});
$router->add('POST', '/lots', function () use ($lotController, $auth) {
    $auth->requireRole([1]);
    $lotController->create();
});
$router->add('POST', '/lots/regularize', function () use ($lotController, $auth) {
    $auth->requireRole([1]);
    $lotController->regularize();
});
$router->add('PUT', '/lots/{id}', function ($id) use ($lotController, $auth) {
    $auth->requireRole([1]);
    $lotController->update($id);
});
$router->add('POST', '/lots/{id}/restock', function ($id) use ($lotController, $auth) {
    $auth->requireRole([1]);
    $lotController->restock($id);
});
$router->add('DELETE', '/lots/{id}', function ($id) use ($lotController, $auth) {
    $auth->requireRole([1]);
    $lotController->delete($id);
});

// Rutas de Ventas (Facturas)
$router->add('GET', '/invoices', function () use ($invoiceController, $auth) {
    $auth->validateToken(); // Admin y Cajero pueden ver historial
    $invoiceController->getAll();
});
$router->add('GET', '/invoices/{id}', function ($id) use ($invoiceController, $auth) {
    $auth->validateToken();
    $invoiceController->getOne($id);
});
$router->add('POST', '/invoices', function () use ($invoiceController, $auth) {
    $auth->validateToken(); // Cajero crea facturas
    $invoiceController->create();
});

$router->add('POST', '/invoices/quote', function () use ($invoiceController, $auth) {
    $auth->validateToken();
    $invoiceController->quote();
});

$router->add('POST', '/invoices/{id}/annul', function ($id) use ($invoiceController, $auth) {
    $auth->requireRole([1]); // Solo Admin puede anular
    $invoiceController->annul($id);
});

// Rutas de Reportes
$router->add('GET', '/reports/dashboard', function () use ($reportController, $auth) {
    $auth->requireRole([1]); // Solo Admin ve dashboard completo
    $reportController->getDashboardData();
});

// Rutas de Empresa (Configuración)
$router->add('GET', '/company', function () use ($companyController, $auth) {
    $auth->validateToken(); // Admin y Cajero (para ticket)
    $companyController->get();
});
$router->add('POST', '/company', function () use ($companyController, $auth) {
    $auth->requireRole([1]); // Solo Admin
    $companyController->save();
});

// Rutas de Inventario (Movimientos)
$router->add('GET', '/inventory/movements', function () use ($inventoryController, $auth) {
    $auth->validateToken();
    $inventoryController->getAll();
});
$router->add('GET', '/inventory/summary', function () use ($inventoryController, $auth) {
    $auth->validateToken();
    $inventoryController->getSummary();
});
$router->add('POST', '/inventory/adjust', function () use ($inventoryController, $auth) {
    $auth->requireRole([1]); // Solo Admin puede ajustar inventario manualmente
    $inventoryController->adjust();
});

// Rutas de Caja (Apertura/Cierre)
$router->add('GET', '/box/status', function () use ($boxController, $auth) {
    $auth->validateToken(); // Cajero consulta su estado
    $boxController->getStatus();
});
$router->add('POST', '/box/open', function () use ($boxController, $auth) {
    $auth->validateToken(); // Cajero abre caja
    $boxController->open();
});
$router->add('POST', '/box/close', function () use ($boxController, $auth) {
    $auth->validateToken(); // Cajero cierra caja
    $boxController->close();
});

// Notificaciones
$router->add('GET', '/notifications', function () use ($notificationController, $auth) {
    $tokenData = $auth->validateToken();
    $notificationController->getAll($tokenData);
});
$router->add('PATCH', '/notifications/{id}/read', function ($id) use ($notificationController, $auth) {
    $tokenData = $auth->validateToken();
    $notificationController->markRead($tokenData, $id);
});

// Egresos (Gastos)
$router->add('GET', '/expenses', function () use ($expenseController, $auth) {
    $tokenData = $auth->validateToken(); // Admin y Cajero
    $expenseController->getAll($tokenData);
});
$router->add('GET', '/expenses/{id}', function ($id) use ($expenseController, $auth) {
    $tokenData = $auth->validateToken();
    $expenseController->getOne($id, $tokenData);
});
$router->add('POST', '/expenses', function () use ($expenseController, $auth) {
    $tokenData = $auth->validateToken();
    $expenseController->create($tokenData);
});
$router->add('PUT', '/expenses/{id}', function ($id) use ($expenseController, $auth) {
    $tokenData = $auth->validateToken();
    $expenseController->update($id, $tokenData);
});
$router->add('DELETE', '/expenses/{id}', function ($id) use ($expenseController, $auth) {
    $tokenData = $auth->validateToken();
    $expenseController->delete($id, $tokenData);
});

// Despachar la ruta
$router->dispatch($_SERVER['REQUEST_METHOD'], $request_uri);
