define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('dataloadService', function ($filter, utilService, gridService, $http,
        constants, apiUrlJobRepository, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function dataloadService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form) {

                form = form || self.form;
                var jobInstanceIdCSV = localPersistenceService.get("jobInstanceIdCSV", true);
                if (jobInstanceIdCSV) {
                    this.refreshHandler();
                }

                var raceDateRangeField  = screenDefConfig.getFieldByModelKey("raceDate");
                raceDateRangeField.modelValue = raceDateRangeField.modelValue;
                var start = moment().subtract(1, 'day').toDate();
                var modelValue = moment(start).format("MM/DD/YYYY") ;
                raceDateRangeField.modelValue = modelValue;

            };

            alasql.fn.convertdate = function (a) {
                if (a) {
                  //  return dateUtilService.convertToDateFormat(a);
                    return moment(a).format('YYYY/MM/DD');
                }
            }
            alasql.fn.groupName = function (a, b, c) {
                //   return `$(a) - $(b) : $(c)`;
                let dateValue = null;
                if (a) {
                    //dateValue = dateUtilService.convertToDateFormat(a);
                    dateValue = moment(a).format('YYYY/MM/DD');
                }
                return dateValue + "-" + b + ":" + c;
            }
            
            var apiUrl = apiUrlJobRepository.JOB_PROCESS; 
            var apiURLVDI = constants.api_url;
            this.runJobHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var raceDateString = sectionDataModel["raceDate"];
                var startDate = moment(raceDateString).format('YYYY/MM/DD') || moment().format('MM/DD/YYYY');
                var raceCheckDate=moment(raceDateString).format('YYYY-MM-DD') || moment().format('MM/DD/YYYY');
                var jobCodes = sectionDataModel["jobCode"];
               // var jobCodes = jobCode.split("|");
                localPersistenceService.set("loaderstartDate", startDate, true);
                //localPersistenceService.set("loaderendDate", endDate, true);
                // var equibaseFileContainer = raceDate.format('YYYY') + "/" + raceDate.format('MMMM') + "/" + raceDate.format('YYYYMMDD') + "/";
                var raceDateUrl="vdi/purse/loaders/over/ride?raceDate="+raceCheckDate;
               // var dataPresentUrl = apiUrl+raceDateUrl;
                httpService.get(raceDateUrl).then(function (result) {
                console.log(result);
                if(result.data.dataset[0].dataPresent ==="true "){
                    swal({
                        text: "Data already exists do you want to overide",
                        icon: "warning",
                        buttons: true,
                        dangerMode: true
                    })
                    .then((confirmflag) => {
                        if (confirmflag) {
                            var deletedRowsUrl="vdi/purse/loaders/delete";
                            var deletePayload = {
                                "p_race_date":raceCheckDate
                            }; 
                            console.log(deletedRowsUrl);
                            httpService.post(deletedRowsUrl,deletePayload).then(function (result) {
                                console.log(result);
                              purseRunJobHandler(startDate,jobCodes);
                            });
                        }
                        else {
                            swal({
                                text: "Dataload has been cancelled",
                                icon: "info",
                                button: "Okay"
                            });
                        }
                    });
                }
                else {
                    purseRunJobHandler(startDate,jobCodes);
                }
                });
            };

            var purseRunJobHandler = function (startDate,jobCodes) {
                
                var payload = {
                    "jobProcessCode": "pursedata-loader",
                    "applicationId": 1006,
                    "isRerunJob": true,
                    "jobCodes": jobCodes,
                    "criteria": {
                        "startDate": startDate,
                        "endDate": startDate
                    }
                };
                var runServiceUrl = "job/run/1006/test";  
                var jobRunUrl = apiUrl+runServiceUrl;
                var defer = $q.defer();
                httpService.post(jobRunUrl, payload).then(function (result) {
                    console.log(result);
                    var refreshButton = form.getFieldByModelKey("refreshGrid");
                    var jobDetailsGrid = form.getFieldByModelKey("jobGrid");
                    var jobDetialsDataset = result.data.data.dataMap.data;

                    var serviceUrl ="job/get/details/1006/test";
                    var jobfullUrl  = apiUrl+serviceUrl;
                    if (jobDetialsDataset.status === "JOB_PROCESS_SUCCESS") {
                        jobDetailsGrid.gridOptions.api.setRowData([]);
                        var jobInstanceIdCSV = jobDetialsDataset.jobProcessInstanceId;
                        var jobProcessInstanceId = {
                            "jobProcessInstanceId": jobInstanceIdCSV
                        };
                        localPersistenceService.set("jobInstanceIdCSV", jobInstanceIdCSV, true);
                        var jobInstanceId = jobDetialsDataset.jobStatusList[0].jobInstanceId;
                        localPersistenceService.set("jobInstanceId", jobInstanceId, true);
                        overlay.load();
                        httpService.post(jobfullUrl, jobProcessInstanceId).then(function (resultSet) {
                            var resultDataset = resultSet.data.data.dataMap.data.jobStatusList;
                            jobDetailsGrid.gridOptions.api.setRowData(resultDataset);
                            jobDetailsGrid.style = "display: block;";
                            refreshButton.show = true;
                        });
                    }
                    else {
                        refreshButton.show = false;
                        jobDetailsGrid.style = "display: none;";
                        swal({
                            text: jobDetialsDataset.message || jobDetialsDataset.status,
                            icon: "info",
                            button: "Okay"
                        });

                    }
                });
                return defer.promise;
            }

            this.refreshHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var jobDetailsGrid = form.getFieldByModelKey("jobGrid");
                jobDetailsGrid.style = "display: block;";
                var jobInstanceIdCSV = localPersistenceService.get("jobInstanceIdCSV", true);
                var startDate = localPersistenceService.get("loaderstartDate", true);
              //  var endDate = localPersistenceService.get("loaderendDate", true);
                var getServiceUrl = "job/get/details/1006/test";
                var jobProcessInstanceId = {
                    "jobProcessInstanceId": jobInstanceIdCSV
                };
                overlay.load();
                var jobDetailsGetUrl = apiUrl+getServiceUrl;
                httpService.post(jobDetailsGetUrl, jobProcessInstanceId).then(function (resultSet) {
                    jobDetailsGrid.gridOptions.api.setRowData([]);
                    overlay.hide();
                    var dataset = resultSet.data.data.dataMap.data.jobStatusList;
                    if (dataset){
                        jobDetailsGrid.gridOptions.api.setRowData(dataset);
                    }
                });
            };

        
            alasql.fn.convertToVarchar = function (a) {
               
                if (a) {
                    var k = a.qualifier
                    return moment.utc(k*1000).format('HH:mm:ss');
                }
            };

        }
        return dataloadService;
    });

    return angularAMD;
});