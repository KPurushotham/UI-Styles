define(['angularAMD', 'idsSideMenuService', 'utilService', 'IdsSideMenuCtrl'], function (angularAMD) {
    'use strict';

    angularAMD.directive('idsSideMenu', idsSideMenu);

    function idsSideMenu($timeout, idsSideMenuService, utilService, layoutSizes) {
        var jqWindow = $(window);
        return {
            restrict: 'EA',
            scope: {
                dashboardScreen: '='
            },
            templateUrl: "engines/angularjs/components/jsonbasedpages/directive/menu/menuView.html",
            controller: 'IdsSideMenuCtrl',
            link: function (scope, el) {

                scope.menuHeight = el[0].childNodes[0].clientHeight - 84;
                //jqWindow.on('click', _onWindowClick);
                //jqWindow.on('resize', _onWindowResize);

                //scope.$on('$destroy', function () {
                //    jqWindow.off('click', _onWindowClick);
                //    jqWindow.off('resize', _onWindowResize);
                //});

                function _onWindowClick($evt) {
                    if (!utilService.isDescendant(el[0], $evt.target) &&
                        !$evt.originalEvent.$sidebarEventProcessed &&
                        !idsSideMenuService.isMenuCollapsed() 
                        // && idsSideMenuService.canSidebarBeHidden()
                        ) {
                        $evt.originalEvent.$sidebarEventProcessed = true;
                        $timeout(function () {
                            idsSideMenuService.setMenuCollapsed(true);
                        }, 10);
                    }
                }

                // watch window resize to change menu collapsed state if needed
                function _onWindowResize() {
                    var newMenuCollapsed = idsSideMenuService.shouldMenuBeCollapsed();
                    var newMenuHeight = _calculateMenuHeight();
                    if (newMenuCollapsed != idsSideMenuService.isMenuCollapsed() || scope.menuHeight != newMenuHeight) {
                        scope.$apply(function () {
                            scope.menuHeight = newMenuHeight;
                            idsSideMenuService.setMenuCollapsed(newMenuCollapsed)
                        });
                    }
                }

                function _calculateMenuHeight() {
                    return el[0].childNodes[0].clientHeight - 84;
                }
            }
        };
    }

    return angularAMD;
});