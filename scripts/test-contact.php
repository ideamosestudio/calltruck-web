<?php
declare(strict_types=1);
// Isolated CLI regression tests. Never uses the real state or sends email.
$root = sys_get_temp_dir() . '/calltruck-test-' . bin2hex(random_bytes(8));
mkdir($root, 0700);
$source = file_get_contents($argv[1] ?? __DIR__ . '/../server/contact.php');
$source = str_replace("'/home3/calltruckcpanel/.calltruck-forms'", var_export($root . '/state', true), $source);
$source = str_replace("'php://input'", "'php://stdin'", $source);
$source = str_replace("if (!mail(", "if (!test_mail(", $source);
$bootstrap = <<<'PHP'

function test_mail(...$args): bool { return true; }
$_SERVER = json_decode(getenv('TEST_SERVER'), true);
register_shutdown_function(function () { echo "\nSTATUS:" . (http_response_code() ?: 200); });

PHP;
$source = str_replace('declare(strict_types=1);', 'declare(strict_types=1);' . $bootstrap, $source);
$fixture = $root . '/endpoint.php';
file_put_contents($fixture, $source);
$checks = 0;
function request(string $method, mixed $data = null, string $origin = 'https://calltruck.com.ar', string $type = 'application/json'): array {
    global $fixture;
    $server = ['REQUEST_METHOD' => $method, 'HTTP_ORIGIN' => $origin, 'REMOTE_ADDR' => '192.0.2.1', 'CONTENT_TYPE' => $type];
    $process = proc_open([PHP_BINARY, $fixture], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, null, ['TEST_SERVER' => json_encode($server)]);
    fwrite($pipes[0], is_string($data) ? $data : json_encode($data)); fclose($pipes[0]);
    $output = stream_get_contents($pipes[1]); fclose($pipes[1]);
    $errors = stream_get_contents($pipes[2]); fclose($pipes[2]);
    if (proc_close($process) !== 0 || $errors !== '') throw new RuntimeException($errors . $output);
    [$body, $status] = explode("\nSTATUS:", $output);
    return [(int)$status, json_decode($body, true)];
}
function check(int $expected, array $response, string $name): void {
    global $checks;
    if ($response[0] !== $expected) throw new RuntimeException("$name: expected $expected, got " . json_encode($response));
    $checks++;
    echo "PASS $name\n";
}
try {
    check(403, request('GET', null, 'https://evil.example'), 'foreign origin');
    check(403, request('GET', null, 'https://ideamosestudio.github.io'), 'retired demo origin');
    check(204, request('OPTIONS'), 'preflight');
    check(405, request('DELETE'), 'method restriction');
    check(415, request('POST', [], 'https://calltruck.com.ar', 'text/plain'), 'content type');
    check(413, request('POST', str_repeat('x', 24001)), 'body size');
    check(400, request('POST', '{'), 'invalid JSON');
    check(400, request('POST', ['name' => []]), 'nested fields');
    $token = request('GET')[1]['token'];
    $valid = ['token' => $token, 'name' => 'Prueba', 'company' => '', 'phone' => '1112345678', 'email' => 'test@example.com', 'service' => 'Otra consulta', 'message' => 'Consulta de prueba', '_honey' => ''];
    check(400, request('POST', $valid), 'minimum elapsed time');
    sleep(3);
    check(400, request('POST', array_replace($valid, ['_honey' => 'bot'])), 'honeypot');
    check(400, request('POST', array_replace($valid, ['email' => "a@example.com\r\nBcc: b@example.com"])), 'header injection');
    check(400, request('POST', array_replace($valid, ['name' => str_repeat('á', 121)])), 'unicode length');
    check(400, request('POST', array_replace($valid, ['service' => 'Unknown'])), 'service allowlist');
    check(200, request('POST', $valid), 'valid submission with stubbed mail');
    check(429, request('POST', $valid), 'single use token');
    $last = [];
    for ($i = 0; $i < 41; $i++) $last = request('GET');
    check(429, $last, 'request rate limit');
    echo "$checks checks passed; no email sent.\n";
} finally {
    foreach (glob($root . '/state/*') ?: [] as $file) unlink($file);
    if (is_dir($root . '/state')) rmdir($root . '/state');
    unlink($fixture);
    rmdir($root);
}
