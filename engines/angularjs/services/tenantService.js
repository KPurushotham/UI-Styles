define(['angularAMD', 'stateService', 'localPersistenceService', 'stateService','authService'], function (angularAMD) {
    'use strict';

    angularAMD.service('tenantService', ['$rootScope', '$http', '$q', '$state', '$filter', '$location',
        'localPersistenceService', 'stateService','authService',
        function ($rootScope, $http, $q, $state, $filter, $location, localPersistenceService, stateService, authService) {
            var self = this;
            this.hasSubTenants = function () {
                var secureAuthConfig = localPersistenceService.get("auth", true);
                return (secureAuthConfig && secureAuthConfig.hasSubTenants);
            };
            this.getCurrentTenantCode = function () {
                var tenantCode = localPersistenceService.get("tenantCode", true);
                if (!tenantCode) {
                    tenantCode = stateService.getCurrentTenantCodeFromUrl() ||
                        localPersistenceService.get("loginTenantCode", true);
                }
                console.log("getCurrentTenantCode=", tenantCode);
               
                return tenantCode;
            };
            this.getCurrentTenantId = function () {
                var tenantId = 0;
                console.log("tenantId=", localPersistenceService.get("tenantId", true), localPersistenceService.get("loginTenantId", true));
                console.log("tenantId=", localPersistenceService.get("tenantId", true) || localPersistenceService.get("loginTenantId", true));
                if (localPersistenceService.get("tenantId", true) !== null) {
                    tenantId = localPersistenceService.get("tenantId", true);
                } else {
                    tenantId = localPersistenceService.get("loginTenantId", true);
                }
                return tenantId;
            };
            this.setCurrentTenant = function (tenantCode) {
                var tenantConfig = self.getTenantDefinitionByCode(tenantCode);
                if (tenantConfig) {
                    localPersistenceService.set("tenantCode", tenantCode, true);
                    localPersistenceService.set("tenantId", tenantConfig["tenantId"], true);
                    var auth = localPersistenceService.get("auth", true);
                    if (auth) {
                        auth.tenantCode = tenantCode;
                        auth.tenantId = tenantConfig["tenantId"];
                        localPersistenceService.set("auth", auth, true);
                    }

                }
                else {
                    console.log("No Tenant found with tenantCode:", tenantCode);
                }
            };
            this.getTenantDefinitionByCode = function (tenantCode) {

                var secureAuthConfig = localPersistenceService.get("auth", true);
                var tenantConfig =null;
                if(secureAuthConfig){
                     tenantConfig = secureAuthConfig["config"];
                }

                var currentTenantConfig = tenantConfig ? tenantConfig[tenantCode] : null;
                console.log("Step 6 currentTenantConfig ", currentTenantConfig);
                return currentTenantConfig;
            };

            var extendWithDefaultTenantConfig = function (tenantConfig) {
                var defaultConfig = {};
                return tenantConfig;
            };
            this.getCurrentTenantDefinition = function () {
                var currentTenantCode = self.getCurrentTenantCode();
                console.log("Step 5 currentTenantCode ", currentTenantCode);
                return self.getTenantDefinitionByCode(currentTenantCode);
            };
            this.getTenants = function () {
                var defer = $q.defer();
                authService.getAccessibleTenantList().then(function (tenantConfig) {
                    defer.resolve(tenantConfig);
                });
                return defer.promise;
            };
            this.getSubTenantsFromRemote = function () {
                var defer = $q.defer();
                authService.getAccessibleTenantList(null,true).then(function (tenantConfig) {
                    defer.resolve(tenantConfig);
                });
                return defer.promise;
            };
            this.updateCurrentTenantConfig = function (propKey, propValue) {
                if (!propKey || !propValue) { return }

                var secureAuth = localPersistenceService.get("auth", true);
                if (!secureAuth) {
                    return;
                }
                var tenantConfig = secureAuth["config"];
                var currentTenantCode = self.getCurrentTenantCode();
                if (tenantConfig && tenantConfig[currentTenantCode]) {
                    tenantConfig[currentTenantCode][propKey] = propValue;
                    localPersistenceService.set("auth", secureAuth, true);
                }
            };
        }]);

    return angularAMD;
});