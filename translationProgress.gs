var planFileName= '';
var scriptProperties = PropertiesService.getScriptProperties();
var currentSprint = [];
var nextSprint = [];

function main() {
  var file = DriveApp.getFilesByName(planFileName);
  var ss = SpreadsheetApp.open(file.next());
  var sheet = ss.getSheets()[0];
  
  var totalRange = sheet.getRange("A3:D3");
  var totalValues = totalRange.getValues();
  
  var chapterRange = sheet.getRange("A7:D32");
  var chapterValues = chapterRange.getValues();
    
  var counts = scriptProperties.getProperty('counts');
  
  if(!counts) {
    counts = '';
  }
  
  for(var i in chapterValues) {
    var chapterName = chapterValues[i][0];
    var chapterPercentage = Math.round(chapterValues[i][2] * 100) / 100;
    var chapterSheet = ss.getSheetByName(chapterName);
    var chapterSheetRange = chapterSheet.getRange("L3:O" + chapterSheet.getLastRow());
    var chapterSheetRangeValues = chapterSheetRange.getValues();

    Logger.log(chapterName + " " + chapterPercentage * 100);
    
    for(var i in chapterSheetRangeValues) {
      var translationComplete = chapterSheetRangeValues[i][3];
      var filePath = chapterSheetRangeValues[i][0];
      
      var fileNameSplit = filePath.split("\\");
      var fileName = fileNameSplit[fileNameSplit.length - 1];
      
      var totalTranslated = chapterSheetRangeValues[i][2]
      var totalLines = chapterSheetRangeValues[i][1]
      
      if(translationComplete != 'Y') {
        Logger.log(
          fileName + " "  +
          Math.round(totalTranslated / totalLines * 100) / 100);
      }
    }
    
    counts[chapterName] = chapterPercentage;
    }
  
  scriptProperties.setProperty('counts', counts);    
}
      
