define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('reportByService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService,modelUtilService, localPersistenceService, Notification, httpService, $q, $stateParams,fieldService) {

        function reportByService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {
                form = form || self.form;
                var pattern = form.currentMenuDefinition.pattern; 
                var tenantID = localPersistenceService.get("TenantId", true);
                if (pattern === "FORM") {
                if (form.screenMode === "ADD") {
                            var tenantField = form.getFieldByModelKey("tenantId");
                            if (tenantID !== null) {
                                tenantField.modelValue = tenantID;
                            }
                            else {
                                tenantField.disabled = false;
                            }
                } 
                else if (form.screenMode === "VIEW" || form.screenMode === "Edit") {
                    var url = 'vdi/reports/reportby/options/getone?dataSourceItemId=' + $stateParams.dataSourceItemId + "&tenantId=" + $stateParams.tenantId;
                    httpService.get(url).then(function (results) {
                         var dataset = results.data.dataset || [];
                         var selectClause = dataset[0]['selectClause'];
                        ace.edit("selectClause").setValue(selectClause, '\t');
                    });
                }
            }
                return false;
            };  
            this.getUpdatedRowData = function (gridData, data) {

                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.dataSourceItemId === data.dataSourceItemId) {
                        if (data.activeFlag === true) {
                            gridData.activeFlag = false;
                        }
                        else {
                            gridData.activeFlag = true;
                        }
                    }
                });
                return gridData;
            };
            this.listingTenantDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("TenantId", sourceField.modelValue, true);
            };

            this.deleteFromGrid = function (data, parentForm) {

                var reportConfig = this.form.getFieldByModelKey("reportDataEntry");
                var gridApi = reportConfig.gridOptions.api;
                var gridColumns = reportConfig.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);

                if (parentForm.getScreenMode() === "ADD") {
                    var rowData = _.filter(rowsData, function (rowsData) {
                        var isExists = true;
                        if (rowsData.dataQueryRuleId === data.dataQueryRuleId && rowsData.queryRuleCode === data.queryRuleCode &&
                            rowsData.whereClause === data.whereClause && rowsData.fromClause === data.fromClause &&
                            rowsData.orderByClause === data.orderByClause && rowsData.orderByClause === data.orderByClause && rowsData.groupByClause === data.groupByClause
                            && rowsData.dataSourceItemId === data.dataSourceItemId && rowsData.tenantId === data.tenantId&&
                            rowsData.dataSourceId === data.dataSourceId && rowsData.itemValue === data.itemValue && rowsData.isActive=== data.isActive 
                            && rowsData.itemText === data.itemText) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (parentForm.getScreenMode() === "EDIT") {
                    if (data.dataSourceItemId === "" || data.dataSourceItemId === undefined) {
                        rowData = _.filter(rowsData, function (rowsData) {
                            var isExists = true;
                            if (rowsData.dataQueryRuleId === data.dataQueryRuleId && rowsData.queryRuleCode === data.queryRuleCode &&
                            rowsData.whereClause === data.whereClause && rowsData.fromClause === data.fromClause &&
                            rowsData.orderByClause === data.orderByClause && rowsData.orderByClause === data.orderByClause && rowsData.groupByClause === data.groupByClause
                            && rowsData.dataSourceItemId === data.dataSourceItemId && rowsData.tenantId === data.tenantId&&
                            rowsData.dataSourceId === data.dataSourceId && rowsData.itemValue === data.itemValue && rowsData.isActive=== data.isActive 
                            && rowsData.itemText === data.itemText) {
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

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                var tobeSavedData = {};
                var config = [];
                var ogmDataLoad = formServiceModel.reportDataEntry;
                angular.forEach(ogmDataLoad, function (payload) {                    
                    if (payload["isActive"]) {
                        payload["isActive"] = "f";
                    }
                    else {
                        payload["isActive"] = "t";
                    }
                    var sample = {};
                    sample["dataQueryRuleId"] = payload.dataQueryRuleId === "" ? "" : payload.dataQueryRuleId;
                    sample["queryRuleCode"] = payload.queryRuleCode;
                    sample["selectClause"] = payload.selectClause;
                    sample["whereClause"] = payload.whereClause;
                    sample["fromClause"] = payload.fromClause;
                    sample["orderByClause"] = payload.orderByClause;
                    sample["groupByClause"] = payload.groupByClause;
                    sample["isActive"] = payload.isActive;
                    sample["operationType"] = payload.operationType;
                    sample["tenantDataSourceItems"] = {};
                    sample["tenantDataSourceItems"]["dataSourceItemId"] = payload.dataSourceItemId === "" ? "" : payload.dataSourceItemId;
                    sample["tenantDataSourceItems"]["tenantId"] = payload.tenantId;
                    sample["tenantDataSourceItems"]["dataSourceId"] = payload.dataSourceId;
                    sample["tenantDataSourceItems"]["itemValue"] = payload.itemValue;
                    sample["tenantDataSourceItems"]["isActive"] = payload.isActive;
                    sample["tenantDataSourceItems"]["itemText"] = payload.itemText;
                    sample["tenantDataSourceItems"]["dataQueryRuleId"] = payload.dataQueryRuleId;
                    config.push(sample);
                });
                console.log("Config ", config);
                tobeSavedData["config"] = config;
                return tobeSavedData;
            };
            this.afterSaveAction = function (formServiceModel, parentForm) {
                var datasourcecacheurl = "cache/reload/dataSourceItemContext/secret";
                httpService.get(datasourcecacheurl).then(function (results) {
                    console.log("URL result ", results);
                })
                    var dataqueryrulecacheurl = "cache/reload/dataQueryRuleContext/secret";
                httpService.get(dataqueryrulecacheurl).then(function (results) {
                    console.log("URL result ", results);
                })
            };

            this.addToGrid = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
              
                var dataSourceItemId = sectionDataModel["dataSourceItemId"];
                var dataSourceCode = sectionDataModel["dataSourceCode"];
                var selectClauseField=getFieldByKey("selectClause");
                var selectClause=selectClauseField.getModel();
                var fromClause = sectionDataModel["fromClause"];
                var whereClause = sectionDataModel["whereClause"];
                var orderByClause = sectionDataModel["orderByClause"];
                var groupByClause = sectionDataModel["groupByClause"];
                var tenantId = sectionDataModel["tenantId"];
                var dataSourceId = sectionDataModel["dataSourceId"];
                var itemValue = sectionDataModel["itemValue"];
                var itemText = sectionDataModel["itemText"];
                var dataQueryRuleId = sectionDataModel["dataQueryRuleId"];
                var queryRuleCode = sectionDataModel["queryRuleCode"];
                var activeFlag = true;
                var operationType;
                if (dataSourceItemId === "") {
                    operationType = "INSERT";
                }
                else {
                    operationType = "UPDATE";
                }
                var reportConfigGrid = this.form.getFieldByModelKey("reportDataEntry");
                var gridApi = reportConfigGrid.gridOptions.api;
                var gridColumns = reportConfigGrid.gridConfig.columns;

                var rowDataItem = [];
                console.log("add to grid");
                if (selectClause && orderByClause && groupByClause  && itemValue && itemText) {

                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                    var existRowData = _.filter(filterRowsData, function (filterRowData) {
                        var isExists = true;

                        if (filterRowData.selectClause === selectClause || filterRowData.fromClause === fromClause||filterRowData.orderByClause === orderByClause
                            || filterRowData.groupByClause === groupByClause||filterRowData.itemValue === itemValue||filterRowData.itemText === itemText) {
                            isExists = true;
                            swal({
                                text: "Data already exists in the grid. Please add with different data!",
                                icon: "info",
                                button: "Okay"
                            });
                        }
                        else {
                            isExists = false;
                        }
                        return isExists;

                    });
                   
                    if (existRowData.length === 0) {
                        rowDataItem.push({
                            operationType: operationType,
                            dataSourceItemId: dataSourceItemId,
                            dataSourceCode:dataSourceCode,
                            selectClause: selectClause,
                            fromClause: fromClause,
                            whereClause: whereClause,
                            orderByClause: orderByClause,
                            groupByClause: groupByClause,
                            tenantId:tenantId,
                            dataSourceId: dataSourceId,
                            itemValue: itemValue,
                            itemText: itemText,
                            dataQueryRuleId: dataQueryRuleId,
                            queryRuleCode: queryRuleCode,
                            activeFlag: activeFlag
                        }); 
                    }
                        
                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                console.log("rowDataItem=", rowDataItem);
                gridApi.updateRowData({ add: rowDataItem });
                    if (parentForm.getScreenMode() === "ADD")
                {
                     var fieldModelKeysToReset = [];
                }
                    else
               {
                var fieldModelKeysToReset = [];
               }
                angular.forEach(fieldModelKeysToReset, function (modelKey, ind) {
                    var field = getFieldByKey(modelKey);
                    if (field.fieldType === "dropdown") {
                        if (field.ismultiple) {
                            field.options = [];
                            field.reset();
                            field.modelValue = null;
                        }
                        else {
                            field.modelValue = [];
                        }
                    }
                    else if (field.fieldType === "hidden") {
                        field.modelValue = "";
                    }
                    else if (field.fieldType === "number") {
                        field.modelValue = null;
                    }
                    else if (field.fieldType === "textbox") {
                        field.modelValue = null;
                    }
                    else if (field.fieldType === "textarea") {
                        field.modelValue = null;
                    }
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
        return reportByService;
    });

    return angularAMD;
});