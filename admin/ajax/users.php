<?php
ini_set('display_errors',1);
error_reporting(E_ALL);
header('Content-Type: application/json');
session_start();

$_SESSION['admin_logged_in'] = true;

require_once("../db/connection.php");

$action = $_POST['action'] ?? '';

/* ================================
   LIST USERS
================================ */
if($action == 'list'){
    $result = $conn->query("SELECT user_id, username, email, full_name FROM user");
    if(!$result){
        echo json_encode(['success'=>false,'error'=>$conn->error]);
        exit();
    }
    $users = [];
    while($row = $result->fetch_assoc()){
        $users[] = $row;
    }
    echo json_encode($users);
    exit();
}

/* ================================
   ADD USER
================================ */
if($action == 'add'){
    $username = $_POST['username'] ?? '';
    $email = $_POST['email'] ?? '';
    $full_name = $_POST['full_name'] ?? '';
    $password = $_POST['password'] ?? '';

    if(!$username || !$email || !$full_name || !$password){
        echo json_encode(['success'=>false,'message'=>'All fields required']);
        exit();
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO user (username,email,full_name,password_hash) VALUES (?,?,?,?)");
    if(!$stmt){
        echo json_encode(['success'=>false,'error'=>$conn->error]);
        exit();
    }
    $stmt->bind_param("ssss",$username,$email,$full_name,$password_hash);
    if($stmt->execute()){
        echo json_encode(['success'=>true,'message'=>'User added']);
    } else {
        echo json_encode(['success'=>false,'error'=>$stmt->error]);
    }
    exit();
}

/* ================================
   EDIT USER
================================ */
if($action == 'edit'){
    $id = $_POST['user_id'] ?? '';
    $username = $_POST['username'] ?? '';
    $email = $_POST['email'] ?? '';
    $full_name = $_POST['full_name'] ?? '';

    if(!$id){ echo json_encode(['success'=>false,'message'=>'Missing ID']); exit(); }

    $stmt = $conn->prepare("UPDATE user SET username=?, email=?, full_name=? WHERE user_id=?");
    $stmt->bind_param("sssi",$username,$email,$full_name,$id);
    $stmt->execute();

    echo json_encode(['success'=>true,'message'=>'User updated']);
    exit();
}


/* ================================
   DELETE USER
================================ */
if($action == 'delete'){
    $id = $_POST['id'] ?? '';

    if(!$id){
        echo json_encode(['success'=>false,'message'=>'Missing user ID']);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM user WHERE user_id=?");
    if(!$stmt){
        echo json_encode(['success'=>false,'error'=>$conn->error]);
        exit();
    }
    $stmt->bind_param("i", $id);

    if($stmt->execute()){
        echo json_encode(['success'=>true,'message'=>'User deleted']);
    } else {
        echo json_encode(['success'=>false,'error'=>$stmt->error]);
    }
    exit();
}

/* ================================
   FALLBACK
================================ */
echo json_encode(['success'=>false,'message'=>'Invalid action']);
exit();
