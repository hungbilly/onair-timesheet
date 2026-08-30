/**
 * BOA Timesheet Mirror
 *
 * This standalone Apps Script reads existing Supabase data through the
 * sheet-mirror-export Edge Function and mirrors it into the configured workbook.
 * It never writes to Supabase and therefore cannot change existing website logic.
 *
 * Reconciliation behavior:
 * - Active source records are upserted by source_id.
 * - Existing mirror rows whose source_id is absent from a complete source export
 *   are marked "Archived - deleted in app" rather than deleted.
 * - Accountant-managed fields are preserved throughout.
 */

const MIRROR_TABS = {
  TIMESHEETS: 'Timesheets',
  EXPENSES: 'Expenses',
  STAFF: 'Staff',
  VENDOR_BILLS: 'Vendor Bills',
  VENDORS: 'Vendors',
  SYNC_LOG: 'Sync Log',
  AI_TIMESHEET_INTAKE: 'AI Timesheet Intake',
};

const ARCHIVED_STATUS = 'Archived - deleted in app';

const TAB_HEADERS = {
  [MIRROR_TABS.TIMESHEETS]: [
    'source_id', 'date', 'employee_id', 'employee_name', 'employee_email', 'employee_role',
    'work_type', 'job_description', 'start_time', 'end_time', 'hours', 'hourly_rate',
    'job_count', 'job_rate', 'total_salary', 'created_at', 'sync_status', 'last_synced_at',
    'accountant_notes', 'bank_transfer_reference',
  ],
  [MIRROR_TABS.EXPENSES]: [
    'source_id', 'date', 'employee_id', 'employee_name', 'employee_email', 'description',
    'amount', 'receipt_path', 'created_at', 'sync_status', 'last_synced_at',
    'accountant_notes', 'bank_transfer_reference',
  ],
  [MIRROR_TABS.STAFF]: [
    'source_id', 'full_name', 'email', 'role', 'mobile', 'address', 'salary_details',
    'profile_created_at', 'profile_updated_at', 'sync_status', 'last_synced_at', 'accountant_notes',
  ],
  [MIRROR_TABS.VENDOR_BILLS]: [
    'source_id', 'vendor_id', 'vendor_name', 'amount', 'due_date', 'status', 'description',
    'invoice_path', 'payment_method', 'paid_at', 'created_by', 'paid_by', 'created_at',
    'sync_status', 'last_synced_at', 'accountant_notes', 'bank_transfer_reference',
  ],
  [MIRROR_TABS.VENDORS]: [
    'source_id', 'name', 'description', 'created_at', 'sync_status', 'last_synced_at', 'accountant_notes',
  ],
  [MIRROR_TABS.AI_TIMESHEET_INTAKE]: [
    'external_intake_id', 'created_at', 'source', 'employee_name_input', 'employee_id', 'employee_name',
    'date', 'work_type', 'job_description', 'start_time', 'end_time', 'hours', 'hourly_rate',
    'job_count', 'job_rate', 'calculated_total', 'intake_status', 'duplicate_status', 'review_reason',
    'supabase_record_id', 'last_attempt_at', 'sync_error', 'processed_at', 'create_staff_if_missing',
    'original_instruction', 'attempt_count',
  ],
  // Keep the existing error column in its original position. The appended archived
  // column prevents historical error messages from being relabelled during migration.
  [MIRROR_TABS.SYNC_LOG]: [
    'sync_run_id', 'trigger', 'started_at', 'completed_at', 'timesheets', 'expenses',
    'staff', 'vendor_bills', 'vendors', 'inserted', 'updated', 'error', 'archived',
  ],
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('BOA Sync')
    .addItem('Sync now', 'syncNow')
    .addItem('Verify sync security setup', 'verifySyncSecuritySetup')
    .addItem('Install nightly sync', 'installNightlySync')
    .addItem('Remove nightly sync', 'removeNightlySync')
    .addSeparator()
    .addItem('Set up AI Timesheet Intake', 'setupAITimesheetIntake')
    .addItem('Process AI Timesheet Intake', 'processAITimesheetIntake')
    .addToUi();
}

function syncNow() {
  runMirrorSync_('manual');
}

