define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('tenantsetupService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams) {

        function tenantsetupService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var pattern = form.currentMenuDefinition.pattern;            
                return false;
            };
            
            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);               

                var tobeSavedData = {};
                var tenantRelations = [];
                var tenantApplication = [];
                var applicationPayload = formServiceModel.tenantApplication;

                if (operationType === "ADD") {

                    var defaultTenantChrims = {
                        "tenantRelationId": "",
                        "relationalTenantId": "",
                        "parentTenantId": 0,
                        "relationshipTypeCode": "ST",
                        "beginDate": "2018/01/01",
                        "endDate": "2099/01/01"
                    };
                    tenantRelations.push(defaultTenantChrims);

                    if (formServiceModel.tenantRelation.parentTenantId.length !== 0) {
                        if (formServiceModel.tenantRelation.parentTenantId !== "") {
                            tenantRelations.push(formServiceModel.tenantRelation);
                        }
                    }
                }       

                angular.forEach(applicationPayload, function (payload) {
                    if (payload["isActive"]) {
                        payload["isActive"] = "t";
                    }
                    else {
                        payload["isActive"] = "f";
                    }
                    tenantApplication.push(payload);
                });

                tobeSavedData.tenantId = formServiceModel.tenantId;
                tobeSavedData.entityTypeCode = formServiceModel.entityTypeCode;
                tobeSavedData.tenantCode = formServiceModel.tenantCode;
                tobeSavedData.tenantTitle = formServiceModel.tenantTitle;
                tobeSavedData.logo = formServiceModel.logo;
                tobeSavedData.tenantRelation = tenantRelations;
                tobeSavedData.tenantApplication = tenantApplication;

                return tobeSavedData;
            }; 

            this.getUpdatedRowData = function (gridData, data) {

                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.tenantApplicationId === data.tenantApplicationId) {

                        var yesterdaysDate = dateUtilService.convertToDateFormat(moment().subtract(1, 'day').toDate()); 

                        if ((new Date(data.endDate) > new Date(yesterdaysDate)) && (data.isActive === true)) {
                            localStorage.setItem(gridData.tenantApplicationId, gridData.endDate);
                            gridData.endDate = yesterdaysDate;
                            gridData.isActive = false;
                        }
                        else {                            
                            var localStorageEndDate = localStorage.getItem(gridData.tenantApplicationId);
                            if (localStorageEndDate === null) {
                                localStorageEndDate = "01/01/2099";
                            }
                            gridData.endDate = localStorageEndDate;
                            gridData.isActive = true;
                        }
                    }
                });
                return gridData;
            };

            this.deleteFromGrid = function (data, parentForm) {

                var tenantApps = this.form.getFieldByModelKey("tenantApplication");
                var gridApi = tenantApps.gridOptions.api;
                var gridColumns = tenantApps.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);
                var rowData;

                if (parentForm.getScreenMode() === "ADD") {
                    rowData = _.filter(rowsData, function (rowsData) {
                        var isExists = true;
                        if (rowsData.applicationTitle === data.applicationTitle && rowsData.beginDate === data.beginDate
                            && rowsData.endDate === data.endDate) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (parentForm.getScreenMode() === "EDIT") {

                    if (data.tenantApplicationId === "" || data.tenantApplicationId === undefined) {
                        rowData = _.filter(rowsData, function (rowsData) {
                            var isExists = true;
                            if (rowsData.applicationTitle === data.applicationTitle && rowsData.beginDate === data.beginDate
                                && rowsData.endDate === data.endDate) {
                                isExists = false;
                            }
                            return isExists;
                        });
                        gridApi.setRowData(rowData);
                    }
                    else {
                        var updatedData = this.getUpdatedRowData(rowsData, data);
                        gridApi.setRowData(updatedData);  
                    }                  
                }

                
            };

            this.addToGrid = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                
                var appNames = sectionDataModel["taapplicationEntityId"];
                var tenantApplicationId = "";
                var tenantId = formDataModel["tenantId"];
                var beginDate = sectionDataModel["tabeginDate"];
                var endDate = sectionDataModel["taendDate"];
                var isActive = true;

                var tenantApps = this.form.getFieldByModelKey("tenantApplication");
                var gridApi = tenantApps.gridOptions.api;
                var gridColumns = tenantApps.gridConfig.columns;

                var isBetween = function (n, a, b) {
                    return (n - a) * (n - b) <= 0;
                };

                var rowDataItem = [];
                console.log("add to grid");
                if (appNames && beginDate && endDate) {

                    var beginDateTimeStamp = dateUtilService.convertToTimeStamp(beginDate);
                    var endDateTimeStamp = dateUtilService.convertToTimeStamp(endDate);
                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                    angular.forEach(appNames, function (item, key) {

                        if (beginDateTimeStamp < endDateTimeStamp) {

                            var existRowData = _.filter(filterRowsData, function (filterRowData) {
                                var isExists = true;

                                if (filterRowData.applicationTitle === item.text) {
                                    isExists = true;
                                    swal({
                                        text: "Seleted Application already exists in the grid!",
                                        icon: "info",
                                        button: "Okay"
                                    });                             
                                }
                                else {
                                    isExists = false;
                                }

                                return isExists;
                            });

                            console.log("existRowData", existRowData);
                            if (existRowData && existRowData.length === 0) {
                                rowDataItem.push({
                                    operationType: "INSERT",
                                    tenantApplicationId: tenantApplicationId,
                                    tenantId: tenantId,
                                    applicationEntityId: item.value,
                                    applicationTitle: item.text,
                                    beginDate: beginDate,
                                    endDate: endDate,
                                    isActive: isActive
                                });
                            }

                        }
                        else {
                            swal({
                                text: "Begin Date & End Date should be in proper range. Please select different date range!",
                                icon: "info",
                                button: "Okay"
                            });

                        }
                    });
                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                console.log("rowDataItem=", rowDataItem);
                gridApi.updateRowData({ add: rowDataItem });
            };
            
        }
        return tenantsetupService;
    });

    return angularAMD;
});