define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('datasourceconfigService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, alasql) {
        function datasourceconfigService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var dataset = null;
                var aceFields = [];
                var url = 'vdi/reportsdesigner/datasource/get/one?dataSourceId=' + $stateParams.dataSourceId;
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                    dataset = results.data.dataset || [];
                    console.log("URL dataset ", dataset);
                    if (form.screenMode == "VIEW" || form.screenMode == "EDIT") {

                        var serviceIdParamValue = dataset[0]["serviceIdParam"];
                        console.log("URL value 1", serviceIdParamValue);
                        ace.edit("serviceIdParam").setValue(JSON.stringify(serviceIdParamValue, null, '\t'));

                        var dataFormatJsonValue = dataset[0]["dataFormatJson"];
                        console.log("URL value 2", dataFormatJsonValue);
                        ace.edit("dataFormatJson").setValue(JSON.stringify(dataFormatJsonValue, null, '\t'));

                        var configJsonValue = dataset[0]["configJson"];
                        console.log("URL value 2", configJsonValue);
                        ace.edit("configJson").setValue(JSON.stringify(configJsonValue, null, '\t'));

                    }

                });

                return false;
            };

        };
        return datasourceconfigService;
    });

    return angularAMD;
});