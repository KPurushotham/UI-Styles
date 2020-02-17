define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('accountService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function accountService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form) {
                form = form || self.form;
                var gridField = screenDefConfig.getFieldByModelKey("accountgrid");
                // var URL = "/vdi/postget/gapp/master_accounts/getall";
                var URL = "/vdi/postget/gapp/Master/Accouonts?@AccountId=1&@AccountStatusId=1";
                // var params = {
                //     "Query":  "",
                //     "UserId": null,
                //     "MasterAccountId": null,
                //     "AccountTypeId": null,
                //     "PageNumber": 15,
                //     "PageSize": 15
                // }
                var defer = $q.defer();
                overlay.load();
              //  httpService.post(URL, params).then(function (resultSet) {
                httpService.get(URL).then(function (resultSet) {
                    var resultDataset = resultSet.data.dataset;
                    if (resultDataset){
                       // let res = alasql("SELECT *,convertdate(CreateDateTime)as CreateDate, lastupdateddate(LastUpdateDateTime)as LastUpdateDate  FROM ?", [resultDataset]);
                        gridField.gridOptions.api.setRowData(resultDataset);
                        gridField.gridOptions.api.sizeColumnsToFit();
                        gridField.style = "display: block;";
                        overlay.hide();
                    }
                
                });
                return defer.promise;
            };
            // alasql.fn.convertdate = function (a) {
            //     if (a) {
            //         return moment(a).format("MM/DD/YYYY");
            //     }
            // }
            // alasql.fn.lastupdateddate = function (a) {
            //     if (a) {
            //         return moment(a).format("MM/DD/YYYY");
            //     }
            // }

        
        }
        return accountService;
    });

    return angularAMD;
});