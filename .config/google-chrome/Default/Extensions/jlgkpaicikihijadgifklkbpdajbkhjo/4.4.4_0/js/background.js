/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 106);
/******/ })
/************************************************************************/
/******/ ({

/***/ 1:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
var getCurrentTabUrl = function getCurrentTabUrl(callback) {
    chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs) {
        callback(tabs);
    });
};

var gesturesLookup = {
    G_back: "left",
    G_go: "right",
    G_up: "up",
    G_down: "down",
    G_close: "down-right",
    G_reclosedtab: "left-up",
    G_bottom: "right-down",
    G_top: "right-up",
    G_reload: "up-down",
    G_reloadclear: "up-down-up",
    G_lefttab: "up-left",
    G_righttab: "up-right",
    G_newwindow: "down-right-up",
    G_closewindow: "up-right-down",
    G_crxsettings: "right-down-left-up"
};

var gesturesDirectionLookup = {
    L: "left",
    R: "right",
    U: "up",
    D: "down",
    DR: "down-right",
    LU: "left-up",
    RD: "right-down",
    RU: "right-up",
    UD: "up-down",
    UDU: "up-down-up",
    UL: "up-left",
    UR: "up-right",
    DRU: "down-right-up",
    URD: "up-right-down",
    RDLU: "right-down-left-up",
    DUDU: "down-up-down-up",
    ULR: "up-left-right",
    LDLU: "left-down-left-up",
    LD: "left-down",
    URDL: "up-right-down-left",
    URU: "up-right-up",
    LR: "left-right",
    RLU: "right-left-up",
    URUR: "up-right-up-right",
    DUD: "down-up-down"
};

var allowedActionsPopup = {
    optgrpapp: ["G_bookmark", "G_BmManager"],
    optgrpcopy: ["G_copyurl"],
    optgrpload: ["G_reclosedtab", "G_reload", "G_reloadall", "G_reloadclear", "G_close", "G_closelefttabs", "G_closerighttabs", "G_closeothers", "G_newtab"],
    optgrpnav: ["G_back", "G_go"],
    optgrpother: ["G_crxsettings"],
    optgrpscroll: ["G_up", "G_down", "G_bottom", "G_top"],
    optgrptabnav: ["G_lefttab", "G_righttab"],
    optgrpwindow: ["G_closewindow", "G_closewindows", "G_newwindow", "G_incognito"]

};

var openNewTab = function openNewTab(url) {
    chrome.tabs.create({ url: url, active: true }, function () {});
};

var getDomain = function getDomain(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.hostname.length > 25 ? a.hostname.substring(0, 25) + '...' : a.hostname;
};

var sleep = function sleep(ms, task) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(task());
        }, ms);
    });
};

var getExtensionVersion = function getExtensionVersion() {
    try {
        return chrome.runtime.getManifest().version;
    } catch (e) {
        return 'undefined';
    }
};

var openOnboarding = function openOnboarding() {
    var showOnboarding = localStorage.getItem('autoShowOnboarding');
    if (showOnboarding === null) {
        openNewTab('https://crxmouse.com/the-mouse-chase-1');
        localStorage.setItem('autoShowOnboarding', 'true');
    }
};

var injectRateUsOverlayScript = function injectRateUsOverlayScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var activeTabId = tabs[0].id;
        chrome.tabs.executeScript(activeTabId, {
            file: 'js/rateus.js'
        });
    });
};

var injectMakeASelectionOverlayScript = function injectMakeASelectionOverlayScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
            var activeTabId = tabs[0].id;
            if (!tabs[0].url.startsWith('chrome-extension://')) {
                chrome.tabs.executeScript(activeTabId, {
                    file: 'js/optedoutOverlay.js'
                });
            }
        }
    });
};

exports.getCurrentTabUrl = getCurrentTabUrl;
exports.gesturesLookup = gesturesLookup;
exports.gesturesDirectionLookup = gesturesDirectionLookup;
exports.allowedActionsPopup = allowedActionsPopup;
exports.openNewTab = openNewTab;
exports.getDomain = getDomain;
exports.sleep = sleep;
exports.getExtensionVersion = getExtensionVersion;
exports.openOnboarding = openOnboarding;
exports.injectRateUsOverlayScript = injectRateUsOverlayScript;
exports.injectMakeASelectionOverlayScript = injectMakeASelectionOverlayScript;

/***/ }),

/***/ 106:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(107);


/***/ }),

