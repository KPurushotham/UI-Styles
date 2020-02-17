define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('servicemetastoreService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, alasql) {
        function servicemetastoreService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var dataset = null;
                var aceFields = [];
                var url = 'vdi/servicebuilder/servicemetastore/get/one?serviceMetaStoreId=' + $stateParams.serviceMetaStoreId;
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                    dataset = results.data.dataset || [];
                    console.log("URL dataset ", dataset);
                    if (form.screenMode == "VIEW" || form.screenMode == "EDIT") {

                        var metaJsonValue = dataset[0]['metaJson'];
                        console.log("URL value ", metaJsonValue);
                        ace.edit("metaJson").setValue(JSON.stringify(metaJsonValue, null, '\t'));

                    }

                });

                return false;
            };

        };
        return servicemetastoreService;
    });

    return angularAMD;
});