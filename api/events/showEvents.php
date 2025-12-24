<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
$host = 'localhost';
$dbname = 'volunteer_connectV2';
$username = 'root';
$password = '';

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // SQL query to get events
    $sql = "SELECT 
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
            ORDER BY start_datetime ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get volunteer counts (you'll need to implement this if you have a registration table)
    foreach ($events as &$event) {
        $event['registered_volunteers'] = getRegisteredVolunteersCount($pdo, $event['event_id']);
    }
    
    // Return JSON response
    echo json_encode([
        'success' => true,
        'data' => $events,
        'count' => count($events)
    ]);
    
} catch (PDOException $e) {
    // Log error and return JSON error message
    error_log("Database error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'error' => 'Failed to load events',
        'message' => $e->getMessage()
    ]);
}

function getRegisteredVolunteersCount($pdo, $eventId) {
    try {
        // If you have a registrations table, query it here
        // For now, return a random number for demonstration
        return rand(0, 10);
    } catch (Exception $e) {
        return 0;
    }
}
?>