/***/ 107:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _analytics = __webpack_require__(17);

var _analytics2 = _interopRequireDefault(_analytics);

var _defaultConfig = __webpack_require__(54);

var _defaultConfig2 = _interopRequireDefault(_defaultConfig);

var _migration = __webpack_require__(108);

var _constants = __webpack_require__(4);

var _contextMenu = __webpack_require__(109);

var _utils = __webpack_require__(1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.config = {};
window.isRocker = false;

var isDailyTrackingWasSet = false;
window.closedTabs = {};
window.closedTabsId = [];
var lastTabs = {};
var lastTabsId = [];
window.lastActiveTabUrl = null;

var openOptions = function openOptions() {
    var t = chrome.tabs;
    t.query({ url: "chrome-extension://" + chrome.runtime.id + "/options.html" }, function (tabs) {
        if (tabs && tabs.length !== 0) {
            t.update(tabs[0].id, { active: true });
        } else {
            t.create({ url: "options.html" });
        }
    });
};

chrome.storage.sync.get("optedout", function (obj) {
    chrome.browserAction.setIcon({
        path: !obj["optedout"] ? "icon.png" : "icond.png"
    });
});

if (!localStorage.getItem("config")) {
   
    config = JSON.parse(JSON.stringify(_defaultConfig2.default));
    localStorage.setItem("config", JSON.stringify(_defaultConfig2.default));
} else {
   
    config = JSON.parse(localStorage.getItem("config"));
}

config.extid = chrome.runtime.id ? chrome.runtime.id : "none";


if (!localStorage.getItem("cmfirst") || JSON.parse(localStorage.getItem("openoptspage"))) {
    chrome.windows.getAll({ populate: true }, function (windows) {
        for (var i = 0; i < windows.length; i++) {
            for (var ii = 0; ii < windows[i].tabs.length; ii++) {
                try {
                    if (windows[i]) {
                        if (windows[i].tabs[ii].url.indexOf('chrome://') == -1) {
                            chrome.tabs.executeScript(windows[i].tabs[ii].id, {
                                file: "js/jquery-3.3.1.min.js",
                                allFrames: true,
                                runAt: "document_start"
                            }, function () {
                                if (windows[i]) {
                                    chrome.tabs.executeScript(windows[i].tabs[ii].id, {
                                        file: "js/event.js",
                                        allFrames: true,
                                        runAt: "document_start"
                                    });
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        }
    });

    localStorage.setItem("cmfirst", 1);
    localStorage.setItem("openoptspage", false);
}

if (!config.sync) {
   
   
    chrome.storage.sync.get(null, function (items) {
        if (!items.sync) {
           
            config = Object.assign(config, {
                optedout: true,
                sync: true
            });
           
            localStorage.setItem("config", JSON.stringify(config));
            chrome.storage.sync.set(config, function () {});
        } else {
           
            chrome.storage.sync.get(null, function (items) {
                localStorage.setItem("config", JSON.stringify(items));
                config = JSON.parse(localStorage.getItem("config"));
            });
        }
    });
} else if (config.sync == "local") {
   
    config.sync = true;
    chrome.storage.sync.set(config, function () {});
} else {
   
    chrome.storage.sync.get(null, function (items) {
        localStorage.setItem("config", JSON.stringify(items));
        config = JSON.parse(localStorage.getItem("config"));
    });
}

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    var firstSessionPage = chrome.extension.getURL('options.html?install=true');
    if (lastActiveTabUrl === firstSessionPage && config.optedout) {
        (0, _utils.openOnboarding)();
    }
    closedTabs["id" + tabId] = lastTabs["id" + tabId];
    closedTabsId.push(lastTabs["id" + tabId]);
    for (var id in lastTabsId) {
        if (lastTabsId[id].id == tabId) {}
    }
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    lastTabs["id" + tab.id] = tab;
    var _flag = true;
    for (var i = 0; i < lastTabsId.length; i++) {
        if (lastTabsId[i].id == tabId) {
            _flag = false;
            lastTabsId[i] = tab;
            break;
        }
    }
    if (_flag) {
        lastTabsId.push(tab);
    }
});
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        sessionStorage.setItem(_constants.storageKeys.FIRST_SESSION_AFTER_INSTALL, JSON.stringify(true));
        localStorage.setItem(_constants.storageKeys.UPDATE_NOTIFICATION, JSON.stringify(true));
        chrome.tabs.create({ url: "/options.html?install=true", active: true }, function () {});
        localStorage.setItem(_constants.storageKeys.INSTALLED_AT, new Date().getTime());
        _analytics2.default.gaAnalyticsEvent("Main KPIs", "Extension installed");
        if (!isDailyTrackingWasSet) {
            isDailyTrackingWasSet = true;
            _analytics2.default.setDailyUserTracking();
        }
    } else if (details.reason === "update") {
        if (localStorage.getItem(_constants.storageKeys.UPDATE_NOTIFICATION) === null) {
            localStorage.setItem(_constants.storageKeys.UPDATE_NOTIFICATION, JSON.stringify(false));
        }
        var installedAt = localStorage.getItem(_constants.storageKeys.INSTALLED_AT);
        if (isNaN(parseInt(installedAt))) {
           
            localStorage.setItem(_constants.storageKeys.INSTALLED_AT, "0");
        } else {
            if (!isDailyTrackingWasSet) {
                isDailyTrackingWasSet = true;
                _analytics2.default.setDailyUserTracking();
            }
        }
        if (localStorage.getItem("cmfirst")) {
           
            localStorage.showUpdatedInfo = 0;
            localStorage.cmfirst = 1;
        }
        (0, _migration.migrateState)(details, function () {});
    }
});

chrome.runtime.setUninstallURL("https://crxmouse.com/uninstall/?utm_source=" + (0, _utils.getExtensionVersion)());
if (!isDailyTrackingWasSet) {
    isDailyTrackingWasSet = true;
    _analytics2.default.setDailyUserTracking();
}

var onBoardingHandlers = function onBoardingHandlers() {
    var firstPage = 'the-mouse-chase-1';
    var secondPage = 'the-mouse-chase-2';
    chrome.tabs.onActivated.addListener(function (activeInfo) {
        chrome.tabs.get(activeInfo.tabId, function (tab) {
            var tabUrl = tab.pendingUrl || tab.url;
            if (lastActiveTabUrl !== null && lastActiveTabUrl.includes(secondPage) && tabUrl.includes(firstPage)) {
                chrome.tabs.sendMessage(tab.id, 'finishedThirdScreen');
            }
            lastActiveTabUrl = tabUrl;
        });
    });
};

_analytics2.default.setDailyActive();
(0, _contextMenu.addContextMenu)();
onBoardingHandlers();

/***/ }),

/***/ 108:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.migrateState = undefined;

var _storage = __webpack_require__(35);

var _defaultConfig = __webpack_require__(54);

var _defaultConfig2 = _interopRequireDefault(_defaultConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var migrateVersion = function migrateVersion(currentVersion) {

    (0, _storage.getState)(function (oldStore) {

        Object.keys(_defaultConfig2.default).forEach(function (key) {
            if (oldStore[key] === undefined) {
                oldStore[key] = _defaultConfig2.default[key];
                return;
            }
            Object.keys(_defaultConfig2.default[key]).forEach(function (innerKey) {
                if (oldStore[key][innerKey] === undefined) {
                    if (innerKey === 'clickedOptin') {
                        oldStore[key][innerKey] = !_defaultConfig2.default[key][innerKey];
                    } else {
                        oldStore[key][innerKey] = _defaultConfig2.default[key][innerKey];
                    }
                }
            });
        });
        oldStore.cfgver = currentVersion;

        (0, _storage.setState)(oldStore, function () {
            localStorage.setItem("config", JSON.stringify(oldStore));
            window.config = oldStore;
        });
    });
};

var migrateState = function migrateState(details) {

    var lastVersion = details.previousVersion;
    var currentVersion = chrome.runtime.getManifest().version;

    if (lastVersion === currentVersion) {
        return;
    }
    migrateVersion(currentVersion);
};

exports.migrateState = migrateState;

/***/ }),

