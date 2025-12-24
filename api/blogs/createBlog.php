<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration
$host = 'localhost';
$dbname = 'volunteer_connectV2';
$username = 'root';
$password = '';

$input = json_decode(file_get_contents('php://input'), true);

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Validate required fields
    if (!isset($input['title']) || !isset($input['content']) || !isset($input['user_id'])) {
        throw new Exception('Title, content, and user_id are required');
    }

    $title = trim($input['title']);
    $content = trim($input['content']);
    $author_id = intval($input['user_id']); // use the user_id sent from frontend

    if (empty($title) || empty($content)) {
        throw new Exception('Title and content cannot be empty');
    }

    // Insert blog with correct author_id
    $sql = "INSERT INTO BLOG (title, content, author_id) VALUES (?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$title, $content, $author_id]);

    $blog_id = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Blog published successfully!',
        'blog_id' => $blog_id,
        'author_id' => $author_id
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to create blog',
        'message' => $e->getMessage()
    ]);
}
?>
