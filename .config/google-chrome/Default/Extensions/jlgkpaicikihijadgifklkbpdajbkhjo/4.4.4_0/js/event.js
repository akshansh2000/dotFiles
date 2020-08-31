if (!teststroke) {
    var teststroke = false;
}
if (!optpages) {
    var optpages = false;
}
if (!testdrag) {
    var testdrag = false;
}
if (!testgesture) {
    var testgesture;
}

var autocanceltimer;
var tostop = false;
var isOptionsPage = false;
var returnvalue;
var hScroll;
var CMGtitletest = false;
var CMGstroketest = false;
var disableRc = false;  // disable right click when rocker
var escListenerAdded = false;
const escKeyCode = 27;
const mouseGestures = 'mouse';
const dragGestures = 'drag';
const screens = {
    first: 'https://crxmouse.com/the-mouse-chase-1?screen=1',
    second: 'https://crxmouse.com/the-mouse-chase-1?screen=2',
    third: 'https://crxmouse.com/the-mouse-chase-2?screen=3',
    fourth: 'https://crxmouse.com/the-mouse-chase-1?screen=4',
    fifth: 'https://crxmouse.com/the-mouse-chase-1?screen=5'
};

const scrollTo = (element, to, duration, direction) => {
    try {
        if (!element || !direction || typeof to === 'undefined' || duration <= 0) return;
        var difference = Math.abs(to - element.scrollTop);
        var perTick = difference / duration * 10;
        var timeout = setTimeout(function () {
            element.scrollTop = element.scrollTop + direction * perTick;
            if (element.scrollTop === to) return;
            clearTimeout(timeout);
            scrollTo(element, to, duration - 10, direction);
        }, 5);
    } catch (e) {
        //do nothing
    }
}

const browserParser = (function () {

    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browserName = navigator.appName;
    var fullVersion = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix;

// In Opera, the true version is after "Opera" or after "Version"
    if ((verOffset = nAgt.indexOf("Opera")) != -1) {
        browserName = "Opera";
        fullVersion = nAgt.substring(verOffset + 6);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }
// In MSIE, the true version is after "MSIE" in userAgent
    else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
        browserName = "Microsoft Internet Explorer";
        fullVersion = nAgt.substring(verOffset + 5);
    }
// In Chrome, the true version is after "Chrome"
    else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
        browserName = "Chrome";
        fullVersion = nAgt.substring(verOffset + 7);
    }
// In Safari, the true version is after "Safari" or after "Version"
    else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
        browserName = "Safari";
        fullVersion = nAgt.substring(verOffset + 7);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }
// In Firefox, the true version is after "Firefox"
    else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
        browserName = "Firefox";
        fullVersion = nAgt.substring(verOffset + 8);
    }
// In most other browsers, "name/version" is at the end of userAgent
    else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
        (verOffset = nAgt.lastIndexOf('/'))) {
        browserName = nAgt.substring(nameOffset, verOffset);
        fullVersion = nAgt.substring(verOffset + 1);
        if (browserName.toLowerCase() == browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }
// trim the fullVersion string at semicolon/space if present
    if ((ix = fullVersion.indexOf(";")) != -1)
        fullVersion = fullVersion.substring(0, ix);
    if ((ix = fullVersion.indexOf(" ")) != -1)
        fullVersion = fullVersion.substring(0, ix);

    majorVersion = parseInt('' + fullVersion, 10);
    if (isNaN(majorVersion)) {
        fullVersion = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }

    return {browserName: browserName, fullVersion: fullVersion, majorVersion: majorVersion};

})();

