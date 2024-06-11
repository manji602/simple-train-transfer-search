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

chrome.omnibox.onInputEntered.addListener (function (text) {
  init();
  const query = getQuery(text);
  const searchMode = setSearchMode(query);
  const url = setSearchUrl(query, searchMode);
  navigate(url);
});

const init = function() {
  const numberRegExp = new RegExp (NUMBER_REGEXP);
};

const getQuery = function (text) {
  const query = text.replace(/^\s+|\s+$/g,"").split(/[\s,]+/);
  return query;
};

const setSearchMode = function (query) {
  let searchMode = UNDEFINED_SEARCH_MODE;
  if (query.length == 1) {
    searchMode = TIMETABLE_SEARCH_MODE;
  }
  if (query.length >= 2 && query.length <= 4) {
    searchMode = TRANSFER_SEARCH_MODE;
  }
  return searchMode;
};

const setTransferSearchMode = function (query) {
  let transferSearchMode = TRANSFER_SEARCH_MODE_OF.UNDEFINED;
  const numberRegExp = new RegExp (NUMBER_REGEXP);
  const timeRegExp = new RegExp (TIME_REGEXP);

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
    let arrivalQuery;
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

const setSearchUrl = function (query, searchMode) {
  let transferSearchMode;
  let url = "";
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

const getTimetableUrl = function (query) {
  let url = "";
  const date = setDate();
  url = TIMETABLE_SEARCH_HEADER + query + "&" + date + TIMETABLE_SEARCH_FOOTER;
  return url;
};

const getTransferUrl = function (query, transferSearchMode) {
  let url = "";
  let middleQuery = "";
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

const getMiddleQueryNow = function(query){
  const stationQuery = getStationQuery(query[0], query[1]);
  const searchDate = setDate();
  const searchWay = "Cway=0&";
  return stationQuery + searchDate + searchWay;
};

const getMiddleQueryFirst = function(query){
  const stationQuery = getStationQuery(query[0], query[1]);
  const searchDate = setDate();
  const searchWay = "Cway=2&";
  return stationQuery + searchDate + searchWay;
};

const getMiddleQueryLast = function(query) {
  const stationQuery = getStationQuery(query[0], query[1]);
  const searchDate = setDate();
  const searchWay = "Cway=3&";
  return stationQuery + searchDate + searchWay;
};

const getMiddleQueryDepartureAfterMinutes = function(query) {
  const stationQuery = getStationQuery(query[0], query[1]);
  const searchDate = setDate();
  const searchMinutesBuffer = setMinutesBuffer(parseInt(query[2]));
  const searchWay = "Cway=0&";
  return stationQuery + searchDate + searchMinutesBuffer + searchWay;

};

const getMiddleQueryDepartureAfterTime = function(query) {
  const stationQuery = getStationQuery(query[0], query[1]);
  const searchDate = setDate();
  const searchTimeBuffer = setTimeBuffer(query[2]);
  const searchWay = "Cway=0&";

  return stationQuery + searchDate + searchTimeBuffer + searchWay;
};

const getMiddleQueryArrivalBeforeMinutes = function(query) {
  const stationQuery = getStationQuery(query[0], query[1]);
  const searchDate = setDate();
  const searchMinutesBuffer = setMinutesBuffer(parseInt(query[2]));
  const searchWay = "Cway=1&";
  return stationQuery + searchDate + searchMinutesBuffer + searchWay;
};

const getMiddleQueryArrivalBeforeTime = function(query) {
  const stationQuery = getStationQuery(query[0], query[1]);
  const searchDate = setDate();
  const searchTimeBuffer = setTimeBuffer(query[2]);
  const searchWay = "Cway=1&";
  return stationQuery + searchDate + searchTimeBuffer + searchWay;
};

const getStationQuery = function(station_from, station_to) {
  return "eki1=" + station_from + "&eki2=" + station_to + "&";
};

const setDate = function () {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth()+1;
  const search_month = "Dym=" + year + "" + month + "&";
  const search_day = "Ddd=" + date.getDate() + "&";
  return search_month + search_day;
};

const addMinutes = function (date, minutes) {
  let ret = new Date();
  const baseSec = date.getTime();
  const addSec = minutes * 60 * 1000;
  const targetSec = baseSec + addSec;
  ret.setTime(targetSec);
  return ret;
};

const setMinutesBuffer = function (minutes) {
  const nowdate = new Date();
  let date = new Date();
  date = addMinutes(nowdate, minutes);
  const hour = date.getHours();
  const minute = date.getMinutes();
  minute = "" + minute;
  const min_1 = minute.slice(0, 1);
  const min_2 = minute.slice(1);
  return "Dhh=" + hour + "&Dmn1=" + min_1 + "&Dmn2=" + min_2 + "&";
};

const setTimeBuffer = function (time) {
  const hour = (time.length === 3) ? time.slice(0, 1) : time.slice(0, 2);
  const minutes = (time.length === 3) ? time.slice(1) : time.slice(2);
  const min_1 = minutes.slice(0, 1);
  const min_2 = minutes.slice(1);
  return "Dhh=" + hour + "&Dmn1=" + min_1 + "&Dmn2=" + min_2 + "&";
};

const navigate = function (url) {
  if (url !== "") {
    chrome.tabs.getSelected(null,function(tab){
      chrome.tabs.update(
        tab.id,
        {url:url}
      );
    });
  }
};
