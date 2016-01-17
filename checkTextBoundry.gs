var TOPLEVELDIR = ''
var FONT_DELIM_FILE_URL = 'http://flyingclimber.net/ninokunids/font12.json';
var FONT_DELIM = loadDelimFile();
var MAX = 223;
var MAXFIX = 20;

function updateAllFiles() {
  var folders = DriveApp.getFoldersByName(TOPLEVELDIR);

  checkTextBoundry(folders);
}

function checkTextBoundry(folders) {
  while (folders.hasNext()) {
    var next = folders.next();
    var files = next.getFiles();
    var subFolders = next.getFolders();
    
    while(subFolders.hasNext()) {
      checkTextBoundry(subFolders);
    }
    
    while (files.hasNext()) {
      var sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
      Logger.log(sheet.getParent().getName());
      var sheetRange = sheet.getRange('2:2');

      translateColumn = getColumn('Translated Text', sheetRange);
      editedTextColumn = getColumn('Edited Text', sheetRange);
      var translateRange = sheet.getRange(translateColumn + '3:' + editedTextColumn);
      var values = translateRange.getValues();
    
      //translateRange.clearNote();
      var fixed = 0;
    
      for(var i = 0; i<values.length; i++) {
        note = checkLine(values[i]);
        if(note && fixed <= MAXFIX) {
          cellLoc = parseInt(i) + 3;
          var cell = sheet.getRange(translateColumn + cellLoc);
          //cell.setNote(note);
          Logger.log(note);
          fixed += 1;
        }
      }
    }     
  }
}

var PRE_TEXT = "";

function checkLine(text) {
  text = typeof text !== 'undefined' ? text : PRE_TEXT;
  
  if(typeof text[0] == 'string') {
    var tokens = text[0].split("\n");
  
    for(var a = 0; a<tokens.length; a++) {
      var computed_length = 0;
      var marker = false
      var inside_markup = false
    
      for(var c = 0; c<tokens[a].length; c++) {
        var char = tokens[a][c];
      
        if(computed_length >= MAX && ! marker) {
          marker = c     
        }
      
        if (char == '{') {
          inside_markup = true;
          continue;
        } else if(char == '}') {
          inside_markup = false;
          continue;
        } else if (inside_markup == true) {
          continue;
        } else if(char == " " ) {
          val = 5
        } else {
          val = FONT_DELIM[char];
        }
        
        computed_length += val
      }  
      if(marker && text[text.length - 1] == "" ) {
        note = tokens[a].slice(0,marker) + "<--|-->" + tokens[a].slice(marker);
      
        //res = "Length: " + computed_length + "\n"
        res = note
        return res;
      }
    }
  }
}

function getColumn(key, range) {
  var values = range.getValues();
  var index = values[0].indexOf(key);
  var columns = ['A','B','C','D','E','F','G','H','I','J','K'];

  return columns[index];
}

function loadDelimFile() {
  var response = UrlFetchApp.fetch(FONT_DELIM_FILE_URL);
  var json = response.getContentText();
  var data = JSON.parse(json);

  return data.characters;
}
