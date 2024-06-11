    //global value
    const TRANSFER_SEARCH_HEADER   = "http://www.jorudan.co.jp/norikae/cgi/nori.cgi?";
    const TRANSFER_SEARCH_FOOTER   = "C7=1&C2=0&C3=0&C1=0&C4=0&C6=2&S.x=41&S.y=13&S=検索&Cmap1=0&rf=nr&pg=0&Csg=1";
    const TIMETABLE_SEARCH_HEADER  = "http://www.jorudan.co.jp/time/cgi/time.cgi?eok1=&Cmap1=&rf=tm&pg=0&eki1=";
    const TIMETABLE_SEARCH_FOOTER  = "&S.x=35&S.y=10&S=検索&Csg=1"
    const TIMETABLE_SEARCH_MODE    = 111;
    const TRANSFER_SEARCH_MODE     = 222;
    const UNDEFINED_SEARCH_MODE    = 333;
    const TRANSFER_SEARCH_MODE_OF  = {
        NOW : 1,
        FIRST_TRAIN : 2,
        LAST_TRAIN : 3,
        DEPARTURE_AFTER_MINUTES : 4,
        DEPARTURE_AFTER_TIME : 5,
        ARRIVAL_BEFORE_MINUTES : 6,
        ARRIVAL_BEFORE_TIME : 7,
        UNDEFINED : -1,
    };
    const SEARCH_FIRST_TRAIN_QUERY = "first";
    const SEARCH_LAST_TRAIN_QUERY  = "last";
    const SEARCH_ARRIVAL_QUERY     = "-g";
    const TIME_REGEXP              = "^([01]?[0-9]|2[0-3])([0-5][0-9])$";
    const NUMBER_REGEXP            = "^[0-9]+$";
    var BUFFER_MINUTES             = 0;

chrome.omnibox.onInputEntered.addListener (function (text) {
    init();
    var query = getQuery(text);
    var searchMode = setSearchMode(query);
    var url = setSearchUrl(query, searchMode);
    navigate(url);
});

var init = function() {
    var numberRegExp = new RegExp (NUMBER_REGEXP);
    var buffer = localStorage["BufferMinutes"];
    if(buffer!=null && buffer.match(numberRegExp)){
        BUFFER_MINUTES=buffer;
    }
};

var getQuery = function (text) {
    var query = text.replace(/^\s+|\s+$/g,"").split(/[\s,]+/);
    return query; 
};

var setSearchMode = function (query) {
    var searchMode = UNDEFINED_SEARCH_MODE;
    if (query.length == 1) {
         searchMode = TIMETABLE_SEARCH_MODE;
    }
    if (query.length >= 2 && query.length <= 4) {
         searchMode = TRANSFER_SEARCH_MODE;
    }
    return searchMode;
};

var setTransferSearchMode = function (query) {
    var transferSearchMode = TRANSFER_SEARCH_MODE_OF.UNDEFINED;
    var numberRegExp = new RegExp (NUMBER_REGEXP);
    var timeRegExp = new RegExp (TIME_REGEXP);

    if (query.length === 2){
        transferSearchMode = TRANSFER_SEARCH_MODE_OF.NOW;
    }
    if (query.length === 3){
        if (query[2] === SEARCH_FIRST_TRAIN_QUERY){
            transferSearchMode = TRANSFER_SEARCH_MODE_OF.FIRST_TRAIN;
        }
        if (query[2] === SEARCH_LAST_TRAIN_QUERY){
            transferSearchMode = TRANSFER_SEARCH_MODE_OF.LAST_TRAIN;
        }
        if (query[2].match (numberRegExp)){
            transferSearchMode = TRANSFER_SEARCH_MODE_OF.DEPARTURE_AFTER_MINUTES;
        }
        if (query[2].match (timeRegExp)){
            transferSearchMode = TRANSFER_SEARCH_MODE_OF.DEPARTURE_AFTER_TIME;
        }
    }
    if (query.length === 4){
        var arrivalQuery;
        if(query[3] === SEARCH_ARRIVAL_QUERY){
            if(query[2].match (numberRegExp)){
                transferSearchMode = TRANSFER_SEARCH_MODE_OF.ARRIVAL_BEFORE_MINUTES;
            }
            if(query[2].match (timeRegExp)){
                transferSearchMode = TRANSFER_SEARCH_MODE_OF.ARRIVAL_BEFORE_TIME;
            }
        }
    }
    return transferSearchMode;
};

var setSearchUrl = function (query, searchMode) {
    var transferSearchMode;
    var url = "";
    if (searchMode === TIMETABLE_SEARCH_MODE) {
        url = getTimetableUrl (query);
    }
    if (searchMode === TRANSFER_SEARCH_MODE &&
       transferSearchMode != TRANSFER_SEARCH_MODE_OF.UNDEFINED) {
        transferSearchMode = setTransferSearchMode(query);
        url = getTransferUrl (query, transferSearchMode);
    }
    if (searchMode === UNDEFINED_SEARCH_MODE ||
       transferSearchMode === TRANSFER_SEARCH_MODE_OF.UNDEFINED) {
        alert("入力が間違えています。");
    }
    return url;
};

var getTimetableUrl = function (query) {
    var url = "";
    var date = setDate();
    url = TIMETABLE_SEARCH_HEADER + query + "&" + date + TIMETABLE_SEARCH_FOOTER;
    return url;
};

