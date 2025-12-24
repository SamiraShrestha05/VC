<?php
session_start();
header('Content-Type: application/json');
require_once("../db/connection.php");

ini_set('display_errors',1);
error_reporting(E_ALL);

$action = $_POST['action'] ?? '';

if(!$action){
    echo json_encode(['success'=>false,'message'=>'No action specified']);
    exit;
}

/* LIST BLOGS */
if($action === 'list'){
    $res = $conn->query("SELECT blog_id, title, content, author_id, created_at, updated_at FROM blog ORDER BY created_at DESC");
    if(!$res){
        echo json_encode(['success'=>false,'message'=>$conn->error]);
        exit;
    }
    $blogs = [];
    while($row = $res->fetch_assoc()){
        $blogs[] = $row;
    }
    echo json_encode($blogs);
    exit;
}

/* GET SINGLE BLOG */
if($action === 'get'){
    $id = $_POST['blog_id'] ?? '';
    if(!$id){
        echo json_encode(['success'=>false,'message'=>'Missing blog ID']);
        exit;
    }
    $stmt = $conn->prepare("SELECT blog_id, title, content FROM blog WHERE blog_id=?");
    $stmt->bind_param("i",$id);
    $stmt->execute();
    $res = $stmt->get_result();
    echo json_encode($res->fetch_assoc());
    exit;
}

/* ADD BLOG */
if($action === 'add'){
    $title = $_POST['title'] ?? '';
    $content = $_POST['content'] ?? '';
    $author_id = $_SESSION['admin_id'] ?? null;

    if(!$title || !$content){
        echo json_encode(['success'=>false,'message'=>'All fields required']);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO blog (title, content, author_id) VALUES (?,?,?)");
    $stmt->bind_param("ssi",$title,$content,$author_id);
    if($stmt->execute()){
        echo json_encode(['success'=>true,'message'=>'Blog added']);
    } else {
        echo json_encode(['success'=>false,'message'=>$stmt->error]);
    }
    exit;
}

/* EDIT BLOG */
if($action === 'edit'){
    $id = $_POST['blog_id'] ?? '';
    $title = $_POST['title'] ?? '';
    $content = $_POST['content'] ?? '';

    if(!$id || !$title || !$content){
        echo json_encode(['success'=>false,'message'=>'All fields required']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE blog SET title=?, content=? WHERE blog_id=?");
    $stmt->bind_param("ssi",$title,$content,$id);
    $stmt->execute();
    echo json_encode(['success'=>true,'message'=>'Blog updated']);
    exit;
}

/* DELETE BLOG */
if($action === 'delete'){
    $id = $_POST['blog_id'] ?? '';
    if(!$id){
        echo json_encode(['success'=>false,'message'=>'Missing blog ID']);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM blog WHERE blog_id=?");
    $stmt->bind_param("i",$id);
    $stmt->execute();
    echo json_encode(['success'=>true,'message'=>'Blog deleted']);
    exit;
}

echo json_encode(['success'=>false,'message'=>'Invalid action']);
exit();
