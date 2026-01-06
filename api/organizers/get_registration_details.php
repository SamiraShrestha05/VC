<?php
// api/organizers/get_registration_details.php
header('Content-Type: application/json');
include '../../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['registration_id']) || empty($data['registration_id'])) {
        echo json_encode(['success' => false, 'message' => 'Registration ID required']);
        exit;
    }

    $registration_id = intval($data['registration_id']);

    $stmt = $conn->prepare("
        SELECT 
            vr.registration_id,
            vr.status,
            vr.email_status,
            vr.registered_at,
            vd.full_name,
            vd.email,
            vd.phone,
            vd.emergency_contact,
            vd.date_of_birth,
            vd.preferred_role,
            vd.time_slots,
            vd.experience,
            vd.skills,
            vd.photo_release,
            vd.additional_notes,
            e.event_id,
            e.title as event_title,
            e.description as event_description,
            e.location as event_location,
            e.start_datetime as event_start,
            e.end_datetime as event_end
        FROM VOLUNTEER_REGISTRATION vr
        JOIN VOLUNTEER_DETAILS vd ON vr.registration_id = vd.registration_id
        JOIN EVENT e ON vr.event_id = e.event_id
        WHERE vr.registration_id = :registration_id
    ");

    $stmt->bindParam(':registration_id', $registration_id, PDO::PARAM_INT);
    $stmt->execute();

    $registration = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($registration) {
        echo json_encode(['success' => true, 'data' => $registration]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration not found']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>