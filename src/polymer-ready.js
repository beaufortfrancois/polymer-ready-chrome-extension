var customElements;
var originalOutline;

window.addEventListener('polymer-ready', function(event) {
  chrome.runtime.sendMessage({ action: 'polymer-ready' });
});

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
  
    if (msg.action === 'get-custom-elements') {
      customElements = Array.prototype.slice.call(document.all).filter(function(element) {
        return element.localName.indexOf('-') != -1 || element.getAttribute('is');
      });
      
      originalOutline = [];
      customElements.forEach(function(element, i) {
        originalOutline[i] = element.style.outline;
      });
  
      var customElementsNames = customElements.map(function(el) { return el.localName }).sort().filter(function(el,i,a) { return i==a.indexOf(el); });
      port.postMessage({ customElements: customElementsNames });
    } else if (msg.action === 'show-custom-elements') {
      customElements.filter(function(el) { return el.localName === msg.filter }).forEach(function(element) {
        element.style.setProperty('outline', '1px dashed #3e50b4');
      });
    } else if (msg.action === 'hide-custom-elements') {
      customElements.forEach(function(element, i) {
        element.style.outline = originalOutline[i];
      });
    }
  });

});
