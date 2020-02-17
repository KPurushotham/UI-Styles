
define(['app','httpService'], function() {
    'use strict';
	return ['$scope', '$rootScope', '$timeout', '$filter', '$state',
		'$location', 'overlay', 'uiGridConstants', '$http',
		'constants', 'httpService', '$window', '$q', 'Notification',
		'$interval', 'srv', '$sce',    
		function ($scope, $rootScope,
			$timeout, $filter, $state, $location, overlay,
			uiGridConstants, $http, constants, httpService,
			$window, $q, Notification, $interval, srv, $sce 
		) {
        //console.log($filter('IndianCurrency')(10000000000));
        $rootScope.mainHeader = true;
        $scope.currentDate = "";
        $scope.currentTime = "";
        if(localStorage.getItem('userName')!==undefined)
            $rootScope.loggedinUserName = localStorage.getItem("userName");
        $rootScope.thingsToDoItems = [];
        if($rootScope.marqueeFlag === undefined)
            $rootScope.marqueeFlag = true;
        $rootScope.templateWithTooltip = '<div class="ui-grid-cell-contents" title="{{COL_FIELD}}">{{COL_FIELD}}</div>';
        $rootScope.dateTimeFilter = 'date:\'dd/MM/yyyy hh:mm a\'';
        $rootScope.dateFilter = 'date:\'dd/MM/yyyy\'';
        $rootScope.gridLoadData = "";
        $rootScope.maxEnquiryVendors = 10;

        $rootScope.currencySign = $sce.trustAsHtml("&#x20B9;");

        $rootScope.selectedGridRows = [];
        // time picker global values
        $rootScope.hourOptions = [{"value":"00","text":"00"},{"value":"01","text":"01"},{"value":"02","text":"02"},{"value":"03","text":"03"},{"value":"04","text":"04"},{"value":"05","text":"05"},{"value":"06","text":"06"},{"value":"07","text":"07"},{"value":"08","text":"08"},{"value":"09","text":"09"},{"value":"10","text":"10"},{"value":"11","text":"11"},{"value":"12","text":"12"}];
        $rootScope.minuteOptions = [{"value":"00","text":"00"},{"value":"01","text":"01"},{"value":"02","text":"02"},{"value":"03","text":"03"},{"value":"04","text":"04"},{"value":"05","text":"05"},{"value":"06","text":"06"},{"value":"07","text":"07"},{"value":"08","text":"08"},{"value":"09","text":"09"},{"value":"10","text":"10"},{"value":"12","text":"12"},{"value":"13","text":"13"},{"value":"14","text":"14"},{"value":"15","text":"15"},{"value":"16","text":"16"},{"value":"17","text":"17"},{"value":"18","text":"18"},{"value":"19","text":"19"},{"value":"20","text":"20"},{"value":"21","text":"21"},{"value":"22","text":"22"},{"value":"23","text":"23"},{"value":"24","text":"24"},{"value":"25","text":"25"},{"value":"26","text":"26"},{"value":"27","text":"27"},{"value":"28","text":"28"},{"value":"29","text":"29"},{"value":"30","text":"30"},{"value":"31","text":"31"},{"value":"32","text":"32"},{"value":"33","text":"33"},{"value":"34","text":"34"},{"value":"35","text":"35"},{"value":"36","text":"36"},{"value":"37","text":"37"},{"value":"39","text":"39"},{"value":"40","text":"40"},{"value":"41","text":"41"},{"value":"42","text":"42"},{"value":"43","text":"43"},{"value":"44","text":"44"},{"value":"45","text":"45"},{"value":"46","text":"46"},{"value":"47","text":"47"},{"value":"48","text":"48"},{"value":"49","text":"49"},{"value":"50","text":"50"},{"value":"51","text":"51"},{"value":"52","text":"52"},{"value":"53","text":"53"},{"value":"54","text":"54"},{"value":"55","text":"55"},{"value":"56","text":"56"},{"value":"57","text":"57"},{"value":"58","text":"58"},{"value":"59","text":"59"}];
        $rootScope.ampmOptions = [{"value":"AM","text":"AM"},{"value":"PM","text":"PM"}];
        $rootScope.birthYears = [];
        var currentYear = new Date().getFullYear() ;
        $rootScope.cyear = currentYear;
      
        for(var i=currentYear - 7;i<=currentYear - 2;i++)
        {
            $rootScope.birthYears.push({"value":i,"text":i});
        }

        
        $scope.$on('$viewContentLoaded', function(event) {
            $timeout(function(){
                $scope.marquee();
            }, 1000);
            
        });

        $rootScope.pageType = 'A3';
        $rootScope.orientation = 'landscape';
               
            $rootScope.ValidateFields = function (inputName, fieldsObj, validateRule) {

                if (validateRule === "disabled")
                    return fieldsObj[inputName][validateRule];
                else
                    return fieldsObj[inputName][validateRule][value];
            };

        /***** marque start ******/
        $scope.news = [];
        /*$scope.news = ['1 FINANMISC2004: Miscellaneous Bills Approval',
                        '2 FINANMISC2004: Miscellaneous Bills Approval',
                        '3 FINANMISC2004: Miscellaneous Bills Approval',
                        '4 FINANMISC2004: Miscellaneous Bills Approval',
                        '6 FINANMISC2004: Miscellaneous Bills Approval',
                        '7 FINANMISC2004: Miscellaneous Bills Approval'
                      ];*/

        $scope.conf = {
            news_length: false,
            news_pos: "",
            news_margin: 20,
            news_move_flag: true
        };
        
        $scope.marquee = function() {
            if($rootScope.marqueeFlag){
                $rootScope.getAllNotifications();
                $rootScope.marqueeFlag = false;

                $interval($scope.news_move ,10);
            }
        };
        
        $scope.get_news_left = function() {
            var $right = 0;//$scope.conf.news_pos;
            for (var ri=0; ri < $scope.news.length; ri++) {
                if (document.getElementById('news_'+ri)) {
                    $right +=  angular.element(document.getElementById('news_'+ri))[0].offsetWidth;
                }
            }
            //angular.element(document.getElementById('news_strip'))[0].style.width = $right+"px";
            $scope.full_width_div = $right + $scope.news.length;
            return ($right + $scope.conf.news_pos);
        };
        
        $scope.news_move = function() { 
            if ($rootScope.loggedinUserName !== undefined && $scope.news.length > 0 && $scope.conf.news_move_flag) {
                if($scope.conf.news_pos === "" && document.getElementById('news_strip'))
                    $scope.conf.news_pos = angular.element(document.getElementById('news_strip'))[0].offsetWidth - $scope.full_width_div;
                $scope.conf.news_pos--; //
                //console.log($scope.conf.news_pos+" -- "+$scope.full_width_div+" == "+($scope.conf.news_pos + $scope.full_width_div));
                if ( (($scope.conf.news_pos + $scope.full_width_div ) < ($scope.full_width_div * -1)) && document.getElementById('news_strip')) {
                    //var first_new = $scope.news[0];
                    //$scope.news.push(first_new);
                    //$scope.news.shift();
                    $scope.conf.news_pos = angular.element(document.getElementById('news_strip'))[0].offsetWidth - $scope.full_width_div;
                    //$scope.conf.news_pos += angular.element(document.getElementById('news_ul'))[0].offsetWidth + $scope.conf.news_margin;
                }
            }
        };
        /***** marque end ******/
        $rootScope.pdfresults = [];
        $rootScope.counter = 0;
            $rootScope.runPDF = function () {
                var counter = $rootScope.counter;
                $rootScope.pdfresults[counter] = "Loading";
                $rootScope.counter = $rootScope.counter + 1;
                srv({ method: 'GET', url: 'http://localhost/~srinu/projects/mpdf/examples/invoice-test.php' }, counter).then(function (result) {

                    $rootScope.pdfresults[result.counter] = result.data;

                });

                $scope.callAtInterval();
                //$scope.callAtInterval();
                //  console.log($rootScope.pdfresults);
            };

            $scope.callAtInterval = function () {
                $(".ui-notification").remove();
                angular.forEach($rootScope.pdfresults, function (value, key) {
                    Notification.error({ message: value, delay: null });
                });
            };

        /*Message Popups*/
            $rootScope.showMessage = function (msg) {

                overlay.showMessage(msg);
                $timeout(function () {
                    overlay.hideMessage();
                }, 3000);
            };
            $rootScope.hideMessage = function () {
                overlay.hideMessage();
            };
        /******Message Popups******/

        // $rootScope.permissions = [];

            $rootScope.checkPermission = function (screenName) {
                var screenPermissions = "";
                if (localStorage.getItem('permissions') !== undefined) {
                    screenPermissions = localStorage.getItem('permissions');
                    screenPermissions = $.parseJSON(screenPermissions);
                    if (screenPermissions[screenName] === undefined)
                        return false;
                    else
                        return true;
                }
            };
        /*float format*/
            $rootScope.convertFloatFormat = function (f, n) {

                if (isNaN(f) || f === undefined || f === null || f === "") {
                    f = 0;
                    //return $filter('IndianCurrency')(f); 
                }

                n = n || 2;

                return $filter('IndianCurrency')(f, n); //parseFloat(f).toFixed(2);             
            };

            $rootScope.unFormatCurrency = function (f) {

                return $filter('UnFormatCurrency')(f); //parseFloat(f).toFixed(2);             
            };

        /****Time Display******/
            $scope.refreshDate = function () {
                var cdate = new Date();
                var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                var hours = cdate.getHours();
                var minutes = cdate.getMinutes();
                var am = "AM";
                if (hours >= 12) {
                    if (hours > 12) hours = hours - 12;
                    am = "PM";
                }
                if (hours < 10) hours = "0" + hours;
                if (minutes < 10) minutes = "0" + minutes;
                $scope.currentDate = cdate.getDate() + " " + months[cdate.getMonth()] + ", " + cdate.getFullYear();
                $scope.currentTime = hours + ":" + minutes + " " + am;
                $timeout(function () {
                    $scope.refreshDate();
                    $rootScope.historySave();
                }, 2000);
            };

        /****Desktop Notification SLide****/
        $scope.things_to_do = false;
            $scope.thinksToDo = function () {
                $scope.things_to_do = !$scope.things_to_do;
            };

        /********Date Functions********/
        var dateFormat = "MM/DD/YYYY";
        var dbFormat = "MM-DD-YYYY";
        var dateTimeFormat = "DD/MM/YYYY hh:mm a";
            $rootScope.getCurrentDate = function (cdate) {
                if (cdate === "" || cdate === undefined)
                    return moment().format(dateFormat);
                else {
                    var newDate = moment().add('days', 15);
                    return newDate.format(dateFormat);
                }

            };
            $rootScope.getMaxDate = function (d) {
                var c = moment().format(dateFormat);
                d = d || 0;
                var a = moment(c, dateFormat).add(d, 'days');
                return $rootScope.convertToDateFormat($rootScope.convertDateToMillSec(a));
            };
            $rootScope.getMaxMinValue = function (d) {
                var minMax = [];
                minMax['min'] = Math.min.apply(Math, d.map(function (item) { return item; }));
                minMax['max'] = Math.max.apply(Math, d.map(function (item) { return item; }));
                return minMax;

            };
          
       

            $rootScope.addToCurrentDate = function (d) {
                var c = moment().format(dateFormat);
                return moment(c, dateFormat).add(d, 'days');
                //moment().format(dateFormat).add(d, 'days');

            };
            $rootScope.addDaysToCurrentDate = function (d) {
                var c = moment().format(dateFormat);
                c = moment(c, dateFormat).add(d, 'days');
                return $rootScope.convertToDateFormat($rootScope.convertDateToMillSec(c));

                //moment().format(dateFormat).add(d, 'days');           
            };
        
            $rootScope.addDaysToCustomDate = function (date, days) {
                var c = moment(date, dateFormat).add(days, 'days');
                return $rootScope.convertToDateFormat($rootScope.convertDateToMillSec(c));

            };
       
            $rootScope.getCurrentDateTime = function () {
                return moment().format(dateTimeFormat);
            };
            $rootScope.getCurrentDateInSeconds = function () {
                return moment().format('x');
            };

            $rootScope.convertToTimeStamp = function (date) {
                return moment(date, dateFormat).valueOf(); //moment().format(dateFormat);
            };
        
            $rootScope.convertionToTimeStamp = function (date) {

                return (moment(date, dateTimeFormat).unix() * 1000);

            };

            $rootScope.convertToDateFormat = function (timestamp) {

                return moment.unix(timestamp / 1000).format(dateFormat);
            };
            $rootScope.convertToDateTimeFormat = function (timestamp) {

                return moment.unix(timestamp / 1000).format(dateTimeFormat);
            };
            $rootScope.dbFormat = function (dateFormat) {
                if (dateFormat !== '' && dateFormat !== undefined) {
                    var tempTime = $scope.convertToTimeStamp(dateFormat);
                    return moment.unix(tempTime / 1000).format(dbFormat);
                }
                return '';

            };
            $rootScope.convertDateToMillSec = function (sec) {
                return (moment(sec, dateFormat).unix() * 1000);
            };

       
            /********Date Functions********/

            /******Window Functions***********/
            $rootScope.checkWin = function () {
                var loc = $state['current'].name;
                var wins = localStorage.getItem("pages");
                if (wins === undefined) wins = {};
                else wins = JSON.parse(wins);
                angular.forEach(wins, function (i, j) {
                    if (wins[j].windowStatus === 'max') {
                        $rootScope.mainHeader = false;
                    }
                });
            };
            $rootScope.historySave = function () {
                var loc = $state['current'].name;
                var params = $state['params'];
                var wins = localStorage.getItem("pages");
                if (wins === undefined) wins = {};
                else wins = JSON.parse(wins);
                angular.forEach(wins, function (i, j) {
                    var temp = wins[j].src.split(".");
                    if (loc.indexOf("app." + temp[0] + ".") !== -1) {
                        wins[j].history = loc;
                        wins[j].params = params;
                    }
                });
                localStorage.setItem("pages", JSON.stringify(wins));
            };

            $rootScope.minAll = function () {
                var wins = localStorage.getItem("pages");
                if (wins === undefined) wins = {};
                else wins = JSON.parse(wins);
                angular.forEach(wins, function (i, j) {
                    wins[j].windowStatus = 'min';
                });
                $rootScope.windows = wins;
                $rootScope.mainHeader = true;
                localStorage.setItem("pages", JSON.stringify(wins));
                $state.go("app.home");
            };

            $rootScope.openWin = function (url, icon, title, logo) {
                var wins = localStorage.getItem("pages");
                if (wins === undefined) wins = {};
                else wins = JSON.parse(wins);

                var tempUrl = url.split(".");

                angular.forEach(wins, function (i, j) {
                    wins[j].windowStatus = "min";
                });
                var flag = true;

                if (wins[tempUrl[0]] !== undefined) {
                    flag = false;
                    wins[tempUrl[0]].windowStatus = "max";
                } else wins[tempUrl[0]] = {

                    "windowStatus": "max",
                    "title": title,
                    "logo": logo,
                    "icon": icon,
                    "page": url,
                    "src": url,
                    "history": "",
                    "params": ""
                };
                localStorage.setItem("pages", JSON.stringify(wins));
                $rootScope.windows = wins;
                $rootScope.mainHeader = false;
                if (flag || wins[tempUrl[0]].history === "") $state.go("app." + url);
                else $state.go(wins[tempUrl[0]].history, wins[tempUrl[0]].params);
            };
            $rootScope.maxWin = function (url) {
                var wins = localStorage.getItem("pages");
                if (wins === undefined) wins = {};
                else wins = JSON.parse(wins);

                var tempUrl = url.split(".");

                angular.forEach(wins, function (i, j) {
                    if (j !== tempUrl[0]) wins[j].windowStatus = "min";
                });
                if (wins[tempUrl[0]].windowStatus === "min") {
                    wins[tempUrl[0]].windowStatus = "max";
                    $rootScope.mainHeader = false;
                    if (wins[tempUrl[0]].history === "") $state.go("app." + wins[tempUrl[0]].src);
                    else $state.go(wins[tempUrl[0]].history, wins[tempUrl[0]].params);
                    //$state.go("app."+wins[url].history);
                } else {
                    wins[tempUrl[0]].windowStatus = "min";
                    $rootScope.mainHeader = true;
                    $state.go("app.home");
                }
                localStorage.setItem("pages", JSON.stringify(wins));
                $rootScope.windows = wins;
            };
            $rootScope.minWin = function (url) {
                var wins = localStorage.getItem("pages");
                if (wins === undefined) wins = {};
                else wins = JSON.parse(wins);

                var tempUrl = url.split(".");
                console.log(tempUrl);
                wins[tempUrl[0]].windowStatus = "min";
                localStorage.setItem("pages", JSON.stringify(wins));
                $rootScope.windows = wins;
                $rootScope.mainHeader = true;
                $state.go("app.home");
            };
            $rootScope.closeWin = function (url) {
                var wins = localStorage.getItem("pages");
                if (wins === undefined) wins = {};
                else wins = JSON.parse(wins);

                var tempUrl = url.split(".");

                wins[tempUrl[0]] = undefined;
                localStorage.setItem("pages", JSON.stringify(wins));
                $rootScope.windows = wins;
                $rootScope.mainHeader = true;
                $state.go("app.home");
            };
            $rootScope.refreshWin = function (url) {
                $window.location.reload();
                //$state.go("app."+url);
            };
            /******Window Functions***********/

            //check whether the page is from thingstodo
            $rootScope.checkThingsToDoPage = function () {
                var urlpath = $location.path();
                urlpath = urlpath.indexOf("/app/thingstodo/");
                if (urlpath === -1) {
                    return false;
                } else {
                    return true;
                }
            };

            //save Notification Actions
            $rootScope.todoNotificationPopupDisplay = false;
            $rootScope.todoNotificationPopupTitle = "";
            $rootScope.todoNotificationObj = {};
            $rootScope.todoactionObj = {};
            $rootScope.todoredirectPath = "";
            $rootScope.todoNotificationremarks = "";
            $rootScope.todoNotificationrequired = false;
            $rootScope.todoNotificationsubmit = false;
            $rootScope.showNotificationRemarks = function (notificationObj, actionObj, redirectPath) {
                $rootScope.todoNotificationPopupTitle = "";
                $rootScope.todoNotificationObj = {};
                $rootScope.todoactionObj = {};
                $rootScope.todoredirectPath = "";
                $rootScope.todoNotificationPopupDisplay = false;
                $rootScope.todoNotificationremarks = "";
                $rootScope.todoNotificationrequired = true;
                $("#mastertodonotification").val('');
                $("#statetodonotification").val('');

                if (actionObj.actionLable !== "SendBack" && actionObj.actionLable !== "IndentSentBack") {
                    $rootScope.todoNotificationremarks = "Action - " + actionObj.actionLable + " is completed";
                    $rootScope.todoNotificationrequired = false;
                }

                // var actionData = actionObj);
                $rootScope.todoNotificationPopupDisplay = true;
                $rootScope.todoNotificationPopupTitle = actionObj.actionLable;
                $rootScope.todoNotificationObj = notificationObj;
                $rootScope.todoactionObj = actionObj;
                $rootScope.todoredirectPath = redirectPath;

            };

            $rootScope.closeNotificationRemarks = function () {
                $rootScope.todoNotificationPopupDisplay = false;
                $rootScope.todoNotificationremarks = "";
            };
        
            $rootScope.saveNotificationAction = function (notificationObj, actionObj, redirectPath, remarks) {
                overlay.load();

                if (remarks.trim() === "" && actionObj.actionLable === "SendBack") {
                    overlay.hide();
                    $rootScope.todoNotificationsubmit = true;
                    $rootScope.todoNotificationrequired = true;
                    return false;
                }

                $rootScope.closeNotificationRemarks();
                $rootScope.todoNotificationsubmit = false;
                $rootScope.todoNotificationrequired = false;
                //notificationObj = $.parseJSON(notificationObj);
                //actionObj = $.parseJSON(actionObj);

                var inputObj = {};
                inputObj.action = actionObj.actionValue;
                inputObj.department = localStorage.getItem("department");
                inputObj.entity = notificationObj.entityTypeCode;
                inputObj.entityId = notificationObj.notifiedEntityId;
                inputObj.notificationId = notificationObj.notificationEntityObjectId;
                inputObj.remarks = remarks;
                httpService.put('vdi/olims/master/workflow', inputObj)
                    .then(function (results) {
                        overlay.hide();
                        if (results.status === 202) {
                            $rootScope.getAllNotifications();

                            $rootScope.showMessage({
                                messageStatus: constants.successStatus,
                                messageText: "Record submitted successfully",
                                redirectPath: redirectPath
                            });
                        } else {
                            $rootScope.showMessage({
                                messageStatus: 'Failure',
                                messageText: "Your notification has failed"
                            });
                        }
                    });
            };

            $rootScope.saveTransactionNotificationAction = function (notificationObj, actionObj, redirectPath, remarks) {

                overlay.load();
                if (remarks.trim() === "" && actionObj.actionLable === "IndentSentBack") {
                    overlay.hide();
                    $rootScope.todoNotificationsubmit = true;
                    $rootScope.todoNotificationrequired = true;
                    return false;
                }
                $rootScope.closeNotificationRemarks();
                console.log(notificationObj);
                console.log(actionObj);
                var inputObj = {};
                inputObj.uuid = notificationObj.actionworkflowId;
                inputObj.currentState = notificationObj.actioncurrentStatus;

                inputObj.action = actionObj.actionValue;

                inputObj.input = {};


                if (notificationObj.otherData !== undefined)
                    inputObj.input = notificationObj.otherData;
                inputObj.input.remarks = remarks;

                inputObj.input.notificationId = notificationObj.notificationEntityObjectId;

                httpService.put('vdi/olims/workflow/stateChange', inputObj)
                    .then(function (results) {
                        overlay.hide();
                        if (results.status === 202) {
                            $rootScope.getAllNotifications();
                            $rootScope.showMessage({
                                messageStatus: constants.successStatus,
                                messageText: "Record submitted successfully",
                                redirectPath: redirectPath
                            });
                        } else {
                            $rootScope.showMessage({
                                messageStatus: 'Failure',
                                messageText: "Your notification has failed"
                            });
                        }
                    });
            };

            $rootScope.getAllNotifications = function(){
               // httpService.get('application/notification/menu')
               //.then(function(results) {
               //    overlay.hide();
               //    if (results.status == 200) {
               //        $rootScope.thingsToDoItems = results.data;
               //        $scope.news = results.data;
               //    }
               //});
            }  

            $rootScope.toggleFiltering = function() {
                $rootScope.gridOptions.enableFiltering = !$scope.gridOptions.enableFiltering;
                $rootScope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);

            };

            angular.element($window).bind('resize', function(){

                $rootScope.getTableStyle();
                $rootScope.getTableSubStyle();

                //$rootScope.gridOptions.gridWidth = gridUtil.elementWidth(self.element);
                //$rootScope.gridOptions.gridHeight = gridUtil.elementHeight(self.element);
                //$rootScope.gridOptions.queueRefresh();
                //$rootScope.gridOptions.queueGridRefresh();

            });
        
            $rootScope.getTableStyle = function() {
                var height = parseInt($window.innerHeight) - parseInt(100);
                if (height < 50) height = 50;
                return {
                    height: height + "px"
                };
            };
            $rootScope.getTableSubStyle = function() {
                var height = parseInt($window.innerHeight) - parseInt(490);
                if (height < 50) height = 50;
                return {
                    height: height + "px"
                };
            };
        
            $rootScope.linkPathAngular = function (pathvalue) {
                return pathvalue.replace(/\//g, '.');
            };
        
            $rootScope.singleGrid = function (gridParams, successCallback) {
                console.log("singleGrid loading..");
                //  $rootScope.gridLoadData = "Loading";
                var burl = gridParams.gridDataUrl;
                if (!burl) {
                    return;
                }
                //
                var colInfo = gridParams.cols;
                console.log("column info", colInfo);
                var formatObject = gridParams.editEntityValue;
                var editPageUrl = gridParams.editPageUrl;
                var paginationOptions = {
                    sort: null
                };
                var filterData = '';
                var search = '';
                var paginationsize = 10000;
                var sortColumn = "";
                // var primaryId = primaryId;
                $rootScope.rowDblClick = function (row) {
                    console.log("rowDblClick=",rowDblClick);
                    //alert("1");
                    var urlFormat = formUrlFormat(formatObject, row);

                    var urlpath = $location.path();

                    urlpath = urlpath.indexOf("/app/thingstodo/");

                    if (urlpath === -1) editPageUrl = editPageUrl;
                    else {

                        var splitUrl = editPageUrl.split("/");
                        splitUrl[0] = "thingstodo";
                        editPageUrl = splitUrl.join("/");

                        if (row.entity['notificationId'] !== null && row.entity['notificationId'] !== undefined)
                            urlFormat = urlFormat + "/" + row.entity['notificationId'];
                        else
                            urlFormat = urlFormat;


                        //console.log(urlFormat);
                    }


                    if (editPageUrl === undefined || editPageUrl === null || editPageUrl === '')
                        return false;
                    else
                        $location.path("app/" + editPageUrl + urlFormat)
                };
                console.log("before gridParams", gridParams);
                $rootScope.gridOptions = gridParams;
                

                var formUrlFormat = function (obj, row) {
                    var f = '';
                    for (var key in obj) {
                        f += '/' + row.entity[key];
                    }
                    return f;
                    // return p.join('&');
                };
                var getPage = function (curPage, pageSize, sort, field) {
                    console.log("appctrl-->Line No:-742-->getPage calling=", curPage);
                    overlay.load();
                    var urlpath = $location.path();
                    urlpath = urlpath.indexOf("/app/thingstodo/");
                    var burlcheck = burl.indexOf("?");
                    var appendString = "&";
                    if (burlcheck === -1)
                        appendString = "?";

                    if (urlpath === -1) {
                        urlpath = "";
                    } else {
                        urlpath = "&append=notification";
                    }
                    var url;
                    $rootScope.pdfUrl = '';

                    if (field === undefined)
                        field = gridParams.defaultSortColumn;



                    switch (sort) {
                        case uiGridConstants.ASC:
                            url = burl + appendString + 'so=asc&sc=' + field + '&si=' + ((curPage - 1) * paginationsize) + '&ps=' + paginationsize + urlpath + filterData;
                            $rootScope.pdfUrl = appendString + 'so=asc&sc=' + field + urlpath + filterData;
                            break;
                        case uiGridConstants.DESC:
                            url = burl + appendString + 'so=desc&sc=' + field + '&si=' + ((curPage - 1) * paginationsize) + '&ps=' + paginationsize + urlpath + filterData;
                            $rootScope.pdfUrl = appendString + 'so=desc&sc=' + field + urlpath + filterData;
                            break;
                        default:
                            url = burl + appendString + "ps=" + paginationsize + urlpath + "&sc=" + field + "&so=desc&si=" + ((curPage - 1) * paginationsize) + filterData;
                            $rootScope.pdfUrl = appendString + urlpath + "&sc=" + field + "&so=desc" + filterData;
                            break;
                    }

                    // var _scope = $scope;
                    return httpService.get(url)
                        .then(function (results) {
                            console.log("grid service called-3", results);
                            if (results && results.data) {
                                results = results.data;
                                results.success = true;
                            }else{
                                results = {};
                            }
                            // 
                         
                            var eGridDiv;
                            if (results.success !== true) {
                              //  Notification.error({ message: 'URL<br/>' + constants.api_url + url, title: 'CODE ERROR - ' + results.code, delay: 5000 });
                                $rootScope.gridLoadData = "No Data Found";

                                eGridDiv = document.querySelector('#myGrid');
                                if (eGridDiv !== null) {
                                    new agGrid.Grid(eGridDiv, $rootScope.gridOptions);
                                    $($("#borderLayout_eRootPanel")[0]).remove();
                                }
                                overlay.hide();
                            } else {
                                var firstRow = (curPage - 1) * pageSize;
                                //Fir testing purpose
                                results.totalCount = (results) ?results.length:0;
                                results.items = results;
                                results.success = true;

                                if (results.totalItems === undefined)
                                    $rootScope.gridOptions.totalItems = results.totalCount;
                                else
                                    $rootScope.gridOptions.totalItems = results.totalItems;
                                if (results.dataset === undefined)
                                    $rootScope.gridOptions.rowData = results.items;
                                else
                                    $rootScope.gridOptions.rowData = results.dataset;

                                //$rootScope.gridOptions.api.setRowData(results);


                                // $rootScope.gridOptions.data = results.dataset;
                                $rootScope.gridLoadData = "No Data Found";
                                overlay.hide();

                                eGridDiv = document.querySelector('#myGrid');
                                if (eGridDiv !== null) {
                                    new agGrid.Grid(eGridDiv, $rootScope.gridOptions);
                                    $($("#borderLayout_eRootPanel")[0]).remove();
                                }

                                if (successCallback) successCallback(results);
                            }
                        });
                };
                getPage(1, $rootScope.gridOptions.paginationPageSize);
            };

            $rootScope.singleCriteriaGrid = function (gridParams, successCallback) {
                overlay.load();
                var burl = gridParams.gridDataUrl;
                var colInfo = gridParams.cols;
                var formatObject = gridParams.editEntityValue;
                var editPageUrl = gridParams.editPageUrl;
                var paginationOptions = {
                    sort: null
                };
                // var search
                var paginationsize = 10000;
                var sortColumn = "";
                var filterData = [];
                // var primaryId = primaryId;
                $rootScope.rowDblClick = function (row) {
                    alert("3");
                    var urlFormat = formUrlFormat(formatObject, row);
                    var urlpath = $location.path();

                    urlpath = urlpath.indexOf("/app/thingstodo/");
                    if (urlpath === -1) editPageUrl = editPageUrl;
                    else {
                        var splitUrl = editPageUrl.split("/");
                        splitUrl[0] = "thingstodo";
                        editPageUrl = splitUrl.join("/");
                        urlFormat = urlFormat;//alert + "/" + row.entity['notificationId'];
                        //console.log(urlFormat);
                    }
                    //console.log(editPageUrl);
                    //if(editPageUrl != undefined )
                    $location.path("app/" + editPageUrl + urlFormat);
                };
                $rootScope.gridCriteriaOptions = {
                    paginationPageSizes: [25, 50, 75],
                    paginationPageSize: paginationsize,
                    rowHeight: 37,
                    useExternalPagination: true,
                    useExternalSorting: true,

                    enableGridMenu: true,
                    enableFiltering: true,
                    useExternalFiltering: true,
                    //enableRowSelection: false,
                    columnDefs: colInfo,
                    autoResize: true,
                    rowTemplate: "<div ng-dblclick=\"grid.appScope.rowDblClick(row)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader }\" ui-grid-cell dbl-click-row></div>",
                    exporterAllDataFn: function () {
                        return getPage(1, $rootScope.gridCriteriaOptions.totalItems, paginationOptions.sort)
                            .then(function () {
                                $rootScope.gridCriteriaOptions.useExternalPagination = false;
                                $rootScope.gridCriteriaOptions.useExternalSorting = false;
                                getPage = null;
                            });
                    },
                    onRegisterApi: function (gridApi) {
                        $rootScope.gridApi = gridApi;
                        $rootScope.gridApi.core.on.filterChanged($rootScope, function () {
                            var grid = this.grid;
                            //console.log(grid);
                            filterData = [];
                            angular.forEach(grid.columns, function (value, key) {

                                // var filterData = '';

                                if (value.filter.term !== undefined && value.filter.term !== '') {
                                    var searchObj = {};
                                    searchObj.field = value.field;
                                    searchObj.term = value.filter.term;
                                    filterData.push(searchObj);

                                }

                                //console.log(value.colDef.field+"="+value.filter.term);

                            });


                            getPage(grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, this.grid.sortCustomColumn);

                        });
                        $rootScope.gridApi.core.on.sortChanged($rootScope, function (grid, sortColumns) {

                            while (sortColumns.length > 1) { sortColumns[0].unsort(); sortColumns.shift(); }
                            if (getPage) {
                                if (sortColumns.length > 0) {
                                    paginationOptions.sort = sortColumns[0].sort.direction;
                                } else {
                                    paginationOptions.sort = null;
                                }
                                this.grid.sortCustomColumn = sortColumns[0].field;
                                getPage(grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, sortColumns[0].field)
                            }
                        });
                        gridApi.pagination.on.paginationChanged($rootScope, function (newPage, pageSize) {
                            if (getPage) {
                                getPage(newPage, pageSize, paginationOptions.sort, this.grid.sortCustomColumn);
                            }
                        });
                    }
                };

                var formUrlFormat = function (obj, row) {
                    var f = '';
                    for (var key in obj) {
                        f += '/' + row.entity[key];
                    }
                    return f;
                    // return p.join('&');
                };
                var getPage = function (curPage, pageSize, sort, field) {
                    var urlpath = $location.path();
                    urlpath = urlpath.indexOf("/app/thingstodo/");
                    var burlcheck = burl.indexOf("?");
                    var appendString = "&";
                    if (burlcheck === -1)
                        appendString = "?";

                    if (urlpath === -1) {
                        urlpath = "";
                    } else {
                        urlpath = "&append=notification";
                    }
                    var url;

                    if (field === undefined)
                        field = gridParams.defaultSortColumn;
                    var criteriaData = {
                        page: {
                            pageNo: curPage - 1,
                            pageSize: paginationsize
                        },
                        sort: {
                            sortBy: field,
                            sortOrder: "DESC"
                        },
                        filters: filterData
                    };

                    switch (sort) {
                        case uiGridConstants.ASC:
                            criteriaData.sort.sortOrder = 'ASC';
                            criteriaData = JSON.stringify(criteriaData);
                            url = burl + appendString + "&criteria=" + criteriaData + urlpath;
                            break;
                        case uiGridConstants.DESC:
                            criteriaData.sort.sortOrder = 'DESC';
                            criteriaData = JSON.stringify(criteriaData);
                            url = burl + appendString + "&criteria=" + criteriaData + urlpath;
                            break;
                        default:
                            criteriaData.sort.sortOrder = 'DESC';
                            criteriaData = JSON.stringify(criteriaData);
                            url = burl + appendString + urlpath + "&criteria=" + criteriaData;
                            break;
                    }
                    // var _scope = $scope;
                    return httpService.get(url)
                        .then(function (results) {
                            if (results && results.data) {
                                results = results.data;
                            }
                            var firstRow = (curPage - 1) * pageSize;
                            if (results.success === false) {
                                Notification.error({ message: 'URL<br/>' + constants.api_url + url, title: 'CODE ERROR - ' + results.code, delay: 5000 });
                                overlay.hide();
                            } else {

                                $rootScope.gridCriteriaOptions.totalItems = results.totalItems;
                                if (results.dataset === undefined)
                                    $rootScope.gridCriteriaOptions.data = results.items;
                                else
                                    $rootScope.gridCriteriaOptions.data = results.dataset;
                                overlay.hide();
                                if (successCallback) successCallback(results);
                            }
                        });
                };
                getPage(1, $rootScope.gridCriteriaOptions.paginationPageSize);
            };

            $rootScope.rowDblClickItem = function () {
                //console.log(row);
                alert("hi");
            };

            $rootScope.nestedGrid = function (gridParams, successCallback) {
                overlay.load();
                // console.log(gridParams);

                // var burl = gridParams.gridDataUrl;
                var colInfo = gridParams.cols;
                var subInfo = gridParams.subcols;
                var gridurl = gridParams.gridDataUrl;
                var subgridurl = gridParams.gridSecondUrl;
                var formatObject = gridParams.editEntityValue;
                var editPageUrl = gridParams.editPageUrl;
                var rowKey = gridParams.rowKey;
                if (gridParams.paramsData === undefined)
                    $rootScope.paramsData = '';
                else
                    $rootScope.paramsData = gridParams.paramsData;
                var paginationsize = 10000;
                var filterData = '';

                var paginationOptions = {
                    sort: null
                };

                var subgridpaginationOptions = {
                    sort: null
                };

                $rootScope.rowDblClick = function (row) {

                    var urlFormat = formUrlFormat(formatObject, row);
                    var urlpath = $location.path();

                    urlpath = urlpath.indexOf("/app/thingstodo/");
                    if (urlpath === -1) editPageUrl = editPageUrl;
                    else {
                        var splitUrl = editPageUrl.split("/");
                        splitUrl[0] = "thingstodo";
                        editPageUrl = splitUrl.join("/");
                        urlFormat = urlFormat;
                    }

                    if (editPageUrl === undefined || editPageUrl === null || editPageUrl === '')
                        return false;
                    else
                        $location.path("app/" + editPageUrl + urlFormat);
                };


                $rootScope.nestedgridOptions = {
                    expandableRowTemplate: '<div ui-grid="row.entity.subGridOptions" ui-grid-pagination style="height:240px;"></div>',
                    expandableRowHeight: 250,
                    paginationPageSizes: [25, 50, 75],
                    paginationPageSize: paginationsize,
                    rowHeight: 37,
                    useExternalPagination: false,
                    useExternalSorting: true,
                    enableGridMenu: true,
                    enableFiltering: true,
                    //enableRowSelection: false,
                    columnDefs: colInfo,
                    autoResize: true,
                    rowTemplate: "<div ng-dblclick=\"grid.appScope.rowDblClick(row)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader }\" ui-grid-cell dbl-click-row></div>",
                    onRegisterApi: function (gridApi) {
                        $rootScope.nestedgridApi = gridApi;
                        $rootScope.nestedgridApi.core.on.filterChanged($rootScope, function () {
                            console.log(this.grid);
                            var grid = this.grid;
                            var i = 0;
                            filterData = '';
                            angular.forEach(grid.columns, function (value, key) {
                                if (value.filter.term !== undefined && value.filter.term !== '') {
                                    filterData += '&';
                                    filterData += "fk-" + value.field + "=" + value.filter.term;
                                }
                            });
                            console.log(filterData);
                            getPage(grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, this.grid.sortCustomColumn)
                        });

                        $rootScope.nestedgridApi.core.on.sortChanged($rootScope, function (grid, sortColumns) {
                            if (getPage) {
                                while (sortColumns.length > 1) { sortColumns[0].unsort(); sortColumns.shift(); }
                                if (sortColumns.length > 0) {
                                    paginationOptions.sort = sortColumns[0].sort.direction;
                                } else {
                                    paginationOptions.sort = null;
                                }
                                this.grid.sortCustomColumn = sortColumns[0].field;
                                getPage(grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, sortColumns[0].field)
                            }
                        });
                        $rootScope.nestedgridApi.pagination.on.paginationChanged($rootScope, function (newPage, pageSize) {
                            if (getPage) {
                                if (getPage) {
                                    getPage(newPage, pageSize, paginationOptions.sort);
                                }
                                //getPage(grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, sortColumns[0].field);
                            }
                        });
                        $rootScope.nestedgridApi.expandable.on.rowExpandedStateChanged($scope, function (row) {
                            var isExpanded = row.isExpanded;
                            gridApi.expandable.collapseAllRows();
                            if (isExpanded) row.isExpanded = true;
                            if (row.isExpanded) {
                                row.entity.subGridOptions = {
                                    columnDefs: subInfo,
                                    paginationPageSizes: [25, 50, 75],
                                    paginationPageSize: paginationsize,
                                    rowHeight: 37,
                                    useExternalPagination: true,
                                    useExternalSorting: true,
                                    enableGridMenu: true,
                                    enableFiltering: true,

                                    appScopeProvider: $rootScope.subGridScope,
                                    rowTemplate: "<div  ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader }\" ui-grid-cell dbl-click-row></div>",
                                    onRegisterApi: function (gridApi) {
                                        gridApi.core.on.filterChanged($rootScope, function () {
                                            console.log(this.grid);
                                            var grid = this.grid;
                                            var i = 0;
                                            filterData = '';
                                            angular.forEach(grid.columns, function (value, key) {
                                                if (value.filter.term !== undefined && value.filter.term !== '') {
                                                    filterData += '&';
                                                    filterData += "fk-" + value.field + "=" + value.filter.term;
                                                }
                                            });

                                            subgridgetPage(row, grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, this.grid.sortCustomColumn)
                                        });

                                        gridApi.core.on.sortChanged($scope, function (grid, sortColumns) {

                                            if (sortColumns.length === 0) {
                                                subgridpaginationOptions.sort = null;
                                            } else {
                                                subgridpaginationOptions.sort = sortColumns[0].sort.direction;
                                            }

                                            subgridgetPage(row, grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, sortColumns[0].field);
                                        });

                                        gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                                            subgridpaginationOptions.pageNumber = newPage;
                                            subgridpaginationOptions.pageSize = pageSize;
                                            subgridgetPage(row, paginationOptions.paginationCurrentPage, paginationOptions.paginationPageSize, paginationOptions.sort, sortColumns[0].field);
                                        });

                                        subgridgetPage(row);
                                    }
                                };
                            }

                        });
                    }
                };

                var subgridgetPage = function (row, curPage, pageSize, sort, field) {
                    var url = '';
                    console.log(row);
                    if (gridParams.multipleKeys === true) {
                        var queryString = '';
                        angular.forEach(gridParams.rowMultipleKeys, function (value, key) {
                            if (gridParams.queryString !== undefined && gridParams.queryString === false) {
                                if (key > 0)
                                    queryString += "/";
                                queryString += row.entity[gridParams.rowMultipleDataKeys[key]];
                            } else {
                                if (key > 0)
                                    queryString += "&";
                                queryString += value + "=" + row.entity[gridParams.rowMultipleDataKeys[key]];
                            }
                        });
                        if (gridParams.queryString !== undefined && gridParams.queryString === false)
                            url = gridParams.gridSecondMultipleUrl + queryString;
                        else
                            url = gridParams.gridSecondMultipleUrl + "?" + queryString;

                    } else {
                        url = subgridurl + row.entity[rowKey];
                    }

                    var urlpath = $location.path();
                    urlpath = urlpath.indexOf("/app/thingstodo/");
                    var burlcheck = url.indexOf("?");
                    var appendString = "&";
                    if (burlcheck === -1)
                        appendString = "?";
                    if (urlpath === -1) {
                        urlpath = "";
                    } else {
                        // urlpath = "&append=notification";
                        urlpath = "";
                    }
                    switch (subgridpaginationOptions.sort) {
                        case uiGridConstants.ASC:
                            url = url + '?so=asc&sc=' + field + '&si=' + ((curPage - 1) * paginationsize) + '&ps=' + paginationsize + urlpath; //url + '/data/100_ASC.json';
                            break;
                        case uiGridConstants.DESC:
                            url = url + '?so=desc&sc=' + field + '&si=' + ((curPage - 1) * paginationsize) + '&ps=' + paginationsize + urlpath; //url + '/data/100_ASC.json';
                            break;
                        default:
                            url = url + appendString + "ps=" + paginationsize + urlpath + "&sc=" + gridParams.defaultSecondSortColumn + "&so=desc&si=0";
                            break;
                    }
                    // $rootScope.gridLoadData = "Loading...";
                    httpService.get(url)
                        .then(function (results) {
                            if (results && results.data) {
                                results = results.data;
                            }
                            if (results.totalItems === undefined)
                                row.entity.subGridOptions.totalItems = results.totalCount;
                            else
                                row.entity.subGridOptions.totalItems = results.totalItems;
                            //row.entity.subGridOptions.totalItems = results.totalCount;
                            var firstRow = (subgridpaginationOptions.pageNumber - 1) * subgridpaginationOptions.pageSize;
                            row.entity.subGridOptions.data = results.dataset; //data.slice(firstRow, firstRow + subgridpaginationOptions.pageSize);
                            $rootScope.gridLoadData = "No Data Found";
                        });
                };

                var formUrlFormat = function (obj, row) {
                    var f = '';
                    for (var key in obj) {
                        f += '/' + row.entity[key];
                    }
                    return f;
                    // return p.join('&');
                };

                var qs = function (obj, prefix) {
                    var str = [];
                    for (var p in obj) {
                        var k = prefix ? prefix + "[" + p + "]" : p,
                            v = obj[k];
                        str.push(angular.isObject(v) ? qs(v, k) : (k) + "=" + encodeURIComponent(v));
                    }
                    return str.join("&");
                };

                var getPage = function (curPage, pageSize, sort, field) {
                    var urlpath = $location.path();
                    urlpath = urlpath.indexOf("/app/thingstodo/");
                    var burlcheck = gridurl.indexOf("?");
                    var appendString = "&";
                    if (burlcheck === -1)
                        appendString = "?";

                    if (urlpath === -1) {
                        urlpath = "";
                    } else {
                        urlpath = "&append=notification";
                    }
                    var url;

                    if (field === undefined)
                        field = gridParams.defaultSortColumn;
                    var paramData = '';
                    if ($rootScope.nestedgridOptions.paramsData !== '' && $rootScope.nestedgridOptions.paramsData !== undefined) {
                        paramData = qs($rootScope.nestedgridOptions.paramsData);
                        if (paramData !== "")
                            paramData = "&" + paramData;
                    }
                    else if ($rootScope.paramsData !== '' && $rootScope.paramsData !== undefined) {
                        paramData = qs($rootScope.paramsData);
                        if (paramData !== "")
                            paramData = "&" + paramData;
                    }

                    switch (sort) {
                        case uiGridConstants.ASC:
                            url = gridurl + appendString + 'so=asc&sc=' + field + paramData + '&si=' + ((curPage - 1) * paginationsize) + '&ps=' + paginationsize + urlpath + paramData + filterData;
                            break;
                        case uiGridConstants.DESC:
                            url = gridurl + appendString + '&so=desc&sc=' + field + paramData + '&si=' + ((curPage - 1) * paginationsize) + '&ps=' + paginationsize + urlpath + paramData + filterData;
                            break;
                        default:
                            url = gridurl + appendString + "ps=" + paginationsize + urlpath + paramData + "&sc=" + field + "&so=desc&si=" + ((curPage - 1) * paginationsize) + filterData;
                            break;
                    }
                    // var _scope = $scope;
                    // $rootScope.gridLoadData = "Loading..";
                    $rootScope.nestedgridOptions.data = [];
                    return httpService.get(url)
                        .then(function (results) {
                            if (results && results.data) {
                                results = results.data;
                            }
                            var firstRow = (curPage - 1) * pageSize;
                            if (results.success === false) {
                                Notification.error({ message: 'URL<br/>' + constants.api_url + url, title: 'CODE ERROR - ' + results.code, delay: 5000 });
                                overlay.hide();
                            } else {
                                if (results.totalItems === undefined)
                                    $rootScope.nestedgridOptions.totalItems = results.totalCount;
                                else
                                    $rootScope.nestedgridOptions.totalItems = results.totalItems;
                                $rootScope.nestedgridOptions.data = results.dataset;
                                $rootScope.gridLoadData = "No Data Found";
                                overlay.hide();
                                if (successCallback) successCallback(results);
                            }
                        });
                };
                getPage(1, $rootScope.nestedgridOptions.paginationPageSize);
            };
        
     
            /* PDF BLOCK*/
            $rootScope.changePageType = function (ptype) {

                $rootScope.pageType = ptype;
            };
            $rootScope.changeOrientationType = function (otype) {

                $rootScope.orientation = otype;
            };
            $rootScope.pdfDefaultSettings = function () {
                $rootScope.pdfSettings = false;
                $rootScope.pdfTitle = 'Print';
            };
          
            $rootScope.closePdfSettings = function (form) {
                $rootScope.pdfDefaultSettings();
            };
            $rootScope.pdfGenerate = function (pdfUrl) {

                httpService.getPdf(pdfUrl)
                    .then(function (results) {
                        if (results && results.data) {
                            results = results.data;
                        }
                        var file = new Blob([results.data], { type: 'application/pdf' });
                        var fileURL = URL.createObjectURL(file);
                        $rootScope.pdfDefaultSettings();
                        overlay.hide();
                        window.open(fileURL);
                    });

            };
        
            /* PDF BLOCK END */
            $rootScope.nestedJavaGrid = function (gridParams) {

                overlay.load();
                // console.log(gridParams);

                // var burl = gridParams.gridDataUrl;
                var colInfo = gridParams.cols;
                var subInfo = gridParams.subcols;
                var gridurl = gridParams.gridDataUrl;
                var subgridurl = gridParams.gridSecondUrl;
                var rowKey = gridParams.rowKey;
                $scope.paramsData = gridParams.paramsData;
                var paginationsize = 10000;

                var paginationOptions = {
                    sort: null
                };

                var subgridpaginationOptions = {
                    sort: null
                };

                $rootScope.nestedjavagridOptions = {
                    expandableRowTemplate: '<div ui-grid="row.entity.subGridOptions" ui-grid-pagination style="height:240px;"></div>',
                    expandableRowHeight: 250,
                    paginationPageSizes: [25, 50, 75],
                    paginationPageSize: paginationsize,
                    rowHeight: 37,
                    useExternalPagination: true,
                    useExternalSorting: true,
                    enableGridMenu: true,
                    enableFiltering: true,
                    //enableRowSelection: false,
                    columnDefs: colInfo,
                    autoResize: true,
                    rowTemplate: "<div ng-dblclick=\"grid.appScope.rowDblClick(row)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader }\" ui-grid-cell dbl-click-row></div>",
                    onRegisterApi: function (gridApi) {
                        $rootScope.nestedjavagridApi = gridApi;
                        $rootScope.nestedjavagridApi.core.on.sortChanged($rootScope, function (grid, sortColumns) {
                            if (getPage) {
                                while (sortColumns.length > 1) { sortColumns[0].unsort(); sortColumns.shift(); }
                                if (sortColumns.length > 0) {
                                    paginationOptions.sort = sortColumns[0].sort.direction;
                                } else {
                                    paginationOptions.sort = null;
                                }
                                this.grid.sortCustomColumn = sortColumns[0].field;
                                getPage(grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, sortColumns[0].field)
                            }
                        });
                        gridApi.pagination.on.paginationChanged($rootScope, function (newPage, pageSize) {
                            if (getPage) {
                                if (getPage) {
                                    getPage(newPage, pageSize, paginationOptions.sort);
                                }
                                //getPage(grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, sortColumns[0].field);
                            }
                        });
                        gridApi.expandable.on.rowExpandedStateChanged($scope, function (row) {
                            var isExpanded = row.isExpanded;
                            gridApi.expandable.collapseAllRows();
                            if (isExpanded) row.isExpanded = true;
                            if (row.isExpanded) {
                                row.entity.subGridOptions = {
                                    columnDefs: subInfo,
                                    paginationPageSizes: [25, 50, 75],
                                    paginationPageSize: paginationsize,
                                    rowHeight: 37,
                                    useExternalPagination: true,
                                    useExternalSorting: true,
                                    enableGridMenu: true,
                                    enableFiltering: true,
                                    onRegisterApi: function (gridApi) {
                                        gridApi.core.on.sortChanged($scope, function (grid, sortColumns) {

                                            if (sortColumns.length === 0) {
                                                subgridpaginationOptions.sort = null;
                                            } else {
                                                subgridpaginationOptions.sort = sortColumns[0].sort.direction;
                                            }

                                            subgridgetPage(row, grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, sortColumns[0].field);
                                        });

                                        gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                                            subgridpaginationOptions.pageNumber = newPage;
                                            subgridpaginationOptions.pageSize = pageSize;
                                            subgridgetPage(row, grid.options.paginationCurrentPage, grid.options.paginationPageSize, paginationOptions.sort, sortColumns[0].field);
                                        });
                                        subgridgetPage(row);
                                    }
                                };
                            }

                        });
                    }
                };

                var subgridgetPage = function (row, curPage, pageSize, sort, field) {
                    //row.entity[rowKey]
                    var url = subgridurl;

                    angular.forEach(rowKey, function (value, key) {
                        url = url.replace(":" + value, row.entity[value]);
                        console.log(url);
                    });


                    var urlpath = $location.path();
                    urlpath = urlpath.indexOf("/app/thingstodo/");
                    var burlcheck = subgridurl.indexOf("?");
                    var appendString = "&";
                    if (burlcheck === -1)
                        appendString = "?";
                    if (urlpath === -1) {
                        urlpath = "";
                    } else {
                        urlpath = "&append=notification";
                    }

                    var criteriaData = {
                        page: {
                            pageNo: curPage - 1,
                            pageSize: paginationsize
                        },
                        sort: {
                            sortBy: field,
                            sortOrder: "DESC"
                        },
                        filters: $scope.filterData
                    };
                    criteriaData = JSON.stringify(criteriaData);
                    switch (sort) {
                        case uiGridConstants.ASC:
                            url = url + appendString + "&criteria=" + criteriaData + urlpath;
                            break;
                        case uiGridConstants.DESC:
                            url = url + appendString + "&criteria=" + criteriaData + urlpath;
                            break;
                        default:
                            url = url + appendString + urlpath + "&criteria=" + criteriaData;
                            break;
                    }

                    httpService.get(url)
                        .then(function (results) {
                            if (results && results.data) {
                                results = results.data;
                            }
                            row.entity.subGridOptions.totalItems = 100;
                            var firstRow = (subgridpaginationOptions.pageNumber - 1) * subgridpaginationOptions.pageSize;
                            row.entity.subGridOptions.data = results.sampleDtos; //data.slice(firstRow, firstRow + subgridpaginationOptions.pageSize);
                            console.log(row.entity.subGridOptions.data);
                        });
                };

                var formUrlFormat = function (obj, row) {
                    var f = '';
                    for (var key in obj) {
                        f += '/' + row.entity[key];
                    }
                    return f;
                    // return p.join('&');
                };

                var qs = function (obj, prefix) {
                    var str = [];
                    for (var p in obj) {
                        var k = prefix ? prefix + "[" + p + "]" : p,
                            v = obj[k];
                        str.push(angular.isObject(v) ? qs(v, k) : (k) + "=" + encodeURIComponent(v));
                    }
                    return str.join("&");
                };

                var getPage = function (curPage, pageSize, sort, field) {
                    var urlpath = $location.path();
                    urlpath = urlpath.indexOf("/app/thingstodo/");
                    var burlcheck = gridurl.indexOf("?");
                    var appendString = "&";
                    if (burlcheck === -1)
                        appendString = "?";

                    if (urlpath === -1) {
                        urlpath = "";
                    } else {
                        urlpath = "&append=notification";
                    }
                    var url;
                    //console.log(gridParams.filterData);
                    if (field === undefined)
                        field = gridParams.defaultSortColumn;
                    var paramData = qs($scope.paramsData);
                    if (paramData !== "")
                        paramData = "&" + paramData;
                    var criteriaData = {
                        page: {
                            pageNo: curPage - 1,
                            pageSize: paginationsize
                        },
                        sort: {
                            sortBy: field,
                            sortOrder: "DESC"
                        },
                        filters: $scope.filterData
                    };
                    criteriaData = JSON.stringify(criteriaData);
                    switch (sort) {
                        case uiGridConstants.ASC:
                            url = gridurl + appendString + "&criteria=" + criteriaData + urlpath;
                            break;
                        case uiGridConstants.DESC:
                            url = gridurl + appendString + "&criteria=" + criteriaData + urlpath;
                            break;
                        default:
                            url = gridurl + appendString + urlpath + "&criteria=" + criteriaData;
                            break;
                    }
                    // var _scope = $scope;

                    return httpService.get(url)
                        .then(function (results) {
                            if (results && results.data) {
                                results = results.data;
                            }
                            var firstRow = (curPage - 1) * pageSize;
                            if (results.success === false) {
                                Notification.error({ message: 'URL<br/>' + constants.api_url + url, title: 'CODE ERROR - ' + results.code, delay: 5000 });
                                overlay.hide();
                            } else {
                                $rootScope.nestedjavagridOptions.totalItems = results.totalCount;
                                $rootScope.nestedjavagridOptions.data = results.items;
                                overlay.hide();
                            }
                        });
                };
                getPage(1, $rootScope.nestedjavagridOptions.paginationPageSize);
            };
        
            $interval($scope.callAtInterval, 10000);
            $scope.refreshDate();
            $rootScope.checkWin();             
        
            // min dates
            $rootScope.minDate =  $rootScope.getCurrentDate();
            $rootScope.maxDate =  $rootScope.getMaxDate();
        }];
    });
