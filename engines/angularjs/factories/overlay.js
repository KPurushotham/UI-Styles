define(['angularAMD', 'platform-main-module', 'common', 'notify', 'stateService', 'angularCSS', 'ngMaterial'], function (angularAMD) {
    'use strict';
    var app = angular.module('platform-main-module');
    app.factory('overlay', ['$rootScope', 'notify', '$state', '$location', '$timeout', 'constants', function ($rootScope, notify, $state, $location, $timeout, constants) {
        return {
            load: function () {
                $rootScope.showMsg = false;
                $rootScope.mainLoader = true;
            },
            hide: function () {
                $rootScope.mainLoader = false;
            },
            showMessage: function (msg) {


                $rootScope.showMsg = true;
                var code = '';
                if (msg) {
                    if (msg.messageCode !== undefined)
                        code = msg.messageCode + ': ';

                    //if (msg.messageCode != undefined)
                    //    code = msg.messageCode + ': ';

                    $rootScope.messageStatus = msg.messageStatus;

                    $rootScope.messageText = code + msg.messageText;


                    // $rootScope.messageClass = '';


                    // for java services they are sening true false as status but .net will not sending so we placed default contant status
                    if (msg.messageStatus === true)
                        msg.messageStatus = constants.successStatus;
                    else if (msg.messageStatus === false)
                        msg.messageStatus = constants.errorStatus;
                    $rootScope.messageClass = "error";
                    if (msg.messageStatus !== undefined)
                        $rootScope.messageClass = msg.messageStatus.toLowerCase();

                    $rootScope.messageList = [];
                    if (msg.messageList !== undefined)
                        $rootScope.messageList = msg.messageList;
                    if (msg.redirectPath !== undefined)
                        $rootScope.redirectPath = msg.redirectPath;

                }

            },
            hideMessage: function (val) {
                $rootScope.showMsg = false;
                $rootScope.messageStatus = '';
                $rootScope.messageText = '';
                if ($rootScope.redirectPath !== undefined) {
                    var redirectPath = $rootScope.redirectPath;
                    $rootScope.redirectPath = undefined;
                    $location.path(redirectPath);
                }
            },
            messageDisplay: function (val) {
                var message = "";
                var className = "";
                var duration = 5000;
                var data = {};
                if (val.status === 200 || val.status === 201 || val.status === 204) {
                    className = "glyphicon glyphicon-ok";
                } else {
                    if (val.status !== undefined) {
                        className = "glyphicon glyphicon-remove error";
                        data = {
                            'statusText': 'Status: ' + val.status + ' , ' + val.message
                        };
                    } else {
                        className = "glyphicon glyphicon-remove error";
                        data = {
                            'statusText': 'Please enter valid Details'
                        };
                    }
                    duration = 15000;
                    this.hide();
                }
                if (val.error === "invalid_token") {
                    data = {
                        'statusText': 'Status: ' + val.error_description
                    };
                    this.hide();
                    $state.go("auth.login");
                } else if (val.error === "unauthorized") {
                    data = {
                        'statusText': 'Status: ' + val.error_description
                    };
                    this.hide();
                    $state.go("auth.login");
                }
                if (val.statusText !== "") {
                    notify({
                        message: val.statusText,
                        classes: className,
                        position: 'center',
                        duration: duration
                    });
                }
                $rootScope.closeAll = function () {
                    notify.closeAll();
                };
                return false;
            }
        };
    }]);
    return angularAMD;
});