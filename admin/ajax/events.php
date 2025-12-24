<?php
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');
require_once("../db/connection.php");
$action = $_POST['action'] ?? ''; 
if($action === 'list'){ 
    $result = $conn->query("SELECT * FROM event ORDER BY start_datetime DESC"); 
    $events = []; while($row = $result->fetch_assoc()){ 
        $events[] = $row; 
    } 
        echo json_encode($events); 
        exit(); 
    } 
if($action === 'get'){ $id = $_POST['event_id'] ?? ''; 
    if(!$id){ 
        echo json_encode(['success'=>false,'message'=>'Missing ID']); 
        exit; 
    } 
    $stmt = $conn->prepare("SELECT * FROM event WHERE event_id=?"); 
    $stmt->bind_param("i",$id); 
    $stmt->execute(); 
    $res = $stmt->get_result()->fetch_assoc(); 
    if(!$res)
        echo json_encode(['success'=>false,'message'=>'Event not found']); 
    else 
        echo json_encode(['success'=>true]+$res); exit(); 
} 


if($action === 'add'){
    $title = $_POST['title'] ?? '';
    $description = $_POST['description'] ?? '';
    $location = $_POST['location'] ?? '';
    $start = str_replace('T',' ',$_POST['start_datetime'] ?? '');
    $end   = str_replace('T',' ',$_POST['end_datetime'] ?? '');
    $slots = isset($_POST['volunteer_slots']) ? intval($_POST['volunteer_slots']) : 1;
    $status = $_POST['status'] ?? 'upcoming';
    $created_by = intval($_SESSION['admin_id'] ?? 1); // fallback for testing

    // Validation
    if(!$title || !$description || !$location || !$start || !$end){
        echo json_encode(['success'=>false,'message'=>'All fields are required']);
        exit();
    }

    $stmt = $conn->prepare(
        "INSERT INTO event (title, description, location, start_datetime, end_datetime, volunteer_slots, status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    if(!$stmt){
        echo json_encode(['success'=>false,'message'=>$conn->error]);
        exit();
    }

    // Correct type string: s = string, i = integer
    $stmt->bind_param("sssssiis", $title, $description, $location, $start, $end, $slots, $status, $created_by);

    if($stmt->execute()){
        echo json_encode(['success'=>true,'message'=>'Event added']);
    } else {
        echo json_encode(['success'=>false,'message'=>$stmt->error]);
    }
    exit();
}




if($action === 'edit'){
    $id = intval($_POST['event_id'] ?? 0);
    if(!$id){ echo json_encode(['success'=>false,'message'=>'Missing ID']); exit; }

    // Get current values
    $stmt = $conn->prepare("SELECT * FROM event WHERE event_id=?");
    $stmt->bind_param("i",$id);
    $stmt->execute();
    $current = $stmt->get_result()->fetch_assoc();
    if(!$current){ echo json_encode(['success'=>false,'message'=>'Event not found']); exit; }

    // Only update fields provided
    $fields = [];
    $types = '';
    $values = [];

    $candidates = [
        'title'=>$_POST['title'] ?? null,
        'description'=>$_POST['description'] ?? null,
        'location'=>$_POST['location'] ?? null,
        'start_datetime'=>$_POST['start_datetime'] ?? null,
        'end_datetime'=>$_POST['end_datetime'] ?? null,
        'volunteer_slots'=>isset($_POST['volunteer_slots'])?intval($_POST['volunteer_slots']):null,
        'status'=>$_POST['status'] ?? null
    ];

    foreach($candidates as $col=>$val){
        if($val!==null && $val!=$current[$col]){
            $fields[]="$col=?";
            $types .= is_int($val)?'i':'s';
            $values[]=$val;
        }
    }

    if(empty($fields)){
        echo json_encode(['success'=>true,'message'=>'No changes detected']);
        exit();
    }

    $sql="UPDATE event SET ".implode(', ',$fields)." WHERE event_id=?";
    $types.='i';
    $values[]=$id;

    $stmt = $conn->prepare($sql);
    $bind_names[] = $types;
    for($i=0;$i<count($values);$i++) $bind_names[]=&$values[$i];
    call_user_func_array([$stmt,'bind_param'],$bind_names);

    if($stmt->execute()){
        echo json_encode(['success'=>true,'message'=>'Event updated']);
    } else {
        echo json_encode(['success'=>false,'message'=>$stmt->error]);
    }
    exit();
}

if($action === 'delete'){ 
    $id = $_POST['event_id'] ?? ''; 
    if(!$id){ 
        echo json_encode(['success'=>false,'message'=>'Missing ID']); 
        exit; 
    } 
    $stmt = $conn->prepare("DELETE FROM event WHERE event_id=?"); 
    $stmt->bind_param("i",$id); 
    $stmt->execute(); 
    echo json_encode(['success'=>true,'message'=>'Event deleted']); exit();
} 
 
echo json_encode(['success'=>false,'message'=>'Invalid action']);