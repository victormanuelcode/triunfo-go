<?php
include_once __DIR__ . '/../models/Report.php';

/**
 * Controlador para la generación de reportes y dashboard.
 * Provee datos agregados para visualización en el frontend.
 */
class ReportController {
    private $db;
    private $report;

    /**
     * Constructor de la clase.
     * 
     * @param PDO $db Conexión a la base de datos
     */
    public function __construct($db) {
        $this->db = $db;
        $this->report = new Report($db);
    }

    /**
     * Obtiene los datos para el dashboard principal.
     * Incluye ventas de los últimos días, productos más vendidos, stock bajo y KPIs generales.
     * Permite filtrar por rango de fechas (fecha_inicio, fecha_fin).
     * 
     * @return void
     */
    public function getDashboardData() {
        // Obtener parámetros de filtro si existen
        $fechaInicio = isset($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : null;
        $fechaFin = isset($_GET['fecha_fin']) ? $_GET['fecha_fin'] : null;

        // Ventas últimos 7 días o rango seleccionado
        $stmtSales = $this->report->getSalesLastDays($fechaInicio, $fechaFin);
        $salesData = $stmtSales->fetchAll(PDO::FETCH_ASSOC);

        // Top Productos (filtrado)
        $stmtTop = $this->report->getTopProducts($fechaInicio, $fechaFin);
        $topProducts = $stmtTop->fetchAll(PDO::FETCH_ASSOC);

        // Stock Bajo (siempre actual, no depende de fechas históricas)
        $stmtLow = $this->report->getLowStock();
        $lowStock = $stmtLow->fetchAll(PDO::FETCH_ASSOC);

        // Últimas ventas (Historial) - Se podría filtrar, pero por ahora mostramos recientes globales
        $stmtRecentSales = $this->report->getRecentSales();
        $recentSales = $stmtRecentSales->fetchAll(PDO::FETCH_ASSOC);

        // Últimos productos (Nuevos)
        $stmtRecentProducts = $this->report->getRecentProducts();
        $recentProducts = $stmtRecentProducts->fetchAll(PDO::FETCH_ASSOC);

        // KPIs (filtrados)
        $kpis = $this->report->getKPIs($fechaInicio, $fechaFin);

        echo json_encode([
            "sales_last_days" => array_reverse($salesData), // Revertir para mostrar cronológicamente en gráfica
            "top_products" => $topProducts,
            "low_stock" => $lowStock,
            "recent_sales" => $recentSales,
            "recent_products" => $recentProducts,
            "kpis" => $kpis
        ]);
    }
}
