function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏠 Tiwari Tracker')
      .addItem('Open Expense Tracker', 'showTracker')
      .addSeparator()
      .addItem('Sync App to Sheet Rows', 'syncToSheetRows')
      .addToUi();
}

/**
 * WEB APP INTERFACE
 */
function doGet(e) {
  var data = getAllData();
  var json = JSON.stringify(data);
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    if (postData.action === 'save_data') {
      saveToSheetRows(postData);
      // Add user identity to initial data
      var userEmail = Session.getActiveUser().getEmail();
      return ContentService.createTextOutput(JSON.stringify({
        ...getAllData(),
        userEmail: userEmail || 'Guest User'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function showTracker() {
  var html = HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Tiwari House Expense Tracker')
      .setWidth(1000)
      .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'Tiwari House Expense Tracker');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Add headers automatically for new sheets
    if (name === 'Expenses') sheet.appendRow(['id', 'date', 'particular', 'amount', 'name', 'group', 'createdAt', 'updatedAt', 'createdBy']);
    if (name === 'Members') sheet.appendRow(['id', 'name', 'group', 'password', 'uiMode', 'showExpenses', 'showShopping', 'showCalendar', 'showReports', 'showAdmin', 'dashShowFilters', 'dashShowCharts', 'dashShowSettlement']);
    if (name === 'Balances') sheet.appendRow(['Group', 'Balance']);
    if (name === 'Shopping') sheet.appendRow(['id', 'item', 'requestedBy', 'status', 'purchasedBy', 'createdAt']);
    if (name === 'Budgets') sheet.appendRow(['Group', 'MonthlyLimit']);
    if (name === 'Templates') sheet.appendRow(['id', 'particular', 'amount', 'name', 'group']);
    if (name === 'Events') sheet.appendRow(['id', 'type', 'name', 'date', 'recurring']);
    if (name === 'Notifications') sheet.appendRow(['id', 'title', 'msg', 'targetPage', 'time']);
  }
  return sheet;
}

function getAllDataWithUser() {
  var userEmail = Session.getActiveUser().getEmail();
  return {
    ...getAllData(),
    userEmail: userEmail || 'Guest User'
  };
}

function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    expenses: getRowsData('Expenses', ss),
    members: getRowsData('Members', ss),
    carriedBalances: getBalancesData('Balances', ss),
    shoppingItems: getRowsData('Shopping', ss),
    budgets: getBalancesData('Budgets', ss),
    templates: getRowsData('Templates', ss),
    events: getRowsData('Events', ss),
    notifications: getRowsData('Notifications', ss)
  };
}

function getRowsData(sheetName, ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheet(sheetName);
  var range = sheet.getDataRange();
  if (range.getNumRows() < 2) return [];
  
  var data = range.getValues();
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    var hasData = false;
    for (var j = 0; j < headers.length; j++) {
      if (data[i][j] !== "") hasData = true;
      var val = data[i][j];
      // Convert Date objects to strings to prevent ISO serialization issues
      if (Object.prototype.toString.call(val) === '[object Date]') {
        val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
      }
      obj[headers[j]] = val;
    }
    if (hasData) result.push(obj);
  }
  return result;
}

function getBalancesData(sheetName, ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheet(sheetName);
  var range = sheet.getDataRange();
  if (range.getNumRows() < 1) return {};
  
  var data = range.getValues();
  var balances = {};
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] && data[i][0] !== "Group") {
      balances[data[i][0]] = parseFloat(data[i][1]) || 0;
    }
  }
  return balances;
}

function saveToSheetRows(data) {
  if (data.expenses) updateSheet('Expenses', ['id', 'date', 'particular', 'amount', 'name', 'group', 'createdAt', 'updatedAt', 'createdBy'], data.expenses);
  if (data.members) updateSheet('Members', ['id', 'name', 'group', 'password', 'uiMode', 'showExpenses', 'showShopping', 'showCalendar', 'showReports', 'showAdmin', 'dashShowFilters', 'dashShowCharts', 'dashShowSettlement'], data.members);
  if (data.templates) updateSheet('Templates', ['id', 'particular', 'amount', 'name', 'group'], data.templates);
  if (data.events) updateSheet('Events', ['id', 'type', 'name', 'date', 'recurring'], data.events);
  if (data.notifications) updateSheet('Notifications', ['id', 'title', 'msg', 'targetPage', 'time'], data.notifications);
  
  if (data.carriedBalances) {
    var balanceSheet = getSheet('Balances');
    balanceSheet.clearContents();
    balanceSheet.appendRow(['Group', 'Balance']);
    var rows = Object.entries(data.carriedBalances);
    if (rows.length > 0) {
      balanceSheet.getRange(2, 1, rows.length, 2).setValues(rows);
    }
  }

  if (data.budgets) {
    var budgetSheet = getSheet('Budgets');
    budgetSheet.clearContents();
    budgetSheet.appendRow(['Group', 'MonthlyLimit']);
    var rows = Object.entries(data.budgets);
    if (rows.length > 0) {
      budgetSheet.getRange(2, 1, rows.length, 2).setValues(rows);
    }
  }

  if (data.shoppingItems) {
    updateSheet('Shopping', ['id', 'item', 'requestedBy', 'status', 'purchasedBy', 'createdAt'], data.shoppingItems);
  }
  
  return { status: 'success' };
}

function updateSheet(sheetName, headers, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheet(sheetName);
  
  // clearContents is much faster than clear() as it doesn't affect formatting
  sheet.clearContents();
  
  if (!data || data.length === 0) {
    sheet.appendRow(headers);
    return;
  }

  var rows = [headers];
  data.forEach(function(item) {
    var row = headers.map(function(h) { return item[h]; });
    rows.push(row);
  });
  
  var range = sheet.getRange(1, 1, rows.length, headers.length);
  range.setValues(rows);
  
  // Only apply text format to the 'date' column to save time
  var dateColIndex = headers.indexOf('date');
  if (dateColIndex !== -1) {
    sheet.getRange(1, dateColIndex + 1, rows.length, 1).setNumberFormat('@');
  }
  
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f3f3');
}

function syncToSheetRows() {
  SpreadsheetApp.getUi().alert('Synchronization successful!');
}
function getUserEmail() {
  return Session.getActiveUser().getEmail() || "Guest";
}
