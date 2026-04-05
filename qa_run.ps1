$ErrorActionPreference = 'Stop'
$AllowDestructive = $false

function Invoke-ApiJson {
  param(
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Url,
    [Parameter(Mandatory=$false)][string]$Token,
    [Parameter(Mandatory=$false)][object]$Body
  )

  $headers = @{}
  if ($Token) { $headers['Authorization'] = "Bearer $Token" }

  if ($Body -ne $null) {
    $json = $Body | ConvertTo-Json -Compress
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -ContentType 'application/json' -Body $json -TimeoutSec 10
  }

  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -TimeoutSec 10
}

function Try-Login {
  param([string]$User, [string[]]$Passwords)
  foreach ($p in $Passwords) {
    try {
      $resp = Invoke-ApiJson -Method 'POST' -Url 'http://localhost/proyecto_final/backend/login' -Body @{ usuario = $User; contrasena = $p }
      if ($resp.token) {
        Write-Host "LOGIN_OK user=$User rol=$($resp.rol_id) user_id=$($resp.user_id)"
        return $resp
      }
    } catch {
      continue
    }
  }
  Write-Host "LOGIN_FAIL user=$User"
  return $null
}

Write-Host "== QA START =="

try {
  $db = Invoke-ApiJson -Method 'GET' -Url 'http://localhost/proyecto_final/backend/test-db'
  Write-Host "test-db: OK"
} catch {
  Write-Host "test-db: FAIL"
  throw
}

$adminLogin = Try-Login -User 'admin' -Passwords @('Admin123*')
$cashierLogin = Try-Login -User 'Cajero' -Passwords @('cajero123456')
if (-not $cashierLogin) { $cashierLogin = Try-Login -User 'cajero' -Passwords @('cajero123456') }

if (-not $adminLogin -and -not $cashierLogin) {
  throw "No se pudo obtener token. Ajusta credenciales en qa_run.ps1."
}

if ($adminLogin -and -not $cashierLogin) {
  try {
    $users = Invoke-ApiJson -Method 'GET' -Url 'http://localhost/proyecto_final/backend/users' -Token $adminLogin.token
    $cashierUserExact = ($users | Where-Object { ($_.usuario -as [string]) -ieq 'Cajero' } | Select-Object -First 1)
    if ($cashierUserExact) {
      Write-Host "cashier user found: id=$($cashierUserExact.id_usuario) usuario=$($cashierUserExact.usuario)"
      if ($AllowDestructive) {
        try {
          Invoke-ApiJson -Method 'PUT' -Url ("http://localhost/proyecto_final/backend/users/{0}" -f $cashierUserExact.id_usuario) -Token $adminLogin.token -Body @{
            nombre = $cashierUserExact.nombre
            usuario = $cashierUserExact.usuario
            email = $cashierUserExact.email
            rol_id = [int]$cashierUserExact.rol_id
            contrasena = 'cajero123456'
          } | Out-Null
          Write-Host "cashier password reset: OK"
        } catch {
          Write-Host "cashier password reset: SKIP"
        }
      } else {
        Write-Host "cashier password reset: SKIP (AllowDestructive=false)"
      }
      $cashierLogin = Try-Login -User 'Cajero' -Passwords @('cajero123456')
    }

    if (-not $cashierLogin) {
      $cashierUserAny = ($users | Where-Object { [int]$_.rol_id -eq 2 } | Select-Object -First 1)
      if ($cashierUserAny -and $cashierUserAny.usuario) {
        $cashierLogin = Try-Login -User $cashierUserAny.usuario -Passwords @('cajero123456')
      }
    }

    if (-not $cashierLogin) {
      $qaUser = 'qa_cajero'
      if ($AllowDestructive) {
        try {
          Invoke-ApiJson -Method 'POST' -Url 'http://localhost/proyecto_final/backend/users' -Token $adminLogin.token -Body @{
            nombre = 'QA Cajero'
            usuario = $qaUser
            contrasena = 'cajero123456'
            email = 'qa_cajero@triunfo.go'
            rol_id = 2
          } | Out-Null
          Write-Host "qa cashier created: OK"
        } catch {
          Write-Host "qa cashier created: SKIP"
        }
      } else {
        Write-Host "qa cashier created: SKIP (AllowDestructive=false)"
      }
      $cashierLogin = Try-Login -User $qaUser -Passwords @('cajero123456')
    }
  } catch {}
}

if ($adminLogin) {
  $adminToken = $adminLogin.token
  $profile = Invoke-ApiJson -Method 'GET' -Url 'http://localhost/proyecto_final/backend/profile' -Token $adminToken
  Write-Host "admin profile: OK"
  Invoke-ApiJson -Method 'PUT' -Url 'http://localhost/proyecto_final/backend/profile' -Token $adminToken -Body @{ email = $profile.email; telefono = $profile.telefono; avatar_url = $profile.avatar_url; preferencias = $profile.preferencias } | Out-Null
  Write-Host "admin profile update: OK"

  $notifs = Invoke-ApiJson -Method 'GET' -Url 'http://localhost/proyecto_final/backend/notifications?only_unread=0' -Token $adminToken
  Write-Host "admin notifications: OK count=$($notifs.Count)"
  if ($notifs.Count -gt 0) {
    Invoke-ApiJson -Method 'PATCH' -Url ("http://localhost/proyecto_final/backend/notifications/{0}/read" -f $notifs[0].id) -Token $adminToken | Out-Null
    Write-Host "admin notifications mark read: OK"
  }
}

