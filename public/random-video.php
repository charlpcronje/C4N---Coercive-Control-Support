<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database credentials
$host = 'localhost';
$username = '';
$password = '';
$database = '';

try {
    // Connect to database
    $conn = new mysqli($host, $username, $password, $database);

    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    // Select random video where type = 'video' and active = 1
    $query = "SELECT id, caption, description FROM media WHERE type = 'video' AND active = 1 ORDER BY RAND() LIMIT 1";
    $result = $conn->query($query);

    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }

    if ($result->num_rows === 0) {
        throw new Exception('No videos found');
    }

    $video = $result->fetch_assoc();

    // Construct response
    $response = [
        'id' => $video['id'],
        'type' => 'video',
        'url' => 'https://api.media.webally.co.za/serve.php?id=' . $video['id'],
        'thumbnail' => 'https://api.media.webally.co.za/serve.php?id=' . $video['id'] . '&thumbnail=1',
        'caption' => '<h5>' . htmlspecialchars($video['caption']) . '</h5><p>' . htmlspecialchars($video['description']) . '</p>'
    ];

    $conn->close();

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
