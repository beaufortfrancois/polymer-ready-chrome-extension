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
  if (element.classList.contains('website') {
    return;
  }
  element.classList.add('website');
  element.querySelector('span').dataset['website'] = website;
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

function probeGitHub(username, elements, nextUrl) {
  var xhr = new XMLHttpRequest();
  var url = nextUrl || ('https://api.github.com/users/' + username + '/repos');
  xhr.open('GET', url);
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
    var linkHeader = parseLinkHeader(xhr.getResponseHeader('link'));
    if (linkHeader && linkHeader.next) {
      probeGitHub(username, elements, linkHeader.next);
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
      var existingElements = document.querySelectorAll('.el');

      response.customElements.forEach(function(el) {
        for (var i=0; i < existingElements.length; i++) {
          if (existingElements[i].textContent === el) {
            return;
          }
        };
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
      googleElements = Array.prototype.slice.call(elements).filter(function(el) {
        return !el.textContent.indexOf('google-');
      });
      if (googleElements.length) {
        probeGitHub('GoogleWebComponents', googleElements);
      }
      probeGitHub('Polymer', elements);
    });
  });
});
