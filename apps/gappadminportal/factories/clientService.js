define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('clientService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function clientService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form) {
                form = form || self.form;
                var gridField = screenDefConfig.getFieldByModelKey("clientgrid");
                //var URL ="/vdi/postget/gapp/masteraccount_clients/details";
                var URL = "/vdi/postget/gapp/GetClients/Clients";
                overlay.load();
                var defer = $q.defer();
                httpService.get (URL).then(function (resultSet) {
                    var resultDataset = resultSet.data.dataset;
                    let res = alasql("SELECT *,convertdate(createDateTime)as CreateDate, lastupdateddate(lastUpdateDateTime)as LastUpdateDate  FROM ?", [resultDataset]);
                    gridField.gridOptions.api.setRowData(res);
                    gridField.gridOptions.api.sizeColumnsToFit();
                    gridField.style = "display: block;";
                    overlay.hide();
                });

                alasql.fn.convertdate = function (a) {
                    if (a) {
                        return moment(a).format("YYYY/MM/DD");
                    }
                };

                alasql.fn.lastupdateddate = function (a) {
                    if (a) {
                        return moment(a).format("YYYY/MM/DD");
                    }
                };

                
                return defer.promise;
            };
        }
        return clientService;
    });

    return angularAMD;
});