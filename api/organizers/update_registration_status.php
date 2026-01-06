<?php
// api/organizers/update_registration_status.php
header('Content-Type: application/json');
include '../../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['registration_id']) || !isset($data['new_status'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $registration_id = intval($data['registration_id']);
    $new_status = $data['new_status'];
    
    // Validate status
    $allowed_statuses = ['pending', 'confirmed', 'cancelled'];
    if (!in_array($new_status, $allowed_statuses)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit;
    }

    $conn->beginTransaction();
    
    // Update registration status
    $stmt = $conn->prepare("
        UPDATE VOLUNTEER_REGISTRATION 
        SET status = :new_status 
        WHERE registration_id = :registration_id
    ");
    
    $stmt->bindParam(':registration_id', $registration_id, PDO::PARAM_INT);
    $stmt->bindParam(':new_status', $new_status);
    $stmt->execute();
    
    // Also update email_status if confirming and it's unverified
    if ($new_status === 'confirmed') {
        $stmt = $conn->prepare("
            UPDATE VOLUNTEER_REGISTRATION 
            SET email_status = 'verified' 
            WHERE registration_id = :registration_id 
            AND email_status = 'unverified'
        ");
        $stmt->bindParam(':registration_id', $registration_id, PDO::PARAM_INT);
        $stmt->execute();
    }
    
    $conn->commit();
    
    echo json_encode(['success' => true, 'message' => 'Status updated successfully']);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>