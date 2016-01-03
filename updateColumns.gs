function updateAllFiles() {
  var folders = DriveApp.getFoldersByName('Overlays-test');

  searchFolders(folders);
}

function searchFolders(folders) {
  while (folders.hasNext()) {      
    var next = folders.next();

    var files = next.getFiles();
    var subFolders = next.getFolders();
    
    while(subFolders.hasNext()) {
      searchFolders(subFolders);
    }

    while (files.hasNext()) {
      var sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
      Logger.log(sheet.getParent().getName());
      var sheetRange = sheet.getRange('2:2');
      
      updateText('Proofreader', 'Editor', sheetRange); // (3) Change Proofreader to Editor
      
      var transColumn = findText('Translated Text', sheetRange);      
      sheet.insertColumnAfter(transColumn + 1); // (1) Insert a "Translation Notes" between "Translated Text" and "Translator"
      updateText("", "Translation Notes", sheetRange)
      
      var lastColumn = sheet.getLastColumn();
      sheet.insertColumnsAfter(lastColumn - 1, 2); // (2) Insert an "Edited Text" and (4) "Edited Notes" column to the right of "Translator
      var sheetRange = sheet.getRange('2:2');
      updateText("", "Edited Text", sheetRange)
      updateText("", "Edited Notes", sheetRange)    
      }
  }
}

function findText(key, range) {
  var values = range.getValues();
  var index = values[0].indexOf(key);
  
  return index
}

function updateText(key, replace, range) {
  var values = range.getValues();
  var index = findText(key, range)
  
  if(index) {
    values[0][index] = replace; 
    range.setValues(values);
  }  
}
