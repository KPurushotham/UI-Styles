define(['angularAMD', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.service('utilService', function ($rootScope, $q, $http, $urlRouter,
        dateUtilService, constants, Notification, localPersistenceService, _) {
        var self = this;
        this.isDescendant = function (parent, child) {
            var node = child.parentNode;
            while (node !== null) {
                if (node === parent) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        };

        this.hexToRGB = function (hex, alpha) {
            var r = parseInt(hex.slice(1, 3), 16);
            var g = parseInt(hex.slice(3, 5), 16);
            var b = parseInt(hex.slice(5, 7), 16);
            return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
        };

        this.hasAttr = function (elem, attrName) {
            var attr = $(elem).attr(attrName);
            return (typeof attr !== typeof undefined && attr !== false);
        };

        this.formatString = function () {

            // The string containing the format items (e.g. "{0}")
            // will and always has to be the first argument.
            var theString = arguments[0];

            // start with the second argument (i = 1)
            for (var i = 1; i < arguments.length; i++) {
                // "gm" = RegEx options for Global search (more than one instance)
                // and for Multiline search
                var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
                theString = theString.replace(regEx, arguments[i]);
            }

            return theString;
        };

        this.evaluateExpression = function (valueExp, valueSource) {
            var value = valueExp;
            if (valueSource) {
                //var sourceKeys = _.keys(valueSource);
                for (var key in valueSource) {
                    var regEx = new RegExp("\\{\\{" + key + "\\}\\}", "gm");
                    var valueFromSource = angular.isUndefined(valueSource[key]) ? 'null' : valueSource[key];

                    value = value.replace(regEx, valueFromSource);
                }
                if (value.indexOf("||") !== -1) {
                    var valueSplit = value.split("||");
                    for (var i = 0; i < valueSplit.length; i++) {
                        if (valueSplit[i] !== 'null') {
                            value = valueSplit[i];
                            break;
                        }
                    }
                }
            }

            return value;
        };

        this.removeUndefined = function (obj) {
            for (var key in obj) {
                if (!angular.isDefined(obj[key])) {
                    delete obj[key];
                }
            }

            return obj;
        };

        this.sessionTimeOutCheck = function (){
        
            var logInTimeInTimeStamp = moment(localPersistenceService.get("loginTime", true), self.DATE_TIME_FORMAT).unix() * 1000;
            var expireInTimeStamp = localPersistenceService.get("expiresIn", true) *1000;
         //   var currentTime =  moment().format(self.DATE_TIME_FORMAT); 
            var currentTimeInTimeStamp = (new Date()).getTime();
         //var currentTimeInTimeStamp = moment(moment().format(self.DATE_TIME_FORMAT), self.DATE_TIME_FORMAT).unix() * 1000;
            if (currentTimeInTimeStamp > (logInTimeInTimeStamp + expireInTimeStamp)) {
                swal({
                    text: "Session has been expired. Please login again!",
                    icon: "info",
                    button: "Okay"
                });
                localStorage.clear();
                sessionStorage.clear();
                $location.path('auth/login');
            }
            return null;
        };
    });


    return angularAMD;
});