if ($cashierLogin) {
  $cashierToken = $cashierLogin.token
  $cashierId = [int]$cashierLogin.user_id

  $status = Invoke-ApiJson -Method 'GET' -Url ("http://localhost/proyecto_final/backend/box/status?usuario_id={0}" -f $cashierId) -Token $cashierToken
  Write-Host "cashier box status (before): hasSession=$([bool]$status)"
  try {
    Invoke-ApiJson -Method 'POST' -Url 'http://localhost/proyecto_final/backend/box/open' -Token $cashierToken -Body @{ usuario_id = $cashierId; monto_apertura = 0 } | Out-Null
    Write-Host "cashier box open: OK"
  } catch {
    Write-Host "cashier box open: SKIP"
  }
  $status = Invoke-ApiJson -Method 'GET' -Url ("http://localhost/proyecto_final/backend/box/status?usuario_id={0}" -f $cashierId) -Token $cashierToken
  Write-Host "cashier box status (after): hasSession=$([bool]$status)"
}

$tokenForAdminOps = $adminLogin.token
$productsResp = Invoke-ApiJson -Method 'GET' -Url 'http://localhost/proyecto_final/backend/products?limit=50&page=1' -Token $tokenForAdminOps
$products = @()
if ($productsResp.data) { $products = $productsResp.data }
if (-not $products -or $products.Count -lt 1) {
  Write-Host "products list: EMPTY -> creando producto QA"
  Invoke-ApiJson -Method 'POST' -Url 'http://localhost/proyecto_final/backend/products' -Token $tokenForAdminOps -Body @{ nombre = 'QA Producto'; descripcion = 'Producto temporal QA'; precio_venta = 1000; stock_actual = 0; stock_minimo = 1; estado = 'activo' } | Out-Null
  $productsResp = Invoke-ApiJson -Method 'GET' -Url 'http://localhost/proyecto_final/backend/products?limit=50&page=1' -Token $tokenForAdminOps
  if ($productsResp.data) { $products = $productsResp.data }
}
if (-not $products -or $products.Count -lt 1) { throw "No hay productos para probar (ni se pudo crear QA Producto)." }
$p0 = $products[0]
$productId = [int]$p0.id_producto
Write-Host "products list: OK first_product_id=$productId"

$lotsResp = Invoke-ApiJson -Method 'GET' -Url ("http://localhost/proyecto_final/backend/products/{0}/lots" -f $productId) -Token $tokenForAdminOps
$lots = @()
if ($lotsResp.data) { $lots = $lotsResp.data } elseif ($lotsResp -is [System.Array]) { $lots = $lotsResp }
Write-Host "lots list: OK count=$($lots.Count)"

$newLot = Invoke-ApiJson -Method 'POST' -Url 'http://localhost/proyecto_final/backend/lots' -Token $tokenForAdminOps -Body @{ producto_id = $productId; cantidad = 1; precio_venta = [double]$p0.precio_venta; costo_unitario = 0 }
$newLotId = [int]$newLot.id_lote
Write-Host "lot create: OK id=$newLotId"

Invoke-ApiJson -Method 'PUT' -Url ("http://localhost/proyecto_final/backend/lots/{0}" -f $newLotId) -Token $tokenForAdminOps -Body @{ precio_venta = [double]$p0.precio_venta; costo_unitario = 0; numero_lote = $null } | Out-Null
Write-Host "lot update: OK"

Invoke-ApiJson -Method 'POST' -Url ("http://localhost/proyecto_final/backend/lots/{0}/restock" -f $newLotId) -Token $tokenForAdminOps -Body @{ cantidad = 1 } | Out-Null
Write-Host "lot restock: OK"

Invoke-ApiJson -Method 'DELETE' -Url ("http://localhost/proyecto_final/backend/lots/{0}" -f $newLotId) -Token $tokenForAdminOps | Out-Null
Write-Host "lot delete/inactivate: OK"

if ($cashierLogin) {
  $cashierToken = $cashierLogin.token
  $cashierId = [int]$cashierLogin.user_id

  $quote = Invoke-ApiJson -Method 'POST' -Url 'http://localhost/proyecto_final/backend/invoices/quote' -Token $cashierToken -Body @{ usuario_id = $cashierId; items = @(@{ producto_id = $productId; cantidad = 1 }) }
  Write-Host "invoice quote: OK total=$($quote.total)"

  $inv = Invoke-ApiJson -Method 'POST' -Url 'http://localhost/proyecto_final/backend/invoices' -Token $cashierToken -Body @{ usuario_id = $cashierId; cliente_id = $null; total = $quote.total; metodo_pago = 'efectivo'; items = @(@{ producto_id = $productId; cantidad = 1 }) }
  $invId = [int]$inv.id_factura
  Write-Host "invoice create: OK id=$invId"

  $detail = Invoke-ApiJson -Method 'GET' -Url ("http://localhost/proyecto_final/backend/invoices/{0}" -f $invId) -Token $cashierToken
  $hasLot = $false
  if ($detail.detalles) {
    foreach ($d in $detail.detalles) {
      if ($d.lote_id) { $hasLot = $true; break }
    }
  }
  Write-Host "invoice detail: OK detalle_factura.lote_id_present=$hasLot"

  if ($adminLogin) {
    Invoke-ApiJson -Method 'POST' -Url ("http://localhost/proyecto_final/backend/invoices/{0}/annul" -f $invId) -Token $adminLogin.token | Out-Null
    Write-Host "invoice annul (admin): OK"
  }

  Invoke-ApiJson -Method 'POST' -Url 'http://localhost/proyecto_final/backend/box/close' -Token $cashierToken -Body @{ id_sesion = (Invoke-ApiJson -Method 'GET' -Url ("http://localhost/proyecto_final/backend/box/status?usuario_id={0}" -f $cashierId) -Token $cashierToken).id_sesion; monto_cierre = 0 } | Out-Null
  Write-Host "cashier box close: OK"
}

Write-Host "== QA END =="
