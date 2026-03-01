<?php
/**
 * CSRF Token API
 * Generate and return CSRF tokens for frontend
 */

require_once '../Database/config.php';
require_once __DIR__ . '/security.php';

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$conn = getDatabaseConnection();

if (!$conn) {
    sendError('Database connection failed', 500);
}

$clientIP = $_SERVER['REMOTE_ADDR'];

// Set security headers
setSecurityHeaders();

// Generate CSRF token
$token = generateCSRFToken($conn, $clientIP);

if (!$token) {
    sendError('Failed to generate security token', 500);
}

sendSuccess([
    'token' => $token,
    'expires_in' => 3600 // 1 hour
]);
