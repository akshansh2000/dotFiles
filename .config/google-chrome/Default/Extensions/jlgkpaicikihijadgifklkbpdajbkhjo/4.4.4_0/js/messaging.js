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
/******/ 	return __webpack_require__(__webpack_require__.s = 102);
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

/***/ 102:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(103);


/***/ }),

/***/ 103:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _analytics = __webpack_require__(17);

var _analytics2 = _interopRequireDefault(_analytics);

var _actionFn = __webpack_require__(104);

var _actionFn2 = _interopRequireDefault(_actionFn);

var _constants = __webpack_require__(4);

var _utils = __webpack_require__(1);

var _onboardingReminderHandler = __webpack_require__(105);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    config = JSON.parse(localStorage.getItem("config"));
    if (sender.tab) {
        _actionFn2.default.curTab = sender.tab;
        chrome.windows.get(sender.tab.windowId, { populate: true }, function (window) {
            _actionFn2.default.curWindow = window;
        });
    }
    if (request.action === 'I_save' && request.direct === 'D' && request.selimg && request.selimg.includes('Princess_in_distress')) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var currentTab = tabs[0];
            chrome.tabs.sendMessage(currentTab.id, 'finishedDownloading');
        });
    }
    switch (request.type) {
        case "getTabData":
           
            sendResponse({ gestures: topDB.getDataPerTabId(request.tabid), isGesturesOff: config.isGesturesOff });
            break;
        case "count":
           
            chrome.storage.sync.get("optedout", function (obj) {
                if (!obj["optedout"]) {
                    var drawnNumber = Math.floor(Math.random() * 100) + 1;
                   
                    if (drawnNumber === 1) {
                        fetch("https://crxmouse.com/count.php", {
                            method: "POST",
                            body: JSON.stringify({
                                url: encodeURIComponent(request.data.url),
                                event: request.data.event,
                                action: request.data.action
                            })
                        });
                    }
                }
            });
            break;
        case "gesture":
        case "text":
        case "link":
        case "image":
            var _sentobj1;
            var _sentobj2 = request.type;
            if (_sentobj2 == "gesture") {
                _sentobj1 = "gesture";
            } else {
                _sentobj1 = "drag";
            }
            for (var i = 0; i < config[_sentobj1][_sentobj2].length; i++) {
                if (request.direct === config[_sentobj1][_sentobj2][i].direct) {
                    sendResponse(config[_sentobj1][_sentobj2][i]);
                    return;
                }
            }
            sendResponse(null);
            break;
        case "backToFn":
            _actionFn2.default.request = request;
            if (request.action == "L_openback" || "L_open" || "I_openback" || "I_open") {
                _actionFn2.default.needOpener = true;
            } else {
                _actionFn2.default.needOpener = false;
            }

            if (request.moreTarget) {
                if (request.moreTarget == "newfront") {
                    _actionFn2.default.newtabType = "create";
                    _actionFn2.default.newtabSel = true;
                } else if (request.moreTarget == "newback") {
                    _actionFn2.default.newtabType = "create";
                    _actionFn2.default.newtabSel = false;
                } else if (request.moreTarget == "curfront") {
                    _actionFn2.default.newtabType = "update";
                    _actionFn2.default.newtabSel = true;
                } else if (request.moreTarget == "incog") {
                    _actionFn2.default.newtabType = "incog";
                    _actionFn2.default.newtabSel = true;
                } else if (request.moreTarget == "incogback") {
                    _actionFn2.default.newtabType = "incog";
                    _actionFn2.default.newtabSel = false;
                }
            }

            if (request.morePinned == "pinned") {
                _actionFn2.default.pinned = true;
            } else {
                _actionFn2.default.pinned = false;
            }

           

            var FnURL = function FnURL() {
                if (request.moreChromepage) {
                    switch (request.moreChromepage) {
                        case "crsettings":
                            _actionFn2.default.URL = "chrome://settings";
                            break;
                        case "crbookmarks":
                            _actionFn2.default.URL = "chrome://bookmarks";
                            break;
                        case "crdownloads":
                            _actionFn2.default.URL = "chrome://downloads";
                            break;
                        case "crextensions":
                            _actionFn2.default.URL = "chrome://extensions";
                            break;
                        case "crhistory":
                            _actionFn2.default.URL = "chrome://history";
                            break;
                        case "crflags":
                            _actionFn2.default.URL = "chrome://flags";
                            break;
                    }
                }

                if (request.moreTsearch) {
                    switch (request.moreTsearch) {
                        case "sgoogle":
                            _actionFn2.default.URL = "http://www.google.com/search?q=" + _actionFn2.default.request.seltext;
                            break;
                        case "sbaidu":
                            _actionFn2.default.URL = "http://www.baidu.com/s?wd=" + _actionFn2.default.request.seltext;
                            break;
                        case "syandex":
                            _actionFn2.default.URL = "http://www.yandex.com/yandsearch?text=" + _actionFn2.default.request.seltext;
                            break;
                        case "sbing":
                            _actionFn2.default.URL = "http://www.bing.com/search?q=" + _actionFn2.default.request.seltext;
                            break;
                        case "syahoo":
                            _actionFn2.default.URL = "http://search.yahoo.com/search?p=" + _actionFn2.default.request.seltext;
                            break;
                        case "swiki":
                            _actionFn2.default.URL = "http://en.wikipedia.org/w/index.php?search=" + _actionFn2.default.request.seltext;
                            break;
                        case "staobao":
                            _actionFn2.default.URL = "http://s.taobao.com/search?q=" + _actionFn2.default.request.seltext;
                            break;
                        case "samazon":
                            _actionFn2.default.URL = "http://www.amazon.com/s/&field-keywords=" + _actionFn2.default.request.seltext;
                            break;
                        case "ssogou":
                            _actionFn2.default.URL = "https://www.sogou.com/web?query=" + _actionFn2.default.request.seltext;
                            break;
                        case "s360":
                            _actionFn2.default.URL = "http://www.haosou.com/s?q=" + _actionFn2.default.request.seltext;
                            break;
                    }
                }

                if (request.moreIsearch) {
                    switch (request.moreIsearch) {
                        case "sgoogleimage":
                            _actionFn2.default.URL = "https://www.google.com/searchbyimage?image_url=" + _actionFn2.default.request.selimg;
                            break;
                        case "sbaiduimage":
                            _actionFn2.default.URL = "http://stu.baidu.com/i?objurl=" + encodeURIComponent(_actionFn2.default.request.selimg) + "&filename=&rt=0&rn=10&ftn=searchimage&ct=1&tn=baiduimagepc";
                            break;
                        case "stineyeimage":
                            _actionFn2.default.URL = "http://www.tineye.com/search?url=" + _actionFn2.default.request.selimg;
                            break;
                    }
                }

                if (request.action == "T_searchuser") {
                    _actionFn2.default.URL = _actionFn2.default.request.moreURL.replace("%s", _actionFn2.default.request.seltext);
                } else if (request.action == "I_searchuser") {
                    _actionFn2.default.URL = _actionFn2.default.request.moreURL.replace("%s", _actionFn2.default.request.selimg);
                } else if (request.action == "G_newtab") {
                    _actionFn2.default.URL = "chrome://newtab/";
                    _actionFn2.default.newtabType = "create";
                } else if (request.action == "G_newusertab") {
                    _actionFn2.default.URL = _actionFn2.default.request.moreURL;
                } else if (request.action == "G_viewsource") {
                    _actionFn2.default.URL = "view-source:" + _actionFn2.default.curTab.url;
                } else if (request.action == "G_crxsettings") {
                    _actionFn2.default.URL = "options.html";
                } else if (request.action == "L_open") {
                    _actionFn2.default.URL = _actionFn2.default.request.sellink;
                } else if (request.action == "I_open") {
                    _actionFn2.default.URL = _actionFn2.default.request.selimg;
                }
            };

            _actionFn2.default.imageDownloadId = null;
            chrome.windows.getCurrent({ populate: true }, function (window) {
                var _curIndex, _toIndex;
               
                for (var i in window.tabs) {
                    if (window.tabs[i].highlighted) {
                        _curIndex = window.tabs[i].index;
                       
                        _actionFn2.default.curTab = sender.tab;
                        break;
                    }
                }

                switch (request.morePosition ) {case "chrome":
                        if (!_actionFn2.default.needOpener) {
                            _toIndex = _curIndex + 1;
                            break;
                        }
                        for (var i = window.tabs.length - 1; i > 0; i--) {
                            if (window.tabs[i].id === window.tabs[_curIndex].id) {
                                _toIndex = i + 1;
                                break;
                            } else if (i == 1) {
                                _toIndex = _curIndex + 1;
                                break;
                            }
                        }
                        break;
                    case "left":
                        if (_curIndex == 0) {
                            _toIndex = 0;
                        } else {
                            _toIndex = _curIndex;
                        }
                        break;
                    case "right":
                        _toIndex = _curIndex + 1;
                        break;
                    case "head":
                        _toIndex = 0;
                        break;
                    case "last":
                        _toIndex = window.tabs.length;
                        break;
                }
                _actionFn2.default.toIndex = _toIndex;
                FnURL();

               
                if (_actionFn2.default.URL) {
                    _actionFn2.default.AllCreate();
                } else {
                    _actionFn2.default[request.action]();
                }
            });

            break;
        case "tipshow":
            var _tipobj1;
            var _tipobj2 = request.tiptype;
            if (_tipobj2 == "gesture") {
                _tipobj1 = "gesture";
            } else {
                _tipobj1 = "drag";
            }
            for (var i = 0; i < config[_tipobj1][_tipobj2].length; i++) {
                if (request.direct == config[_tipobj1][_tipobj2][i].direct) {
                    if (config[_tipobj1][_tipobj2][i].moreDes) {
                        if (config[_tipobj1][_tipobj2][i].action.indexOf("newusertab") != -1) {
                            sendResponse({
                                moreDes: config[_tipobj1][_tipobj2][i].moreDes.replace("%name", config[_tipobj1][_tipobj2][i].moreName),
                                type: request.type
                            });
                        } else if (config[_tipobj1][_tipobj2][i].action.indexOf("search") != -1) {
                            var _repname;
                            if (config[_tipobj1][_tipobj2][i].moreName) {
                                _repname = config[_tipobj1][_tipobj2][i].moreName;
                            } else if (config[_tipobj1][_tipobj2][i].moreTsearch) {
                                _repname = chrome.i18n.getMessage(config[_tipobj1][_tipobj2][i].moreTsearch);
                            } else if (config[_tipobj1][_tipobj2][i].moreIsearch) {
                                _repname = chrome.i18n.getMessage(config[_tipobj1][_tipobj2][i].moreIsearch);
                            }
                            sendResponse({
                                moreDes: config[_tipobj1][_tipobj2][i].moreDes.replace("%name", _repname).replace("%s", request.seltext.length > 10 ? request.seltext.substr(0, 10) + "..." : request.seltext),
                                type: request.type
                            });
                        } else if (config[_tipobj1][_tipobj2][i].action.indexOf("userscript") != -1) {
                            sendResponse({
                                moreDes: config[_tipobj1][_tipobj2][i].moreDes.replace("%name", config[_tipobj1][_tipobj2][i].moreName),
                                type: request.type
                            });
                        } else if (config[_tipobj1][_tipobj2][i].action.indexOf("chromepage") != -1) {
                            sendResponse({
                                moreDes: config[_tipobj1][_tipobj2][i].moreDes.replace("%name", chrome.i18n.getMessage(config[_tipobj1][_tipobj2][i].moreChromepage)),
                                type: request.type
                            });
                        } else if (config[_tipobj1][_tipobj2][i].action.indexOf("copyuser") != -1) {
                            sendResponse({
                                moreDes: config[_tipobj1][_tipobj2][i].moreDes.replace("%name", config[_tipobj1][_tipobj2][i].moreName),
                                type: request.type
                            });
                        }

                        if (!request.seltext) {
                            sendResponse({
                                moreDes: config[_tipobj1][_tipobj2][i].moreDes.replace("%name", config[_tipobj1][_tipobj2][i].more1),
                                type: request.type
                            });
                        } else {
                            sendResponse({
                                moreDes: config[_tipobj1][_tipobj2][i].moreDes.replace("%name", config[_tipobj1][_tipobj2][i].more1).replace("%s", request.seltext.length > 10 ? request.seltext.substr(0, 10) + "..." : request.seltext),
                                type: request.type
                            });
                        }
                    } else {
                        if (!request.seltext) {
                            sendResponse({
                                moreDes: chrome.i18n.getMessage(config[_tipobj1][_tipobj2][i].action),
                                type: request.type
                            });
                        } else {
                            sendResponse({
                                moreDes: chrome.i18n.getMessage(config[_tipobj1][_tipobj2][i].action).replace("%s", request.seltext.length > 10 ? request.seltext.substr(0, 10) + "..." : request.seltext),
                                type: request.type
                            });
                        }
                    }
                    break;
                }
                if (i == config[_tipobj1][_tipobj2].length - 1) {
                    sendResponse({ moreDes: "none", type: request.type });
                    return;
                }
            }
           
            break;
        case "config":
            config = JSON.parse(localStorage.getItem("config"));
            config.extid = chrome.runtime.id ? chrome.runtime.id : "none";
            sendResponse(config);
            break;
        case "actioncfg":
            sendResponse(action);
            break;
        case "tablist":
            chrome.windows.getCurrent({ populate: true }, function (window) {
                var tbtabs = window.tabs;
                var tbcurtab;
                for (var i in window.tabs) {
                    if (window.tabs[i].highlighted) {
                       
                        tbcurtab = window.tabs[i];
                        break;
                    }
                }
                chrome.tabs.sendMessage(tbcurtab.id, {
                    tabs: window.tabs,
                    curTab: tbcurtab,
                    type: "tablist"
                }, function (response) {});
            });
            break;
        case "tablistend":
            chrome.windows.getCurrent({ populate: true }, function (window) {
                chrome.tabs.query({ windowId: window.id, index: request.tablistIndex }, function (tabs) {
                    chrome.tabs.update(tabs[0].id, { active: true });
                });
            });
            break;
        case "mousestate":

            config.mouse = request.state;
            break;
        case "getmouse":
            sendResponse({ mouse: config.mouse });
            break;
        case "scrollgesture":
            var _sgsId;
            if (request.UD == "up") {
                _sgsId = 0;
            } else {
                _sgsId = 1;
            }
            sendResponse(config.scrollgesture[request.LR][_sgsId]);
            break;
        case "strokegesture":

            switch (request.hold) {
                case "left":
                    sendResponse(config.strokegesture["str" + request.hold][request.LR - 1]);
                    break;
                case "middle":
                    sendResponse(config.strokegesture["str" + request.hold][request.LR == 2 ? request.LR - 1 : request.LR]);
                    break;
                case "right":
                    isRocker = true;
                    sendResponse(config.strokegesture["str" + request.hold][request.LR]);
                    break;
            }
            break;
        case "syncdown":
                        config = JSON.parse(localStorage.getItem("config"));
            if (!config.sync) {
                chrome.storage.sync.get(null, function (items) {
                    if (!items.sync) {
                        config.sync = true;
                        localStorage.setItem("config", JSON.stringify(config));
                        chrome.storage.sync.set(config, function () {});
                    } else {
                        chrome.storage.sync.get(null, function (items) {
                            localStorage.setItem("config", JSON.stringify(items));
                        });
                    }
                });
            } else {
                chrome.storage.sync.get(null, function (items) {
                    localStorage.setItem("config", JSON.stringify(items));
                });
            }
            break;
        case "syncup":
            config = JSON.parse(localStorage.getItem("config"));
            if (config.sync) {
                chrome.storage.sync.set(config);
            }
            break;
        case "syncclear":
            chrome.storage.sync.clear(function () {
                chrome.storage.sync.set(JSON.parse(localStorage.getItem("config")));
            });
            break;
        case "fastSwitch":
            var direct = request.rv ? !request.direction : request.direction;
            chrome.windows.getCurrent({ populate: true }, function (window) {
                var curTab,
                    windowTabs = window.tabs,
                    curTansLen = windowTabs.length;
                for (var i in windowTabs) {
                    if (window.tabs[i].active) {
                        curTab = window.tabs[i];
                    }
                }
                tabIndex = direct ? curTab.index + 1 : curTab.index - 1;
                if (tabIndex === curTansLen) {
                    tabIndex = 0;
                } else if (tabIndex === -1) {
                    tabIndex = curTansLen - 1;
                }
                chrome.tabs.update(window.tabs[tabIndex].id, { active: true });
            });
            break;
        case "zoom":
            chrome.tabs.getZoom(sender.tab.id, function (zoomFactor) {
                if (!request.zoomIn) {
                    if (zoomFactor < 2) {
                        zoomFactor -= 0.15;
                    } else if (3 > zoomFactor && zoomFactor > 2) {
                        zoomFactor -= 0.5;
                    } else {
                        zoomFactor -= 1;
                    }
                } else {
                    if (zoomFactor < 2) {
                        zoomFactor += 0.15;
                    } else if (3 > zoomFactor && zoomFactor > 2) {
                        zoomFactor += 0.5;
                    } else {
                        zoomFactor += 1;
                    }
                }
                chrome.tabs.setZoom(sender.tab.id, zoomFactor);
            });
            break;
        case "gaEvent":
            _analytics2.default.gaAnalyticsEvent(request.gaCategory, request.gaAction, request.gaLabel || null, request.gaValue || null);
            break;
        case "toggleShutdownGestures":
            config.isGesturesOff = !config.isGesturesOff;
            _analytics2.default.gaAnalyticsEvent("General", "Switch", config.isGesturesOff ? "Off" : "On");
            var arrayOfTypes = ["gesture", "drag", "scroll", "scrollgesture", "strokegesture"];
            if (config.isGesturesOff) {
                if (typeof config.backup === "undefined") config.backup = {};
                arrayOfTypes.forEach(function (type) {
                    config.backup[type] = config.normal[type];
                    config.normal[type] = false;
                });
            } else {
                arrayOfTypes.forEach(function (type) {
                    config.normal[type] = config.backup[type];
                });
            }
            config.sync = false;
            chrome.storage.sync.set(config, function () {
                localStorage.setItem("config", JSON.stringify(config));
                sendResponse({ isGesturesOff: config.isGesturesOff, backup: config.backup, optedOut: config.optedout });
                chrome.runtime.sendMessage({ type: "toggleShutdownGesturesOptions", isGesturesOff: config.isGesturesOff, backup: config.backup });
                chrome.tabs.query({}, function (arrayOfTabs) {
                    arrayOfTabs.forEach(function (tab) {
                        chrome.tabs.sendMessage(tab.id, { type: "toggleShutdownGesturesEvent", config: config });
                    });
                });
            });
            break;
        case "toggleOptedOut":
            config.optedout = request.optedout;
            localStorage.setItem("config", JSON.stringify(config));
            chrome.storage.sync.set({ optedout: request.optedout }, function () {
                chrome.tabs.query({}, function (tabs) {
                    if (!tabs || !tabs.length) return;
                    tabs.forEach(function (tab) {
                       
                        tab.id && chrome.browserAction.setIcon({
                            path: request.optedout ? "icond.png" : "icon.png",
                            tabId: tab.id
                        });
                        var tabUrl = tab.pendingUrl || tab.url;
                        if (!request.preventReload && tabUrl && tabUrl.includes(chrome.extension.getURL("/options.html"))) {
                            chrome.tabs.reload(tab.id);
                        }
                    });
                });
            });
            break;
        case 'getFirstSessionAfterInstall':
            sendResponse({ firstSessionAfterInstall: sessionStorage.getItem(_constants.storageKeys.FIRST_SESSION_AFTER_INSTALL) || false });
            break;
        case 'getCursor':
            sendResponse({
                cursorimg: config.normal.cursorimg === 'localStorage' ? atob(localStorage.getItem('imgData')) : config.normal.cursorimg,
                cursorimgscale: config.normal.cursorimgscale,
                isUploadImage: config.normal.cursorimg === 'localStorage'
            });
            break;
        case 'openOnboarding':
            (0, _utils.openOnboarding)();
            break;
        case 'openNewTab':
            (0, _utils.openNewTab)(request.url);
            break;
        case 'neverShowAgainRateUs':
            localStorage.setItem('dontShowRateUsOverlayEver', 'true');
            break;
        case 'shouldShowRateUsOverlay':
            if (localStorage.getItem('dontShowRateUsOverlayEver') === 'true') {
                return;
            } else if (localStorage.getItem('D28') !== null && localStorage.getItem('D28-RateUsSeen') === null) {
                localStorage.setItem('dontShowRateUsOverlayEver', 'true');
                localStorage.setItem('D28-RateUsSeen', 'true');
                localStorage.setItem('D14-RateUsSeen', 'true');
                localStorage.setItem('D7-RateUsSeen', 'true');
                (0, _utils.injectRateUsOverlayScript)();
            } else if (localStorage.getItem('D14') !== null && localStorage.getItem('D14-RateUsSeen') === null) {
                localStorage.setItem('D14-RateUsSeen', 'true');
                localStorage.setItem('D7-RateUsSeen', 'true');
                (0, _utils.injectRateUsOverlayScript)();
            } else if (localStorage.getItem('D7') !== null && localStorage.getItem('D7-RateUsSeen') === null) {
                localStorage.setItem('D7-RateUsSeen', 'true');
                (0, _utils.injectRateUsOverlayScript)();
            }
            break;
        case 'openMakeASelectionOverlay':
            (0, _utils.injectMakeASelectionOverlayScript)();
            break;
        case 'madeASelectionOptin':
            config.normal.clickedOptin = true;
            localStorage.setItem("config", JSON.stringify(config));
            chrome.storage.sync.set(config, function () {
                chrome.tabs.query({}, function (arrayOfTabs) {
                    arrayOfTabs.forEach(function (tab) {
                        chrome.tabs.sendMessage(tab.id, { type: "madeASelectionOptinEvent", config: config });
                    });
                });
            });
            break;
        case 'showOnboardingLater':
            localStorage.setItem('showOnboardingLater', 'true');
            sessionStorage.setItem('sawOnboardingLater', 'true');
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                var activeTabId = tabs[0].id;
                chrome.tabs.remove(activeTabId);
            });
            break;
        case 'handleOnboardingReminderRequests':
            (0, _onboardingReminderHandler.handleOnboardingReminderRequests)(request, sendResponse);
            break;

    }
    return true;
});

