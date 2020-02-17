define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'modelUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('ogmScreenService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, modelUtilService, localPersistenceService, Notification, httpService, $q, $stateParams) {

        function ogmScreenService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;
           

        }
        return ogmScreenService;
    });

    return angularAMD;
});