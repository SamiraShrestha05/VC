<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// Include your PDO database class
include '../../config/database.php';

// Get PDO connection
$db = new Database();
$conn = $db->getConnection();

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON received']);
    exit;
}

if (!isset($data['event_id'], $data['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

$event_id = intval($data['event_id']);
$user_id  = intval($data['user_id']);

try {
    // STEP 1: Check if user already registered
    $stmt = $conn->prepare("SELECT registration_id FROM VOLUNTEER_REGISTRATION WHERE user_id = :user_id AND event_id = :event_id");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':event_id', $event_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'error' => 'Already registered for this event']);
        exit;
    }

    // STEP 2: Insert new registration
    $stmt = $conn->prepare("INSERT INTO VOLUNTEER_REGISTRATION (user_id, event_id, status) VALUES (:user_id, :event_id, 'pending')");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':event_id', $event_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful',
            'registration_id' => $conn->lastInsertId()
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Database insert failed']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