/***/ }),

/***/ 104:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
var actionFn = {
    needCurTab: false,
    needCurWindow: false,
    needCurWindows: false,
    needOpener: false,
    curTab: null,
    curWindow: null,
    curWindows: null,
    toIndex: null,
    request: null,
    curWindowState: [],

    AllCreate: function AllCreate() {
        if (actionFn.newtabType == "create") {
            chrome.tabs.create({
                url: actionFn.URL,
                selected: actionFn.newtabSel,
                index: actionFn.toIndex,
                pinned: actionFn.pinned
            });
        } else if (actionFn.newtabType == "incog") {
            chrome.windows.create({ url: actionFn.URL, incognito: true });
        } else {
            chrome.tabs.update({ url: actionFn.URL, pinned: actionFn.pinned });
        }
        actionFn.URL = null;
    },

    G_reclosedtab: function G_reclosedtab() {
        if (closedTabsId.length > 0) {
            var _closedtab = closedTabsId[closedTabsId.length - 1];
            if (_closedtab.id) {
                if (actionFn.newtabType == "create") {
                    chrome.tabs.create({
                        url: _closedtab.url,
                        selected: actionFn.newtabSel,
                        index: actionFn.toIndex,
                        pinned: actionFn.pinned
                    });
                } else {
                    chrome.tabs.update({ url: _closedtab.url, pinned: actionFn.pinned });
                }
                closedTabsId.pop();
            }
        }
    },

    G_capture: function G_capture() {
        window.setTimeout(_capturedelay, 100);

        function _capturedelay() {
            chrome.tabs.captureVisibleTab({ format: actionFn.request.moreCapturetype }, function (dataUrl) {
                if (actionFn.newtabType == "create") {
                    chrome.tabs.create({ url: dataUrl, selected: true, index: actionFn.toIndex });
                } else {
                    chrome.tabs.update({ url: dataUrl, pinned: actionFn.pinned });
                }
            });
        }
    },

    G_reload: function G_reload() {
        chrome.tabs.reload({ bypassCache: true });
    },

    G_reloadclear: function G_reloadclear() {
        chrome.tabs.reload({ bypassCache: false });
    },

    G_newwindow: function G_newwindow() {
        chrome.windows.create({ focused: true });
    },

    G_incognito: function G_incognito() {
        chrome.windows.create({ incognito: true });
    },

    G_close: function G_close() {
        if (actionFn.request.moreCloseopts == "unclose" && actionFn.curWindow.tabs.length == 1) {
            chrome.tabs.create({ url: actionFn.request.moreCloseurl, selected: false }, function (tab) {
                chrome.tabs.remove(actionFn.curTab.id, function () {});
            });
            return;
        }
        chrome.tabs.remove(actionFn.curTab.id, function () {});
        if (actionFn.curTab.index != 0 && actionFn.request.moreClosesel == "left") {
            for (var i in actionFn.curWindow.tabs) {
                if (actionFn.curWindow.tabs[i].index == actionFn.curTab.index - 1) {
                   
                    chrome.tabs.update(actionFn.curWindow.tabs[i].id, { active: true });
                    break;
                }
            }
        } else if (actionFn.curTab.index != actionFn.curWindow.tabs.length - 1 && actionFn.request.moreClosesel == "right") {
            for (var i in actionFn.curWindow.tabs) {
                if (actionFn.curWindow.tabs[i].index == actionFn.curTab.index + 1) {
                    chrome.tabs.update(actionFn.curWindow.tabs[i].id, { active: true });
                    break;
                }
            }
        }
    },

    G_movetowindow: function G_movetowindow() {
        chrome.windows.create({ focused: true }, function (window) {
            chrome.tabs.move(actionFn.curTab.id, { index: -1, windowId: window.id }, function (tab) {});
            chrome.tabs.remove(window.tabs[0].id);
        });
    },

    G_closeothers: function G_closeothers() {
        for (var i in actionFn.curWindow.tabs) {
            var aTab = actionFn.curWindow.tabs[i];
            if ((!aTab.highlighted || !aTab.active) && !aTab.pinned) {
                chrome.tabs.remove(aTab.id);
            }
        }
    },

    G_closelefttabs: function G_closelefttabs() {
        for (var i in actionFn.curWindow.tabs) {
            var aTab = actionFn.curWindow.tabs[i];
            if (aTab.index < actionFn.curTab.index && !aTab.pinned) {
                chrome.tabs.remove(aTab.id);
            }
        }
    },

    G_closerighttabs: function G_closerighttabs() {
        for (var i in actionFn.curWindow.tabs) {
            var aTab = actionFn.curWindow.tabs[i];
            if (aTab.index > actionFn.curTab.index && !aTab.pinned) {
                chrome.tabs.remove(aTab.id);
            }
        }
    },

    G_closewindows: function G_closewindows() {
        chrome.windows.getAll({}, function (windows) {
            Object.keys(windows).forEach(function (w) {
                chrome.windows.remove(windows[w].id);
            });
        });
    },

    G_closewindow: function G_closewindow() {
        chrome.windows.remove(actionFn.curWindow.id);
    },

    G_copytab: function G_copytab() {
        chrome.tabs.duplicate(actionFn.curTab.id);
    },

    G_windowmax: function G_windowmax() {
        if (actionFn.curWindow.state == "maximized") {
            chrome.windows.update(actionFn.curWindow.id, { state: "normal" });
        } else {
            chrome.windows.update(actionFn.curWindow.id, { state: "maximized" });
        }
    },

    G_windowmin: function G_windowmin() {
        chrome.windows.update(actionFn.curWindow.id, { state: "minimized" });
    },

    G_pin: function G_pin() {
        if (actionFn.curTab.pinned) {
            chrome.tabs.update({ pinned: false });
        } else {
            chrome.tabs.update({ pinned: true });
        }
    },

    G_splitTab: function G_splitTab() {
        chrome.windows.create({ tabId: actionFn.curTab.id, focused: true }, function (window) {
            var tabs = [];
            for (var i in actionFn.curWindow.tabs) {
                var aTab = actionFn.curWindow.tabs[i];
                if (aTab.index > actionFn.curTab.index) {
                    tabs.push(aTab.id);
                }
            }
            chrome.tabs.move(tabs, { windowId: window.id, index: -1 });
        });
    },

    G_mergeTab: function G_mergeTab() {
        chrome.windows.getAll({ populate: true, windowTypes: ["normal"] }, function (wins) {
            var winLen = wins.length;
            if (winLen > 1) {
                for (var i = 1; i < winLen; i++) {
                    var tabLen = wins[i].tabs.length,
                        tabs = [];
                    for (var j = 0; j < tabLen; j++) {
                        tabs.push(wins[i].tabs[j].id);
                    }
                    chrome.tabs.move(tabs, { windowId: wins[0].id, index: -1 }, function () {
                        chrome.windows.remove(wins[i].id);
                    });
                }
            }
        });
    },

    G_fullscreen: function G_fullscreen() {
        if (actionFn.curWindow.state == "fullscreen") {
            chrome.windows.update(actionFn.curWindow.id, { state: actionFn.curWindowState[actionFn.curWindow.id] });
        } else {
            actionFn.curWindowState[actionFn.curWindow.id] = actionFn.curWindow.state;
            chrome.windows.update(actionFn.curWindow.id, { state: "fullscreen" });
        }
    },

    G_lefttab: function G_lefttab() {
        if (actionFn.curTab.index != 0) {
            for (var i in actionFn.curWindow.tabs) {
                if (actionFn.curWindow.tabs[i].index == actionFn.curTab.index - 1) {
                    if (isRocker) {
                        chrome.tabs.sendMessage(actionFn.curWindow.tabs[i].id, { cmd: "disabledRC" });
                        isRocker = false;
                    }
                    chrome.tabs.update(actionFn.curWindow.tabs[i].id, { active: true });
                    break;
                }
            }
        } else {
            chrome.tabs.update(actionFn.curWindow.tabs[actionFn.curWindow.tabs.length - 1].id, { active: true });
        }
    },

    G_righttab: function G_righttab() {
        if (actionFn.curTab.index != actionFn.curWindow.tabs.length - 1) {
            for (var i in actionFn.curWindow.tabs) {
                if (actionFn.curWindow.tabs[i].index == actionFn.curTab.index + 1) {
                    chrome.tabs.update(actionFn.curWindow.tabs[i].id, { active: true });
                    break;
                }
            }
        } else {
            chrome.tabs.update(actionFn.curWindow.tabs[0].id, { active: true });
        }
    },

    G_firsttab: function G_firsttab() {
        chrome.tabs.update(actionFn.curWindow.tabs[0].id, { active: true });
    },

    G_lasttab: function G_lasttab() {
        chrome.tabs.update(actionFn.curWindow.tabs[actionFn.curWindow.tabs.length - 1].id, { active: true });
    },

    G_reloadall: function G_reloadall() {
        for (var i in actionFn.curWindow.tabs) {
            chrome.tabs.reload(actionFn.curWindow.tabs[i].id, { bypassCache: false });
        }
    },

    G_copyurl: function G_copyurl() {
        for (var i in actionFn.curWindow.tabs) {
            if (actionFn.curWindow.tabs[i].active) {
                var _text = document.createElement("textarea");
                _text.id = "crxmousetextarea";
                document.body.appendChild(_text);
                var clipobj = document.getElementById("crxmousetextarea");
                clipobj.value = actionFn.curWindow.tabs[i].url;
                clipobj.select();
                document.execCommand('copy', false, null);
                clipobj.parentNode.removeChild(clipobj);
                break;
            }
        }
    },

    G_copytitle: function G_copytitle() {
        for (var i in actionFn.curWindow.tabs) {
            if (actionFn.curWindow.tabs[i].active) {
                var _text = document.createElement("textarea");
                _text.id = "crxmousetextarea";
                document.body.appendChild(_text);
                var clipobj = document.getElementById("crxmousetextarea");
                clipobj.value = actionFn.curWindow.tabs[i].title;
                clipobj.select();
                document.execCommand('copy', false, null);
                clipobj.parentNode.removeChild(clipobj);
                break;
            }
        }
    },

    T_copytext: function T_copytext() {
        for (var i in actionFn.curWindow.tabs) {
            if (actionFn.curWindow.tabs[i].active) {
                var _text = document.createElement("textarea");
                _text.id = "crxmousetextarea";
                document.body.appendChild(_text);
                var clipobj = document.getElementById("crxmousetextarea");
                clipobj.value = actionFn.request.seltext;
                clipobj.select();
                document.execCommand('copy', false, null);
                clipobj.parentNode.removeChild(clipobj);
                break;
            }
        }
    },

    L_copytext: function L_copytext() {
        for (var i in actionFn.curWindow.tabs) {
            if (actionFn.curWindow.tabs[i].active) {
                var _text = document.createElement("textarea");
                _text.id = "crxmousetextarea";
                document.body.appendChild(_text);
                var clipobj = document.getElementById("crxmousetextarea");
                clipobj.value = actionFn.request.seltext;
                clipobj.select();
                document.execCommand('copy', false, null);
                clipobj.parentNode.removeChild(clipobj);
                break;
            }
        }
    },

    L_copyurl: function L_copyurl() {
        for (var i in actionFn.curWindow.tabs) {
            if (actionFn.curWindow.tabs[i].active) {
                var _text = document.createElement("textarea");
                _text.id = "crxmousetextarea";
                document.body.appendChild(_text);
                var clipobj = document.getElementById("crxmousetextarea");
                clipobj.value = actionFn.request.sellink;
                clipobj.select();
                document.execCommand('copy', false, null);
                clipobj.parentNode.removeChild(clipobj);
                break;
            }
        }
    },

    I_save: function I_save() {
        var a = $("<a>").attr("href", actionFn.request.selimg).attr("target", "_blank").attr("download", actionFn.request.selimg.split('/').pop()).appendTo("body");
        a[0].click();
        a.remove();
        chrome.tabs.sendMessage(actionFn.curTab.id, { notifitype: "isave", notifitext: chrome.i18n.getMessage("downimgtooltip") });
    },

    I_saveback: function I_saveback() {
        var a = $("<a>").attr("href", actionFn.request.selimg).attr("target", "_blank").attr("download", actionFn.request.selimg.split('/').pop()).appendTo("body");
        a[0].click();
        a.remove();
        chrome.tabs.sendMessage(actionFn.curTab.id, { notifitype: "isaveback", notifitext: chrome.i18n.getMessage("downimgtooltip") });
    },

    I_copyurl: function I_copyurl() {
        for (var i in actionFn.curWindow.tabs) {
            if (actionFn.curWindow.tabs[i].active) {
                var _text = document.createElement("textarea");
                _text.id = "crxmousetextarea";
                document.body.appendChild(_text);
                var clipobj = document.getElementById("crxmousetextarea");
                clipobj.value = actionFn.request.selimg;
                clipobj.select();
                document.execCommand('copy', false, null);
                clipobj.parentNode.removeChild(clipobj);
                break;
            }
        }
    },

    G_stopall: function G_stopall() {
        chrome.windows.getAll({ populate: true }, function (windows) {
            for (var i = 0; i < windows.length; i++) {
                for (var ii = 0; ii < windows[i].tabs.length; ii++) {
                    chrome.tabs.executeScript(windows[i].tabs[ii].id, {
                        code: "window.stop();",
                        allFrames: true,
                        runAt: "document_start"
                    }, function () {});
                }
            }
        });
    },

    G_copyaslink: function G_copyaslink() {
        var _text = document.createElement("textarea");
        _text.id = "crxmousetextarea";
        document.body.appendChild(_text);
        var clipobj = document.getElementById("crxmousetextarea");
        clipobj.value += "<a href='" + actionFn.curTab.url + "'>" + actionFn.curTab.title + "<\/a>";
        clipobj.select();
        document.execCommand('copy', false, null);
        clipobj.parentNode.removeChild(clipobj);
    },

    L_copyaslink: function L_copyaslink() {
        var _text = document.createElement("textarea");
        _text.id = "crxmousetextarea";
        document.body.appendChild(_text);
        var clipobj = document.getElementById("crxmousetextarea");
        clipobj.value += "<a href='" + actionFn.request.sellink + "'>" + actionFn.request.seltext + "<\/a>";
        clipobj.select();
        document.execCommand('copy', false, null);
        clipobj.parentNode.removeChild(clipobj);
    },

    G_copyuser: function G_copyuser() {
        var _text = document.createElement("textarea");
        _text.id = "crxmousetextarea";
        document.body.appendChild(_text);
        var clipobj = document.getElementById("crxmousetextarea");

        function _CopyDateescape() {
            if (actionFn.request.moreCopystyle.indexOf("\\n") != -1) {
                actionFn.request.moreCopystyle = actionFn.request.moreCopystyle.replace("\\n", "\n");
                _CopyDateescape();
            }
        }

        _CopyDateescape();

        var _linkstyleobj = actionFn.request.moreCopystyle;

        function _linkstylefn() {
            if (_linkstyleobj.indexOf("%title") != -1 || _linkstyleobj.indexOf("%url") != -1) {
                _linkstyleobj = _linkstyleobj.replace("%title", actionFn.curTab.title).replace("%url", actionFn.curTab.url);
                _linkstylefn();
            }
        }

        _linkstylefn();
                clipobj.value += _linkstyleobj;
        clipobj.select();
        document.execCommand('copy', false, null);
        clipobj.parentNode.removeChild(clipobj);
    },

    _CheckURL: function _CheckURL(url) {
        if (url == "") {
            return false;
        }

        var url = url.toLowerCase();
        if (url.indexOf("http://") != 0 && url.indexOf("https://") != 0 && url.indexOf("ftp://") != 0 && url.indexOf("chrome://") != 0 && url.indexOf("chrome-extension://") != 0) {
            url = "http://" + url;
        }

        if (url.substr(0, 6) == "chrome") {
            return url;
        }
        var regexp = /^((chrome|chrome-extension|ftp|http(s)?):\/\/)([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
        if (regexp.test(url)) {
            return url;
        } else {
            return false;
        }
    },

    G_openclipurl: function G_openclipurl() {
        var _text = document.createElement("textarea");
        _text.id = "crxmousetextarea";
        document.body.appendChild(_text);
        var clipobj = document.getElementById("crxmousetextarea");

        clipobj.focus();
        document.execCommand('paste', false, null);
        if (actionFn._CheckURL(clipobj.value)) {
            if (actionFn.newtabType == "create") {
                chrome.tabs.create({
                    url: actionFn._CheckURL(clipobj.value),
                    selected: actionFn.newtabSel,
                    index: actionFn.toIndex
                });
            } else {
                chrome.tabs.update({ url: actionFn._CheckURL(clipobj.value) });
            }
        }
        clipobj.parentNode.removeChild(clipobj);
    },

    G_trynextto: function G_trynextto() {
        if (actionFn.newtabType == "create") {
            chrome.tabs.create({
                url: actionFn.request.transurl,
                selected: actionFn.newtabSel,
                index: actionFn.toIndex,
                pinned: actionFn.pinned
            });
        } else {
            chrome.tabs.update({ url: actionFn.request.transurl, pinned: actionFn.pinned });
        }
    },

    G_tryprevto: function G_tryprevto() {
        if (actionFn.newtabType == "create") {
            chrome.tabs.create({
                url: actionFn.request.transurl,
                selected: actionFn.newtabSel,
                index: actionFn.toIndex,
                pinned: actionFn.pinned
            });
        } else {
            chrome.tabs.update({ url: actionFn.request.transurl, pinned: actionFn.pinned });
        }
    },

    G_bookmark: function G_bookmark() {
        this.bookmark(actionFn.curTab.title, actionFn.curTab.url);
    },

    L_bookmark: function L_bookmark() {
        this.bookmark(actionFn.request.seltext, actionFn.request.sellink);
    },

    bookmark: function bookmark(bktitle, bkurl) {
        if (!bkurl) {
            return;
        }
        chrome.bookmarks.getTree(function (BookmarkParentNode) {
            for (var i = 0; i < BookmarkParentNode[0].children[0].children.length; i++) {
                if (BookmarkParentNode[0].children[0].children[i].children && BookmarkParentNode[0].children[0].children[i].title == "CrxMouse") {
                    if (BookmarkParentNode[0].children[0].children[i].children.length == 0) {
                        chrome.bookmarks.create({
                            parentId: BookmarkParentNode[0].children[0].children[i].id,
                            title: bktitle,
                            url: bkurl
                        }, function (createdNode) {
                            chrome.tabs.sendMessage(actionFn.curTab.id, {
                                notifitype: "bookmark",
                                notifitext: chrome.i18n.getMessage("bookmarknotifi")
                            });
                        });
                    }
                    for (var ii = 0; ii < BookmarkParentNode[0].children[0].children[i].children.length; ii++) {
                        if (BookmarkParentNode[0].children[0].children[i].children[ii].url == bkurl) {
                            chrome.tabs.sendMessage(actionFn.curTab.id, {
                                notifitype: "bookmark",
                                notifitext: chrome.i18n.getMessage("bookmarkfailnotifi")
                            }, function (response) {});
                            break;
                        }
                        if (ii == BookmarkParentNode[0].children[0].children[i].children.length - 1 && BookmarkParentNode[0].children[0].children[i].children[ii].url != bkurl) {
                            chrome.bookmarks.create({
                                parentId: BookmarkParentNode[0].children[0].children[i].id,
                                title: bktitle,
                                url: bkurl
                            }, function (createdNode) {
                                chrome.tabs.sendMessage(actionFn.curTab.id, {
                                    notifitype: "bookmark",
                                    notifitext: chrome.i18n.getMessage("bookmarknotifi")
                                });
                            });
                        }
                    }
                    break;
                }
                if (i == BookmarkParentNode[0].children[0].children.length - 1 && BookmarkParentNode[0].children[0].children[i].title != "CrxMouse") {
                    chrome.bookmarks.create({
                        parentId: BookmarkParentNode[0].children[0].id,
                        title: "CrxMouse"
                    }, function (createdNode) {});
                }
            }
        });
    },

    G_BmManager: function G_BmManager() {
        chrome.tabs.create({ url: "chrome://bookmarks" });
    },

    tablist: function tablist() {}
};

exports.default = actionFn;

/***/ }),

