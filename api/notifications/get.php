<?php
header('Content-Type: application/json');
include '../../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    if (!isset($_GET['user_id']) || intval($_GET['user_id']) == 0) {
        echo json_encode(['success' => false, 'message' => 'User ID missing']);
        exit;
    }

    $user_id = intval($_GET['user_id']);

    $stmt = $conn->prepare("
        SELECT message, created_at, is_read
        FROM notifications
        WHERE user_id = :user_id
        ORDER BY created_at DESC
    ");

    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();

    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $notifications]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
