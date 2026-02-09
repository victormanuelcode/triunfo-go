<?php
class Report {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Ventas de los últimos 7 días
    public function getSalesLastDays() {
        $query = "SELECT DATE(fecha) as fecha, SUM(total) as total 
                  FROM facturas 
                  GROUP BY DATE(fecha) 
                  ORDER BY fecha DESC 
                  LIMIT 7";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Productos más vendidos
    public function getTopProducts() {
        $query = "SELECT p.nombre, SUM(d.cantidad) as total_vendido 
                  FROM detalle_factura d 
                  JOIN productos p ON d.producto_id = p.id_producto 
                  GROUP BY d.producto_id 
                  ORDER BY total_vendido DESC 
                  LIMIT 5";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Productos con stock bajo
    public function getLowStock() {
        $query = "SELECT nombre, stock_actual, stock_minimo 
                  FROM productos 
                  WHERE stock_actual <= stock_minimo AND estado = 'activo'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Totales generales (KPIs)
    public function getKPIs() {
        // Total ventas hoy
        $queryToday = "SELECT SUM(total) as total_hoy FROM facturas WHERE DATE(fecha) = CURDATE()";
        $stmtToday = $this->conn->prepare($queryToday);
        $stmtToday->execute();
        $totalToday = $stmtToday->fetch(PDO::FETCH_ASSOC)['total_hoy'] ?? 0;

        // Total ventas mes
        $queryMonth = "SELECT SUM(total) as total_mes FROM facturas WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())";
        $stmtMonth = $this->conn->prepare($queryMonth);
        $stmtMonth->execute();
        $totalMonth = $stmtMonth->fetch(PDO::FETCH_ASSOC)['total_mes'] ?? 0;

        // Cantidad de productos bajos de stock
        $queryLow = "SELECT COUNT(*) as low_stock_count FROM productos WHERE stock_actual <= stock_minimo AND estado = 'activo'";
        $stmtLow = $this->conn->prepare($queryLow);
        $stmtLow->execute();
        $lowStockCount = $stmtLow->fetch(PDO::FETCH_ASSOC)['low_stock_count'] ?? 0;

        return [
            "ventas_hoy" => $totalToday,
            "ventas_mes" => $totalMonth,
            "productos_bajo_stock" => $lowStockCount
        ];
    }
}
?>
