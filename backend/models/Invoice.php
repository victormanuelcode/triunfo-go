<?php
class Invoice {
    private $conn;
    private $table_name = "facturas";

    public $id_factura;
    public $numero_factura;
    public $cliente_id;
    public $total;
    public $metodo_pago;
    public $observaciones;
    public $items = []; // Array de productos a vender

    public function __construct($db) {
        $this->conn = $db;
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

            // 3. Insertar Detalles y Actualizar Stock
            foreach ($this->items as $item) {
                // a. Insertar Detalle
                $query_detail = "INSERT INTO detalle_factura 
                                 SET factura_id=:factura_id, 
                                     producto_id=:producto_id, 
                                     cantidad=:cantidad, 
                                     precio_unitario=:precio_unitario, 
                                     subtotal=:subtotal";
                
                $stmt_detail = $this->conn->prepare($query_detail);
                
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
                $query_stock = "UPDATE productos 
                                SET stock_actual = stock_actual - :cantidad 
                                WHERE id_producto = :producto_id";
                $stmt_stock = $this->conn->prepare($query_stock);
                $stmt_stock->bindParam(":cantidad", $item['cantidad']);
                $stmt_stock->bindParam(":producto_id", $item['producto_id']);

                if (!$stmt_stock->execute()) {
                    throw new Exception("Error al actualizar stock del producto ID: " . $item['producto_id']);
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
