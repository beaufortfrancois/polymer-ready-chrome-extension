var customElements, originalOutline;

window.addEventListener('polymer-ready', showPageAction);
window.addEventListener('WebComponentsReady', showPageAction);

/* Backup for websites that don't trigger WebComponentsReady manually.
 * https://github.com/beaufortfrancois/polymer-ready-chrome-extension/issues/13#issuecomment-235654565
 */
document.addEventListener('dom-change', function onDomChange() {
  document.removeEventListener('dom-change', onDomChange);
  showPageAction();
});

function showPageAction() {
  // Send message to background.js when WebComponentsReady or polymer-ready is fired.
  chrome.runtime.sendMessage({ action: 'show-page-action' });
};

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
        // Save original outline styles for each custom elements.
        originalOutline = [];
        customElements.forEach(function(el, i) {
          originalOutline[i] = el.style.outline;
        });
        // Send unique sorted custom elements localName to popup.js.
        var customElementsNames = customElements.map(function(el) { return el.localName }).sort().filter(function(el,i,a) { return i==a.indexOf(el); });
        port.postMessage({ customElements: customElementsNames });
        break;

      case 'show-custom-elements':
        customElements.filter(function(el) { return el.localName === msg.filter }).forEach(function(element) {
          element.style.setProperty('outline', '1px dashed #3e50b4');
        });
        break;

      case 'hide-custom-elements':
        customElements.forEach(function(element, i) {
          if (msg.pinned.indexOf(element.localName) == -1) {
            element.style.outline = originalOutline[i];
          }
        });
        break;
    }
  });
});
