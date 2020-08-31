/**
 * Created by yrst on 2/23/2016.
 * for showing update info
 *
 */

/*
 chrome i18n does not support multiple line
 newFeatures : for new features message
 bugFixes: for bug fixes message
 other: for other message (current none in 2.9)
 use <br> to new line
 do not add <br /> at the end of last line of every message type, check line 35, 55 for example
 for language code, http://www.metamodpro.com/browser-language-codes
 use lower case for language name

 */
var updateInfo = {
    "en-us": {
        "newFeatures": "" +
        "New ‘Site Blacklist’ feature to disable crxMouse on any website<br/>" +
        "Choose to display the gesture arrows in any area of the web page!<br/>" +
        "Added an option to turn off the visual tab list in Wheel Gestures<br/>" +
        "Ability to zoom in and out with Mouse Gestures<br/>" +
        "Ability to scroll left and right in addition to up and down in Mouse Gestures<br/>" +
        "Ability to open the bookmark manager in Mouse Gestures<br/>" +
        "‘Split’ Option: split all tabs to the right of (and including) the current tab into a new window<br/>" +
        "‘Merge’ Option: merge all tabs from all windows into the current window",
        "bugFixes": "" +
        "Fixed issue that caused some users to not be able to change track colors<br/>" +
        "Fixed issue that caused some users to see the track animation to the right of the gesture<br/>" +
        "The tab list now scrolls when it is long enough to reach the bottom (it used to cut off)<br/>" +
        "“Close other tabs” and “close tabs on the left” functions no longer close pinned tabs<br/>" +
        "Fixed issue that caused the contextual (right-click) menu to appear after a Rocker Gesture<br/>" +
        "Super Drag for links now takes priority over Super Drag for text<br/>" +
        "On Mac, performing a close gesture on an inactive window now works",
        "other": ""
    },
    "zh-cn": {
        "newFeatures": "" +
        "新的“网站黑名单”功能，名单中的网站将不运行crxMouse<br/>" +
        "可选择在网站的任意区域显示鼠标手势箭头<br/>" +
        "添加了可关闭滚轮手势中的标签列表的选项<br/>" +
        "可以用鼠标手势放大或者缩小页面了<br/>" +
        "除了可以用鼠标手势上下滚动，现在也可以左右滚动页面了<br/>" +
        "可以用鼠标手势打开书签管理器了<br/>" +
        "“分离”选项：将当前页面右侧（含当前页面）所有标签分离到一个新窗口中<br/>" +
        "“合并”选项：将所有窗口中的标签合并到当前窗口中，关闭其他窗口",
        "bugFixes": "" +
        "修复了部分用户偶尔无法设置鼠标手势的颜色问题<br/>" +
        "修复了部分用户鼠标手势轨迹位置在某些页面偏离的问题<br/>" +
        "滚轮手势中的标签列表超长后可随鼠标同时滚动了（老版本中列表会被切断<br/>" +
        "“关闭所有标签”、“关闭左侧标签”和“关闭右侧标签”将不会再关闭固定（pin）标签<br/>" +
        "修复了使用摇杆手势切换页面后鼠标右键菜单会弹出的问题<br/>" +
        "若选中带有链接的文字并使用超级拖曳，将优先打开选中的链接<br/>" +
        "在Mac上的非激活窗口使用关闭手势（标签或者窗口）将不再会错误地关闭当前窗口",
        "other": ""
    },
    "zh-tw": {
        "newFeatures": "" +
        "新的“網站黑名單”功能，名單中的網站將不運行crxMouse<br/>" +
        "可選擇在網站的任意區域顯示鼠標手勢箭頭<br/>" +
        "添加了可關閉滾輪手勢中的標簽列表的選項<br/>" +
        "可以用鼠標手勢放大或者縮小頁面了<br/>" +
        "除了可以用鼠標手勢上下滾動，現在也可以左右滾動頁面了<br/>" +
        "可以用鼠標手勢打開書簽管理器了<br/>" +
        "“分離”選項：將當前頁面右側（含當前頁面）所有標簽分離到一個新窗口中<br/>" +
        "“合並”選項：將所有窗口中的標簽合並到當前窗口中，關閉其他窗口",
        "bugFixes": "" +
        "修復了部分用戶偶爾無法設置鼠標手勢的顏色問題<br/>" +
        "修復了部分用戶鼠標手勢軌跡位置在某些頁面偏離的問題<br/>" +
        "滾輪手勢中的標簽列表超長後可隨鼠標同時滾動了（老版本中列表會被切斷<br/>" +
        "“關閉所有標簽”、“關閉左側標簽”和“關閉右側標簽”將不會再關閉固定（pin）標簽<br/>" +
        "修復了使用搖杆手勢切換頁面後鼠標右鍵菜單會彈出的問題<br/>" +
        "若選中帶有鏈接的文字並使用超級拖曳，將優先打開選中的鏈接<br/>" +
        "在Mac上的非激活窗口使用關閉手勢（標簽或者窗口）將不再會錯誤地關閉當前窗口",
        "other": ""
    },
    "fr": {
        "newFeatures": "" +
        "New ‘Site Blacklist’ feature to disable crxMouse on any website<br/>" +
        "Choose to display the gesture arrows in any area of the web page!<br/>" +
        "Added an option to turn off the visual tab list in Wheel Gestures<br/>" +
        "Ability to zoom in and out with Mouse Gestures<br/>" +
        "Ability to scroll left and right in addition to up and down in Mouse Gestures<br/>" +
        "Ability to open the bookmark manager in Mouse Gestures<br/>" +
        "‘Split’ Option: split all tabs to the right of (and including) the current tab into a new window<br/>" +
        "‘Merge’ Option: merge all tabs from all windows into the current window",
        "bugFixes": "" +
        "Fixed issue that caused some users to not be able to change track colors<br/>" +
        "Fixed issue that caused some users to see the track animation to the right of the gesture<br/>" +
        "The tab list now scrolls when it is long enough to reach the bottom (it used to cut off)<br/>" +
        "“Close other tabs” and “close tabs on the left” functions no longer close pinned tabs<br/>" +
        "Fixed issue that caused the contextual (right-click) menu to appear after a Rocker Gesture<br/>" +
        "Super Drag for links now takes priority over Super Drag for text<br/>" +
        "On Mac, performing a close gesture on an inactive window now works",
        "other": ""
    },
    "ja": {
        "newFeatures": "" +
        "New ‘Site Blacklist’ feature to disable crxMouse on any website<br/>" +
        "Choose to display the gesture arrows in any area of the web page!<br/>" +
        "Added an option to turn off the visual tab list in Wheel Gestures<br/>" +
        "Ability to zoom in and out with Mouse Gestures<br/>" +
        "Ability to scroll left and right in addition to up and down in Mouse Gestures<br/>" +
        "Ability to open the bookmark manager in Mouse Gestures<br/>" +
        "‘Split’ Option: split all tabs to the right of (and including) the current tab into a new window<br/>" +
        "‘Merge’ Option: merge all tabs from all windows into the current window",
        "bugFixes": "" +
        "Fixed issue that caused some users to not be able to change track colors<br/>" +
        "Fixed issue that caused some users to see the track animation to the right of the gesture<br/>" +
        "The tab list now scrolls when it is long enough to reach the bottom (it used to cut off)<br/>" +
        "“Close other tabs” and “close tabs on the left” functions no longer close pinned tabs<br/>" +
        "Fixed issue that caused the contextual (right-click) menu to appear after a Rocker Gesture<br/>" +
        "Super Drag for links now takes priority over Super Drag for text<br/>" +
        "On Mac, performing a close gesture on an inactive window now works",
        "other": ""
    }
};
var cim = chrome.i18n.getMessage;

