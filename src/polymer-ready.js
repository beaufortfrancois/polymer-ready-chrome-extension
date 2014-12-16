var customElements;
var removeOverlays = function() {
  var overlays = document.querySelectorAll('.polymer-ready-overlay');
  [].forEach.call(overlays, function(el) {
    document.body.removeChild(el);
  });
};

window.addEventListener('polymer-ready', function(event) {
  // Send message to background.js when polymer-ready is fired.
  chrome.runtime.sendMessage({ action: 'show-page-action' });
});

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    switch(msg.action) {
      case 'get-custom-elements':
        // Get all custom elements.
        customElements = Array.prototype.slice.call(document.querySelectorAll('* /deep/ *')).filter(function(element) {
          return element.localName.indexOf('-') != -1 || element.getAttribute('is');
        });
        if (customElements.length === 0) {
          return;
        }
        // Send unique sorted custom elements localName to popup.js.
        var customElementsNames = customElements.map(function(el) { return el.localName }).sort().filter(function(el,i,a) { return i==a.indexOf(el); });
        port.postMessage({ customElements: customElementsNames });
        break;

      case 'show-custom-elements':
        customElements.filter(function(el) { return el.localName === msg.filter }).forEach(function(element) {
          var overlay = document.createElement('div');
          var rect = element.getBoundingClientRect();
          var bodyRect = document.body.getBoundingClientRect();
          var offset = { top: rect.top - bodyRect.top, left: rect.left - bodyRect.left };
          overlay.setAttribute('class', 'polymer-ready-overlay');
          overlay.style.cssText = "position: absolute; "
                                + "top: " + offset.top + "px; "
                                + "left: " + offset.left + "px; "
                                + "width: " + rect.width + "px; "
                                + "height: " + rect.height + "px; "
                                + "background: rgba(255, 64, 129, 0.5); "
                                + "z-index: 2147483647";
          document.body.appendChild(overlay);
        });
        break;

      case 'hide-custom-elements':
        removeOverlays();
        break;
    }
  });
  port.onDisconnect.addListener(function() {
    removeOverlays();
  });
});
