define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('repometastoreService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, alasql) {
        function repometastoreService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var dataset = null;
                var aceFields = [];
                var url = 'vdi/servicebuilder/repometastore/get/one?repoMetaStoreId=' + $stateParams.repoMetaStoreId;
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                    dataset = results.data.dataset || [];
                    console.log("URL dataset ", dataset);
                    if (form.screenMode == "VIEW" || form.screenMode == "EDIT") {

                        var queryMetadataJsonValue = dataset[0]['queryMetadataJson'];
                        console.log("URL value 2", queryMetadataJsonValue);
                        ace.edit("queryMetadataJson").setValue(JSON.stringify(queryMetadataJsonValue, null, '\t'));

                        var paramsJsonValue = dataset[0]['paramsJson'];
                        console.log("URL value 2", paramsJsonValue);
                        ace.edit("paramsJson").setValue(JSON.stringify(paramsJsonValue, null, '\t'));

                    }

                });

                return false;
            };

        };
        return repometastoreService;
    });

    return angularAMD;
});