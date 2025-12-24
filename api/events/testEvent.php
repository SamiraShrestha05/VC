<?php

// testEvent.php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

// Database configuration - Use 127.0.0.1 instead of localhost
$host = 'localhost';
$dbname = 'volunteer_connectV2';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Process form data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get form data
        $title = trim($_POST['title'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $location = trim($_POST['location'] ?? '');
        $start_datetime = $_POST['start_datetime'] ?? '';
        $end_datetime = $_POST['end_datetime'] ?? '';
        $volunteer_slots = intval($_POST['volunteer_slots'] ?? 1);
        $status = $_POST['status'] ?? 'upcoming';
        $category = $_POST['category'] ?? 'community';
        
        // Validate required fields
        if (empty($title) || empty($description) || empty($location) || empty($start_datetime) || empty($end_datetime)) {
            throw new Exception('All required fields must be filled.');
        }
        
        // Convert datetime format
        $start_datetime_db = date('Y-m-d H:i:s', strtotime($start_datetime));
        $end_datetime_db = date('Y-m-d H:i:s', strtotime($end_datetime));
        
        if (!$start_datetime_db || !$end_datetime_db) {
            throw new Exception('Invalid date format.');
        }
        
        if ($end_datetime_db <= $start_datetime_db) {
            throw new Exception('End date must be after start date.');
        }
        
        // Use user_id from POST data
        $created_by = isset($_POST['user_id']) ? intval($_POST['user_id']) : null;

        
        // Insert into database
        $sql = "INSERT INTO EVENT 
                (title, description, location, start_datetime, end_datetime, volunteer_slots, status, category, created_by) 
                VALUES (:title, :description, :location, :start_datetime, :end_datetime, :volunteer_slots, :status, :category, :created_by)";
        
        $stmt = $pdo->prepare($sql);
        
        $stmt->execute([
            ':title' => $title,
            ':description' => $description,
            ':location' => $location,
            ':start_datetime' => $start_datetime_db,
            ':end_datetime' => $end_datetime_db,
            ':volunteer_slots' => $volunteer_slots,
            ':status' => $status,
            ':category' => $category,
            ':created_by' => $created_by
        ]);
        
        $event_id = $pdo->lastInsertId();
        echo json_encode(['success' => true]);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false]);
    }
} else {
    echo json_encode(['success' => false]);
}
?>