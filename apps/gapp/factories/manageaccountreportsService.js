define(['angularAMD', 'utilService', 'ngHandsontable', 'alaSqlExtensions', 'httpService', 'authService', 'gridService', 'localPersistenceService', 'ngStorage', 'overlay'], function (angularAMD) {
    'use strict';

    angularAMD.factory('manageaccountreportsService', function ($filter, $q, $timeout, alasql, utilService, hotRegisterer, $window,
        constants, dateUtilService, httpService, authService, gridService, localPersistenceService, _, overlay, $stateParams, $location) {

        function manageaccountreportsService(form, menuDefinition) {
            var self = this;
            this.form = form;
            this.menuDefinition = menuDefinition;
            //  $scope.isLoaded = false;
            

            this.downloadExcel = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
               
                var beginDate = moment(sectionDataModel["beginDate"]).format("YYYY/MM/DD");
                var endDate =  moment(sectionDataModel["endDate"]).format("YYYY/MM/DD");
                
                var url = 'report/run/json/1009/UK_TOTEPOOL_ACCOUNT_REPORT';

                var params = {
                    "applicationId": 1009,
                    "reportCode": "UK_TOTEPOOL_ACCOUNT_REPORT",
                    "reportType": "xlsx",
                    
                    "additionalServiceCriteria": {
                     "@AccountId":25,
                      "@ToteProviderId": 1,
                      "@StartDate": beginDate,
                      "@EndDate": endDate
                    }
                  }
                  //    "@StartDate": "2018/05/31",
                //  "@EndDate": "2018/05/31"
                
                var gridData = this.form.getFieldByModelKey("gridData");
                var gridApi = gridData.gridOptions.api;
                var gridColumns = gridData.gridConfig.columns;

              httpService.post(url, params).then(function (results) {
                    var dataset = results.data.dataset || [];
                    console.log("dataset==",dataset);

                   var  resultSet = JSON.parse(results.config.data);
                   console.log("resultSet==",resultSet);
                    gridApi.setRowData(dataset);
                
                });
            };

            this.getExcel = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
               
                var beginDate = moment(sectionDataModel["beginDate"]).format("YYYY/MM/DD");
                var endDate =  moment(sectionDataModel["endDate"]).format("YYYY/MM/DD");
                
                var url = 'report/run/xlsx/1009/UK_TOTEPOOL_ACCOUNT_REPORT';

                var params = {
                    "applicationId": 1009,
                    "reportCode": "UK_TOTEPOOL_ACCOUNT_REPORT",
                    "reportType": "xlsx",
                    
                    "additionalServiceCriteria": {
                     "@AccountId":25,
                      "@ToteProviderId": 1,
                      "@StartDate": beginDate,
                      "@EndDate": endDate
                    }
                  }
                  //    "@StartDate": "2018/05/31",
                //  "@EndDate": "2018/05/31"
                
                var gridData = this.form.getFieldByModelKey("gridData");
                var gridApi = gridData.gridOptions.api;
                var gridColumns = gridData.gridConfig.columns;

              httpService.post(url, params).then(function (results) {
                    var dataset = results.data.dataset || [];
                    console.log("dataset==",dataset);

                   var  resultSet = JSON.parse(results.config.data);
                   console.log("resultSet==",resultSet);
                    gridApi.setRowData(dataset);
                
                });
            };
        }
        return manageaccountreportsService;
    });

    return angularAMD;
});