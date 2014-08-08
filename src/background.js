// Show page action icon when polymer-ready event is received.
chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action === 'show-page-action') {
    chrome.pageAction.show(sender.tab.id);
  }
  // Sync visit each time a polymer website is visited.
  var visit = {};
  visit[sender.url] = (new Date()).toString();
  chrome.storage.sync.set(visit);
});
