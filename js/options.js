$(document).ready(function(){
    loadOptions();
    $("button").click(function(){
        saveOptions();
    });
});

var saveOptions = function() {
    var backgroundPage = chrome.extension.getBackgroundPage();
    var bufferMinutes = $("body").find('#bufferMinutes').val();
    if(bufferMinutes == "" || bufferMinutes.match(/[^0-9]+/)){
        alert("入力が正しくありません");
    } else {
        alert(bufferMinutes + "分後に設定しました。");
        localStorage["BufferMinutes"] = bufferMinutes;
        backgroundPage.init();
    }
};

var loadOptions = function() {
    var bufferMinutes = localStorage["BufferMinutes"];
    if (bufferMinutes) {
        $("body").find('#bufferMinutes').val(bufferMinutes);
    }
};