<?php
class Report {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    private function isUnknownColumn(Throwable $e): bool {
        $msg = $e->getMessage();
        return ($e instanceof PDOException && $e->getCode() === '42S22') || (is_string($msg) && stripos($msg, 'Unknown column') !== false);
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
        try {
            $buildAndRun = function (bool $withEstado) use ($fechaInicio, $fechaFin) {
                $query = "SELECT DATE(fecha) as fecha, SUM(total) as total FROM facturas ";
                $conditions = [];
                $params = [];

                if ($withEstado) {
                    $conditions[] = "estado != 'anulada'";
                }
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
            };

            try {
                return $buildAndRun(true);
            } catch (PDOException $e) {
                if ($this->isUnknownColumn($e) && stripos($e->getMessage(), 'estado') !== false) {
                    return $buildAndRun(false);
                }
                throw $e;
            }
        } catch (Exception $e) {
            error_log("Error en getSalesLastDays: " . $e->getMessage());
            // Retornar un statement vacío
            $stmt = $this->conn->prepare("SELECT NULL as fecha, NULL as total WHERE 0");
            $stmt->execute();
            return $stmt;
        }
    }

    /**
     * Obtiene los productos más vendidos en un rango de fechas.
     * 
     * @param string|null $fechaInicio Fecha inicio (YYYY-MM-DD)
     * @param string|null $fechaFin Fecha fin (YYYY-MM-DD)
     * @return PDOStatement Resultado de la consulta con nombre, descripción y cantidad vendida.
     */
    public function getTopProducts($fechaInicio = null, $fechaFin = null) {
        try {
            $buildAndRun = function (bool $withEstado) use ($fechaInicio, $fechaFin) {
                $query = "SELECT p.nombre, p.descripcion, p.tipo_venta, p.unidad_base, SUM(d.cantidad) as total_vendido 
                          FROM detalle_factura d 
                          JOIN productos p ON d.producto_id = p.id_producto 
                          JOIN facturas f ON d.factura_id = f.id_factura ";

                $conditions = [];
                $params = [];

                if ($withEstado) {
                    $conditions[] = "f.estado != 'anulada'";
                }
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

                $query .= " GROUP BY p.id_producto 
                          ORDER BY total_vendido DESC 
                          LIMIT 5";

                $stmt = $this->conn->prepare($query);
                foreach ($params as $key => $val) {
                    $stmt->bindValue($key, $val);
                }
                $stmt->execute();
                return $stmt;
            };

            try {
                return $buildAndRun(true);
            } catch (PDOException $e) {
                if ($this->isUnknownColumn($e) && stripos($e->getMessage(), 'estado') !== false) {
                    return $buildAndRun(false);
                }
                throw $e;
            }
        } catch (Exception $e) {
            error_log("Error en getTopProducts: " . $e->getMessage());
            // Retornar un statement vacío
            $stmt = $this->conn->prepare("SELECT NULL as nombre, NULL as descripcion, NULL as tipo_venta, NULL as unidad_base, NULL as total_vendido WHERE 0");
            $stmt->execute();
            return $stmt;
        }
    }

    /**
     * Obtiene la lista de productos cuyo stock actual es menor o igual al mínimo.
     * 
     * @return PDOStatement Resultado de la consulta.
     */
    public function getLowStock() {
        try {
            $query = "SELECT nombre, stock_actual, stock_minimo, tipo_venta, unidad_base 
                      FROM productos 
                      WHERE stock_actual <= stock_minimo AND estado = 'activo'";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt;
        } catch (Exception $e) {
            error_log("Error en getLowStock: " . $e->getMessage());
            $stmt = $this->conn->prepare("SELECT NULL as nombre, NULL as stock_actual, NULL as stock_minimo, NULL as tipo_venta, NULL as unidad_base WHERE 0");
            $stmt->execute();
            return $stmt;
        }
    }

    /**
     * Obtiene las últimas 5 ventas (facturas) registradas.
     * 
     * @return PDOStatement Resultado con id, fecha, total y nombre del cliente.
     */
    public function getRecentSales() {
        try {
            $query = "SELECT f.id_factura, f.fecha, f.total, f.estado, c.nombre as cliente 
                      FROM facturas f 
                      LEFT JOIN clientes c ON f.cliente_id = c.id_cliente 
                      ORDER BY f.fecha DESC 
                      LIMIT 5";

            try {
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
                return $stmt;
            } catch (PDOException $e) {
                if ($this->isUnknownColumn($e) && stripos($e->getMessage(), 'estado') !== false) {
                    $query2 = "SELECT f.id_factura, f.fecha, f.total, NULL as estado, c.nombre as cliente 
                               FROM facturas f 
                               LEFT JOIN clientes c ON f.cliente_id = c.id_cliente 
                               ORDER BY f.fecha DESC 
                               LIMIT 5";
                    $stmt2 = $this->conn->prepare($query2);
                    $stmt2->execute();
                    return $stmt2;
                }
                throw $e;
            }
        } catch (Exception $e) {
            error_log("Error en getRecentSales: " . $e->getMessage());
            $stmt = $this->conn->prepare("SELECT NULL as id_factura, NULL as fecha, NULL as total, NULL as estado, NULL as cliente WHERE 0");
            $stmt->execute();
            return $stmt;
        }
    }

