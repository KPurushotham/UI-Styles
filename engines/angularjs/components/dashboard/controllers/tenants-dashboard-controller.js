define(['app', 'tenantService','stateService'], function () {
    'use strict';
    return ['$scope', '$rootScope', '$timeout', 'overlay', '$http', 'tenantService', 'stateService',
        function ($scope, $rootScope, $timeout,overlay, $http, tenantService, stateService) {
        $scope.message = 'Welcome to Home Page';

        $scope.$on('$viewContentLoaded', function (event) {
            $timeout(function () {
                overlay.hide();
            }, 10);
            $scope.searchTenant="";
            $rootScope.activeAppKey = "Dashboard";
            $scope.navigateToAppsDashboad = function (tenant) {
                console.log("tenantKey, tenant=", tenant);
                $rootScope.showAppToolBar=true;
               // $rootScope.UserSettingCss = "al-user-profile" ;
                tenantService.setCurrentTenant(tenant.tenantCode);
                stateService.navigateToAppsDashboad(tenant.tenantCode,tenant.tenantId);
            };
            var metadata = tenantService.getTenants().then(function (tenants) {
                $scope.tenantList = Object.values(tenants);
                console.log("tenantList=",tenants);
                console.log("tenantList=", Object.values(tenants));
            });

            $scope.hoverIn = function () {
                this.hoverEdit = true;
            };

            $scope.hoverOut = function () {
                this.hoverEdit = false;
            };
            
            

            $scope.tenantdashboardView = function (viewType) {
                if (viewType === "grid") {
                    //$scope.showTenantGrid = true;
                    //$scope.hideTenantList = false;
                    $(".tenant-dashboard-gird").show();
                    $(".tenant-dashboard-list").hide();
                    angular.element(".dashboard-grid-icon").addClass("dashboard-icons-selected");
                    angular.element(".dashboard-list-icon").removeClass("dashboard-icons-selected");
                    //$(".dashboard-grid-icon").addClass("dashboard-icons-selected");
                    //$(".dashboard-list-icon").removeClass("dashboard-icons-selected");

                } else {
                    //$scope.showtenantgrid = false;
                    //$scope.hidetenantlist = true;
                    $(".tenant-dashboard-gird").hide();
                    $(".tenant-dashboard-list").show();
                    angular.element(".dashboard-grid-icon").removeClass("dashboard-icons-selected");
                    angular.element(".dashboard-list-icon").addClass("dashboard-icons-selected");
                    //$(".dashboard-grid-icon").removeClass("dashboard-icons-selected");
                    //$(".dashboard-list-icon").addClass("dashboard-icons-selected");
                }

            };

            $scope.dashboardSearchbar = function () {
                angular.element(".search-design").toggle();
                //$(".search-design").toggle();
            };



        });


    }];
});
