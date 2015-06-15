function showCustomElements(event) {
  port.postMessage({ action: 'show-custom-elements', filter: event.target.textContent });
}

function hideCustomElements(event) {
  port.postMessage({ action: 'hide-custom-elements' });
}

function parseLinkHeader(header) {
  if (!header) {
    return;
  }
  var parts = header.split(',');
  var links = {};
  for (i=0; i < parts.length; i++) {
    var section = parts[i].split(';');
    var url = section[0].replace(/<|>/g, '').trim();
    var name = section[1].replace(/rel="(.*)"/, '$1').trim();
    links[name] = url;
  }
  return links;
}

function probeCustomElements(elements) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://customelementsio.herokuapp.com/');
  xhr.onload = function() {
    var prefix = 'var customElements = ';
    if (!xhr.response.startsWith(prefix))
      return;
    try {
      var customElements = JSON.parse(xhr.response.substr(prefix.length));
    } catch(e) {
      return;
    }
    for (var i = 0; i < elements.length; i++) {
      var results = customElements.filter(function(el) {
        return el.name === elements[i].textContent;
      });
      if (results.length > 0) {
        elements[i].querySelector('a').href = results[0].url;
      }
    }
  }
  xhr.send();
}

function probeGooglePolymerElements(elements) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://elements.polymer-project.org/catalog.json');
  xhr.responseType = 'json';
  xhr.onload = function() {
    for (var i = 0; i < elements.length; i++) {
      var results = xhr.response.elements.filter(function(el) {
        return el.name === elements[i].textContent;
      });
      if (results.length > 0) {
        elements[i].querySelector('a').href = 'https://github.com/' + results[0].source;
      }
    }
  }
  xhr.send();
}

var port;

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  port = chrome.tabs.connect(tabs[0].id);
  // Send a message to polymer-ready.js to get all custom elements.
  port.postMessage({ action: 'get-custom-elements' });

  port.onMessage.addListener(function(response) {
    var existingElements = document.querySelectorAll('.el');
    var addSeparator = (existingElements.length !== 0);

    response.customElements.forEach(function(el) {
      if (addSeparator) {
        document.body.appendChild(document.createElement('hr'));
        addSeparator = false;
      }
      var anchor = document.createElement('a');
      anchor.target= '_blank';
      anchor.textContent = el;
      anchor.addEventListener('click', hideCustomElements);
      var element = document.createElement('div');
      element.classList.add('el');
      element.appendChild(anchor);
      element.addEventListener('mouseenter', showCustomElements);
      element.addEventListener('mouseleave', hideCustomElements);
      document.body.appendChild(element);
    });

    var elements = document.querySelectorAll('.el');
    probeCustomElements(elements);
    probeGooglePolymerElements(elements);
  });
});
