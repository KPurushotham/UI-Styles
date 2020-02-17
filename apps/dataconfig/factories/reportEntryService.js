define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('reportEntryService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService,modelUtilService, localPersistenceService, Notification, httpService, $q, $stateParams,fieldService) {

        function reportEntryService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {
               
                form = form || self.form;
                var pattern = form.currentMenuDefinition.pattern; 
                if (form.screenMode === "ADD") {
                    var corporationID = localPersistenceService.get("corpId", true);
                    var hostID = localPersistenceService.get("hostNo", true);
                    var hostGroupID = localPersistenceService.get("hostGroupId", true);
                    var corporationField = form.getFieldByModelKey("corpId");
                    var hostField = form.getFieldByModelKey("hostNo");
                    var hostGroupField = form.getFieldByModelKey("hostGroupId");


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
                    if ( hostGroupID !== null) {
                        hostGroupField.modelValue = hostGroupID;
                    }
                    else {
                        hostGroupField.disabled = false;
                    }
                } 
                return false;
            };  
            this.getUpdatedRowData = function (gridData, data) {

                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.rptElementId === data.rptElementId) {
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
            this.hostDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("hostNo", sourceField.modelValue, true);
                var hostGroupField = fieldService.getFieldDataByModelKey(parentForm.sections[0].rowDivisions[0].columns, "hostGroupId");
                var corpField = fieldService.getFieldDataByModelKey(parentForm.sections[0].rowDivisions[0].columns, "corpId");
                var url = "vdi/webportal/reports/hostgroups/one?hostNo=" + sourceField.modelValue;
                var url1 = "vdi/webportal/reports/host/corp?hostNo=" + sourceField.modelValue;
                httpService.get(url).then(function (results) {
                    if (results.status === 200) {
                        var dataset = results.data.dataset || [];
                        hostGroupField.options = modelUtilService.formatResultDataForOptions(dataset, hostGroupField.dataConfig.displayKey, hostGroupField.dataConfig.valueKey);
                        hostGroupField.isLoaded = true;
                    }
                });
                httpService.get(url1).then(function (results) {
                    if (results.status === 200) {
                        var dataset = results.data.dataset || [];
                        corpField.options = modelUtilService.formatResultDataForOptions(dataset, corpField.dataConfig.displayKey, corpField.dataConfig.valueKey);
                        corpField.isLoaded = true;
                    }
                });
            };
            this.corporationDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("corpId", sourceField.modelValue, true);
            };
            this.hostGroupDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("hostGroupId", sourceField.modelValue, true);
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
                            rowsData.hostGroupId === data.hostGroupId && rowsData.reportLabel === data.reportLabel&&
                            rowsData.elementLabel === data.elementLabel && rowsData.seqNo === data.seqNo && rowsData.elementString === data.elementString) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (parentForm.getScreenMode() === "EDIT") {
                    if (data.rptElementId === "" || data.rptElementId === undefined) {
                        rowData = _.filter(rowsData, function (rowsData) {
                            var isExists = true;
                            if (rowsData.corpId === data.corpId && rowsData.hostNo === data.hostNo &&
                                rowsData.hostGroupId === data.hostGroupId && rowsData.reportLabel === data.reportLabel&&
                                rowsData.elementLabel === data.elementLabel && rowsData.seqNo === data.seqNo && rowsData.elementString === data.elementString) {
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
                    if (payload["activeFlag"]) {
                        payload["activeFlag"] = "Y";
                    }
                    else {
                        payload["activeFlag"] = "N";
                    }
                    reportConfig.push(payload);
                });
                tobeSavedData.reportConfig = reportConfig;
                return tobeSavedData;
            };

            this.addToGrid = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
              
                var rptElementId = sectionDataModel["rptElementId"];
                var hostGroupId = sectionDataModel["hostGroupId"];
                var corpId = sectionDataModel["corpId"];
                var hostNo = sectionDataModel["hostNo"];
                var reportLabel = sectionDataModel["reportLabel"];
                var elementLabel = sectionDataModel["elementLabel"];
                var seqNo = sectionDataModel["seqNo"];
                var elementString = sectionDataModel["elementString"];
                var activeFlag = true;

                var operationType;
                if (rptElementId === "") {
                    operationType = "INSERT";
                }
                else {
                    operationType = "UPDATE";
                }
                var reportConfigGrid = this.form.getFieldByModelKey("reportConfig");
                var gridApi = reportConfigGrid.gridOptions.api;
                var gridColumns = reportConfigGrid.gridConfig.columns;

                var rowDataItem = [];
                console.log("add to grid");
                if (hostGroupId && corpId && hostNo && reportLabel && elementLabel && seqNo) {

                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                    var existRowData = _.filter(filterRowsData, function (filterRowData) {
                        var isExists = true;

                        if (filterRowData.elementString === elementString||filterRowData.seqNo === seqNo||filterRowData.elementLabel === elementLabel) {
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
                            rptElementId: rptElementId,
                            hostGroupId: hostGroupId,
                            corpId: corpId,
                            hostNo: hostNo,
                            reportLabel: reportLabel,
                            elementLabel: elementLabel,
                            seqNo:seqNo,
                            elementString: elementString,
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
                     var fieldModelKeysToReset = ["rptElementId", "elementLabel", "seqNo","elementString"];
                }
                    else
               {
                var fieldModelKeysToReset = ["hostGroupId", "corpId", "hostNo","rptElementId", "reportLabel", "elementLabel", "seqNo","elementString","activeFlag"];
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
        return reportEntryService;
    });

    return angularAMD;
});