function verifySyncSecuritySetup() {
  const properties = PropertiesService.getScriptProperties();
  const sharedSecret = requireProperty_(properties, 'SYNC_SHARED_SECRET');
  const fingerprint = sha256Hex_(sharedSecret);
  SpreadsheetApp.getUi().alert(`SYNC_SHARED_SECRET SHA-256 fingerprint:\n${fingerprint}\n\nCompare this fingerprint with the SHA-256 digest shown beside SHEET_MIRROR_SHARED_SECRET in Supabase. This screen never displays the secret itself.`);
}

function nightlySync_() {
  runMirrorSync_('nightly');
}

function installNightlySync() {
  removeNightlySync();
  ScriptApp.newTrigger('nightlySync_')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
  SpreadsheetApp.getUi().alert('Nightly mirror sync installed. Set this Apps Script project timezone to Asia/Hong_Kong in Project Settings.');
}

function removeNightlySync() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'nightlySync_')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
}

function runMirrorSync_(triggerName) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    if (triggerName === 'manual') SpreadsheetApp.getUi().alert('A sync is already running. Please wait for it to finish.');
    return;
  }

  const runId = Utilities.getUuid();
  const startedAt = new Date();
  let result = { inserted: 0, updated: 0, archived: 0 };
  let exportData = null;

  try {
    const properties = PropertiesService.getScriptProperties();
    const endpointUrl = requireProperty_(properties, 'SYNC_ENDPOINT_URL');
    const sharedSecret = requireProperty_(properties, 'SYNC_SHARED_SECRET');
    const supabaseLegacyAnonKey = requireProperty_(properties, 'SUPABASE_LEGACY_ANON_KEY');
    const spreadsheetId = requireProperty_(properties, 'MIRROR_SPREADSHEET_ID');
    const payload = JSON.stringify({ requestedAt: startedAt.toISOString(), requestedBy: triggerName });
    const timestamp = String(Date.now());
    const signature = hmacHex_(sharedSecret, `${timestamp}.${payload}`);

    const response = UrlFetchApp.fetch(endpointUrl, {
      method: 'post',
      contentType: 'application/json',
      payload,
      headers: {
        Authorization: `Bearer ${supabaseLegacyAnonKey}`,
        'x-boa-timestamp': timestamp,
        'x-boa-signature': signature,
      },
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() !== 200) throw new Error(`Sync export returned ${response.getResponseCode()}: ${response.getContentText()}`);
    exportData = JSON.parse(response.getContentText()).data;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    ensureTabs_(spreadsheet);
    result = mirrorAll_(spreadsheet, exportData);
    writeSyncLog_(spreadsheet, [
      runId,
      triggerName,
      startedAt,
      new Date(),
      exportData.timesheets.length,
      exportData.expenses.length,
      exportData.profiles.length,
      exportData.vendor_bills.length,
      exportData.vendors.length,
      result.inserted,
      result.updated,
      '',
      result.archived,
    ]);

    if (triggerName === 'manual') {
      notifyManualSync_(`Sync complete. Added ${result.inserted} rows, updated ${result.updated} rows, and archived ${result.archived} rows deleted in the app.`);
    }
  } catch (error) {
    const errorMessage = error && error.message ? error.message : String(error);
    try {
      const spreadsheetId = PropertiesService.getScriptProperties().getProperty('MIRROR_SPREADSHEET_ID');
      if (spreadsheetId) {
        const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
        ensureTabs_(spreadsheet);
        writeSyncLog_(spreadsheet, [
          runId,
          triggerName,
          startedAt,
          new Date(),
          exportData ? exportData.timesheets.length : 0,
          exportData ? exportData.expenses.length : 0,
          exportData ? exportData.profiles.length : 0,
          exportData ? exportData.vendor_bills.length : 0,
          exportData ? exportData.vendors.length : 0,
          result.inserted,
          result.updated,
          errorMessage,
          result.archived,
        ]);
      }
    } finally {
      if (triggerName === 'manual') notifyManualSync_(`Sync failed: ${errorMessage}`);
    }
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function mirrorAll_(spreadsheet, data) {
  const profileById = indexBy_(data.profiles, 'id');
  const detailByUserId = indexBy_(data.employee_details, 'user_id');
  const vendorById = indexBy_(data.vendors, 'id');
  let inserted = 0;
  let updated = 0;
  let archived = 0;

  const timesheetRows = data.timesheets.map((entry) => {
    const profile = profileById[entry.user_id] || {};
    return [entry.id, entry.date, entry.user_id, profile.full_name || '', profile.email || '', profile.role || '', entry.work_type, entry.job_description, entry.start_time || '', entry.end_time || '', entry.hours || '', entry.hourly_rate || '', entry.job_count || '', entry.job_rate || '', entry.total_salary, entry.created_at, 'Active', new Date()];
  });
  const expenseRows = data.expenses.map((entry) => {
    const profile = profileById[entry.user_id] || {};
    return [entry.id, entry.date, entry.user_id, profile.full_name || '', profile.email || '', entry.description, entry.amount, entry.receipt_path || '', entry.created_at, 'Active', new Date()];
  });
  const staffRows = data.profiles.map((profile) => {
    const details = detailByUserId[profile.id] || {};
    return [profile.id, profile.full_name || details.full_name || '', profile.email || '', profile.role || '', details.mobile || '', details.address || '', details.salary_details || '', profile.created_at, profile.updated_at, 'Active', new Date()];
  });
  const vendorBillRows = data.vendor_bills.map((bill) => {
    const vendor = vendorById[bill.vendor_id] || {};
    const createdBy = profileById[bill.created_by] || {};
    const paidBy = profileById[bill.paid_by] || {};
    return [bill.id, bill.vendor_id, vendor.name || '', bill.amount, bill.due_date, bill.status, bill.description || '', bill.invoice_path || '', bill.method || '', bill.paid_at || '', createdBy.full_name || createdBy.email || '', paidBy.full_name || paidBy.email || '', bill.created_at, 'Active', new Date()];
  });
  const vendorRows = data.vendors.map((vendor) => [vendor.id, vendor.name, vendor.description || '', vendor.created_at, 'Active', new Date()]);

  [
    [MIRROR_TABS.TIMESHEETS, timesheetRows],
    [MIRROR_TABS.EXPENSES, expenseRows],
    [MIRROR_TABS.STAFF, staffRows],
    [MIRROR_TABS.VENDOR_BILLS, vendorBillRows],
    [MIRROR_TABS.VENDORS, vendorRows],
  ].forEach(([tabName, rows]) => {
    const sheet = spreadsheet.getSheetByName(tabName);
    const counts = upsertRows_(sheet, rows);
    inserted += counts.inserted;
    updated += counts.updated;
    archived += archiveRowsMissingFromExport_(sheet, new Set(rows.map((row) => String(row[0]))));
  });

  return { inserted, updated, archived };
}

function ensureTabs_(spreadsheet) {
  Object.keys(TAB_HEADERS).forEach((tabName) => {
    const sheet = spreadsheet.getSheetByName(tabName) || spreadsheet.insertSheet(tabName);
    ensureHeaderRow_(sheet, TAB_HEADERS[tabName]);
  });
}

function ensureHeaderRow_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    return;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
  headers.forEach((header, index) => {
    if (currentHeaders[index] !== header) sheet.getRange(1, index + 1).setValue(header);
  });
  sheet.setFrozenRows(1);
}

function upsertRows_(sheet, rows) {
  if (!rows.length) return { inserted: 0, updated: 0 };
  const headers = TAB_HEADERS[sheet.getName()];
  const sourceIndex = {};
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1).getValues().forEach((row, index) => {
      if (row[0]) sourceIndex[String(row[0])] = index + 2;
    });
  }

  // Preserve accountant-managed columns on updates.
  const systemColumnCount = headers.indexOf('accountant_notes') > -1 ? headers.indexOf('accountant_notes') : headers.length;
  const additions = [];
  let updated = 0;
  rows.forEach((row) => {
    const sourceId = String(row[0]);
    const existingRow = sourceIndex[sourceId];
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, systemColumnCount).setValues([row.slice(0, systemColumnCount)]);
      updated += 1;
    } else {
      additions.push(row.concat(Array(headers.length - row.length).fill('')));
    }
  });

  if (additions.length) sheet.getRange(sheet.getLastRow() + 1, 1, additions.length, headers.length).setValues(additions);
  return { inserted: additions.length, updated };
}

