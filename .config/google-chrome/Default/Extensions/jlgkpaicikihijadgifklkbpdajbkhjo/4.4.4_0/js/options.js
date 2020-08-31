const defaultConfig = {
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
        gesture: [
            {
                direct: "L",
                action: "G_back",
                whitelist: []
            },
            {
                direct: "R",
                action: "G_go",
                whitelist: []
            },
            {
                direct: "U",
                action: "G_up",
                whitelist: []
            },
            {
                direct: "D",
                action: "G_down",
                whitelist: []
            },
            {
                direct: "DR",
                action: "G_close",
                whitelist: []
            },
            {
                direct: "LU",
                action: "G_reclosedtab",
                moreTarget: "newfront",
                morePosition: "chrome",
                morePinned: "unpinned",
                moreDes: chrome.i18n.getMessage("G_reclosedtab"),
                whitelist: []
            },
            {
                direct: "RD",
                action: "G_bottom",
                whitelist: []
            },
            {
                direct: "RU",
                action: "G_top",
                whitelist: []
            },
            {
                direct: "UD",
                action: "G_reload",
                whitelist: []
            },
            {
                direct: "UDU",
                action: "G_reloadclear",
                whitelist: []
            },
            {
                direct: "UL",
                action: "G_lefttab",
                whitelist: []
            },
            {
                direct: "UR",
                action: "G_righttab",
                whitelist: []
            },
            {
                direct: "DRU",
                action: "G_newwindow",
                whitelist: []
            },
            {
                direct: "URD",
                action: "G_closewindow",
                whitelist: []
            },
            {
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

        text: [
            {
                direct: "L",
                action: "T_search",
                moreDes: chrome.i18n.getMessage("valuetsearch") + "(" + chrome.i18n.getMessage("newback") + ")",
                morePinned: "unpinned",
                morePosition: "left",
                moreTarget: "newback",
                moreTsearch: "sgoogle"
            },
            {
                direct: "R",
                action: "T_search",
                moreDes: chrome.i18n.getMessage("valuetsearch") + "(" + chrome.i18n.getMessage("newfront") + ")",//"使用%name搜索:"%s"",
                morePinned: "unpinned",
                morePosition: "right",
                moreTarget: "newfront",
                moreTsearch: "sgoogle"
            },
            {
                direct: "D",
                action: "T_copytext"
            }],
        link: [
            {
                direct: "L",
                action: "L_open",
                moreDes: chrome.i18n.getMessage("L_open") + "(" + chrome.i18n.getMessage("newback") + ")",//"打开链接",
                morePinned: "unpinned",
                morePosition: "left",
                moreTarget: "newback"
            },
            {
                direct: "R",
                action: "L_open",
                moreDes: chrome.i18n.getMessage("L_open") + "(" + chrome.i18n.getMessage("newfront") + ")",//"打开链接",
                morePinned: "unpinned",
                morePosition: "right",
                moreTarget: "newfront"
            },
            {
                direct: "D",
                action: "L_copytext"
            },
            {
                direct: "U",
                action: "L_copyurl"
            }],
        image: [
            {
                direct: "L",
                action: "I_open",
                moreDes: chrome.i18n.getMessage("I_open") + "(" + chrome.i18n.getMessage("newback") + ")",
                morePinned: "unpinned",
                morePosition: "left",
                moreTarget: "newback"
            },
            {
                direct: "R",
                action: "I_open",
                moreDes: chrome.i18n.getMessage("I_open") + "(" + chrome.i18n.getMessage("newfront") + ")",
                morePinned: "unpinned",
                morePosition: "right",
                moreTarget: "newfront"
            },
            {
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
        sgsleft: [
            {action: "G_top"},
            {action: "G_bottom"}],
        sgsright: [
            {action: "G_top"},
            {action: "G_bottom"}],
        fastSwitch: false,
        reverseFS: false
    },
    strokegesture: {
        strpress: "up",
        strleftenable: true,
        strleft: [
            {action: "G_none"},
            {action: "G_righttab"}],
        strmiddleenable: false,
        strmiddle: [
            {action: "G_lefttab"},
            {action: "G_righttab"}],
        strrightenable: true,
        strright: [
            {action: "G_lefttab"},
            {action: "G_none"}]
    },
    cursor: {
        img: null,
        scale: 1
    }
};
const action = {
    gesture: [
        {action: "G_none"},
        //导航
        {action: "G_back"},
        {action: "G_go"},
        {action: "G_goparent"},
        {action: "G_stop"},
        {action: "G_stopall"},
        {action: "G_trynext"},
        {action: "G_tryprev"},
        //{action: "G_homePage"},
        //滚动
        {action: "G_up"},
        {action: "G_down"},
        {action: "G_top"},
        {action: "G_bottom"},
        {action: "G_left"},
        {action: "G_right"},
        //加载
        {action: "G_reload"},
        {action: "G_reloadclear"},
        {action: "G_reloadframe"},
        {action: "G_reloadall"},
        {action: "G_reclosedtab"},
        {action: "G_openclipurl"},
        //标签页
        {action: "G_close"},
        {action: "G_closelefttabs"},
        {action: "G_closerighttabs"},
        {action: "G_closeothers"},
        {action: "G_newtab"},
        {action: "G_newusertab"},
        {action: "G_copytab"},
        {action: "G_movetowindow"},
        {action: "G_pin"},
        {action: "G_splitTab"},
        {action: "G_mergeTab"},
        //标签页导航
        {action: "G_lefttab"},
        {action: "G_righttab"},
        {action: "G_firsttab"},
        {action: "G_lasttab"},
        //窗口
        {action: "G_newwindow"},
        {action: "G_incognito"},
        {action: "G_closewindow"},
        {action: "G_closewindows"},
        {action: "G_windowmax"},
        {action: "G_windowmin"},
        {action: "G_fullscreen"},
        //复制
        {action: "G_copyurl"},
        {action: "G_copytitle"},
        {action: "G_copyaslink"},
        {action: "G_copyuser"},
        //其他
        {action: "G_capture"},
        {action: "G_chromepage"},
        {action: "G_viewsource"},
        {action: "G_crxsettings"},
        {action: "G_tostop"},
        {action: "G_ZoomIn"},
        {action: "G_ZoomOut"},
        {action: "G_userscript"},
        {action: "G_bookmark"},
        {action: "G_BmManager"}
    ],
    text: [
        {action: "G_none"},
        {action: "T_search"},
        {action: "T_searchuser"},
        {action: "T_copytext"}
    ],
    link: [
        {action: "G_none"},
        {action: "L_open"},
        {action: "L_copytext"},
        {action: "L_copyurl"},
        {action: "L_copyaslink"},
        {action: "L_copyuser"},
        {action: "L_bookmark"}],
    image: [
        {action: "G_none"},
        {action: "I_open"},
        {action: "I_save"},
//		{action:"I_saveback"},
        {action: "I_copyurl"},
        {action: "I_search"},
        {action: "I_searchuser"}],
    Target: ["newfront", "newback", "curfront", "incog"/*,"incogback"*/],
    Tsearch: ["sgoogle", "sbaidu", "sbing", "syandex", "syahoo", "swiki", "staobao", "samazon", "ssogou", "s360"],
    Isearch: ["sgoogleimage", "sbaiduimage", "stineyeimage"],
    Chromepage: ["crdownloads", "crhistory", "crbookmarks", "crextensions", "crsettings", "crflags"],
    Position: ["chrome", "right", "left", "head", "last"],
    Pinned: ["unpinned", "pinned"],
    Capturetype: ["jpeg", "png"],
    Closeopts: ["close", "unclose"],
    Closesel: ["chrome", "left", "right"]
};
const ONBOARDING_PAGE_1 = 'https://crxmouse.com/the-mouse-chase-1';
const isJustAfterInstall = location.href.includes('install=true');

function handleCRXDisabledOptions(isGesturesOff, backup) {
    var arrayOfTypes = ["gesture", "drag", "scroll", "scrollgesture", "strokegesture"];
    arrayOfTypes.forEach(function(type) {
        var currCheckbox = $("#" + type)[0];
        currCheckbox.disabled = isGesturesOff;
        $("label[for='" + type + "']").css({ opacity: isGesturesOff ? 0.3 : 1 });
        currCheckbox.checked = isGesturesOff ? false : backup[type];
    })
    $("#checkboxshutdown")[0].checked = !isGesturesOff;
    if(isGesturesOff){
        $("#shutdown_text_first").text(chrome.i18n.getMessage("offmodesettings"));
        $("#shutdown_text_second").text(chrome.i18n.getMessage("enabletochange"));
    } else {
        $("#shutdown_text_first").text('');
        $("#shutdown_text_second").text('');
    }
}

const CheckURL = function (url) {
    if (url == "") {
        return false;
    }

    var url = url.toLowerCase();
    if ((url.indexOf("http://") != 0) &&
        (url.indexOf("https://") != 0) &&
        (url.indexOf("ftp://") != 0) &&
        (url.indexOf("chrome://") != 0) &&
        (url.indexOf("chrome-extension://") != 0)) {
        url = "http://" + url;
    }

    if (url.substr(0, 6) == "chrome") {
        return url;
    }
    var regexp = /^((ftp|http(s)?):\/\/)([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/
    if (regexp.test(url)) {
        return url;
    } else {
        return false
    }
};
$('#checkboxshutdown').change(function() {
    // alert($('#checkboxshutdown')[0].checked);
    chrome.runtime.sendMessage({type: "toggleShutdownGestures"}, function(response) {
        handleCRXDisabledOptions(response.isGesturesOff, response.backup);
    });
});

$("#contact").click(function() {
    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "About", gaAction: "Contact clicked"});
});
$("#privacy").click(function() {
    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "About", gaAction: "Privacy Policy clicked"});
});
$("#terms").click(function() {
    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "About", gaAction: "Terms of Use clicked"});
});
const crxChange = function (e) {
    var _obj = e.target;
    if($(_obj).is("[gesappearnce]")) {
        setTimeout(function(element, value) {
            if(value === element.val()){
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Mouse Gestures", gaAction: "Appearance setting changed"});
            }
        }, 3000, $(e.target), $(e.target).val());
    } else if($(_obj).is("[drgappearance]")) {
        setTimeout(function(element, value) {
            if(value === element.val()){
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Appearance setting changed"});
            }
        }, 3000, $(_obj), $(_obj).val());
    } else if($(_obj).is("[gesmore]")) {
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Mouse Gestures", gaAction: "More"});
    } else if ($(_obj).is("[drgmore]") && _obj.checked) {
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "More", gaLabel: $('label[for=' + _obj.id + ']').text()});
    } else if ($(_obj).is("[strokegesture]")){
        setTimeout(function(element, value) {
            if(value === element.val()){
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Rocker Gestures", gaAction: "Rocker setting changed"});
            }
        }, 3000, $(_obj), $(_obj).val());
    } else if ($(_obj).is("[scrollgesture]")){
        setTimeout(function(element, value) {
            if(value === element.val()){
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Wheel Gestures", gaAction: "Wheel setting changed"});
            }
        }, 3000, $(_obj), $(_obj).val());
    } else if ($(_obj).is('[name=gholdkeytype]')) {
        setTimeout(function (element, value) {
            chrome.runtime.sendMessage({
                type: 'gaEvent',
                gaCategory: 'General settings',
                gaAction: 'Mouse Gestures Mode',
                gaLabel: value === 'enable' ? 'On' : 'Off',
            });
        }, 3000, $(_obj), $(_obj).val());
    } else if(_obj.id === 'cursorimgscale') {
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Mouse Cursor", gaAction: "Scale", gaLabel: _obj.valueAsNumber * 16});
    } else if ($(_obj).is('[id=hidetrash]')) {
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Cancel Gesture", gaAction: `Trash bin ${$(_obj).is(':checked') ? 'OFF' : 'ON'}`});
    }

    if (_obj.className == "norselect"
        || _obj.className == "gesselect"
        || _obj.className == "drgselect"
        || _obj.className == "strselect") {
        var cfg1, cfg2;
        cfg2 = _obj.id;
        switch (_obj.className) {
            case"norselect":
                cfg1 = "normal";
                break;
            case"gesselect":
                cfg1 = "gesture";
                break;
            case"drgselect":
                cfg1 = "drag";
                break;
            case"strselect":
                cfg1 = "strokegesture";
                break;
        }
        config[cfg1][cfg2] = _obj.value;
        needToSave = true;
        return;
    }

    /*checkbox/text/range/radio change*/
    var _cfgobj;
    switch (_obj.className.substr(0, 3)) {
        case"nor":
            _cfgobj = "normal";
            break;
        case"ges":
            _cfgobj = "gesture";
            break;
        case"drg":
            _cfgobj = "drag";
            break;
        case"scr":
            _cfgobj = "scroll";
            break;
        case"sgs":
            _cfgobj = "scrollgesture";
            break;
        case"str":
            _cfgobj = "strokegesture";
            break;
    }

    if (_obj.className.indexOf("check") == 3) {
        if(mapIdToGAEvent[_obj.id] && !$(_obj).is("[gesmore]") && !$(_obj).is("[gesappearnce]") && !$(_obj).is("[strokegesture]") && !$(_obj).is("[scrollgesture]") && !$(_obj).is('drgappearance') && !$(_obj).is("[drgmore]")){
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: mapIdToGAEvent[_obj.id].category, gaAction: mapIdToGAEvent[_obj.id].action, gaLabel: _obj.checked ? "On" : "Off"});
        }
        config[_cfgobj][_obj.id] = _obj.checked;
        if (document.getElementById("li" + _obj.id)) {
            if (config[_cfgobj][_obj.id]) {
                document.getElementById("li" + _obj.id).style.display = "block";
            }
            else {
                document.getElementById("li" + _obj.id).style.display = "none";
            }
        }
        needToSave = true;
    }

    if (_obj.className.indexOf("text") == 3) {
        config[_cfgobj][_obj.id] = _obj.value;
        needToSave = true;
    }

    if (_obj.className.indexOf("range") == 3) {
        config[_cfgobj][_obj.id] = _obj.value;
        document.getElementById(_obj.id + "hold").innerHTML = _obj.value;
        needToSave = true;
    }

    if (_obj.className.indexOf("radio") == 3) {
        config[_cfgobj][_obj.name] = _obj.value;
        needToSave = true;
    }

    /*select change*/
    if (_obj.id.indexOf("select") != -1) {
        switch (_obj.id.substr(0, 1)) {
            case"g":
                _sobj1 = "gesture";
                _sobj2 = "gesture";
                break;
            case"t":
                if($("#addbox").css("display") === "none")
                    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Drag Text gesture edited", gaLabel:  $("#" + _obj.id).val()});
                _sobj1 = "drag";
                _sobj2 = "text";
                break;
            case"l":
                if($("#addbox").css("display") === "none")
                    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Drag Link gesture edited", gaLabel: $("#" + _obj.id).val()});
                _sobj1 = "drag";
                _sobj2 = "link";
                break;
            case"i":
                if($("#addbox").css("display") === "none")
                    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Drag Image gesture edited", gaLabel: $("#" + _obj.id).val()});
                _sobj1 = "drag";
                _sobj2 = "image";
                break;
            case"s":
                _sobj1 = "scrollgesture";
                _sobj2 = "sgsleft";
                break;
            case"r":
                _sobj1 = "scrollgesture";
                _sobj2 = "sgsright";
                break;
            case"u":
                _sobj1 = "strokegesture";
                _sobj2 = "strleft";
                break;
            case"v":
                _sobj1 = "strokegesture";
                _sobj2 = "strmiddle";
                break;
            case"w":
                _sobj1 = "strokegesture";
                _sobj2 = "strright";
                break;
        }
        const lastSibling = e.target.parentNode.lastChild;

        var _id = parseInt(_obj.id.substr(7));
        if (!e.target.nextSibling) {
        }
        else if (lastSibling && lastSibling.className == "morehold") {
            e.target.parentNode.removeChild(lastSibling);
        }
        else if (e.target.nextSibling.nextSibling) {
            e.target.parentNode.removeChild(e.target.nextSibling.nextSibling)
        }


        var moreArray = [];
        var moreEle = [];
        var defaultDes = "";
        if (_obj.value == "G_newtab"
            || _obj.value == "G_openclipurl"
            || _obj.value == "G_reclosedtab"
            || _obj.value == "G_crxsettings") {
            moreArray = ["moreTarget", "morePosition", "morePinned", "moreDes"];
            defaultDes = chrome.i18n.getMessage(_obj.value)
        }
        else if (_obj.value == "G_viewsource"
            || _obj.value == "G_newtab"
            || _obj.value == "L_open"
            || _obj.value == "I_open") {
            moreArray = ["moreTarget", "morePosition", "morePinned", "moreDes"];
            defaultDes = chrome.i18n.getMessage(_obj.value)
        }
        else if (_obj.value == "G_chromepage"
        ) {
            moreArray = ["moreChromepage", "moreTarget", "morePosition", "morePinned", "moreDes"];
        }
        else if (_obj.value == "T_search") {
            moreArray = ["moreTsearch", "moreTarget", "morePosition", "morePinned", "moreDes"];
        }
        else if (_obj.value == "I_search") {
            moreArray = ["moreIsearch", "moreTarget", "morePosition", "morePinned", "moreDes"];
        }
        else if (_obj.value == "G_trynext" || _obj.value == "G_tryprev") {
            moreArray = ["moreTarget", "morePosition", "morePinned", "moreMatch", "moreDes"];
        }
        else if (_obj.value == "G_newusertab"
            || _obj.value == "T_searchuser"
            || _obj.value == "I_searchuser") {
            moreArray = ["moreName", "moreURL", "moreTarget", "morePosition", "morePinned", "moreDes"];
        }
        else if (_obj.value == "G_userscript") {
            moreArray = ["moreName", "moreScript", "moreDes"];
        }
        else if (_obj.value == "G_capture") {
            moreArray = ["moreCapturetype", "moreTarget", "morePosition", "morePinned"];
        }
        else if (_obj.value == "G_copyuser" || _obj.value == "L_copyuser") {
            moreArray = ["moreName", "moreCopystyle", "moreDes"];
        }
        else if (_obj.value == "G_close") {
            moreArray = ["moreClosesel", "moreCloseopts", "moreCloseurl"]
        }

        if (moreArray.length != 0) {
            var _value = _obj.value;
            var _morehold = document.createElement("div");
            _morehold.className = "morehold";

            for (var ii in moreArray) {
                if (moreArray[ii] == "moreTarget"
                    || moreArray[ii] == "moreTsearch"
                    || moreArray[ii] == "moreIsearch"
                    || moreArray[ii] == "moreChromepage"
                    || moreArray[ii] == "morePosition"
                    || moreArray[ii] == "morePinned"
                    || moreArray[ii] == "moreCapturetype"
                    || moreArray[ii] == "moreCloseopts"
                    || moreArray[ii] == "moreClosesel") {
                    moreEle[moreArray[ii]] = document.createElement("select");
                    moreEle[moreArray[ii]].name = moreArray[ii];
                    moreEle[moreArray[ii]].title = chrome.i18n.getMessage(moreArray[ii] + "title");
                    var optionsArray = action[moreArray[ii].substr(4)];//["new","newback","cur"];
                    var optionsEle = [];
                    for (var iii = 0; iii < optionsArray.length; iii++) {
                        optionsEle[optionsArray[iii]] = document.createElement("option");
                        optionsEle[optionsArray[iii]].value = optionsArray[iii];
                        optionsEle[optionsArray[iii]].innerHTML = chrome.i18n.getMessage(optionsArray[iii]) ? chrome.i18n.getMessage(optionsArray[iii]) : optionsArray[iii];//chrome.i18n.getMessage("more"+optionsArray[iii]);
                        moreEle[moreArray[ii]].appendChild(optionsEle[optionsArray[iii]]);
                        moreEle[moreArray[ii]].selectedIndex = 0//iii;}
                    }
                }
                else if (moreArray[ii] == "moreScript") {
                    moreEle[moreArray[ii]] = document.createElement("textarea");
                    moreEle[moreArray[ii]].wrap = "virtual";
                    moreEle[moreArray[ii]].name = moreArray[ii];
                    moreEle[moreArray[ii]].value = "";
                    moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage(moreArray[ii] + "title");
                }
                else {
                    moreEle[moreArray[ii]] = document.createElement("input");
                    moreEle[moreArray[ii]].type = "text";
                    moreEle[moreArray[ii]].name = moreArray[ii];
                    moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage(moreArray[ii] + "title");
                    if (moreArray[ii] == "moreDes") {
                        //alert(_obj.value)
                        if (_obj.value.indexOf("newusertab") != -1) {
                            moreEle[moreArray[ii]].value = chrome.i18n.getMessage("valuenewusertab")//"打开%name"//,
                            moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titlenewusertab")
                        }

                        else if (_obj.value.indexOf("T_search") != -1) {
                            moreEle[moreArray[ii]].value = chrome.i18n.getMessage("valuetsearch");
                            moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titletsearch")
                        }

                        else if (_obj.value.indexOf("I_search") != -1) {
                            moreEle[moreArray[ii]].value = chrome.i18n.getMessage("valueisearch");
                            moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titleisearch")
                        }

                        else if (_obj.value.indexOf("userscript") != -1) {
                            moreEle[moreArray[ii]].value = chrome.i18n.getMessage("valueuserscript");
                            moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titleuserscript")
                        }

                        else if (_obj.value.indexOf("copyuser") != -1) {
                            moreEle[moreArray[ii]].value = chrome.i18n.getMessage(_obj.value);
                            moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titlecopyuser")
                        }

                        else if (_obj.value.indexOf("G_chromepage") != -1) {
                            moreEle[moreArray[ii]].value = chrome.i18n.getMessage("valuechromepage");
                            moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titlechromepage");
                        }
                        else if (_obj.value == "G_trynext" || _obj.value == "G_tryprev") {
                            moreEle[moreArray[ii]].value = chrome.i18n.getMessage(_obj.value);//
                            moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("moreDestitle");
                        }
                        else {
                            moreEle[moreArray[ii]].value = defaultDes;
                            moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage(moreArray[ii] + "title");
                        }
                    }

                    if (moreArray[ii] == "moreURL" && _obj.value.indexOf("searchuser") != -1) {
                        moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage("titlesearchuser");
                    }

                    if (moreArray[ii] == "moreMatch") {
                        if (_obj.value == "G_trynext") {
                            moreEle[moreArray[ii]].value = "»|›|>|next|nextpostslink|pnnext|下一页|下页|下一章|下章|下一页>";
                        }
                        if (_obj.value == "G_tryprev") {
                            moreEle[moreArray[ii]].value = "«|‹|<|prev|previous|previouspostslink|pnprev|上一页|上页|上一章|上章|<上一页";
                        }
                        moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titlenexpre");
                    }

                    if (moreArray[ii] == "moreCopystyle" && _obj.value.indexOf("copyuser") != -1) {
                        moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage("moreCopystyletitle");
                    }

                    if (moreArray[ii] == "moreCloseurl"/*&&_obj.value.indexOf("copyuser")!=-1*/) {
                        moreEle[moreArray[ii]].value = "chrome://newtab/";
                        moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage("moreCloseurltitle");
                    }
                }

                if (moreEle[moreArray[ii]]) {
                    _morehold.appendChild(moreEle[moreArray[ii]]);
                }
            }

            for (var ii in moreArray) {
                //if(teststroke){break;}
                if (moreEle[moreArray[ii]]) {
                    var moreSavebutton = document.createElement("input");
                    moreSavebutton.type = "button";
                    if (teststroke) {
                        moreSavebutton.style.display = "none";
                    }
                    moreSavebutton.value = chrome.i18n.getMessage("save");
                    moreSavebutton.id = "moresave" + _obj.id.substr(0, 1) + _id;
                    _morehold.appendChild(moreSavebutton);
                    break;
                }
            }

            //_morehold.appendChild(_savebutton);
            _obj.parentNode.appendChild(_morehold);
            if (document.getElementById("moresave" + _obj.id.substr(0, 1) + _id)) {
                document.getElementById("moresave" + _obj.id.substr(0, 1) + _id).addEventListener("click", function (e) {
                    _fnmoresave(e)
                }, false);
            }
            function _fnmoresave(e) {
                var _flagdirect = config[_sobj1][_sobj2][_id].direct;
                config[_sobj1][_sobj2][_id] = {};
                config[_sobj1][_sobj2][_id].direct = _flagdirect;
                config[_sobj1][_sobj2][_id].action = _value;
                var _texts = e.target.parentNode.querySelectorAll("input[type=text]");
                var _selects = e.target.parentNode.querySelectorAll("select");
                for (var i = 0; i < _texts.length; i++) {
                    if (_texts[i].value == "") {
                        alert(chrome.i18n.getMessage("alertname"));
                        return;
                    }
                    if (_texts[i].name == "moreURL" || _texts[i].name == "moreCloseurl") {
                        if (CheckURL(_texts[i].value)) {
                            _texts[i].value = CheckURL(_texts[i].value);
                        }
                        else {
                            alert(chrome.i18n.getMessage("alerturl"));
                            return;
                        }
                    }
                }
                if (e.target.parentNode.querySelectorAll("textarea")[0] && !e.target.parentNode.querySelectorAll("textarea")[0].value) {
                    alert(chrome.i18n.getMessage("alertname"));
                    return;
                }

                /*save*/
                for (var i = 0; i < _texts.length; i++) {
                    config[_sobj1][_sobj2][_id][_texts[i].name] = _texts[i].value;
                }

                for (var i = 0; i < _selects.length; i++) {
                    config[_sobj1][_sobj2][_id][_selects[i].name] = _selects[i].value;
                }
                if (e.target.parentNode.querySelectorAll("textarea")[0]) {
                    config[_sobj1][_sobj2][_id].moreScript = e.target.parentNode.querySelectorAll("textarea")[0].value;
                }

                /*for add gesture,do not save*/
                if (_obj.id.substr(7) == config[_sobj1][_sobj2].length) {
                    return;
                }

                needToSave = true;
            }

            return;
        }

        /*for add gesture,do not save*/
        if (_obj.id.substr(7) == config[_sobj1][_sobj2].length) {
            return;
        }

        var _flagdirect = config[_sobj1][_sobj2][_id].direct;
        config[_sobj1][_sobj2][_id] = {};
        if (_obj.id.substr(0, 1) == "g" || _obj.id.substr(0, 1) == "t" || _obj.id.substr(0, 1) == "l" || _obj.id.substr(0, 1) == "i") {
            config[_sobj1][_sobj2][_id].direct = _flagdirect;
        }
        config[_sobj1][_sobj2][_id].action = _obj.value;
        needToSave = true;

    }
    /*select change END*/

    lineChange("gesture");
    lineChange("drag");
};
const pageReset = function (e) {
    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "General", gaAction: "Reset this page", gaLabel: $("#optname").clone().children().remove().end().text()});
    const clickedOptIn = config.normal.clickedOptin;
    config[e.target.dataset.reset] = {};
    config[e.target.dataset.reset] = defaultConfig[e.target.dataset.reset];
    if (e.target.dataset.reset === "normal") {
        config.normal.clickedOptin = clickedOptIn;
    }
    needToSave = true;
    window.setTimeout(function () {
        document.location.reload()
    }, 600)
};
const FnImport = function (e) {
    try {
        if (document.getElementById("portconfig").value == "") {
            return;
        }
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Advanced Settings", gaAction: "Import"});
        var newconfig = JSON.parse(document.getElementById("portconfig").value);
        newconfig.sync = "local";
        localStorage.setItem("openoptspage", true);
        localStorage.setItem("config", JSON.stringify(Object.assign({}, defaultConfig, newconfig)));
        chrome.storage.sync.set(newconfig, function () {
            chrome.runtime.reload();
        });
    }
    catch (e) {
        alert(chrome.i18n.getMessage("alertconfigerror"))
    }

};
const FnExport = function (e) {
    var _exportconfig = JSON.parse(localStorage.getItem("config"));
    document.getElementById("portconfig").value = JSON.stringify(_exportconfig, null, 2)//JSON.parse(localStorage.getItem("config"));
    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Advanced Settings", gaAction: "Export"});
};
const FnResetAll = function (e) {
    const guid_key = localStorage.getItem('guid_key');
    const sawUpdateNotification = localStorage.getItem('sawUpdateNotification');
    const installedAt = localStorage.getItem('installedAt');
    const completedGestures = localStorage.getItem('completedGestures');
    defaultConfig.sync = true;
    defaultConfig.normal.clickedOptin = config.normal.clickedOptin;
    localStorage.clear();
    localStorage.setItem("cmfirst", 1);
    localStorage.setItem("guid_key", guid_key);
    localStorage.setItem("sawUpdateNotification", sawUpdateNotification);
    localStorage.setItem("installedAt", installedAt);
    localStorage.setItem("completedGestures", completedGestures);
    localStorage.setItem("config", JSON.stringify(defaultConfig));
    chrome.runtime.sendMessage({type: "syncup"});
    document.getElementById("msgbox").style.display = "block";
    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Advanced Settings", gaAction: "Reset All"});
    window.setTimeout(function () {
        document.getElementById("msgbox").style.display = "none";
        window.location.reload();
    }, 1000)
};
const FnAddOk = function (e) {
    var _id = parseInt(document.getElementById("adddirect").firstChild.id.substr(5));
    var _obj = document.getElementById("adddirect").firstChild.id.substr(0, 1);
    var _configobj = e.target.id.substr(5);
    var _cfg1, _cfg2;
    switch (_obj) {
        case"g":
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Mouse Gestures", gaAction: "New Mouse Gesture", gaLabel: $("#gselect" + _id).val() + "-" + "Save"});
            _cfg1 = "gesture";
            _cfg2 = "gesture";
            break;
        case"t":
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Add New Text button clicked", gaLabel: $("#tselect" + _id).val() + "-" + "Save"});
            _cfg1 = "drag";
            _cfg2 = "text";
            break;
        case"l":
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Add New Link button clicked", gaLabel: $("#lselect" +_id).val() + "-" + "Save"});
            _cfg1 = "drag";
            _cfg2 = "link";
            break;
        case"i":
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Add New Image button clicked", gaLabel: $("#iselect" + _id).val() + "-" + "Save"});
            _cfg1 = "drag";
            _cfg2 = "image";
            break;
    }

    for (var i = 0 in config[_cfg1][_cfg2]) {
        if (optdirect == config[_cfg1][_cfg2][i].direct) {
            alert(chrome.i18n.getMessage("alertrepeat"));
            return;
        }
        if (document.querySelector("#" + _obj + "select" + _id).selectedIndex == -1) {
            alert(chrome.i18n.getMessage("alertaction"));
            return;
        }
    }

    var _texts = document.querySelectorAll("#adddirect .morehold>[type=text]");
    var _selects = document.querySelectorAll("#adddirect .morehold>select");
    for (var i = 0; i < _texts.length; i++) {
        if (_texts[0].value == "") {
            alert(chrome.i18n.getMessage("alertname"));
            return;
        }
    }
    if (document.querySelectorAll("#adddirect .morehold>textarea")[0] && !document.querySelectorAll("#adddirect .morehold>textarea")[0].value) {
        alert(chrome.i18n.getMessage("alertname"));
        return;
    }


    /*save*/
    config[_cfg1][_cfg2].push({direct: optdirect, action: document.getElementById(_obj + "select" + _id).value});
    for (var i = 0; i < _texts.length; i++) {
        config[_cfg1][_cfg2][_id][_texts[i].name] = _texts[i].value;
    }

    if (document.querySelectorAll("#adddirect .morehold>textarea")[0]) {
        config[_cfg1][_cfg2][_id].moreScript = document.querySelectorAll("#adddirect .morehold>textarea")[0].value;
        //config[cfg1][cfg2][_id].moreScript=this.parentNode.querySelectorAll("textarea")[0].value;
    }

    for (var i = 0; i < _selects.length; i++) {
        config[_cfg1][_cfg2][_id][_selects[i].name] = _selects[i].value;
    }
    needToSave = true;
    /*show new*/
    document.getElementById(_obj + "wrap" + _id).style.cssText = "";
    document.getElementById(_obj + "del" + _id).style.display = "inline";
    /*display del*/
    document.getElementById(_obj + "del" + _id).value = chrome.i18n.getMessage("delete");
    //document.getElementById("moresave"+_id).style.display="inline";/*display save*/alert("sss")
    if (document.getElementById(_obj + "wrap" + _id).querySelectorAll("input[type=button]")[1]) {/*display save*/
        document.getElementById(_obj + "wrap" + _id).querySelectorAll("input[type=button]")[1].style.display = "inline";
        document.getElementById(_obj + "wrap" + _id).querySelectorAll("input[type=button]")[1].value = chrome.i18n.getMessage("save");
    }
    document.getElementById("edit" + _configobj).insertBefore(document.getElementById(_obj + "wrap" + _id), document.getElementById(_obj + "clear"));
    document.querySelector("#" + _obj + "del" + _id).addEventListener('click', FnDel, false);
    isOptionsPage = false;
    teststroke = false;
    testgesture = false;
    testdrag = false;
    document.getElementById("addbox").style.display = "none";
};
const FnAddButton = function (e) {
    if (e.target.id == "addgesture") {
        testgesture = true;
        testdrag = false;
    } else {
        testgesture = false;
        testdrag = true;
    }
    isOptionsPage = true;
    var _addbox = document.getElementById("addbox");
    _addbox.style.width = Math.min(document.documentElement.scrollWidth, window.innerWidth) + "px";
    _addbox.style.height = Math.max(document.documentElement.scrollHeight, window.innerHeight) + "px";
    _addbox.style.zIndex = 100;
    switch (e.target.id) {
        case"addgesture":
            document.getElementById("addtip").innerHTML = chrome.i18n.getMessage("addtipgesture");
            document.getElementById("addcontent").style.display = "none";
            break;
        case"addtext":
            document.getElementById("addtip").innerHTML = chrome.i18n.getMessage("addtiptext");
            document.getElementById("addcontent").style.display = "block";
            document.getElementById("addcontenttext").style.display = "inline";
            document.getElementById("addcontentlink").style.display = "none";
            document.getElementById("addcontentimg").style.display = "none";
            break;
        case"addlink":
            document.getElementById("addtip").innerHTML = chrome.i18n.getMessage("addtiplink");
            document.getElementById("addcontent").style.display = "block";
            document.getElementById("addcontenttext").style.display = "none";
            document.getElementById("addcontentlink").style.display = "inline";
            document.getElementById("addcontentimg").style.display = "none";
            break;
        case"addimage":
            document.getElementById("addtip").innerHTML = chrome.i18n.getMessage("addtipimage");
            document.getElementById("addcontent").style.display = "block";
            document.getElementById("addcontenttext").style.display = "none";
            document.getElementById("addcontentlink").style.display = "none";
            document.getElementById("addcontentimg").style.display = "inline";
            break;
    }

    if (document.getElementById("adddirect")) {
    } else {
        var _adddirectobj = document.createElement("div");
        _adddirectobj.id = "adddirect";
        document.getElementById("addbox").insertBefore(_adddirectobj, document.getElementById("addbutton"));
    }
    document.querySelectorAll("#addbutton input[type=button]")[0].id = "addok" + e.target.id.substr(3);
    teststroke = true;
    /**/
    _addbox.style.display = "block";
};
const liclick = function (e) {
    if(!config.normal.clickedOptin) {
        let overlayOptinScript = document.createElement('script');
        overlayOptinScript.src = chrome.extension.getURL(('js/optedoutOverlay.js'));
        document.body.appendChild(overlayOptinScript);
    }
    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Settings navigation", gaAction: $(e.target).text() + " clicked"});

    // report a bug link
    if (e.target.getAttribute('id') === 'libug') {
        window.open('https://docs.google.com/forms/d/e/1FAIpQLSd_kyu5sZBjw2bGVFEWAg5kxsIPtEQSwW5j3gvR6wAhBO_BjQ/viewform');
        return;
    }

    if (e.target.dataset.i18ninner == "normal"
        || e.target.dataset.i18ninner == "gesture"
        || e.target.dataset.i18ninner == "drag"
        || e.target.dataset.i18ninner == "scroll"
        || e.target.dataset.i18ninner == "scrollgesture"
        || e.target.dataset.i18ninner == "strokegesture") {
        document.getElementById("optname").innerHTML = chrome.i18n.getMessage(e.target.dataset.i18ninner) + "\<a href='###' data-reset='" + e.target.dataset.i18ninner + "'\>" + chrome.i18n.getMessage("resetpage") + "\<\/a\>"
    }
    else {
        document.getElementById("optname").innerHTML = chrome.i18n.getMessage(e.target.dataset.i18ninner)
    }
    //alert(e.target.dataset.i18ninner)
    var _id = parseInt(e.target.id.substr(2));
    for (var i = 0; i < document.querySelectorAll("#menu>li").length; i++) {
        document.querySelectorAll("#menu>li")[i].className = "";
    }
    for (var i = 0; i < document.getElementsByClassName("tab").length; i++) {
        document.getElementsByClassName("tab")[i].style.display = "none"
    }

    if (document.getElementById('install_overlay'))
        document.getElementById('install_overlay').style.display = 'none';
    document.getElementById(e.target.id).className = "selli";
    document.getElementById("tab" + e.target.id.substr(2)).style.display = "inline";
    window.scrollTo(document.documentElement.offsetLeft, 0);

    /**/
    if (e.target.id == "liabout") {
        chrome.runtime.requestUpdateCheck(function (status, details) {
        })
    }

    if (document.getElementById("supportdev")) {
        document.getElementById("supportdev").id = "";
    }

};
const FnAddCancel = function (e) {
    if (document.querySelector("#adddirect select")) {
        var _obj = $("#adddirect select")[0].id.substring(0,1);
        var _id = $("#adddirect select")[0].id.substring(7);
        switch (_obj) {
            case"g":
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Mouse Gestures", gaAction: "New Mouse Gesture", gaLabel: $("#gselect" + _id).val() + "-" + "Cancel"});
                break;
            case"t":
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Add New Text button clicked", gaLabel: $("#tselect" + _id).val() + "-" + "Cancel"});
                break;
            case"l":
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Add New Link button clicked", gaLabel: $("#lselect" + _id).val() + "-" + "Cancel"});
                break;
            case"i":
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Add New Image button clicked", gaLabel: $("#iselect" + _id).val() + "-" + "Cancel"});
                break;
        }
        document.getElementById("addbox").removeChild(document.getElementById("adddirect"));
    }
    isOptionsPage = false;
    teststroke = false;
    testgesture = false;
    testdrag = false;
    document.getElementById("addbox").style.display = "none";
};
const FnDel = function (e) {
    var _delobj = e.target;
    var _id = parseInt(_delobj.id.substr(4));
    var _obj = _delobj.id.substr(0, 1);
    var _cfgobj1, _cfgobj2;
    switch (_obj) {
        case"g":
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Mouse Gestures", gaAction: "Mouse gesture deleted", gaLabel: $("#gselect" + _id).val()});
            _cfgobj1 = "gesture";
            _cfgobj2 = "gesture";
            break;
        case"t":
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Drag Text gesture deleted", gaLabel: $("#tselect" + _id).val()});
            _cfgobj1 = "drag";
            _cfgobj2 = "text";
            break;
        case"l":
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Drag Link gesture deleted", gaLabel: $("#lselect" + _id).val()});
            _cfgobj1 = "drag";
            _cfgobj2 = "link";
            break;
        case"i":
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Super Drag", gaAction: "Drag Image gesture deleted", gaLabel: $("#iselect" + _id).val()});
            _cfgobj1 = "drag";
            _cfgobj2 = "image";
            break;
    }
    var _imgobj = document.getElementById(_obj + "wrap" + _id).querySelectorAll("img")
    var _imgnum = _imgobj.length;
    var _thisdirect = "";
    for (var i = 0; i < _imgnum; i++) {
        _thisdirect = _thisdirect + _imgobj[i].src.substr(_imgobj[i].src.length - 5, 1).toUpperCase();
    }

    for (var i = 0 in config[_cfgobj1][_cfgobj2]) {
        if (config[_cfgobj1][_cfgobj2][i].direct == _thisdirect) {
            config[_cfgobj1][_cfgobj2].splice(i, 1);
            needToSave = true;
            document.getElementById(_obj + "wrap" + _id).parentNode.removeChild(document.getElementById(_obj + "wrap" + _id));
            return;
        }
    }

};
const FnAdd = function (obj1, obj2) {
    var _id = config[obj1][obj2].length;
    var _myobj = obj2.substr(0, 1);

    var _wrap = document.createElement("div");
    _wrap.className = _myobj + "wrap";
    _wrap.id = _myobj + "wrap" + _id;
    _wrap.style.margin = "0 130px";
    _wrap.style.border = "2px solid #303";
    var _gesture = document.createElement("div");
    _gesture.className = _myobj + "direct";
    _gesture.innerHTML = chrome.i18n.getMessage("listgesture");
    var _action = document.createElement("div");
    _action.className = _myobj + "action";
    _action.innerHTML = chrome.i18n.getMessage("listaction");
    var _del = document.createElement("input");
    _del.type = "button";
    _del.className = _myobj + "del";
    _del.id = _myobj + "del" + _id;
    _del.style.display = "none";
    _del.value = "delete";
    var _form = document.createElement("form");
    var _clear = document.createElement("div");
    _clear.style.clear = "both";

    /*gesture*/
    for (var j = 0 in optdirect) {
        var _img = document.createElement("img");
        _img.src = chrome.extension.getURL("") + "image/" + optdirect[j].toLowerCase() + ".png";
        _gesture.appendChild(_img);
    }

    _wrap.appendChild(_gesture);

    /*action*/
    var _select = document.createElement("select");
    _select.id = _myobj + "select" + _id;
    _select.classList.add('js-example-basic-single');


    var _act;
    var optgroups = [];
    optgroups[0] = document.createElement("optgroup");
    optgroups[0].label = chrome.i18n.getMessage("optgrpnone");//"无";
    optgroups[1] = document.createElement("optgroup");
    optgroups[1].label = chrome.i18n.getMessage("optgrpnav");//"导航";
    optgroups[2] = document.createElement("optgroup");
    optgroups[2].label = chrome.i18n.getMessage("optgrpscroll");//"滚动";
    optgroups[3] = document.createElement("optgroup");
    optgroups[3].label = chrome.i18n.getMessage("optgrpload");//"加载";
    optgroups[4] = document.createElement("optgroup");
    optgroups[4].label = chrome.i18n.getMessage("optgrptab");//"标签页";
    optgroups[5] = document.createElement("optgroup");
    optgroups[5].label = chrome.i18n.getMessage("optgrptabnav");//"标签页导航";
    optgroups[6] = document.createElement("optgroup");
    optgroups[6].label = chrome.i18n.getMessage("optgrpwindow");//"窗口";
    optgroups[7] = document.createElement("optgroup");
    optgroups[7].label = chrome.i18n.getMessage("optgrpcopy");//"复制";
    optgroups[8] = document.createElement("optgroup");
    optgroups[8].label = chrome.i18n.getMessage("optgrpother");//"其他";
    optgroups[9] = document.createElement("optgroup");
    optgroups[9].label = chrome.i18n.getMessage("optgrpapp");//"App";

    optgroups[10] = document.createElement("optgroup");
    optgroups[10].label = chrome.i18n.getMessage("optgrpsearch");//"搜索";

    optgroups[11] = document.createElement("optgroup");
    optgroups[11].label = chrome.i18n.getMessage("optgrpsave");//"保存";

    var grouptype;
    switch (obj2) {
        case"gesture":
        case"sgsleft":
        case"sgsright":
        case"strleft":
        case"strmiddle":
        case"strright":
            grouptype = "gesture";
            _act = "gesture";
            break;
        case"text":
            grouptype = "text";
            _act = "text";
            break;
        case"link":
            grouptype = "link";
            _act = "link";
            break;
        case"image":
            grouptype = "image";
            _act = "image";
            break;
    }

    for (var j = 0; j < action[obj2].length; j++) {

        var _option = document.createElement("option");
        _option.value = action[obj2][j].action;
        _option.innerHTML = chrome.i18n.getMessage(action[obj2][j].action).replace(":\"%s\"", "");

        if (grouptype == "gesture") {
            if (j < 1) {
                optgroups[0].appendChild(_option);
            }
            else if (j >= 1 && j < 8) {
                optgroups[1].appendChild(_option);
            }
            else if (j >= 8 && j < 14) {
                optgroups[2].appendChild(_option);
            }
            else if (j >= 14 && j < 20) {
                optgroups[3].appendChild(_option);
            }
            else if (j >= 20 && j < 29) {
                optgroups[4].appendChild(_option);
            }
            else if (j >= 29 && j < 33) {
                optgroups[5].appendChild(_option);
            }
            else if (j >= 33 && j < 40) {
                optgroups[6].appendChild(_option);
            }
            else if (j >= 40 && j < 44) {
                optgroups[7].appendChild(_option);
            }
            else if (j >= 44 && j < 49) {
                optgroups[8].appendChild(_option);
            }
            else {
                optgroups[9].appendChild(_option);
            }
        }
        else if (grouptype == "text") {
            if (j < 1) {
                optgroups[0].appendChild(_option);
            }
            else if (j >= 1 && j < 3) {
                optgroups[10].appendChild(_option);
            }
            else if (j == 3) {
                optgroups[7].appendChild(_option);
            }
            else {
                optgroups[8].appendChild(_option);
            }
        }
        else if (grouptype == "link") {
            if (j < 1) {
                optgroups[0].appendChild(_option);
            }
            else if (j >= 1 && j < 2) {
                optgroups[4].appendChild(_option);
            }//标签页
            else if (j >= 2 && j < 6) {
                optgroups[7].appendChild(_option);
            }//复制
            else {
                optgroups[8].appendChild(_option);
            }
        }
        else if (grouptype == "image") {
            if (j < 1) {
                optgroups[0].appendChild(_option);
            }
            else if (j == 1) {
                optgroups[4].appendChild(_option);
            }
            else if (j >= 2 && j < 4) {
                optgroups[11].appendChild(_option);
            }
            else if (j >= 4 && j < 5) {
                optgroups[7].appendChild(_option);
            }
            else if (j >= 5 && j < 7) {
                optgroups[10].appendChild(_option);
            }
            else {
                optgroups[8].appendChild(_option);
            }
        }
        else {
            optgroups[0].appendChild(_option);
        }
    }

    for (var k = 0; k < optgroups.length; k++) {
        if (optgroups[k].querySelectorAll("option").length != 0) {
            _select.appendChild(optgroups[k])
        }
    }

    _select.selectedIndex = -1;
    _form.appendChild(_del);
    _form.appendChild(_select);
    _action.appendChild(_form);
    _wrap.appendChild(_action);

    if (obj1 == "gesture") {
        var _whitelist = document.createElement("div");
        _whitelist.className = "gwhitelist";
        _whitelist.innerHTML = "<div class='wl_title'>" + chrome.i18n.getMessage("showwhitelist") + "</div>" +
            "<div class='wl_text'>" +
                "<div class='wltip'>" + chrome.i18n.getMessage("headlineforwhitelist") + "</div>" +
            "<textarea></textarea>" +
            "<div class='wltip'>" + chrome.i18n.getMessage("tipforwhitelist") + "</div>" +
            "<input class='wl_update' type='button' value='save'>" +
            "</div>";
        _wrap.appendChild(_whitelist);

        _wrap.setAttribute('index', _id);
        document.getElementById("editgesture").appendChild(_wrap);

        $("#gwrap" + _id + " .wl_title").click((e) => {
            const target = $(e.target);
            $(target).text(chrome.i18n.getMessage($(target).text() == chrome.i18n.getMessage("showwhitelist") ? "hidewhitelist" : "showwhitelist"));
            $(target).siblings(".wl_text").toggle();
        });


        $("#gwrap" + _id + " .wl_update").click((e) => {
            const target = $(e.target);
            const textArea = target.siblings('textarea').val();
            if (!textArea.match(/^[A-Za-z0-9\-\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\`\.%\n]*$/g))
                return alert("can't use unsupported characters, only those are supported: ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:/?#[]@!$&'()*+,;=`%.");
            const index = target.closest('div[index]').attr('index');
            config.gesture.gesture[index].whitelist = textArea.split('\n').filter((e) => {
                return e
            });
            needToSave = true;
        });
    }


    /**/

    if (document.getElementById("adddirect")) {
        document.getElementById("addbox").removeChild(document.getElementById("adddirect"));
    }

    var _adddirectobj = document.createElement("div");
    _adddirectobj.id = "adddirect";
    document.getElementById("addbox").insertBefore(_adddirectobj, document.getElementById("addbutton"));
    document.getElementById("adddirect").appendChild(_wrap);
    document.querySelector("#" + _myobj + "select" + _id).selectedIndex = -1;
    $('.js-example-basic-single').select2();
};

//load config
var config;
var optpages = true;
var teststroke = false;
var testdrag = false;
var testgesture = false;
var optdirect;
var needToSave = false;
var needToInit = false;
var noMsg = false;

try {
    if (!localStorage.getItem("config")) {
        config = JSON.parse(JSON.stringify(defaultConfig));
        localStorage.setItem("config", JSON.stringify(defaultConfig));
    } else {
        config = JSON.parse(localStorage.getItem("config"))
    }
} catch (e) {
    // fallback in case we have localStorage oversized
    config = JSON.parse(JSON.stringify(defaultConfig));
}
config.extid = chrome.runtime.id;

//whitelist support:
config.gesture.gesture.forEach((e, i) => {
    if (!config.gesture.gesture[i].whitelist) {
        console.log("will add whitelist");
        config.gesture.gesture[i].whitelist = [];
        checksave = true;
        noMsg = true;
    }
});


//fast reset config
document.getElementById("fastreset").innerHTML = chrome.i18n.getMessage("fastreset");
document.getElementById("fastreset").addEventListener("click", fnfastreset, false);
function fnfastreset() {
    localStorage.clear();
    localStorage.setItem("config", JSON.stringify(defaultConfig));
    window.location.reload();
}

//save config
window.setInterval(function () {
    if (needToSave) {
        config.gesture.gesture.forEach((e, i) => {
            if (!config.gesture.gesture[i].whitelist) {
                console.log("will add whitelist");
                config.gesture.gesture[i].whitelist = [];
            }
        });
        config.sync = true;
        localStorage.setItem("config", JSON.stringify(config));
        chrome.runtime.sendMessage({type: "syncup"});
        needToSave = false;
        needToInit = true;
        if (noMsg) {
//nothing
        }
        else {
            document.getElementById("msgbox").style.display = "block";
            window.setTimeout(function () {
                document.getElementById("msgbox").style.display = "none";
            }, 2000)
        }

        noMsg = false;
    }
}, 500);

editgesture("gesture", "gesture", "g");
editgesture("drag", "text", "t");
editgesture("drag", "link", "l");
editgesture("drag", "image", "i");
editgesture("scrollgesture", "sgsleft", "s");
editgesture("scrollgesture", "sgsright", "r");
editgesture("strokegesture", "strleft", "u");
editgesture("strokegesture", "strmiddle", "v");
editgesture("strokegesture", "strright", "w");

$('body').on('select2:open', () => {
    $('.select2-search__field').attr('placeholder', 'Search for an action');
});

$('body').on('select2:select', function (e) {
    crxChange(e);
});
window.addEventListener("change", function (e) {
    crxChange(e)
}, false);
window.addEventListener("click", function (e) {
    if (e.target.id.indexOf("del") != -1 && e.target.className.indexOf("del") != -1) {
        FnDel(e);
        return;
    }

    /**/
    if (e.target.className.indexOf("addok") != -1) {
        FnAddOk(e);
        return;
    }

    /**/
    if (e.target.id == "addcancel") {
        FnAddCancel(e);
        return;
    }

    /**/
    if (e.target.className == "newadd") {
        FnAddButton(e);
        return;
    }

    /**/
    if (e.target.id == "resetconfig") {
        FnResetAll(e);
        return;
    }

    /**/
    if (e.target.tagName.toLowerCase() == "li") {
        liclick(e);
        return;
    }

    /**/
    if (e.target.id == "import") {
        FnImport(e);
        return;
    }
    /**/
    if (e.target.id == "export") {
        FnExport(e);
        return;
    }

    if (e.target.dataset.reset) {
        pageReset(e);
        return;
    }
    if (e.target.id == "clearsyncdata") {
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Advanced Settings", gaAction: "Clear Sync"});
        chrome.runtime.sendMessage({type: "syncclear"}, function (response) {
        })
        return;
    }

    if (e.target.id == "firsttimeclose") {
        document.getElementById("firsttime").style.display = "none";
    }


    if (e.target.id == "starsdonate") {//
        for (var i = 0; i < document.querySelectorAll("#menu>li").length; i++) {
            document.querySelectorAll("#menu>li")[i].className = "";
        }
        for (var i = 0; i < document.getElementsByClassName("tab").length; i++) {
            document.getElementsByClassName("tab")[i].style.display = "none"
        }

        document.querySelectorAll("#menu>li")[8].className = "selli";
        document.getElementById("tababout").style.display = "inline";
        window.scrollTo(document.documentElement.offsetLeft, 240);
        document.getElementsByClassName("supportdev")[0].id = "supportdev";
        e.preventDefault();
    }

}, false);

document.getElementById("optname").innerHTML = chrome.i18n.getMessage("normal") + "\<a href='###' data-reset='normal'>" + chrome.i18n.getMessage("resetpage") + "\<\/a\>"
document.getElementById("fastreset").parentNode.removeChild(document.getElementById("fastreset"));

(function optInit() {
    //fnSurport();

    if(config["gesture"]["gholdkeytype"] === "enable" || config["gesture"]["gholdkeytype"] === undefined) {
        document.querySelector(".gesradioholdkeytypeenable").checked = "checked";
    } else {
        document.querySelector(".gesradioholdkeytypedisable").checked = "checked";
    }

    var _checkobj = document.querySelectorAll("input[type=checkbox]");
    for (var i = 0; i < _checkobj.length; i++) {
        if (_checkobj[i].className.indexOf("nor") == 0) {
            _checkobj[i].checked = config.normal[_checkobj[i].id];
        }
        if (_checkobj[i].className.indexOf("ges") == 0) {
            _checkobj[i].checked = config.gesture[_checkobj[i].id];
        }
        if (_checkobj[i].className.indexOf("drg") == 0) {
            _checkobj[i].checked = config.drag[_checkobj[i].id];
        }
        if (_checkobj[i].className.indexOf("scr") == 0) {
            _checkobj[i].checked = config.scroll[_checkobj[i].id];
        }
        if (_checkobj[i].className.indexOf("sgs") == 0) {
            _checkobj[i].checked = config.scrollgesture[_checkobj[i].id];
        }
        if (_checkobj[i].className.indexOf("str") == 0) {
            _checkobj[i].checked = config.strokegesture[_checkobj[i].id];
        }
        if (_checkobj[i].className.indexOf("cbx") == 0) {
            _checkobj[i].checked = !config.isGesturesOff;
        }
    }

    var _textobj = document.querySelectorAll("input[type=text]");
    for (var i = 0; i < _textobj.length; i++) {
        if (_textobj[i].className.indexOf("nor") == 0) {
            _textobj[i].value = config.normal[_textobj[i].id];
            _textobj[i].style.backgroundColor = "#" + config.normal[_textobj[i].id]
        }
        if (_textobj[i].className.indexOf("ges") == 0) {
            _textobj[i].value = config.gesture[_textobj[i].id];
            _textobj[i].style.backgroundColor = "#" + config.gesture[_textobj[i].id]
        }
        if (_textobj[i].className.indexOf("drg") == 0) {
            _textobj[i].value = config.drag[_textobj[i].id];
            _textobj[i].style.backgroundColor = "#" + config.drag[_textobj[i].id]
        }
    }


    var _rangeobj = document.querySelectorAll("input[type=range]");
    for (var i = 0; i < _rangeobj.length; i++) {
        if (_rangeobj[i].className.indexOf("nor") == 0) {
            _rangeobj[i].value = config.normal[_rangeobj[i].id];
            document.getElementById(_rangeobj[i].id + "hold").innerHTML = config.normal[_rangeobj[i].id];
        }
        if (_rangeobj[i].className.indexOf("ges") == 0) {
            _rangeobj[i].value = config.gesture[_rangeobj[i].id];
            document.getElementById(_rangeobj[i].id + "hold").innerHTML = config.gesture[_rangeobj[i].id];
        }
        if (_rangeobj[i].className.indexOf("drg") == 0) {
            _rangeobj[i].value = config.drag[_rangeobj[i].id];
            document.getElementById(_rangeobj[i].id + "hold").innerHTML = config.drag[_rangeobj[i].id];
        }
        if (_rangeobj[i].className.indexOf("scr") == 0) {
            _rangeobj[i].value = config.scroll[_rangeobj[i].id];
            document.getElementById(_rangeobj[i].id + "hold").innerHTML = config.scroll[_rangeobj[i].id];
        }
    }

    var _tablistradioobj = document.getElementsByName("tablistkey");
    for (var i = 0; i < _tablistradioobj.length; i++) {
        if (_tablistradioobj[i].value == config.scrollgesture.tablistkey) {
            _tablistradioobj[i].checked = true;
        }
    }

    var _norselectobj = document.querySelectorAll("select.norselect");
    for (var i = 0; i < _norselectobj.length; i++) {
        for (var j = 0; j < _norselectobj[i].options.length; j++) {
            if (_norselectobj[i].options[j].value == config.normal[_norselectobj[i].id]) {
                _norselectobj[i].selectedIndex = j
            }
        }
    }

    var _gesselectobj = document.querySelectorAll("select.gesselect");
    for (var i = 0; i < _gesselectobj.length; i++) {
        for (var j = 0; j < _gesselectobj[i].options.length; j++) {
            if (_gesselectobj[i].options[j].value == config.gesture[_gesselectobj[i].id]) {
                _gesselectobj[i].selectedIndex = j
            }
        }
    }

    var _drgselectobj = document.querySelectorAll("select.drgselect");
    for (var i = 0; i < _drgselectobj.length; i++) {
        for (var j = 0; j < _drgselectobj[i].options.length; j++) {
            if (_drgselectobj[i].options[j].value == config.drag[_drgselectobj[i].id]) {
                _drgselectobj[i].selectedIndex = j
            }
        }
    }

    var _strselectobj = document.querySelectorAll("select.strselect");
    for (var i = 0; i < _strselectobj.length; i++) {
        for (var j = 0; j < _strselectobj[i].options.length; j++) {
            if (_strselectobj[i].options[j].value == config.strokegesture[_strselectobj[i].id]) {
                _strselectobj[i].selectedIndex = j
            }
        }
    }

    if (!config.normal.gesture) {
        document.getElementById("ligesture").style.display = "none";
    }
    if (!config.normal.drag) {
        document.getElementById("lidrag").style.display = "none";
    }
    if (!config.normal.scroll) {
        document.getElementById("liscroll").style.display = "none";
    }
    if (!config.normal.scrollgesture) {
        document.getElementById("liscrollgesture").style.display = "none";
    }
    if (!config.normal.strokegesture) {
        document.getElementById("listrokegesture").style.display = "none";
    }

    if (window.navigator.userAgent.toLowerCase().indexOf("windows") != -1) {
        document.getElementById("cancelcontextmenu").disabled = true;
    }
    handleCRXDisabledOptions(config.isGesturesOff, config.normal);
})();

(function i18n() {
    var _buttonobj = document.querySelectorAll("input[type=button]");
    for (var i = 0; i < _buttonobj.length; i++) {
        _buttonobj[i].value = chrome.i18n.getMessage(_buttonobj[i].value) || _buttonobj[i].value;
    }

    /**/
    var _innerobj = document.querySelectorAll("[data-i18ninner]")//[0].dataset.i18ninner
    for (var i = 0; i < _innerobj.length; i++) {
        _innerobj[i].innerHTML = chrome.i18n.getMessage(_innerobj[i].dataset.i18ninner)
    }
    document.getElementById("version").innerHTML = "Ver " + chrome.runtime.getManifest().version;
    document.getElementById("portconfig").placeholder = chrome.i18n.getMessage("placeholderconfig");
    document.title = chrome.i18n.getMessage("settings");
})();

function selectbackground(e) {
    if (e.target.id.substr(0, 1) == "g"
        || e.target.id.substr(0, 1) == "s"
        || e.target.id.substr(0, 1) == "r") {
        for (var j = 0; j < e.target.options.length; j++) {
            if (j == 0) {
                e.target.options[j].style.background = "#669";
            }
            if ((j >= 5 && j <= 8) || (j >= 13 && j <= 17) || (j >= 15 && j <= 19) || (j >= 25 && j <= 28) || (j >= 33 && j <= 34) || (j >= 41 && j <= 45)) {
                e.target.options[j].style.background = "#d2dbed";
            }
        }
    }
}

(function addRateUs() {
    var createStar = function (id) {
        var div = document.createElement("div");
        div.className = "rateusStar";
        div.id = id;
        return div;
    };

    var li = document.getElementById('lirateus');
    var div = document.createElement("div");
    li.appendChild(createStar("leftStar"));
    li.appendChild(div);
    li.appendChild(createStar("rightStar"));
    div.className = 'text';
    div.textContent = chrome.i18n.getMessage("rateus");
    li.onclick = "return false";
    li.addEventListener("click", function (e) {
        chrome.tabs.create({url: "https://chrome.google.com/webstore/detail/crxmouse-chrome-gestures/"+ chrome.runtime.id +"/reviews"});
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Settings navigation", gaAction: "Rate Us clicked"});
    }, false);
})();


const appendInstallOverlay = () => {

    const div = document.createElement('div');
    div.id='install_overlay';
    div.innerHTML = "<div class='title'><img src='/image/logo_name.svg'></div>" +
        "<div class='main_message_zone'>" +
            "<h1>Thank you for using CrxMouse</h1>" +
            "<h2>Enable Advanced Features</h2>" +
            "<p>For CrxMouse to offer the best experience possible and show you recommended gestures for every visited page, we need access to your visited URLs. Click 'Agree' to indicate that we may have access to your visited URLs for use according to our <a href=\"https://crxmouse.com/privacy/\" target='_blank'>Privacy Policy</a>.</p>" +
            "<div class='buttons'>" +
                "<div class='button disagree'>Disagree</div>" +
                "<div class='button agree'>Agree</div>" +
            "</div>" +
        "</div>"+
        "<div class='main_message_zone_disagree'>" +
            "<div class='disagree_princess_wrapper'>" +
                "<img class='princess' src='/image/Princess_in_distress.gif'>" +
            "</div>" +
            "<div class='disagree_title'>Advanced features are turned off</div>" +
            "<div class='disagree_subtitle'>We care about your privacy. The data we collect is necessary for us to be able " +
            "to show you gesture recommendations, and is not used by us to profile or determine the identity of our users.</div>" +
            "<div class='disagree_subtitle bold'>Go back and click 'Agree' to enable this feature. If you do nothing, you stay opted out and the feature will remain turned off.</div>" +
            "<div class='disagree_goback'>Go Back</div>" +
        "</div>"
    "</div>";
    document.body.appendChild(div);

    document.getElementsByClassName('disagree')[0].addEventListener('click',(e) => {
        config.normal.clickedOptin = true;
        chrome.runtime.sendMessage({type: "madeASelectionOptin"});
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "General", gaAction: "Install Overlay", gaLabel: "Disagree", gaValue: isJustAfterInstall ? "1" : null});
        document.getElementsByClassName('main_message_zone_disagree')[0].style.display = 'flex';
        document.getElementsByClassName('main_message_zone')[0].style.display = 'none';
        e.target.className += " selected";
    });

    document.getElementsByClassName('agree')[0].addEventListener('click',() => {
        config.normal.clickedOptin = true;
        chrome.runtime.sendMessage({type: "madeASelectionOptin"});
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "General", gaAction: "Install Overlay", gaLabel: "Agree", gaValue: isJustAfterInstall ? "1" : null});
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "General", gaAction: "Send anonymous data", gaLabel:  "On" });
        chrome.runtime.sendMessage({type: "toggleOptedOut", optedout: false, preventReload: true});
        chrome.runtime.sendMessage({type: "openOnboarding"});
        location.reload();
    });

    document.getElementsByClassName("disagree_goback")[0].addEventListener('click', () => {
        document.getElementsByClassName('main_message_zone_disagree')[0].style.display = 'none';
        document.getElementsByClassName('main_message_zone')[0].style.display = 'flex';
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "General", gaAction: "Install Overlay", gaLabel: "Go back", gaValue: isJustAfterInstall ? "1" : null});
    });
};
/*adding the opt out handling checkbox to the page:*/
(function addOptOut() {

    //checking opt out state:
    chrome.storage.sync.get("optedout", function (obj) {

        let optOutContainer = document.getElementsByClassName('optout_container')[0];

        if(obj["optedout"]){


            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "General", gaAction: "Install Overlay", gaLabel: "Shown"});
            appendInstallOverlay();
            if(!config.normal.clickedOptin && !location.href.includes('install=true')) {
                document.getElementById('tabnormal').style.display = "block";
                let overlayOptinScript = document.createElement('script');
                overlayOptinScript.src = chrome.extension.getURL(('js/optedoutOverlay.js'));
                document.body.appendChild(overlayOptinScript);
            } else {
                document.getElementById("install_overlay").style.display = "block";
            }

            optOutContainer.className = "optout_cta_container";
            let cta = document.createElement('div');
            cta.innerHTML = chrome.i18n.getMessage("ctatoenableadvanced");
            cta.className = "optout_cta";
            optOutContainer.appendChild(cta);
            cta.addEventListener('click',()=>{
                if(document.getElementsByClassName("selli")[0]) {
                    document.getElementsByClassName("selli")[0].classList.remove("selli");
                }
                document.getElementById("install_overlay").style.display = "block";
                document.getElementsByClassName('main_message_zone_disagree')[0].style.display = 'none';
                document.getElementsByClassName('main_message_zone')[0].style.display = 'flex';
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "General", gaAction: "Enable Advanced Features", gaLabel: "Clicked", gaValue: isJustAfterInstall ? "1" : null});
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "General", gaAction: "Install Overlay", gaLabel: "Shown"});
            })
        } else {
            //adding the checkbox - opted in view
            let input = document.createElement('input');
            input.id = 'optout';
            input.name = 'optout';
            input.type = 'checkbox';
            input.checked = obj["optedout"] ? !obj["optedout"] : true;
            input.addEventListener('click', () => {
                chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "General", gaAction: "Send anonymous data", gaLabel: input.checked ? "On" : "Off"});
                //if clicking the checkbox, will change the state + alert to the user + change text
                if (!input.checked)
                    alert(chrome.i18n.getMessage("optmodealert"));
                chrome.runtime.sendMessage({type: "toggleOptedOut", optedout: !input.checked});
                location.reload();
            });

            let label = document.createElement('label');
            label.setAttribute('for', 'optout');
            label.innerHTML = chrome.i18n.getMessage("optmode");

            optOutContainer.appendChild(input);
            optOutContainer.appendChild(label);

            document.getElementById('linormal').className = "selli";
            document.getElementById("tabnormal").style.display = "inline";
            window.scrollTo(document.documentElement.offsetLeft, 0);

        }

        document.body.style.display = 'block';

    });

})();

