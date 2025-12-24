<?php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed. Use GET.', 405);
}

$auth = new Auth();
$auth_check = $auth->checkAuth();

if (!$auth_check['authenticated']) {
    sendError('Authentication required', 401);
}

// return full user data
sendSuccess($auth_check['user'], 'Profile retrieved successfully');

?>