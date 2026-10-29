<?php
// api/wishes-admin.php - Admin moderation endpoint for wishes
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Method not allowed"]);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$adminPassword = getenv('ADMIN_PASSWORD') ?: 'admin123';
$givenPassword = $body['password'] ?? '';

if (!hash_equals($adminPassword, (string)$givenPassword)) {
    usleep(500000);
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "Wrong password."]);
    exit;
}

$dataDir = __DIR__ . '/../data';
$wishesFile = $dataDir . '/wishes.json';

$wishes = [];
if (file_exists($wishesFile)) {
    $data = json_decode(file_get_contents($wishesFile), true);
    if (is_array($data)) $wishes = $data;
}

// Update status if requested
$id = $body['id'] ?? '';
$status = $body['status'] ?? '';
if ($id && in_array($status, ['approved', 'hidden', 'pending'], true)) {
    foreach ($wishes as &$item) {
        if (($item['id'] ?? '') === $id) {
            $item['status'] = $status;
            break;
        }
    }
    unset($item);
    file_put_contents($wishesFile, json_encode($wishes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

echo json_encode([
    "ok" => true,
    "wishes" => array_reverse($wishes)
], JSON_UNESCAPED_UNICODE);
