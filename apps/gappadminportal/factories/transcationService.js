define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('transcationService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function transcationService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form) {
                form = form || self.form;
                var gridField = screenDefConfig.getFieldByModelKey("transcationgrid");
                //var URL ="/vdi/postget/gapp/masteraccount_clients/details";
          
                var URL = "/vdi/postget/gapp/TransActions/Listview";
                var params = {
                    "@AccountId":73,
                    "@ToteProviderId":null,
                    "@StartDate":null,
                    "@EndDate":null
                };
                var defer = $q.defer();
                overlay.load();
                httpService.post(URL,params).then(function (resultSet) {
                    var resultDataset = resultSet.data.dataset;
                    let res = alasql("SELECT *,convertdate(activityDateTime)as activityDate, postDateTimedate(postDateTime)as postDate  FROM ?", [resultDataset]);
                    gridField.gridOptions.api.setRowData(res);
                    gridField.gridOptions.api.sizeColumnsToFit();
                    gridField.style = "display: block;";
                    overlay.hide();
                });
                alasql.fn.convertdate = function (a) {
                    if (a) {
                        return moment(a).format("YYYY/MM/DD");
                    }
                }
                alasql.fn.postDateTimedate = function (a) {
                    if (a) {
                        return moment(a).format("YYYY/MM/DD");
                    }
                }

                
                return defer.promise;
            };
        }
        return transcationService;
    });

    return angularAMD;
});