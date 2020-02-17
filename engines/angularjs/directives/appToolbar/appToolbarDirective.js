define(['angularAMD', 'appDefinitionService', 'stateService', 'tenantService','localPersistenceService','httpService'], function (angularAMD) {
    'use strict';

    angularAMD.directive('appToolbar', function (stateService, tenantService, localPersistenceService,httpService) {
        return {
            controller: function ($scope, $http, $rootScope, $filter, appDefinitionService, localPersistenceService,httpService) {
                $scope.navigateToAppsDashboad = function (tenantKey, tenant) {
                    tenantService.setCurrentTenant(tenantKey);
                    stateService.navigateToAppsDashboad(tenantKey);
                };
                $scope.navigateToAppMenu = function (appKey) {
                    var tenantCode = tenantService.getCurrentTenantCode();
                    stateService.navigateToState(appKey, { tenantCode: tenantCode });
                };

                tenantService.getTenants().then(function (tenants) {
                    $scope.hasSubTenants = tenantService.hasSubTenants();

                    $scope.tenantList = tenants;
                    var currentTenantConfig = tenantService.getCurrentTenantDefinition();
                    if (currentTenantConfig) {
                        $scope.activeTenantName = currentTenantConfig["title"];
                        $scope.activeTenantCode = currentTenantConfig["tenantCode"];
                        $scope.appDefList = currentTenantConfig["appsMetadata"];
                        if ($scope.appDefList) {
                            var currentAppMetadata = appDefinitionService.getCurrentAppMetadata();
                            if (currentAppMetadata) {
                                $scope.activeAppName = currentAppMetadata["title"];
                                $scope.activeAppKey = currentAppMetadata["key"];
                            //    $scope.appDropDown = false;
                              //  $rootScope
                            }
                        }
                    }
                    else {
                    //    var appDropDownValue = true;
                       // self.toDisableAppToolBar(appDropDownValue);
                      
                        var auth = localPersistenceService.get('auth', true);
                        var tenantId = auth.tenantId;
                        var tenantName;
                        var url = "vdi/platform/tenant/getone?tenantId=" +tenantId;
                        httpService.get(url).then(function (results) {
                            var dataset = results.data.dataset || [];
                            tenantName = dataset[0].title;
                            $scope.activeTenantName = localStorage.PartnerName;
                            $scope.activeTenantName = tenantName;
                        });
                        
                      
                      //  $scope.activeTenantName = auth.loginTenantExtraInfo['title'] || auth.tenantCode;
                        console.log("localPersistenceService MailDay", localPersistenceService);
                   // TODO: Should Set Active Tenant Name 
                        //    $scope.activeAppName = "MailDay";
                        $scope.activeAppName = localPersistenceService.get("activeAppDefKey", true);
                    }
                });

            /*     $scope.toDisableAppToolBar = function (appDropDownValue) {
                    $scope.appDropDown = appDropDown;
                } */
                    



                $scope.isDashboardScreen = stateService.isDashboardScreen();
            },
            templateUrl: 'engines/angularjs/directives/appToolbar/app_toolbar.html',
            restrict: 'E',
            scope: {
                showTenantPortion: '=',
                showAppPortion: "="
            }
        };

    });

    return angularAMD;

});