/***/ 109:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
var addContextMenu = function addContextMenu() {
    chrome.contextMenus.removeAll(function () {
        chrome.contextMenus.create({
            id: "gestureDidntWork",
            title: "Gesture didn't work? Send report",
            onclick: function onclick() {
                chrome.tabs.create({
                    url: "https://docs.google.com/forms/d/e/1FAIpQLSf49UaayBAucv4zySkSIEwrfu2jLf2vo9uCm8NSuzSGO_OFtQ/viewform",
                    active: true
                });
            }
        });
    });
};

exports.addContextMenu = addContextMenu;

/***/ }),

/***/ 17:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _constants = __webpack_require__(4);

var _utils = __webpack_require__(1);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var analytics = function () {
    function analytics() {
        _classCallCheck(this, analytics);

       
        (function (i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r;
            i[r] = i[r] || function () {
                (i[r].q = i[r].q || []).push(arguments);
            }, i[r].l = 1 * new Date();
            a = s.createElement(o), m = s.getElementsByTagName(o)[0];
            a.async = 1;
            a.src = g;
            m.parentNode.insertBefore(a, m);
        })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

        ga('create', 'UA-45823005-3', 'auto');
        ga('set', 'checkProtocolTask', function () {});
        ga('set', 'dimension1', this.constructor.version);

       
       
        this.samplingData = [{ category: 'main kpis', action: 'gesture completed', sample: 100 }, { category: 'main kpis', sample: 1 }, { category: 'settings navigation', sample: 1 }, { category: 'general settings', sample: 1 }, { category: 'mouse gestures', sample: 1 }, { category: 'super drag', sample: 1 }, { category: 'scrolling', sample: 1 }, { category: 'wheel gesture', sample: 1 }, { category: 'rocker gesture', sample: 1 }, { category: 'advanced settings', sample: 1 }, { category: 'about', sample: 1 }, { category: 'general', sample: 1 }];
    }

    _createClass(analytics, [{
        key: 'sendEvent',
        value: function sendEvent(category, action, label, value) {
            ga('send', 'event', category, action, label, value);
        }
    }, {
        key: 'activeUserEvent',
        value: function activeUserEvent(type, timeSince) {
            this.sendEvent("Main KPIs", type + " Active user", timeSince || 'N/A');
        }
    }, {
        key: 'dailyActiveUserTracking',
        value: function dailyActiveUserTracking() {

            var userAge = parseInt(this.getUserAge());

            if (!userAge) {
               
                return;
            }

            localStorage.setItem("age", userAge);
            var lastAge = parseInt(localStorage.getItem("lastAge"));

            var timeSince = userAge - (lastAge || 0);
            localStorage.setItem("lastAge", userAge);

            if (userAge === 1 && !localStorage.getItem("D1")) {
                localStorage.setItem("D1", timeSince);
                this.activeUserEvent("D1", timeSince);
            } else if (userAge === 7 && !localStorage.getItem("D7")) {
                localStorage.setItem("D7", timeSince);
                this.activeUserEvent("D7", timeSince);
            } else if (userAge === 14 && !localStorage.getItem("D14")) {
                localStorage.setItem("D14", timeSince);
                this.activeUserEvent("D14", timeSince);
            } else if (userAge === 28 && !localStorage.getItem("D28")) {
                localStorage.setItem("D28", timeSince);
                this.activeUserEvent("D28", timeSince);
            } else if (userAge === 90 && !localStorage.getItem("D90")) {
                localStorage.setItem("D90", timeSince);
                this.activeUserEvent("D90", timeSince);
            }
        }
    }, {
        key: 'setDailyUserTracking',
        value: function setDailyUserTracking() {
            this.dailyActiveUserTracking();
            setInterval(this.dailyActiveUserTracking.bind(this), 1000 * 60 * 5);
        }
    }, {
        key: 'getUserAge',
        value: function getUserAge() {
            var installedAt = localStorage.getItem(_constants.storageKeys.INSTALLED_AT);
            if (!installedAt || parseInt(installedAt) === 0 || isNaN(installedAt)) {
                return null;
            } else {
                return Math.floor((new Date().getTime() - installedAt) / (1000 * 60 * 60 * 24));
            }
        }
    }, {
        key: 'gaAnalyticsEvent',
        value: function gaAnalyticsEvent(category, action, label, value) {

            if (!category) return;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.samplingData[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var event = _step.value;

                    if (event.category === category.toLowerCase() && (event.action && event.action === action.toLowerCase() || !event.action)) {
                        if (event.sample > 0 && Math.floor(event.sample * Math.random()) + 1 === 1) {
                            this.sendEvent(category, action, label, value);
                        }
                        return;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            this.sendEvent(category, action, label, value);
        }
    }, {
        key: 'sendDailyActive',
        value: function sendDailyActive() {
            var _this = this;

            var lastActiveDaySentEvent = localStorage.getItem('lastActiveDay');
            var now = new Date();
            var date = now.getDate() + '_' + now.getMonth() + '_' + now.getFullYear();
            if (lastActiveDaySentEvent && lastActiveDaySentEvent === date) {
                return;
            }
            chrome.storage.sync.get(function (settings) {
                var isOptedOut = settings.optedout;
                _this.sendEvent("Main KPIs", "Active user", !isOptedOut);
            });
            localStorage.setItem('lastActiveDay', date);
        }
    }, {
        key: 'setDailyActive',
        value: function setDailyActive() {
            var _this2 = this;

            var everyFiveMinutes = 1000 * 60 * 5;
            setInterval(function () {
                return _this2.sendDailyActive();
            }, everyFiveMinutes);
        }
    }], [{
        key: 'version',
        get: function get() {
            return (0, _utils.getExtensionVersion)();
        }
    }]);

    return analytics;
}();

exports.default = new analytics();

/***/ }),

