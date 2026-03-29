const SCRIPT_VERSION = "2.8";

// Sheet Names
const SHEET_PENDING = "Pendingbooking";
const SHEET_ACTIVE = "Booking";
const SHEET_ARCHIVE = "ArchivedBookings";
const SHEET_BLOCKED = "BlockedBuses"; // New Sheet

function doPost(e) {
  try {
    const params = e.parameter;
    const method = params.method;

    if (method === 'add') {
      return handleAdd(params);
    } else if (method === 'update') {
      return handleUpdate(params);
    } else if (method === 'delete') {
      return handleDelete(params);
    } else if (method === 'clearArchive') {
      return handleClearArchive();
    } else if (method === 'blockBus') {
      return handleBlockBus(params);
    } else if (method === 'unblockBus') {
      return handleUnblockBus(params);
    }

    return createJsonResponse({ success: false, error: "Invalid method" });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  try {
    const params = e.parameter;
    const method = params.method;

    if (method === 'getAll') {
      return handleGetAll(params.type);
    } else if (method === 'check' || method === 'search') {
      return handleCheck(params.phone);
    } else if (method === 'autoArchive') {
      return handleAutoArchive();
    } else if (method === 'getBlockedBuses') {
      return handleGetBlockedBuses();
    }

    return createJsonResponse({ success: false, error: "Invalid GET method" });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// --- Handlers ---

function handleAdd(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PENDING);
  
  const bookingId = "LGB-" + Math.floor(1000 + Math.random() * 9000);
  const bookedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MM/dd/yyyy");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const rowData = new Array(headers.length).fill("");

  // Dynamically map incoming params to the correct column based on header name
  headers.forEach((header, index) => {
    if (header === "Booking ID" || header === "Booking Id") rowData[index] = bookingId;
    else if (header === "Name") rowData[index] = params.name || "";
    else if (header === "Phone") rowData[index] = params.phone || "";
    else if (header === "Bus") rowData[index] = params.bus || "";
    else if (header === "Date") rowData[index] = params.date || "";
    else if (header === "Time") rowData[index] = params.time || "";
    else if (header === "Male Seat") rowData[index] = params.maleSeats || "0";
    else if (header === "Female Seat") rowData[index] = params.femaleSeats || "0";
    else if (header === "Pickup") rowData[index] = params.pickup || "";
    else if (header === "Payment") rowData[index] = params.payment || "Pending";
    else if (header === "Total") rowData[index] = params.total || "0";
    else if (header === "Destination") rowData[index] = params.destination || "";
    else if (header === "Booked Date") rowData[index] = bookedDate;
    else if (header === "Bus Number") rowData[index] = params['Bus Number'] || "";
    else if (header === "Conductor Number") rowData[index] = params['Conductor Number'] || "";
    else if (header === "Feedback") rowData[index] = params.feedback || params.Feedback || "";
    else if (header === "Status" || header === "status") rowData[index] = params.status || "Pending";
  });

  sheet.appendRow(rowData);
  
  return createJsonResponse({ 
    success: true, 
    bookingId: bookingId,
    message: "Booking added to Pending" 
  });
}

function handleUpdate(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const id = params.id;
  const rowParam = params.row;
  const typeParam = params.type;
  const targetStatus = params.status; // 'Confirmed', 'Pending', 'Cancelled', 'Fully Booked'
  
  // Find the booking using ID, or fallback to Row Number
  let found = findBooking(id, rowParam, typeParam);
  
  if (!found) {
    return createJsonResponse({ success: false, error: "Booking not found" });
  }

  const { sheet, row, data } = found;
  const currentSheetName = sheet.getName();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  
  // Determine destination sheet based on status
  let destSheetName = currentSheetName;
  if (targetStatus === 'Confirmed') destSheetName = SHEET_ACTIVE;
  else if (targetStatus === 'Cancelled') destSheetName = SHEET_ARCHIVE;
  else if (targetStatus === 'Pending') destSheetName = SHEET_PENDING;
  // If 'Fully Booked', keep in current sheet (usually Active or Pending)

  const destSheet = ss.getSheetByName(destSheetName);
  const destHeaders = destSheet.getRange(1, 1, 1, destSheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const destData = new Array(destHeaders.length).fill("");

  // 1. Copy existing data to destData
  headers.forEach((header, index) => {
    const destIndex = destHeaders.indexOf(header);
    if (destIndex !== -1) {
      destData[destIndex] = data[index];
    }
  });

  // 2. Apply updates from params directly to destData
  Object.keys(params).forEach(key => {
    if (key !== 'method' && key !== 'id' && key !== 'row' && key !== 'type' && key !== 'status') {
      let headerName = key;
      if (key === 'name') headerName = 'Name';
      if (key === 'phone') headerName = 'Phone';
      if (key === 'bus') headerName = 'Bus';
      if (key === 'date') headerName = 'Date';
      if (key === 'time') headerName = 'Time';
      if (key === 'pickup') headerName = 'Pickup';
      if (key === 'destination') headerName = 'Destination';
      if (key === 'feedback') headerName = 'Feedback';
      if (key === 'Feedback') headerName = 'Feedback';
      if (key === 'payment') headerName = 'Payment';
      if (key === 'total') headerName = 'Total';
      if (key === 'maleSeats') headerName = 'Male Seat';
      if (key === 'femaleSeats') headerName = 'Female Seat';
      if (key === 'Status') headerName = 'Status';
      
      const destIndex = destHeaders.indexOf(headerName);
      if (destIndex !== -1) {
        destData[destIndex] = params[key];
      }
    }
  });

  // Explicitly update status if provided
  if (targetStatus) {
    const statusIndex = destHeaders.findIndex(h => h === 'Status' || h === 'status');
    if (statusIndex !== -1) {
      destData[statusIndex] = targetStatus;
    }
  }

  if (destSheetName !== currentSheetName) {
    // Move to new sheet
    destSheet.appendRow(destData);
    sheet.deleteRow(row);
  } else {
    // Update in place
    destSheet.getRange(row, 1, 1, destData.length).setValues([destData]);
  }

  return createJsonResponse({ success: true, message: "Booking updated" });
}

function handleDelete(params) {
  const id = params.id;
  const rowParam = params.row;
  const typeParam = params.type;
  
  const found = findBooking(id, rowParam, typeParam);
  
  if (!found) {
    return createJsonResponse({ success: false, error: "Booking not found" });
  }

  found.sheet.deleteRow(found.row);
  return createJsonResponse({ success: true, message: "Booking deleted" });
}

function handleClearArchive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ARCHIVE);
  
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  return createJsonResponse({ success: true, message: "Archive cleared" });
}

function handleGetAll(type) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  function processBookings(sheet, defaultStatus, origin) {
    return getSheetData(sheet).map(b => {
      const currentStatus = String(b.Status || b.status || '').trim();
      // PRESERVE "Fully Booked" status, otherwise apply default
      if (currentStatus.toLowerCase() !== 'fully booked') {
        b.Status = defaultStatus;
      } else {
        b.Status = 'Fully Booked';
      }
      b.origin = origin;
      return b;
    });
  }

  if (type === 'pending') {
    const pending = processBookings(ss.getSheetByName(SHEET_PENDING), 'Pending', 'pending');
    return createJsonResponse({ success: true, bookings: pending });
  } else if (type === 'active') {
    const active = processBookings(ss.getSheetByName(SHEET_ACTIVE), 'Confirmed', 'active');
    return createJsonResponse({ success: true, bookings: active });
  } else if (type === 'archive') {
    const archive = processBookings(ss.getSheetByName(SHEET_ARCHIVE), 'Cancelled', 'archive');
    return createJsonResponse({ success: true, bookings: archive });
  } else {
    const pending = processBookings(ss.getSheetByName(SHEET_PENDING), 'Pending', 'pending');
    const active = processBookings(ss.getSheetByName(SHEET_ACTIVE), 'Confirmed', 'active');
    const archive = processBookings(ss.getSheetByName(SHEET_ARCHIVE), 'Cancelled', 'archive');
    
    return createJsonResponse({
      success: true,
      allBookings: [...pending, ...active, ...archive]
    });
  }
}

