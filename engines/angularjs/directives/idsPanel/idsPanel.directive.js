define(['angularAMD'], function (angularAMD) {
    'use strict';

    angularAMD.directive('idsPanel', idsPanel);

  /** @ngInject */
  function idsPanel(idsPanel, idsConfig) {
    return angular.extend({}, idsPanel, {
      template: function(el, attrs) {
          var res = '<div  class="panel ' + (idsConfig.theme.blur ? 'panel-blur' : '') //+ ' full-invisible '
              + (attrs.idsPanelClass || '');
        res += '" zoom-in ' + (idsConfig.theme.blur ? 'ids-panel-blur' : '') + '>';
        res += idsPanel.template(el, attrs);
        res += '</div>';
        return res;
      }
    });
  }
  return angularAMD;
});
