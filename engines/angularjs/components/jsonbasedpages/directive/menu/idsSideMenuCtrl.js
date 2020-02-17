define(['angularAMD'], function (angularAMD) {
    'use strict';

    angularAMD.controller('IdsSideMenuCtrl', sideMenuCtrl);

    function sideMenuCtrl($rootScope, $scope, $state, $location, idsSideMenuService,stateService) {
       
        $scope.menuPosition = idsSideMenuService.getMenuPosition();
 
        idsSideMenuService.getMenuItems().then(function(menuList){
            $scope.menuItems =menuList;
            var appCode = stateService.getCurrentAppCodeFromUrl();
             var menuCode = stateService.getDefaultAppMenuCodeFromUrl();
             var isTenantDashboardScreen = stateService.isTenantDashboardScreen();
            // console.log("menuList ",menuList,appCode, $location);
            // console.log("appCode-->menuCode ",appCode,menuCode);
             if(!menuCode && !isTenantDashboardScreen){
                $scope.defaultSidebarState = $scope.menuItems[0].stateRef;
                $state.go($scope.defaultSidebarState);
             }
      
        });
        console.log("$scope.menuItems ",$scope.menuItems );
        if ($scope.menuItems && $scope.menuItems.length > 0) {
            $scope.defaultSidebarState = $scope.menuItems[0].stateRef;
        }

        $scope.hoverItem = function ($event,item) {
           // alert("hovers In")
           console.log("item==>",item);
            if (item && item.subMenu && item.subMenu.length>0){
                item["showHoverElem"] = true;
                $scope.hoverElemHeight = $event.currentTarget.clientHeight;
                var menuTopValue = 66;
                $scope.hoverElemTop = $event.currentTarget.getBoundingClientRect().top - menuTopValue;
           } 

        };
        $scope.removeHoverItem = function ($event,item) {
            //alert("hover leave");
            $scope.showHoverElem = false;
            item["showHoverElem"] = false;
        }

        $scope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
            $rootScope.previousState = from.name;
            $rootScope.currentState = to.name;
            //console.log('**** menuList Previous state:'+$rootScope.previousState)
            //console.log('****  menuList Current state:'+$rootScope.currentState)
            if (idsSideMenuService.canSidebarBeHidden()) {
                idsSideMenuService.setMenuCollapsed(true);
            }
        });
    }
    return angularAMD;
});