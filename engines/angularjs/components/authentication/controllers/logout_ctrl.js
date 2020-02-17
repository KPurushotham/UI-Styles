define(['app'], function () {
    'use strict';
    return ['$scope','$rootScope','$timeout','$location','overlay','httpService', function ($scope, $rootScope, $timeout, $location, overlay,httpService) {
        $scope.$on('$viewContentLoaded', function(event) { 
              overlay.hide();               
        });
        var isTenantSpecificLogin = localStorage.loginTenantId === "0" ? false : true;
        var tenantCode = localStorage.loginTenantCode;
        localStorage.clear();
        sessionStorage.clear();
        $location.path('auth/login');
    }];
});