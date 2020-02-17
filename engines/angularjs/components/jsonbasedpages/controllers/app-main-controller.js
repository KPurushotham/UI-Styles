define(['app','appDefinitionService', 'menuDefinitionService', 'stateService'], function () {
    'use strict';
  return ['$scope', '$rootScope', 'overlay', '$state', '$timeout', '$http', 'appDefinitionService', 'menuDefinitionService', 'stateService', 
        function ($scope, $rootScope, overlay, $state, $timeout, $http, appDefinitionService, menuDefinitionService, stateService) {
            stateService.persistCurrentAppKey();

            var activeAppKey = stateService.getCurrentAppDefKey();
            $rootScope.activeAppKey = activeAppKey;

            console.log("activeAppKey:", activeAppKey);
            console.log("getCurrentAppData:", appDefinitionService.getCurrentAppMetadata());

            menuDefinitionService.loadMenusMetadata(function (menusMetadata) {
                $scope.menuDefMap = menusMetadata;
            });

           
            $scope.$on('$viewContentLoaded', function (event) {
                //overlay.hide();  
                $timeout(function () {
                    //overlay.hide();   
                }, 6000);
            });
            //Navigate to Notification Screen
            $scope.navigateTo = function (screenName) {
                console.log("screenName=",screenName);
                //$rootScope.thingstodomenu = screenName;
                $state.go("app.thingstodo." + screenName);
            }
          //  $rootScope.racingunauthorizedurl = "app/unauthorized";

        }];
});
