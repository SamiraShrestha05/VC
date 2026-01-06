<?php
// verify.php - Handle email verification
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include '../../config/database.php';

// Get token and registration ID from URL
$token = $_GET['token'] ?? '';
$registration_id = $_GET['id'] ?? '';

if (empty($token) || empty($registration_id)) {
    die("Invalid verification link.");
}

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Check if token exists and is not expired
    $stmt = $conn->prepare("SELECT ev.*, vr.user_id, vr.event_id 
                           FROM EMAIL_VERIFICATION ev
                           JOIN VOLUNTEER_REGISTRATION vr ON ev.registration_id = vr.registration_id
                           WHERE ev.email_token = :token 
                           AND ev.registration_id = :reg_id 
                           AND ev.expires_at > NOW() 
                           AND ev.verified_at IS NULL");
    $stmt->bindParam(':token', $token);
    $stmt->bindParam(':reg_id', $registration_id);
    $stmt->execute();
    
    $verification = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$verification) {
        die("Verification link is invalid or expired.");
    }

    // Start transaction
    $conn->beginTransaction();

    // Mark email as verified
    $stmt = $conn->prepare("UPDATE EMAIL_VERIFICATION 
                           SET verified_at = NOW() 
                           WHERE verification_id = :verification_id");
    $stmt->bindParam(':verification_id', $verification['verification_id']);
    $stmt->execute();

    // Update registration status to confirmed
    $stmt = $conn->prepare("UPDATE VOLUNTEER_REGISTRATION 
                           SET email_status = 'verified' 
                           WHERE registration_id = :registration_id");
    $stmt->bindParam(':registration_id', $registration_id);
    $stmt->execute();

    $conn->commit();
    
    // Success message
    echo "
    <html>
    <head>
        <title>Email Verified</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #4CAF50; font-size: 24px; margin-bottom: 20px; }
            .message { margin: 20px 0; }
            .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class='success'>✓ Email Verified Successfully!</div>
        <div class='message'>Your registration has been confirmed.</div>
        <a href='http://localhost/samira/VC/MyProfile.html' class='button'>Go to Profile</a>
    </body>
    </html>
    ";
    
} catch (PDOException $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    die("Verification failed: " . $e->getMessage());
}