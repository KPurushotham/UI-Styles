//,'csvlib','pdflib','vfsfonts'
define(['angularAMD', 'alasql', 'jQuery','jQuery-template','underscore', 'moment', 'angular', 'angular-ui-router', 'angular-ui-bootstrap', 'angular-resource', 'angular-growl',
    'selectize', 'ngdatepicker', 'ngmultiDatePicker', 'angular-selectize', 'angucomplete', 'angular-ivh-treeview','angular-slimscroll',
    , 'ngSanitize',
    'angular-daterangepicker', 'daterangepicker', 'angular-datepicker', 'ngStorage',
    'ui-grid', 'InlineEdit','nestedSelect',
    'angular-touch', 'angular-carousel', 'ngtimepicker', 'pageTop', 'idsSideMenu', 'engineConstants', 'appToolbar'
    , 'idsPanel.directive', 'idsPanel.service', 'idsPanelBlur.directive', 'idsPanelBlurHelper.service', 'idsPanelSelf.directive'
    , 'engine.configProvider','requireJsProxyFactory','ui-ace','dndLists','DlhSoft'
], function (angularAMD) {
    'use strict';
    angularAMD.factory('_', ['$window', function ($window) {
        return $window._; // assumes underscore has already been loaded on the page.
    }]);

    angularAMD.factory('alasql', ['$window', function ($window) {
        return $window.alasql; 
    }]);
  return angularAMD;
});


