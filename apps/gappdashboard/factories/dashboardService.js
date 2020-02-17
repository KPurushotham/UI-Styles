define(['angularAMD', 'utilService', 'ngHandsontable', 'alaSqlExtensions', 'httpService', 'authService', 'gridService', 'localPersistenceService', 'ngStorage', 'overlay'], function (angularAMD) {
    'use strict';

    angularAMD.factory('dashboardService', function ($filter, $q, $timeout, alasql, utilService, hotRegisterer, $window,
        constants, dateUtilService, httpService, authService, gridService, localPersistenceService, _, overlay, $stateParams, $location,$http,$interval) {

        function dashboardService(form, menuDefinition) {
            var self = this;
            this.form = form;
            this.menuDefinition = menuDefinition;
            
            this.getCurrentDate = function(){
                //return dateUtilService.convertStringToDateFormat(new Date(),"YYYY-MM-DD");
                return "2019-08-19";
            };          

            this.afterLoad = function (form, screenDefConfig) {
                $interval(self.dataBind, 1800000);
                //$interval(self.dataBind, 5000);
               self.dataBind();
            };  

            this.dataBind = function(){
                self.getBetsCounts().then(function(result){
                    console.log("result=",result);

                    var summarizeDataSet = alasql("SELECT SUM(totalBets) AS totalbets,SUM(countOfRejectedBets) AS rejectedbets,SUM(countOfUnPlacedBets) AS unplacedbets,SUM(countOfSuccessfulBets) AS successbets FROM ? GROUP BY activityDate ",[result])
                    var fResult =summarizeDataSet[0];
                    console.log("summarizeDataSet=",fResult);
                    var dashboardModel={};
                    dashboardModel["TOTALBETS"]  = { max: fResult["totalbets"], value: fResult["totalbets"] };
                   setStatusGaugeModelByKey("TOTALBETS",dashboardModel);

                   dashboardModel["REJECTED"]  = { max: fResult["totalbets"], value: fResult["rejectedbets"] };
                   setStatusGaugeModelByKey("REJECTED",dashboardModel);

                   dashboardModel["UNPROCCESSED"]  = { max: fResult["totalbets"], value: fResult["unplacedbets"] };
                   setStatusGaugeModelByKey("UNPROCCESSED",dashboardModel);

                   dashboardModel["SUCCESSBETS"]  = { max: fResult["totalbets"], value: fResult["successbets"] };
                   setStatusGaugeModelByKey("SUCCESSBETS",dashboardModel);

                   dashboardModel["REJECTEDBETSEMAILS"]  = { max: fResult["totalbets"], value: fResult["successbets"] };
                   setStatusGaugeModelByKey("REJECTEDBETSEMAILS",dashboardModel);

                });
                console.log("dateUtilService.getCurrentDate()=",dateUtilService.convertStringToDateFormat(new Date(),"YYYY-MM-DD"))
                self.getRejectedBets();
            }

            this.openModelPopUp = function(sourceField,action){
                console.log("modal popup event",sourceField,action);
                this.form.openDialog(action.modalform);
            };
            
            this.getRejectedBets = function(){
                var rejectedUrl = "http://172.16.47.54:8082/vdi/postget/gapp/RejectBets/GetAll?@ToteProviderId=0&@AccountId=0&@ClientAccountId=0&@StartDate="+self.getCurrentDate()+"&@EndDate="+self.getCurrentDate();
                httpService.get(rejectedUrl).then(function (result) {
                          var resData = result.data.dataset || [];
                        console.log("results =",resData);
                        var gridData = self.form.getFieldByModelKey("gridData");
                        var gridApi = gridData.gridOptions.api;
                        console.log("resData==>",resData);
                         gridApi.setRowData(resData);
                     
                });
                 
            };



            this.getBetsCounts = function(){
                var defer = $q.defer();
                var rejectedUrl = "http://172.16.47.54:8082/vdi/postget/gapp/BetsCount/BetsCountReport?@ToteProviderId=0&@StartDate="+self.getCurrentDate()+"&@EndDate="+self.getCurrentDate();
                httpService.get(rejectedUrl).then(function (results) {
                    if (results.status === 200) {
                        console.log("results =",results);
                        defer.resolve(results.data.dataset);
                    }else{
                        defer.resolve(null);
                    }
                });
                return defer.promise;
            };

            this.getUnProcessedBets = function(){
                var defer = $q.defer();
                var rejectedUrl = "http://172.16.47.54:8082/vdi/postget/gapp/UnPr/UPBETS?@ProviderId=1&@NoOfDays=1";
                httpService.get(rejectedUrl).then(function (results) {
                    if (results.status === 200) {
                        console.log("results =",results);
                        defer.resolve(response.body);
                    }else{
                        defer.resolve(null);
                    }
                });
            };

            this.RejectedBetsChangeGaugeHandler = function(){
                
                self.getRejectedBets();
            };

            this.UnProcessedBetsChangeGaugeHandler = function(){
                self.getRejectedBets().then(function(resData){
                    var gridData = self.form.getFieldByModelKey("gridData");
                    var gridApi = gridData.gridOptions.api;
                    console.log("resData==>",resData);
                     gridApi.setRowData(resData);
                });
            };

            this.viewRejectedBetInfo = function(sourceField,action){
                console.log("modal popup event",sourceField.importBetFileControlId );
                overlay.load();
                self.getAzureInsights(sourceField.importBetFileControlId ).then(function(res){
                    var azureData={};
                    azureData["logInfo"] =res;
                    self.openDialog(self.form["modalforms"]["gridViewPopUp"],azureData);
                    overlay.hide();
                });
              
            };

            this.getAzureInsights = function(betId){
                var defer = $q.defer();
                var azureRejectedBetUrl = "https://api.applicationinsights.io/v1/apps/9332fa86-0dcf-4bcb-af48-3b84c5ec5e68/query?query=traces%7C%20extend%20itemType%20%3D%20iif(itemType%20%3D%3D%20'trace'%2CitemType%2C%22%22)%7C%20where%20timestamp%20%3E%3D%20datetime("+self.getCurrentDate()+"T00%3A01%3A01.001Z)%20and%20timestamp%20%3C%3D%20datetime("+self.getCurrentDate()+"T23%3A59%3A59.000Z)%7C%20where%20*%20has%20'"+betId+"'%7C%20order%20by%20timestamp%20desc%7C%20summarize%20makelist(timestamp)%20by%20message";
                var apiKey ="e10ajplykkeuzd4rft1dcpokdijov77ics4do3tr";
                fetch(azureRejectedBetUrl, {
                    method: "Get",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key":apiKey
                    } 
                })
                .then(response => response.json())
                .then(response => {
                    console.log("***response=",response["tables"][0]["rows"]);
                    var azureData = parseAzureData(response["tables"][0]["rows"]);
                   
                    defer.resolve(azureData);
                  
                })
                .catch(err => {
                    console.log('err',err);  
                    return null;
                });
                return  defer.promise;
            }

            var parseAzureData = function(inputData){
                var azureDataList =[];
                angular.forEach(inputData,function(item,i){
                    var v1 = item[1].split("[")[1];
                    var jsonIDate = v1.split("]")[0].replace("T"," ");
                    var azureDataItem = {
                        "logInfo":item[0],
                        "logDate":jsonIDate
                    };
                    azureDataList.push(azureDataItem);
                });
               return azureDataList; 
            };
            
            var getFieldByKey = function (modelKey) {
                self["fields"] = self["fields"] || {};
                var field = self["fields"][modelKey];
                if (!field) {
                    field = self.form.getFieldByModelKey(modelKey);
                    self["fields"][modelKey] = field;
                }
                return field;
            };
            var setStatusGaugeModelByKey = function (statusCode, model) {
                try {
                    getFieldByKey(statusCode).setModel(model);
                }
                catch (err) {
                    console.log("error=", err);
                }
            };

           
        }
        return dashboardService;
    });

    return angularAMD;
});