function handleCheck(phone) {
  if (!phone) return createJsonResponse({ success: false, error: "Phone required" });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cleanSearchPhone = String(phone).replace(/\D/g, '').slice(-9);
  
  // Check Active first, then Pending
  let bookings = getSheetData(ss.getSheetByName(SHEET_ACTIVE));
  let match = bookings.find(b => {
    const bPhone = String(b.Phone || b.phone || '').replace(/\D/g, '').slice(-9);
    return bPhone === cleanSearchPhone;
  });
  
  if (match) {
    match.Status = 'Confirmed';
    return createJsonResponse({ success: true, booking: match });
  }
  
  bookings = getSheetData(ss.getSheetByName(SHEET_PENDING));
  match = bookings.find(b => {
    const bPhone = String(b.Phone || b.phone || '').replace(/\D/g, '').slice(-9);
    return bPhone === cleanSearchPhone;
  });
  
  if (match) {
    match.Status = 'Pending';
    return createJsonResponse({ success: true, booking: match });
  }
  
  return createJsonResponse({ success: false, error: "No booking found" });
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const s = String(dateStr).trim();
  
  // Handle weird format: MM/DDT.../YYYY (e.g. 03/27T18:30:00.000Z/2026)
  const weirdFormatMatch = s.match(/^(\d{2})\/(\d{2})T.*\/(\d{4})$/);
  if (weirdFormatMatch) {
    const [_, month, day, year] = weirdFormatMatch;
    // Create date in YYYY-MM-DD format to avoid timezone issues
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
  }
  
  // Try ISO format YYYY-MM-DD
  if (s.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(s);
  }
  
  // Try standard Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d;
  }
  
  return null;
}

