define(['angularAMD', 'common', 'notify', 'stateService', 'angularCSS', 'ngMaterial'], function (angularAMD) {
    'use strict';
    var app;
    try {
        app = angular.module('platform-main-module');
    } catch (e) {
        app = angular.module('platform-main-module', 
        ['ui.router', 'cgNotify', 'ngResource', 'ui-notification',
         'angular-carousel', 'ng-selectize', 'nya.bootstrap.select',
          'multipleSelect', 'angucomplete-alt', '720kb.datepicker',
           'ui.grid', 'ui.grid.edit', 'ivh.treeview',
            'ui.grid.expandable', 'ui.grid.selection', 'ui.grid.pinning',
             'ui.grid.exporter', 'ui.grid.pagination',
            'ui.grid.autoResize', 'ez.timepicker', 'multipleDatePicker',
             'ngSimpleDatePick', 'angularCSS', 'agGrid', 'ngMaterial','ngMdIcons','dndLists' ,'ui.bootstrap',
        ]);
    }
   
    return angularAMD;
});

   