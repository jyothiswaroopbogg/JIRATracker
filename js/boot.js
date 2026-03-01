// Application Bootstrap - Start the application
init();

// Initialize new features after app loads
if (typeof migrateRecordsTimestamps === 'function') {
  migrateRecordsTimestamps();
}

if (typeof initQuickAdd === 'function') {
  initQuickAdd();
}

// Sprint reminders will be initialized after loadState completes (see persistence.js)
