<?php
class Router {
    private $routes = [];

    public function add($method, $path, $callback) {
        $path = preg_replace('/\{[a-zA-Z0-9_]+\}/', '([a-zA-Z0-9_]+)', $path);
        $this->routes[] = [
            'method' => $method,
            'path' => '#^' . $path . '$#',
            'callback' => $callback
        ];
    }

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
