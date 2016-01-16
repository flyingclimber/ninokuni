var FILE_NAME = '';
var FONT_DELIM_FILE_URL = 'http://flyingclimber.net/ninokunids/font12.json';
var FONT_DELIM = loadDelimFile();
var MAX = 223;

function checkTextBoundry() {
  var files = DriveApp.getFilesByName(FILE_NAME);
  
  while(files.hasNext()) {
    var sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
    var sheetRange = sheet.getRange('2:2');

    translateColumn = getColumn('Translated Text', sheetRange);
    var translateRange = sheet.getRange(translateColumn + '3:' + translateColumn);
    var values = translateRange.getValues();
    
    for(var i = 0; i<values.length; i++) {
      checkLine(values[i]);            
    }
  }     
}

var PRE_TEXT = "";

function checkLine(text) {
  text = typeof text !== 'undefined' ? text[0] : PRE_TEXT;
  tokens = text.split("\n");
  
  for(var a = 0; a<tokens.length; a++) {
    var computed_length = 0;
    var marker = 0
          
    for(var c = 0; c<tokens[a].length; c++) {
      if(computed_length >= MAX && ! marker) {
          marker = c     
      }
      if(tokens[a][c] == " " ) {
          val = 5
      } else {
          val = FONT_DELIM[tokens[a][c]];
      }
        computed_length += val
      }  
    
    if(computed_length > MAX) {
      out = tokens[a].slice(0,marker) + "<--|-->" + tokens[a].slice(marker);

      Logger.log("Length: " + computed_length);
      Logger.log("Marker: " + out);
    }
   }
}

function getColumn(key, range) {
  var values = range.getValues();
  var index = values[0].indexOf(key);
  var columns = ['A','B','C','D','E','F','G','H'];

  return columns[index];
}

function loadDelimFile() {
  var response = UrlFetchApp.fetch(FONT_DELIM_FILE_URL);
  var json = response.getContentText();
  var data = JSON.parse(json);

  return data.characters;
}
