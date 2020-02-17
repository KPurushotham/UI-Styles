define(['angularAMD'], function (angularAMD) {
    'use strict';

    angularAMD.directive('idsPanelSelf', idsPanelSelf);

    /** @ngInject */
    function idsPanelSelf(idsPanel) {
        return angular.extend({}, idsPanel, {
            link: function (scope, el, attrs) {
                el.addClass('panel panel-white');
                if (attrs.idsPanelClass) {
                    el.addClass(attrs.idsPanelClass);
                }
            }
        });
    }

    return angularAMD;
});
