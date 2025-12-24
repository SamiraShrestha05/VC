<?php
header('Content-Type: application/json');
include '../../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Validate user_id
    if (!isset($_GET['user_id']) || intval($_GET['user_id']) == 0) {
        echo json_encode(['success' => false, 'message' => 'User ID missing']);
        exit;
    }

    $user_id = intval($_GET['user_id']);

    // Fetch user's volunteer registrations with event info
    $stmt = $conn->prepare("
        SELECT 
            vr.registration_id,
            vr.status AS registration_status,
            vr.registered_at AS registration_date,
            e.event_id,
            e.title AS event_title,
            e.description AS event_description,
            e.start_datetime,
            e.end_datetime
        FROM VOLUNTEER_REGISTRATION vr
        INNER JOIN EVENT e ON vr.event_id = e.event_id
        WHERE vr.user_id = :user_id
        ORDER BY vr.registered_at DESC
    ");

    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();

    $registrations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $registrations]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
