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
     * 
     * @return void
     */
    public function getDashboardData() {
        // Ventas últimos 7 días
        $stmtSales = $this->report->getSalesLastDays();
        $salesData = $stmtSales->fetchAll(PDO::FETCH_ASSOC);

        // Top Productos
        $stmtTop = $this->report->getTopProducts();
        $topProducts = $stmtTop->fetchAll(PDO::FETCH_ASSOC);

        // Stock Bajo
        $stmtLow = $this->report->getLowStock();
        $lowStock = $stmtLow->fetchAll(PDO::FETCH_ASSOC);

        // KPIs
        $kpis = $this->report->getKPIs();

        echo json_encode([
            "sales_last_days" => array_reverse($salesData), // Revertir para mostrar cronológicamente en gráfica
            "top_products" => $topProducts,
            "low_stock" => $lowStock,
            "kpis" => $kpis
        ]);
    }
}
?>
