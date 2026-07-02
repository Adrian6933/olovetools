<?php
/**
 * ClipFlow CORS proxy — PHP version, for hosting like Hostinger.
 *
 * Why this exists: usher.ttvnw.net (VOD playlists) itself sends CORS headers and
 * can be fetched directly, but the actual video segment CDN (CloudFront/S3) does
 * not send CORS headers, so segment/media-playlist downloads need a proxy.
 *
 * Deploy: upload this file to your site's public folder, e.g. as
 *   public_html/clipflow-proxy.php
 * so it's reachable at:
 *   https://olovetools.com/clipflow-proxy.php?url=<encodeURIComponent(targetUrl)>
 *
 * Requires the PHP curl extension (enabled by default on virtually all shared hosting).
 */

$allowedHostSuffixes = [
    'usher.ttvnw.net',
    '.hls.ttvnw.net',
    'ttvnw.net',
    'video-weaver.',
    'cloudfront.net',
];

function isAllowedHost(string $hostname, array $suffixes): bool {
    foreach ($suffixes as $suffix) {
        if ($hostname === $suffix || str_ends_with($hostname, $suffix) || str_contains($hostname, $suffix)) {
            return true;
        }
    }
    return false;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
header('Access-Control-Allow-Headers: Range, Content-Type');
header('Access-Control-Expose-Headers: Content-Length, Content-Range, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$target = $_GET['url'] ?? null;
if (!$target) {
    http_response_code(400);
    echo 'Missing "url" query parameter';
    exit;
}

$parts = parse_url($target);
if (!$parts || empty($parts['host'])) {
    http_response_code(400);
    echo 'Invalid target URL';
    exit;
}

if (!isAllowedHost($parts['host'], $allowedHostSuffixes)) {
    http_response_code(403);
    echo 'Host not allowed: ' . $parts['host'];
    exit;
}

$ch = curl_init($target);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

$requestHeaders = [];
if (!empty($_SERVER['HTTP_RANGE'])) {
    $requestHeaders[] = 'Range: ' . $_SERVER['HTTP_RANGE'];
}
if ($requestHeaders) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);
}

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(502);
    echo 'Upstream fetch failed: ' . curl_error($ch);
    curl_close($ch);
    exit;
}

$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

http_response_code($statusCode ?: 502);

foreach (explode("\r\n", $rawHeaders) as $line) {
    if (stripos($line, 'content-type:') === 0 || stripos($line, 'content-length:') === 0 || stripos($line, 'content-range:') === 0 || stripos($line, 'accept-ranges:') === 0) {
        header($line);
    }
}

echo $body;
