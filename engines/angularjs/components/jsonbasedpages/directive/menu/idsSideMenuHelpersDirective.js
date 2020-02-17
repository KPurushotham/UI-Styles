define(['angularAMD'], function (angularAMD) {
    'use strict';

    angularAMD.directive('idsSideMenuToggleMenu', idsSideMenuToggleMenu)
      .directive('idsSideMenuCollapseMenu', idsSideMenuCollapseMenu)
      .directive('idsSideMenuTogglingItem', idsSideMenuTogglingItem)
      .controller('idsSideMenuTogglingItemCtrl', idsSideMenuTogglingItemCtrl)
      .directive('idsUiSrefTogglingSubmenu', idsUiSrefTogglingSubmenu)
      .directive('idsUiSrefToggler', idsUiSrefToggler);

  /** @ngInject */
  function idsSideMenuToggleMenu(idsSideMenuService) {
    return {
      restrict: 'A',
      link: function(scope, elem) {
        elem.on('click', function($evt) {
          $evt.originalEvent.$sidebarEventProcessed = true;
          scope.$apply(function() {
            idsSideMenuService.toggleMenuCollapsed();
          });
        });
      }
    };
  }

  /** @ngInject */
  function idsSideMenuCollapseMenu(idsSideMenuService) {
    return {
      restrict: 'A',
      link: function(scope, elem) {
        elem.on('click', function($evt) {
          $evt.originalEvent.$sidebarEventProcessed = true;
          if (!idsSideMenuService.isMenuCollapsed()) {
            scope.$apply(function() {
              idsSideMenuService.setMenuCollapsed(true);
            });
          }
        });
      }
    };
  }

  /** @ngInject */
  function idsSideMenuTogglingItem() {
    return {
      restrict: 'A',
      controller: 'BaSidebarTogglingItemCtrl'
    };
  }

  /** @ngInject */
  function idsSideMenuTogglingItemCtrl($scope, $element, $attrs, $state, idsSideMenuService) {
	  
    var vm = this;
    var menuItem = vm.$$menuItem = $scope.$eval($attrs.idsSideMenuTogglingItem);
    if (menuItem && menuItem.subMenu && menuItem.subMenu.length) {
		vm.$$expandSubmenu = function () {
			console.warn('$$expandMenu should be overwritten by idsUiSrefTogglingSubmenu')
		};
		vm.$$collapseSubmenu = function () {
			console.warn('$$collapseSubmenu should be overwritten by idsUiSrefTogglingSubmenu')
		};

      var subItemsStateRefs = idsSideMenuService.getAllStateRefsRecursive(menuItem);

      vm.$expand = function() {
        vm.$$expandSubmenu();
        $element.addClass('ids-sidemenu-item-expanded');
      };

      vm.$collapse = function() {
        vm.$$collapseSubmenu();
        $element.removeClass('ids-sidemenu-item-expanded');
      };

      vm.$toggle = function() {
          $element.hasClass('ids-sidemenu-item-expanded') ?
            vm.$collapse() :
            vm.$expand();
      };

      if (_isState($state.current)) {
          $element.addClass('ids-sidemenu-item-expanded');
      }

      $scope.$on('$stateChangeStart', function (event, toState) {
          if (!_isState(toState) && $element.hasClass('ids-sidemenu-item-expanded')) {
          vm.$collapse();
          $element.removeClass('ids-sidemenu-item-expanded');
        }
      });

      $scope.$on('$stateChangeSuccess', function (event, toState) {
        if (_isState(toState) && !$element.hasClass('ba-sidebar-item-expanded')) {
          vm.$expand();
          $element.addClass('ba-sidebar-item-expanded');
        }
      });
    }

    function _isState(state) {
      return state && subItemsStateRefs.some(function(subItemState) {
            return state.name.indexOf(subItemState) == 0;
          });
    }
  }

  /** @ngInject */
  function idsUiSrefTogglingSubmenu($state) {
    return {
      restrict: 'A',
      require: '^idsSideMenuTogglingItem',
      link: function(scope, el, attrs, idsSideMenuTogglingItem) {
        idsSideMenuTogglingItem.$$expandSubmenu = function() { el.slideDown(); };
        idsSideMenuTogglingItem.$$collapseSubmenu = function() { el.slideUp(); };
      }
    };
  }

  /** @ngInject */
  function idsUiSrefToggler(idsSideMenuService) {
    return {
      restrict: 'A',
      require: '^idsSideMenuTogglingItem',
      link: function(scope, el, attrs, idsSideMenuTogglingItem) {
        el.on('click', function() {
          if (idsSideMenuService.isMenuCollapsed()) {
            // If the whole sidebar is collapsed and this item has submenu. We need to open sidebar.
            // This should not affect mobiles, because on mobiles sidebar should be hidden at all
            scope.$apply(function() {
              idsSideMenuService.setMenuCollapsed(false);
            });
            idsSideMenuTogglingItem.$expand();
          } else {
            idsSideMenuTogglingItem.$toggle();
          }
        });
      }
    };
  }

})();
