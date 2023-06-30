chrome.action.onClicked.addListener(function() {
  chrome.tabs.create({'url': chrome.extension.getURL('notes.html')}, function(tab){})
});