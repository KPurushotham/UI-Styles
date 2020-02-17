define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('sourceService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, alasql) {
        function sourceService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;       

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var dataset = null;     
                var aceFields = [];
                var url = 'vdi/servicebuilder/source/get/one?serialId=' + $stateParams.serialId;
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                    dataset = results.data.dataset || [];
                    console.log("URL dataset ", dataset);
                    if (form.screenMode == "VIEW" || form.screenMode == "EDIT") {

                        var connectionJsonValue = dataset[0]['connectionJson'];
                        console.log("URL value ", connectionJsonValue);
                        ace.edit("connectionJson").setValue(JSON.stringify(connectionJsonValue, null, '\t'));
                       
                    }

                });

                return false;
            };

        };
        return sourceService;
    });

    return angularAMD;
});