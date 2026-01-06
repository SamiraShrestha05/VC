<?php
// api/organizers/get_registrations.php
header('Content-Type: application/json');
include '../../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['organizer_id']) || empty($data['organizer_id'])) {
        echo json_encode(['success' => false, 'message' => 'Organizer ID required']);
        exit;
    }

    $organizer_id = intval($data['organizer_id']);

    $stmt = $conn->prepare("
        SELECT 
            vr.registration_id,
            vr.user_id,
            vr.status,
            vr.email_status,
            vr.registered_at,
            vd.full_name,
            vd.email,
            vd.phone,
            vd.preferred_role,
            vd.date_of_birth,
            e.event_id,
            e.title as event_title,
            e.start_datetime
        FROM VOLUNTEER_REGISTRATION vr
        JOIN VOLUNTEER_DETAILS vd ON vr.registration_id = vd.registration_id
        JOIN EVENT e ON vr.event_id = e.event_id
        WHERE e.organizer_id = :organizer_id
        ORDER BY vr.registered_at DESC
    ");

    $stmt->bindParam(':organizer_id', $organizer_id, PDO::PARAM_INT);
    $stmt->execute();

    $registrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true, 
        'registrations' => $registrations,
        'count' => count($registrations)
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>