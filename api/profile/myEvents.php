<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$dbname = 'volunteer_connectV2';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

    /* ============================================================
       GET → Fetch events created by user
       ============================================================ */
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!isset($_GET['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Missing user_id']);
            exit;
        }

        $userId = intval($_GET['user_id']);

        $stmt = $pdo->prepare("
            SELECT 
                event_id,
                title,
                description,
                location,
                start_datetime,
                end_datetime,
                volunteer_slots,
                status,
                created_at,
                created_by,
                category
            FROM EVENT
            WHERE created_by = ?
            ORDER BY start_datetime ASC
        ");
        $stmt->execute([$userId]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Optional: add volunteer count
        foreach ($events as &$event) {
            $event['registered_volunteers'] = getRegisteredVolunteersCount($pdo, $event['event_id']);
        }

        echo json_encode([
            'success' => true,
            'data' => $events,
            'count' => count($events)
        ]);
        exit;
    }

    /* ============================================================
       POST → Delete or Update event
       ============================================================ */
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Missing user_id']);
            exit;
        }

        $userId = intval($data['user_id']);

        // ------------------ DELETE ------------------
        if (isset($data['event_id']) && !isset($data['update'])) {
            $eventId = intval($data['event_id']);

            // Check ownership
            $check = $pdo->prepare("SELECT created_by FROM EVENT WHERE event_id = ?");
            $check->execute([$eventId]);
            $event = $check->fetch(PDO::FETCH_ASSOC);

            if (!$event) {
                echo json_encode(['success' => false, 'message' => 'Event not found']);
                exit;
            }

            if ($event['created_by'] != $userId) {
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                exit;
            }

            // Delete
            $delete = $pdo->prepare("DELETE FROM EVENT WHERE event_id = ?");
            $success = $delete->execute([$eventId]);

            echo json_encode(['success' => $success]);
            exit;
        }

        // ------------------ UPDATE ------------------
        if (isset($data['event_id']) && isset($data['update'])) {
            $eventId = intval($data['event_id']);

            // Check ownership
            $check = $pdo->prepare("SELECT created_by FROM EVENT WHERE event_id = ?");
            $check->execute([$eventId]);
            $event = $check->fetch(PDO::FETCH_ASSOC);

            if (!$event) {
                echo json_encode(['success' => false, 'message' => 'Event not found']);
                exit;
            }

            if ($event['created_by'] != $userId) {
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                exit;
            }

            // Prepare update fields
            $fields = [];
            $params = [];

            $updatable = ['title','description','location','start_datetime','end_datetime','volunteer_slots','status','category'];
            foreach ($updatable as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[$field] = $data[$field];
                }
            }

            if (empty($fields)) {
                echo json_encode(['success' => false, 'message' => 'No fields to update']);
                exit;
            }

            $params['event_id'] = $eventId;
            $sql = "UPDATE EVENT SET " . implode(", ", $fields) . " WHERE event_id = :event_id";
            $stmt = $pdo->prepare($sql);
            $success = $stmt->execute($params);

            echo json_encode(['success' => $success]);
            exit;
        }

        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        exit;
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

/* ============================================================
   Helper function for volunteer count (optional)
   ============================================================ */
function getRegisteredVolunteersCount($pdo, $eventId) {
    try {
        return rand(0, 10);
    } catch (Exception $e) {
        return 0;
    }
}
?>
