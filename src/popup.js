function navigateToWebsite(event) {
  chrome.tabs.create({ url: event.target.dataset['website'] });
}

function showCustomElements(event) {
  port.postMessage({ action: 'show-custom-elements', filter: event.target.textContent });
}

function hideCustomElements(event) {
  port.postMessage({ action: 'hide-custom-elements' });
}

function addWebsiteToElement(element, website) {
  element.classList.add('website');
  element.querySelector('span').dataset['website'] = website;
  // TODO: Check no listener first.
  element.addEventListener('click', navigateToWebsite);
}

function probeBowerComponents(elements) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://bower-component-list.herokuapp.com');
  xhr.responseType = 'json';
  xhr.onload = function() {
    for (var i = 0; i < elements.length; i++) {
      var results = xhr.response.filter(function(el) {
        return el.name === elements[i].textContent && 
               el.keywords && el.keywords.indexOf('polymer') !== -1;
      });
      if (results.length > 0) {
        addWebsiteToElement(elements[i], results[0].website);
      }
    }
  }
  xhr.send();
}

function probeGoogleWebComponents(elements) {
  elements = Array.prototype.slice.call(elements).filter(function(el) {
    return !el.textContent.indexOf('google-');
  });
  if (elements.length) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.github.com/users/GoogleWebComponents/repos');
    xhr.responseType = 'json';
    xhr.onload = function() {
      for (var i = 0; i < elements.length; i++) {
        var results = xhr.response.filter(function(el) {
          return el.name === elements[i].textContent;
        });
        if (results.length > 0) {
          addWebsiteToElement(elements[i], results[0].html_url);
        }
      }
    }
    xhr.send();
  }
}

function probePolymerComponents(elements) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://api.github.com/users/Polymer/repos');
  xhr.responseType = 'json';
  xhr.onload = function() {
    for (var i = 0; i < elements.length; i++) {
      var results = xhr.response.filter(function(el) {
        return el.name === elements[i].textContent;
      });
      if (results.length > 0) {
        addWebsiteToElement(elements[i], results[0].html_url);
      }
    }
  }
  xhr.send();
  
}


var port;

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    port = chrome.tabs.connect(tabs[0].id);
    port.postMessage({ action: 'get-custom-elements' });
  
    port.onMessage.addListener(function(response) {
      response.customElements.forEach(function(el) {
        var text = document.createElement('span');
        text.textContent = el;
        var element = document.createElement('div');
        element.classList.add('el');
        element.appendChild(text);
        element.addEventListener('mouseenter', showCustomElements);
        element.addEventListener('mouseleave', hideCustomElements);
        document.body.appendChild(element);
      });
    
      var elements = document.querySelectorAll('.el');
      probeBowerComponents(elements);
      probeGoogleWebComponents(elements);
      probePolymerComponents(elements);
    });
  });
});
