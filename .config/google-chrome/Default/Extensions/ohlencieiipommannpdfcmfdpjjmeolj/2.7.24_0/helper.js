"use strict";

window.helper = {
  loadScript: function (url, callback) {
    var script = document.createElement('script');

    script.type = 'text/javascript';
    script.src = url;
    script.async = false;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    var head = document.getElementsByTagName('head')[0];
    head.appendChild(script);
  },

  loadCss: function(url, media) {
    // Adding the script tag to the head as suggested before
    var link  = document.createElement('link');

    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    link.media = media;

    var head = document.getElementsByTagName('head')[0];
    head.appendChild(link);
  }
};
