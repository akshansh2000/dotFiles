"use strict";

var pfLoadCoreCalled = false;

window.addEventListener('message', function(event) {
  if (event.data) {
    if (event.data.type === 'PfLoadCore' && !pfLoadCoreCalled) {
      pfLoadCoreCalled = true;
      var payload = event.data.payload;
      var pfData = payload.pfData;
      var urls = pfData.config.urls;

      helper.loadScript(urls.js.jquery);
      helper.loadScript(urls.js.raven);
      helper.loadScript(urls.js.core, function() {
        window.postMessage({type: 'PfStartCore', payload: payload}, '*');
      });
      helper.loadCss(urls.css.pfApp, 'screen');
    }
  }
});

window.onload = function() {
  window.parent.postMessage({type: 'PfExtensionCoreLoaded'}, '*');
}