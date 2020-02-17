define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('hostFeeRatesReportService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, overlay, alasql, $timeout) {

        function hostFeeRatesReportService(form, menuDefinition) {
            var self = this;
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.setScreenMode = function (screenMode) {
                this.form.setScreenMode(screenMode);
            };    

            this.afterLoad = function (form, parentForm) {
                form = form || self.form;
                var dateField = form.getFieldByModelKey("date");
                var beginDate = moment().toDate();
                dateField.modelValue = dateUtilService.convertToDateFormat(moment(beginDate));
            };

            this.buildPayload = function () {
                var payload = {};
                var fieldToGetModelValue = ["date", "contractAgentEntityId", "contractTypeCode"];
                angular.forEach(fieldToGetModelValue, function (fieldKey) {
                    var field = getFieldByKey(fieldKey);
                    if (field.modelValue !== "All") {
                        if (field.fieldType === "date") {
                            payload[field.modelKey] = dateUtilService.convertToDBFormat(field.modelValue);
                        }
                        else {
                            payload["fk-" + field.modelKey] = field.modelValue;
                        }
                    }
                });
                return payload;
            };

            this.getResult = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var payload = self.buildPayload();           

                var contractsDetailsGrid = getFieldByKey("contracts");
                var gridApi = contractsDetailsGrid.gridOptions.api;         
                var url = "vdi/postget/hostfees/contractagent/contracts/getone";
                var field = getFieldByKey("date");
                var selectedDate = dateUtilService.convertToDBFormat(field.modelValue);
                overlay.load();
                httpService.post(url, payload).then(function (results) {
                    if (results.status === 200) {
                        var dataset = results.data.dataset;   
                        var resData = alasql("SELECT *,? as date FROM ?",[selectedDate,dataset]);
                        gridApi.setRowData(resData);
                    }
                    overlay.hide();
                });               
            };                       

            this.exportToExcel = function () {
                var fieldsPayload = self.buildPayload();
                var payload = {
                    "applicationId": 1000,
                    "reportType": "xlsx",
                    "additionalModelData": {
                        "sheetMap": {
                            "sheet1": "HostFeeReport"
                        }
                    },
                    "additionalServiceCriteria": {}
                };
                payload.additionalServiceCriteria = fieldsPayload;
                var headerType = "";
                var url = "";
                var exportDropdownField = getFieldByKey("exportToExcel");
                var exportModelValue = exportDropdownField.modelValue;
                if (exportModelValue === "HOSTFEE_RATE") {
                    url = "report/run/xlsx/1000/HOSTFEE_RATE";
                    headerType = "RatesReportMultiHeader";
                }
                else if (exportModelValue === "HOSTFEE_RATE_SINGLE") {
                    url = "report/run/xlsx/1000/HOSTFEE_RATE_SINGLE";
                    headerType = "RatesReportSingleHeader";
                }
                
                overlay.load();
                httpService.openFileByPost(url, payload, "excel", headerType + ".xlsx").then(function (results) {
                    console.log("file downloaded=", results);
                    overlay.hide();
                }); 
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

        }
        return hostFeeRatesReportService;
    });

    return angularAMD;
});