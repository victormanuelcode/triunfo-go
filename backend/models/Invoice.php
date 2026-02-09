<?php
class Invoice {
    private $conn;
    private $table_name = "facturas";

    public $id_factura;
    public $numero_factura;
    public $cliente_id;
    public $cliente_nombre; // Propiedad agregada para evitar errores de propiedad dinámica
    public $total;
    public $metodo_pago;
    public $observaciones;
    public $fecha;
    public $items = []; // Array de productos a vender
    public $detalles = []; // Array para lectura de detalles

    public function __construct($db) {
        $this->conn = $db;
    }

    // Leer todas las facturas (Historial)
    public function read() {
        $query = "SELECT f.id_factura, f.numero_factura, f.fecha, f.total, f.metodo_pago, c.nombre as cliente_nombre 
                  FROM " . $this->table_name . " f 
                  LEFT JOIN clientes c ON f.cliente_id = c.id_cliente 
                  ORDER BY f.fecha DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Leer una factura con sus detalles
    public function readOne() {
        // 1. Obtener cabecera
        $query = "SELECT f.*, c.nombre as cliente_nombre 
                  FROM " . $this->table_name . " f
                  LEFT JOIN clientes c ON f.cliente_id = c.id_cliente
                  WHERE f.id_factura = ? LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_factura);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->numero_factura = $row['numero_factura'];
            $this->fecha = $row['fecha'];
            $this->cliente_id = $row['cliente_id']; // o el nombre si prefieres
            $this->total = $row['total'];
            $this->metodo_pago = $row['metodo_pago'];
            $this->observaciones = $row['observaciones'];
            // Propiedad auxiliar para el nombre del cliente
            $this->cliente_nombre = $row['cliente_nombre'];

            // 2. Obtener detalles
            $query_det = "SELECT d.*, p.nombre as producto_nombre 
                          FROM detalle_factura d
                          LEFT JOIN productos p ON d.producto_id = p.id_producto
                          WHERE d.factura_id = ?";
            $stmt_det = $this->conn->prepare($query_det);
            $stmt_det->bindParam(1, $this->id_factura);
            $stmt_det->execute();

            while ($row_det = $stmt_det->fetch(PDO::FETCH_ASSOC)) {
                array_push($this->detalles, $row_det);
            }
            return true;
        }
        return false;
    }

    public function create() {
        try {
            // Iniciar transacción
            $this->conn->beginTransaction();

            // 1. Generar número de factura (simple por ahora: timestamp)
            $this->numero_factura = 'FAC-' . time();

            // 2. Insertar Factura
            $query = "INSERT INTO " . $this->table_name . " 
                      SET numero_factura=:numero_factura, 
                          cliente_id=:cliente_id, 
                          total=:total, 
                          metodo_pago=:metodo_pago, 
                          observaciones=:observaciones";
            
            $stmt = $this->conn->prepare($query);

            // Sanitizar
            $this->observaciones = htmlspecialchars(strip_tags($this->observaciones));

            // Bind
            $stmt->bindParam(":numero_factura", $this->numero_factura);
            $stmt->bindParam(":cliente_id", $this->cliente_id);
            $stmt->bindParam(":total", $this->total);
            $stmt->bindParam(":metodo_pago", $this->metodo_pago);
            $stmt->bindParam(":observaciones", $this->observaciones);

            if (!$stmt->execute()) {
                throw new Exception("Error al crear la factura encabezado.");
            }

            $this->id_factura = $this->conn->lastInsertId();

            // 3. Preparar consultas para Detalles y Movimientos (fuera del loop para optimizar)
            // a. Insertar Detalle
            $query_detail = "INSERT INTO detalle_factura 
                             SET factura_id=:factura_id, 
                                 producto_id=:producto_id, 
                                 cantidad=:cantidad, 
                                 precio_unitario=:precio_unitario, 
                                 subtotal=:subtotal";
            $stmt_detail = $this->conn->prepare($query_detail);

            // b. Descontar Stock
            $query_stock = "UPDATE productos 
                            SET stock_actual = stock_actual - :cantidad 
                            WHERE id_producto = :producto_id";
            $stmt_stock = $this->conn->prepare($query_stock);

            // c. Registrar Movimiento de Salida
            $query_mov = "INSERT INTO movimientos_inventario 
                          SET tipo='salida', producto_id=:producto_id, 
                              cantidad=:cantidad, descripcion=:descripcion, 
                              referencia=:referencia";
            $stmt_mov = $this->conn->prepare($query_mov);

            // 4. Procesar Items
            foreach ($this->items as $item) {
                // a. Insertar Detalle
                $subtotal = $item['cantidad'] * $item['precio_unitario'];
                
                $stmt_detail->bindParam(":factura_id", $this->id_factura);
                $stmt_detail->bindParam(":producto_id", $item['producto_id']);
                $stmt_detail->bindParam(":cantidad", $item['cantidad']);
                $stmt_detail->bindParam(":precio_unitario", $item['precio_unitario']);
                $stmt_detail->bindParam(":subtotal", $subtotal);

                if (!$stmt_detail->execute()) {
                    throw new Exception("Error al insertar detalle del producto ID: " . $item['producto_id']);
                }

                // b. Descontar Stock
                $stmt_stock->bindParam(":cantidad", $item['cantidad']);
                $stmt_stock->bindParam(":producto_id", $item['producto_id']);

                if (!$stmt_stock->execute()) {
                    throw new Exception("Error al actualizar stock del producto ID: " . $item['producto_id']);
                }

                // c. Registrar Movimiento de Salida
                $descripcion = "Venta Factura " . $this->numero_factura;
                
                $stmt_mov->bindParam(":producto_id", $item['producto_id']);
                $stmt_mov->bindParam(":cantidad", $item['cantidad']);
                $stmt_mov->bindParam(":descripcion", $descripcion);
                $stmt_mov->bindParam(":referencia", $this->numero_factura);

                if (!$stmt_mov->execute()) {
                    throw new Exception("Error al registrar movimiento de inventario.");
                }
            }

            // Confirmar transacción
            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            // Revertir cambios si algo falla
            $this->conn->rollBack();
            error_log($e->getMessage()); // Loggear error
            return false;
        }
    }
}
?>
