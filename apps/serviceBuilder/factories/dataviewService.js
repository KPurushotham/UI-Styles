define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('dataviewService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, alasql) {
        function dataviewService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var dataset = null;
                var aceFields = [];
                var url = 'vdi/servicebuilder/dataview/get/one?dataViewId=' + $stateParams.dataViewId;
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                    dataset = results.data.dataset || [];
                    console.log("URL dataset ", dataset);
                    if (form.screenMode === "VIEW" || form.screenMode === "EDIT") {

                        var queryJsonValue = dataset[0]["queryJson"];
                        console.log("URL value 1", queryJsonValue);
                        ace.edit("queryJson").setValue(JSON.stringify(queryJsonValue, null, '\t'));

                        var keyValue = dataset[0]["key"];
                        console.log("URL value 2", keyValue);
                        ace.edit("key").setValue(JSON.stringify(keyValue, null, '\t'));

                    }

                });

                return false;
            };

        };
        return dataviewService;
    });

    return angularAMD;
});