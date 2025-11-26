<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Database credentials
$host = 'localhost';
$username = '';
$password = '';
$database = '';

// Get client IP
function getClientIP() {
    $ip = '';
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    return $ip;
}

try {
    // Connect to database
    $conn = new mysqli($host, $username, $password, $database);

    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    // Get JSON data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!isset($data['events']) || !is_array($data['events'])) {
        throw new Exception('Invalid data format');
    }

    $ip_address = getClientIP();
    $inserted = 0;

    // Prepare statement
    $stmt = $conn->prepare("INSERT INTO analytics (
        media_id,
        user_name,
        event_type,
        position,
        percentage,
        timestamp,
        view_duration,
        repeat_count,
        session_id,
        enlargement,
        chapter_id,
        media_progress,
        timestamp_end,
        ip_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    // Insert each event
    foreach ($data['events'] as $event) {
        $media_id = $event['media_id'] ?? '';
        $user_name = $event['user_name'] ?? 'app';
        $event_type = $event['event_type'] ?? '';
        $position = $event['position'] ?? null;
        $percentage = $event['percentage'] ?? null;
        $timestamp = $event['timestamp'] ?? date('Y-m-d H:i:s');
        $view_duration = $event['view_duration'] ?? null;
        $repeat_count = $event['repeat_count'] ?? 0;
        $session_id = $event['session_id'] ?? '';
        $enlargement = $event['enlargement'] ?? 0;
        $chapter_id = $event['chapter_id'] ?? null;
        $media_progress = $event['media_progress'] ?? null;
        $timestamp_end = $event['timestamp_end'] ?? null;

        $stmt->bind_param(
            'sssddssissdss',
            $media_id,
            $user_name,
            $event_type,
            $position,
            $percentage,
            $timestamp,
            $view_duration,
            $repeat_count,
            $session_id,
            $enlargement,
            $chapter_id,
            $media_progress,
            $timestamp_end,
            $ip_address
        );

        if ($stmt->execute()) {
            $inserted++;
        }
    }

    $stmt->close();
    $conn->close();

    echo json_encode([
        'success' => true,
        'inserted' => $inserted,
        'total' => count($data['events'])
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
