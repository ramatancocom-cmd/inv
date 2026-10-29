<?php
// api/wishes.php - Public endpoint returning approved wishes
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$dataDir = __DIR__ . '/../data';
$wishesFile = $dataDir . '/wishes.json';

$wishes = [];
if (file_exists($wishesFile)) {
    $raw = json_decode(file_get_contents($wishesFile), true);
    if (is_array($raw)) {
        foreach ($raw as $item) {
            if (($item['status'] ?? '') === 'approved') {
                $wishes[] = [
                    "name" => $item['name'] ?? '',
                    "message" => $item['message'] ?? '',
                    "at" => $item['at'] ?? ''
                ];
            }
        }
    }
}

echo json_encode(["ok" => true, "wishes" => $wishes], JSON_UNESCAPED_UNICODE);
