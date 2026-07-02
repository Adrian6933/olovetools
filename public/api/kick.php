<?php
/**
 * oLoveTools — Kick API proxy (server-side, runs on Hostinger/Apache PHP).
 *
 * Why this exists:
 *  - Kick's OFFICIAL API (categories, livestreams) needs an app token built from a
 *    client_secret. Keeping that secret here (server-side) avoids exposing it in the
 *    browser bundle.
 *  - Kick's CLIPS endpoint is unofficial and protected by Cloudflare, so it must be
 *    fetched from a server with browser-like headers (best effort).
 *
 * Endpoints:
 *   /api/kick.php?action=categories&q=gta
 *   /api/kick.php?action=livestreams&category_id=8
 *   /api/kick.php?action=clips&category_id=8&sort=view&time=week[&cursor=...]
 *   /api/kick.php?action=clips&channel=xqc&sort=view&time=week[&cursor=...]
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

// --- Credentials (server-side only; never shipped to the browser) ---
$CLIENT_ID     = '01KW4E1D76TE0FV0NN3PVXFD6R';
$CLIENT_SECRET = 'b5039dc20b59816d7f8f5bbab33592add16b87ce0bd4b9d177579519e149dab4';

$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function http_get(string $url, array $headers): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_ENCODING       => '',
    CURLOPT_SSL_VERIFYPEER => true,
  ]);
  $body = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return [$code, $body];
}

function get_app_token(string $id, string $secret): ?string {
  $cache = sys_get_temp_dir() . '/olove_kick_token.json';
  if (is_file($cache)) {
    $c = json_decode(@file_get_contents($cache), true);
    if (is_array($c) && !empty($c['token']) && ($c['exp'] ?? 0) > time()) return $c['token'];
  }
  $ch = curl_init('https://id.kick.com/oauth/token');
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query([
      'grant_type'    => 'client_credentials',
      'client_id'     => $id,
      'client_secret' => $secret,
    ]),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_TIMEOUT        => 20,
  ]);
  $res = curl_exec($ch);
  curl_close($ch);
  $data = json_decode($res, true);
  $tok  = $data['access_token'] ?? null;
  if ($tok) @file_put_contents($cache, json_encode(['token' => $tok, 'exp' => time() + 3000]));
  return $tok;
}

$action = $_GET['action'] ?? '';

// ---- Official API: categories + livestreams ----
if ($action === 'categories' || $action === 'livestreams') {
  $token = get_app_token($CLIENT_ID, $CLIENT_SECRET);
  if (!$token) { http_response_code(502); echo json_encode(['error' => 'token_failed']); exit; }
  $h = ['Authorization: Bearer ' . $token, 'Accept: application/json'];

  if ($action === 'categories') {
    $q = isset($_GET['q']) ? trim((string) $_GET['q']) : '';
    if ($q === '') $q = 'a'; // q is required by the API; "a" returns a broad popular set
    $url = 'https://api.kick.com/public/v1/categories?q=' . rawurlencode($q);
  } else {
    $cat = isset($_GET['category_id']) ? (int) $_GET['category_id'] : 0;
    $url = 'https://api.kick.com/public/v1/livestreams?limit=50&sort=viewer_count'
         . ($cat > 0 ? '&category_id=' . $cat : '');
  }

  [$code, $body] = http_get($url, $h);
  http_response_code($code ?: 502);
  header('Cache-Control: public, max-age=60');
  echo $body !== false ? $body : json_encode(['data' => []]);
  exit;
}

// ---- Unofficial clips endpoint (Cloudflare-protected, best effort) ----
if ($action === 'clips') {
  $sort = preg_replace('/[^a-z]/', '', strtolower($_GET['sort'] ?? 'view')) ?: 'view';
  $time = preg_replace('/[^a-z]/', '', strtolower($_GET['time'] ?? 'week')) ?: 'week';

  if (!empty($_GET['category_id'])) {
    $url = 'https://kick.com/api/v2/categories/' . (int) $_GET['category_id'] . '/clips';
  } elseif (!empty($_GET['channel'])) {
    $slug = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $_GET['channel']);
    $url  = 'https://kick.com/api/v2/channels/' . $slug . '/clips';
  } else {
    http_response_code(400); echo json_encode(['error' => 'missing_target']); exit;
  }
  $url .= '?sort=' . $sort . '&time=' . $time;
  if (!empty($_GET['cursor'])) $url .= '&cursor=' . rawurlencode((string) $_GET['cursor']);

  global $UA;
  $h = [
    'Accept: application/json',
    'User-Agent: ' . $UA,
    'Referer: https://kick.com/',
    'Accept-Language: en-US,en;q=0.9',
  ];
  [$code, $body] = http_get($url, $h);
  http_response_code($code ?: 502);
  header('Cache-Control: public, max-age=120');
  echo $body !== false ? $body : json_encode(['clips' => []]);
  exit;
}

http_response_code(400);
echo json_encode(['error' => 'unknown_action']);
