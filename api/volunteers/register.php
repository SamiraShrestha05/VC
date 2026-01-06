<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

include '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON received']);
    exit;
}

// Required fields for basic registration
if (!isset($data['event_id'], $data['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing event_id or user_id']);
    exit;
}

// Required fields for volunteer details
$required = ['fullName', 'email', 'phone', 'emergencyContact', 'dateOfBirth', 'volunteerRole'];
foreach ($required as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
        exit;
    }
}

$event_id = intval($data['event_id']);
$user_id  = intval($data['user_id']);

try {
    $conn->beginTransaction();

    // STEP 1: Check if user already registered (using existing table)
    $stmt = $conn->prepare("SELECT registration_id FROM VOLUNTEER_REGISTRATION WHERE user_id = :user_id AND event_id = :event_id");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':event_id', $event_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'error' => 'Already registered for this event']);
        exit;
    }

    // STEP 2: Calculate age from date of birth
    $dob = new DateTime($data['dateOfBirth']);
    $today = new DateTime();
    $age = $today->diff($dob)->y;
    
    if ($age < 16) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'error' => 'Must be at least 16 years old to volunteer']);
        exit;
    }

    // STEP 3: Insert basic registration into existing table
    $stmt = $conn->prepare("INSERT INTO VOLUNTEER_REGISTRATION (user_id, event_id, status) VALUES (:user_id, :event_id, 'pending')");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':event_id', $event_id, PDO::PARAM_INT);
    
    if (!$stmt->execute()) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'error' => 'Failed to create registration']);
        exit;
    }
    
    $registration_id = $conn->lastInsertId();

    // STEP 4: Insert detailed information into new table
    // Process time slots array
    $timeSlots = isset($data['timeSlots']) && is_array($data['timeSlots']) 
        ? implode(',', $data['timeSlots']) 
        : '';
    
    $stmt = $conn->prepare("
        INSERT INTO VOLUNTEER_DETAILS 
        (registration_id, full_name, email, phone, emergency_contact, date_of_birth, 
         preferred_role, time_slots, experience, skills, photo_release, additional_notes) 
        VALUES 
        (:registration_id, :full_name, :email, :phone, :emergency_contact, :date_of_birth,
         :preferred_role, :time_slots, :experience, :skills, :photo_release, :additional_notes)
    ");
    
    // Bind parameters
    $stmt->bindParam(':registration_id', $registration_id, PDO::PARAM_INT);
    $stmt->bindParam(':full_name', $data['fullName']);
    $stmt->bindParam(':email', $data['email']);
    $stmt->bindParam(':phone', $data['phone']);
    $stmt->bindParam(':emergency_contact', $data['emergencyContact']);
    $stmt->bindParam(':date_of_birth', $data['dateOfBirth']);
    $stmt->bindParam(':preferred_role', $data['volunteerRole']);
    $stmt->bindParam(':time_slots', $timeSlots);
    $stmt->bindParam(':experience', $data['experience']);
    $stmt->bindParam(':skills', $data['skills']);
    $photoRelease = isset($data['photoRelease']) && $data['photoRelease'] ? 1 : 0;
    $stmt->bindParam(':photo_release', $photoRelease, PDO::PARAM_INT);
    $additionalNotes = isset($data['additionalNotes']) ? $data['additionalNotes'] : '';
    $stmt->bindParam(':additional_notes', $additionalNotes);

    if (!$stmt->execute()) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'error' => 'Failed to save volunteer details']);
        exit;
    }

    $conn->commit();

     // Trigger email verification in background
    // You can use this in production:
    // exec("php email_verification.php $registration_id > /dev/null 2>&1 &");
    
    // For testing, call directly:
    include 'email_verification.php';
    $emailResult = triggerEmailVerification($registration_id, $conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Registration submitted successfully',
        'registration_id' => $registration_id,
        'age_verified' => $age,
        'email_sent' => $emailResult['success'],  // NEW
        'email_message' => $emailResult['message'] // NEW
    ]);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}