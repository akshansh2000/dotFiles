if (document && document.body){
    document.body.addEventListener("click", function(event) {
        try {
            if(event.target.href) {
                chrome.runtime.sendMessage({href: event.target.href}, () => {
                    if (chrome.runtime.lastError) {
                    //  nothing
                }
            })
            }
        }
        catch(e){
        }
    });

    document.body.addEventListener('contextmenu', function(event) {
        try {
            if(event.target.href) {
                chrome.runtime.sendMessage({ahref: event.target.href}, () => {
                    if (chrome.runtime.lastError) {
                    //  nothing
                }
            });
                return false;
            }
        }
        catch(e) {
        }
    }, false);

    document.body.addEventListener("auxclick", (event) => {
        try {
            if(event.target.href) {
        chrome.runtime.sendMessage({ahref: event.target.href}, (response) => {
            if (chrome.runtime.lastError) {
            //  nothing
        }
    });
    }
}
catch(e) {
    }
});
}