/***/ 35:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };


var supportedKeys = ['cfgver', 'drag', 'gesture', 'others', 'scroll', 'scrollgesture', 'strokegesture', 'lastEditedGesture'];

var getState = function getState(cb) {
    chrome.storage.sync.get(function (state) {
        return cb(state);
    });
};

var setState = function setState(state, cb) {
    chrome.storage.sync.set(state, function () {
        localStorage.setItem("config", JSON.stringify(_extends({}, JSON.parse(localStorage.config), state)));
        if (cb) {
            cb();
        }
    });
};

var filterState = function filterState(state) {
    return Object.keys(state).filter(function (key) {
        return supportedKeys.includes(key);
    }).reduce(function (obj, key) {
        obj[key] = state[key];
        return obj;
    }, {});
};

var shouldSyncState = function shouldSyncState(currState, previousState) {
    return JSON.stringify(currState).localeCompare(JSON.stringify(previousState)) !== 0 ? true : false;
};

exports.getState = getState;
exports.setState = setState;
exports.filterState = filterState;
exports.shouldSyncState = shouldSyncState;

/***/ }),

/***/ 4:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
var URLS = {
    REPORT_BUG_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSd_kyu5sZBjw2bGVFEWAg5kxsIPtEQSwW5j3gvR6wAhBO_BjQ/viewform'
};

