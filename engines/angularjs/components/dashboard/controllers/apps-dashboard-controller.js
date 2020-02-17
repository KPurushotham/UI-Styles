define(['app','appDefinitionService'], function () {
    'use strict';
    return ['$scope', '$rootScope', '$timeout', 'overlay', '$http', 'appDefinitionService',
        '$state','localPersistenceService', 'stateService','tenantService','$stateParams', function ($scope, $rootScope, $timeout,
            overlay, $http, appDefinitionService, $state, localPersistenceService, stateService, tenantService,$stateParams) {
        $scope.message = 'Welcome to Home Page';
        $scope.appListProgress_activated =false;

            $scope.navigateToAppMenu = function (appKey) {
                console.log("111 appKey=", appKey);
                var tenantCode = tenantService.getCurrentTenantCode();
                var tenantId = tenantService.getCurrentTenantId();
                var accessToken = localPersistenceService.get('auth', true);
                var token = accessToken.access_token;
                var userName = accessToken.userName;
                var userInfoMap = {
                    "CTC": tenantCode,
                    "CTI": tenantId,
                    "AT": token,
                    "UN":userName
                };

                var appConfigData = appDefinitionService.getAppMetadataByAppKey(appKey);

                if (appConfigData.urlMap) {

                    var url = appConfigData.urlMap.urlTemplate;
                    var paramMap = appConfigData.urlMap.params;

                    angular.forEach(paramMap, function (pvalue, pkey) {
                        if (userInfoMap[pvalue] !== undefined) {
                            url = url.replace("{{" + pkey + "}}", userInfoMap[pvalue]);
                        }
                    });

                    console.log("url: ", url);
                    window.open(url);
                }
                else {
                    stateService.navigateToState(appKey, { tenantCode: tenantCode });
                }
                
            };

        $scope.$on('$viewContentLoaded', function(event) { 
            console.log("stateParams=", $stateParams);
            var tenantId = "";
            if ($stateParams.tenantId === "") {
                tenantId = localPersistenceService.get("loginTenantCode", true);
            } else {
                tenantId = $stateParams.tenantId;
            }
            tenantService.setCurrentTenant(tenantId);
            //tenantService.setCurrentTenant($stateParams.tenantId);
        	$timeout(function(event){
              overlay.hide();  
               //alert("2"); 
                if (event) {
                    event.preventDefault();
                }
            
              return;
        	}, 10);

            $rootScope.activeAppKey = "Dashboard";

            var metadata = appDefinitionService.loadAppsMetadata().then(function (appsMetadata) {
                console.log("app loaded",appsMetadata);
                $scope.appDefList = Object.values(appsMetadata);
                $scope.tenantCode = tenantService.getCurrentTenantCode();
                $scope.appListProgress_activated =true;
                 //alert("3"); 
            });
            

           $scope.hoverIn = function () {
                this.hoverEdit = true;
                //alert("4"); 
            };

            $scope.hoverOut = function () {
                this.hoverEdit = false;
               // alert("5"); 
            };

            $scope.appdashboardView = function (viewType) {
                //alert("6"); 
                if (viewType === "grid") {
                    $(".app-dashboard-grid").show();
                    $(".app-dashboard-list").hide();
                    angular.element(".dashboard-grid-icon").addClass("dashboard-icons-selected");
                    angular.element(".dashboard-list-icon").removeClass("dashboard-icons-selected");
                    //$(".dashboard-grid-icon").addClass("dashboard-icons-selected");
                    //$(".dashboard-list-icon").removeClass("dashboard-icons-selected");
                } else {
                    $(".app-dashboard-grid").hide();
                    $(".app-dashboard-list").show();
                    angular.element(".dashboard-grid-icon").removeClass("dashboard-icons-selected");
                    angular.element(".dashboard-list-icon").addClass("dashboard-icons-selected");
                    //$(".dashboard-grid-icon").removeClass("dashboard-icons-selected");
                    //$(".dashboard-list-icon").addClass("dashboard-icons-selected");
                }

            };

            $scope.dashboardSearchbar = function () {
               // alert("6"); 
                angular.element(".search-design").toggle();
                //$(".search-design").toggle();
            };
            
          
        }); 

   
    }];
});
