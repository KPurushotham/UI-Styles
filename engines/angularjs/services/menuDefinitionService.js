define(['angularAMD', 'stateService', 'appDefinitionService', 'tenantService','authService'], function (angularAMD) {
    'use strict';

    angularAMD.service('menuDefinitionService', ['$rootScope', '$state', '$http', '$q', '$urlRouter', '$filter',
        'stateService', 'appDefinitionService', 'tenantService', 'menuGlobalDefaultConfig', 'localPersistenceService',
        'authService','$stateParams',
        function ($rootScope, $state, $http, $q, $urlRouter, $filter,
            stateService, appDefinitionService, tenantService, menuGlobalDefaultConfig, localPersistenceService, authService,$stateParams) {
            var self = this;
            var applyUserPermissions = function (menusConfigList, appKey) {
                //console.log("Step 9 applyUserPermissions ");
                var tenantId = tenantService.getCurrentTenantId();
                //console.log("applyUserPermissions appKey=**",tenantId,appKey);
                var accessibleMenuKeys = authService.getAccessibleMenuList(tenantId, appKey);
                //console.log("accessibleMenuKeys=**",accessibleMenuKeys);
                //["administration", "administration.contractagent",
                //"administration.contractagentform", "administration.distribution"];
                for (var menuKey in menusConfigList) {
                    var menuKeyWithAppKey = menuKey.replace(appKey + ".","");
                    if (!accessibleMenuKeys || accessibleMenuKeys.indexOf(menuKeyWithAppKey) === -1) {
                        delete menusConfigList[menuKey];
                    }
                }
               // console.log("Step 9 applyUserPermissions menusConfigList ", menusConfigList);
               // console.log("applyUserPermissions menusConfigList=**",menusConfigList);
                return menusConfigList;
            };

            var getCurrentAppMenusConfig = function () {
                var deferred = $q.defer();
               // console.log("Step 3 getCurrentAppMenusConfig ");
                var appMetadata = appDefinitionService.getCurrentAppMetadata();
               // console.log("Step 3 getCurrentAppMenusConfig appMetadata ", appMetadata);
                if (appMetadata && appMetadata["menusConfig"]) {
                  //  console.log("1000 appMetadata-menusConfig", appMetadata["menusConfig"]);
                    stateService.loadStates(appMetadata["menusConfig"]);
                    deferred.resolve(appMetadata["menusConfig"]);

                    // return appMetadata["menusConfig"];
                } else {
                    self.loadMenusMetadataFromService().then(function (res) {
                      //  console.log("1000 loadMenusMetadataFromService =", res)
                        deferred.resolve(res);
                    });
                    /*.then(function(appMetadata){
                        alert("aa");
                       // var appMetadata = appDefinitionService.getCurrentAppMetadata();
                        console.log("latest appMetadata=",appMetadata);
                        stateService.loadStates(appMetadata["menusConfig"]);
                        return appMetadata["menusConfig"];
                    });*/
                    //alert("bb");
                }
                return deferred.promise;
            };

            this.loadCurrentAppMenusStates = function () {
                var defer = $q.defer();
               // console.log("load loadCurrentAppMenusStates");
                var auth = localPersistenceService.get('auth', true);
                var accesstoken = auth && auth.access_token;
                var isTenantDashboardScreen = stateService.isTenantDashboardScreen();
                if (accesstoken && !isTenantDashboardScreen) {
                    //   $rootScope.showAppToolBar=true;
                    appDefinitionService.loadAppsMetadata().then(function () {
                        self.loadMenusMetadata().then(function (menumetadata) {
                            defer.resolve(menumetadata);
                        });

                    });
                }
                return defer.promise;
            };

            this.getCurrentAppMenuMetaData = function () {
                return getCurrentAppMenusConfig();
                /*
                var menusConfig = getCurrentAppMenusConfig();
                if (menusConfig) { return menusConfig["menusMetadata"] }
                */
            };

            this.getMenuDefinitionByKey = function (menuKey) {
                var menuConfig = null;
                var defer = $q.defer();
                self.getCurrentAppMenuMetaData().then(function (menusConfig) {
                    menuConfig = menusConfig["menusMetadata"];
                    menuKey = self.getMenuKeyFromStateKey(menuKey);
                   // console.log("$stateParams=",$stateParams);
                   // var mkey = menuKey.split(".")[0]+"."+ menuKey.split(".")[1].replace("reportcode",$stateParams["reportcode"]);
                   // defer.resolve(menuConfig[mkey]);
                   defer.resolve(menuConfig[menuKey]);
                });
                return defer.promise;

            };
            this.getMenuKeyFromStateKey = function (stateKey) {
                var menuKey = stateKey.startsWith('app.') ? stateKey.substring(4) : stateKey;
                //menu Key Split For EditKeys
                menuKey = menuKey.split("/:")[0];

                return menuKey.replace(/_/g, '.');
            };
            this.getActiveMenuKey = function () {
                var stateKey = $state.current["name"];
                return self.getMenuKeyFromStateKey(stateKey);
            };
            this.getActiveMenuMetadata = function () {
                var menuKey = self.getActiveMenuKey();
                return self.getMenuDefinitionByKey(menuKey);
            };
            var extendWithDefaultMenuConfig = function (menusMetadata) {
               // console.log("Step 8 extendWithDefaultMenuConfig menusMetadata ", menusMetadata);
                var defaultConfig = {};
                var resultMetadata = {};
                angular.forEach(menusMetadata, function (menuMetadata, key) {
                    var menuKey = menuMetadata["key"] || menuMetadata["stateName"];
                    resultMetadata[menuKey] = angular.extend({}, defaultConfig, menuMetadata);
                });
                //console.log("Step 8 extendWithDefaultMenuConfig resultMetadata ", resultMetadata);
                return resultMetadata;
            };
            this.loadMenusMetadataFromService = function () {
                var deferred = $q.defer();
                //console.log("Step 7 loadMenusMetadataFromService");
                var currentTenantCode = tenantService.getCurrentTenantCode();
                var currentAppDefKey = appDefinitionService.getCurrentAppDefKey();
                //var authToken = localPersistenceService.get("authToken");

                //TODO: this metadata should be based on logged in user authToken
                var configDataUrl = 'apps/' + currentAppDefKey + '/config/menu.json?v=' + version;
                //console.log("configDataUrl", configDataUrl);
               // console.log("Step 7 loadMenusMetadataFromService configDataUrl ", configDataUrl);
                //console.log("deferred");
                $http.get(configDataUrl)
                    .success(function (menuDefList) {
                      //  console.log("Step 7 loadMenusMetadataFromService menuDefList ", menuDefList);
                        if (angular.isArray(menuDefList)) {
                           // console.log("menuDefList=", menuDefList);
                            var menusMetadata = extendWithDefaultMenuConfig(menuDefList);
                            menusMetadata = applyUserPermissions(menusMetadata, currentAppDefKey);

                            var menusStates = stateService.buildStates(menusMetadata, true);

                            var currentAppMenusMetadata = {
                                "menusMetadata": menusMetadata
                                //, "menusStates": menusStates
                            };
                            appDefinitionService.updateCurrentAppMetadata("menusConfig", currentAppMenusMetadata);
                            deferred.resolve(currentAppMenusMetadata);
                        }
                    });
                return deferred.promise;
            }
            this.loadMenusMetadata = function (callback) {
                var deferred = $q.defer();

               // console.log("loadMenusMetadata***");
                var currentAppMetadata = appDefinitionService.getCurrentAppMetadata();
                if (!currentAppMetadata) {
                     deferred.reject(null);
                }
                var currentAppDefKey = appDefinitionService.getCurrentAppDefKey();
                var menusConfig =currentAppMetadata && currentAppMetadata["menusConfig"];
                if (menusConfig && menusConfig["menusMetadata"]) {
                   var menusMetadata = menusConfig["menusMetadata"];
                   menusMetadata = applyUserPermissions(menusMetadata, currentAppDefKey);

                   stateService.buildStates(menusMetadata, true);
                    if (angular.isFunction(callback)) {
                        callback(menusMetadata);
                        deferred.resolve(menusMetadata);
                    }
                }
                else {
                    var currentTenantCode = tenantService.getCurrentTenantCode();
                    //var authToken = localPersistenceService.get("authToken");
                    //TODO: this metadata should be based on logged in user authToken
                    var configDataUrl = 'apps/' + currentAppDefKey + '/config/menu.json?v=' + version;
                   // console.log("configDataUrl", configDataUrl);
                    var deferred = $q.defer();
                    //console.log("deferred");
                    $http.get(configDataUrl)
                        .success(function (menuDefList) {
                          //  console.log("menuDefList**",menuDefList);
                            var menusMetadata = extendWithDefaultMenuConfig(menuDefList);
                            menusMetadata = applyUserPermissions(menusMetadata, currentAppDefKey);
                            var menusStates = stateService.buildStates(menusMetadata, true);

                            var currentAppMenusMetadata = {
                                "menusMetadata": menusMetadata
                                //, "menusStates": menusStates
                            };
                            appDefinitionService.updateCurrentAppMetadata("menusConfig", currentAppMenusMetadata);
                            //appDefinitionService.updateCurrentAppMetadata("menusConfig", currentAppMenusMetadata);
                            /*deferred.resolve(function () {
                                appDefinitionService.updateCurrentAppMetadata("menusConfig", currentAppMenusMetadata);
                            });*/

                            if (angular.isFunction(callback)) {
                                callback(menusMetadata);
                            }
                            deferred.resolve(menusMetadata);
                            //TODO:store in session
                        });
                    return deferred.promise;
                }
                return deferred.promise;
            };

            this.updateCurrentMenuMetadata = function (propKey, propValue) {
                if (!propKey || !propValue) { return }

                var menuKey = self.getActiveMenuKey();

                var menusConfig = self.getCurrentAppMenuMetaData();
                if (!menusConfig && !menusConfig[menuKey]) {
                    return;
                }
                menusConfig[menuKey][propKey] = propValue;
                appDefinitionService.updateCurrentAppMetadata("menusConfig", menusConfig);
            }
        }]);

    return angularAMD;
});