const addOnboardingBanner = () => {
    const img = document.createElement('img');
    img.src = '/image/onboarding-banner.png';

    const a = document.createElement('a');
    a.target = '_blank';
    a.href = ONBOARDING_PAGE_1;
    a.onclick = () => {
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Settings navigation", gaAction: "Go to Onboarding"});
    };
    a.appendChild(img);

    const div = document.getElementById('onboarding-banner');
    div.appendChild(a);
};

addOnboardingBanner();

const isMac = () => /^Mac/.test(window.navigator.platform);
const isWindows = () => /^Win/.test(window.navigator.platform);

const disableOptionsForDifferentBrowsers = () => {
    try {
        if (isMac()) {
            const option = document.querySelector('#imgfirst [value=ctrl]');
            option.disabled = true;
        }
        if(isWindows()) {
            const option = document.querySelector("#gholdkey [value=alt]");
            option.disabled = true;
        }
    } catch (e) {
        // Fail silently.
    }
};

const setSuperDragImageOverrideKeyToNone = () => {
    try {
        const select = document.querySelector('#imgfirst');
        const options = select.options;
        const selectedOption = options[select.selectedIndex].value;

        if (selectedOption === 'alt' || (isMac() && selectedOption === 'ctrl')) {
            document.querySelector('#imgfirst [value=none]').selected = true;
            config.drag.imgfirst = 'none';
            noMsg = true;
            needToSave = true;
        }
    } catch (e) {
        // Fail silently.
    }
};


