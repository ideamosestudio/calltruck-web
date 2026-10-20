<?php
declare(strict_types=1);
// Deploy only this endpoint and .htaccess in the forms subdomain document root.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
ini_set('display_errors', '0');
function reply(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}
$origins = ['https://calltruck.com.ar', 'https://www.calltruck.com.ar'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!in_array($origin, $origins, true)) reply(403, ['error' => 'Origen no permitido.']);
header('Access-Control-Allow-Origin: ' . $origin);
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST, OPTIONS');
    reply(405, ['error' => 'Método no permitido.']);
}
if ($method === 'POST' && strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
    reply(415, ['error' => 'Formato no permitido.']);
}
// Kept outside public_html: no mailbox credentials or public web-accessible state.
$state = '/home3/calltruckcpanel/.calltruck-forms';
if (!is_dir($state) && !mkdir($state, 0700, true)) reply(503, ['error' => 'Servicio no disponible.']);
$keyFile = fopen($state . '/secret', 'c+');
if (!$keyFile || !flock($keyFile, LOCK_EX)) reply(503, ['error' => 'Servicio no disponible.']);
$key = stream_get_contents($keyFile);
if ($key === '') { $key = bin2hex(random_bytes(32)); fwrite($keyFile, $key); fflush($keyFile); chmod($state . '/secret', 0600); }
flock($keyFile, LOCK_UN); fclose($keyFile);
$ip = hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? '', $key);
// Bound all accepted-origin requests, including invalid submissions and token requests.
// Keep only counters and pseudonymous IP hashes; no message or email is persisted.
$attemptFile = fopen($state . '/attempts.json', 'c+');
if (!$attemptFile || !flock($attemptFile, LOCK_EX)) reply(503, ['error' => 'Servicio no disponible.']);
chmod($state . '/attempts.json', 0600);
$attempts = json_decode(stream_get_contents($attemptFile), true) ?: [];
$now = time();
$attempts = array_filter($attempts, fn($entry) => is_array($entry) && ($entry['until'] ?? 0) > $now);
$bucket = $attempts[$ip] ?? ['until' => $now + 600, 'count' => 0];
if ($bucket['count'] >= 40 || (!isset($attempts[$ip]) && count($attempts) >= 2000)) {
    flock($attemptFile, LOCK_UN); fclose($attemptFile);
    header('Retry-After: 600');
    reply(429, ['error' => 'Demasiados intentos. Esperá unos minutos o escribinos por WhatsApp.']);
}
$bucket['count']++;
$attempts[$ip] = $bucket;
rewind($attemptFile); ftruncate($attemptFile, 0);
fwrite($attemptFile, json_encode($attempts)); fflush($attemptFile);
flock($attemptFile, LOCK_UN); fclose($attemptFile);
if ($method === 'GET') {
    $payload = time() . '.' . bin2hex(random_bytes(16));
    reply(200, ['token' => $payload . '.' . hash_hmac('sha256', $payload . $ip . $origin, $key)]);
}
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 24000) reply(413, ['error' => 'Consulta demasiado extensa.']);
$raw = file_get_contents('php://input', false, null, 0, 24001);
if (strlen($raw) > 24000) reply(413, ['error' => 'Consulta demasiado extensa.']);
$data = json_decode($raw, true);
if (!is_array($data)) reply(400, ['error' => 'Datos inválidos.']);
foreach ($data as $value) if (!is_string($value)) reply(400, ['error' => 'Datos inválidos.']);
$token = explode('.', $data['token'] ?? '');
if (count($token) !== 3 || !ctype_digit($token[0]) || !preg_match('/^[a-f0-9]{32}$/', $token[1])) reply(400, ['error' => 'Actualizá la página y volvé a intentar.']);
$payload = $token[0] . '.' . $token[1];
if (!hash_equals(hash_hmac('sha256', $payload . $ip . $origin, $key), $token[2]) || time() - (int)$token[0] < 2 || time() - (int)$token[0] > 3600) reply(400, ['error' => 'Actualizá la página y volvé a intentar.']);
if (($data['_honey'] ?? '') !== '') reply(400, ['error' => 'No se pudo procesar la consulta.']);
$fields = ['name' => 120, 'company' => 160, 'phone' => 40, 'email' => 254, 'service' => 100, 'message' => 5000];
foreach ($fields as $field => $max) {
    $data[$field] = trim($data[$field] ?? '');
    if (($field !== 'company' && $data[$field] === '') || !preg_match('//u', $data[$field]) || mb_strlen($data[$field], 'UTF-8') > $max || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $data[$field])) reply(400, ['error' => 'Revisá los campos de la consulta.']);
    if ($field !== 'message' && preg_match('/[\r\n]/', $data[$field])) reply(400, ['error' => 'Revisá los campos de la consulta.']);
}
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $data['email'])) reply(400, ['error' => 'Ingresá un correo válido.']);
if (!in_array($data['service'], ['Transporte para particulares', 'Logística para empresas', 'Almacenamiento logístico', 'Otra consulta'], true)) reply(400, ['error' => 'Seleccioná un servicio válido.']);
// One locked, bounded state file: limit total sends and per-IP attempts; prevent token replay.
$file = fopen($state . '/limits.json', 'c+');
if (!$file || !flock($file, LOCK_EX)) reply(503, ['error' => 'Servicio no disponible.']);
chmod($state . '/limits.json', 0600);
$events = json_decode(stream_get_contents($file), true) ?: [];
$events = array_values(array_filter($events, fn($e) => $e['time'] > time() - 3600));
$own = array_filter($events, fn($e) => $e['ip'] === $ip);
if (count($events) >= 100 || count($own) >= 5 || in_array($token[1], array_column($events, 'nonce'), true)) {
    flock($file, LOCK_UN); fclose($file);
    header('Retry-After: 3600');
    reply(429, ['error' => 'Ya recibimos consultas recientes. Intentá más tarde o escribinos por WhatsApp.']);
}
$events[] = ['time' => time(), 'ip' => $ip, 'nonce' => $token[1]];
rewind($file); ftruncate($file, 0); fwrite($file, json_encode($events)); fflush($file); flock($file, LOCK_UN); fclose($file);
$body = "Nueva consulta desde Calltruck\n\n";
foreach (['name' => 'Nombre', 'company' => 'Empresa', 'phone' => 'Teléfono', 'email' => 'Correo', 'service' => 'Servicio', 'message' => 'Mensaje'] as $field => $label) $body .= $label . ': ' . $data[$field] . "\n\n";
$headers = ['From' => 'Calltruck Web <info@calltruck.com.ar>', 'Reply-To' => $data['email'], 'MIME-Version' => '1.0', 'Content-Type' => 'text/plain; charset=UTF-8'];
if (!mail('info@calltruck.com.ar', 'Nueva consulta web - Calltruck', $body, $headers, '-finfo@calltruck.com.ar')) reply(503, ['error' => 'No se pudo enviar. Intentá más tarde o contactanos por WhatsApp.']);
reply(200, ['ok' => true]);