function handleAutoArchive() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = ss.getSheetByName(SHEET_ACTIVE);
  const pendingSheet = ss.getSheetByName(SHEET_PENDING);
  const archiveSheet = ss.getSheetByName(SHEET_ARCHIVE);
  
  if (!archiveSheet) {
    return createJsonResponse({ success: false, error: "Archive sheet not found" });
  }
  
  const now = new Date();
  let totalRowsArchived = 0;

  function archiveOldBookings(sourceSheet, sheetName) {
    if (!sourceSheet) return 0;
    
    const data = sourceSheet.getDataRange().getValues();
    if (data.length < 2) return 0;
    
    const headers = data[0].map(h => String(h).trim());
    const dateCol = headers.indexOf("Date");
    const statusCol = headers.indexOf("Status");
    
    if (dateCol === -1) {
      Logger.log(`${sheetName}: Date column not found`);
      return 0;
    }
    
    const destHeaders = archiveSheet.getRange(1, 1, 1, archiveSheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    
    const rowsToDelete = [];
    let rowsProcessed = 0;
    
    for (let i = data.length - 1; i >= 1; i--) {
      const rowDateStr = data[i][dateCol];
      const rowStatus = data[i][statusCol];
      
      if (!rowDateStr) continue;
      
      rowsProcessed++;
      
      const rowDate = parseDate(rowDateStr);
      if (!rowDate) {
        Logger.log(`${sheetName}: Could not parse date at row ${i+1}: ${rowDateStr}`);
        continue;
      }
      
      // Cutoff is 5:30 AM the day AFTER the journey date
      const cutoffDate = new Date(rowDate);
      cutoffDate.setDate(cutoffDate.getDate() + 1);
      cutoffDate.setHours(5, 30, 0, 0);
      
      if (now > cutoffDate) {
        const rowData = data[i];
        const destData = new Array(destHeaders.length).fill("");
        
        headers.forEach((header, index) => {
          const destIndex = destHeaders.indexOf(header);
          if (destIndex !== -1) {
            destData[destIndex] = rowData[index];
          }
        });
        
        archiveSheet.appendRow(destData);
        rowsToDelete.push(i + 1);
        Logger.log(`${sheetName}: Will archive row ${i+1} (date: ${rowDateStr}, status: ${rowStatus})`);
      }
    }
    
    // Delete rows in reverse order (highest row first) to avoid index shifting issues
    rowsToDelete.sort((a, b) => b - a);
    for (let i = 0; i < rowsToDelete.length; i++) {
      sourceSheet.deleteRow(rowsToDelete[i]);
    }
    
    Logger.log(`${sheetName}: Processed ${rowsProcessed} rows, archived ${rowsToDelete.length}`);
    return rowsToDelete.length;
  }

  // Archive from both Active and Pending sheets
  const activeArchived = archiveOldBookings(activeSheet, "Active");
  const pendingArchived = archiveOldBookings(pendingSheet, "Pending");
  
  totalRowsArchived = activeArchived + pendingArchived;
  Logger.log(`Auto-Archive Complete: ${totalRowsArchived} total rows archived`);
  
  return createJsonResponse({ 
    success: true, 
    message: `Archived ${totalRowsArchived} bookings (${activeArchived} from Active, ${pendingArchived} from Pending)`,
    details: { activeArchived, pendingArchived, totalRowsArchived }
  });
}

