<?php
// api/rsvp-admin.php - Admin endpoint for RSVP list, metrics, and deletion
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
    usleep(500000); // 0.5s anti-brute force delay
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "Wrong password."]);
    exit;
}

$dataDir = __DIR__ . '/../data';
$jsonFile = $dataDir . '/rsvps.json';
$txtFile = $dataDir . '/rsvps.txt';

$rsvps = [];
if (file_exists($jsonFile)) {
    $data = json_decode(file_get_contents($jsonFile), true);
    if (is_array($data)) $rsvps = $data;
} elseif (file_exists($txtFile)) {
    // Parse txt fallback
    $lines = file($txtFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($lines as $line) {
        $p = array_map('trim', explode(' | ', $line));
        if (count($p) >= 3) {
            $isAttending = ($p[2] === 'ATTENDING');
            $guests = $isAttending ? 1 : 0;
            if (isset($p[3]) && strpos($p[3], 'guests=') === 0) {
                $guests = intval(substr($p[3], 7));
            }
            $rsvps[] = [
                "id" => bin2hex(random_bytes(8)),
                "name" => $p[1],
                "attending" => $isAttending ? "yes" : "no",
                "guests" => $guests,
                "message" => implode(' | ', array_slice($p, 4)),
                "at" => $p[0]
            ];
        }
    }
}

// Handle delete
$action = $body['action'] ?? 'list';
if ($action === 'delete' && !empty($body['id'])) {
    $idToDelete = $body['id'];
    $filtered = array_values(array_filter($rsvps, function ($item) use ($idToDelete) {
        return ($item['id'] ?? '') !== $idToDelete;
    }));
    $rsvps = $filtered;
    file_put_contents($jsonFile, json_encode($rsvps, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

    // Rebuild rsvps.txt
    $newTxt = "";
    foreach ($rsvps as $r) {
        $statusStr = ($r['attending'] === 'yes') ? 'ATTENDING' : 'DECLINED';
        $msg = str_replace(["\r", "\n"], ' ', $r['message'] ?? '-');
        $newTxt .= "{$r['at']} | {$r['name']} | {$statusStr} | guests={$r['guests']} | {$msg}\n";
    }
    file_put_contents($txtFile, $newTxt, LOCK_EX);
}

// Compute metrics
$totalResponses = count($rsvps);
$totalAttending = 0;
$totalDeclined = 0;
$totalGuests = 0;

foreach ($rsvps as $r) {
    if (($r['attending'] ?? '') === 'yes') {
        $totalAttending++;
        $totalGuests += max(1, intval($r['guests'] ?? 1));
    } else {
        $totalDeclined++;
    }
}

$attendanceRate = $totalResponses > 0 ? round(($totalAttending / $totalResponses) * 100) : 0;
$rawTxt = file_exists($txtFile) ? file_get_contents($txtFile) : '';

echo json_encode([
    "ok" => true,
    "rsvps" => array_reverse($rsvps), // newest first
    "rawTxt" => $rawTxt,
    "summary" => [
        "totalResponses" => $totalResponses,
        "totalAttending" => $totalAttending,
        "totalDeclined" => $totalDeclined,
        "totalGuests" => $totalGuests,
        "attendanceRate" => $attendanceRate
    ]
], JSON_UNESCAPED_UNICODE);
