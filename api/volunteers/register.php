<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

include '../../config/database.php';

// Include PHPMailer
require '../../vendor/autoload.php'; // Adjust path based on your structure
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

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
    $db = new Database();
    $conn = $db->getConnection();

    // Check if user already registered
    $stmt = $conn->prepare("SELECT registration_id FROM VOLUNTEER_REGISTRATION 
                           WHERE user_id = :user_id AND event_id = :event_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':event_id', $event_id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'error' => 'Already registered for this event']);
        exit;
    }

    // Start transaction
    $conn->beginTransaction();

    // Step 1: Insert registration
    $stmt = $conn->prepare("INSERT INTO VOLUNTEER_REGISTRATION (user_id, event_id, status) 
                           VALUES (:user_id, :event_id, 'pending')");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':event_id', $event_id);
    $stmt->execute();
    
    $registration_id = $conn->lastInsertId();

    // Step 2: Generate verification token
    $email_token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Step 3: Store verification token
    $stmt = $conn->prepare("INSERT INTO EMAIL_VERIFICATION 
                           (registration_id, user_id, event_id, email_token, expires_at) 
                           VALUES (:registration_id, :user_id, :event_id, :email_token, :expires_at)");
    $stmt->bindParam(':registration_id', $registration_id);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':event_id', $event_id);
    $stmt->bindParam(':email_token', $email_token);
    $stmt->bindParam(':expires_at', $expires_at);
    $stmt->execute();

    // Step 4: Get user and event details for email
    $stmt = $conn->prepare("SELECT u.email, u.full_name, e.title 
                           FROM USER u 
                           JOIN EVENT e ON e.event_id = :event_id 
                           WHERE u.user_id = :user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':event_id', $event_id);
    $stmt->execute();
    $details = $stmt->fetch(PDO::FETCH_ASSOC);

    // Step 5: Send verification email via Mailtrap SMTP
    $email_sent = sendVerificationEmail(
        $details['email'],
        $details['full_name'],
        $details['title'],
        $email_token,
        $registration_id
    );

    if ($email_sent) {
        $conn->commit();
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful! Please check your email to verify.',
            'registration_id' => $registration_id,
            'email_sent' => true
        ]);
    } else {
        $conn->rollBack();
        echo json_encode(['success' => false, 'error' => 'Registration failed: Could not send verification email']);
    }

} catch (PDOException $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}

function sendVerificationEmail($toEmail, $userName, $eventTitle, $token, $registrationId) {
    try {
        // Create PHPMailer instance
        $mail = new PHPMailer(true);
        
        // Mailtrap SMTP Configuration
        // Get your credentials from: Mailtrap → Inboxes → SMTP Settings
        $mail->isSMTP();
        $mail->Host = 'sandbox.smtp.mailtrap.io';       // Mailtrap host
        $mail->SMTPAuth = true;
        $mail->Port = 587;                             // Mailtrap port
        $mail->Username = 'ce16bd6e7da78a';    // Replace with your Mailtrap username
        $mail->Password = 'c7ac3162bb0bfb';    // Replace with your Mailtrap password
        $mail->SMTPSecure = 'tls';                     // TLS encryption
        
        // Debugging (set to 0 in production)
        $mail->SMTPDebug = 0; // 0 = off, 1 = client messages, 2 = client and server messages
        
        // Email content
        $mail->setFrom('noreply@volunteerconnect.com', 'Volunteer Connect');
        $mail->addAddress($toEmail, $userName);
        $mail->addReplyTo('support@volunteerconnect.com', 'Support Team');
        
        $mail->isHTML(true);
        $mail->Subject = 'Verify Your Event Registration - ' . $eventTitle;
        
        // Verification URL (adjust to your actual domain)
        $base_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
        $verification_url = $base_url . "/samira/VC/api/volunteers/verify.php?token={$token}&id={$registrationId}";
        
        // HTML email body
        $mail->Body = "
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background-color: #f9f9f9; }
                .button { display: inline-block; background-color: #4CAF50; color: white; 
                          padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                          margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                .code { background-color: #f1f1f1; padding: 10px; margin: 10px 0; 
                        font-family: monospace; word-break: break-all; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Volunteer Connect</h1>
                </div>
                <div class='content'>
                    <h2>Verify Your Event Registration</h2>
                    <p>Hello <strong>{$userName}</strong>,</p>
                    <p>Thank you for registering for the event: <strong>{$eventTitle}</strong>.</p>
                    <p>Please click the button below to confirm your registration:</p>
                    
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{$verification_url}' class='button'>Verify Registration</a>
                    </div>
                    
                    <p>Or copy and paste this link in your browser:</p>
                    <div class='code'>{$verification_url}</div>
                    
                    <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
                    
                    <hr style='margin: 30px 0;'>
                    
                    <p><small>If you didn't register for this event, please ignore this email or contact support.</small></p>
                </div>
                <div class='footer'>
                    <p>&copy; " . date('Y') . " Volunteer Connect. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        // Plain text version for email clients that don't support HTML
        $mail->AltBody = "Hello {$userName},\n\nThank you for registering for: {$eventTitle}.\n\nPlease verify your registration by visiting:\n{$verification_url}\n\nThis link expires in 24 hours.\n\nIf you didn't register, please ignore this email.";
        
        // Send email
        $mail->send();
        return true;
        
    } catch (Exception $e) {
        // Log the error (in production, use a proper logging system)
        error_log("Mailer Error: " . $mail->ErrorInfo);
        return false;
    }
}