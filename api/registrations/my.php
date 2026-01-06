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
        vr.status as registration_status,
        vr.registered_at,
        e.event_id,
        e.title as event_title,
        e.description,
        e.location,
        e.start_datetime,
        e.end_datetime,
        e.status as event_status
    FROM VOLUNTEER_REGISTRATION vr
    JOIN EVENT e ON vr.event_id = e.event_id
    WHERE vr.user_id = :user_id
    ORDER BY 
        vr.status = 'unverified' DESC,  -- Show unverified first
        e.start_datetime ASC
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
