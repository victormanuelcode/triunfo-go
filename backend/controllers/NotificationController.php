<?php
include_once __DIR__ . '/../models/Notification.php';

class NotificationController {
    private $db;
    private $notification;

    public function __construct($db) {
        $this->db = $db;
        $this->notification = new Notification($db);
    }

    public function getAll($tokenData) {
        $id = $tokenData['id_usuario'];
        $onlyUnread = isset($_GET['only_unread']) && ($_GET['only_unread'] === '1' || $_GET['only_unread'] === 'true');
        $stmt = $this->notification->getForUser($id, $onlyUnread, 100);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        http_response_code(200);
        echo json_encode($rows);
    }

    public function markRead($tokenData, $id) {
        $ok = $this->notification->markRead((int)$id);
        if ($ok) {
            http_response_code(200);
            echo json_encode(["message" => "Notificación marcada como leída"]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo actualizar la notificación"]);
        }
    }
}
?>