// Alert if wheel gestures overlap.
const alertIfWheelGesturesOverlap = () => {
    try {
        const tabList = document.getElementById('tablist');
        const tabListLeft = document.getElementById('tablistkeyleft');
        const tabListRight = document.getElementById('tablistkeyright');
        const gestureLeft = document.getElementById('sgsleftenable');
        const gestureRight = document.getElementById('sgsrightenable');

        if (tabList.checked === true
            && ((tabListLeft.checked === true && gestureLeft.checked === true)
                || (tabListRight.checked === true && gestureRight.checked === true))) {

            alert(chrome.i18n.getMessage('wheelgesturealert'));
        }
    } catch (e) {
        // Fail silently.
    }
};

document.querySelectorAll('#tablist, #tablistkeyleft, #tablistkeyright, #sgsleftenable, #sgsrightenable').forEach((elm) => {
    elm.addEventListener('click', alertIfWheelGesturesOverlap);
});

const onboardingListener = () => {
    window.onload = () => {
        const elementToObserve = document.getElementById('install_overlay');
        let observer = new IntersectionObserver((entry) => {
            const firstSessionPage = chrome.extension.getURL('options.html?install=true');
            const isntIntersecting = !entry[0].isIntersecting;
            if(isntIntersecting && location.href === firstSessionPage && config.normal.clickedOptin) {
                chrome.runtime.sendMessage({type: "openOnboarding"});
                observer.disconnect();
            }
        });
        if (elementToObserve) {
            observer.observe(elementToObserve);
        }
    };
};

