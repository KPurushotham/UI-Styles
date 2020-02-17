define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService','alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('jobdashboardService', function ($filter, utilService, gridService, $http,
        constants, apiUrlJobRepository, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function jobdashboardService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            
          this.afterLoad = function (screenDefConfig, form) {
            form = form || self.form;
            var apiURLVDI = constants.api_url;
            var apiUrl = apiUrlJobRepository.JOB_PROCESS;
            console.log (' apiUrl==',apiUrl)
            
             var serviceUrl = 'vdi/job/dashboard/all';

             var fullUrl = apiURLVDI+serviceUrl;
                var jobDetailsGrid = screenDefConfig.getFieldByModelKey("jobGridDetails");
                    jobDetailsGrid.style = "display: block;";

                    httpService.get(fullUrl).then(function (results) {
                        if (results.status === 200) {
                            var dataset = results.data.dataset ;

                            let res = alasql("SELECT *,startDateTime(startTime)as startTimeDate,endDateTime(endTime)as endTimeDate  FROM ?", [dataset]);
                            jobDetailsGrid.gridOptions.api.setRowData(res);
                        }
                    });
        };

        alasql.fn.startDateTime = function (a) {
            if (a) {
                return dateUtilService.convertToDateTimeFormat(a);
            }
        };
        alasql.fn. endDateTime = function (a) {
            if (a) {
                return dateUtilService.convertToDateTimeFormat(a);
            }
        };
    }
        return jobdashboardService;
    });

    return angularAMD;
});