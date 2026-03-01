<?php
/**
 * Clear JIRA rate limits for localhost/development
 * Run this script to reset rate limits when developing
 */

require_once __DIR__ . '/../Database/config.php';

$conn = getDatabaseConnection();

if (!$conn) {
    die("Database connection failed\n");
}

// Clear rate limits for localhost IPs
$localhostIPs = ['::1', '127.0.0.1', 'localhost'];

foreach ($localhostIPs as $ip) {
    $stmt = $conn->prepare("DELETE FROM jira_rate_limit WHERE identifier = ?");
    $stmt->bind_param("s", $ip);
    $stmt->execute();
    $affected = $stmt->affected_rows;
    echo "Cleared $affected rate limit entries for IP: $ip\n";
    $stmt->close();
}

// Also clear old entries (older than 2 hours ago timestamp)
$twoHoursAgo = time() - (2 * 3600);
$conn->query("DELETE FROM jira_rate_limit WHERE timestamp < $twoHoursAgo");
echo "Cleared old rate limit entries\n";

$conn->close();

echo "\nRate limits cleared successfully!\n";
echo "You can now try syncing from JIRA again.\n";
?>