if (localStorage.showUpdatedInfo == "1") {
    var version = $(".newMessageVersionNumber"),
        newFeatureTitle = $(".newFeatureTitle"),
        newFeatureBody = $(".newFeatureBody"),
        bugFixesTitle = $(".bugFixesTitle"),
        bugFixesBody = $(".bugFixesBody"),
        otherTitle = $(".otherTitle"),
        otherBody = $(".otherBody");
    var lang = navigator.language.toLowerCase(),
        updateMsg = updateInfo[lang];
    if (!updateMsg || (updateMsg["newFeatures"] == "" && updateMsg["bugFixes"] == "" && updateMsg["other"] == "")) {
        updateMsg = updateInfo["en-us"];
    }
    if (updateMsg["newFeatures"] != "" || updateMsg["bugFixes"] == "" || updateMsg["other"] == "") {
        if (updateMsg["newFeatures"] != "") {
            newFeatureTitle.text(cim("newFeatures"));
            newFeatureBody.html(turnBrToLi(updateMsg["newFeatures"]));
        }
        if (updateMsg["bugFixes"] != "") {
            bugFixesTitle.text(cim("bugFixes"));
            bugFixesBody.html(turnBrToLi(updateMsg["bugFixes"]));
        }
        if (updateMsg["other"] != "") {
            otherTitle.text(cim("other"));
            otherBody.html(turnBrToLi(updateMsg["other"]));
        }
    }

    version.text(chrome.runtime.getManifest().version);

    $(".newMessage").slideDown();
    $(".closeNewMessage").click(function () {
        localStorage.showUpdatedInfo = "0";
        $(".newMessage").fadeOut("fast");
    });
}

function turnBrToLi(msg) {
    return "<ul><li>" + msg.replace(/<br\s*\/>/gi, "</li><li>") + "</li></ul>";
}