    /**
     * Obtiene los últimos 5 productos registrados.
     * 
     * @return PDOStatement Resultado con nombre, precio y stock.
     */
    public function getRecentProducts() {
        try {
            $query = "SELECT nombre, precio_venta, stock_actual 
                      FROM productos 
                      ORDER BY id_producto DESC 
                      LIMIT 5";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt;
        } catch (Exception $e) {
            error_log("Error en getRecentProducts: " . $e->getMessage());
            $stmt = $this->conn->prepare("SELECT NULL as nombre, NULL as precio_venta, NULL as stock_actual WHERE 0");
            $stmt->execute();
            return $stmt;
        }
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
        try {
            // Total ventas hoy (dinero)
            $resultToday = null;
            try {
                $stmtToday = $this->conn->prepare("SELECT SUM(total) as total_hoy FROM facturas WHERE DATE(fecha) = CURDATE() AND estado != 'anulada'");
                $stmtToday->execute();
                $resultToday = $stmtToday->fetch(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                if ($this->isUnknownColumn($e) && stripos($e->getMessage(), 'estado') !== false) {
                    $stmtToday2 = $this->conn->prepare("SELECT SUM(total) as total_hoy FROM facturas WHERE DATE(fecha) = CURDATE()");
                    $stmtToday2->execute();
                    $resultToday = $stmtToday2->fetch(PDO::FETCH_ASSOC);
                } else {
                    throw $e;
                }
            }
            $totalToday = $resultToday['total_hoy'] ?? 0;

            // Total egresos hoy
            $totalEgresosToday = 0;
            try {
                $stmtEgrToday = $this->conn->prepare("SELECT SUM(monto) as egresos_hoy FROM egresos WHERE DATE(fecha) = CURDATE()");
                $stmtEgrToday->execute();
                $rowEgrToday = $stmtEgrToday->fetch(PDO::FETCH_ASSOC);
                $totalEgresosToday = $rowEgrToday['egresos_hoy'] ?? 0;
            } catch (Throwable $e) {
                // Si no existe la tabla todavía, ignorar
                $totalEgresosToday = 0;
            }

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
            
            $queryPeriodWithEstado = $queryPeriod . "WHERE " . implode(" AND ", $conditions);
            $resultPeriod = null;
            try {
                $stmtPeriod = $this->conn->prepare($queryPeriodWithEstado);
                foreach ($params as $key => $val) {
                    $stmtPeriod->bindValue($key, $val);
                }
                $stmtPeriod->execute();
                $resultPeriod = $stmtPeriod->fetch(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                if ($this->isUnknownColumn($e) && stripos($e->getMessage(), 'estado') !== false) {
                    $conditionsNoEstado = array_values(array_filter($conditions, function ($c) {
                        return stripos($c, 'estado') === false;
                    }));
                    $queryPeriodNoEstado = $queryPeriod . (!empty($conditionsNoEstado) ? "WHERE " . implode(" AND ", $conditionsNoEstado) : "");
                    $stmtPeriod2 = $this->conn->prepare($queryPeriodNoEstado);
                    foreach ($params as $key => $val) {
                        $stmtPeriod2->bindValue($key, $val);
                    }
                    $stmtPeriod2->execute();
                    $resultPeriod = $stmtPeriod2->fetch(PDO::FETCH_ASSOC);
                } else {
                    throw $e;
                }
            }
            $totalPeriod = $resultPeriod['total_periodo'] ?? 0;

            // Total egresos del periodo (mes actual o rango seleccionado)
            $totalEgresosPeriod = 0;
            try {
                $queryEgr = "SELECT SUM(monto) as total_egresos_periodo FROM egresos ";
                $egrConditions = [];
                $egrParams = [];
                if ($fechaInicio || $fechaFin) {
                    if ($fechaInicio) {
                        $egrConditions[] = "DATE(fecha) >= :fechaInicio";
                        $egrParams[':fechaInicio'] = $fechaInicio;
                    }
                    if ($fechaFin) {
                        $egrConditions[] = "DATE(fecha) <= :fechaFin";
                        $egrParams[':fechaFin'] = $fechaFin;
                    }
                } else {
                    $egrConditions[] = "MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())";
                }
                if (!empty($egrConditions)) {
                    $queryEgr .= "WHERE " . implode(" AND ", $egrConditions);
                }
                $stmtEgr = $this->conn->prepare($queryEgr);
                foreach ($egrParams as $key => $val) {
                    $stmtEgr->bindValue($key, $val);
                }
                $stmtEgr->execute();
                $rowEgr = $stmtEgr->fetch(PDO::FETCH_ASSOC);
                $totalEgresosPeriod = $rowEgr['total_egresos_periodo'] ?? 0;
            } catch (Throwable $e) {
                $totalEgresosPeriod = 0;
            }

            // Cantidad de productos bajos de stock
            $queryLow = "SELECT COUNT(*) as low_stock_count FROM productos WHERE stock_actual <= stock_minimo AND estado = 'activo'";
            $stmtLow = $this->conn->prepare($queryLow);
            $stmtLow->execute();
            $resultLow = $stmtLow->fetch(PDO::FETCH_ASSOC);
            $lowStockCount = $resultLow['low_stock_count'] ?? 0;

            return [
                "ventas_hoy" => $totalToday ? (float)$totalToday : 0,
                "ventas_mes" => $totalPeriod ? (float)$totalPeriod : 0,
                "egresos_hoy" => $totalEgresosToday ? (float)$totalEgresosToday : 0,
                "egresos_mes" => $totalEgresosPeriod ? (float)$totalEgresosPeriod : 0,
                "neto_mes" => ((float)($totalPeriod ?: 0)) - ((float)($totalEgresosPeriod ?: 0)),
                "productos_bajo_stock" => (int)$lowStockCount
            ];
        } catch (Exception $e) {
            error_log("Error en getKPIs: " . $e->getMessage());
            return [
                "ventas_hoy" => 0,
                "ventas_mes" => 0,
                "egresos_hoy" => 0,
                "egresos_mes" => 0,
                "neto_mes" => 0,
                "productos_bajo_stock" => 0
            ];
        }
    }
}