function archiveRowsMissingFromExport_(sheet, activeSourceIds) {
  const headers = TAB_HEADERS[sheet.getName()];
  const sourceIdColumn = headers.indexOf('source_id') + 1;
  const statusColumn = headers.indexOf('sync_status') + 1;
  const lastSyncedColumn = headers.indexOf('last_synced_at') + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  const rowCount = lastRow - 1;
  const sourceIds = sheet.getRange(2, sourceIdColumn, rowCount, 1).getValues();
  const statuses = sheet.getRange(2, statusColumn, rowCount, 1).getValues();
  const lastSyncedAt = sheet.getRange(2, lastSyncedColumn, rowCount, 1).getValues();
  const archivedAt = new Date();
  let archived = 0;

  sourceIds.forEach((row, index) => {
    const sourceId = String(row[0] || '');
    if (sourceId && !activeSourceIds.has(sourceId) && statuses[index][0] !== ARCHIVED_STATUS) {
      statuses[index][0] = ARCHIVED_STATUS;
      lastSyncedAt[index][0] = archivedAt;
      archived += 1;
    }
  });

  if (archived) {
    sheet.getRange(2, statusColumn, rowCount, 1).setValues(statuses);
    sheet.getRange(2, lastSyncedColumn, rowCount, 1).setValues(lastSyncedAt);
  }
  return archived;
}

