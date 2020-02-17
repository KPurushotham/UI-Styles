define(['angularAMD', 'dateUtilService', 'httpService', 'stateService'], function (angularAMD) {
    'use strict';

    angularAMD.service('authService', function ($rootScope, $parse, $q, $http, $httpParamSerializer, $location, $urlRouter, constants, Notification,
        overlay, localPersistenceService, httpService, stateService, _) {
        var self = this;


        this.validateAccessToken = function () {
            var defer = $q.defer();

            var auth = localPersistenceService.get('auth', true);
            var accesstoken = auth && auth.access_token;

            var urlQuery = $location.search();
            var tokenFromUrl = urlQuery["tokenid"];

           // console.log("location=", accesstoken, $location);
            if (tokenFromUrl != null) {
                localPersistenceService.set('fromFramework', true);
                accesstoken = tokenFromUrl;
                var loginTenantCode = urlQuery["ltc"];
                var tenantid = urlQuery["tid"];
                var username = urlQuery["username"];
                var appKey = urlQuery["appkey"] || stateService.getCurrentAppCodeFromUrl();;
                console.log("auth accesstoken=");

                localPersistenceService.set('loginTenantCode', loginTenantCode, true);
                localPersistenceService.set('tenantCode', loginTenantCode, true);
                localPersistenceService.set('tenantId', tenantid, true);

                localPersistenceService.set('activeAppDefKey', appKey, true);
                
                auth = {};
                auth.userName = username;
                auth.access_token = accesstoken;
                auth.tenantId = tenantid;
                auth.loginTenantCode = loginTenantCode;
                auth.tenantCode = loginTenantCode;
                auth.config = {
                    tenantCode: loginTenantCode
                };

                localPersistenceService.set('auth', auth, true);

                $rootScope.showAppToolBar = true;
                console.log("currentAppKey=", appKey);
               
                console.log("auth=", auth);

                // if (!appKey && $location.path().indexOf("mailday") > 0) {
                //     localPersistenceService.set("activeAppDefKey", "mailday");
                // }
                // if (!appKey && $location.path().indexOf("reports") > 0) {
                //     localPersistenceService.set("activeAppDefKey", "reports");
                // }
                // if (!appKey && $location.path().indexOf("slotsentry") > 0) {
                //     localPersistenceService.set("activeAppDefKey", "slotsentry");
                // }
            }
            if(auth && accesstoken){
                $rootScope.showAppToolBar = true;
                defer.resolve(true);
            }
            else{
                defer.resolve(false);
            }
            
            return defer.promise;
        }

        this.getAccessibleTenantList = function (userName, remote) {
            var accessibleTenantKeys;
            var defer = $q.defer();

            var auth = localPersistenceService.get("auth", true);
            //   console.log("auth in login =" + auth);
            if (!remote && (auth && auth.config && Object.keys(auth.config).length > 0)) {
                defer.resolve(auth.config);
            }
            else {
                var url = 'vdi/platform/tenant/user/subtenants?userName=' + (userName || self.getCurrentUserName());
                httpService.get(url).then(function (results) {
                    if (results && results['data']) {
                        var subtenants = results['data']["dataset"];
                        if (subtenants && subtenants.length > 0) {
                            auth.config = _.indexBy(subtenants, 'tenantCode');
                            auth.hasSubTenants = true;
                        }
                    }
                    localPersistenceService.set("auth", auth, true);
                    defer.resolve(auth.config);
                });
            }
            return defer.promise;
        };

        this.getAccessibleAppList = function (tenantId) {
            var accessibleAppKeys;
            var defer = $q.defer();

            var auth = localPersistenceService.get("auth", true);
            //   console.log("auth in login =" + auth);
            if (auth && auth.apps && auth.apps.length > 0 && angular.isDefined(tenantId)) {
                var query = "SELECT DISTINCT appKey from ? apps where tenantId=" + tenantId;
                console.log("query in login =" + query);
                var apps = auth.apps;
                accessibleAppKeys = _.map(alasql(query, [apps]), function (item) { return item.appKey; });
                console.log("accessibleAppKeys in login =" + accessibleAppKeys);
                defer.resolve(accessibleAppKeys);
            }
            else {
                var url = 'vdi/platform/tenant/user/apps?userName=' + self.getCurrentUserName();
                httpService.get(url).then(function (results) {
                    console.log("results in app Def", results);
                    var apps = results['data']["dataset"];
                    var query = "SELECT DISTINCT appKey from ? apps where tenantId=" + tenantId;
                    console.log("query in login =" + query);
                    accessibleAppKeys = _.map(alasql(query, [apps]), function (item) { return item.appKey; });
                    console.log("accessibleAppKeys=", accessibleAppKeys);
                    auth.apps = apps;
                    localPersistenceService.set("auth", auth, true);
                    defer.resolve(accessibleAppKeys);
                });
            }
            return defer.promise;
        };
        
        this.getTenantId = function () {
            var appTenantId;
            var auth = localPersistenceService.get("auth", true);

            var tenantId = auth["tenantId"];

            return appTenantId;
        };

        this.getCurrentUserName = function () {
            var auth = localPersistenceService.get("auth", true);
            return auth["userName"];
        };

        this.getAccessibleMenuList = function (tenantId, appKey) {
            var accessibleMenuKeys;
            console.log("Step 10 getAccessibleMenuList ");
            var auth = localPersistenceService.get("auth", true);
            console.log("auth in login =" + auth);
            if (auth && auth.apps && auth.apps.length > 0 && tenantId !== undefined && appKey) {
                var query = "SELECT DISTINCT menuKey from ? apps where tenantId=" + tenantId + " AND appKey='" + appKey + "'";
                var apps = auth.apps;
                accessibleMenuKeys = _.map(alasql(query, [apps]), function (item) { return item.menuKey; });
            }
            console.log("Step 10 getAccessibleMenuList accessibleMenuKeys ", accessibleMenuKeys);
            return accessibleMenuKeys;
        };
    });


    return angularAMD;
});