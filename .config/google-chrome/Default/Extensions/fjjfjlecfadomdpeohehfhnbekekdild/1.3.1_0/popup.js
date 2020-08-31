  // popup script
  window.addEventListener('load', (event) => {
    chrome.tabs.executeScript(null, {
      file: 'content.js',
    });
  });
  chrome.runtime.sendMessage({clicked : true});