function handleBlockBus(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_BLOCKED);
  
  // 1. Auto-create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_BLOCKED);
    sheet.appendRow(["Bus", "Date", "Timestamp"]);
  }
  
  const bus = String(params.bus).trim();
  const date = String(params.date).trim();
  
  // 2. Check for duplicates to prevent blocking the same bus twice
  const data = sheet.getDataRange().getDisplayValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === bus && String(data[i][1]).trim() === date) {
      return createJsonResponse({ success: true, message: "Bus is already blocked for this date" });
    }
  }
  
  const blockedAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MM/dd/yyyy HH:mm:ss");
  
  sheet.appendRow([bus, date, blockedAt]);
  
  return createJsonResponse({ success: true, message: "Bus blocked successfully" });
}

function handleUnblockBus(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_BLOCKED);
  
  if (!sheet) {
    return createJsonResponse({ success: false, error: "BlockedBuses sheet not found" });
  }
  
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return createJsonResponse({ success: false, error: "No blocked buses found" });
  
  let deleted = false;
  // Loop backwards to safely delete rows
  for (let i = data.length - 1; i >= 1; i--) {
    const rowBus = String(data[i][0]).trim();
    const rowDate = String(data[i][1]).trim();
    
    if (rowBus === String(params.bus).trim() && rowDate === String(params.date).trim()) {
      sheet.deleteRow(i + 1);
      deleted = true;
    }
  }
  
  if (deleted) {
    return createJsonResponse({ success: true, message: "Bus unblocked successfully" });
  }
  
  return createJsonResponse({ success: false, error: "Blocked bus not found" });
}

function handleGetBlockedBuses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_BLOCKED);
  
  if (!sheet) {
    return createJsonResponse({ success: true, blockedBuses: [] });
  }
  
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return createJsonResponse({ success: true, blockedBuses: [] });
  
  const blockedBuses = [];
  for (let i = 1; i < data.length; i++) {
    blockedBuses.push({
      bus: data[i][0],
      date: data[i][1],
      blockedAt: data[i][2]
    });
  }
  
  return createJsonResponse({ success: true, blockedBuses: blockedBuses });
}

// --- Helpers ---

function findBooking(id, row, type) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Try to find by ID first (if ID is valid and not empty)
  if (id && String(id).trim() !== "") {
    const sheets = [SHEET_PENDING, SHEET_ACTIVE, SHEET_ARCHIVE];
    for (let i = 0; i < sheets.length; i++) {
      const sheetName = sheets[i];
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      if (data.length < 2) continue;
      
      const headers = data[0].map(h => String(h).trim());
      const idCol = headers.indexOf("Booking ID") !== -1 ? headers.indexOf("Booking ID") : headers.indexOf("Booking Id");
      
      if (idCol === -1) continue;
      
      for (let j = 1; j < data.length; j++) {
        if (String(data[j][idCol]) === String(id)) {
          return { sheet: sheet, row: j + 1, data: data[j] };
        }
      }
    }
  }
  
  // 2. Fallback: Find by Row Number and Sheet Type
  if (row && type) {
     let sheetName = SHEET_PENDING;
     if (type === 'active') sheetName = SHEET_ACTIVE;
     if (type === 'archive') sheetName = SHEET_ARCHIVE;
     
     const sheet = ss.getSheetByName(sheetName);
     if (sheet) {
        const data = sheet.getDataRange().getValues();
        const rowIndex = parseInt(row);
        
        // Ensure the row exists and is not the header
        if (rowIndex <= data.length && rowIndex > 1) {
           return { sheet: sheet, row: rowIndex, data: data[rowIndex - 1] };
        }
     }
  }
  
  return null;
}

function getSheetData(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0].map(h => String(h).trim());
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = { rowIndex: i + 1 };
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
