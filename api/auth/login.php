<?php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed. Use POST.', 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password'])) {
    sendError('Email and password are required');
}

$auth = new Auth();
$result = $auth->login($input['email'], $input['password']);

if ($result['success']) {
    sendSuccess($result['user'], $result['message']);
    // After successful login
session_start();
$_SESSION['user_id'] = $user_id; 
$_SESSION['username'] = $row['username'];
$_SESSION['is_admin'] = $row['is_admin'];// $user_id from database

} else {
    sendError($result['message']);
}
?>