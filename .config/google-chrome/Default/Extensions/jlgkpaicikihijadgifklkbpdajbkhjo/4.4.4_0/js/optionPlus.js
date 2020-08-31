var blackListIpt = $("#blackList"), saveBlBtn = $("#saveBL");
var ss = chrome.storage.sync;
ss.get("blackList", function (i) {
    var blackList = i.blackList;
    if (blackList) {
        blackList = blackList.join("\n");
        blackListIpt.val(blackList);
    }
});

saveBlBtn.click(function () {
    chrome.runtime.sendMessage({type: "gaEvent", gaCategory: mapIdToGAEvent.saveBL.category, gaAction: mapIdToGAEvent.saveBL.action});
    var blStr = blackListIpt.val().trim(), blList = [];
    if (blStr != "") {
        var bl = blStr.split("\n");
        $.each(bl, function (i, b) {
            blList.push(extractDomain(b));
        });
    }
    ss.set({blackList: blList}, function () {
        document.getElementById("msgbox").style.display = "block";
        window.setTimeout(function () {
            document.getElementById("msgbox").style.display = "none";
        }, 1000)
    });
});
