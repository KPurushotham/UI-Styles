define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('reportconfigService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, alasql) {
        function reportconfigService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var dataset = null;
                var aceFields = [];
                var url = 'vdi/reportsdesigner/report/get/one?reportId=' + $stateParams.reportId;
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                    dataset = results.data.dataset || [];
                    console.log("URL dataset ", dataset);
                    if (form.screenMode == "VIEW" || form.screenMode == "EDIT") {

                        var serviceIdParamValue = dataset[0]["serviceIdParam"];
                        console.log("URL value 1", serviceIdParamValue);
                        ace.edit("serviceIdParam").setValue(JSON.stringify(serviceIdParamValue, null, '\t'));

                        var uiCriteriaFieldsValue = dataset[0]["uiCriteriaFields"];
                        console.log("URL value 2", uiCriteriaFieldsValue);
                        ace.edit("uiCriteriaFields").setValue(JSON.stringify(uiCriteriaFieldsValue, null, '\t'));

                        var dataFormatMapperValue = dataset[0]["dataFormatMapper"];
                        console.log("URL value 1", uiCriteriaFieldsValue);
                        ace.edit("dataFormatMapper").setValue(JSON.stringify(dataFormatMapperValue, null, '\t'));

                        var configJsonValue = dataset[0]["configJson"];
                        console.log("URL value 2", configJsonValue);
                        ace.edit("configJson").setValue(JSON.stringify(configJsonValue, null, '\t'));

                    }

                });

                return false;
            };

        };
        return reportconfigService;
    });

    return angularAMD;
});