function writeSyncLog_(spreadsheet, row) {
  const sheet = spreadsheet.getSheetByName(MIRROR_TABS.SYNC_LOG);
  sheet.appendRow(row);
}

function notifyManualSync_(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    // Runs started from the Apps Script editor do not have a spreadsheet UI.
    // The synchronization has already completed, so log the result instead.
    console.log(message);
  }
}

function indexBy_(records, key) {
  return records.reduce((index, record) => {
    index[record[key]] = record;
    return index;
  }, {});
}

function requireProperty_(properties, propertyName) {
  const value = properties.getProperty(propertyName);
  if (!value) throw new Error(`Missing Script Property: ${propertyName}`);
  return value;
}

function hmacHex_(secret, message) {
  return Utilities.computeHmacSha256Signature(message, secret)
    .map((byte) => ((byte + 256) % 256).toString(16).padStart(2, '0'))
    .join('');
}

function sha256Hex_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)
    .map((byte) => ((byte + 256) % 256).toString(16).padStart(2, '0'))
    .join('');
}


/**
 * Creates and formats the AI Timesheet Intake queue. This queue is a controlled
 * staging area: only the protected Edge Function can create final Supabase entries.
 */
function setupAITimesheetIntake() {
  const spreadsheet = SpreadsheetApp.openById(requireProperty_(PropertiesService.getScriptProperties(), 'MIRROR_SPREADSHEET_ID'));
  const tabName = MIRROR_TABS.AI_TIMESHEET_INTAKE;
  const headers = TAB_HEADERS[tabName];
  const sheet = spreadsheet.getSheetByName(tabName) || spreadsheet.insertSheet(tabName);
  ensureHeaderRow_(sheet, headers);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1f4e78')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setColumnWidths(1, headers.length, 130);
  sheet.setColumnWidth(headers.indexOf('job_description') + 1, 260);
  sheet.setColumnWidth(headers.indexOf('review_reason') + 1, 320);
  sheet.setColumnWidth(headers.indexOf('sync_error') + 1, 320);
  sheet.setColumnWidth(headers.indexOf('original_instruction') + 1, 360);

  const dataRange = sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), headers.length);
  const statusColumn = headers.indexOf('intake_status') + 1;
  const workTypeColumn = headers.indexOf('work_type') + 1;
  const createStaffColumn = headers.indexOf('create_staff_if_missing') + 1;
  sheet.getRange(2, statusColumn, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(['Pending', 'Processing', 'Needs Review', 'Exact Duplicate - Skipped', 'Synced', 'Error', 'Cancelled'], true)
      .setAllowInvalid(false)
      .build());
  sheet.getRange(2, workTypeColumn, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(['hourly', 'job'], true)
      .setAllowInvalid(false)
      .build());
  sheet.getRange(2, createStaffColumn, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(['TRUE', 'FALSE'], true)
      .setAllowInvalid(false)
      .build());

  const statusRange = sheet.getRange(2, statusColumn, Math.max(sheet.getMaxRows() - 1, 1), 1);
  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pending').setBackground('#fff2cc').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Processing').setBackground('#cfe2f3').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Needs Review').setBackground('#fce5cd').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Synced').setBackground('#d9ead3').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Exact Duplicate - Skipped').setBackground('#d9d9d9').setRanges([statusRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Error').setBackground('#f4cccc').setRanges([statusRange]).build(),
  ];
  sheet.setConditionalFormatRules(rules);
  notifyManualSync_('AI Timesheet Intake is ready. Add rows with intake_status set to Pending, then use BOA Sync → Process AI Timesheet Intake.');
}

