<?php
/**
 * Clase Invoice
 * 
 * Gestiona el ciclo de vida de las facturas de venta.
 * Incluye la creación de cabeceras y detalles, actualización de inventario,
 * registro de movimientos y consultas de historial.
 * Utiliza transacciones para garantizar la integridad de los datos.
 */
class Invoice {
    private $conn;
    private $table_name = "facturas";

    public $id_factura;
    public $numero_factura;
    public $cliente_id;
    public $usuario_id; // Nuevo campo trazabilidad
    public $sesion_id; // Nuevo campo para control de caja
    public $cliente_nombre; // Propiedad agregada para evitar errores de propiedad dinámica
    public $usuario_nombre; // Nuevo campo trazabilidad
    public $total;
    public $metodo_pago;
    public $observaciones;
    public $fecha;
    public $items = []; // Array de productos a vender
    public $detalles = []; // Array para lectura de detalles

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene el historial de facturas con paginación.
     * Incluye el nombre del cliente asociado.
     * 
     * @param int $limit Cantidad de registros por página.
     * @param int $offset Desplazamiento de registros.
     * @return PDOStatement Resultado de la consulta.
     */
    public function read($limit = 10, $offset = 0) {
        $query = "SELECT f.id_factura, f.numero_factura, f.fecha, f.total, f.metodo_pago, c.nombre as cliente_nombre 
                  FROM " . $this->table_name . " f 
                  LEFT JOIN clientes c ON f.cliente_id = c.id_cliente 
                  ORDER BY f.fecha DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Cuenta el total de facturas registradas en el sistema.
     * 
     * @return int Número total de facturas.
     */
    public function count() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    /**
     * Obtiene una factura completa incluyendo sus detalles (productos).
     * Carga tanto la cabecera como los ítems asociados.
     * 
     * @return boolean True si la factura existe y se cargó correctamente.
     */
    public function readOne() {
        // 1. Obtener cabecera
        $query = "SELECT f.*, c.nombre as cliente_nombre, u.nombre as usuario_nombre
                  FROM " . $this->table_name . " f
                  LEFT JOIN clientes c ON f.cliente_id = c.id_cliente
                  LEFT JOIN usuarios u ON f.usuario_id = u.id_usuario
                  WHERE f.id_factura = ? LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id_factura);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $this->numero_factura = $row['numero_factura'];
            $this->fecha = $row['fecha'];
            $this->cliente_id = $row['cliente_id'];
            $this->usuario_id = $row['usuario_id'];
            $this->sesion_id = $row['sesion_id'] ?? null; // Manejo de nulo si la columna no existe o es nula
            $this->total = $row['total'];
            $this->metodo_pago = $row['metodo_pago'];
            $this->observaciones = $row['observaciones'];
            // Propiedad auxiliar para el nombre del cliente
            $this->cliente_nombre = $row['cliente_nombre'];
            $this->usuario_nombre = $row['usuario_nombre'];

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

    /**
     * Crea una nueva factura de venta.
     * Realiza múltiples operaciones en una transacción:
     * 1. Inserta la cabecera de la factura.
     * 2. Inserta los detalles (productos vendidos).
     * 3. Descuenta el stock de los productos.
     * 4. Registra los movimientos de inventario (salida).
     * 
     * @return boolean True si la transacción se completó exitosamente.
     * @throws Exception Si ocurre algún error durante el proceso (capturado internamente).
     */
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
                          usuario_id=:usuario_id,
                          sesion_id=:sesion_id,
                          total=:total, 
                          metodo_pago=:metodo_pago, 
                          observaciones=:observaciones";
            
            $stmt = $this->conn->prepare($query);
            
            // Saneamiento de datos
            $this->observaciones = htmlspecialchars(strip_tags($this->observaciones ?? ''));
            
            // Asegurar que cliente_id sea NULL si está vacío
            if (empty($this->cliente_id)) {
                $this->cliente_id = null;
            }
            
            // Vincular parámetros
            $stmt->bindParam(":numero_factura", $this->numero_factura);
            $stmt->bindParam(":cliente_id", $this->cliente_id);
            $stmt->bindParam(":usuario_id", $this->usuario_id);
            $stmt->bindParam(":sesion_id", $this->sesion_id);
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
            // Variables para vinculación
            $d_factura_id = $this->id_factura;
            $d_producto_id = 0;
            $d_cantidad = 0;
            $d_precio = 0;
            $d_subtotal = 0;
            
            // Vincular Detalle
            $stmt_detail->bindParam(":factura_id", $d_factura_id);
            $stmt_detail->bindParam(":producto_id", $d_producto_id);
            $stmt_detail->bindParam(":cantidad", $d_cantidad);
            $stmt_detail->bindParam(":precio_unitario", $d_precio);
            $stmt_detail->bindParam(":subtotal", $d_subtotal);

            // Vincular Stock
            $s_cantidad = 0;
            $s_producto_id = 0;
            $stmt_stock->bindParam(":cantidad", $s_cantidad);
            $stmt_stock->bindParam(":producto_id", $s_producto_id);

            // Vincular Movimiento
            $m_producto_id = 0;
            $m_cantidad = 0;
            $m_descripcion = "Venta Factura " . $this->numero_factura;
            $m_referencia = $this->numero_factura;

            $stmt_mov->bindParam(":producto_id", $m_producto_id);
            $stmt_mov->bindParam(":cantidad", $m_cantidad);
            $stmt_mov->bindParam(":descripcion", $m_descripcion);
            $stmt_mov->bindParam(":referencia", $m_referencia);

            foreach ($this->items as $item) {
                // Asignar valores a las variables vinculadas
                $d_producto_id = $item['producto_id'];
                $d_cantidad = $item['cantidad'];
                $d_precio = $item['precio_unitario'];
                $d_subtotal = $item['cantidad'] * $item['precio_unitario'];
                
                // Stock vars
                $s_cantidad = $item['cantidad'];
                $s_producto_id = $item['producto_id'];

                // Variables de Movimiento
                $m_producto_id = $item['producto_id'];
                $m_cantidad = $item['cantidad'];
                // m_descripcion y m_referencia son constantes por factura

                // a. Insertar Detalle
                if (!$stmt_detail->execute()) {
                    throw new Exception("Error al insertar detalle del producto ID: " . $item['producto_id']);
                }

                // b. Descontar Stock
                if (!$stmt_stock->execute()) {
                    throw new Exception("Error al actualizar stock del producto ID: " . $item['producto_id']);
                }

                // c. Registrar Movimiento de Salida
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
            error_log($e->getMessage()); // Registrar error
            return false;
        }
    }
}
?>
