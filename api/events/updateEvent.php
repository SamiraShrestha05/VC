<?php
header('Content-Type: application/json');
include '../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit;
    }

    $event_id = isset($data['event_id']) ? (int)$data['event_id'] : 0;
    $title = isset($data['title']) ? trim($data['title']) : '';
    $description = isset($data['description']) ? trim($data['description']) : '';
    $location = isset($data['location']) ? trim($data['location']) : '';
    $start_datetime = isset($data['start_datetime']) ? $data['start_datetime'] : '';
    $end_datetime = isset($data['end_datetime']) ? $data['end_datetime'] : '';
    $volunteer_slots = isset($data['volunteer_slots']) ? (int)$data['volunteer_slots'] : 0;
    $status = isset($data['status']) ? $data['status'] : '';

    if (!$event_id || !$title || !$description || !$location || !$start_datetime || !$end_datetime || !$volunteer_slots || !$status) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE events SET 
        title = :title, 
        description = :description, 
        location = :location, 
        start_datetime = :start_datetime, 
        end_datetime = :end_datetime, 
        volunteer_slots = :volunteer_slots, 
        status = :status
        WHERE event_id = :event_id
    ");

    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':location', $location);
    $stmt->bindParam(':start_datetime', $start_datetime);
    $stmt->bindParam(':end_datetime', $end_datetime);
    $stmt->bindParam(':volunteer_slots', $volunteer_slots, PDO::PARAM_INT);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':event_id', $event_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Event updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Update failed']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}