/**
 * Processes only Pending AI intake rows. Needs Review rows stay untouched until
 * a manager corrects the values and deliberately sets their status back to Pending.
 */
function processAITimesheetIntake() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    notifyManualSync_('Another sync or intake run is already in progress. Please try again shortly.');
    return;
  }

  const summary = { scanned: 0, synced: 0, duplicates: 0, needsReview: 0, errors: 0 };
  try {
    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = requireProperty_(properties, 'MIRROR_SPREADSHEET_ID');
    const endpointUrl = properties.getProperty('AI_INTAKE_ENDPOINT_URL') || 'https://gnbxsemhjiatjtwisywz.functions.supabase.co/timesheet-admin-intake';
    const sharedSecret = requireProperty_(properties, 'SYNC_SHARED_SECRET');
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(MIRROR_TABS.AI_TIMESHEET_INTAKE);
    if (!sheet) throw new Error('AI Timesheet Intake tab does not exist. Run Set up AI Timesheet Intake first.');

    const headers = TAB_HEADERS[MIRROR_TABS.AI_TIMESHEET_INTAKE];
    const headerIndex = indexBy_(headers.map((header, index) => ({ header, index })), 'header');
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      notifyManualSync_('No AI Timesheet Intake rows are waiting to be processed.');
      return;
    }

    const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    values.forEach((row, rowOffset) => {
      const rowNumber = rowOffset + 2;
      const currentStatus = String(row[headerIndex.intake_status.index] || '').trim();
      if (currentStatus !== 'Pending') return;
      summary.scanned += 1;
      const attemptCount = Number(row[headerIndex.attempt_count.index] || 0) + 1;
      updateIntakeRow_(sheet, rowNumber, headerIndex, {
        intake_status: 'Processing',
        last_attempt_at: new Date(),
        sync_error: '',
        attempt_count: attemptCount,
      });

      try {
        if (!String(row[headerIndex.external_intake_id.index] || '').trim()) {
          const generatedIntakeId = Utilities.getUuid();
          row[headerIndex.external_intake_id.index] = generatedIntakeId;
          updateIntakeRow_(sheet, rowNumber, headerIndex, { external_intake_id: generatedIntakeId });
        }
        const payload = buildIntakePayload_(row, headerIndex);
        const previewTotal = payload.work_type === 'hourly'
          ? Number(payload.hours) * Number(payload.hourly_rate)
          : Number(payload.job_count) * Number(payload.job_rate);
        updateIntakeRow_(sheet, rowNumber, headerIndex, { calculated_total: previewTotal });

        const body = JSON.stringify(payload);
        const timestamp = String(Date.now());
        const response = UrlFetchApp.fetch(endpointUrl, {
          method: 'post',
          contentType: 'application/json',
          payload: body,
          headers: {
            'x-boa-timestamp': timestamp,
            'x-boa-signature': hmacHex_(sharedSecret, `${timestamp}.${body}`),
          },
          muteHttpExceptions: true,
        });
        const responseText = response.getContentText();
        let responseBody = {};
        try { responseBody = JSON.parse(responseText); } catch (error) { throw new Error(`Intake endpoint returned invalid JSON: ${responseText}`); }

        if (response.getResponseCode() >= 500) throw new Error(responseBody.error || `Intake endpoint returned ${response.getResponseCode()}.`);
        applyIntakeOutcome_(sheet, rowNumber, headerIndex, response.getResponseCode(), responseBody);
        if (responseBody.outcome === 'synced') summary.synced += 1;
        else if (responseBody.outcome === 'exact_duplicate') summary.duplicates += 1;
        else summary.needsReview += 1;
      } catch (error) {
        const errorMessage = error && error.message ? error.message : String(error);
        const maxRetriesReached = attemptCount >= 3;
        updateIntakeRow_(sheet, rowNumber, headerIndex, {
          intake_status: maxRetriesReached ? 'Error' : 'Pending',
          sync_error: errorMessage,
          last_attempt_at: new Date(),
        });
        summary.errors += 1;
      }
    });
  } finally {
    lock.releaseLock();
  }
  notifyManualSync_(`AI intake complete. Processed ${summary.scanned} Pending row(s): ${summary.synced} synced, ${summary.duplicates} duplicate(s) skipped, ${summary.needsReview} need review, ${summary.errors} error(s).`);
}

