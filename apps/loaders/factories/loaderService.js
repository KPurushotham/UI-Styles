define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('loaderService', function ($filter, utilService, gridService, $http,
        constants, apiUrlJobRepository, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function loaderService(form, menuDefinition) {
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
                var end = moment().subtract(1, 'day').toDate();
                var modelValue = {
                    "startDate": start,
                    "endDate": end
                };
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
                var startDate = (raceDateString.startDate).format('YYYY/MM/DD') || moment().format('MM/DD/YYYY');
                var endDate = (raceDateString.endDate).format('YYYY/MM/DD') || moment().format('MM/DD/YYYY');
                var jobCode = sectionDataModel["jobCode"];
                var jobCodes = jobCode.split("|");
                localPersistenceService.set("loaderstartDate", startDate, true);
                localPersistenceService.set("loaderendDate", endDate, true);
                //   var equibaseFileContainer = raceDate.format('YYYY') + "/" + raceDate.format('MMMM') + "/" + raceDate.format('YYYYMMDD') + "/";
                var payload = {
                    "jobProcessCode": "racedata-loader",
                    "applicationId": 1006,
                    "isRerunJob": true,
                    "jobCodes": jobCodes,
                    "criteria": {
                        "startDate": startDate,
                        "endDate": endDate
                    }
                };
                var runServiceUrl = "job/run/1006/test";  
                var jobRunUrl = apiUrl+runServiceUrl;
                var defer = $q.defer();
                httpService.post(jobRunUrl, payload).then(function (result) {
                    console.log(result);
                    var refreshButton = form.getFieldByModelKey("refreshGrid");
                    var jobDetailsGrid = form.getFieldByModelKey("jobGrid");
                    var jobTracksDetailsGrid = form.getFieldByModelKey("tracksGrid");
                    var jobDetialsDataset = result.data.data.dataMap.data;

                    var serviceUrl ="job/get/details/1006/test";
                    var jobfullUrl  = apiUrl+serviceUrl;
                    if (jobDetialsDataset.status === "JOB_PROCESS_SUCCESS") {
                        jobDetailsGrid.gridOptions.api.setRowData([]);
                        //var jobInstanceId = jobDetialsDataset.jobStatusList[0].jobInstanceId;
                        // var jobInstanceIdCSV = _.map(jobDetialsDataset.jobStatusList, "jobInstanceId").join(",");
                        var jobInstanceIdCSV = jobDetialsDataset.jobProcessInstanceId;
                        var jobProcessInstanceId = {
                            "jobProcessInstanceId": jobInstanceIdCSV
                        };
                        localPersistenceService.set("jobInstanceIdCSV", jobInstanceIdCSV, true);
                        var jobInstanceId = jobDetialsDataset.jobStatusList[0].jobInstanceId;
                        localPersistenceService.set("jobInstanceId", jobInstanceId, true);
                        overlay.load();
                        //httpService.post(jobDetailsGetUrl, jobProcessInstanceId).then(function (resultSet) {
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
            };

            this.refreshHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var jobDetailsGrid = form.getFieldByModelKey("jobGrid");
                var jobTracksDetailsGrid = form.getFieldByModelKey("tracksGrid");
                jobDetailsGrid.style = "display: block;";
                jobTracksDetailsGrid.style = "display: block;";
                var jobInstanceIdCSV = localPersistenceService.get("jobInstanceIdCSV", true);
                var startDate = localPersistenceService.get("loaderstartDate", true);
                var endDate = localPersistenceService.get("loaderendDate", true);
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
                    //jobDetailsGrid.gridOptions.api.setRowData(dataset);
                });
                this.getTracksHandler();
            };

            this.getTracksHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
               
             //   let jobTrackServicesUrl = "vdi/job/get/tracks?raceDate=";
               let jobTrackServicesUrl = "vdi/job/get/tracks?";
                let jobTrackDetailsUrl = apiURLVDI+jobTrackServicesUrl;
                var jobTracksDetailsGrid = form.getFieldByModelKey("tracksGrid");
                jobTracksDetailsGrid.style = "display: block";
                var raceDateString =  form.getFieldByModelKey("raceDate").modelValue;
                var startDate = (raceDateString.startDate).format('YYYY/MM/DD') ;//|| moment().format('MM/DD/YYYY');
                var endDate = (raceDateString.endDate).format('YYYY/MM/DD') ;//|| moment().format('MM/DD/YYYY');
                var startDate = startDate || localPersistenceService.get("loaderstartDate", true) || moment().format('MM/DD/YYYY');
                var endDate = endDate || localPersistenceService.get("loaderendDate", true) || moment().format('MM/DD/YYYY');

                overlay.load();
                var TrackDetailUrl = null;
              //  TrackDetailUrl = jobTrackDetailsUrl + startDate + "&" + endDate;
                  TrackDetailUrl = jobTrackDetailsUrl + "beginDate=" + startDate + "&" + "endDate=" + endDate;
                httpService.get(TrackDetailUrl).then(function (resultSet) {
                    overlay.hide();
                    var resultDataset = resultSet.data.dataset;
                    if (resultDataset){
                        let res = alasql("SELECT *,convertdate(raceDateBegin)as raceDate, groupName(raceDateBegin,sourceCode,fileTypeCode)as groupName FROM ?", [resultDataset]);
                        jobTracksDetailsGrid.gridOptions.api.setRowData(res);
                    }
                    // let res = alasql("SELECT *,convertdate(raceDateBegin)as raceDate, groupName(raceDateBegin,sourceCode,fileTypeCode)as groupName FROM ?", [resultDataset]);
                    // jobTracksDetailsGrid.gridOptions.api.setRowData(res);
                    // // jobTracksDetailsGrid.style = "display: block;";
                });
                jobTrackDetailsUrl = null;
                this.getlogDetails();


            };

            this.getlogDetails = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var serviceUrl = "vdi/job/get/logs?jobInstanceId="
                var logDetailsGrid = form.getFieldByModelKey("logsGrid");
                logDetailsGrid.style = "display: block";
                var jobInstanceIdValue = localPersistenceService.get("jobInstanceId", true);
                if (jobInstanceIdValue){
                    var fullURL = apiURLVDI+serviceUrl+jobInstanceIdValue;
                    overlay.load();
                    httpService.get(fullURL).then(function (resultSet) {
                        overlay.hide();
                        var resultDataset = resultSet.data.dataset;
                        if (resultDataset){
                        //   let res = alasql("SELECT *,convertToVarchar(timeTaken)as timeTakenVarchar FROM ?", [resultDataset]);
                            logDetailsGrid.gridOptions.api.setRowData(resultDataset);
                        }
                    
                    });
                }

            };
            
            alasql.fn.convertToVarchar = function (a) {
               
                if (a) {
                    var k = a.qualifier
                    return moment.utc(k*1000).format('HH:mm:ss');
                }
            };

        }
        return loaderService;
    });

    return angularAMD;
});