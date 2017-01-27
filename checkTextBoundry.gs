// stringLength.gs: This is used to email/slack message if strings contained within our various text files will fit on screen
//
// We use the scriptProperties() service to set/check the last updated time, file state, number of errors.
//
// ex. property:stone93 value:"Thu Jan 26 2017 14:02:21 GMT-0600 (CST),true,7"
// 
// where value is a triplet of last file update, dirty state, and amount of errors
//
// dirty state could be:
// 'unknown' - We've never processed this file
// 'false' - File was processed previously and was clean
// 'true' - File was processsed previously and was dirty
//
// All files are checked if they've been updated since the script last ran and their states are correspondingly updated

var DIRS = [];
var FONT_DELIM_FILE_URL = 'http://flyingclimber.net/ninokunids/font12.json';
var FONT_DELIM = loadDelimFile_();
var MAX = 223;
var longStrings = [];
var EMAIL = '';
var SUBJECT = "NiNoKuniDS String Length";
var filesChecked = 0;

var SLACK_WEBHOOK = '';
var SLACK_CHANNEL = '';
var SLACK_BOTNAME = '';
var SLACK_BOTEMOJI = '';

var scriptProperties = PropertiesService.getScriptProperties();
var lastUpdatedDate = scriptProperties.getProperty('lastRunDate');


// Spreadsheet Logic //
function updateAllFiles() {
  Logger.log("Update Threshold: " + lastUpdatedDate);
  var folders = [];
  
  DIRS.forEach(function(e) {
    folders.push(DriveApp.getFoldersByName(e));
  });
      
  folders.forEach(function(e) {
    checkTextBoundry_(e);
  });
  
  sendResults(longStrings);
  scriptProperties.setProperty('lastRunDate', Date());
}

function deleteAllProperties() {
  scriptProperties.deleteAllProperties();
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
      var fileName = file.getName();
      Logger.log("Reviewing .. " + fileName);
      filesChecked++;
      Logger.log(filesChecked);
      
      var fileLastUpdatedDate = file.getLastUpdated();
      var lastUpdatedDate = scriptProperties.getProperty('lastRunDate');
      var fileProperty = scriptProperties.getProperty(fileName);
      
      if(!fileProperty) {
         scriptProperties.setProperty(fileName, fileLastUpdatedDate + ",unknown,0")
         fileProperty = scriptProperties.getProperty(fileName) 
      }
      
      fileProperty = fileProperty.split(",");
      
      if(fileProperty[1] == 'true' || fileProperty[1] == 'unknown' || Date.parse(fileLastUpdatedDate) > Date.parse(lastUpdatedDate)) {
        var ss = SpreadsheetApp.open(file).getSheets()[0];
        var sheetRange = ss.getRange('2:2');
        
        longStrings[fileName] = 0;
        
        var translateColumn = getColumn_('Translated Text', sheetRange);
        var editedTextColumn = getColumn_('Edited Text', sheetRange);
        var translateRange = ss.getRange(translateColumn + '3:' + editedTextColumn);

        clearTranslateRange(translateRange);
        
        Logger.log("Checking " + fileName + ":" + fileLastUpdatedDate);
        
        var values = translateRange.getValues();        
        var dirty = false;
        
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
              dirty = true
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
              dirty = true
            }
          }
        }
        
        scriptProperties.setProperty(fileName, fileLastUpdatedDate + "," + dirty + "," + longStrings[fileName]);
        
      } else {
        Logger.log("Skipping " + fileName + ":" + fileLastUpdatedDate);
      }
    }
  }
}

function clearTranslateRange(translateRange) {
  var notes = translateRange.getNotes();
  var found = false;
        
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

// End of Spreadsheet Logic //

// Remote calls //
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
    body = "Needs string length editing: none!"
  } else {
    body = "Needs string length editing: " + fileCount;
  }

  if(scriptProperties.getProperty('lastMessage') != body) {
    sendSlackMessage(body);    
    MailApp.sendEmail(EMAIL, SUBJECT + ": " + totalCount, body);
    scriptProperties.setProperty('lastMessage', body);
  }
}

function sendSlackMessage(message) {
  var payload = JSON.stringify(
    {
      'channel': SLACK_CHANNEL,
      'username': SLACK_BOTNAME,
      'icon_emoji': SLACK_BOTEMOJI, 
      'text' : message,
    }
  );
  
  var options = {
    "method" : "post",
    "payload" : payload
  };
    
  UrlFetchApp.fetch(SLACK_WEBHOOK, options);
}

// End of remote calls //
