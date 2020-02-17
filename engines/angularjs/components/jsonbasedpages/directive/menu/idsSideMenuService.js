define(['angularAMD', 'menuDefinitionService', 'appDefinitionService', 'stateService'], function (angularAMD) {
    'use strict';

    angularAMD.service('idsSideMenuService', ['$rootScope', 'layoutSizes', '$filter', 'menuDefinitionService', 'appDefinitionService',
        'stateService','$q',    
        function ($rootScope, layoutSizes, $filter, menuDefinitionService, appDefinitionService, stateService,$q) {

            var staticMenuItems = [];

            this.addStaticItem = function () {
                staticMenuItems.push.apply(staticMenuItems, arguments);
            };

            this.onAppChange = function (loc) {
                alert(loc);
            };
            var isMenuCollapsed = shouldMenuBeCollapsed();

            this.getMenuItems = function () {
                var defer = $q.defer();
                console.log("Step 1 getMenuItems ");
                defineMenuItemStates().then(function(states){
                console.log("getMenuItems states", states);
                var menuItems = states.filter(function (item) {
                    return item.level == 0;
                });

                menuItems.forEach(function (item) {
                    var children = states.filter(function (child) {
                        return child.level == 1 && child.name.indexOf(item.name) === 0;
                    });
                    item.subMenu = children.length ? children : null;
                });
                var menuItemsList =menuItems.concat(staticMenuItems);
                defer.resolve(menuItemsList);
            });
                return defer.promise;
            };

            this.shouldMenuBeCollapsed = shouldMenuBeCollapsed;
            this.canSidebarBeHidden = canSidebarBeHidden;

            this.setMenuCollapsed = function (isCollapsed) {
                isMenuCollapsed = isCollapsed;
                console.log("isCollapsed", isCollapsed);
            };

            this.getMenuPosition = function () {
                var currentAppMetadata = appDefinitionService.getCurrentAppMetadata();
                var menuPosition = 'T';
                if (currentAppMetadata) {
                    menuPosition = currentAppMetadata["menuPosition"];
                }
                return menuPosition;
            };

            this.isMenuCollapsed = function () {
                return isMenuCollapsed;
            };

            this.toggleMenuCollapsed = function () {
                isMenuCollapsed = !isMenuCollapsed;
            };

            this.getAllStateRefsRecursive = function (item) {
                var result = [];
                _iterateSubItems(item);
                return result;

                function _iterateSubItems(currentItem) {
                    currentItem.subMenu && currentItem.subMenu.forEach(function (subItem) {
                        subItem.stateRef && result.push(subItem.stateRef);
                        _iterateSubItems(subItem);
                    });
                }
            };

            function defineMenuItemStates() {
                console.log("defineMenuItemStates")
                var menusMetadata = null;
                var deferred = $q.defer();
                console.log("Step 2 defineMenuItemStates ");
                menuDefinitionService.getCurrentAppMenuMetaData().then(function (menuMetadata) {
                    menusMetadata = menuMetadata["menusMetadata"];

                    console.log("defineMenuItemStates=", menusMetadata);
                    if (!menusMetadata) {
                        return [];
                    }
                    var menuList = [];
                    var index = 0;
                    angular.forEach(menusMetadata, function (metadata, key) {

                        if (angular.isUndefined(metadata["showInMenu"])) {
                            metadata["showInMenu"] = true;
                        }
                        var stateKey = stateService.getStateKeyFromMenuKey(metadata.key);
                        var menuItem = {
                            name: metadata.key,
                            title: metadata.title,
                            icon: metadata.icon,
                            showInMenu: metadata.showInMenu
                        };
                        index++;
                        menuItem["level"] = (metadata.key.match(/\./g) || []).length - 1;
                        menuItem["order"] = metadata.order || index;
                        menuItem["stateRef"] = stateKey;

                        menuList.push(menuItem);
                    });
                 
                    var menus = menuList
                        .sort(function (a, b) {
                            return (a.level - b.level) * 100 + a.order - b.order;
                        });
                        deferred.resolve(menus);
                });
                return deferred.promise;
            }

            function shouldMenuBeCollapsed() {
                return window.innerWidth <= layoutSizes.resWidthCollapseSidebar;
            }

            function canSidebarBeHidden() {
                return window.innerWidth <= layoutSizes.resWidthHideSidebar;
            }
        }
    ]);

    return angularAMD;
});
