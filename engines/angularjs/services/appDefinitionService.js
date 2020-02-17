define(['angularAMD', 'stateService', 'localPersistenceService', 'tenantService', 'authService', 'httpService'], function (angularAMD) {
    'use strict';

    angularAMD.service('appDefinitionService', ['$rootScope', '$http', '$q', '$state', '$filter', 'httpService',
        'localPersistenceService', 'appDefaultConfig', 'stateService', 'tenantService', 'authService', "_",
        function ($rootScope, $http, $q, $state, $filter, httpService, localPersistenceService, appDefaultConfig,
            stateService, tenantService, authService, _) {
            var self = this;

            var applyUserPermissions = function (appsMetadataList) {
                var defer = $q.defer();
                var tenantId = tenantService.getCurrentTenantId();
                console.log("tenantId getAccessibleAppList=", tenantId);
                authService.getAccessibleAppList(tenantId).then(function (accessibleAppKeys) {
                    for (var appKey in appsMetadataList) {
                        if (!accessibleAppKeys || accessibleAppKeys.indexOf(appKey) === -1) {
                            delete appsMetadataList[appKey];
                        }
                    }
                    defer.resolve(appsMetadataList);
                });
               

                return defer.promise;
            };
            var extendWithDefaultAppConfig = function (tenantAppsMetadata) {
                var count = tenantAppsMetadata.length;
                var defaultConfig = appDefaultConfig["default"];
                var resultMetadata = {};
                for (var i = 0; i < count; i++) {
                    var appMetadata = tenantAppsMetadata[i];
                    var appKey = appMetadata["key"] || appMetadata["stateName"];
                    var pattern = appMetadata["pattern"] || "default";
                    console.log("RD-pattern-->",appKey,pattern);
                    console.log("RD-appMetadata--",appMetadata);
                    if(pattern === "dashboard"){
                        defaultConfig =appDefaultConfig["dashboard"];
                    }else{
                        defaultConfig =appDefaultConfig["default"];                        
                    }
                    resultMetadata[appKey] = angular.extend({}, defaultConfig, appMetadata);
                }
                console.log("RD-resultMetadata=",resultMetadata);
                return resultMetadata;
            };
            this.getAllAppsMetadata = function () {
                var tenantConfig = tenantService.getCurrentTenantDefinition();

                if (tenantConfig) {
                    return tenantConfig["appsMetadata"];
                }
            };
            this.loadAppsMetadata = function () {
                var defer = $q.defer();
                //// call app service
                //debugger;
                //console.log("url in app Def", url);
                //httpService.get(url).then(function (results) {
                ////$http.get(url).then(function (results) {
                //    console.log("results in app Def", results);

                // });

                var tenantConfig = tenantService.getCurrentTenantDefinition();
                console.log("tenantConfig=", tenantConfig);
                if (tenantConfig && tenantConfig["appsMetadata"] && tenantConfig["appsMetadata"].length > 0) {
                    stateService.buildStates(tenantConfig["appsMetadata"], true, true);
                    defer.resolve(tenantConfig["appsMetadata"]);
                }
                else {

                    var configDataUrl = 'apps/app-config.json?v=' + version;
                    console.log("appDefUrl", configDataUrl);
                    $http.get(configDataUrl)
                        .success(function (configData) {
                            var appsMetadata = extendWithDefaultAppConfig(configData);
                            applyUserPermissions(appsMetadata).then(function (appsMetadata) {
                                console.log("appsMetadata***", appsMetadata);
                                var appsStates = stateService.buildStates(appsMetadata, true, true);

                                tenantService.updateCurrentTenantConfig("appsMetadata", appsMetadata);

                                defer.resolve(appsMetadata);
                            });
                        });
                }

                return defer.promise;
            };

            this.getCurrentAppDefKey = function () {
                return stateService.getCurrentAppDefKey();
            };

            this.getAppMetadataByAppKey = function (appKey) {

                var tenantConfig = tenantService.getCurrentTenantDefinition();
                $rootScope.showAppToolBar = true;
                console.log("getCurrentAppMetadata", tenantConfig);
                if (tenantConfig && tenantConfig["appsMetadata"]) {
                    return tenantConfig["appsMetadata"][appKey];
                }
                return null;
            };

            this.getCurrentAppMetadata = function () {
                console.log("Step 4 getCurrentAppMetadata ");
                var tenantConfig = tenantService.getCurrentTenantDefinition();
                console.log("Step 4 getCurrentAppMetadata tenantConfig ", tenantConfig);
                $rootScope.showAppToolBar = true;
                console.log("getCurrentAppMetadata", tenantConfig);
                if (tenantConfig && tenantConfig["appsMetadata"]) {
                    var currentAppDefKey = self.getCurrentAppDefKey();
                    return tenantConfig["appsMetadata"][currentAppDefKey];
                }
                return null;
            };

            this.updateCurrentAppMetadata = function (propKey, propValue) {
                if (!propKey || !propValue) { return }

                var tenantConfig = tenantService.getCurrentTenantDefinition();
                if (!tenantConfig) {
                    return;
                }
                var tenantAppsMetadata = tenantConfig["appsMetadata"];
                var currentAppKey = self.getCurrentAppDefKey();
                if (tenantAppsMetadata && tenantAppsMetadata[currentAppKey]) {
                    tenantAppsMetadata[currentAppKey][propKey] = propValue;
                    tenantService.updateCurrentTenantConfig("appsMetadata", tenantAppsMetadata);
                }
            };

            this.getCurrentApplicationId = function (allAppKeys, currentAppKey) {
                var applicationId = alasql("SELECT DISTINCT applicationEntityId FROM ? WHERE appKey=? ", [allAppKeys, currentAppKey]);
                console.log("ApplicationEntityId=", applicationId);
                return applicationId;
            };

        }]);

    return angularAMD;
});