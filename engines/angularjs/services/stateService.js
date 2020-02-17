define(['angularAMD', 'localPersistenceService' ], function (angularAMD) {
    'use strict';

    angularAMD.provider('stateService' , function ($locationProvider, $urlRouterProvider, $stateProvider,  dashboardConfig) {
        this.loadDefaultStates = function () {
            $locationProvider.html5Mode(true);
            //  $urlRouterProvider.otherwise('/auth/login');

            $stateProvider.state('tenant', {
                url: '/tenant',
                abstract: true,
                views: {
                    'mainsection': angularAMD.route({
                        templateUrl: 'engines/angularjs/components/authentication/views/layout.html'
                    })
                }
            })
                .state('tenant.login', {
                    url: '/:tenantCode',
                    views: {
                        'bodysection': angularAMD.route({
                            templateUrl: 'engines/angularjs/components/authentication/views/login.html',
                            controllerUrl: 'components/authentication/controllers/login_ctrl',
                            css: "styles/login.css"
                        })
                    }
                })
                .state('auth', {
                url: '/auth',
                abstract: true,
                views: {
                    'mainsection': angularAMD.route({
                        templateUrl: 'engines/angularjs/components/authentication/views/layout.html'
                    })
                }
            })
                .state('auth.login', {
                    url: '/login',
                    views: {
                        'bodysection': angularAMD.route({
                            templateUrl: 'engines/angularjs/components/authentication/views/login.html',
                            controllerUrl: 'components/authentication/controllers/login_ctrl',
                            css: "styles/login.css"
                        })
                    }
                })
                .state('app', {
                    url: '/app',
                    abstract: true,
                    views: {
                        'mainsection': angularAMD.route({
                            templateUrl: 'engines/angularjs/components/dashboard/views/layout.html',
                            controllerUrl: 'components/dashboard/controllers/appctrl'
                        })
                    }
                })
                .state('directpage', {
                    url: '/directpage',
                    abstract: true,
                    views: {
                        'mainsection': angularAMD.route({
                            templateUrl: 'engines/angularjs/components/authentication/views/layout.html'
                        })
                    }
                })
                .state('directpage.id', {
                    url: '/:tenantCode/:id',
                    abstract: false,
                    views: {
                        'bodysection': angularAMD.route({
                            templateUrl: 'engines/angularjs/components/directpage/views/directpage.html',
                            controllerUrl: 'components/directpage/controllers/directpage_controller'
                        })
                    }
                })
                .state('reports', {
                    url: '/app/:tenantCode/reports',
                    abstract: true,
                    views: {
                        'mainsection': angularAMD.route({
                            templateUrl: 'engines/angularjs/components/dashboard/views/layout.html',
                            controllerUrl: 'components/dashboard/controllers/appctrl'
                            // templateUrl: 'engines/angularjs/components/dashboard/views/layout.html',
                            // controllerUrl: 'components/dashboard/controllers/appctrl'
                        })
                    }
                })
               /* .state('reports.reportcode', {
                    url: '/:reportcode',
                    views: {
                        'bodysection': angularAMD.route({
                            // templateUrl: 'engines/angularjs/components/dashboard/views/layout.html',
                            // controllerUrl: 'components/dashboard/controllers/appctrl'
                            templateUrl: 'engines/angularjs/components/dashboard/views/layout.html',
                             controllerUrl: 'components/jsonbasedpages/controllers/report-screen-controller'
                        })
                    }
                })*/
                .state('app.tenant-dashboard', {
                    url: '/tenant-dashboard',
                    views: {
                        'bodysection': angularAMD.route({
                            'templateUrl': 'engines/angularjs/components/dashboard/views/tenants-dashboard.html',
                            "controllerUrl": 'components/dashboard/controllers/tenants-dashboard-controller'
                        })
                    }
                })
                .state('app.app-dashboard', {
                    url: '/:tenantId/dashboard',
                    views: {
                        'bodysection': angularAMD.route({
                            'templateUrl': 'engines/angularjs/components/dashboard/views/apps-dashboard.html',
                            "controllerUrl": 'components/dashboard/controllers/apps-dashboard-controller'
                        })
                    }
                })
                .state('app.reports', {
                    url: '/:tenantCode/reports/dashboard',
                    views: {
                        'bodysection': angularAMD.route({
                            'templateUrl': 'engines/angularjs/components/dashboard/views/reports-dashboard.html',
                            "controllerUrl": 'components/dashboard/controllers/reports-dashboard-controller'
                        })
                    }
                })
                .state('app.report', {
                    url: '/:tenantCode/report/:reportCode',
                    views: {
                        'bodysection': angularAMD.route({
                            'templateUrl': 'engines/angularjs/components/jsonbasedpages/views/report-screen.html',
                            "controllerUrl": 'components/jsonbasedpages/controllers/report-screen-controller'
                        })
                    }
                })

 /*                .state('error.id', {
                    url: '/:error/:errorCode',
                    abstract: false,
                    views: {
                        'bodysection': angularAMD.route({
                            templateUrl:'engines/angularjs/components/authentication/views/error.html',
                            controllerUrl: 'components/authentication/controllers/error_ctrl'
                        })
                    }
                }) */
                .state('app.logout', {
                    abstract: false,
                    url: '/logout',
                    views: {
                        'bodysection': angularAMD.route({
                            templateUrl: 'engines/angularjs/components/authentication/views/logout.html',
                            controllerUrl: 'components/authentication/controllers/logout_ctrl'
                        })
                    }
                });


        };       

        this.$get = ['$rootScope', '$http', '$urlRouter', '$filter', '$state', '$location', 'stateDefinitionConfig',
            'screenViewDefaultConfig', 'localPersistenceService', function ($rootScope, $http, $urlRouter, $filter, $state, $location, stateDefinitionConfig,
                screenViewDefaultConfig, localPersistenceService) {

                return new StateService($rootScope, $http, $urlRouter, $filter, $state, $location, stateDefinitionConfig,
                    screenViewDefaultConfig, localPersistenceService, $stateProvider);
            }];
    });


    var StateService = function ($rootScope, $http, $urlRouter, $filter, $state, $location, stateDefinitionConfig,
        screenViewDefaultConfig, localPersistenceService, $stateProvider) {
        var self = this;
        var defaultHomePageKeys = ['home', 'tenant-dashboard', 'app-dashboard', 'app-report-dashboard'];


        this.isDashboardScreen = function () {
            var tenantCodePortion = getTenantCodePortionFromUrl();
            var isDashboardScreen = false;
            var path = $location.path();
            path = path.replace(/^([/]*)/g, '');

            if (defaultHomePageKeys.indexOf(tenantCodePortion) !== -1
                || path.endsWith('/dashboard')) {
                isDashboardScreen = true;
            }
            return isDashboardScreen;
        };

        this.isTenantDashboardScreen = function () {
            var tenantCodePortion = getTenantCodePortionFromUrl();
            var isTenantDashboardScreen = false;
            if (tenantCodePortion === 'tenant-dashboard') {
                isTenantDashboardScreen = true;
            }
            return isTenantDashboardScreen;
        };

        this.checkAuthToken = function () {
            var dashboard = localPersistenceService.get('dashboardKey', true);
           // console.log("dashboard=", dashboard);
            var accesstoken = self.getAccessToken();
            if (accesstoken === null && dashboard === null) {
                $location.path("/auth/login");
               // console.log("stateParams=", $state);
              //  console.log("location=", $location.search()["tokenid"]);
                //window.location.href = "app/home/" + dashboard;
            } else {

               // console.log("/app/mjc/mailday/maildayform");
                //console.log("persistCurrentAppKey=", this.persistCurrentAppKey());
                //if($location.search()["tokenid"] != undefined)
                // window.location.href =("/app-platform/app/mjc/mailday/maildayform");
            }
        };


        $rootScope.$on("$locationChangeStart", function (event, next, current) {

            //console.log('$locationChangeStart', event, next, current);
            $('[data-toggle="tooltip"]').tooltip('destroy');
                //var accesstoken = self.getAccessToken();
           // console.log("accesstoken***");
              // self.checkAuthToken();
        });

        this.getActiveStateKey = function () {
            var activeStateKey = $state.current["name"];
            console.log('in stateService activeStateKey: ', activeStateKey);
            return activeStateKey;
        };
        this.persistCurrentAppKey = function () {
            var activeAppDefKey = $state.current["name"];
            if (!activeAppDefKey || activeAppDefKey === "app") {
                activeAppDefKey = localPersistenceService.get("activeAppDefKey", true);
            }
            if (activeAppDefKey.startsWith("app.")) {
                activeAppDefKey = activeAppDefKey.substr(4);
            }

            activeAppDefKey = activeAppDefKey.split(".")[0];
            localPersistenceService.set("activeAppDefKey", activeAppDefKey, true);
        };
        this.getCurrentAppDefKey = function () {
            var activeAppDefKey = localPersistenceService.get("activeAppDefKey", true);
            return activeAppDefKey;
        };
        var getTenantCodePortionFromUrl = function () {
            var path = $location.path();
            path = path.replace(/^([/]*)/g, '');

            var tenantCodePortion = null;
            if (path) {
                var pathSplit = path.split('/');
                if (pathSplit[0] === 'app') {
                    if (pathSplit.length > 1) {
                        tenantCodePortion = pathSplit[1];
                    }
                }
                else {
                    if (pathSplit[0] !== 'auth') {
                        tenantCodePortion = pathSplit[0];
                    }
                }
            }
            return tenantCodePortion;
        };

        var getAppCodePortionFromUrl = function () {
            var path = $location.path();
            path = path.replace(/^([/]*)/g, '');

            var appCodePortion = null;
            if (path) {
                var pathSplit = path.split('/');
                if (pathSplit[0] === 'app') {
                    if (pathSplit.length > 1) {
                        appCodePortion = pathSplit[2];
                    }
                }
                else {
                    if (pathSplit[0] !== 'auth') {
                        appCodePortion = pathSplit[1];
                    }
                }
            }
            return appCodePortion;
        };

        var getDefaultAppMenuCodePortionFromUrl = function () {
            var path = $location.path();
            path = path.replace(/^([/]*)/g, '');

            var appCodePortion = null;
            if (path) {
                var pathSplit = path.split('/');
                if (pathSplit[0] === 'app') {
                    if (pathSplit.length > 1) {
                        appCodePortion = pathSplit[3];
                    }
                }
                else {
                    if (pathSplit[0] !== 'auth') {
                        appCodePortion = pathSplit[2];
                    }
                }
            }
            return appCodePortion;
        };
        this.getCurrentTenantCodeFromUrl = function () {
            var tenantCode;
            var tenantCodePortion = getAppCodePortionFromUrl();
            if (tenantCodePortion && defaultHomePageKeys.indexOf(tenantCodePortion) === -1) {
                tenantCode = tenantCodePortion;
            }
            return tenantCode;
        };

        this.getCurrentAppCodeFromUrl = function () {
            var appCode;
            var appCodePortion = getAppCodePortionFromUrl();
            if (appCodePortion && defaultHomePageKeys.indexOf(appCodePortion) === -1) {
                appCode = appCodePortion;
            }
            return appCode;
        };
        this.getDefaultAppMenuCodeFromUrl = function () {
            var appMenuCode;
            var appMenuCodePortion = getDefaultAppMenuCodePortionFromUrl();
            if (appMenuCodePortion && defaultHomePageKeys.indexOf(appMenuCodePortion) === -1) {
                appMenuCode = appMenuCodePortion;
            }
            return appMenuCode;
        };

        this.loadStates = function (stateList) {
            // var stateList= 
            if (!stateList) {
                return;
            }
            var count = stateList.length;
            for (var i = 0; i < count; i++) {
                var stateName = self.getStateKeyFromMenuKey(stateList[i].name);

                //if (!stateName.startsWith("app.")) {

                //    stateName = "app." + stateName;
                //}
                var state = $state.get(stateName);
                
                if (state === null) {

                  //  console.log("new state added", stateName, stateList[i]);
                    $stateProvider.state(stateName, stateList[i]);
                }
                else {
                    state.url =stateList[i].url;
                  //  console.log("existing state", stateName, state);
                    //$stateProvider.state(stateName, stateList[i]);
                }
            }
            $urlRouter.sync();
            $urlRouter.listen();

        };

        this.navigateToTenantsDashboad = function () {
            // localPersistenceService.remove("activeAppDefKey");
            // localPersistenceService.remove("tenantCode");
            // localPersistenceService.remove("tenantId");

            self.navigateToState('app.tenant-dashboard');
        };

        this.navigateToAppsDashboad = function (tenantCode, tenantId) {
            //  self.navigateToState('app.app-dashboard', { tenantCode: tenantCode });
            //alert("Nagivate to app dashboard");
            self.navigateToState('app.app-dashboard', { tenantId: tenantId });
        };
        this.navigateToState = function (navigateTo, params) {
           // console.log("navigateTo=", navigateTo, params);
            var toState = self.getStateKeyFromMenuKey(navigateTo);
           // console.log('action handler', toState);
            self.persistCurrentAppKey();
            $state.go(toState, params, { reload: true });
            //  $state.reload();
        };
        this.getStateKeyFromMenuKey = function (menuKey) {
            if (!menuKey) {
                return;
            }
            var currentAppDefKey = self.getCurrentAppDefKey();
           // console.log("currentAppDefKey=",currentAppDefKey);
            if (currentAppDefKey === 'app') {
                stateKey = 'app.' + menuKey;
            }
            else {
                var dotSkipPortion = 'app.' + currentAppDefKey + '.';
                menuKey = !menuKey.startsWith('app.') ? 'app.' + menuKey : menuKey;
               //console.log("currentAppDefKey ,menuKey,dotSkipPortion=",currentAppDefKey,dotSkipPortion,menuKey);
                var stateKey = menuKey;
                if (menuKey.startsWith(dotSkipPortion)) {
                    stateKey = menuKey.startsWith(dotSkipPortion) ? menuKey.substring(dotSkipPortion.length) : menuKey;
                    stateKey = dotSkipPortion + stateKey.replace(/\./g, '_');
                }
            }
           // console.log("currentAppDefKey stateKey=",stateKey);
            return stateKey;
        };

        this.buildStates = function (metaDataList, isLoadStates, useTenantIdInUrlRoute) {
            //console.log("buildStates**", metaDataList);
            if (!metaDataList) {
                return null;
            }
            var count = metaDataList.length;
            var stateList = [];
            angular.forEach(metaDataList, function (metaData, key) {
                var state = buildSingleState(metaData, useTenantIdInUrlRoute);
                stateList.push(state);
                var editKeys = metaData["editKeys"];
                if (editKeys) {
                    var metadataForEdit = angular.copy(metaData);
                    angular.forEach(editKeys, function (value, key) {
                        var editKeyRout = "/:" + value;
                        metadataForEdit.urlRoute += editKeyRout;
                        metadataForEdit.key += editKeyRout;
                    });
                    var stateForEdit = buildSingleState(metadataForEdit, useTenantIdInUrlRoute);
                    stateList.push(stateForEdit);


                }
            });

            if (isLoadStates) {
                self.loadStates(stateList);
            }
            console.log("stateList in state service", stateList);
            return stateList;
        };
        var buildSingleState = function (metaData, useTenantIdInUrlRoute) {

            var state = {};
            for (var leftSideKey in stateDefinitionConfig) {
                var rightSideKey = stateDefinitionConfig[leftSideKey];
                var mappingValue;
                if (angular.isString(rightSideKey)) {
                    mappingValue = getMappingValue(rightSideKey, metaData);
                }
                else if (angular.isObject(rightSideKey)) {
                    mappingValue = !angular.isUndefined(rightSideKey["defaultValue"]) ? rightSideKey["defaultValue"] : rightSideKey["default"];
                    if (mappingValue === undefined || mappingValue === null) {
                        mappingValue = {};
                        for (var innerKey in rightSideKey) {
                            var innerRightkey = rightSideKey[innerKey];
                            mappingValue[innerKey] = getMappingValue(innerRightkey, metaData);
                        }
                    }
                }
                if (leftSideKey === 'views') {
                    var pattern = metaData["pattern"];
                    if (pattern && screenViewDefaultConfig[pattern]) {
                        mappingValue = angular.extend(mappingValue, screenViewDefaultConfig[pattern]);
                    }
                    else if (pattern === "CUSTOM") {
                        mappingValue = metaData['view'];
                    }
                    var viewName = mappingValue["name"] || mappingValue["viewName"];
                    var view = {};
                    var viewRoute = angularAMD.route(mappingValue);
                    view[viewName] = viewRoute;
                    mappingValue = view;
                }
                else if (leftSideKey === 'url' && mappingValue) {
                    if (!mappingValue.startsWith("/")) {
                        mappingValue = "/" + mappingValue;
                    }
                    if (useTenantIdInUrlRoute) {
                        mappingValue = '/:tenantCode' + mappingValue;
                    }
                }
                if (!angular.isUndefined(mappingValue)) {
                    state[leftSideKey] = mappingValue;
                }

            }
            console.log("stateList in state servicebuildSingleState=",state);
            return state;
        };
        var getMappingValue = function (key, data) {
            var keySplit = key.split("|");
            var mappingValue;
            for (var index in keySplit) {
                mappingValue = data[keySplit[index]];
                if (mappingValue !== undefined && mappingValue !== null) {
                    break;
                }
            }

            return mappingValue;
        };
    };

    return angularAMD;
});