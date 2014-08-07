chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == 'polymer-ready') {
    chrome.pageAction.show(sender.tab.id);
  }
});
