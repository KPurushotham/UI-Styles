define(['app', 'appDefinitionService'], function () {
    'use strict';
    return ['$scope', '$rootScope', '$timeout', 'overlay', '$http', 'appDefinitionService',
        '$state', 'stateService', 'tenantService', 'localPersistenceService', 'authService', 'httpService','$stateParams',function ($scope, $rootScope, $timeout,
            overlay, $http, appDefinitionService, $state, stateService, tenantService, localPersistenceService, authService, httpService, $stateParams  ) {
            $scope.message = 'Welcome to Home Page';
            var self = this;
            $scope.reportListProgress_activated = false;

            $scope.navigateToReportMenu = function (rpt) {
                console.log("report:-", rpt);
                var tenantCode = tenantService.getCurrentTenantCode();
                console.log("report:-", tenantCode, rpt);
                stateService.navigateToState("app.report", {tenantCode: tenantCode, reportCode: rpt["reportCode"]
                });
            };

            $scope.$on('$viewContentLoaded', function (event) {
                var currentAppKey;
                console.log("stateParams=",$stateParams);
                $scope.tenantCode = $stateParams.tenantCode;

                $timeout(function () {
                    overlay.hide();
                }, 10);

                var auth = localPersistenceService.get("auth", true);
                var allAppKeys = auth.apps;
                auth["tenantCode"] = $scope.tenantCode;
                auth["tenantId"] = auth["config"][$scope.tenantCode].tenantId;

                if ($scope.tenantCode === "gap" || $scope.tenantCode === "gwg") {
                    $rootScope.activeAppKey = "gappreports";
                    currentAppKey = "gappreports";
                    localPersistenceService.set("activeAppDefKey", currentAppKey, true);
                }
                else {
                    $rootScope.activeAppKey = "Reports";
                    currentAppKey = "reports";
                    localPersistenceService.set("activeAppDefKey", currentAppKey, true);
                }

                var currentAppId = appDefinitionService.getCurrentApplicationId(allAppKeys, currentAppKey);
                localPersistenceService.set("currentAppId", currentAppId[0].applicationEntityId, true);
                var url = 'vdi/reports/metadata/report/get/one?applicationId=' + currentAppId[0].applicationEntityId;
                httpService.get(url).then(function (results) {
                    console.log("result=",results);
                    if (results && results['data']) {
                        var reportList = results['data']["dataset"];
                        reportList = $scope.buildReportListWithIconsPath(reportList);
                        $scope.reportListProgress_activated = true;
                        var tenantId = tenantService.getCurrentTenantId();
                        var accessibleReports = authService.getAccessibleMenuList(tenantId, currentAppKey);
                        reportList = _.filter(reportList, function (item) {
                            return accessibleReports.indexOf(item.reportCode) > -1;
                        });
                        $scope.reportList = reportList;
                       console.log(" result reportList=", $scope.reportList );
                    }
                });

                $scope.hoverIn = function () {
                    this.hoverEdit = true;
                };

                $scope.hoverOut = function () {
                    this.hoverEdit = false;
                };

                $scope.buildReportListWithIconsPath = function (reportList) {

                    reportList = angular.forEach(reportList, function (report) {
                        report["logo"] = "images/reporticons/" + report.reportCode + ".png";
                        return report;
                    });
                    return reportList;
                };

                $scope.reportsdashboardView = function (viewType) {
                    if (viewType === "grid") {
                        $(".report-dashboard-grid").show();
                        $(".report-dashboard-list").hide();
                        angular.element(".dashboard-grid-icon").addClass("dashboard-icons-selected");
                        angular.element(".dashboard-list-icon").removeClass("dashboard-icons-selected");
                        //$(".dashboard-grid-icon").addClass("dashboard-icons-selected");
                        //$(".dashboard-list-icon").removeClass("dashboard-icons-selected");
                    } else {
                        $(".report-dashboard-grid").hide();
                        $(".report-dashboard-list").show();
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