var cmg = {
    _lastX: 0,
    _lastY: 0,
    _directionChain: "",
    _isMousedown: false,
    _suppressContext: false,
    _cancelmenu: false,
    _toautocancel: false,
    _scroll_targets: [],
    _toCancelGesture: false,
    _toCancelGestureAction: null,
    _toCancelGestureType: null,
    _toCancelDragGesture: false,
    constinit: function (config) {
        cmg.valuegesture = getConfig("normal", "gesture", config);
        cmg.valuedrag = getConfig("normal", "drag", config);
        cmg.valuescroll = getConfig("normal", "scroll", config);
        cmg.valuestrokegesture = getConfig("normal", "strokegesture", config);
        cmg.valueautocancel = getConfig("normal", "autocancel", config);
        cmg.valuescrollgesture = getConfig("normal", "scrollgesture", config);
        cmg.valueautocancelvalue = getConfig("normal", "autocancelvalue", config);
        cmg.valueminlength = getConfig("normal", "minilength", config);
        cmg.dbclicktime = getConfig("normal", "dbclicktime", config);
        cmg.valuescrolleffects = getConfig("normal", "scrolleffects", config);
        cmg.hidetrash = getConfig("normal", "hidetrash", config);
        cmg.clickedOptin = getConfig("normal", "clickedOptin", config);

        cmg.valuegeskey = getConfig("gesture", "geskey", config);
        cmg.valuegestureui = getConfig("gesture", "gestureui", config);
        cmg.valuestroke = getConfig("gesture", "stroke", config);
        cmg.valuestrokecolor = getConfig("gesture", "strokecolor", config);
        cmg.valuestrokeopa = getConfig("gesture", "strokeopa", config);
        cmg.valuestrokewidth = getConfig("gesture", "strokewidth", config);
        cmg.valuedirect = getConfig("gesture", "direct", config);
        cmg.valuetooltip = getConfig("gesture", "tooltip", config);
        cmg.valuedirectcolor = getConfig("gesture", "directcolor", config);
        cmg.valuedirectopa = getConfig("gesture", "directopa", config);
        cmg.valuetooltipwidth = getConfig("gesture", "tooltipwidth", config);
        cmg.valuetooltipcolor = getConfig("gesture", "tooltipcolor", config);
        cmg.valuetooltipopa = getConfig("gesture", "tooltipopa", config);
        cmg.valuestenable = getConfig("gesture", "stenable", config);
        cmg.valuegholdkey = getConfig("gesture", "gholdkey", config);
        cmg.valuegholdkeydisable = getConfig("gesture", "gholdkeydisable", config);
        cmg.valuegholdkeytype = getConfig("gesture", "gholdkeytype", config);
        cmg.valueggesPos = getConfig("gesture", "gesPos", config);
        cmg.valueimgfirst = getConfig("drag", "imgfirst", config);
        cmg.valuedholdkey = getConfig("drag", "dholdkey", config);
        cmg.valueimgfirstcheck = getConfig("drag", "imgfirstcheck", config);
        cmg.valuedragtext = getConfig("drag", "dragtext", config);
        cmg.valuedraginput = getConfig("drag", "draginput", config);
        cmg.valuedraglink = getConfig("drag", "draglink", config);
        cmg.valuedragimage = getConfig("drag", "dragimage", config);
        cmg.valuesetdragurl = getConfig("drag", "setdragurl", config);
        cmg.valuedragui = getConfig("drag", "dragui", config);
        cmg.valuedstroke = getConfig("drag", "dstroke", config);
        cmg.valuedstrokecolor = getConfig("drag", "dstrokecolor", config);
        cmg.valuedstrokeopa = getConfig("drag", "dstrokeopa", config);
        cmg.valuedstrokewidth = getConfig("drag", "dstrokewidth", config);
        cmg.valueddirect = getConfig("drag", "ddirect", config);
        cmg.valuedtooltip = getConfig("drag", "dtooltip", config);
        cmg.valueddirectcolor = getConfig("drag", "ddirectcolor", config);
        cmg.valueddirectopa = getConfig("drag", "ddirectopa", config);
        cmg.valuedtooltipwidth = getConfig("drag", "dtooltipwidth", config);
        cmg.valuedtooltipcolor = getConfig("drag", "dtooltipcolor", config);
        cmg.valuedtooltipopa = getConfig("drag", "dtooltipopa", config);

        cmg.valuesmooth = getConfig("scroll", "smooth", config);
        cmg.valuescrollaccele = getConfig("scroll", "scrollaccele", config);
        cmg.valuescrollspeed = getConfig("scroll", "scrollspeed", config);

        cmg.valuestrleftenable = getConfig("strokegesture", "strleftenable", config);
        cmg.valuestrmiddleenable = getConfig("strokegesture", "strmiddleenable", config);
        cmg.valuestrrightenable = getConfig("strokegesture", "strrightenable", config);
        cmg.valuestrpress = getConfig("strokegesture", "strpress", config);

        cmg.valuetablist = getConfig("scrollgesture", "tablist", config);
        cmg.valuetablistkey = getConfig("scrollgesture", "tablistkey", config);
        cmg.valuetablistVisual = getConfig("scrollgesture", "tablistVisual", config);
        cmg.valuesgsleftenable = getConfig("scrollgesture", "sgsleftenable", config);
        cmg.valuesgsrightenable = getConfig("scrollgesture", "sgsrightenable", config);
        cmg.valuessgsFastSwitch = getConfig("scrollgesture", "fastSwitch", config);
        cmg.valuessgsReverseFS = getConfig("scrollgesture", "reverseFS", config);


        cmg.disrightopt = getConfig("normal", "cancelcontextmenu", config) && window.navigator.userAgent.toLowerCase().indexOf("windows") == -1 ? true : false;

        cmg.tuilink = getConfig("others", "tuilink", config);

        if (!document.doctype) {
            cmg.fixPaddingBottom = true;
        }
        else if (document.doctype.publicId == ""
            || document.doctype.publicId == "-//W3C//DTD HTML 4.01//EN"
            || document.doctype.publicId == "-//W3C//DTD XHTML 1.0 Strict//EN"
            || document.doctype.publicId == "-//W3C//DTD XHTML 1.1//EN"
            || document.doctype.publicId == "-//WAPFORUM//DTD XHTML Mobile 1.0//EN") {
            cmg.fixPaddingBottom = false;
        }
        else {
            cmg.fixPaddingBottom = true;
        }

    },
    init: function () {
        if(!cmg.valuegesture && !cmg.valuedrag && !cmg.valuescroll && !cmg.valuescrollgesture && !cmg.valuestrokegesture){
            window.removeEventListener("mousescroll", this, false);
            window.removeEventListener("mousedown", this, true);
            window.removeEventListener("mousemove", this, false);
            window.removeEventListener("mouseup", this, true);
            document.removeEventListener("contextmenu", this, false);
            window.removeEventListener("dragstart", this, false);
            window.removeEventListener("drag", this, false);
            window.removeEventListener("drop", this, false);
            window.removeEventListener("dragenter", this, false);
            window.removeEventListener("dragover", this, false);
            window.removeEventListener("dragend", this, false);
            window.removeEventListener("mousewheel", this, false);
            return;
        }
        window.addEventListener("mousescroll", this, false);
        if (cmg.valuegesture || cmg.valuedrag || cmg.valuescroll || cmg.valuescrollgesture || cmg.valuestrokegesture) {
            window.addEventListener("mousedown", this, true);
            window.addEventListener("mousemove", this, false);
            window.addEventListener("mouseup", this, true);
            document.addEventListener("contextmenu", this, false);
        }
        if (cmg.valuedrag) {
            window.addEventListener("dragstart", this, false);
            window.addEventListener("drag", this, false);
            window.addEventListener("drop", this, false);
            window.addEventListener("dragenter", this, false);
            window.addEventListener("dragover", this, false);
            window.addEventListener("dragend", this, false);
        }
        if (cmg.valuescroll || cmg.valuescrollgesture) {
            window.addEventListener("mousewheel", this, {passive: false, capture: false});
        }
        if (CMGtitletest) {
            window.setInterval(function () {
                document.title = cmg.test;
            }, 50)
        }
    },
    handleEvent: function (e) {
        switch (e.type) {
            case "mousedown":
                if (e.clientX > document.documentElement.offsetWidth - 2) {
                    return;
                }

                /*stroke gesture action*/
                if (cmg.toStrges && cmg.valuestrpress == "down") {
                    chrome.runtime.sendMessage({
                        type: "strokegesture",
                        hold: cmg.toStrges,
                        LR: e.button
                    }, function (response) {
                        cmg.transmsg = response;
                        cmg._gestureaction(response.action);
                        if (e.button != 0) {
                            cmg.strtocancel = true
                        }
                    });
                    return;
                }

                /*stroke gesture*/
                if (!cmg.toStrges && cmg.valuestrokegesture) {
                    if (e.button == 0 && cmg.valuestrleftenable) {
                        cmg.toStrges = "left";
                    }
                    else if (e.button == 1 && cmg.valuestrmiddleenable) {
                        cmg.toStrges = "middle";
                    }
                    else if (e.button == 2 && cmg.valuestrrightenable) {
                        cmg.toStrges = "right";
                    }
                    cmg.toStrkey = e.button;
                }

                /*tablist*/
                if (cmg.valuescrollgesture
                    && cmg.valuetablist
                    && ((cmg.valuetablistkey == "left" && e.button == 0) || (cmg.valuetablistkey == "right" && e.button == 2))) {
                    cmg.toTablist = true;
                }

                /*scroll gesture*/
                if (cmg.valuescrollgesture && cmg.valuesgsleftenable && e.button == 0) {
                    cmg.toSGS = "sgsleft";
                }
                if (cmg.valuescrollgesture && cmg.valuesgsrightenable && e.button == 2) {
                    cmg.toSGS = "sgsright";
                }


                if (cmg.valuegeskey == "left" && (e.target.href || e.target.src || e.target.tagName.toLowerCase() == "input")) {
                    return;
                }

                const enableGestureHoldKeyCondition =  cmg.valuegholdkeytype === "enable" && !e[cmg.valuegholdkey + "Key"] && !tostop;
                const disableGestureHoldKeyCondition = cmg.valuegholdkeytype === "disable" && e[cmg.valuegholdkeydisable + "Key"] && !tostop;

                if ((enableGestureHoldKeyCondition || disableGestureHoldKeyCondition)
                    && (cmg.valuegesture || teststroke)) {
                    switch (cmg.valuegeskey) {
                        case"right":
                            if (e.button === 2) {
                                this.toGesture = "right";
                                this._startGuesture(e);
                            }
                            break;
                        case"middle":
                            if (e.button === 1) {
                                this.toGesture = "middle";
                                this._startGuesture(e);
                            }
                            break;
                        case"left":
                            if (e.button === 0) {
                                this.toGesture = "left";
                                this._startGuesture(e);
                            }
                            break;
                    }
                }
                break;
            case "mousemove":
                cmg._cancelGesture(e);
                if (this.toGesture) {
                    this._progressGesture(e);
                }
                break;
            case "mouseup":
                if(e.which === 3) {
                    document.body.removeEventListener('keyup', cmg._cancelGesture);
                    escListenerAdded = false;
                }
                if (e.button === 2 && disableRc) {
                    e.preventDefault();
                    window.removeEventListener("contextmenu", emptyRightClick);
                    disableRc = false;
                }
                this.Ging = false;
                cmg.toSGS = false;
                cmg.toTablist = false;
                if (cmg.toStrges && cmg.valuestrpress == "up" && e.button != cmg.toStrkey) {
                    cmg.strtocancel = true;
                    chrome.runtime.sendMessage({
                        type: "strokegesture",
                        hold: cmg.toStrges,
                        LR: e.button
                    }, function (response) {
                        cmg.transmsg = response;
                        cmg._gestureaction(response.action);
                    })
                }

                cmg.toStrges = false;
                if (cmg.tablistIng) {
                    chrome.runtime.sendMessage({type: "tablistend", tablistIndex: cmg.tablistId});
                    cmg.toTablist = false;
                    if (cmg.valuetablistkey == "left" || cmg.disrightopt) {
                        cmg.tablistIng = false;
                    }
                    if (window.top.document.getElementById("crxmousetablist")) {
                        window.top.document.getElementById("crxmousetablist").parentNode.removeChild(window.top.document.getElementById("crxmousetablist"))
                    }
                }

                if (!cmg._toautocancel) {
                    cmg._stopGuesture(e);
                }

                /*fix disable right*/
                if (cmg.disrightopt) {
                    this._cancelmenu = false;
                    this.toGesture = "";
                }

                /*reset autocancel*/
                if (cmg._toautocancel) {
                    cmg._toautocancel = false;
                } else {
                    window.clearTimeout(autocanceltimer);
                }

                break;
            case "contextmenu":
                const showContextMenuGesturesDisabled = cmg.valuegholdkeytype === "disable" &&  !e[cmg.valuegholdkeydisable + "Key"];
                const showContextMenuGesturesEnabled = cmg.valuegholdkeytype === "enable" &&  e[cmg.valuegholdkey + "Key"];
                if(showContextMenuGesturesDisabled || showContextMenuGesturesEnabled) {
                    return;
                }
                if (cmg.strtocancel) {
                    cmg.strtocancel = false;
                    e.preventDefault();
                }

                if (cmg.sgstocancel) {
                    cmg.sgstocancel = false;
                    e.preventDefault();
                }

                if (cmg.tablistIng) {
                    if (document.getElementById("crxmousetablist")) {
                        document.getElementById("crxmousetablist").parentNode.removeChild(document.getElementById("crxmousetablist"))
                    }
                    e.preventDefault();
                    cmg.tablistIng = false;

                    /*fix linux tablist secend time*/
                    if (!cmg.disrightopt) {
                        cmg.toTablist = false;
                    }
                }

                /*mouse gesture*/
                if (this._cancelmenu) {
                    //alert(this.toGesture)
                    if (this._cancelmenu/*this.toGesture=="right"*/) {
                        e.preventDefault();
                    }
                    this._cancelmenu = false;
                    this.toGesture = "";
                }

                if (cmg.toSGS == "sgsright" && !cmg.disrightopt) {
                    e.preventDefault();
                }

                /*disable rightmenu*/
                if (cmg.disrightopt && !cmg.disright) {
                    e.preventDefault();
                    cmg.disright = true;
                    cmg.disrighttimer = window.setTimeout(function () {
                        cmg.disright = false;
                        window.clearTimeout(cmg.disrighttimer)
                    }, cmg.dbclicktime)
                }
                else {
                    cmg.disright = false;
                    cmg.toStrges = false;
                    /*fix stroke gesture*/
                    cmg.toTablist = false;
                    /*fix tablist*/
                    this._cancelmenu = false;
                    this.toGesture = "";
                }

                break;
            case "dragstart":
                /*fixed svgdiv*/
                if (document.getElementById("svgdivjlgkpaicikihijadgifklkbpdajbkhjo")) {
                    document.getElementById("svgdivjlgkpaicikihijadgifklkbpdajbkhjo").parentNode.removeChild(document.getElementById("svgdivjlgkpaicikihijadgifklkbpdajbkhjo"));
                }

                if (!e[cmg.valuedholdkey + "Key"]
                    && !tostop && (cmg.valuedrag || teststroke)) {
                    this.toDrag = true;
                    this._dragstart(e);
                }
                break;
            case "dragover":
                if (document.querySelector("#trashspanjlgkpaicikihijadgifklkbpdajbkhjo span")) {
                    if(e.target.id === "trashspanjlgkpaicikihijadgifklkbpdajbkhjo") {
                        document.querySelector("#trashspanjlgkpaicikihijadgifklkbpdajbkhjo span").style.transform = "rotate(-45deg)";
                        document.querySelector("#trashspanjlgkpaicikihijadgifklkbpdajbkhjo span").style.opacity = "1.0";
                        document.querySelector("#trashshowjlgkpaicikihijadgifklkbpdajbkhjo").style.opacity = "1.0";
                        this._setToCancelDragGesture(true);
                    } else {
                        document.querySelector("#trashspanjlgkpaicikihijadgifklkbpdajbkhjo span").style.transform = "unset";
                        document.querySelector("#trashspanjlgkpaicikihijadgifklkbpdajbkhjo span").style.opacity = "0.8";
                        document.querySelector("#trashshowjlgkpaicikihijadgifklkbpdajbkhjo").style.opacity = "0.8";
                        this._setToCancelDragGesture(false);
                    }
                }
                /*fix tablist*/
                cmg.toTablist = false;

                /*fix scrollgesture*/
                cmg.toSGS = false;

                if (this.toDrag) {
                    this._dragprogress(e);
                }
                break;
            case "dragend":
                cmg.toStrges = false;
                this.toGesture = "";
                if (this.toDrag) {
                    this.toDrag = false;
                    this._dragend(e);
                }
                break;
            case "drop":
                if (cmg.valuedrag || teststroke) {
                    this._drop(e);
                }
                break;
            case "mouseleave":
                break;
            case "mousewheel":
                var ud = "";
                if (e.wheelDeltaY > 0) {
                    ud = "up"
                }
                if (e.wheelDeltaY < 0) {
                    ud = "down"
                }

                if (cmg.toTablist && ud != "") {
                    cmg.tablistIng = true;
                    chrome.runtime.sendMessage({type: "tablist"});
                    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
                        switch(request.type) {
                            case "tablist":
                                if (!window.top.document.getElementById("crxmousetablist")) {
                                    var _tablisthold = window.top.document.createElement("div");
                                    if (!cmg.valuetablistVisual) {
                                        _tablisthold.style.display = "none";
                                    }
                                    _tablisthold.id = "crxmousetablist";
                                    _tablisthold.style.left = (window.top.innerWidth - 400) / 2 + "px";
                                    _tablisthold.style.top = (window.top.innerHeight - request.tabs.length * 28) / 2 + "px";
                                    _tablisthold.style.overflowY = "auto";
                                    _tablisthold.style.maxHeight = (window.top.innerHeight - 100) + "px";
                                    for (var i = 0; i < request.tabs.length; i++) {
                                        var _tablist = window.top.document.createElement("div");
                                        _tablist.className = "crxmousetablisttab";
                                        _tablist.innerHTML = "  " + request.tabs[i].title;
                                        var _tabimg = window.top.document.createElement("img");
                                        _tabimg.src = request.tabs[i].favIconUrl;
                                        _tablist.appendChild(_tabimg);
                                        _tablist.insertBefore(_tabimg, _tablist.firstChild);
                                        _tablisthold.appendChild(_tablist);
                                    }
                                    window.top.document.documentElement.appendChild(_tablisthold);
                                    window.top.document.getElementsByClassName("crxmousetablisttab")[request.curTab.index].id = "crxmousetablisttabcurrent";
                                    e.preventDefault();
                                    cmg.tablistId = request.curTab.index;
                                }
                                break;
                        }
                    });

                    if (e.wheelDeltaY < 0) {
                        var _tabobj = window.top.document.getElementsByClassName("crxmousetablisttab");
                        for (var i = 0; i < _tabobj.length; i++) {
                            if (_tabobj[i].id == "crxmousetablisttabcurrent") {
                                _tabobj[i].id = "";
                                if (i + 1 == _tabobj.length) {
                                    if (cmg.valuetablistVisual) {
                                        _tabobj[0].id = "crxmousetablisttabcurrent";
                                    }
                                    cmg.tablistId = 0;
                                }
                                else {
                                    cmg.tablistId = i + 1;
                                    if (cmg.valuetablistVisual) {
                                        _tabobj[i + 1].id = "crxmousetablisttabcurrent";
                                    } else {
                                        break;
                                    }
                                }
                                var _tabListHold = window.top.document.getElementById("crxmousetablist");
                                if (i * 28 > _tabListHold.style.height) {
                                    _tabListHold.scrollTop = i * 28 - _tabListHold.style.height;
                                } else {
                                    _tabListHold.scrollTop = 0;
                                }
                                break;
                            }
                        }
                    }
                    else if (e.wheelDeltaY > 0) {
                        var _tabobj = window.top.document.getElementsByClassName("crxmousetablisttab");
                        for (var i = 0; i < _tabobj.length; i++) {
                            if (_tabobj[i].id == "crxmousetablisttabcurrent") {
                                _tabobj[i].id = "";
                                if (i == 0) {
                                    if (cmg.valuetablistVisual) {
                                        _tabobj[_tabobj.length - 1].id = "crxmousetablisttabcurrent";
                                    }
                                    cmg.tablistId = _tabobj.length - 1;
                                }
                                else {
                                    cmg.tablistId = i - 1;
                                    if (cmg.valuetablistVisual) {
                                        _tabobj[i - 1].id = "crxmousetablisttabcurrent";
                                    } else {
                                        break;
                                    }
                                }
                                var _tabListHold = window.top.document.getElementById("crxmousetablist");
                                _tabListHold.scrollTop = (i - 1) * 28;
                                break;
                            }
                        }
                    }
                    e.preventDefault();
                    return;
                }

                if (cmg.valuessgsFastSwitch) {
                    chrome.runtime.sendMessage({
                        type: "fastSwitch",
                        direction: e.wheelDeltaY < 0,
                        rv: cmg.valuessgsReverseFS
                    });
                }

                if (cmg.toSGS) {
                    var lr;
                    var ud = "";
                    if (e.wheelDeltaY > 0) {
                        ud = "up"
                    }//else{ud="down"}
                    if (e.wheelDeltaY < 0) {
                        ud = "down"
                    }
                    lr = this.toSGS;

                    if (ud !== "") {
                        chrome.runtime.sendMessage({type: "scrollgesture", LR: lr, UD: ud}, function (response) {
                            cmg.transmsg = response;
                            cmg._gestureaction(response.action);
                        });
                        if (cmg.toSGS == "sgsright") {
                            cmg.sgstocancel = true;
                        }
                        e.preventDefault();
                        return;
                    }
                }

                /*smooth scroll*/
                if (tostop || !cmg.valuesmooth) {
                    return;
                }
                if (/BackCompat/i.test(document.compatMode)) {
                    var body_check = function () {
                        NotRoot = "";
                        /**/
                        Root = document.body;
                        if (!Root) {
                            setTimeout(body_check, 100);
                        }
                    };
                    body_check();
                } else {
                    NotRoot = document.body;
                    Root = document.documentElement;
                }

                var LOG_SEC = Math.log(1000);
                var target = e.target, targets = this._scroll_targets, scroll_object;
                var dir = e.wheelDeltaY > 0 ? 'up' : 'down';
                if (document.TEXT_NODE === target.nodeType) {
                    target = target.parentElement;
                }
                do {
                    if (!targets.some(function (_so) {
                            if (_so.target === target) {
                                scroll_object = _so;
                                return true;
                            }
                        })) {
                        if (target.clientHeight > 0 && (target.scrollHeight - target.clientHeight) > 16 && target !== NotRoot) {
                            var overflow = getComputedStyle(target, "").getPropertyValue("overflow");
                            if (overflow === 'scroll' || overflow === 'auto' || (target.tagName === Root.tagName && overflow !== 'hidden')) {
                                scroll_object = new SmoothScrollByElement(target);
                                targets.push(scroll_object);
                            }
                        }
                    }
                    if (scroll_object && scroll_object.isScrollable(dir)) {
                        var x = -e.wheelDeltaX, y = -e.wheelDeltaY;
                        if (true) {
                            var AccelerationValue = cmg.valuescrollaccele//20//this.config.AccelerationValue;
                            var prev = this.prev_scroll_time || 0;
                            var now = this.prev_scroll_time = Date.now();
                            var accele = (1 - Math.min(Math.log(now - prev + 1), LOG_SEC) / LOG_SEC) * AccelerationValue + 1;
                            x *= accele;
                            y *= accele;
                        }
                        var ax = Math.abs(x), ay = Math.abs(y);
                        scroll_object.scroll(x, y, Math.log(Math.max(ax, ay)) * (1.1 - cmg.valuescrollspeed * 0.1)/*this.config.ScrollSpeedValue*/ * 100);
                        /*scroll speed*/
                        e.preventDefault();
                        return;
                    }
                } while (target = target.parentElement);
                break;
        }
    },
    _startGuesture: function (e) {
        if (testdrag) {
            return;
        }
        this._lastX = e.clientX;
        this._lastY = e.clientY;
        this._directionChain = "";
        this.startX = e.clientX;
        this.startY = e.clientY;
    },
    _progressGesture: function (e) {
        if(e.which === 3 && !escListenerAdded) {
            document.body.addEventListener('keyup',cmg._cancelGesture);
            escListenerAdded = true;
        }
        if (testdrag) {
            return;
        }
        if (cmg._toautocancel) {
            return;
        }
        if (cmg.valuestenable && !this.Ging && window.getSelection().toString().length > 0) {
            return;
        }
        if (!cmg.valuestenable && cmg.valuegeskey == "left") {
            document.getSelection().removeAllRanges();
        }
        var x = e.clientX;
        var y = e.clientY;
        var dx = Math.abs(x - this._lastX);
        var dy = Math.abs(y - this._lastY);
        if (dx > 5 || dy > 5) {
            if (cmg.valuegestureui && (cmg.valuestroke || teststroke)) {
                if (!document.getElementById("svgdivjlgkpaicikihijadgifklkbpdajbkhjo")) {
                    var svgdiv = this.svgdiv = document.createElement("div");
                    svgdiv.id = "svgdivjlgkpaicikihijadgifklkbpdajbkhjo";
                    svgdiv.style.width = window.innerWidth + 'px';
                    svgdiv.style.height = window.innerHeight + 'px';

                    /**/
                    svgdiv.style.position = "fixed";
                    svgdiv.style.left = "0px";
                    svgdiv.style.top = "0px";
                    svgdiv.style.display = "block";
                    svgdiv.style.zIndex = 1000000;
                    svgdiv.style.background = "transparent";
                    svgdiv.style.border = "none";

                    var SVG = 'http://www.w3.org/2000/svg';
                    var svgtag = this.svgtag = document.createElementNS(SVG, "svg");
                    svgtag.style.position = "absolute";
                    svgtag.style.height = window.innerHeight;
                    svgtag.style.width = window.innerWidth;
                    svgtag.style.left = 0;
                    svgtag.style.right = 0;
                    var polyline = document.createElementNS(SVG, 'polyline');
                    polyline.style.stroke = cmg.valuestrokecolor;//"rgb(18,89,199)";
                    polyline.style.strokeOpacity = cmg.valuestrokeopa;
                    polyline.style.strokeWidth = cmg.valuestrokewidth;
                    polyline.style.fill = "none";
                    polyline.setAttribute('stroke', 'rgba(18,89,199,0.8)');
                    polyline.setAttribute('stroke-width', '2');
                    polyline.setAttribute('fill', 'none');
                    this.polyline = polyline;

                    //svgtag.appendChild(defstag);
                    svgtag.appendChild(polyline);
                    svgdiv.appendChild(svgtag);
                    (document.body || document.documentElement).appendChild(svgdiv);
                }
                this.startX = e.clientX;
                this.startY = e.clientY;
                var p = this.svgtag.createSVGPoint();
                p.x = this.startX;
                p.y = this.startY;
                this.polyline.points.appendItem(p);
            }
        }
        if (dx < cmg.valueminlength && dy < cmg.valueminlength) {
            return;
        }

        var direction;
        if (dx > dy) {
            direction = x < this._lastX ? "L" : "R";
        }
        else {
            direction = y < this._lastY ? "U" : "D";
        }
        var lastDirection = this._directionChain.charAt(this._directionChain.length - 1);

        if (direction != lastDirection) {
            this._directionChain += direction;
            this.Ging = true;
            cmg.tolerance = 20;

            if (!document.getElementById("infoshowjlgkpaicikihijadgifklkbpdajbkhjo") && (teststroke || (cmg.valuegestureui && (cmg.valuedirect || cmg.valuetooltip)))) {
                // add info message(arrows + gestures names)

                var _infoshow = document.createElement("div");
                _infoshow.id = "infoshowjlgkpaicikihijadgifklkbpdajbkhjo";
                _infoshow.style.width = Math.min(document.documentElement.scrollWidth, window.innerWidth) + "px";
                _infoshow.style.height = Math.max(document.documentElement.scrollHeight, window.innerHeight) + "px";

                /**/
                _infoshow.style.background = "transparent";
                _infoshow.style.position = "fixed";
                _infoshow.style.left = 0;
                _infoshow.style.top = 0;
                _infoshow.style.textAlign = "center";
                _infoshow.style.cssText += "z-index:10000 !important";

                document.body.appendChild(_infoshow);

                var dirStyleStr = "", tipStyleStr = "",
                    centerMGtop = (window.innerHeight / 5) * 2 + "px",
                    bottomMG = 0;
                fixedPos = "position:fixed;";
                switch (cmg.valueggesPos) {
                    case "tl":
                        dirStyleStr = "margin-top:0;margin-left:0; left:0; top:0;";
                        tipStyleStr = dirStyleStr + "margin-top:45px;";
                        break;
                    case "tc":
                        dirStyleStr = "margin:0  auto; top:0;display: inline-block;";
                        tipStyleStr = dirStyleStr + "margin-top:45px;";
                        break;
                    case "tr":
                        dirStyleStr = "top:0;right:0;margin-right: 0;";
                        tipStyleStr = dirStyleStr + "margin-top:45px;";
                        break;
                    case "cl":
                        dirStyleStr = "left:0;margin-left:0;margin-top:" + centerMGtop;
                        tipStyleStr = dirStyleStr;
                        break;
                    case "cc":
                        dirStyleStr = "margin-left:auto; margin-right:auto;margin-top:" + centerMGtop;
                        tipStyleStr = dirStyleStr;
                        break;
                    case "cr":
                        dirStyleStr = "right:0;margin-right:0;margin-top:" + centerMGtop;
                        tipStyleStr = dirStyleStr;
                        break;
                    case "bl":
                        dirStyleStr = "bottom:0;left:0;margin-left:0;" + fixedPos;
                        tipStyleStr = dirStyleStr;
                        break;
                    case "bc":
                        dirStyleStr = "bottom:0;margin:0 auto;" + fixedPos;
                        tipStyleStr = dirStyleStr;
                        break;
                    case "br":
                        dirStyleStr = "bottom:0;right:0;margin-right: 0;" + fixedPos;
                        tipStyleStr = dirStyleStr;
                        break;
                }

                var _dirshow = document.createElement("div");
                _dirshow.id = "dirshowjlgkpaicikihijadgifklkbpdajbkhjo";
                _dirshow.style.backgroundColor = "#" + cmg.valuedirectcolor;
                _dirshow.style.opacity = cmg.valuedirectopa;
                _dirshow.style.borderRadius = "3px";
                _dirshow.style.minWidth = "138px";
                _dirshow.setAttribute("style", _dirshow.getAttribute("style") + dirStyleStr);
                _dirshow.style.textAlign = "center";
                document.getElementById("infoshowjlgkpaicikihijadgifklkbpdajbkhjo").appendChild(_dirshow);

                // add gesture name message
                if (cmg.valuetooltip || teststroke) {
                    var _tipshow = document.createElement("div");
                    _tipshow.id = "tipshowjlgkpaicikihijadgifklkbpdajbkhjo";
                    _tipshow.style.fontSize = cmg.valuetooltipwidth + "px";//"18px";
                    _tipshow.style.color = "#" + cmg.valuetooltipcolor;//"rgba(0,255,0,.9)"
                    _tipshow.style.opacity = cmg.valuetooltipopa;
                    _tipshow.style.backgroundColor = "transparent";
                    _tipshow.style.textAlign = "center";
                    _tipshow.style.fontWeight = "bold";
                    _dirshow.appendChild(_tipshow);
                }
                if (!location.href.includes(chrome.extension.getURL("options.html")) && !cmg.hidetrash) {
                    let _trashshow = document.createElement("div");
                    let _trashshowchild = document.createElement("div");
                    _trashshowchild.innerHTML = chrome.i18n.getMessage('cancelgesture');
                    _trashshowchild.style.marginBottom = "5px";
                    _trashshow.append(_trashshowchild);
                    _trashshow.id = "trashshowjlgkpaicikihijadgifklkbpdajbkhjo";
                    _trashshow.style.backgroundColor = "#" + cmg.valuedirectcolor;
                    let _trashspan = document.createElement("span");
                    _trashspan.id = "trashspanjlgkpaicikihijadgifklkbpdajbkhjo";
                    let _trashspanchild = document.createElement("span");
                    _trashspan.append(_trashspanchild);
                    document.body.appendChild(_trashspan);
                    document.body.appendChild(_trashshow);
                }

            }

            /**/
            if ((cmg.valuedirect || teststroke) && document.getElementById("dirshowjlgkpaicikihijadgifklkbpdajbkhjo")) {
                var _dirlength = this._directionChain.length;
                document.getElementById("dirshowjlgkpaicikihijadgifklkbpdajbkhjo").style.width = Math.min(32 * (_dirlength + 1), window.innerWidth) + "px";
                document.getElementById("dirshowjlgkpaicikihijadgifklkbpdajbkhjo").style.paddingTop = "3px";
                if (cmg.fixPaddingBottom) {
                    document.getElementById("dirshowjlgkpaicikihijadgifklkbpdajbkhjo").style.paddingBottom = "3px";
                }
                var _showimg = document.createElement("img");
                _showimg.style.display = "inline";
                _showimg.src = chrome.extension.getURL("") + "image/" + direction.toLowerCase() + ".png";
                var dirShowDiv = document.getElementById("dirshowjlgkpaicikihijadgifklkbpdajbkhjo");
                var tipShowDiv = document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo");
                if (cmg.valuetooltip) {
                    dirShowDiv.insertBefore(_showimg, document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo"));
                } else {
                    dirShowDiv.appendChild(_showimg);
                }
                //dirShowDiv.appendChild(_showimg);
                //hack for gesture position when bottom center
                if (cmg.valueggesPos == "bc") {
                    dirShowDiv.style.left = window.innerWidth / 2 - (dirShowDiv.offsetWidth / 2) + "px";
                    tipShowDiv.style.left = window.innerWidth / 2 - (tipShowDiv.offsetWidth / 2) + "px";
                }
            }
            /**/

            /***/
            if ((cmg.valuetooltip || teststroke) && document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo")) {
                chrome.runtime.sendMessage({
                    type: "tipshow",
                    direct: this._directionChain,
                    tiptype: "gesture"
                }, function (response) {
                    if (response.moreDes != "none") {
                        document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo").innerHTML = response.moreDes;
                    }
                    else {
                        document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo").innerHTML = "";
                    }
                })
            }
        }

        /*autocancel*/
        if (cmg.valueautocancel) {
            cmg._toautocancel = false;
            window.clearTimeout(autocanceltimer);
            autocanceltimer = window.setTimeout(function () {
                cmg._toautocancel = true;
                cmg._stopGuesture();
            }, cmg.valueautocancelvalue * 1000)
        }


        this._lastX = e.clientX;
        this._lastY = e.clientY;

    },
    _stopGuesture: function (e) {
        if (cmg._strokeclear()) {

            /*auto cancel*/
            if (cmg._toautocancel) {
                this._cancelmenu = true;
                /*cmg._toautocancel=false;*/
                this._directionChain = "";
                this._suppressContext = false;
                //this.toGesture="";
                direction = "";
                if (this.toGesture != "right") {
                    this.toGesture = ""
                }
                return;
            }
            else {
                window.clearTimeout(autocanceltimer);
            }

            var _actionback;
            // if we have directions chain and the user decide to cancel using ESC / drop in trash
            if (this._directionChain && !cmg._toCancelGesture) {
                this._cancelmenu = true;
                _actionback = cmg._performAction(e);
                this._directionChain = "";
                this._suppressContext = false;
                this.toGesture = "";
                direction = "";
            }
            else {
                if (cmg._toCancelGesture) {
                    const action = cmg._toCancelGestureAction;
                    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Cancel Gesture", gaAction: cmg._toCancelGestureType === "trash" ? "Trash bin" : "Esc", gaLabel: action !== "" ? `${action}-${location.origin}` : "null"});
                    cmg._toCancelGestureType = null;
                    cmg._toCancelGestureAction = null;
                    escListenerAdded = false;
                    document.body.removeEventListener('keyup', cmg._cancelGesture);
                }
                cmg._toCancelGesture = false;
                this._directionChain = "";
                this._suppressContext = false;
                this.toGesture = "";
                direction = "";
                return false;
            }
            return _actionback !== false;

        }

    },
    _performAction: function (e) {
        if (teststroke) {
            optdirect = this._directionChain;
            FnAdd("gesture", "gesture");
            return
        }
        chrome.runtime.sendMessage({type: "gesture", direct: this._directionChain}, function (response) {
            if(response === null) {
                return;
            }
            cmg.transmsg = response;
            cmg._gestureaction(response.action, response.whitelist);
        });
    },
    _dragstart: function (e) {
        if (testgesture) {
            return;
        }
        if (teststroke) {
            document.getElementById("addbox").removeChild(document.getElementById("adddirect"));
        }
        this._lastX = e.clientX;
        this._lastY = e.clientY;
        this._directionChain = "";
        this.startX = e.clientX;
        this.startY = e.clientY;

        /*set dragtype*/
        if (cmg.valueimgfirstcheck) {
            cmg.imgfirst = true;
        }
        this._dragType = "";
        switch (e.target.nodeType) {
            case 3:
                var isLink = e.target.parentNode.href;
                if (cmg.valuedragtext && !isLink) {
                    this._dragType = "text";
                } else if (isLink) {
                    e = e.target.parentNode;
                    this._dragType = "link";
                }
                break;
            case 1:
                if (e.target.value && cmg.valuedragtext && cmg.valuedraginput) {
                    this._dragType = "text";
                }
                else if (e.target.href) {
                    if (window.getSelection().toString() == ""
                        || e.target.textContent.length > window.getSelection().toString().length) {
                        if (cmg.valuedraglink) {
                            this._dragType = "link";
                        }
                    }
                    else {
                        if (cmg.valuedragtext) {
                            this._dragType = "text"
                        }
                    }
                    if (!cmg.valuedragtext && cmg.valuedraglink) {
                        this._dragType = "link";
                    }
                }
                else if (e.target.src) {
                    if (e.target.parentNode.href/*&&(!e[cmg.valueimgfirst+"Key"]||!cmg.valueimgfirstcheck)*/) {
                        if (cmg.valuedragimage && (e[cmg.valueimgfirst + "Key"] || cmg.valueimgfirstcheck)) {
                            this._dragType = "image"
                        }
                        else if (cmg.valuedraglink) {
                            this._dragType = "link";
                            e = e.target.parentNode;
                        }

                    }
                    else if (cmg.valuedragimage) {
                        this._dragType = "image"
                    }
                }
                break;
        }

        if (!this._dragType) {
            this.toDrag = false;
            return;
        }
        cmg._seltext = e.target.innerText || window.getSelection().toString() || e.target.innerHTML;
        cmg._sellink = e.href || e.target.href;
        cmg._selimg = e.target.src;
        if (cmg.valuesetdragurl && this._dragType == "text") {
            var tolink;
            if (cmg._seltext.indexOf("http://") != 0
                && cmg._seltext.indexOf("https://") != 0
                && cmg._seltext.indexOf("ftp://") != 0
                && cmg._seltext.indexOf("rtsp://") != 0
                && cmg._seltext.indexOf("mms://") != 0
                && cmg._seltext.indexOf("chrome-extension://") != 0
                && cmg._seltext.indexOf("chrome://") != 0) {
                tolink = "http://" + cmg._seltext;
            }
            else {
                tolink = cmg._seltext;
            }
            var urlreg = /^((chrome|chrome-extension|ftp|http(s)?):\/\/)([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
            if (urlreg.test(tolink)) {
                this._dragType = "link";
                cmg._sellink = tolink;
            }
        }
    },
    _dragprogress: function (e) {

        if (testgesture) {
            return;
        }
        if (cmg._toautocancel) {
            return;
        }

        /*drag ui ready*/
        if (!document.getElementById("infoshowjlgkpaicikihijadgifklkbpdajbkhjo")
            && !document.getElementById("trashshowjlgkpaicikihijadgifklkbpdajbkhjo")
            && (teststroke || (cmg.valuedragui && (cmg.valueddirect || cmg.valuedtooltip)))) {
            var _infoshow = document.createElement("div");
            _infoshow.id = "infoshowjlgkpaicikihijadgifklkbpdajbkhjo";
            _infoshow.style.width = Math.min(document.documentElement.scrollWidth, window.innerWidth) + "px";
            _infoshow.style.height = Math.max(document.documentElement.scrollHeight, window.innerHeight) + "px";

            /**/
            _infoshow.style.background = "transparent";
            _infoshow.style.position = "fixed";
            _infoshow.style.left = 0;
            _infoshow.style.top = 0;
            _infoshow.style.textAlign = "center";
            _infoshow.style.cssText += "z-index:-1 !important";

            if (cmg.valueddirect || teststroke) {
                var _dirshow = document.createElement("div");
                _dirshow.id = "dirshowjlgkpaicikihijadgifklkbpdajbkhjo";
                _dirshow.style.backgroundColor = "#" + cmg.valueddirectcolor;//"rgba(0,0,0,.5)";
                _dirshow.style.opacity = cmg.valueddirectopa;
                _dirshow.style.marginTop = (window.innerHeight / 5) * 2 + "px"

                /**/
                _dirshow.style.borderRadius = "3px";
                _dirshow.style.marginLeft = "auto";
                _dirshow.style.marginRight = "auto";
                _dirshow.style.textAlign = "center";

                _infoshow.appendChild(_dirshow);
            }

            if (cmg.valuedtooltip || teststroke) {
                var _tipshow = document.createElement("div");
                _tipshow.id = "tipshowjlgkpaicikihijadgifklkbpdajbkhjo";
                _tipshow.style.fontSize = cmg.valuedtooltipwidth + "px";//"18px";
                _tipshow.style.opacity = cmg.valuedtooltipopa;
                _tipshow.style.color = "#" + cmg.valuedtooltipcolor//"rgba(0,255,0,.9)"

                /**/
                _tipshow.style.background = '#' + cmg.valueddirectcolor;
                _tipshow.style.textAlign = "center";
                _tipshow.style.fontWeight = "bold";

                if (!cmg.valueddirect) {
                    if (teststroke) {
                        _tipshow.style.marginTop = ""
                    } else {
                        _tipshow.style.marginTop = (window.innerHeight / 5) * 2 + 35 + "px";
                    }
                }
                else {
                    _tipshow.style.cssText += "margin-top:5px !important";
                }
                _infoshow.appendChild(_tipshow);
            }
            document.getElementsByTagName("body")[0].appendChild(_infoshow);
            if (!location.href.includes(chrome.extension.getURL("options.html")) && !cmg.hidetrash) {
                let _trashshow = document.createElement("div");
                let _trashshowchild = document.createElement("div");
                _trashshowchild.innerHTML = "Cancel";
                _trashshowchild.style.marginBottom = "5px";
                _trashshow.append(_trashshowchild);
                _trashshow.id = "trashshowjlgkpaicikihijadgifklkbpdajbkhjo";
                _trashshow.style.backgroundColor = "#" + cmg.valuedirectcolor;
                let _trashspan = document.createElement("span");
                _trashspan.id = "trashspanjlgkpaicikihijadgifklkbpdajbkhjo";
                let _trashspanchild = document.createElement("span");
                _trashspan.append(_trashspanchild);
                document.body.appendChild(_trashspan);
                document.body.appendChild(_trashshow);
            }
        }

        var x = e.clientX;
        var y = e.clientY;
        var dx = Math.abs(x - this._lastX);
        var dy = Math.abs(y - this._lastY);

        if (dx < cmg.valueminlength || dy < cmg.valueminlength) {
            if (cmg.valuedragui && (cmg.valuedstroke || teststroke)/*&&document.getElementById("crxmousecanvas")*/) {
                if (!document.getElementById("svgdivjlgkpaicikihijadgifklkbpdajbkhjo")) {
                    var svgdiv = this.svgdiv = document.createElement("div");
                    svgdiv.id = "svgdivjlgkpaicikihijadgifklkbpdajbkhjo";
                    svgdiv.style.width = window.innerWidth + 'px';
                    svgdiv.style.height = window.innerHeight + 'px';

                    /**/
                    svgdiv.style.position = "fixed";
                    svgdiv.style.left = "0px";
                    svgdiv.style.top = "0px";
                    svgdiv.style.display = "block";
                    svgdiv.style.zIndex = 1000000;
                    svgdiv.style.background = "transparent";
                    svgdiv.style.border = "none";

                    var SVG = 'http://www.w3.org/2000/svg';
                    var svgtag = this.svgtag = document.createElementNS(SVG, "svg");
                    svgtag.style.position = "absolute";
                    svgtag.style.height = window.innerHeight;
                    svgtag.style.width = window.innerWidth;
                    svgtag.style.left = 0;
                    svgtag.style.right = 0;
                    var polyline = document.createElementNS(SVG, 'polyline');
                    polyline.style.stroke = cmg.valuedstrokecolor;//"rgb(18,89,199)";
                    polyline.style.strokeOpacity = cmg.valuedstrokeopa;
                    polyline.style.strokeWidth = cmg.valuedstrokewidth;
                    polyline.style.fill = "none";
                    polyline.setAttribute('stroke', 'rgba(18,89,199,0.8)');
                    polyline.setAttribute('stroke-width', '2');
                    polyline.setAttribute('fill', 'none');

                    this.polyline = polyline;
                    svgtag.appendChild(polyline);
                    svgdiv.appendChild(svgtag);
                    (document.body || document.documentElement).appendChild(svgdiv);
                }
                this.startX = e.clientX;
                this.startY = e.clientY;
                var p = this.svgtag.createSVGPoint();
                p.x = this.startX;
                p.y = this.startY;
                this.polyline.points.appendItem(p);
            }
        }

        if (dx < cmg.valueminlength && dy < cmg.valueminlength) {
            return;
        }

        var direction;
        if (dx > dy) {
            direction = x < this._lastX ? "L" : "R";
        } else {
            direction = y < this._lastY ? "U" : "D";
        }
        var lastDirection = this._directionChain.charAt(this._directionChain.length - 1);
        if (direction != lastDirection) {
            this._directionChain += direction;

            if (teststroke) {
                if (document.getElementById("adddirect")) {
                } else {
                    var _adddirectobj = document.createElement("div");
                    _adddirectobj.id = "adddirect";
                    document.getElementById("addbox").insertBefore(_adddirectobj, document.getElementById("addbutton"));
                }
            }

            /**/
            if ((cmg.valueddirect || teststroke) && document.getElementById("dirshowjlgkpaicikihijadgifklkbpdajbkhjo")) {
                var _dirlength = this._directionChain.length;
                document.getElementById("dirshowjlgkpaicikihijadgifklkbpdajbkhjo").style.width = Math.min(32 * (_dirlength + 1), window.innerWidth) + "px";
                document.getElementById("dirshowjlgkpaicikihijadgifklkbpdajbkhjo").style.paddingTop = "3px";
                if (cmg.fixPaddingBottom) {
                    document.getElementById("dirshowjlgkpaicikihijadgifklkbpdajbkhjo").style.paddingBottom = "3px";
                }
                var _showimg = document.createElement("img");
                _showimg.src = chrome.extension.getURL("") + "image/" + direction.toLowerCase() + ".png";
                document.getElementById("dirshowjlgkpaicikihijadgifklkbpdajbkhjo").appendChild(_showimg);
            }
            /**/

            /***/
            if ((cmg.valuedtooltip || teststroke) && document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo")) {
                var sendmsg = {};
                sendmsg.type = "tipshow";
                sendmsg.direct = this._directionChain;
                sendmsg.tiptype = this._dragType;
                sendmsg.seltext = this._seltext;
                sendmsg.sellink = this._sellink;
                sendmsg.selimg = this._selimg;

                if (this._dragType) {
                    chrome.runtime.sendMessage(sendmsg, function (response) {
                        if (response.moreDes != "none") {
                            document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo").innerHTML = response.moreDes;
                        }
                        else {
                            document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo").innerHTML = "";
                        }
                    })
                }

            }
            if ((cmg.valueddirect || cmg.valuedtooltip || teststroke) && document.getElementById("infoshowjlgkpaicikihijadgifklkbpdajbkhjo")) {
                document.getElementById("infoshowjlgkpaicikihijadgifklkbpdajbkhjo").style.cssText += "z-index:100000 !important"
            }
        }

        /*autocancel*/
        if (cmg.valueautocancel) {
            cmg._toautocancel = false;
            window.clearTimeout(autocanceltimer);
            autocanceltimer = window.setTimeout(function () {
                cmg._toautocancel = true;
                cmg._dragStop();
            }, cmg.valueautocancelvalue * 1000)
        }
        this._lastX = e.clientX;
        this._lastY = e.clientY;
    },
    _dragend: function (e) {
        cmg._toautocancel = false;
        if (this._directionChain.length > 0) {
            e.preventDefault();
        }
        this._dragStop(e);
    },
    _dragStop: function (e) {
        if (cmg._strokeclear()) {
            /*auto cancel*/
            if (cmg._toautocancel) {
                this._cancelmenu = true;
                /*cmg._toautocancel=false;*/
                this._directionChain = "";
                this._suppressContext = false;
                this.toGesture = "";
                direction = "";
                return;
            }
            else {
                window.clearTimeout(autocanceltimer);
            }
            if (this._directionChain && !cmg._toCancelDragGesture) {
                this._dragAction(e);
            } else if(this._directionChain && cmg._toCancelDragGesture) {
                const action = cmg._toCancelGestureAction;
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Cancel Gesture", gaAction: "Trash bin", gaLabel: (action !== "") ? `${action}-${location.origin}` : "null"});
            }
            this._toCancelDragGesture = false;
            this._toCancelGestureAction = null
            this.direction = "";
            this._directionChain = "";
            this._suppressContext = false;
            this.toGesture = "";
        }
    },
    _dragAction: function (e) {

        if(!cmg.clickedOptin) {
            chrome.runtime.sendMessage({type: "openMakeASelectionOverlay"});
            return;
        }


        if (teststroke) {
            optdirect = this._directionChain;
            if (this._dragType) {
                FnAdd("drag", this._dragType);
            }
            return
        }

        chrome.runtime.sendMessage({type: this._dragType, direct: this._directionChain}, function (response) {
            if(!response) {
                return;
            }
            response.type = "backToFn";
            response.seltext = cmg._seltext;
            response.sellink = cmg._sellink;
            response.selimg = cmg._selimg;


            if(isWrongGestureOnboarding(dragGestures, response.action, response.direct, response.selimg)) {
                return;
            }

            chrome.runtime.sendMessage(response/*,function(res){alert(res.id)}*/);

        });
    },
    _strokeclear: function () {
        if (CMGstroketest) {
            return true;
        }

        if (document.getElementById("crxmousecanvas")) {
            document.getElementById("crxmousecanvas").parentNode.removeChild(document.getElementById("crxmousecanvas"))
        }
        if (document.getElementById("svgdivjlgkpaicikihijadgifklkbpdajbkhjo")) {
            document.getElementById("svgdivjlgkpaicikihijadgifklkbpdajbkhjo").parentNode.removeChild(document.getElementById("svgdivjlgkpaicikihijadgifklkbpdajbkhjo"));
        }
        if (document.getElementById("infoshowjlgkpaicikihijadgifklkbpdajbkhjo")) {
            document.getElementById("infoshowjlgkpaicikihijadgifklkbpdajbkhjo").parentNode.removeChild(document.getElementById("infoshowjlgkpaicikihijadgifklkbpdajbkhjo"))
        }
        if (document.getElementById("trashshowjlgkpaicikihijadgifklkbpdajbkhjo")) {
            document.getElementById("trashshowjlgkpaicikihijadgifklkbpdajbkhjo").parentNode.removeChild(document.getElementById("trashshowjlgkpaicikihijadgifklkbpdajbkhjo"))
        }
        if (document.getElementById("trashspanjlgkpaicikihijadgifklkbpdajbkhjo")) {
            document.getElementById("trashspanjlgkpaicikihijadgifklkbpdajbkhjo").parentNode.removeChild(document.getElementById("trashspanjlgkpaicikihijadgifklkbpdajbkhjo"))
        }
        return true;
    },
    _gestureaction: function (act, whitelist) {

        if (whitelist && whitelist.length > 0) {
            if (!whitelist.some((e) => {

                    if (!e.match(/^[A-Za-z0-9\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\`\.%]+$/g))
                        return false;

                    return location.href.indexOf(e) > -1;
                })) {
                return;
            }
        }

        if(location.origin !== "chrome-extension://ebbnmoppemnnpjbgjhdgnlcbempodpdc") {
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Main KPIs", gaAction: "Gesture completed", gaLabel: act + "-" + location.origin});
            chrome.runtime.sendMessage({type: "shouldShowRateUsOverlay"});
        }
        //counting user events in the background scope, not interrupting the page flow:
        chrome.runtime.sendMessage({
            type: "count",
            data: {event: "gesture", url: location.href, action: act}
        });

        if(!cmg.clickedOptin) {
            chrome.runtime.sendMessage({type: "openMakeASelectionOverlay"});
            return;
        }

        if (isWrongGestureOnboarding(mouseGestures, act, '')) {
            return;
        }

        if(manipulateScrollGestureOnboarding(act)) {
            act = 'G_bottom';
        }


        switch (act) {

            case"G_none":
                return;
                break;
            case"G_back":
                window.history.go(-1);
                break;
            case"G_backhead":
                window.history.go(-window.history.length + 1);
                break;
            case"G_go":
                window.history.go(+1);
                break;
            case"G_stop":
                window.stop();
                break;
            case"G_goparent":
                if (location.hash) {
                    location.href = location.pathname + (location.search ? '?' + location.search : '');
                } else {
                    var paths = location.pathname.split('/');
                    var path = paths.pop();
                    if (!location.search && path === '') paths.pop();
                    location.href = paths.join('/') + '/';
                }
                break;
            case"G_down":
                if (window.document.height == window.innerHeight) {
                    var _alllength = 0
                } else {
                    var _alllength = window.innerHeight - 20;
                }

                if (!cmg.valuescrolleffects) {
                    window.scrollBy(document.documentElement.offsetLeft, _alllength);
                    return;
                }

                scrollTo(document.documentElement, document.documentElement.scrollTop + _alllength, 200, 1);
                break;
            case"G_up":
                if (window.document.height == window.innerHeight) {
                    var _alllength = 0
                } else {
                    var _alllength = window.innerHeight - 20;
                }

                if (!cmg.valuescrolleffects) {
                    window.scrollBy(document.documentElement.offsetLeft, -_alllength);
                    return;
                }

                scrollTo(document.documentElement, document.documentElement.scrollTop - _alllength, 200,-1);
                break;
            case"G_bottom":
                var _alllength = Math.max(document.body.offsetHeight, document.body.clientHeight, document.body.scrollHeight, document.documentElement.clientHeight, document.documentElement.offsetHeight, document.documentElement.scrollHeight) - window.innerHeight - window.pageYOffset + 50

                if (!cmg.valuescrolleffects) {
                    window.scrollBy(document.documentElement.offsetLeft, _alllength);
                    return;
                }
                scrollTo(document.documentElement, _alllength, 200,1);
                break;
            case"G_left":
                if (window.document.width == window.innerWidth) {
                    var _alllength = 0
                } else {
                    var _alllength = window.innerWidth - 20;
                }

                if (!cmg.valuescrolleffects) {
                    window.scrollBy(-_alllength, 0);
                    return;
                }

                var _length = 0;
                var _timer = window.setInterval(function () {
                    window.scrollBy(-20, 0);
                    _length += 20;
                    if (_length > _alllength) {
                        window.clearInterval(_timer);
                    }
                }, 5);
                break;
            case"G_right":
                if (window.document.width == window.innerWidth) {
                    var _alllength = 0
                } else {
                    var _alllength = window.innerWidth - 20;
                }

                if (!cmg.valuescrolleffects) {
                    window.scrollBy(_alllength, 0);
                    return;
                }

                var _length = 0;
                var _timer = window.setInterval(function () {
                    window.scrollBy(20, 0);
                    _length += 20;
                    if (_length > _alllength) {
                        window.clearInterval(_timer);
                    }
                }, 5);
                break;
            case"G_top":
                var _alllength = window.pageYOffset + 50;

                if (!cmg.valuescrolleffects) {
                    window.scrollBy(document.documentElement.offsetLeft, -_alllength);
                    return;
                }
                scrollTo(document.documentElement, 0, 200,-1);
                break;
            case"G_reloadframe":
                window.location.reload();
                break;
            case "G_ZoomIn":
                //var zoomLever = document.body.style.zoom;
                //if(zoomLever==""){
                //    zoomLever = 1;
                //}
                //document.body.style.zoom = parseFloat(zoomLever) + 0.1;
                chrome.runtime.sendMessage({type: "zoom", zoomIn: true});
                break;
            case "G_ZoomOut":
                //var zoomLever = document.body.style.zoom;
                //if(zoomLever==""){
                //    zoomLever = 1;
                //}
                //document.body.style.zoom = parseFloat(zoomLever) - 0.1;
                chrome.runtime.sendMessage({type: "zoom", zoomIn: false});
                break;

            case"G_tostop":
                tostop = true;
                break;
            case"G_userscript":
                try {
                    eval(cmg.transmsg.moreScript)
                } catch (error) {
                    alert(error);
                }
                break;
            case"G_trynext":
            case"G_tryprev":
                var _needbreak = _needbreak2 = false;

                var htmlchar = ["&nbsp;", "&lt;", "&gt;", "&amp;", "&quot;"];
                var htmlinner = [" ", "<", ">", "&", "\""];
                var _innerobj = [];


                var matchobj = document.getElementsByTagName("a");
                var matchwords = cmg.transmsg.moreMatch.split("|");

                for (var i = 0; i < matchobj.length; i++) {
                    _innerobj[i] = matchobj[i].innerHTML
                    for (var j = 0; j < htmlchar.length; j++) {
                        function _objreplace() {
                            if (_innerobj[i].indexOf(htmlchar[j]) != -1) {
                                _innerobj[i] = _innerobj[i].replace(htmlchar[j], htmlinner[j]);
                                _objreplace();
                            }
                        }

                        _objreplace();
                    }
                }

                for (var i = matchobj.length - 1; i > 0; i--) {
                    for (var ii = 0; ii < matchwords.length; ii++) {
                        var _matchclass = [];
                        if (!matchobj[i].className) {
                        }
                        else {
                            _matchclass = matchobj[i].className.split(" ");
                        }

                        if (matchobj[i].rel == matchwords[ii]
                            || matchobj[i].rev == matchwords[ii]
                            || matchobj[i].id == matchwords[ii]
                            || _innerobj[i] == matchwords[ii]
                            || matchobj[i].title == matchwords[ii]
                        /*||matchobj[i].className.indexOf(matchwords[ii])!=-1*/) {
                            cmg.transmsg.transurl = matchobj[i].href;
                            cmg.transmsg.type = "backToFn";
                            cmg.transmsg.action = "G_trynextto";
                            chrome.runtime.sendMessage(cmg.transmsg);
                            _needbreak = true;
                            break;
                        }

                        for (var iii = 0; iii < _matchclass.length; iii++) {
                            if (_matchclass[iii] == matchwords[ii]) {
                                cmg.transmsg.transurl = matchobj[i].href;
                                cmg.transmsg.type = "backToFn";
                                cmg.transmsg.action = "G_trynextto";
                                chrome.runtime.sendMessage(cmg.transmsg);
                                _needbreak2 = true;
                                break;
                            }
                        }
                        if (_needbreak2) {
                            _needbreak = true;
                            break;
                        }

                    }
                    if (_needbreak) {
                        break;
                    }
                }
                break;

            /*will back*/
            default:
                cmg.transmsg.type = "backToFn";
                chrome.runtime.sendMessage(cmg.transmsg);
                break;
        }

    },
    _cancelGesture: function(e) {
        const action = document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo") && document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo").innerHTML;
        cmg._toCancelGestureAction = action;
        if(e.target.id === "trashspanjlgkpaicikihijadgifklkbpdajbkhjo" &&  !cmg._toCancelGesture) {
            e.preventDefault();
            e.stopPropagation();
            cmg._toCancelGesture = true;
            cmg._toCancelGestureType = "trash";
        }
        else if(e.keyCode === escKeyCode && !cmg._toCancelGesture) {
            e.preventDefault();
            e.stopPropagation();
            cmg._toCancelGesture = true;
            cmg._toCancelGestureType = "esc";
            cmg._stopGuesture(e);
            document.body.removeEventListener('keyup', cmg._cancelGesture);
        }
    },
    _setToCancelDragGesture: function(toCancelDragGesture) {
        const action = document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo") && document.getElementById("tipshowjlgkpaicikihijadgifklkbpdajbkhjo").innerHTML;
        cmg._toCancelGestureAction = action;
        cmg._toCancelDragGesture = toCancelDragGesture;
    }
};

function getConfig(cfg1, cfg2, responseConfig) {
    return (optpages)? config[cfg1][cfg2] : responseConfig[cfg1][cfg2];
}

function easeOutQuart(t, b, c, d) {
    return -c * ((t = t / d - 1) * t * t * t - 1) + b;
}


function SmoothScrollByElement(target) {
    this.target = target;

    switch (browserParser.browserName.toLowerCase()) {
        case "chrome":
            if (browserParser.majorVersion < 61) {
                this._target = target === document.documentElement ? document.body : target;
            } else {
                this._target = target === document.documentElement ? document.documentElement : target;
            }
            break;
        default:
            this._target = target === document.documentElement ? document.documentElement : target;
    }

}

SmoothScrollByElement.noSmooth = function () {
    SmoothScrollByElement.prototype.scroll = function (_x, _y) {
        var self = this, target = this._target;
        target.scrollLeft += _x;
        target.scrollTop += _y;
    };
};
SmoothScrollByElement.prototype = {
    scroll: function (_x, _y, _duration) {
        var self = this, target = this.target, _target = this._target, isDown = _y > 0;
        if (self.timer >= 0) {
            _x += self.X - _target.scrollLeft;
            _y += self.Y - _target.scrollTop;
            self.fin();
        }
        var x = _target.scrollLeft;
        var y = _target.scrollTop;
        self.X = _x + x;
        self.Y = _y + y;
        var duration = _duration || 400;
        var easing = easeOutQuart;
        var begin = Date.now();
        self.fin = function () {
            clearInterval(self.timer);
            self.timer = void 0;
        };
        self.timer = setInterval(scroll, 10);
        function scroll() {
            var now = Date.now();
            var time = now - begin;
            if (time > duration || (!isDown && _target.scrollTop === 0) || (isDown && (_target.scrollTop + target.clientHeight + 16 >= target.scrollHeight))) {
                self.fin();
                _target.scrollLeft = x + _x;
                _target.scrollTop = y + _y;
                return;
            }
            var prog_x = easing(time, x, _x, duration);
            var prog_y = easing(time, y, _y, duration);
            _target.scrollLeft = prog_x;
            _target.scrollTop = prog_y;
        }
    },
    isScrollable: function (dir) {
        var self = this, target = this.target, _target = this._target;
        if (target.clientHeight <= target.scrollHeight) {
            if (dir === 'down') {
                if ((_target.scrollTop + target.clientHeight) < target.scrollHeight) {
                    return true;
                }
            } else if (dir === 'up' && _target.scrollTop > 0) {
                return true;
            }
        }
        return false;
    }
};


chrome.runtime.sendMessage({type: "config"}, function (response) {
    if (optpages) {
        window.setInterval(function () {
            if (needToInit) {
                needToInit = false;
                cmg.constinit(response);
            }
        }, 500)
    }

    cmg.constinit(response);
    chrome.storage.sync.get("blackList", function (i) {
        var blackList = i.blackList, find = false;
        if (blackList) {
            var domain = extractDomain(location.href);
            $.each(blackList, function (i, b) {
                if (domain === b) {
                    find = true;
                    return false;
                }
            });
            if (!find) {
                cmg.init();
            }
        } else {
            cmg.init();
        }
    });

});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === "toggleShutdownGesturesOptions") {
            handleCRXDisabledOptions(request.isGesturesOff, request.backup);
        }
        if (request.type === "toggleShutdownGesturesEvent") {
            cmg.constinit(request.config);
            cmg.init();
        }

        if (request.type === "madeASelectionOptinEvent") {
            const makeASelectionOverlay = document.getElementById('crxMouseOptedoutOverlay');
            if(makeASelectionOverlay) {
                makeASelectionOverlay.parentElement.removeChild(makeASelectionOverlay);
            }
            cmg.clickedOptin = true;
        }

        if (request.notifitype == "bookmark"
            || request.notifitype == "isave"
            || request.notifitype == "isaveback") {
            addnotifibox();
            window.setTimeout(function () {
                if (document.getElementById("notifiboxjlgkpaicikihijadgifklkbpdajbkhjo")) {
                    document.getElementById("notifiboxjlgkpaicikihijadgifklkbpdajbkhjo").parentNode.removeChild(document.getElementById("notifiboxjlgkpaicikihijadgifklkbpdajbkhjo"))
                }
            }, 2000)
        }
        if (request.cmd == "disabledRC") {
            //document.body.setAttribute("oncontextmenu", "return false");
            window.addEventListener('contextmenu', emptyRightClick, false);
        }
        function addnotifibox() {
            var _obj = document.getElementById("notifiboxjlgkpaicikihijadgifklkbpdajbkhjo");
            if (_obj) {
                _obj.parentNode.removeChild(_obj)
            }

            var notifidiv = document.createElement("div");
            notifidiv.style.left = window.innerWidth / 2 - 110 + "px";
            notifidiv.id = "notifiboxjlgkpaicikihijadgifklkbpdajbkhjo"
            notifidiv.innerHTML = request.notifitext;
            document.getElementsByTagName("body")[0].appendChild(notifidiv);
        }
    });
if (window.location.href.indexOf("chrome-extension://") === 0) {
    //only run in settings page
    addColorPicker("#tooltipcolor");
    addColorPicker("#directcolor");
    addColorPicker("#strokecolor");
    addColorPicker("#dstrokecolor");
    addColorPicker("#ddirectcolor");
    addColorPicker("#dtooltipcolor");
}

function addColorPicker(sel) {
    var that = $(sel);
    that.ColorPicker({
        color: '#' + $('#tooltipcolor').val(),
        onShow: function (colpkr) {
            $(colpkr).fadeIn(500);
            return false;
        },
        onHide: function (colpkr) {
            $(colpkr).fadeOut(500);
            return false;
        },
        onChange: function (hsb, hex, rgb) {
            that.css('backgroundColor', '#' + hex).val(hex);
            fireChange(that[0]);
        }
    });
}


function fireChange(sel) {
    var ev = document.createEvent('HTMLEvents');
    ev.initEvent("change", true, true);
    sel.dispatchEvent(ev);
}
function fireClick(sel) {
    var ev = document.createEvent('HTMLEvents');
    ev.initEvent("click", true, true);
    sel.dispatchEvent(ev);
}

function emptyRightClick(e) {
    disableRc = true;
    e.preventDefault();
    console.log("disable the right click when rocker");
}

function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }
    //find & remove port number
    domain = domain.split(':')[0];
    var isSB = isSubDomain(domain),
        rootDomain;
    if (!isSB) {
        rootDomain = domain = domain.replace("www.", "");
    } else {
        rootDomain = domain.substr(domain.indexOf(".") + 1)
    }
    return isSB ? domain : rootDomain;
}

function isSubDomain(url) {
    url = url.replace(new RegExp(/^www\./i), "");
    url = url.replace(new RegExp(/\/(.*)/), "");
    if (url.match(new RegExp(/\.[a-z]{2,3}\.[a-z]{2}$/i))) {
        url = url.replace(new RegExp(/\.[a-z]{2,3}\.[a-z]{2}$/i), "");
    } else if (url.match(new RegExp(/\.[a-z]{2,4}$/i))) {
        url = url.replace(new RegExp(/\.[a-z]{2,4}$/i), "");
    }
    return (url.match(new RegExp(/\./g))) ? true : false;
}

document.addEventListener("DOMContentLoaded", () => {
    chrome.runtime.sendMessage({type: "getCursor"}, (response) => {
        if(response && response.cursorimg !== null) {
            const {cursorimg, cursorimgscale, isUploadImage} = response;
            let imgUrl = !isUploadImage && cursorimgscale > 1 ? `${cursorimg.substring(0, cursorimg.indexOf('.'))}@${cursorimgscale}.png` : cursorimg;
            document.body.style.cursor = `url(${imgUrl}), default`;
        }
    });
});

const isWrongGestureOnboarding = (type, gesture, direct, selimg) => {
    if(location.href === screens.first) {
        if (type === dragGestures || gesture !== 'G_down') {
            showWrongGestureMessageOnboarding();
            return true;
        }
    }

    if(location.href === screens.second) {
        if (type === mouseGestures || gesture !== "L_open" || direct !== "R") {
            showWrongGestureMessageOnboarding();
            return true;
        }
    }

    if(location.href === screens.third) {
        if (type === dragGestures || gesture !== 'G_lefttab') {
            showWrongGestureMessageOnboarding();
            return true;
        }
    }

    if(location.href === screens.fourth) {
        if (type === dragGestures || gesture !== 'G_top') {
            showWrongGestureMessageOnboarding();
            return true;
        }
    }

    if(location.href === screens.fifth) {
        if (type === mouseGestures || gesture !== 'I_save' || direct !== 'D' || !selimg.includes('Princess_in_distress')) {
            showWrongGestureMessageOnboarding();
            return true;
        }
    }

    return false;
};

const manipulateScrollGestureOnboarding = (gesture) => {
    if(location.href === screens.first) {
        if (gesture === 'G_down') {
            return true;
        }
    }
    return false;
};

let wrongGestureMessageTimeout;

const autoHideWrongGestureMessage = (element) => {
    clearTimeout(wrongGestureMessageTimeout);
    wrongGestureMessageTimeout = setTimeout(() => {
        element.classList.remove('messageIn');
        element.classList.add('messageOut');
    }, 3000);
};


const showWrongGestureMessageOnboarding = () => {
    if (document.querySelector('#wrongGestureMessage') === null) {
        let newElement = document.createElement('div');
        newElement.id = 'wrongGestureMessage';
        newElement.classList.add('wrongGestureMessage');
        newElement.classList.add('messageIn');
        newElement.append(chrome.i18n.getMessage('wrongGesture'));
        document.body.append(newElement);
        autoHideWrongGestureMessage(newElement);
    } else {
        let element = document.querySelector('#wrongGestureMessage');
        if(element.classList.contains('messageOut')) {
            element.classList.remove('messageOut');
            element.classList.add('messageIn');
        }
        autoHideWrongGestureMessage(element);
    }
};

const showReminderOnboarding = () => {
    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Game notification", gaAction: "Shown"});
    let reminderElement = document.createElement('div');
    reminderElement.id = 'onboardingReminderNotification';
    reminderElement.classList.add('onboardingReminder');
    reminderElement.classList.add('onboardingReminderAnimationIn');
    reminderElement.dir = "ltr";
    // setting relative div
    let reminderElementInner = document.createElement('div');
    reminderElementInner.className = 'onboardingReminderInner';
    // close button
    let xButton = document.createElement('img');
    xButton.src = chrome.extension.getURL('image/close.svg');
    xButton.className = 'onboardingReminderCloseButton';
    xButton.onclick = () => {
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Game notification", gaAction: "Close"});
        chrome.runtime.sendMessage({
            type: "handleOnboardingReminderRequests",
            handler: 'neverShowReminderOnboarding'
        });
        reminderElement.classList.remove('onboardingReminderAnimationIn');
        reminderElement.classList.add('onboardingReminderAnimationOut');
    };

    let leftFlex = document.createElement('div');
    leftFlex.classList.add('onboardingReminderLeftFlex');
    let rightFlex = document.createElement('div');

    // logo
    let logo = document.createElement('img');
    logo.src = chrome.extension.getURL('/image/onboarding-logo.png');
    logo.classList.add('onboardingReminderLogo');
    // CTA
    let CTA = document.createElement('div');
    CTA.classList.add('onboardingReminderCTA');
    CTA.append(chrome.i18n.getMessage('startGame'));
    CTA.onclick = () => {
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Game notification", gaAction: "Play now"});
        chrome.runtime.sendMessage({
            type: "handleOnboardingReminderRequests",
            handler: 'CTAClick'
        });
        reminderElement.classList.remove('onboardingReminderAnimationIn');
        reminderElement.classList.add('onboardingReminderAnimationOut');
    };
    // remind me later
    let remindMeLater = document.createElement('div');
    remindMeLater.classList.add('onboardingReminderRemindMeLater');
    remindMeLater.append(chrome.i18n.getMessage('playLater'));
    remindMeLater.onclick = () => {
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Game notification", gaAction: "Remind me later"});
        chrome.runtime.sendMessage({
            type: "handleOnboardingReminderRequests",
            handler: 'remindMeLater'
        });
        reminderElement.classList.remove('onboardingReminderAnimationIn');
        reminderElement.classList.add('onboardingReminderAnimationOut');
    };
    // mouse logo
    let mouseLogo = document.createElement('img');
    mouseLogo.src = chrome.extension.getURL('/image/opening-mouse.png');
    mouseLogo.classList.add('onboardingReminderMouseLogo');

    // append all elements
    reminderElement.append(reminderElementInner);
    reminderElementInner.append(xButton);
    reminderElementInner.append(leftFlex);
    reminderElementInner.append(rightFlex);
    leftFlex.append(logo);
    leftFlex.append(CTA);
    leftFlex.append(remindMeLater);
    rightFlex.append(mouseLogo);
    document.body.append(reminderElement);
};


const shouldShowReminderOnboarding = () => {
    if(!location.href.includes(chrome.extension.getURL('options.html'))) {
        chrome.runtime.sendMessage({
            type: "handleOnboardingReminderRequests",
            handler: 'shouldShowReminderOnboarding'
        }, (response) => {
            if(response.shouldShowReminderOnboarding) {
                if(document.body) {
                    showReminderOnboarding();
                } else {
                    window.onload = () => {
                        showReminderOnboarding();
                    };
                }
            }
        });
    }
};


shouldShowReminderOnboarding();
