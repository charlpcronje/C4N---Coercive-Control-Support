<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dataFile = __DIR__ . '/data.json';

if (!file_exists($dataFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'Data file not found']);
    exit;
}

$hash = hash_file('sha256', $dataFile);

echo json_encode([
    'hash' => $hash,
    'timestamp' => filemtime($dataFile)
]);
