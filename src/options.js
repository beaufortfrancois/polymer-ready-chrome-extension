function showVisits() {
  var container = document.querySelector('#visits');
  container.innerHTML = '';

  chrome.storage.sync.get(null, function(results) {
    keys = Object.keys(results).sort(function(a,b){
        return (new Date(results[b]) - new Date(results[a]));
    });
    for (var i=0; i < keys.length; i++) {
      var visit = document.createElement('div');
      var website = document.createElement('a');
      website.href = keys[i];
      website.textContent = keys[i];
      visit.appendChild(website);
      var thumb = new Image();
      thumb.src = 'https://domains.google.com/thumb?u=' + website;
      visit.appendChild(thumb);
      container.appendChild(visit);
    }
  });
}

chrome.storage.onChanged.addListener(showVisits);

showVisits();
