<?php
// To trigger email in background from register.php:
// exec("php send_email_background.php $registration_id > /dev/null 2>&1 &");

include 'email_verification.php';

if (php_sapi_name() === 'cli' && isset($argv[1])) {
    $registration_id = intval($argv[1]);
    $result = triggerEmailVerification($registration_id);
    
    // Log the result
    file_put_contents('email_log.txt', 
        date('Y-m-d H:i:s') . " - Reg ID: $registration_id - " . 
        json_encode($result) . "\n", 
        FILE_APPEND
    );
}