function buildIntakePayload_(row, headerIndex) {
  const get = (key) => row[headerIndex[key].index];
  const externalIntakeId = String(get('external_intake_id') || '').trim();
  return {
    external_intake_id: externalIntakeId,
    employee_name_input: String(get('employee_name_input') || '').trim(),
    create_staff_if_missing: String(get('create_staff_if_missing') || '').toUpperCase() === 'TRUE',
    date: intakeDate_(get('date')),
    work_type: String(get('work_type') || '').trim(),
    job_description: String(get('job_description') || '').trim(),
    start_time: intakeTime_(get('start_time')),
    end_time: intakeTime_(get('end_time')),
    hours: intakeNumber_(get('hours')),
    hourly_rate: intakeNumber_(get('hourly_rate')),
    job_count: intakeNumber_(get('job_count')),
    job_rate: intakeNumber_(get('job_rate')),
  };
}

function applyIntakeOutcome_(sheet, rowNumber, headerIndex, statusCode, response) {
  const employee = response.employee || {};
  const record = response.record || {};
  const common = {
    employee_id: employee.id || '',
    employee_name: employee.full_name || '',
    supabase_record_id: record.id || '',
    last_attempt_at: new Date(),
    sync_error: '',
  };

  if (response.outcome === 'synced') {
    updateIntakeRow_(sheet, rowNumber, headerIndex, Object.assign(common, {
      intake_status: 'Synced',
      duplicate_status: response.idempotent ? 'technical-idempotent' : '',
      review_reason: response.idempotent ? 'Existing record was returned safely for this intake ID.' : '',
      processed_at: new Date(),
    }));
    return;
  }
  if (response.outcome === 'exact_duplicate') {
    updateIntakeRow_(sheet, rowNumber, headerIndex, Object.assign(common, {
      intake_status: 'Exact Duplicate - Skipped',
      duplicate_status: 'exact',
      review_reason: response.reason || 'An identical active entry already exists.',
      processed_at: new Date(),
    }));
    return;
  }
  if (response.outcome === 'needs_review') {
    updateIntakeRow_(sheet, rowNumber, headerIndex, Object.assign(common, {
      intake_status: 'Needs Review',
      duplicate_status: response.record ? 'likely-or-overlap' : '',
      review_reason: response.reason || `Endpoint returned ${statusCode}.`,
    }));
    return;
  }
  throw new Error(response.error || `Unexpected intake response ${statusCode}.`);
}

function updateIntakeRow_(sheet, rowNumber, headerIndex, fields) {
  Object.keys(fields).forEach((key) => {
    if (headerIndex[key]) sheet.getRange(rowNumber, headerIndex[key].index + 1).setValue(fields[key]);
  });
}

function intakeDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, 'Asia/Hong_Kong', 'yyyy-MM-dd');
  }
  return String(value || '').trim();
}

function intakeTime_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, 'Asia/Hong_Kong', 'HH:mm:ss');
  }
  return String(value).trim() || null;
}

function intakeNumber_(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}
