define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('budgetEntryService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams) {

        function budgetEntryService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {
               
                form = form || self.form;
                
                if (form.screenMode === "ADD") {
                    var corporationID = localPersistenceService.get("corpId", true);
                    var hostID = localPersistenceService.get("hostNo", true);
                    var reportType = localPersistenceService.get("reportType", true);
                    var reportName = localPersistenceService.get("reportName", true);

                    var corporationField = form.getFieldByModelKey("corpId");
                    var reportTypeField = form.getFieldByModelKey("reportType");
                    var hostField = form.getFieldByModelKey("hostNo");
                    var reportNameField = form.getFieldByModelKey("reportName");

                    if (corporationID !== null) {
                        corporationField.modelValue = corporationID;
                    }
                    else {
                        corporationField.disabled = false;
                    }
                    if (hostID !== null) {
                        hostField.modelValue = hostID;
                    }
                    else {
                        hostField.disabled = false;
                    }
                    if (reportType !== null) {
                        reportTypeField.modelValue = reportType;
                    }
                    else {
                        reportTypeField.disabled = false;
                    }
                    if (reportName !== null) {
                        reportNameField.modelValue = reportName;
                    }
                    else {
                        reportNameField.disabled = false;
                    }

                    var breedTypeField = form.getFieldByModelKey("breedType");
                    var locTypeField = form.getFieldByModelKey("locType");
                    var meetTypeField = form.getFieldByModelKey("meetType");
                    var locNoField = form.getFieldByModelKey("locNoType");

                    breedTypeField.modelValue = "breed_type_id";
                    locTypeField.modelValue = "loc_type_id";
                    meetTypeField.modelValue = "meet_type_id";
                    locNoField.modelValue = "loc_no";

                    var customerGLcode = this.form.getFieldByModelKey("customerGLcode");
                    
                    if (reportType === "Budget") {
                        customerGLcode.show = false;
                    } else {
                        customerGLcode.show = true;
                    }
                }
                return false;
            };           
            
            this.corporationDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("corpId", sourceField.modelValue, true);
            };
            
            this.hostDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("hostNo", sourceField.modelValue, true);
            };

            this.reportTypeDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("reportType", sourceField.modelValue, true);
            };

            this.reportNameDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("reportName", sourceField.modelValue, true);
            };
            this.getUpdatedRowData = function (gridData, data) {

                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.Id === data.Id) {
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

                var reportConfig = this.form.getFieldByModelKey("reportConfig");
                var gridApi = reportConfig.gridOptions.api;
                var gridColumns = reportConfig.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);

                if (parentForm.getScreenMode() === "ADD") {
                    var rowData = _.filter(rowsData, function (rowsData) {
                        var isExists = true;
                        if (rowsData.corpId === data.corpId && rowsData.hostNo === data.hostNo &&
                            rowsData.reportName === data.reportName && rowsData.columnHeader === data.columnHeader && rowsData.tableColumm === data.tableColumm
                            && rowsData.criteria === data.criteria && rowsData.breedTypeId === data.breedTypeId &&
                            rowsData.locNo === data.locNo && rowsData.locTypeId === data.locTypeId && rowsData.meetTypeId === data.meetTypeId) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (parentForm.getScreenMode() === "EDIT") {
                    if (data.Id === "" || data.Id === undefined) {
                        rowData = _.filter(rowsData, function (rowsData) {
                            var isExists = true;
                            if (rowsData.corpId === data.corpId && rowsData.hostNo === data.hostNo &&
                                rowsData.reportName === data.reportName && rowsData.columnHeader === data.columnHeader && rowsData.tableColumm === data.tableColumm
                                && rowsData.criteria === data.criteria && rowsData.breedTypeId === data.breedTypeId &&
                                rowsData.locNo === data.locNo && rowsData.locTypeId === data.locTypeId && rowsData.meetTypeId === data.meetTypeId) {
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
                var reportConfig = [];
                var reportConfigLoad = formServiceModel.reportConfig;
                angular.forEach(reportConfigLoad, function (payload) {
                    if (payload["isActive"]) {
                        payload["isActive"] = "t";
                    }
                    else {
                        payload["isActive"] = "f";
                    }
                    reportConfig.push(payload);
                });
                tobeSavedData.reportConfig = reportConfig;
                return tobeSavedData;
            };

            this.addToGrid = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var typeModelValue = [];
                var conditionModelValues = [];
                var valueModelValue = [];
                var fieldToGetModelValue = ["breedType", "breedTypeCondition", "breedTypeId", "locType", "locTypeCondition", "locTypeId", "meetType", "meetTypeCondition", "meetTypeId", "locNoType", "locNoTypeCondition", "locNo"];
                angular.forEach(fieldToGetModelValue, function (modelKey, index) {
                    var field = getFieldByKey(modelKey);
                    if (field.title === "Criteria Type") {
                        typeModelValue.push(field.modelValue);
                    }
                    else if (field.title === "Condition") {
                        conditionModelValues.push(field.modelValue);
                        if (field.modelValue === "in" || field.modelValue === "not in") {
                            self.needParantisis = true;
                        }
                    }
                    else if (field.title === "Value") {
                        if (self.needParantisis) {
                            valueModelValue.push("( " + field.modelValue + " )");
                            self.needParantisis = false;
                        }
                        else {
                            valueModelValue.push(field.modelValue);
                        }

                    }
                });
                
                var updateCriteria = [];
                var final = null;
                for (var i = 0; i < 4; i++) {
                    if (typeModelValue[i] !== "" && conditionModelValues[i] !== "" && valueModelValue[i] !== "") {
                        if (conditionModelValues[i] !== undefined && valueModelValue[i] !== undefined) {

                            var update = typeModelValue[i] + " " + conditionModelValues[i] + " " + valueModelValue[i];
                            updateCriteria.push(update);
                        }
                    }
                }

                for (var j = 0; j < updateCriteria.length; j++) {
                    if (final === null) {
                        final = updateCriteria[j];
                    }
                    else {
                        final = final + " and " + updateCriteria[j];
                    }
                }
                var criteriaField = getFieldByKey("criteria");
                criteriaField.modelValue = final;                

                var columnName = sectionDataModel["columnHeader"];
                var tableColumm = sectionDataModel["tableColumm"];
                var reportType = sectionDataModel["reportType"];
                var criteria = criteriaField.modelValue;
                var reportName = sectionDataModel["reportName"];
                var corpId = sectionDataModel["corpId"];
                var hostNo = sectionDataModel["hostNo"];
                var isActive = sectionDataModel["isActive"];

                if (isActive) {
                    isActive = 't';
                }
                else {
                    isActive ='f';
                }
                
                var breedType = sectionDataModel["breedType"];
                var breedTypeCondition = sectionDataModel["breedTypeCondition"];
                var breedTypeId = sectionDataModel["breedTypeId"];

                var locType = sectionDataModel["locType"];
                var locTypeCondition = sectionDataModel["locTypeCondition"];
                var locTypeId = sectionDataModel["locTypeId"];

                var meetType = sectionDataModel["meetType"];
                var meetTypeCondition = sectionDataModel["meetTypeCondition"];
                var meetTypeId = sectionDataModel["meetTypeId"];

                var locNoType = sectionDataModel["locNoType"];
                var locNoTypeCondition = sectionDataModel["locNoTypeCondition"];
                var locNo = sectionDataModel["locNo"];

                var id = sectionDataModel["Id"];

                if (parentForm.screenMode === "EDIT") {
                    if (id !== "") {
                        var serialIdField = getFieldByKey("Id");
                        serialIdField.modelValue = "";
                        
                    }
                }

                var operationType;
                if (id === "") {
                    operationType = "INSERT";
                }
                else {
                    operationType = "UPDATE";
                }

                var corpField = this.form.getFieldByModelKey("corpId");
                var hostField = this.form.getFieldByModelKey("hostNo");
                var corpName = corpField.getSelectedText();
                var hostName = hostField.getSelectedText();

                var reportConfigGrid = this.form.getFieldByModelKey("reportConfig");
                var gridApi = reportConfigGrid.gridOptions.api;
                var gridColumns = reportConfigGrid.gridConfig.columns;

                var rowDataItem = [];
                console.log("add to grid");
                if (columnName && tableColumm && reportName && corpId && hostNo && reportType) {

                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                    var existRowData = _.filter(filterRowsData, function (filterRowData) {
                        var isExists = true;

                        if (filterRowData.columnHeader === columnName) {
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
                            Id: id,
                            corpId: corpId,
                            corporationName: corpName,
                            hostNo: hostNo,
                            hostName: hostName,
                            reportName: reportName,
                            reportType: reportType,
                            columnHeader: columnName,
                            tableColumm: tableColumm,
                            criteria: criteria,
                            breedType: breedType,
                            breedTypeCondition: breedTypeCondition,
                            breedTypeId: breedTypeId,
                            locNoType: locNoType,
                            locNoTypeCondition: locNoTypeCondition,
                            locNo: locNo,
                            isActive: isActive,
                            locType: locType,
                            locTypeCondition: locTypeCondition,
                            locTypeId: locTypeId,
                            meetType: meetType,
                            meetTypeCondition: meetTypeCondition,
                            meetTypeId: meetTypeId
                        }); 
                    }
                        
                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                console.log("rowDataItem=", rowDataItem);
                gridApi.updateRowData({ add: rowDataItem });
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
        return budgetEntryService;
    });

    return angularAMD;
});