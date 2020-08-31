"use strict";

var pfLoadAlgoCalled = false;

window.addEventListener('message', function(event) {
  if (event.data) {
    if (event.data.type === 'PfLoadAlgo' && !pfLoadAlgoCalled) {
      pfLoadAlgoCalled = true
      var payload = event.data.payload;
      var pfData = payload.pfData;
      var urls = pfData.config.urls;

      helper.loadScript(urls.js.jquery);
      helper.loadScript(urls.js.raven);
      helper.loadScript(urls.js.algo, function() {
        window.postMessage({type: 'PfStartAlgo', payload: payload}, '*');
      });

      helper.loadCss(urls.css.content, 'screen,print');
      if (pfData.userSettings.customCSSURL) {
        helper.loadCss(pfData.userSettings.customCSSURL, 'screen,print');
      }
    }
  }
});

window.onload = function() {
  window.parent.postMessage({type: 'PfExtensionAlgoLoaded'}, '*');
}