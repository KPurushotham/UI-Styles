define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'modelUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('dataSourceItemService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, modelUtilService, localPersistenceService, Notification, httpService, $q, $stateParams,fieldService) {

        function dataSourceItemService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var pattern = form.currentMenuDefinition.pattern;
                var tenantID = localPersistenceService.get("listingTenantId", true);
                var dataSourceID = localPersistenceService.get("listingDataSourceId", true);
                if (pattern === "FORM") {

                    if (form.screenMode === "ADD") {
                        var tenantField = form.getFieldByModelKey("tenantId");
                        var dataSourceField = form.getFieldByModelKey("dataSourceId");

                        if (tenantID !== null) {
                            tenantField.modelValue = tenantID;
                        }
                        else {
                            tenantField.disabled = false;
                        }

                        if (dataSourceID !== null) {
                            var url = "vdi/reportConfig/datasource/all?tenantId=" + tenantID;
                            httpService.get(url).then(function (results) {
                                if (results.status === 200) {
                                    var dataset = results.data.dataset || [];
                                    dataSourceField.options = modelUtilService.formatResultDataForOptions(dataset, dataSourceField.dataConfig.displayKey, dataSourceField.dataConfig.valueKey);
                                    dataSourceField.modelValue = dataSourceID;
                                    dataSourceField.isLoaded = true;
                                }
                            });
                        }
                        else {
                            dataSourceField.disabled = false;
                        }

                    }

                    if (form.screenMode === "VIEW" || form.screenMode === "EDIT") {
                        var criteriaType = form.getFieldByModelKey("criteriaType");
                        var condition = form.getFieldByModelKey("condition");
                        var value = form.getFieldByModelKey("value");
                        var criteriaField = getFieldByKey("whereClause");
                        var Query = criteriaField.modelValue;
                        var result;
                        if (Query.includes("and")) {
                            criteriaField.modelValue = Query;
                        }
                        else {
                            if (Query.includes("NOT IN")) {
                                result = Query.split(" NOT IN ");
                                condition.modelValue = "NOT IN";
                            }
                            else {
                                result = Query.split(" IN ");
                                condition.modelValue = "IN";
                            }
                            criteriaType.modelValue = result[0];
                            var k = result[1];
                            var m = k.substring(1, k.length - 1)
                            value.modelValue = m;
                        }

                    }

                }
                else {
                    var criteriaRows = screenDefConfig.criteria.rowDivisions;

                    var tenantDropdown = fieldService.getFieldDataByModelKey(criteriaRows[0].columns, "tenantId");
                    tenantDropdown.modelValue = tenantID;
                    var dataSourceDropdown = fieldService.getFieldDataByModelKey(criteriaRows[0].columns, "dataSourceId");
                    dataSourceDropdown.modelValue = dataSourceID;
                    $timeout(function () {
                       angular.element('#resultsButton').triggerHandler('click');
                    }, 0);
                }
                
                
                return false;
            };
            this.listingTenantDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("listingTenantId", sourceField.modelValue, true);
            };

            this.listingDataSourceDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("listingDataSourceId", sourceField.modelValue, true);

            };

            this.tenantDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                form = form || self.form;
                var dataSourceField = this.form.getFieldByModelKey("dataSourceId");
                if (this.form.screenMode !== "VIEW") {
                    if (this.form.screenMode === "ADD") {
                        dataSourceField.reset();
                    }
                }
            };
            this.formDataSourceDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                console.log("DataSourceField", sourceField.options);
            };
            this.hideColumnsHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var criteriaType = getFieldByKey("criteriaType");
                var condition = getFieldByKey("condition");
                var value = getFieldByKey("value");
                if(sourceField.modelValue===false || sourceField.modelValue === "" || sourceField.modelValue === undefined || sourceField.modelValue === null){                  
                    criteriaType.show=false;
                    condition.show=false;
                    value.show=false;
                }
                else{
                    criteriaType.show=true;
                    condition.show=true;
                    value.show=true;
                }

            };

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                var tobeSavedData = {};
                var config = [];
                var ogmDataLoad = formServiceModel.ogmData;
                angular.forEach(ogmDataLoad, function (payload) {                    
                    if (payload["isActive"]) {
                        payload["isActive"] = "t";
                    }
                    else {
                        payload["isActive"] = "f";
                    }
                    var sample = {};
                    sample["dataQueryRuleId"] = payload.dataQueryRuleId === "" ? null : payload.dataQueryRuleId;
                    sample["queryRuleCode"] = payload.queryRuleCode;
                    sample["whereClause"] = payload.whereClause;
                    sample["isActive"] = payload.isActive;
                    sample["operationType"] = payload.operationType;
                    sample["dataSourceItems"] = {};
                    sample["dataSourceItems"]["tenantDataSourceItemId"] = payload.tenantDataSourceItemId === "" ? null : payload.tenantDataSourceItemId;
                    sample["dataSourceItems"]["tenantId"] = payload.tenantId;
                    sample["dataSourceItems"]["dataSourceId"] = payload.dataSourceId;
                    sample["dataSourceItems"]["itemValue"] = payload.itemValue;
                    sample["dataSourceItems"]["isActive"] = payload.isActive;
                    sample["dataSourceItems"]["itemtext"] = payload.itemtext;
                    sample["dataSourceItems"]["dataQueryRuleId"] = payload.dataQueryRuleId === "" ? null : payload.dataQueryRuleId;
                    config.push(sample);
                });
                console.log("Config ", config);
                tobeSavedData["config"] = config;
                return tobeSavedData;
            };

            this.afterSaveAction = function (formServiceModel, parentForm) {
                var url = "cache/reload/dataSourceItemContext/secret";
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                })
            };

            this.getUpdatedRowData = function (gridData, data) {

                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.dataSourceId === data.dataSourceId) {
                        if (data.isActive === true) {
                            gridData.isActive = false;
                        }
                        else {
                            gridData.isActive = true;
                        }
                    }
                });
                return gridData;
            };
            this.deleteFromGrid = function (data, parentForm) {

                var ogmData = this.form.getFieldByModelKey("ogmData");
                var gridApi = ogmData.gridOptions.api;
                var gridColumns = ogmData.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);

                if (parentForm.getScreenMode() === "ADD") {
                    var rowData = _.filter(rowsData, function (rowsData) {
                        var isExists = true;
                        if (rowsData.tenantId === data.tenantId && rowsData.dataSourceId === data.dataSourceId &&
                            rowsData.itemValue === data.itemValue && rowsData.itemtext === data.itemtext && rowsData.whereClause === data.whereClause) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (parentForm.getScreenMode() === "EDIT") {
                    if (data.tenantDataSourceItemId === "") {
                        rowData = _.filter(rowsData, function (rowsData) {
                            var isExists = true;
                            if (rowsData.tenantId === data.tenantId && rowsData.dataSourceId === data.dataSourceId &&
                                rowsData.itemValue === data.itemValue && rowsData.itemtext === data.itemtext && rowsData.whereClause === data.whereClause) {
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

                var tenantId = sectionDataModel["tenantId"];
                var dataSourceId = sectionDataModel["dataSourceId"];
                var itemValue = sectionDataModel["itemValue"];
                var itemtext = sectionDataModel["itemtext"];
                var queryRuleCode = sectionDataModel["itemtext"];
                var tenantDataSourceItemId = sectionDataModel["tenantDataSourceItemId"];
                var dataQueryRuleId = sectionDataModel["dataQueryRuleId"];
                var criteriaType = sectionDataModel["criteriaType"];
                var condition = sectionDataModel["condition"];
                var value = sectionDataModel["value"];
                var Query = criteriaType + " " + condition + " (" + value + ")";
                var criteriaField = getFieldByKey("whereClause");
                var whereClause;
                if (Query === "  ()" || Query === "undefined undefined (undefined)") {
                    whereClause = sectionDataModel["whereClause"];
                }
                else {
                    criteriaField.modelValue = Query;
                    whereClause = criteriaField.modelValue;
                }
                var isActive = true;
                var ogmData = this.form.getFieldByModelKey("ogmData");
                var gridApi = ogmData.gridOptions.api;
                var gridColumns = ogmData.gridConfig.columns;          

                var operationType;
                if (tenantDataSourceItemId === "") {
                    operationType = "INSERT";
                }
                else {
                    operationType = "UPDATE";
                }

                var rowDataItem = [];
                console.log("add to grid");
                if (dataSourceId && itemValue && itemtext) {

                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                    var existRowData = _.filter(filterRowsData, function (filterRowData) {
                        var isExists = true;

                        if (filterRowData.itemtext === itemtext) {
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
                            tenantId: tenantId,
                            dataSourceId: dataSourceId,
                            itemValue: itemValue,
                            itemtext: itemtext,
                            dataQueryRuleId: dataQueryRuleId,
                            queryRuleCode:queryRuleCode,
                            tenantDataSourceItemId: tenantDataSourceItemId,
                            whereClause: whereClause,
                            criteriaType: criteriaType,
                            condition: condition,
                            value: value,
                            isActive: isActive
                        });
                    }

                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                console.log("rowDataItem=", rowDataItem);
                gridApi.updateRowData({ add: rowDataItem });                
                    
                var fieldModelKeysToReset = ["itemValue", "itemtext", "criteriaType", "condition", "value", "whereClause","dataQueryRuleId","tenantDataSourceItemId"];
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
        return dataSourceItemService;
    });

    return angularAMD;
});