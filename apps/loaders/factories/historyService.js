define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('historyService', function ($filter, utilService, gridService, $http,
        constants,apiUrlJobRepository, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function historyService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            var apiUrl = apiUrlJobRepository.JOB_PROCESS; 
            const jobDetailsGetUrl =  "job/get/details/1006/test";  

            this.getHistoryHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                // Need to get history of loaded data from racedata loader

                var jobInstanceId = form.getFieldByModelKey("jobInstanceId");
                var jobInstanceValue = jobInstanceId.modelValue;
               
                var jobDetailsGrid = form.getFieldByModelKey("jobGrid");
                jobDetailsGrid.style = "display: block;";
                var fullURL = apiUrl+jobDetailsGetUrl;

                var jobProcessInstanceId = {
                  "jobProcessInstanceId" : jobInstanceValue
                };
                  overlay.load();
                  httpService.post(fullURL,jobProcessInstanceId).then(function (resultSet) {
                      jobDetailsGrid.gridOptions.api.setRowData([]);
                      overlay.hide();
                      var dataset = resultSet.data.data.dataMap.data.jobStatusList;
                      jobDetailsGrid.gridOptions.api.setRowData(dataset);
                  });
            };
        }
        return historyService;
    });

    return angularAMD;
});