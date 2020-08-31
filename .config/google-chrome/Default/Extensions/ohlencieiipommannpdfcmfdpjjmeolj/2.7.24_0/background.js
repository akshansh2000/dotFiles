environment = 'production';

function start(tab) {
  var initCode;

  if (environment === 'development') {
    initCode = ["var extensionPath = '" + chrome.extension.getURL("/").replace(/\/$/, "") + "';",
                "(function() {",
                "  pfstyle = 'lbk';",
                "  pfMod = false;",
                "  var host = 'https://v.printfriendly.com';",
                "  pfOptions = {",
                "    hosts: {",
                "      cdn: host,",
                "      pdf: host,",
                "      pf: host,",
                "      ds: host,",
                "      email: host",
                "    },",
                "    environment: 'development'",
                "  };",
                "})();"].join('\n');

  } else {
    initCode = ["var extensionPath = '" + chrome.extension.getURL("/").replace(/\/$/, "") + "';",
                "var pfstyle = 'cbk';"].join('\n');

  }

  chrome.tabs.executeScript(tab.id, {
    code: initCode
  }, function() {
    chrome.tabs.executeScript(tab.id, { file: '/assets/printfriendly.js'});
  });
}

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  start(tab);
});

document.addEventListener('DOMContentLoaded', function () {
  var currentIcon = localStorage["pf_icon"];
  if (currentIcon) {
    chrome.browserAction.setIcon({
      path: "images/" + currentIcon + ".png"
    });
  }
});

chrome.contextMenus.create({
  id: "printfriendly",
  title: "Print Friendly and PDF",
  contexts: ["page"]
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "printfriendly")
    start(tab);
  }
);
