<?php
// api/rsvp.php - Handles guest RSVP submission on shared hosting
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Method not allowed"]);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Invalid JSON payload"]);
    exit;
}

// Honeypot check: website field must be empty
if (!empty($body['website'])) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Rejected"]);
    exit;
}

$name = trim(preg_replace('/[\x00-\x08\x0B-\x1F\x7F]/', '', $body['name'] ?? ''));
$attending = ($body['attending'] ?? '') === 'yes' ? 'yes' : (($body['attending'] ?? '') === 'no' ? 'no' : '');
$message = trim(preg_replace('/[\x00-\x08\x0B-\x1F\x7F]/', '', $body['message'] ?? ''));
$guestsRaw = intval($body['guests'] ?? 1);
$guests = $attending === 'yes' ? max(1, min(6, $guestsRaw)) : 0;
$showOnWall = !empty($body['showOnWall']);

if (mb_strlen($name) < 2) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Please enter your name."]);
    exit;
}

if (!$attending) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Please choose whether you will attend."]);
    exit;
}

$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// 1. Cairo timestamp
date_default_timezone_set('Africa/Cairo');
$at = date('d/m/Y, H:i:s') . ' (Cairo)';

// 2. Format line for rsvps.txt
$statusStr = $attending === 'yes' ? 'ATTENDING' : 'DECLINED';
$cleanMsg = str_replace(["\r", "\n"], ' ', $message ?: '-');
$txtLine = "{$at} | {$name} | {$statusStr} | guests={$guests} | {$cleanMsg}\n";

$txtFile = $dataDir . '/rsvps.txt';
file_put_contents($txtFile, $txtLine, FILE_APPEND | LOCK_EX);

// 3. Update rsvps.json
$jsonFile = $dataDir . '/rsvps.json';
$list = [];
if (file_exists($jsonFile)) {
    $existing = json_decode(file_get_contents($jsonFile), true);
    if (is_array($existing)) $list = $existing;
}

$entry = [
    "id" => bin2hex(random_bytes(8)),
    "name" => $name,
    "attending" => $attending,
    "guests" => $guests,
    "message" => $message,
    "at" => $at,
    "ip" => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];

$list[] = $entry;
file_put_contents($jsonFile, json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

// 4. Save wish if message provided and opted in
if ($message && $showOnWall) {
    $wishesFile = $dataDir . '/wishes.json';
    $wishes = [];
    if (file_exists($wishesFile)) {
        $w = json_decode(file_get_contents($wishesFile), true);
        if (is_array($w)) $wishes = $w;
    }
    $wishes[] = [
        "id" => bin2hex(random_bytes(8)),
        "name" => $name,
        "message" => $message,
        "at" => $at,
        "status" => "pending"
    ];
    file_put_contents($wishesFile, json_encode($wishes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

echo json_encode(["ok" => true, "emailed" => false]);