var storageKeys = {
    UPDATE_NOTIFICATION: 'sawUpdateNotification',
    INSTALLED_AT: 'installedAt',
    COMPLETED_GESTURES: 'completedGestures',
    FIRST_SESSION_AFTER_INSTALL: 'firstSessionAfterInstall'
};

var overlayViews = {
    none: 'none',
    RateUsOptions: 'RateUsOptions'
};

exports.URLS = URLS;
exports.storageKeys = storageKeys;
exports.overlayViews = overlayViews;

/***/ }),

/***/ 54:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    isGesturesOff: false,
    cfgver: 4.1,
    others: {
        tuilink: false
    },
    normal: {
        gesture: true,
        drag: true,
        scroll: false,
        scrollgesture: false,
        strokegesture: false,
        autocancel: false,
        autocancelvalue: 2,
        lasttab: false,
        scrolleffects: true,
        newtabposition: "chrome",
        minilength: 10,
        capturetype: "jpeg",
        jpegquality: 100,
        cancelcontextmenu: true,
        dbclicktime: 600,
        cursorimg: null,
        cursorimgscale: 1,
        hidetrash: false,
        clickedOptin: false
    },
    gesture: {
        gestureui: true,
        stroke: true,
        direct: true,
        tooltip: true,
        strokecolor: "4E1485",
        strokewidth: 5,
        strokeopa: 0.8,
        directcolor: "778899",
        directopa: 0.9,
        tooltipcolor: "120310",
        tooltipwidth: 18,
        tooltipopa: 0.9,
        geskey: "right",
        stenable: false,
        gholdkey: "none",
        gholdkeydisable: "alt",
        gholdkeytype: "enable",
        gesPos: "cc",
        gesture: [{
            direct: "L",
            action: "G_back",
            whitelist: []
        }, {
            direct: "R",
            action: "G_go",
            whitelist: []
        }, {
            direct: "U",
            action: "G_up",
            whitelist: []
        }, {
            direct: "D",
            action: "G_down",
            whitelist: []
        }, {
            direct: "DR",
            action: "G_close",
            moreCloseopts: "close",
            moreClosesel: "chrome",
            moreCloseurl: "chrome://newtab/",
            whitelist: []
        }, {
            direct: "LU",
            action: "G_reclosedtab",
            moreTarget: "newfront",
            morePosition: "chrome",
            morePinned: "unpinned",
            moreDes: chrome.i18n.getMessage("G_reclosedtab"),
            whitelist: []
        }, {
            direct: "RD",
            action: "G_bottom",
            whitelist: []
        }, {
            direct: "RU",
            action: "G_top",
            whitelist: []
        }, {
            direct: "UD",
            action: "G_reload",
            whitelist: []
        }, {
            direct: "UDU",
            action: "G_reloadclear",
            whitelist: []
        }, {
            direct: "UL",
            action: "G_lefttab",
            whitelist: []
        }, {
            direct: "UR",
            action: "G_righttab",
            whitelist: []
        }, {
            direct: "DRU",
            action: "G_newwindow",
            whitelist: []
        }, {
            direct: "URD",
            action: "G_closewindow",
            whitelist: []
        }, {
            direct: "RDLU",
            action: "G_crxsettings",
            moreDes: chrome.i18n.getMessage("G_crxsettings"),
            morePinned: "unpinned",
            morePosition: "chrome",
            moreTarget: "newfront",
            whitelist: []
        }]
    },
    drag: {
        dragui: true,
        dstroke: true,
        ddirect: true,
        dtooltip: true,
        dstrokecolor: "4E1485",
        dstrokewidth: 5,
        dstrokeopa: 0.8,
        ddirectcolor: "778899",
        ddirectopa: 0.9,
        dtooltipcolor: "120310",
        dtooltipwidth: 18,
        dtooltipopa: 0.9,
        dragtext: true,
        draglink: true,
        dragimage: true,
        draginput: false,
        setdragurl: true,
        imgfirstcheck: false,
        imgfirst: "none",
        dholdkey: "none",

        text: [{
            direct: "L",
            action: "T_search",
            moreDes: chrome.i18n.getMessage("valuetsearch") + "(" + chrome.i18n.getMessage("newback") + ")",
            morePinned: "unpinned",
            morePosition: "left",
            moreTarget: "newback",
            moreTsearch: "sgoogle"
        }, {
            direct: "R",
            action: "T_search",
            moreDes: chrome.i18n.getMessage("valuetsearch") + "(" + chrome.i18n.getMessage("newfront") + ")",
            morePinned: "unpinned",
            morePosition: "right",
            moreTarget: "newfront",
            moreTsearch: "sgoogle"
        }, {
            direct: "D",
            action: "T_copytext"
        }],
        link: [{
            direct: "L",
            action: "L_open",
            moreDes: chrome.i18n.getMessage("L_open") + "(" + chrome.i18n.getMessage("newback") + ")",
            morePinned: "unpinned",
            morePosition: "left",
            moreTarget: "newback"
        }, {
            direct: "R",
            action: "L_open",
            moreDes: chrome.i18n.getMessage("L_open") + "(" + chrome.i18n.getMessage("newfront") + ")",
            morePinned: "unpinned",
            morePosition: "right",
            moreTarget: "newfront"
        }, {
            direct: "D",
            action: "L_copytext"
        }, {
            direct: "U",
            action: "L_copyurl"
        }],
        image: [{
            direct: "L",
            action: "I_open",
            moreDes: chrome.i18n.getMessage("I_open") + "(" + chrome.i18n.getMessage("newback") + ")",
            morePinned: "unpinned",
            morePosition: "left",
            moreTarget: "newback"
        }, {
            direct: "R",
            action: "I_open",
            moreDes: chrome.i18n.getMessage("I_open") + "(" + chrome.i18n.getMessage("newfront") + ")",
            morePinned: "unpinned",
            morePosition: "right",
            moreTarget: "newfront"
        }, {
            direct: "D",
            action: "I_save"
        }]
    },
    scroll: {
        smooth: true,
        scrollspeed: 3,
        scrollaccele: 1
    },
    scrollgesture: {
        tablist: true,
        tablistkey: "right",
        tablistVisual: true,
        sgsleftenable: true,
        sgsrightenable: false,
        sgsleft: [{ action: "G_top" }, { action: "G_bottom" }],
        sgsright: [{ action: "G_top" }, { action: "G_bottom" }],
        fastSwitch: false,
        reverseFS: false

    },
    strokegesture: {
        strpress: "up",
        strleftenable: true,
        strleft: [{ action: "G_none" }, { action: "G_righttab" }],
        strmiddleenable: false,
        strmiddle: [{ action: "G_lefttab" }, { action: "G_righttab" }],
        strrightenable: true,
        strright: [{ action: "G_lefttab" }, { action: "G_none" }]
    }
};

/***/ })

/******/ });