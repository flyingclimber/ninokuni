var TOPLEVELDIR = '';
var FONT_DELIM_FILE_URL = 'http://flyingclimber.net/ninokunids/font12.json';
var FONT_DELIM = loadDelimFile_();
var MAX = 223;
var longStrings = [];
var EMAIL = '';
var SUBJECT = "NiNoKuniDS String Length";

function updateAllFiles() {
  var folders = DriveApp.getFoldersByName(TOPLEVELDIR);

  checkTextBoundry_(folders);
  sendResults(longStrings);
}

function checkTextBoundry_(folders) {
  while (folders.hasNext()) {
    var next = folders.next();
    var files = next.getFiles();
    var subFolders = next.getFolders();
    
    while(subFolders.hasNext()) {
      checkTextBoundry_(subFolders);
    }
    
    while (files.hasNext()) {
      var sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
      var fileName = sheet.getParent().getName();
      var sheetRange = sheet.getRange('2:2');
      
      longStrings[fileName] = 0;

      var translateColumn = getColumn_('Translated Text', sheetRange);
      var editedTextColumn = getColumn_('Edited Text', sheetRange);
      var translateRange = sheet.getRange(translateColumn + '3:' + editedTextColumn);
      var values = translateRange.getValues();
    
      translateRange.clearNote();
    
      for(var i = 0; i<values.length; i++) {
        note = checkLine(values[i]);
        if(note) {
          cellLoc = parseInt(i) + 3;
          var cell = sheet.getRange(translateColumn + cellLoc);
          cell.setNote(note);
          Logger.log(note);
          longStrings[fileName] += 1;
        }
      }
    }     
  }
}

function sendResults(data) {
  var body = '';
  var totalCount = 0;
  
  Object.keys(data)
  .sort()
  .forEach(function(v, i) {
    var count = data[v];
    if(count) {
      body += v + ":" + count + ", ";
      totalCount += count;
    }
  });
  MailApp.sendEmail(EMAIL, SUBJECT + ": " + totalCount, body);
  updateSlackTopic(body);
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
      
        return note;
      }
    }
  }
}

function getColumn_(key, range) {
  var values = range.getValues();
  var index = values[0].indexOf(key);
  var columns = ['A','B','C','D','E','F','G','H','I','J','K'];

  return columns[index];
}

function loadDelimFile_() {
  var response = UrlFetchApp.fetch(FONT_DELIM_FILE_URL);
  var json = response.getContentText();
  var data = JSON.parse(json);

  return data.characters;
}

function updateSlackTopic(message) {
  var URL = "https://slack.com/";
  var PATH = "api/channels.setTopic";
  var token = "";
  var channel = "";
  
  var payload = {
    "token" : token,
    "channel" : channel,
    "topic" : "Next files needing string length editing: " + message
  };
  
  var options = {
    "method" : "post",
    "payload" : payload
  };
  
  UrlFetchApp.fetch(URL + PATH, options);
}
