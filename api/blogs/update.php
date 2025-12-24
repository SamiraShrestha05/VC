<?php
header('Content-Type: application/json');

// Remove any closing PHP tag to avoid accidental whitespace
// include your PDO Database class
include '../config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Read JSON payload
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit;
    }

    $blog_id = isset($data['blog_id']) ? (int)$data['blog_id'] : 0;
    $title   = isset($data['title']) ? trim($data['title']) : '';
    $content = isset($data['content']) ? trim($data['content']) : '';

    if (!$blog_id) {
        echo json_encode(['success' => false, 'message' => 'Blog ID missing']);
        exit;
    }

    // Validate title/content
    if ($title === '' || $content === '') {
        echo json_encode(['success' => false, 'message' => 'Title and content cannot be empty']);
        exit;
    }

    // Prepare update statement
    $stmt = $conn->prepare("UPDATE blogs SET title = :title, content = :content WHERE blog_id = :blog_id");
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':content', $content);
    $stmt->bindParam(':blog_id', $blog_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Blog updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Update failed']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}

// No closing PHP tag!
