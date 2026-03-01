<?php
/**
 * JIRA Attachment Proxy
 * Fetches JIRA attachments with authentication and serves them to the browser
 */

require_once '../Database/config.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/config.api.php';

// Set CORS headers first
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session for CSRF protection
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$conn = getDatabaseConnection();

if (!$conn) {
    http_response_code(500);
    error_log('Attachment proxy: Database connection failed');
    die('Database connection failed');
}

// Security checks
$clientIP = $_SERVER['REMOTE_ADDR'];

// Check IP whitelist
if (!checkIPWhitelist($conn, $clientIP)) {
    logSecurityEvent($conn, 'ip_blocked', 'Access denied from IP: ' . $clientIP, $clientIP);
    http_response_code(403);
    error_log('Attachment proxy: IP blocked - ' . $clientIP);
    die('Access denied');
}

// Check rate limit
$isLocalhost = in_array($clientIP, ['127.0.0.1', '::1', 'localhost']);
if ($isLocalhost) {
    if (!checkRateLimit($conn, $clientIP, 1000, 10000)) {
        http_response_code(429);
        error_log('Attachment proxy: Rate limit exceeded for localhost');
        die('Too many requests');
    }
} else {
    if (!checkRateLimit($conn, $clientIP, 100, 1000)) {
        http_response_code(429);
        error_log('Attachment proxy: Rate limit exceeded for ' . $clientIP);
        die('Too many requests');
    }
}

// Don't set security headers for file downloads - they interfere with Content-Type
// setSecurityHeaders(); // REMOVED - causes issues with binary file downloads

// Get attachment ID and optional filename from query parameters
$attachmentId = sanitizeInput($_GET['id'] ?? '', 'string');
$filename = sanitizeInput($_GET['filename'] ?? '', 'string');
$isDownload = isset($_GET['download']) && $_GET['download'] === '1';

if (empty($attachmentId)) {
    http_response_code(400);
    error_log('Attachment proxy: No attachment ID provided');
    die('Attachment ID required');
}

// Get JIRA config
$config = getDecryptedJiraConfig($conn);
if (!$config) {
    http_response_code(400);
    error_log('Attachment proxy: JIRA not configured');
    die('JIRA not configured');
}

// Fetch attachment from JIRA
$url = rtrim($config['jira_url'], '/') . '/rest/api/3/attachment/content/' . $attachmentId;

error_log('Attachment proxy: Fetching attachment ID ' . $attachmentId . ' from ' . $url);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode($config['jira_email'] . ':' . $config['jira_api_token']),
    'Accept: */*'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    error_log('Attachment proxy: CURL error - ' . $curlError);
    die('Failed to fetch attachment: ' . $curlError);
}

if ($httpCode < 200 || $httpCode >= 300) {
    http_response_code($httpCode);
    error_log('Attachment proxy: JIRA returned HTTP ' . $httpCode . ' for attachment ' . $attachmentId);
    die('Failed to fetch attachment from JIRA (HTTP ' . $httpCode . ')');
}

// Extract headers and body
$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// Parse content type and filename from response headers
$contentType = 'application/octet-stream';
if (preg_match('/Content-Type:\s*([^\r\n]+)/i', $headers, $matches)) {
    $contentType = trim($matches[1]);
}

// Try to extract filename from Content-Disposition header if not provided
if (empty($filename)) {
    if (preg_match('/Content-Disposition:\s*.*filename="?([^"\r\n]+)"?/i', $headers, $matches)) {
        $filename = trim($matches[1]);
    } else {
        $filename = 'attachment-' . $attachmentId;
    }
}

error_log('Attachment proxy: Successfully fetched attachment ' . $attachmentId . ', Content-Type: ' . $contentType . ', Filename: ' . $filename . ', Size: ' . strlen($body) . ' bytes');

// Audit log before sending binary data
auditJiraOperation($conn, 'fetch_attachment', 'attachment', $attachmentId, null, $clientIP, []);

// Clear ALL output buffers to prevent interference with binary data
while (ob_get_level()) {
    ob_end_clean();
}

// Remove any previously set headers and set new ones
header_remove();

// Set CORS headers again
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Set file-specific headers
header('Content-Type: ' . $contentType, true);
header('Content-Length: ' . strlen($body), true);

// For downloads, set Content-Disposition to force download with correct filename
if ($isDownload) {
    header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"', true);
} else {
    // For images/inline viewing
    header('Content-Disposition: inline; filename="' . addslashes($filename) . '"', true);
}

header('Cache-Control: public, max-age=86400', true);
header('Pragma: public', true);
header('Accept-Ranges: bytes', true);

// Flush any remaining output
flush();

// Output the file data
echo $body;

// Stop execution to prevent any additional output
exit;
