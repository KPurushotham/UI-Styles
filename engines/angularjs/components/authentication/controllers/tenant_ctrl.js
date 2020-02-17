define(['app', 'stateService'], function () {
    'use strict';
    return ['$scope', '$rootScope', '$timeout', '$location', 'overlay', 'httpService', 'stateService',
        function ($scope, $rootScope, $timeout, $location, overlay, httpService, stateService) {
        $scope.$on('$viewContentLoaded', function(event) { 
              overlay.hide();               
		}); 
        localStorage.setItem("tenantCode", "pgsi");
        localStorage.setItem("tenantId", "tsg");
        console.log($scope);
		//check Storage exists and redirect to home
		if(localStorage.getItem("accesstoken")!=undefined) {
			//window.location.href = "app/home";
		}
	
    }];
});
