<?php
include_once __DIR__ . '/../models/Report.php';

class ReportController {
    private $db;
    private $report;

    public function __construct($db) {
        $this->db = $db;
        $this->report = new Report($db);
    }

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