var getTransferUrl = function (query, transferSearchMode) {
    var url = "";
    var middleQuery = "";
    if (transferSearchMode === TRANSFER_SEARCH_MODE_OF.NOW) {
        middleQuery = getMiddleQueryNow(query);
    }
    if (transferSearchMode === TRANSFER_SEARCH_MODE_OF.FIRST_TRAIN) {
        middleQuery = getMiddleQueryFirst(query);
    }
    if (transferSearchMode === TRANSFER_SEARCH_MODE_OF.LAST_TRAIN) {
        middleQuery = getMiddleQueryLast(query);
    }
    if (transferSearchMode === TRANSFER_SEARCH_MODE_OF.DEPARTURE_AFTER_MINUTES) {
        middleQuery = getMiddleQueryDepartureAfterMinutes(query);
    }
    if (transferSearchMode === TRANSFER_SEARCH_MODE_OF.DEPARTURE_AFTER_TIME) {
        middleQuery = getMiddleQueryDepartureAfterTime(query);
    }
    if (transferSearchMode === TRANSFER_SEARCH_MODE_OF.ARRIVAL_BEFORE_MINUTES) {
        middleQuery = getMiddleQueryArrivalBeforeMinutes(query);
    }
    if (transferSearchMode === TRANSFER_SEARCH_MODE_OF.ARRIVAL_BEFORE_TIME) {
        middleQuery = getMiddleQueryArrivalBeforeTime(query);
    }
    url = TRANSFER_SEARCH_HEADER + middleQuery + TRANSFER_SEARCH_FOOTER;
    return url;
};

var getMiddleQueryNow = function(query){
    var stationQuery = getStationQuery(query[0], query[1]);
    var searchDate = setDate();
    var searchWay = "Cway=0&";
    return stationQuery + searchDate + searchWay;
};

var getMiddleQueryFirst = function(query){
    var stationQuery = getStationQuery(query[0], query[1]);
    var searchDate = setDate();
    var searchWay = "Cway=2&";
    return stationQuery + searchDate + searchWay;    
};

var getMiddleQueryLast = function(query) {
    var stationQuery = getStationQuery(query[0], query[1]);
    var searchDate = setDate();
    var searchWay = "Cway=3&";
    return stationQuery + searchDate + searchWay;
};

var getMiddleQueryDepartureAfterMinutes = function(query) {
    var stationQuery = getStationQuery(query[0], query[1]);
    var searchDate = setDate();
    var searchMinutesBuffer = setMinutesBuffer(parseInt(query[2]));
    var searchWay = "Cway=0&";
    return stationQuery + searchDate + searchMinutesBuffer + searchWay;

};

var getMiddleQueryDepartureAfterTime = function(query) {
    var stationQuery = getStationQuery(query[0], query[1]);
    var searchDate = setDate();
    var searchTimeBuffer = setTimeBuffer(query[2]);
    var searchWay = "Cway=0&";
    return stationQuery + searchDate + searchTimeBuffer + searchWay;

};

var getMiddleQueryArrivalBeforeMinutes = function(query) {
    var stationQuery = getStationQuery(query[0], query[1]);
    var searchDate = setDate();
    var searchMinutesBuffer = setMinutesBuffer(parseInt(query[2]));
    var searchWay = "Cway=1&";
    return stationQuery + searchDate + searchMinutesBuffer + searchWay;
};

var getMiddleQueryArrivalBeforeTime = function(query) {
    var stationQuery = getStationQuery(query[0], query[1]);
    var searchDate = setDate();
    var searchTimeBuffer = setTimeBuffer(query[2]);
    var searchWay = "Cway=1&";
    return stationQuery + searchDate + searchTimeBuffer + searchWay;
};

var getStationQuery = function(station_from, station_to) {
    return "eki1=" + station_from + "&eki2=" + station_to + "&";
};

var setDate = function () {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var search_month = "Dym=" + year + "" + month + "&";
    var search_day = "Ddd=" + date.getDate() + "&";
    return search_month + search_day;
};

var addMinutes = function (date, minutes) {
    var ret = new Date();
    var baseSec = date.getTime();
    var addSec = minutes * 60 * 1000;
    var targetSec = baseSec + addSec;
    ret.setTime(targetSec);
    return ret;
};

var setMinutesBuffer = function (minutes) {
    var nowdate = new Date();
    var date = new Date();
    date = addMinutes(nowdate, minutes);
    var hour = date.getHours();
    var minute = date.getMinutes();
    minute = "" + minute;
    var min_1 = minute.slice(0, 1);
    var min_2 = minute.slice(1);
    return "Dhh=" + hour + "&Dmn1=" + min_1 + "&Dmn2=" + min_2 + "&";
};

var setTimeBuffer = function (time) {
    var hour = (time.length === 3) ? time.slice(0, 1) : time.slice(0, 2);
    var minutes = (time.length === 3) ? time.slice(1) : time.slice(2);
    var min_1 = minutes.slice(0, 1);
    var min_2 = minutes.slice(1);
    return "Dhh=" + hour + "&Dmn1=" + min_1 + "&Dmn2=" + min_2 + "&";
};

var navigate = function (url) {
    if(url!=""){
        chrome.tabs.getSelected(null,function(tab){
            chrome.tabs.update(
                tab.id,
                {url:url}
            );
        });
    }
};
