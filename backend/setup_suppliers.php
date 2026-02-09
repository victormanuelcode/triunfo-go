<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

include_once 'config/Database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $sql = "CREATE TABLE IF NOT EXISTS proveedores (
        id_proveedor INT(11) NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        nit VARCHAR(20) DEFAULT NULL,
        telefono VARCHAR(20) DEFAULT NULL,
        direccion VARCHAR(150) DEFAULT NULL,
        email VARCHAR(100) DEFAULT NULL,
        creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_proveedor)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";

    $db->exec($sql);
    echo "Tabla 'proveedores' verificada/creada exitosamente.<br>";

    // También crear la tabla pivote proveedor_producto si no existe
    $sql_pivot = "CREATE TABLE IF NOT EXISTS proveedor_producto (
        id INT(11) NOT NULL AUTO_INCREMENT,
        proveedor_id INT(11) NOT NULL,
        producto_id INT(11) NOT NULL,
        creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY proveedor_producto_unique (proveedor_id, producto_id),
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id_proveedor) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id_producto) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";

    $db->exec($sql_pivot);
    echo "Tabla 'proveedor_producto' verificada/creada exitosamente.<br>";

} catch(PDOException $e) {
    echo "Error al crear tablas: " . $e->getMessage();
}
?>