/***/ 105:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.handleOnboardingReminderRequests = undefined;

var _utils = __webpack_require__(1);

var handleOnboardingReminderRequests = function handleOnboardingReminderRequests(request, sendResponse) {
    switch (request.handler) {
        case 'shouldShowReminderOnboarding':
            var showOnboardingLater = localStorage.getItem('showOnboardingLater');
            var sawOnboardingLater = sessionStorage.getItem('sawOnboardingLater');
            if (showOnboardingLater === "true" && sawOnboardingLater === null && config.normal.clickedOptin) {
                sessionStorage.setItem('sawOnboardingLater', 'true');
                sendResponse({
                    shouldShowReminderOnboarding: true
                });
            } else {
                sendResponse({
                    shouldShowReminderOnboarding: false
                });
            }
            break;
        case 'neverShowReminderOnboarding':
            localStorage.removeItem('showOnboardingLater');
            break;
        case 'CTAClick':
            localStorage.removeItem('showOnboardingLater');
            (0, _utils.openNewTab)('https://crxmouse.com/the-mouse-chase-1');
            break;
        case 'remindMeLater':
            sessionStorage.setItem('sawOnboardingLater', 'true');
            break;
    }
};

exports.handleOnboardingReminderRequests = handleOnboardingReminderRequests;

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