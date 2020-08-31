chrome.runtime.onMessage.addListener(request => {
    let event = new CustomEvent(request);
    document.dispatchEvent(event);
});

document.addEventListener('getExtensionVersion', () => {
    let event = new CustomEvent('responseGetExtensionVersion', {
        detail: {
            version: chrome.runtime.getManifest().version
        }
    });
    document.dispatchEvent(event);
});

document.addEventListener('gaEventToExtension', (request) => {
    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: request.detail.category, gaAction: request.detail.action, gaLabel: request.detail.label || null, gaValue: request.detail.value || null});
});

document.addEventListener('playLaterOnboarding', (request) => {
    chrome.runtime.sendMessage({type: "showOnboardingLater"});
});

