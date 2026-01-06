<?php
require '../../vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function triggerEmailVerification($registration_id, $conn = null) {
    try {
        // If connection not provided, create new
        if (!$conn) {
            include '../../config/database.php';
            $db = new Database();
            $conn = $db->getConnection();
        }
        
        // Get registration details
        $stmt = $conn->prepare("
            SELECT vr.registration_id, vr.user_id, vr.event_id, 
                   vd.full_name, vd.email, e.title as event_title
            FROM VOLUNTEER_REGISTRATION vr
            JOIN VOLUNTEER_DETAILS vd ON vr.registration_id = vd.registration_id
            JOIN EVENT e ON vr.event_id = e.event_id
            WHERE vr.registration_id = :registration_id
            AND vr.email_status = 'unverified'
        ");
        $stmt->bindParam(':registration_id', $registration_id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            return ['success' => false, 'message' => 'Registration not found or already verified'];
        }
        
        $registration = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Check if verification already exists and is not expired
        $stmt = $conn->prepare("
            SELECT verification_id FROM EMAIL_VERIFICATION 
            WHERE registration_id = :registration_id 
            AND expires_at > NOW()
            AND verified_at IS NULL
        ");
        $stmt->bindParam(':registration_id', $registration_id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            return ['success' => false, 'message' => 'Active verification already exists'];
        }
        
        // Generate new verification token
        $email_token = bin2hex(random_bytes(32));
        $expires_at = (new DateTime())->modify('+24 hours')->format('Y-m-d H:i:s');
        
        // Insert into EMAIL_VERIFICATION table
        $stmt = $conn->prepare("
            INSERT INTO EMAIL_VERIFICATION 
            (registration_id, user_id, event_id, email_token, expires_at)
            VALUES 
            (:registration_id, :user_id, :event_id, :email_token, :expires_at)
        ");
        
        $stmt->bindParam(':registration_id', $registration['registration_id'], PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $registration['user_id'], PDO::PARAM_INT);
        $stmt->bindParam(':event_id', $registration['event_id'], PDO::PARAM_INT);
        $stmt->bindParam(':email_token', $email_token);
        $stmt->bindParam(':expires_at', $expires_at);
        
        if (!$stmt->execute()) {
            return ['success' => false, 'message' => 'Failed to create verification record'];
        }
        
        // Send verification email
        $mailResult = sendVerificationEmail(
            $registration['email'],
            $registration['full_name'],
            $registration['event_title'],
            $email_token,
            $registration['registration_id']
        );
        
        if ($mailResult) {
            return ['success' => true, 'message' => 'Verification email sent successfully'];
        } else {
            return ['success' => false, 'message' => 'Failed to send verification email'];
        }
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
    }
}

function sendVerificationEmail($toEmail, $userName, $eventTitle, $token, $registrationId) {
    try {
        $mail = new PHPMailer(true);
        
        // Mailtrap SMTP Configuration
        $mail->isSMTP();
        $mail->Host = 'sandbox.smtp.mailtrap.io';
        $mail->SMTPAuth = true;
        $mail->Port = 587;
        $mail->Username = 'ce16bd6e7da78a';    // Replace with your actual Mailtrap credentials
        $mail->Password = 'c7ac3162bb0bfb';    // Replace with your actual Mailtrap credentials
        $mail->SMTPSecure = 'tls';
        $mail->SMTPDebug = 0;
        
        // Email content
        $mail->setFrom('noreply@volunteerconnect.com', 'Volunteer Connect');
        $mail->addAddress($toEmail, $userName);
        $mail->addReplyTo('support@volunteerconnect.com', 'Support Team');
        
        $mail->isHTML(true);
        $mail->Subject = 'Verify Your Event Registration - ' . $eventTitle;
        
        // Verification URL
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
        
        // Plain text version
        $mail->AltBody = "Hello {$userName},\n\nThank you for registering for: {$eventTitle}.\n\nPlease verify your registration by visiting:\n{$verification_url}\n\nThis link expires in 24 hours.\n\nIf you didn't register, please ignore this email.";
        
        $mail->send();
        return true;
        
    } catch (Exception $e) {
        error_log("Mailer Error: " . $mail->ErrorInfo);
        return false;
    }
}

// For standalone execution (when called via command line)
if (php_sapi_name() === 'cli' && isset($argv[1])) {
    $registration_id = intval($argv[1]);
    $result = triggerEmailVerification($registration_id);
    echo json_encode($result) . "\n";
}