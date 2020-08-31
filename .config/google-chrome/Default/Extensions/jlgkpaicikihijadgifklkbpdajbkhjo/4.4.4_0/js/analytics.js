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
/******/ 	return __webpack_require__(__webpack_require__.s = 101);
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

/***/ 101:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(17);


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

/***/ })

/******/ });