<?php
session_start();
require_once("db/connection.php");

$username = $_POST['username'];
$password = $_POST['password'];

$stmt = $conn->prepare("SELECT * FROM user WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password_hash'])) {
        if ($user['is_admin'] == 1) {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_id'] = $user['user_id'];
            $_SESSION['admin_name'] = $user['full_name'];
            header("Location: dashboard.php");
            exit();
        } else {
            $_SESSION['error'] = "Access denied!";
        }
    } else {
        $_SESSION['error'] = "Invalid password!";
    }
} else {
    $_SESSION['error'] = "Admin not found!";
}

header("Location: login.php");
exit();
