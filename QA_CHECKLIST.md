## Checklist de Pruebas de Regresión — TRIUNFO GO (con lotes)

Este checklist sirve para validar que las funciones principales siguen funcionando después de cambios en inventario por lotes.

### 1) Instalación y entorno
- [ ] Apache y MySQL activos (XAMPP).
- [ ] `/proyecto_final/backend/test-db` responde conexión exitosa.
- [ ] `backend/vendor/` existe (Composer instalado).
- [ ] Login abre: `/proyecto_final/frontend/views/auth/login.html`.

### 2) Autenticación y roles
- [ ] Login Admin funciona y entra a `frontend/views/admin/dashboard.html`.
- [ ] Login Cajero funciona y entra a `frontend/views/cashier/dashboard.html`.
- [ ] Cajero no puede entrar a `/admin/` (redirige o bloquea).
- [ ] Admin no entra a `/cashier/` (redirige a dashboard).
- [ ] Logout borra sesión y bloquea rutas protegidas.

### 3) Caja (Cajero)
- [ ] Abrir caja con monto inicial.
- [ ] POS bloquea venta si caja está cerrada.
- [ ] Cierre de caja calcula totales y diferencia.

### 4) Catálogo e inventario (Admin)
- [ ] Crear producto nuevo (con y sin imagen).
- [ ] Editar producto (sin cambiar stock).
- [ ] Bloqueo: no permite editar `stock_actual` desde edición de producto.

### 5) Lotes (Admin)
- [ ] En Inventario → botón **Lotes** abre modal de lotes del producto.
- [ ] Crear lote (Nueva entrada): aumenta stock total del producto.
- [ ] Listado de lotes muestra cantidad disponible y precio del lote.

### 6) Ajustes / Movimientos (Admin)
- [ ] Movimientos carga tabla sin errores.
- [ ] Registrar Movimiento exige seleccionar **Producto + Lote**.
- [ ] Ajuste de salida con stock suficiente descuenta lote y stock total.
- [ ] Ajuste de salida con stock insuficiente muestra error.
- [ ] Tabla de movimientos muestra el lote (número o #id).

### 7) Ventas por lotes (Cajero)
- [ ] POS carga catálogo de productos.
- [ ] POS muestra desglose por lotes al tener carrito y caja abierta.
- [ ] Venta FIFO: consume lote más viejo primero.
- [ ] Venta manual: escoger lote y verificar consumo del lote seleccionado.
- [ ] Venta mezclando lotes: total suma precios distintos por lote.
- [ ] Stock insuficiente: venta no se registra.

### 8) Documentos
- [ ] Factura muestra lote por ítem (Lote: #id o número).
- [ ] Ticket muestra lote por ítem.

### 9) Reportes (Admin)
- [ ] Dashboard carga KPIs y tablas.
- [ ] Historial de facturas carga y muestra detalle.

### 10) Verificación en BD (mínimo)
- [ ] `detalle_factura.lote_id` se llena en ventas nuevas.
- [ ] `movimientos_inventario.lote_id` se llena en ventas/entradas/ajustes.
- [ ] `lotes_producto.cantidad_disponible` se actualiza con ventas y ajustes.
