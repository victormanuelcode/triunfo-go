<?php
class Report {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene el total de ventas diarias en un rango de fechas.
     * Si no se especifican fechas, devuelve los últimos 7 días.
     * 
     * @param string|null $fechaInicio Fecha inicio (YYYY-MM-DD)
     * @param string|null $fechaFin Fecha fin (YYYY-MM-DD)
     * @return PDOStatement Resultado de la consulta con fecha y total.
     */
    public function getSalesLastDays($fechaInicio = null, $fechaFin = null) {
        $query = "SELECT DATE(fecha) as fecha, SUM(total) as total 
                  FROM facturas ";
        
        $conditions = ["estado != 'anulada'"];
        $params = [];

        if ($fechaInicio) {
            $conditions[] = "DATE(fecha) >= :fechaInicio";
            $params[':fechaInicio'] = $fechaInicio;
        }
        if ($fechaFin) {
            $conditions[] = "DATE(fecha) <= :fechaFin";
            $params[':fechaFin'] = $fechaFin;
        }

        if (!empty($conditions)) {
            $query .= "WHERE " . implode(" AND ", $conditions);
        }

        $query .= " GROUP BY DATE(fecha) ORDER BY fecha DESC";

        if (!$fechaInicio && !$fechaFin) {
            $query .= " LIMIT 7";
        }
        
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        return $stmt;
    }

    /**
     * Obtiene los productos más vendidos en un rango de fechas.
     * 
     * @param string|null $fechaInicio Fecha inicio (YYYY-MM-DD)
     * @param string|null $fechaFin Fecha fin (YYYY-MM-DD)
     * @return PDOStatement Resultado de la consulta con nombre, descripción y cantidad vendida.
     */
    public function getTopProducts($fechaInicio = null, $fechaFin = null) {
        $query = "SELECT p.nombre, p.descripcion, SUM(d.cantidad) as total_vendido 
                  FROM detalle_factura d 
                  JOIN productos p ON d.producto_id = p.id_producto 
                  JOIN facturas f ON d.factura_id = f.id_factura ";
        
        $conditions = ["f.estado != 'anulada'"];
        $params = [];

        if ($fechaInicio) {
            $conditions[] = "DATE(f.fecha) >= :fechaInicio";
            $params[':fechaInicio'] = $fechaInicio;
        }
        if ($fechaFin) {
            $conditions[] = "DATE(f.fecha) <= :fechaFin";
            $params[':fechaFin'] = $fechaFin;
        }

        if (!empty($conditions)) {
            $query .= "WHERE " . implode(" AND ", $conditions);
        }

        $query .= " GROUP BY d.producto_id 
                  ORDER BY total_vendido DESC 
                  LIMIT 5";
        
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        return $stmt;
    }

    /**
     * Obtiene la lista de productos cuyo stock actual es menor o igual al mínimo.
     * 
     * @return PDOStatement Resultado de la consulta.
     */
    public function getLowStock() {
        $query = "SELECT nombre, stock_actual, stock_minimo 
                  FROM productos 
                  WHERE stock_actual <= stock_minimo AND estado = 'activo'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Obtiene las últimas 5 ventas (facturas) registradas.
     * 
     * @return PDOStatement Resultado con id, fecha, total y nombre del cliente.
     */
    public function getRecentSales() {
        $query = "SELECT f.id_factura, f.fecha, f.total, f.estado, c.nombre as cliente 
                  FROM facturas f 
                  LEFT JOIN clientes c ON f.cliente_id = c.id_cliente 
                  ORDER BY f.fecha DESC 
                  LIMIT 5";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Obtiene los últimos 5 productos registrados.
     * 
     * @return PDOStatement Resultado con nombre, precio y stock.
     */
    public function getRecentProducts() {
        $query = "SELECT nombre, precio_venta, stock_actual 
                  FROM productos 
                  ORDER BY id_producto DESC 
                  LIMIT 5";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Calcula los indicadores clave de rendimiento (KPIs) generales.
     * Incluye ventas de hoy, ventas del periodo y conteo de productos con bajo stock.
     * 
     * @param string|null $fechaInicio Fecha inicio (YYYY-MM-DD)
     * @param string|null $fechaFin Fecha fin (YYYY-MM-DD)
     * @return array Array asociativo con los KPIs.
     */
    public function getKPIs($fechaInicio = null, $fechaFin = null) {
        // Total ventas hoy (dinero)
        $queryToday = "SELECT SUM(total) as total_hoy FROM facturas WHERE DATE(fecha) = CURDATE() AND estado != 'anulada'";
        $stmtToday = $this->conn->prepare($queryToday);
        $stmtToday->execute();
        $totalToday = $stmtToday->fetch(PDO::FETCH_ASSOC)['total_hoy'] ?? 0;

        // Cantidad facturas hoy
        $queryCountToday = "SELECT COUNT(*) as count_hoy FROM facturas WHERE DATE(fecha) = CURDATE() AND estado != 'anulada'";
        $stmtCountToday = $this->conn->prepare($queryCountToday);
        $stmtCountToday->execute();
        $countToday = $stmtCountToday->fetch(PDO::FETCH_ASSOC)['count_hoy'] ?? 0;

        // Total ventas periodo (mes actual o rango seleccionado)
        $queryPeriod = "SELECT SUM(total) as total_periodo FROM facturas ";
        $conditions = ["estado != 'anulada'"];
        $params = [];

        if ($fechaInicio || $fechaFin) {
            if ($fechaInicio) {
                $conditions[] = "DATE(fecha) >= :fechaInicio";
                $params[':fechaInicio'] = $fechaInicio;
            }
            if ($fechaFin) {
                $conditions[] = "DATE(fecha) <= :fechaFin";
                $params[':fechaFin'] = $fechaFin;
            }
        } else {
            // Por defecto mes actual
            $conditions[] = "MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())";
        }
        
        $queryPeriod .= "WHERE " . implode(" AND ", $conditions);

        $stmtPeriod = $this->conn->prepare($queryPeriod);
        foreach ($params as $key => $val) {
            $stmtPeriod->bindValue($key, $val);
        }
        $stmtPeriod->execute();
        $totalPeriod = $stmtPeriod->fetch(PDO::FETCH_ASSOC)['total_periodo'] ?? 0;

        // Cantidad de productos bajos de stock
        $queryLow = "SELECT COUNT(*) as low_stock_count FROM productos WHERE stock_actual <= stock_minimo AND estado = 'activo'";
        $stmtLow = $this->conn->prepare($queryLow);
        $stmtLow->execute();
        $lowStockCount = $stmtLow->fetch(PDO::FETCH_ASSOC)['low_stock_count'] ?? 0;

        // Usuarios activos (total usuarios habilitados)
        $queryUsers = "SELECT COUNT(*) as user_count FROM usuarios";
        $stmtUsers = $this->conn->prepare($queryUsers);
        $stmtUsers->execute();
        $userCount = $stmtUsers->fetch(PDO::FETCH_ASSOC)['user_count'] ?? 0;

        return [
            "ventas_hoy" => $totalToday,
            "facturas_hoy" => $countToday,
            "ventas_mes" => $totalPeriod,
            "productos_bajo_stock" => $lowStockCount,
            "usuarios_activos" => $userCount
        ];
    }
}
