var $stateProviderRef = null;
var $urlRouterProviderRef = null;
define(['common', 'notify','stateService'], function(angularAMD) {
    'use strict';
    var app = angular.module('angularAmdSample', ['ui.router', 'cgNotify','ngResource','ui-notification', 'angular-carousel','ng-selectize','nya.bootstrap.select','multipleSelect', 'angucomplete-alt','720kb.datepicker', 'ui.grid', 'ui.grid.edit', 'ivh.treeview',
        'ui.grid.expandable', 'ui.grid.selection', 'ui.grid.pinning', 'ui.grid.exporter', 'ui.grid.pagination','ui.grid.autoResize','ez.timepicker','multipleDatePicker','ngSimpleDatePick'
    ]);
    app.run(['$rootScope', '$state', '$stateParams',
      function($rootScope, $state, $stateParams) {
           $rootScope.$state = $state;
          $rootScope.$stateParams = $stateParams;
      }
    ]);
    app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
        $httpProvider.interceptors.push(function($q, $location) {
            return {
                response: function(response) {
                    return response;
                },
                responseError: function(response) {
                    if (response.status === 401)
                       // $location.url('/auth/login');
                    return $q.reject(response);
                }
            };
        });
        $locationProvider.html5Mode(true);
        //$urlRouterProvider.otherwise('/:tenantCode/auth/login');
    
        $stateProvider.state('/', {
            url: '/:tenantCode',
            abstract: true,
            views: {
                'mainsection': angularAMD.route({
                    templateUrl: 'engines/angularjs/components/authentication/views/layout.html',
                    controllerUrl: 'components/authentication/controllers/tenant_ctrl'
                })
            }
        })
        $stateProvider.state(':tenantCode.auth', {
            url: '/:tenantCode/auth',
            abstract: true,
            views: {
                'mainsection': angularAMD.route({
                    templateUrl: 'engines/angularjs/components/authentication/views/layout.html'
                })
            }
        })
            .state(':tenantCode.auth.login', {
                url: '/:tenantCode/auth/login',
                views: {
                    'bodysection': angularAMD.route({
                        templateUrl: 'engines/angularjs/components/authentication/views/login.html',
                        controllerUrl: 'components/authentication/controllers/login_ctrl'
                    })
                }
            })
            .state('app', {
                url: '/app/:tenantCode',
                abstract: true,
                views: {
                    'mainsection': angularAMD.route({
                        templateUrl: 'engines/angularjs/components/dashboard/views/layout.html',
                        controllerUrl: 'components/dashboard/controllers/appctrl'
                    })
                }
            })
            .state('app.home', {
                url: '/:tenantCode/home',
                views: {
                    'bodysection': angularAMD.route({
                        templateUrl: 'engines/angularjs/components/dashboard/views/home.html',
                        controllerUrl: 'components/dashboard/controllers/home_ctrl'
                    })
                }
            }) 
            .state('app.logout', {
                url: '/logout',
                views: {
                    'bodysection': angularAMD.route({
                        templateUrl: 'engines/angularjs/components/authentication/views/logout.html',
                        controllerUrl: 'components/authentication/controllers/logout_ctrl'
                    })
                }
            });

        $stateProviderRef = $stateProvider;
        $urlRouterProviderRef = $urlRouterProvider;

    }]);

    app.run(['$location','stateService',
          function($location, stateService) {
              
          }
    ]);
    app.run(function($location, $rootScope, overlay,stateService) {
        $rootScope.$on("$locationChangeStart", function(event, next, current) {
            $('[data-toggle="tooltip"]').tooltip('destroy');
            //Check for token and redirect
            // $rootScope.permissions = $.parseJSON(localStorage.getItem('permissions'));
            var token = localStorage.getItem('accesstoken');
            var path = $location.path();
            path =path.replace(/^([/]*)/g, '');
            var tenantCode= 'default';
            if(path){
                var pathSplit = path.split('/');
                if(pathSplit[0]=='app'){
                    if(pathSplit.length>1 && pathSplit[1]!='home'){
                        tenantCode = pathSplit[1];
                    }
                }
                else{
                    if(pathSplit[0]!='auth'){
                        tenantCode = pathSplit[0];
                    }
                }
            }
            localStorage.setItem("tenantCode", tenantCode);
            var urlRedirectPath = tenantCode
            console.log(tenantCode);
            if (token != null) {
                if(localStorage.getItem("screenDefinitionAndStateConfig")){
                    var url = $location.$$url;
                    stateService.loadFromLocalStorage();
                   // $location.path(url);
                }
                else{
                    stateService.loadModuleStates();
                    //  $location.path("/auth/login");
                }
                console.log($location.path());
                console.log($location.path());
                if (token != "" && $location.path().substr(0, 6) == '/auth/') {
                    $rootScope.loggedinUserName = localStorage.getItem("userName");
                }
            } else {
                if (!(pathSplit.indexOf('auth')>=0 && pathSplit.indexOf('login')>=0)) {
                    localStorage.removeItem('accesstoken');
                    if(tenantCode!='default'){
                        $location.path("/"+tenantCode+"/auth/login");
                    }
                    else{
                        $location.path("/auth/login");
                    }
                }
            }
            //var wins = localStorage.getItem("pages");
            //if (wins == undefined) wins = {};
            //else wins = JSON.parse(wins);
           // $rootScope.windows = wins;
            // overlay.load();
        });
        $rootScope.$on("$locationChangeSuccess", function(event, next, current) {
            //overlay.hide();
        });
    });
    app.factory('overlay', ['$rootScope', 'notify', '$state', '$location','$timeout','constants', function($rootScope, notify, $state, $location,$timeout,constants) {
        return {
            load: function() {
                $rootScope.showMsg = false;
                $rootScope.mainLoader = true;
            },
            hide: function() {
                $rootScope.mainLoader = false;
            },
            showMessage: function(msg) {

                $rootScope.showMsg = true;
                var code = '';
                if(msg.messageCode != undefined)
                    code =msg.messageCode + ': ';

                $rootScope.messageStatus = msg.messageStatus;

                $rootScope.messageText = code + msg.messageText;


                // $rootScope.messageClass = '';


                // for java services they are sening true false as status but .net will not sending so we placed default contant status
                if(msg.messageStatus == true)
                    msg.messageStatus = constants.successStatus;
                else if(msg.messageStatus == false)
                    msg.messageStatus = constants.errorStatus;
                $rootScope.messageClass = "error";
                if(msg.messageStatus!=undefined)
                    $rootScope.messageClass = msg.messageStatus.toLowerCase();

                $rootScope.messageList = [];
                if(msg.messageList != undefined)
                    $rootScope.messageList = msg.messageList;
                if(msg.redirectPath != undefined)
                    $rootScope.redirectPath = msg.redirectPath;



            },
            hideMessage: function(val) {
                $rootScope.showMsg = false;
                $rootScope.messageStatus = '';
                $rootScope.messageText = '';
                if ($rootScope.redirectPath != undefined) {
                    var redirectPath = $rootScope.redirectPath;
                    $rootScope.redirectPath = undefined;
                    $location.path(redirectPath);
                }
            },
            messageDisplay: function(val) {
                var message = "";
                var className = "";
                var duration = 5000;
                var data = {};
                if (val.status == 200 || val.status == 201 || val.status == 204) {
                    className = "glyphicon glyphicon-ok";
                } else {
                    if (val.status != undefined) {
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
                if (val.error == "invalid_token") {
                    data = {
                        'statusText': 'Status: ' + val.error_description
                    };
                    this.hide();
                    $state.go("auth.login");
                } else if (val.error == "unauthorized") {
                    data = {
                        'statusText': 'Status: ' + val.error_description
                    };
                    this.hide();
                    $state.go("auth.login");
                }
                if (val.statusText != "") {
                    notify({
                        message: val.statusText,
                        classes: className,
                        position: 'center',
                        duration: duration
                    });
                }
                $rootScope.closeAll = function() {
                    notify.closeAll();
                };
                return false;
            }
        };
    }]);
    app.factory('srv', function($q,$http) {
        var queue=[];
        var execNext = function() {
            var task = queue[0];
            $http(task.c).then(function(data) {
                queue.shift();

                data.counter = task.counter

                task.d.resolve(data);
                if (queue.length>0) execNext();
            }, function(err) {
                task.d.reject(err);
            })
            ;
        };
        return function(config,counter) {
            var d = $q.defer();

            queue.push({c:config,d:d,counter:counter});
            if (queue.length===1) execNext();
            return d.promise;
        };
    });
    app.service("httpService", function($http, $rootScope, $window, constants,Notification,overlay,$timeout) {
        var  logOutRedirectPath = "app/logout";
        this.getAll = function(url) {
            return $http.get(constants.api_url + url);
        };
        this.get = function(url, data) {
            $http.defaults.headers.common['Authorization'] = localStorage.getItem('accesstoken');
            var response = $http({
                method: "get",
                url: constants.api_url + url
            })
                .error(function(data, status, error, config) {
                    overlay.hide();

                    // error msgs from server
                    if(status==500  &&  data.code == 401) {

                        overlay.showMessage({
                            messageStatus: false,
                            messageText: data.message,
                            redirectPath: logOutRedirectPath
                        });


                    }else if(status==500) {
                        overlay.showMessage({
                            messageStatus: data.success,
                            messageText: data.message,
                            messageCode: data.code
                        });
                        $timeout(function(){
                            overlay.hideMessage();
                        },6000);


                    }else
                        if(status==0 || status== -1)
                            Notification.error({message: 'Issue might be with network or server',title:'CODE ERROR - '+ status,delay: 3000});
                        else
                            Notification.error({message: 'SERVICE URL<br/><br/>'+config.url, title: 'CODE ERROR - '+ status,delay: 3000});

                }).
                success(function(data, status, headers, config) {
                    console.log(status);
                    localStorage.setItem("accesstoken", headers('Authorization'));

                });

            return response;
        }
        this.getPdf = function(url, data) {
            $http.defaults.headers.common['Authorization'] = localStorage.getItem('accesstoken');
            var response = $http({
                method: "get",
                url: constants.api_url + url,
                responseType : 'arraybuffer',


            })
                .error(function(data, status, error, config) {
                    overlay.hide();

                    // error msgs from server
                    if(status==500  &&  data.code== 401) {
                        overlay.showMessage({
                            messageStatus: false,
                            messageText: data.message,
                            redirectPath: logOutRedirectPath
                        });
                    }else if(status==500) {
                        overlay.showMessage({
                            messageStatus: data.success,
                            messageText: data.message,
                            messageCode: data.code
                        });
                        $timeout(function(){
                            overlay.hideMessage();
                        },6000);


                    }else
                        if(status==0 || status== -1)
                            Notification.error({message: 'Issue might be with network or server',title:'CODE ERROR - '+ status,delay: 3000});
                        else
                            Notification.error({message: 'SERVICE URL<br/><br/>'+config.url, title: 'CODE ERROR - '+ status,delay: 3000});

                }).
                success(function(data, status, headers, config) {

                    localStorage.setItem("accesstoken", headers('Authorization'));

                });

            return response;
        }
        this.getNotification = function(id, data) {
            $http.defaults.headers.common['Authorization'] = localStorage.getItem('accesstoken');
            var response = $http({
                method: "get",
                url: constants.api_url + 'application/notification/entity/'+id
            }).success(function(data, status, headers, config) {

                localStorage.setItem("accesstoken", headers('Authorization'));

            })
                .error(function(data, status, error, config) {
                    overlay.hide();
                    // error msgs from server
                    if(status==500  &&  data.code== 401) {
                        overlay.showMessage({
                            messageStatus: false,
                            messageText: data.message,
                            redirectPath: logOutRedirectPath
                        });
                    }else if(status==500) {
                        overlay.showMessage({
                            messageStatus: data.success,
                            messageText: data.message,
                            messageCode: data.code
                        });
                        $timeout(function(){
                            overlay.hideMessage();
                        },6000);


                    }else
                        if(status==0 || status== -1)
                            Notification.error({message: 'Issue might be with network or server',title:'CODE ERROR - '+ status,delay: 3000});
                        else
                            Notification.error({message: 'SERVICE URL<br/><br/>'+config.url, title: 'CODE ERROR - '+ status,delay: 3000});

                });
            return response;
        }
        this.getWithParams = function(url, data) {
            $http.defaults.headers.common['Authorization'] = localStorage.getItem('accesstoken');
            var response = $http({
                method: "get",
                url: constants.api_url + url,
                data: this.toparams(data),
            }).
                success(function(data, status, headers, config) {

                    localStorage.setItem("accesstoken", headers('Authorization'));

                })
                .error(function(data, status, error, config) {
                    overlay.hide();
                    // error msgs from server
                    if(status==500  &&  data.code== 401) {
                        overlay.showMessage({
                            messageStatus: false,
                            messageText: data.message,
                            redirectPath: logOutRedirectPath
                        });
                    }else if(status==500) {
                        overlay.showMessage({
                            messageStatus: data.success,
                            messageText: data.message,
                            messageCode: data.code
                        });
                        $timeout(function(){
                            overlay.hideMessage();
                        },6000);


                    }else
                        if(status==0 || status== -1)
                            Notification.error({message: 'Issue might be with network or server',title:'CODE ERROR - '+ status,delay: 3000});
                        else
                            Notification.error({message: 'SERVICE URL<br/><br/>'+config.url, title: 'CODE ERROR - '+ status,delay: 3000});

                });
            return response;
        }
        this.put = function(url, data) {
            $http.defaults.headers.common['Authorization'] = localStorage.getItem('accesstoken');
            //console.log(JSON.stringify(data));
            var response = $http({
                method: "put",
                url: constants.api_url + url,
                data: JSON.stringify(data),
                dataType: "json"
            }).
                success(function(data, status, headers, config) {

                    localStorage.setItem("accesstoken", headers('Authorization'));

                })
                .error(function(data, status, error, config) {
                    overlay.hide();
                    // error msgs from server
                    if(status==500  &&  data.code== 401) {
                        data.error = 'Failure';
                        overlay.showMessage({
                            messageStatus: data.error,
                            messageText: data.message,
                            redirectPath: logOutRedirectPath
                        });
                    }else if(status==500) {
                        overlay.showMessage({
                            messageStatus: data.success,
                            messageText: data.message,
                            messageCode: data.code
                        });
                        $timeout(function(){
                            overlay.hideMessage();
                        },6000);


                    }else
                        if(status==0 || status== -1)
                            Notification.error({message: 'Issue might be with network or server',title:'CODE ERROR - '+ status,delay: 3000});
                        else
                            Notification.error({message: 'SERVICE URL<br/><br/>'+config.url, title: 'CODE ERROR - '+ status,delay: 3000});

                });
            return response;
        }
        this.delete = function(url) {
            $http.defaults.headers.common['Authorization'] = localStorage.getItem('accesstoken');
            var response = $http({
                method: "delete",
                url: constants.api_url + url
            }).
                success(function(data, status, headers, config) {

                    localStorage.setItem("accesstoken", headers('Authorization'));

                })
                .error(function(data, status, error, config) {
                    overlay.hide();
                    // error msgs from server
                    if(status==500  &&  data.code== 401) {
                        data.error = 'Failure';
                        overlay.showMessage({
                            messageStatus: data.error,
                            messageText: data.message,
                            redirectPath: logOutRedirectPath
                        });
                    }else if(status==500) {
                        overlay.showMessage({
                            messageStatus: data.success,
                            messageText: data.message,
                            messageCode: data.code
                        });
                        $timeout(function(){
                            overlay.hideMessage();
                        },6000);


                    }else
                        if(status==0 || status== -1)
                            Notification.error({message: 'Issue might be with network or server',title:'CODE ERROR - '+ status,delay: 3000});
                        else
                            Notification.error({message: 'SERVICE URL<br/><br/>'+config.url, title: 'CODE ERROR - '+ status,delay: 3000});

                });
            return response;
        }
        this.post = function(url, data) {
            $http.defaults.headers.common['Authorization'] = localStorage.getItem('accesstoken');
            var response = $http({
                method: "post",
                url: constants.api_url + url,
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).
                success(function(data, status, headers, config) {

                    localStorage.setItem("accesstoken", headers('Authorization'));

                })
                .error(function(data, status, error, config) {

                    overlay.hide();
                    // error msgs from server
                    if(status==500  &&  data.code== 401) {
                        data.error = 'Failure';
                        overlay.showMessage({
                            messageStatus: data.error,
                            messageText: data.message,
                            redirectPath: logOutRedirectPath
                        });
                    }else if(status==500) {
                        overlay.showMessage({
                            messageStatus: data.success,
                            messageText: data.message,
                            messageCode: data.code
                        });
                        $timeout(function(){
                            overlay.hideMessage();
                        },6000);


                    }else
                        if(status==0 || status== -1)
                            Notification.error({message: 'Issue might be with network or server',title:'CODE ERROR - '+ status,delay: 3000});
                        else
                            Notification.error({message: 'SERVICE URL<br/><br/>'+config.url, title: 'CODE ERROR - '+ status,delay: 3000});

                });
            return response;
        }
        this.loginpost = function(url, data) {
            var response = $http({
                method: "post",
                url: constants.api_url + url,
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .error(function(data, status, error, config) {
                    overlay.hide();
                    // error msgs from server
                    if(status==500) {
                        overlay.showMessage({
                            messageStatus: data.success,
                            messageText: data.message,
                            messageCode: data.code
                        });
                        $timeout(function(){
                            overlay.hideMessage();
                        },6000);


                    }else
                        if(status==0 || status== -1)
                            Notification.error({message: 'Issue might be with network or server',title:'CODE ERROR - '+ status,delay: 3000});
                        else
                            Notification.error({message: 'SERVICE URL<br/><br/>'+config.url, title: 'CODE ERROR - '+ status,delay: 3000});

                });
            return response;
        }
        this.toparams = function ObjecttoParams(obj) {
            var p = [];
            for (var key in obj) {
                p.push(key + '=' + encodeURIComponent(obj[key]));
            }
            return p.join('&');
        };
    })
        .constant('constants', {


            //site_url: 'http://hrc.atnoc.com/qa/',
            //api_url: 'http://hrc.atnoc.com:8181/vdi-restapi/',
            site_url: 'http://localhost/hrcweb/',

            //api_url: 'http://10.10.10.137:8080/vdi-restapi/',  
            //api_url: 'http://183.82.113.241:8080/vdi-restapi/',  

            //api_url: 'http://183.82.113.241:8080/vdi-restapi/',  
            api_url: 'http://10.10.10.242:8080/vdi-restapi/',  
            // api_url: 'http://183.82.113.241:8080/vdi-restapi/',  
            //api_url: 'http://183.82.113.241:8080/vdi-restapi/',  
            //site_url: 'http://hrc.atnoc.com/qa/',
            //api_url: 'http://hrc.atnoc.com:8080/vdi-restapi/',
            //api_url: 'http://183.82.113.241:8080/vdi-restapi/',
            //site_url: 'http://hrc.atnoc.com/qa/',
            //api_url: 'http://hrc.atnoc.com:8080/vdi-restapi/',
            //site_url: 'http://183.82.113.241:8080/hrcweb/',
            //site_url: 'http://hrc.atnoc.com/dev/',
            //api_url: 'http://183.82.113.241:8080/vdi-restapi/',
            //api_url: 'http://183.82.113.241:8080/hrc-api/',
            //api_url: 'http://192.168.43.210:8080/vdi-restapi/',
            //api_url: 'http://169.254.249.64:8080/vdi-restapi/',
            //api_url: 'http://localhost:8081/hrc-war/',
            //api_url: 'http://183.82.113.241:8080/vdi-restapi/',
            // api_url: 'http://localhost:8081/hrc-war/',
            // api_url: 'http://183.82.113.241:8080/vdi-restapi/',
            //api_url: 'http://183.82.113.241:8080/vdi-restapi/',
            //api_url: 'http://localhost:8081/hrc-war/',
            api_url: 'http://183.82.113.241:8080/vdi-restapi/',
            // api_url: 'http://localhost:8081/hrc-war/',
            successStatus: "Success",
            errorStatus: "Failure",
            recordSave: "Record submitted successfully",
            checkSave: "Please check your Details",
            recordUpdate: "Record submitted successfully",
            formValid: "Please fill mandatory fields",
            serviceError: "There is a problem with service",
            notificationUpdate :"Record submitted successfully",
            notificationFail :"Your notification has failed",
            generateBill : "Posted to accounts successfully",
        });
    app.directive('tabindex', function () {
        return {
            restrict: 'A',
            link: function (scope, elem, attr, ctrl) {
                if (attr.tabindex == 1) {
                    elem.focus();
                }
            }
        };
    });
    app.directive('numbersOnly', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelCtrl) {
                function fromUser(text) {
                    if (text) {
                        var transformedInput = text.replace(/[^0-9]/g, '');
                        if (transformedInput !== text) {
                            ngModelCtrl.$setViewValue(transformedInput);
                            ngModelCtrl.$render();
                        }
                        return transformedInput;
                    }
                    return '';
                }
                ngModelCtrl.$parsers.push(fromUser);
            }
        };
    });

    app.factory('formPersistence', function () {
        var data = {};

        var get = function (key) {
            console.log(data)
            return data[key];
        };

        var set = function (updated) {
            console.log(updated);

            data[updated.keyStorage] = updated;
        }

        var reset = function (key) {
            data[key] = {};
        }

        return {
            get: get,
            set: set,
            reset: reset
        };
    });

    app.directive('compile', ['$compile', function ($compile) {
        return function(scope, element, attrs) {
            scope.$watch(
                function(scope) {
                    console.log(LS.financial_year);
                    return LS.financial_year; //scope.$eval(attrs.compile);
                },
                function(value) {
                    element.html(value);
                    $compile(element.contents())(scope);
                }
            );
        };
    }])

    app.directive('blurToCurrency', function($filter){
        return {
            require: 'ngModel',

            link: function(scope, el, attrs,ngModelCtrl){
                var uVal  = '';
                el.val($filter('IndianCurrency')(el.val()));

                el.bind('focus', function(){

                    uVal = $filter('UnFormatCurrency')(el.val());
                    if(isNaN(uVal))
                        uVal = '';
                    el.val(uVal);
                });

                el.bind('input', function(){
                    //    el.val(el.val());
                    scope.$apply();
                });

                el.bind('blur', function(){
                    el.val($filter('IndianCurrency')(el.val()));
                });
            }
        }
    });
    app.directive('blurToUnitCurrency', function($filter){
        return {
            require: 'ngModel',

            link: function(scope, el, attrs,ngModelCtrl){
                var uVal  = '';
                el.val($filter('IndianCurrency')(el.val(),4));

                el.bind('focus', function(){

                    uVal = $filter('UnFormatCurrency')(el.val());
                    if(isNaN(uVal))
                        uVal = '';
                    el.val(uVal);
                });

                el.bind('input', function(){
                    //    el.val(el.val());
                    scope.$apply();
                });

                el.bind('blur', function(){
                    el.val($filter('IndianCurrency')(el.val(),4));
                });
            }
        }
    });
    app.directive('excludingZero', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelCtrl) {
                function filterData(text) {
                    if (text) {

                        if(parseInt(text) == 0)
                        {
                            ngModelCtrl.$setViewValue('');
                            ngModelCtrl.$render();
                        }
                        var transformedInput = text.replace(/[^0-9]/g, '');
                        if (transformedInput !== text) {
                            ngModelCtrl.$setViewValue(transformedInput);
                            ngModelCtrl.$render();
                        }
                        return transformedInput;
                    }
                    return '';
                }
                ngModelCtrl.$parsers.push(filterData);
            }
        };
    });

    app.directive('checkSpecial', function($rootScope) {
        return {
            require: '?ngModel',
            link: function(scope, element, attrs, ngModelCtrl) {
                if(!ngModelCtrl) {
                    return;
                }

                ngModelCtrl.$parsers.push(function(val) {
                    if (angular.isUndefined(val)) {
                        var val = '';
                    }

                    //var clean = val.replace(/[^0-9\.]/g, '');
                    var clean = val.replace(/[^0-9A-Za-z]/g, '');
                    var negativeCheck = clean.split('-');
                    var decimalCheck = clean.split('.');
                    if(!angular.isUndefined(negativeCheck[1])) {
                        negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                        clean =negativeCheck[0] + '-' + negativeCheck[1];
                        if(negativeCheck[0].length > 0) {
                            clean =negativeCheck[0];
                        }

                    }

                    if(!angular.isUndefined(decimalCheck[1])) {
                        var dRound = 2;
                        if($rootScope.UserData.round_decimals != undefined)
                            dRound = parseInt($rootScope.UserData.round_decimals);
                        decimalCheck[1] = decimalCheck[1].slice(0, dRound);
                        clean =decimalCheck[0] + '.' + decimalCheck[1];
                    }

                    if (val !== clean) {
                        ngModelCtrl.$setViewValue(clean);
                        ngModelCtrl.$render();
                    }
                    return clean;
                });
                element.bind('keypress', function(event) {
                    if(event.keyCode === 32) {
                        event.preventDefault();
                    }
                });
            }
        };
    });
    app.directive('onlyLettersInput', onlyLettersInput);
    function onlyLettersInput() {
        return {
            require: 'ngModel',
            link: function(scope, element, attr, ngModelCtrl) {
                function filterData(text) {
                    var transformedInput = text.replace(/[^a-zA-Z]/g, '');

                    if (transformedInput !== text) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                    return transformedInput;
                }
                ngModelCtrl.$parsers.push(filterData);
            }
        };
    };
    app.directive('dateInputChars', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelCtrl) {
                function filterData(text) {
                    if (text) {
                        var transformedInput = text.replace(/[^0-9/-]/g, '');

                        if (transformedInput !== text) {
                            ngModelCtrl.$setViewValue(transformedInput);
                            ngModelCtrl.$render();
                        }
                        return transformedInput;
                    }
                    return undefined;
                }
                ngModelCtrl.$parsers.push(filterData);
            }
        };
    });
    app.directive('tooltip', function(){
        return {
            restrict: 'A',
            link: function(scope, element, attrs){
                $('[data-toggle="tooltip"]').tooltip('destroy');
                $(element).hover(function(){
                    //$(element).tooltip('hide');
                    console.log(element[0].offsetWidth+"="+element[0].scrollWidth);
                    // on mouseenter
                    if(element[0].offsetWidth < element[0].scrollWidth) {
                        //console.log(element);
                        //console.log(element[0].offsetWidth+"="+element[0].scrollWidth);
                        $(element).tooltip('show');
                    }
                }, function(){
                    // on mouseleave
                    //$(element).tooltip('hide');
                    // $('[data-toggle="tooltip"]').tooltip('destroy');
                });
            }
        };
    });
    app.directive('validDecimal', function() {
        return {
            require: '?ngModel',
            link: function(scope, element, attrs, ngModelCtrl) {
                if(!ngModelCtrl) {
                    return;
                }

                ngModelCtrl.$parsers.push(function(val) {
                    if (angular.isUndefined(val)) {
                        var val = '';
                    }

                    var clean = val.replace(/[^0-9\.]/g, '');
                    var negativeCheck = clean.split('-');
                    var decimalCheck = clean.split('.');
                    if(!angular.isUndefined(negativeCheck[1])) {
                        negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                        clean =negativeCheck[0] + '-' + negativeCheck[1];
                        if(negativeCheck[0].length > 0) {
                            clean =negativeCheck[0];
                        }

                    }

                    if(!angular.isUndefined(decimalCheck[1])) {
                        decimalCheck[1] = decimalCheck[1].slice(0,2);
                        clean =decimalCheck[0] + '.' + decimalCheck[1];
                    }

                    if (val !== clean) {
                        ngModelCtrl.$setViewValue(clean);
                        ngModelCtrl.$render();
                    }
                    return clean;
                });

                element.bind('keypress', function(event) {
                    if(event.keyCode === 32) {
                        event.preventDefault();
                    }
                });
            }
        };
    });
    app.directive('quantityDecimal', function() {
        return {
            require: '?ngModel',
            link: function(scope, element, attrs, ngModelCtrl) {
                if(!ngModelCtrl) {
                    return;
                }

                ngModelCtrl.$parsers.push(function(val) {
                    if (angular.isUndefined(val)) {
                        var val = '';
                    }

                    var clean = val.replace(/[^0-9\.]/g, '');
                    var negativeCheck = clean.split('-');
                    var decimalCheck = clean.split('.');
                    if(!angular.isUndefined(negativeCheck[1])) {
                        negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                        clean =negativeCheck[0] + '-' + negativeCheck[1];
                        if(negativeCheck[0].length > 0) {
                            clean =negativeCheck[0];
                        }

                    }

                    if(!angular.isUndefined(decimalCheck[1])) {
                        decimalCheck[1] = decimalCheck[1].slice(0,4);
                        clean =decimalCheck[0] + '.' + decimalCheck[1];
                    }

                    if (val !== clean) {
                        ngModelCtrl.$setViewValue(clean);
                        ngModelCtrl.$render();
                    }
                    return clean;
                });

                element.bind('keypress', function(event) {
                    if(event.keyCode === 32) {
                        event.preventDefault();
                    }
                });
            }
        };
    });
    app.filter('capitalizeFirstLetter', function () {
        return function (string) {

            if(string!=null && string.length > 0)
                return string.charAt(0).toUpperCase() + string.slice(1);
            else
                return '';
        };
    });
    app.filter('IndianCurrency', function() {
        return function(data,n = 2) {

            if (null != data) {
                return Number(data).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: n, maximumFractionDigits: n});
            } else {
                return Number(0).toLocaleString('en-IN', { style: 'currency',currency: 'INR', minimumFractionDigits: n, maximumFractionDigits: n});
            }
        };
        });
        app.filter('UnFormatCurrency',function(){
            return function(price) {
                price = price.toString();
                return parseFloat(price.replace(/[^0-9-.]/g, ''));
            };
        });

        return angularAMD.bootstrap(app);
    });
