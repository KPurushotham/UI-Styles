define(['app', 'stateService', 'httpService','authService','dateUtilService'], function () {
    'use strict';
    return ['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$location', '$http', '$httpParamSerializer', 'overlay', 'httpService',
        'stateService', 'localPersistenceService', 'tenantConstants', 'utilService', 'Notification','authService' ,
        function ($scope, $rootScope, $state, $stateParams, $timeout, $location, $http, $httpParamSerializer,
            overlay, httpService, stateService, localPersistenceService, tenantConstants, utilService, Notification, authService, dateUtilService) {
            $scope.$on('$viewContentLoaded', function (event) {
                //overlay.hide();
                overlay.showMessage();
            });
            var init = function () {
                $scope.save_submit = false;
                var auth = localPersistenceService.get('auth', true);

                self.tenantCode = tenantConstants.defaultTenantCode || "venhan";
                if ($stateParams && $stateParams["tenantCode"]) {
                    self.tenantCode = $stateParams["tenantCode"];
                }
                localPersistenceService.set('loginTenantCode', self.tenantCode, true);
                console.log("tenantCode:", self.tenantCode);
                $scope.loginModel = {
                    grant_type: "password",
                    username: "",
                    password: ""
                };

                if (auth && auth.access_token) {
                    navigateLandingPage(auth);
                }
            };         

            var navigateLandingPage = function (auth) {
                var landingPageState = auth.landingPageState;
                var stateParam;
                if (!landingPageState) {
                    landingPageState = auth.hasSubTenants ? "app.tenant-dashboard" : "app.app-dashboard";
                }
                //if (landingPageState.includes("tenant")) {
                //    stateParam = { "tenantCode": self.tenantCode };
                //}
                //else {
                //    stateParam = { "tenantId": auth.tenantId };
                //}
                stateParam = { "tenantCode": self.tenantCode };
                stateService.navigateToState(landingPageState, stateParam);

                //  $location.path(landingPage);
            };

            $scope.loginSubmit = function (loginfrm) {

                //var pre = document.createElement('pre');
                //$(pre).html($('#acknowledgement').html());
                //alertify.set({ buttonReverse: true, labels: { ok: "Accept", cancel: "Decline" } });
                //alertify.confirm($(pre).html(), function (confirmFlag) {
                //    if (confirmFlag) {
                        if (loginfrm.$valid && $scope.loginModel.username !== '' && $scope.loginModel.password !== '') {
                            overlay.load();
                            $scope.save_submit = true;
                            $scope.loginInProgress = true;
                            $scope.loginButtonText = 'Processing...';
                            var authProvider = "webportal";
                            localPersistenceService.set('X-AuthProvider', authProvider, true);

                       //   httpService.loginPost('http://172.16.41.165:8180/oauth/token', $scope.loginModel).then(function (results) {
                        // httpService.loginPost('http://172.16.41.162:8180/oauth/token', $scope.loginModel).then(function (results) {
                          httpService.loginPost('oauth/token', $scope.loginModel).then(function (results) {
                                overlay.hide();
                                $scope.loginInProgress = false;
                                $scope.loginButtonText = 'Login';
                                console.log("results=", results);
                                if (results === undefined) {
                                    Notification.error({ message: 'Bad Credentials', delay: 30000 });
                                    return;
                                }
                                console.log("(after login results.data=", results.data);
                                var loginResult = angular.fromJson(results.data);
                                // var authProvider = "webportal";
                                if (loginResult) {
                                    loginResult.config = {};
                                    loginResult.config[self.tenantCode] = loginResult["loginTenantExtraInfo"];
                                    loginResult.config[self.tenantCode]["tenantId"] = loginResult["loginTenantId"];

                                    localPersistenceService.set("loginTenantId", loginResult["loginTenantId"], true);
                                    localPersistenceService.set('auth', loginResult, true);
                                    var logTime = moment().format(self.DATE_TIME_FORMAT); //dateUtilService.getCurrentDateTime();
                                    // UTC 
                                    //var logTime = moment.utc(t).format(self.DATE_TIME_FORMAT)
                                    localPersistenceService.set('loginTime', logTime, true);
                                    $scope.initTime = localPersistenceService.set('expiresIn', loginResult.expires_in, true);
                                    overlay.load();
                                    authService.getAccessibleTenantList($scope.loginModel.username, true).then(function (result) {
                                        navigateLandingPage(localPersistenceService.get("auth", true));
                                        overlay.hide();
                                    });
                                }
                            }, function (errorResponse) {
                                if (errorResponse.data.error !== "") {
                                    Notification.error({ message: 'Bad Credentials : ' + errorResponse.data.error, delay: 3000 });
                                }
                                console.log(errorResponse);
                                $scope.loginInProgress = false;
                                $scope.loginButtonText = 'Login';
                            });
                        }
                   /* }
                    else {
                        Notification.error({ message: 'User Declined', delay: 3000 });
                    }
                });*/
                return;
            };

            init();
        }];
});
