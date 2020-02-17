define(['angularAMD'], function (angularAMD) {
    'use strict';

    angularAMD.factory('idsPanel', idsPanel);

  /** @ngInject */
  function idsPanel() {

    /** Base idsPanel directive */
    return {
      restrict: 'A',
      transclude: true,
      template: function(elem, attrs) {
        var res = '<div class="panel-body" ng-transclude></div>';
        if (attrs.baPanelTitle) {
          var titleTpl = '<div class="panel-heading clearfix"><h3 class="panel-title">' + attrs.idsPanelTitle + '</h3></div>';
          res = titleTpl + res; // title should be before
        }

        return res;
      }
    };
  }
  return angularAMD;
});
