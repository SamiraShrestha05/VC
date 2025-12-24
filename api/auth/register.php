<?php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed. Use POST.', 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['username']) || !isset($input['email']) || !isset($input['password']) || !isset($input['full_name'])) {
    sendError('Username, email, password, and full name are required');
}

$auth = new Auth();
$result = $auth->register(
    $input['username'],
    $input['email'],
    $input['password'],
    $input['full_name'],
    $input['profile_bio'] ?? null     
);

if ($result['success']) {
    sendSuccess(['user_id' => $result['user_id']], $result['message']);
} else {
    sendError($result['message']);
}
?>