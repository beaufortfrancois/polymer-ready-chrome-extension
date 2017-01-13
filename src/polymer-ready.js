var customElements, originalOutline, originalBackgroundColor;

window.addEventListener('polymer-ready', showPageAction);
window.addEventListener('WebComponentsReady', showPageAction);

/* Backup for websites that don't trigger WebComponentsReady manually.
 * https://github.com/beaufortfrancois/polymer-ready-chrome-extension/issues/13#issuecomment-235654565
 */
document.addEventListener('dom-change', showPageAction, { once:  true });

function showPageAction() {
  // Send message to background.js when WebComponentsReady or polymer-ready is fired.
  chrome.runtime.sendMessage({ action: 'show-page-action' });
}

chrome.runtime.onConnect.addListener(port => {
  let allCustomElements = [];

  function isCustomElement(el) {
    const isAttr = el.getAttribute('is');
    return el.localName.includes('-') || isAttr && isAttr.includes('-');
  }

  function findAllCustomElements(nodes) {
    nodes.forEach(node => {
      if (isCustomElement(node)) {
        allCustomElements.push(node);
      }
      if (node.shadowRoot) {
        findAllCustomElements(node.shadowRoot.querySelectorAll('*'));
      }
    });
  }

  port.onMessage.addListener(msg => {
    switch(msg.action) {

      case 'get-custom-elements':
        // Get all custom elements.
        findAllCustomElements(document.querySelectorAll('*'));
        if (allCustomElements.length === 0) {
          return;
        }

        // Save original styles for each custom elements.
        originalOutline = [];
        originalBackgroundColor = [];
        allCustomElements.forEach((el, i) => {
          originalOutline[i] = el.style.outline;
          originalBackgroundColor[i] = el.style.backgroundColor;
        });
        // Send unique sorted custom elements localName to popup.js.
        const customElementsNames = allCustomElements.map(el => el.localName)
            .sort().filter((el, i, a) => i === a.indexOf(el));
        port.postMessage({ customElements: customElementsNames });
        break;

      case 'show-custom-elements':
        allCustomElements.filter(element => element.localName === msg.filter)
          .forEach(element => {
            element.style.setProperty('outline', '1px dashed #3e50b4');
            element.style.setProperty('background-color', 'rgba(255,0,0,0.1)');
          });
        break;

      case 'hide-custom-elements':
        allCustomElements.forEach((element, i) => {
          if (msg.pinned.indexOf(element.localName) == -1) {
            element.style.setProperty('outline', originalOutline[i]);
            element.style.setProperty('background-color', originalBackgroundColor[i]);
          }
        });
        break;
    }
  });
});
