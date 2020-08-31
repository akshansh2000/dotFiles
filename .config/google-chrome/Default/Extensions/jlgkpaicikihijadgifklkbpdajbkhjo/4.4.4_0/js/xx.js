function editgesture(cfg1, cfg2, obj1, obj2) {

    var _act;
    if (!obj2) {
        _act = cfg2
    }
    else {
        _act = "gesture"
    }

    if (obj1 == "s" || obj1 == "r" || obj1 == "u" || obj1 == "v" || obj1 == "w") {
        _act = "gesture"
    }

    for (var i = 0; i < config[cfg1][cfg2].length; i++) {

        var _wrap = document.createElement("div");
        _wrap.className = obj1 + "wrap";
        _wrap.id = obj1 + "wrap" + i;
        var _gesture = document.createElement("div");
        _gesture.className = obj1 + "direct";
        _gesture.innerHTML = chrome.i18n.getMessage("listgesture");
        var _action = document.createElement("div");
        _action.className = obj1 + "action";

        if (obj1 == "s" || obj1 == "r") {
            if (i == 0) {
                _action.innerHTML = chrome.i18n.getMessage("scractup");
            }
            else {
                _action.innerHTML = chrome.i18n.getMessage("scractdown");
            }
        }
        else if (obj1 == "u") {
            if (i == 0) {
                _action.innerHTML = chrome.i18n.getMessage("stractmiddle");
            }
            else {
                _action.innerHTML = chrome.i18n.getMessage("stractright");
            }
        }
        else if (obj1 == "v") {
            if (i == 0) {
                _action.innerHTML = chrome.i18n.getMessage("stractleft");
            }
            else {
                _action.innerHTML = chrome.i18n.getMessage("stractright");
            }
        }
        else if (obj1 == "w") {
            if (i == 0) {
                _action.innerHTML = chrome.i18n.getMessage("stractleft");
            }
            else {
                _action.innerHTML = chrome.i18n.getMessage("stractmiddle");
            }
        }
        else {
            _action.innerHTML = chrome.i18n.getMessage("listaction");
        }

        var _del = document.createElement("input");
        _del.type = "button";
        _del.className = obj1 + "del";
        _del.id = obj1 + "del" + i;
        _del.value = "delete";
        var _form = document.createElement("form");

        /*gesture*/
        for (var j = 0 in config[cfg1][cfg2][i].direct) {
            if (obj1 == "s" || obj1 == "r" || obj1 == "u" || obj1 == "v" || obj1 == "w") {
                break;
            }
            var _img = document.createElement("img");
            _img.src = chrome.extension.getURL("") + "image/" + config[cfg1][cfg2][i].direct[j].toLowerCase() + ".png";
            _gesture.appendChild(_img);
        }
        if (_img) {
            _wrap.appendChild(_gesture);
        }

        /**/

        /*action*/
        var _select = document.createElement("select");
        _select.id = obj1 + "select" + i;
        _select.className = 'js-example-basic-single';
        if(obj1 === "v" || obj1 === "w" || obj1 === "u"){
            _select.setAttribute("strokegesture", "true");
        } else if(obj1 === "s" || obj1 === "r"){
            _select.setAttribute("scrollgesture", "true");
        }
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
        switch (cfg2) {
            case"gesture":
            case"sgsleft":
            case"sgsright":
            case"strleft":
            case"strmiddle":
            case"strright":
                grouptype = "gesture";
                break;
            case"text":
                grouptype = "text";
                break;
            case"link":
                grouptype = "link";
                break;
            case"image":
                grouptype = "image";
                break;
        }

        for (var j = 0; j < action[_act].length; j++) {
            var _option = document.createElement("option");
            _option.value = action[_act][j].action;
            _option.innerHTML = chrome.i18n.getMessage(action[_act][j].action).replace(":\"%s\"", "");

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
                else if (j >= 20 && j < 31) {
                    optgroups[4].appendChild(_option);
                }
                else if (j >= 31 && j < 35) {
                    optgroups[5].appendChild(_option);
                }
                else if (j >= 35 && j < 42) {
                    optgroups[6].appendChild(_option);
                }
                else if (j >= 42 && j < 46) {
                    optgroups[7].appendChild(_option);
                }
                else if (j >= 46 && j < 53) {
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
        _form.appendChild(_select);

        if (obj1 == "s" || obj1 == "r" || obj1 == "u" || obj1 == "v" || obj1 == "w") {
            //nothing
        } else {
            _form.appendChild(_del);
        }
        _action.appendChild(_form);
        _wrap.appendChild(_action);

        if (obj1 == "g") {
            var _whitelist = document.createElement("div");
            _whitelist.className = obj1 + "whitelist";
            _whitelist.innerHTML = "<div class='wl_title'>" + chrome.i18n.getMessage("showwhitelist") + "</div>" +
                "<div class='wl_text'>" +
                "<div class='wltip'>" + chrome.i18n.getMessage("headlineforwhitelist") + "</div>" +
                "<textarea>" + config.gesture.gesture[i].whitelist.join('\n') + "</textarea>" +
                "<div class='wltip'>" + chrome.i18n.getMessage("tipforwhitelist") + "</div>" +
                "<input class='wl_update' type='button' value=" + chrome.i18n.getMessage("savewhitelist") + ">" +
                "</div>";
            _wrap.appendChild(_whitelist);
        }

        _wrap.setAttribute('index', i);
        document.getElementById("edit" + cfg2).appendChild(_wrap);

        if (obj1 == "g") {

            $("#gwrap" + i + " .wl_title").click((e) => {
                const target = $(e.target);
                $(target).text(chrome.i18n.getMessage($(target).text() == chrome.i18n.getMessage("showwhitelist")  ? "hidewhitelist" : "showwhitelist"));
                $(target).siblings(".wl_text").toggle();
            });

            $("#gwrap" + i + " .wl_update").click((e) => {
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

    }


    for (var i = 0; i < document.getElementsByClassName(obj1 + "wrap").length; i++) {

        /*set select value*/
        for (var j = 0; j < action[_act].length; j++) {
            if (document.getElementsByClassName(obj1 + "wrap")[i].querySelectorAll("form>select option")[j].value == config[cfg1][cfg2][i].action) {
                document.getElementsByClassName(obj1 + "wrap")[i].querySelector("form>select").selectedIndex = j;
                break;
            }
            else {
                document.getElementsByClassName(obj1 + "wrap")[i].querySelector("form>select").selectedIndex = -1;
            }
        }

        /*show more*/
        var _morehold = document.createElement("div");
        _morehold.className = "morehold";

        /*more new*/
        var moreArray = ["moreName", "moreURL", "moreScript", "moreCapturetype", "moreTsearch", "moreIsearch", "moreChromepage", "morePosition", "morePinned", "moreTarget", "moreClosesel", "moreCloseopts", "moreTab", "moreMatch", "moreCopystyle", "moreDes", "moreCloseurl"];
        var moreEle = [];
        for (var ii in moreArray) {
            if (!config[cfg1][cfg2][i][moreArray[ii]]) {
                continue
            }

            if (moreArray[ii] == "moreTarget"
                || moreArray[ii] == "moreTsearch"
                || moreArray[ii] == "moreIsearch"
                || moreArray[ii] == "moreChromepage"
                || moreArray[ii] == "morePosition"
                || moreArray[ii] == "morePinned"
                || moreArray[ii] == "moreCapturetype"
                || moreArray[ii] == "moreClosesel"
                || moreArray[ii] == "moreCloseopts") {
                moreEle[moreArray[ii]] = document.createElement("select");
                moreEle[moreArray[ii]].name = moreArray[ii];
                moreEle[moreArray[ii]].title = chrome.i18n.getMessage(moreArray[ii] + "title");
                var optionsArray = action[moreArray[ii].substr(4)];
                var optionsEle = [];
                for (var iii = 0; iii < optionsArray.length; iii++) {
                    optionsEle[optionsArray[iii]] = document.createElement("option");
                    optionsEle[optionsArray[iii]].value = optionsArray[iii];
                    optionsEle[optionsArray[iii]].innerHTML = chrome.i18n.getMessage(optionsArray[iii]) ? chrome.i18n.getMessage(optionsArray[iii]) : optionsArray[iii];
                    moreEle[moreArray[ii]].appendChild(optionsEle[optionsArray[iii]]);
                    if (moreEle[moreArray[ii]].options[iii].value == config[cfg1][cfg2][i][moreArray[ii]]) {
                        moreEle[moreArray[ii]].selectedIndex = iii;
                    }
                }
            }
            else if (moreArray[ii] == "moreScript") {
                moreEle[moreArray[ii]] = document.createElement("textarea");
                moreEle[moreArray[ii]].wrap = "virtual";
                moreEle[moreArray[ii]].name = moreArray[ii];
                moreEle[moreArray[ii]].value = config[cfg1][cfg2][i][moreArray[ii]];
                moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage(moreArray[ii] + "title");
            }
            else {
                moreEle[moreArray[ii]] = document.createElement("input");
                moreEle[moreArray[ii]].type = "text";
                moreEle[moreArray[ii]].name = moreArray[ii];
                moreEle[moreArray[ii]].value = config[cfg1][cfg2][i][moreArray[ii]];
                moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage(moreArray[ii]);
                if (moreArray[ii] == "moreDes") {
                    if (config[cfg1][cfg2][i].action.indexOf("newusertab") != -1) {
                        moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titlenewusertab")
                    }

                    else if (config[cfg1][cfg2][i].action.indexOf("T_search") != -1) {
                        moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titletsearch")
                    }

                    else if (config[cfg1][cfg2][i].action.indexOf("I_search") != -1) {
                        moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titleisearch")
                    }

                    else if (config[cfg1][cfg2][i].action.indexOf("userscript") != -1) {
                        moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titleuserscript")
                    }

                    else if (config[cfg1][cfg2][i].action.indexOf("G_chromepage") != -1) {
                        moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titlechromepage");
                    }
                    else if (config[cfg1][cfg2][i].action == "G_trynext" || config[cfg1][cfg2][i].action == "G_tryprev") {
                        moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("moreDestitle");
                    }
                    else if (config[cfg1][cfg2][i].action.indexOf("copyuser") != -1) {
                        moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titlecopyuser")
                    }
                    else {
                        moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage(moreArray[ii] + "title");
                    }
                }
                if (moreArray[ii] == "moreURL" && config[cfg1][cfg2][i].action.indexOf("searchuser") != -1) {
                    moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage("titlesearchuser");
                }

                if (moreArray[ii] == "moreMatch") {
                    if (config[cfg1][cfg2][i].action == "G_trynext") {
                        moreEle[moreArray[ii]].value = config[cfg1][cfg2][i].moreMatch;
                    }
                    if (config[cfg1][cfg2][i].action == "G_tryprev") {
                        moreEle[moreArray[ii]].value = config[cfg1][cfg2][i].moreMatch;
                    }
                    moreEle[moreArray[ii]].title = moreEle[moreArray[ii]].placeholder = chrome.i18n.getMessage("titlenexpre");
                }

                if (moreArray[ii] == "moreCopystyle" && config[cfg1][cfg2][i].action.indexOf("copyuser") != -1) {
                    moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage("moreCopystyletitle");
                }

                if (moreArray[ii] == "moreCloseurl"/*&&_obj.value.indexOf("copyuser")!=-1*/) {
                    moreEle[moreArray[ii]].placeholder = moreEle[moreArray[ii]].title = chrome.i18n.getMessage("moreCloseurltitle");
                }

            }

            if (moreEle[moreArray[ii]]) {
                _morehold.appendChild(moreEle[moreArray[ii]]);
            }
        }

        for (var ii in moreArray) {
            if (moreEle[moreArray[ii]]) {
                var moreSavebutton = document.createElement("input");
                moreSavebutton.type = "button";
                moreSavebutton.value = "save";
                moreSavebutton.id = "moresave" + obj1 + i;
                _morehold.appendChild(moreSavebutton);
                break;
            }
        }
        /**/

        for (var ii in moreArray) {
            if (moreEle[moreArray[ii]]) {
                document.querySelector("#" + obj1 + "wrap" + i + " form").appendChild(_morehold);
                break;
            }
        }
        if (document.getElementById("moresave" + obj1 + i)) {
            document.getElementById("moresave" + obj1 + i).addEventListener("click", _fnmoresave, false);
        }
        function _fnmoresave() {
            var _id = this.id.substr(9);
            var _texts = this.parentNode.querySelectorAll("input[type=text]");
            var _selects = this.parentNode.querySelectorAll("select");

            if (_texts.length != 0 && _texts[0].value == "") {
                alert(chrome.i18n.getMessage("alertname"));
                return;
            }

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

            if (this.parentNode.querySelectorAll("textarea")[0] && !this.parentNode.querySelectorAll("textarea")[0].value) {
                alert(chrome.i18n.getMessage("alertname"));
                return;
            }

            /*save*/
            for (var i = 0; i < _texts.length; i++) {
                if (_texts[i].name == "moreURL" || _texts[i].name == "moreCloseurl") {
                    if (CheckURL(_texts[i].value)) {
                        _texts[i].value = CheckURL(_texts[i].value);
                    }
                    else {
                        alert(chrome.i18n.getMessage("alerturl"));
                        return;
                    }
                }
                config[cfg1][cfg2][_id][_texts[i].name] = _texts[i].value;
            }

            for (var i = 0; i < _selects.length; i++) {
                config[cfg1][cfg2][_id][_selects[i].name] = _selects[i].value;
            }

            if (this.parentNode.querySelectorAll("textarea")[0]) {
                config[cfg1][cfg2][_id].moreScript = this.parentNode.querySelectorAll("textarea")[0].value;
            }

            needToSave = true;
        }

    }

    if (document.getElementById("edit" + cfg2).firstChild) {
        var _clear = document.createElement("div");
        _clear.style.clear = "both";
        _clear.id = obj1 + "clear";
        document.getElementById("edit" + cfg2).appendChild(_clear);
    }
    $('.js-example-basic-single').select2();
}
