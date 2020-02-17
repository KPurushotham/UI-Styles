define(['angularAMD', 'stateService' ], function (angularAMD) {
    'use strict';

    angularAMD.directive('pageTop',  function () {
        return {
            controller: function ($scope,$rootScope, stateService, localPersistenceService) {
               // $scope.showAppToolBar=true;
                $scope.navigateToTenantsDashboad =function(){
                var currentTenantConfig = localPersistenceService.get('fromFramework', true);
                if (currentTenantConfig=="true") {
                    console.log("fromFramework ");
                    
                    }
                    
                else{
                    $rootScope.showAppToolBar=false;
                    stateService.navigateToTenantsDashboad();
                }
            }
             
             //   var auth = localPersistenceService.auth;
                var auth =  localPersistenceService.get('auth', true);
               // var token = JSON.parse(auth);
                $scope.userName = auth.userName;
                console.log("config=",config);
                $scope.env=config.api_url.env;
                console.log("auth in page top service = ", auth);
                $scope.onThemeChange = function (color) {
                    document.documentElement.style.setProperty('--bg-color', color);
                    
                    /*switch (color) {
                        case "28, 43, 54":
                            document.documentElement.style.setProperty('--bg-color-black', color);
                            break;
                        case "42, 112, 203":
                            document.documentElement.style.setProperty('--bg-color-blue', color);
                            break;
                        case "45, 181, 176":
                            document.documentElement.style.setProperty('--bg-color-green', color);
                            break;
                        default:
                            document.documentElement.style.setProperty('--bg-color', color);
                           break;
                    } */                 
                }
                /*

                    :root {
                    //#f0f0f0 in decimal RGB 
                    --color: 240, 240, 240;
                    }

                    body {
                    color: #000;
                    background-color: #000;
                    }

                    #element {
                    background-color: rgba(var(--color), 0.5);
                    }
                */
            },
            templateUrl: 'engines/angularjs/directives/pageTop/page_top.html',
            restrict: 'E'
          
        };
    });

    return angularAMD;
});