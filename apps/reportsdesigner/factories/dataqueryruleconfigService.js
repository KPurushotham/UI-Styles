define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('dataqueryruleconfigService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, alasql) {
        function dataqueryruleconfigService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var dataset = null;
                var aceFields = [];
                var url = 'vdi/reportsdesigner/dataqueryrule/get/one?dataQueryRuleId=' + $stateParams.dataQueryRuleId;
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                    dataset = results.data.dataset || [];
                    console.log("URL dataset ", dataset);
                    if (form.screenMode == "VIEW" || form.screenMode == "EDIT") {

                        var procConfigJsonValue = dataset[0]["procConfigJson"];
                        console.log("URL value 1", procConfigJsonValue);
                        ace.edit("procConfigJson").setValue(JSON.stringify(procConfigJsonValue, null, '\t'));

                        var selectClauseValue = dataset[0]["selectClause"];
                        console.log("URL value 2", selectClauseValue);
                        ace.edit("selectClause").setValue(JSON.stringify(selectClauseValue, null, '\t'));

                    }

                });

                return false;
            };

        };
        return dataqueryruleconfigService;
    });

    return angularAMD;
});