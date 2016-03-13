var TOPLEVELDIR = '';
var FONT_DELIM_FILE_URL = 'http://flyingclimber.net/ninokunids/font12.json';
var FONT_DELIM = loadDelimFile_();
var MAX = 223;
var longStrings = [];
var EMAIL = '';
var SUBJECT = "NiNoKuniDS String Length";

var SLACK_URL = '';
var SLACK_token = '';
var SLACK_channel = '';

var scriptProperties = PropertiesService.getScriptProperties();
var lastUpdatedDate = scriptProperties.getProperty('lastUpdatedDate');

function updateAllFiles() {
  Logger.log("Update Threshold: " + lastUpdatedDate);
  var folders = DriveApp.getFoldersByName(TOPLEVELDIR);

  checkTextBoundry_(folders);
  sendResults(longStrings);
  scriptProperties.setProperty('lastUpdatedDate', Date());
}

function checkTextBoundry_(folders) {
  while (folders.hasNext()) {
    var folder = folders.next();
    var files = folder.getFiles();
    var subFolders = folder.getFolders();
    
    while(subFolders.hasNext()) {
      checkTextBoundry_(subFolders);
    }
    
    while (files.hasNext()) {
      var file = files.next();
      var fileLastUpdatedDate = file.getLastUpdated();
      
      if(Date.parse(fileLastUpdatedDate) > Date.parse(lastUpdatedDate)) {
        var ss = SpreadsheetApp.open(file).getSheets()[0];
        var fileName = ss.getParent().getName();
        var sheetRange = ss.getRange('2:2');
        
        longStrings[fileName] = 0;
        
        var translateColumn = getColumn_('Translated Text', sheetRange);
        var editedTextColumn = getColumn_('Edited Text', sheetRange);
        var translateRange = ss.getRange(translateColumn + '3:' + editedTextColumn);
        var values = translateRange.getValues();        
        var notes = translateRange.getNotes();
        
        //Logger.log("Checking " + fileName + ":" + file.getLastUpdated());
        
        found = false;
        
        for (var i in notes) { 
          for (var j in notes[i]) {
            if(notes[i][j]) {
              found = true;
              translateRange.clearNote()
              break;
            }
          }
          if(found) {
            break;
          }
        }
        
        for(var i=0; i<values.length; i++) {
          if(typeof values[i][3] == 'string' & values[i][3] !== '') {
            var lines = values[i][3].split("\n");
            var note = checkLength_(lines);
            
            if(note) {
              cellLoc = parseInt(i) + 3;
              var cell = ss.getRange(editedTextColumn + cellLoc);
              cell.setNote(note);
              Logger.log(note);
              longStrings[fileName] += 1;
            }
          } else if(typeof values[i][0] == 'string') {
            var lines = values[i][0].split("\n");
            var note = checkLength_(lines);
            
            if(note) {
              cellLoc = parseInt(i) + 3;
              var cell = ss.getRange(translateColumn + cellLoc);
              cell.setNote(note);
              Logger.log(note);
              longStrings[fileName] += 1;
            }
          }
        }     
      } else {
        //Logger.log("Skipping " + file.getName() + ":" + file.getLastUpdated());
      }
    }
  }
}

function checkLength_(tokens) {
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
    if(marker) {
      note = tokens[a].slice(0,marker) + "<--|-->" + tokens[a].slice(marker);
      
      return note;
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

function sendResults(data) {
  var fileCount = '';
  var totalCount = 0;
  
  Object.keys(data)
  .sort()
  .forEach(function(v, i) {
    var count = data[v];
    if(count) {
      fileCount += v + ":" + count + ", ";
      totalCount += count;
    }
  });
  
  if(fileCount == '') {
    body = "Next files needing string length editing: none!"
  } else {
    body = "Next files needing string length editing: " + fileCount;
  }
  
  if(body != getSlackTopic()) {
    updateSlackTopic(body);  
  }
  
  MailApp.sendEmail(EMAIL, SUBJECT + ": " + totalCount, body);
}

function updateSlackTopic(message) {
  var SLACK_PATH = "api/channels.setTopic";

  var payload = {
    "token" : SLACK_token,
    "channel" : SLACK_channel,
    "topic" : message
  };
  
  var options = {
    "method" : "post",
    "payload" : payload
  };
  
  UrlFetchApp.fetch(SLACK_URL + SLACK_PATH, options);
}

function getSlackTopic() {
  var SLACK_PATH = "api/channels.info";

  var payload = {
    "token" : SLACK_token,
    "channel" : SLACK_channel,
  };
  
  var options = {
    "method" : "post",
    "payload" : payload
  };
  
  var resp = UrlFetchApp.fetch(SLACK_URL + SLACK_PATH, options);
  var data = JSON.parse(resp);
 
  return data.channel.latest.topic;
}
