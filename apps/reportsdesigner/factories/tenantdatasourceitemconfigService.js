define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('tenantdatasourceitemconfigService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, alasql) {
        function tenantdatasourceitemconfigService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var dataset = null;
                var aceFields = [];
                var url = 'vdi/reportsdesigner/tenantdatasourceitem/get/one?tenantDataSourceItemId=' + $stateParams.tenantDataSourceItemId;
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                    dataset = results.data.dataset || [];
                    console.log("URL dataset ", dataset);
                    if (form.screenMode == "VIEW" || form.screenMode == "EDIT") {

                        var configJsonValue = dataset[0]["configJson"];
                        console.log("URL value", configJsonValue);
                        ace.edit("configJson").setValue(JSON.stringify(configJsonValue, null, '\t'));

                    }

                });

                return false;
            };

        };
        return tenantdatasourceitemconfigService;
    });

    return angularAMD;
});