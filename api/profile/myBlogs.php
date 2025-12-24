<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // DB connection
    $host = 'localhost';
    $dbname = 'volunteer_connectV2';
    $username = 'root';
    $password = '';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // OPTIONS preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

    /* ============================================================
       GET → fetch all blogs of a user
       ============================================================ */
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {

        if (!isset($_GET['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Missing user_id']);
            exit;
        }

        $userId = intval($_GET['user_id']);

        $stmt = $pdo->prepare("
            SELECT blog_id, title, content, created_at, author_id
            FROM BLOG
            WHERE author_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        $blogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $blogs,
            'count' => count($blogs)
        ]);
        exit;
    }

    /* ============================================================
       POST → update or delete a blog
       ============================================================ */
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            echo json_encode(['success' => false, 'message' => 'No data received']);
            exit;
        }

        // UPDATE BLOG
        if (isset($data['blog_id'], $data['title'], $data['content'])) {
            $blogId = intval($data['blog_id']);
            $title  = trim($data['title']);
            $content = trim($data['content']);

            // Verify ownership
            $check = $pdo->prepare("SELECT author_id FROM BLOG WHERE blog_id = ?");
            $check->execute([$blogId]);
            $blog = $check->fetch(PDO::FETCH_ASSOC);

            if (!$blog) {
                echo json_encode(['success' => false, 'message' => 'Blog not found']);
                exit;
            }

            if ($blog['author_id'] != ($data['user_id'] ?? 0)) {
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                exit;
            }

            // Update blog
            $stmt = $pdo->prepare("UPDATE BLOG SET title = ?, content = ? WHERE blog_id = ?");
            $success = $stmt->execute([$title, $content, $blogId]);

            echo json_encode([
                'success' => $success,
                'message' => $success ? 'Blog updated successfully' : 'Update failed'
            ]);
            exit;
        }

        // DELETE BLOG (optional)
        if (isset($data['blog_id'], $data['user_id']) && !isset($data['title'])) {
            $blogId = intval($data['blog_id']);
            $userId = intval($data['user_id']);

            $check = $pdo->prepare("SELECT author_id FROM BLOG WHERE blog_id = ?");
            $check->execute([$blogId]);
            $blog = $check->fetch(PDO::FETCH_ASSOC);

            if (!$blog) {
                echo json_encode(['success' => false, 'message' => 'Blog not found']);
                exit;
            }

            if ($blog['author_id'] != $userId) {
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                exit;
            }

            $delete = $pdo->prepare("DELETE FROM BLOG WHERE blog_id = ?");
            $success = $delete->execute([$blogId]);

            echo json_encode(['success' => $success]);
            exit;
        }

        echo json_encode(['success' => false, 'message' => 'Invalid POST data']);
        exit;
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
