define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('reportcriteriaconfigService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, alasql) {
        function reportcriteriaconfigService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var dataset = null;
                var aceFields = [];
                var url = 'vdi/reportsdesigner/reportcriteria/get/one?reportCriteriaId=' + $stateParams.reportCriteriaId;
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                    dataset = results.data.dataset || [];
                    console.log("URL dataset ", dataset);
                    if (form.screenMode == "VIEW" || form.screenMode == "EDIT") {

                        var dataKeyJsonValue = dataset[0]["dataKeyJson"];
                        console.log("URL value 1", dataKeyJsonValue);
                        ace.edit("dataKeyJson").setValue(JSON.stringify(dataKeyJsonValue, null, '\t'));

                        var dataFormatJsonValue = dataset[0]["dataFormatJson"];
                        console.log("URL value 2", dataFormatJsonValue);
                        ace.edit("dataFormatJson").setValue(JSON.stringify(dataFormatJsonValue, null, '\t'));

                        var dependancyEventsJsonValue = dataset[0]["dependancyEventsJson"];
                        console.log("URL value 1", dependancyEventsJsonValue);
                        ace.edit("dependancyEventsJson").setValue(JSON.stringify(dependancyEventsJsonValue, null, '\t'));

                        var dependancyConfigJsonValue = dataset[0]["dependancyConfigJson"];
                        console.log("URL value 2", dependancyConfigJsonValue);
                        ace.edit("dependancyConfigJson").setValue(JSON.stringify(dependancyConfigJsonValue, null, '\t'));

                        var styleConfigJsonValue = dataset[0]["styleConfigJson"];
                        console.log("URL value 1", styleConfigJsonValue);
                        ace.edit("styleConfigJson").setValue(JSON.stringify(styleConfigJsonValue, null, '\t'));

                        var ruleConfigJsonValue = dataset[0]["ruleConfigJson"];
                        console.log("URL value 2", ruleConfigJsonValue);
                        ace.edit("ruleConfigJson").setValue(JSON.stringify(ruleConfigJsonValue, null, '\t'));

                        var configJsonValue = dataset[0]["configJson"];
                        console.log("URL value 1", configJsonValue);
                        ace.edit("configJson").setValue(JSON.stringify(configJsonValue, null, '\t'));

                    }

                });

                return false;
            };

        };
        return reportcriteriaconfigService;
    });

    return angularAMD;
});