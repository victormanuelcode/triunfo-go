<?php
/**
 * Clase Router
 * 
 * Enrutador simple para manejar solicitudes HTTP.
 * Permite definir rutas con métodos HTTP y callbacks asociados.
 * Soporta parámetros dinámicos en las URLs (ej: /user/{id}).
 */
class Router {
    private $routes = [];

    /**
     * Añade una ruta al enrutador.
     * 
     * @param string $method Método HTTP (GET, POST, PUT, DELETE, etc.).
     * @param string $path Ruta URL (puede contener parámetros entre llaves, ej: /product/{id}).
     * @param callable $callback Función o método a ejecutar cuando coincida la ruta.
     */
    public function add($method, $path, $callback) {
        $path = preg_replace('/\{[a-zA-Z0-9_]+\}/', '([a-zA-Z0-9_]+)', $path);
        $this->routes[] = [
            'method' => $method,
            'path' => '#^' . $path . '$#',
            'callback' => $callback
        ];
    }

    /**
     * Despacha la solicitud actual a la ruta correspondiente.
     * 
     * Busca una coincidencia entre las rutas registradas y la URI solicitada.
     * Si encuentra coincidencia, ejecuta el callback pasando los parámetros capturados.
     * Si no, devuelve un error 404.
     * 
     * @param string $method Método HTTP de la solicitud.
     * @param string $uri URI solicitada.
     * @return mixed Resultado del callback ejecutado.
     */
    public function dispatch($method, $uri) {
        // Eliminar query string (ej: ?page=1)
        $uri = parse_url($uri, PHP_URL_PATH);

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['path'], $uri, $matches)) {
                array_shift($matches); 
                return call_user_func_array($route['callback'], $matches);
            }
        }

        http_response_code(404);
        echo json_encode(["message" => "Ruta no encontrada"]);
    }
}
?>
