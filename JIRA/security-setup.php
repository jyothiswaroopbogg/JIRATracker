<?php
/**
 * JIRA Security Setup Script
 * Run this once to initialize security settings
 */

require_once '../Database/config.php';

$conn = getDatabaseConnection();

if (!$conn) {
    die("Database connection failed\n");
}

echo "=== JIRA Security Setup ===\n\n";

// 1. Check if security tables exist
echo "1. Checking security tables...\n";
$tables = [
    'jira_rate_limit',
    'jira_csrf_tokens',
    'jira_security_log',
    'jira_audit_log',
    'jira_ip_whitelist',
    'jira_session_tokens'
];

$allTablesExist = true;
foreach ($tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if ($result->num_rows > 0) {
        echo "   ✓ Table '$table' exists\n";
    } else {
        echo "   ✗ Table '$table' missing\n";
        $allTablesExist = false;
    }
}

if (!$allTablesExist) {
    echo "\n⚠️  Some security tables are missing. Please run security-schema.sql\n";
    exit(1);
}

// 2. Get current IP and add to whitelist
echo "\n2. Setting up IP whitelist...\n";
$currentIP = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
echo "   Current IP: $currentIP\n";

// Check if IP already whitelisted
$stmt = $conn->prepare("SELECT id FROM jira_ip_whitelist WHERE ip_address = ? AND is_active = TRUE");
$stmt->bind_param("s", $currentIP);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo "   ✓ IP already whitelisted\n";
} else {
    // Add current IP to whitelist
    $stmt = $conn->prepare("INSERT INTO jira_ip_whitelist (ip_address, description, is_active) VALUES (?, 'Auto-added during setup', TRUE)");
    $stmt->bind_param("s", $currentIP);
    if ($stmt->execute()) {
        echo "   ✓ IP added to whitelist\n";
    } else {
        echo "   ✗ Failed to add IP: " . $stmt->error . "\n";
    }
}
$stmt->close();

// 3. Display current whitelist
echo "\n3. Current IP whitelist:\n";
$result = $conn->query("SELECT ip_address, description, is_active FROM jira_ip_whitelist ORDER BY id");
while ($row = $result->fetch_assoc()) {
    $status = $row['is_active'] ? '✓' : '✗';
    echo "   $status {$row['ip_address']} - {$row['description']}\n";
}

// 4. Clean expired tokens and old logs
echo "\n4. Cleaning up old data...\n";
$now = time();
$conn->query("DELETE FROM jira_csrf_tokens WHERE expires_at < $now");
$deletedCSRF = $conn->affected_rows;
echo "   Deleted $deletedCSRF expired CSRF tokens\n";

$conn->query("DELETE FROM jira_rate_limit WHERE timestamp < ($now - 3600)");
$deletedRateLimit = $conn->affected_rows;
echo "   Deleted $deletedRateLimit old rate limit entries\n";

// 5. Display security configuration
echo "\n5. Security Configuration:\n";
echo "   Encryption Method: AES-256-CBC\n";
echo "   Rate Limit - Per Minute: 30 requests\n";
echo "   Rate Limit - Per Hour: 500 requests\n";
echo "   CSRF Token Lifetime: 1 hour\n";
echo "   API Token Expiry: 90 days\n";
echo "   Session Timeout: 1 hour\n";

// 6. Test encryption
echo "\n6. Testing encryption...\n";
$testData = "test_api_token_123456";
require_once __DIR__ . '/security.php';

$encrypted = encryptData($testData, $conn);
if ($encrypted) {
    echo "   ✓ Encryption: OK\n";
    $decrypted = decryptData($encrypted, $conn);
    if ($decrypted === $testData) {
        echo "   ✓ Decryption: OK\n";
    } else {
        echo "   ✗ Decryption: FAILED\n";
    }
} else {
    echo "   ✗ Encryption: FAILED\n";
}

// 7. Security recommendations
echo "\n=== Security Recommendations ===\n";
echo "1. Update IP whitelist with your actual IP addresses\n";
echo "2. Use HTTPS in production (required for HSTS)\n";
echo "3. Regularly rotate JIRA API tokens (every 90 days)\n";
echo "4. Monitor security logs in jira_security_log table\n";
echo "5. Review audit logs in jira_audit_log table\n";
echo "6. Keep rate limits appropriate for your usage\n";
echo "7. Clear old logs periodically using: CALL clean_expired_jira_tokens();\n";

echo "\n✓ Setup complete!\n";

$conn->close();