if(chrome.i18n.getUILanguage() === "de") {
    $("#logo span").css("font-size","24px");
}

const initMouseCursors = () => {
    const cursorImages = document.querySelectorAll(".mousecursorsrow img");
    const imgScaleRange = document.getElementById('cursorimgscale');
    const unselectAllImages = () => {
        cursorImages.forEach((cursorImage) => {
            cursorImage.className = "";
        });
    };

    const setUploadImageInView = (cursorImages) => {
        unselectAllImages();
        const img = document.querySelector(".imageuploadlabel img");
        document.querySelector("#imageupload").classList = 'imageuploadselected';
        img.src = atob(localStorage.getItem('imgData'));
        document.getElementById('cursorimgscalehold').innerHTML = config.normal.cursorimgscale;
        imgScaleRange.value = config.normal.cursorimgscale;
        imgScaleRange.disabled = true;
        imgScaleRange.setAttribute('style', 'background:grey !important');
    };

    const emptyUploadImage = () => {
        localStorage.removeItem("imgData");
        const imageUploadWrapper = document.querySelector("#imageupload");
        imageUploadWrapper.classList = 'imageupload';
        const imageUpload = document.querySelector(".imageuploadlabel img");
        imageUpload.src = "image/transparent.svg";
        document.getElementById('cursorimgscalehold').innerHTML = config.normal.cursorimgscale;
        imgScaleRange.value = config.normal.cursorimgscale;
        imgScaleRange.disabled = false;
        imgScaleRange.removeAttribute('style');
    };

    cursorImages.forEach((cursorImage) => {
        const selectedImage = config.normal.cursorimg;
        // set selected img
        const cleanImgSrc = `${cursorImage.src.substring(0, cursorImage.src.indexOf('@'))}.png`;
        if(cleanImgSrc === selectedImage) {
            cursorImage.classList.add("mousecursorselected");
        }
        // onclick cursor images
        cursorImage.addEventListener('click', () => {
            unselectAllImages();
            cursorImage.classList.add("mousecursorselected");
            config.normal.cursorimg = cleanImgSrc;
            needToSave = true;

            // revert uploaded image to empty
            emptyUploadImage();
            const gaLabel = cleanImgSrc.substring(cleanImgSrc.lastIndexOf('/') + 1);
            chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Mouse Cursor", gaAction: "Icon Selected", gaLabel: gaLabel});

        });
    });

    if(config.normal.cursorimg === 'localStorage') {
        setUploadImageInView(cursorImages);
    }

    //upload image handler
    document.getElementById("uploadimageinput").addEventListener("change", (e) => {
        let file = e.target.files[0];
        if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
            alert("Image file type not supported. Try again.");
            return;
        }
        if (file.size > 21000) {
            alert("Image file size not supported. Try again.");
            return;
        }
        const fReader = new FileReader();
        fReader.readAsDataURL(file);
        fReader.onload = () => {
            var img = new Image();
            img.src = window.URL.createObjectURL( file );
            img.onload = () => {
                const width = img.naturalWidth, height = img.naturalHeight;
                // check image dimension are compatible
                if((width === 16 && height === 16) || (width === 32 && height === 32) || (width === 48 && height === 48)) {
                    localStorage.setItem("imgData", btoa(fReader.result));
                    config.normal.cursorimg = 'localStorage';
                    let scale = (width / 16).toString();
                    config.normal.cursorimgscale = scale;
                    needToSave = true;
                    setUploadImageInView(cursorImages);
                    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Mouse Cursor", gaAction: "Icon Upload"});

                } else {
                    alert("Image size not supported. Try again.");
                }
            };
        };
    });

    document.querySelector(".defaultcursor").addEventListener("click", (e) => {
        config.normal.cursorimg = null;
        config.normal.cursorimgscale = 1;
        needToSave = true;
        unselectAllImages();
        emptyUploadImage();
        chrome.runtime.sendMessage({type: "gaEvent", gaCategory: "Mouse Cursor", gaAction: "Return to default"});
    });
};

initMouseCursors();
setSuperDragImageOverrideKeyToNone();
disableOptionsForDifferentBrowsers();
onboardingListener();
