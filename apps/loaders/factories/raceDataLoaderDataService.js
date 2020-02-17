define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('raceDataLoaderDataService', function ($filter, utilService, gridService, $http,
        constants,apiUrlJobRepository, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function raceDataLoaderDataService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            alasql.fn.concatStrings = function (a, b) {
                return a + "-" + b;

            }
  
            var apiUrl = apiUrlJobRepository.JOB_PROCESS; 
            var apiURLVDI = constants.api_url;

            this.getExcel = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var raceDateString = sectionDataModel["raceDate"];
                //  var dateValue = moment(raceDateString).format('YYYY/MM/DD') || moment().format('YYYY/MM/DD');
                var startDate = (raceDateString.startDate).format('YYYY/MM/DD') || moment().format('YYYY/MM/DD');
                var endDate = (raceDateString.endDate).format('YYYY/MM/DD') || moment().format('YYYY/MM/DD');
                var serviceUrl = "report/run/xlsx/1012/RACEMASTER_DATA";
                var payload = {
                    "applicationId": 1012,
                    "reportCode": "RACEMASTER_DATA",
                    "reportType": "xlsx",
                    "additionalModelData": {},
                    "additionalServiceCriteria": {
                        "beginDate": startDate,
                        "endDate": endDate
                    }
                };
               var  excelURL = apiURLVDI+serviceUrl;
                httpService.openFileByPost(excelURL, payload, "excel", payload["reportCode"] + ".xls").then(function (results) {
                    console.log("file downloaded=", results);
                });
            };


            this.getDataHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var raceDateString = sectionDataModel["raceDate"];
                //  var dateValue = moment(raceDateString).format('YYYY/MM/DD') || moment().format('YYYY/MM/DD');
                var startDate = (raceDateString.startDate).format('YYYY/MM/DD') || moment().format('YYYY/MM/DD');
                var endDate = (raceDateString.endDate).format('YYYY/MM/DD') || moment().format('YYYY/MM/DD');
                var serviceUrl = "vdi/job/get/racedata?";

                var jobDetailsGrid = form.getFieldByModelKey("jobGrid");
                jobDetailsGrid.style = "display: block;";
                //  var  dataURL =getDataUrl+dateValue
                var getDataUrl = apiURLVDI + serviceUrl;
                var dataURL = getDataUrl + "beginDate=" + startDate + "&" + "endDate=" + endDate;

                overlay.load();
                httpService.get(dataURL).then(function (resultSet) {
                    jobDetailsGrid.gridOptions.api.setRowData([]);
                    overlay.hide();
                    var dataset = resultSet.data.dataset;
                    let res = alasql("SELECT *,concatStrings(trackName,trackCode)as Track FROM ?", [dataset]);

                    jobDetailsGrid.gridOptions.api.setRowData(res);
                });

            };

        }
        return raceDataLoaderDataService;
    });

    return angularAMD;
});