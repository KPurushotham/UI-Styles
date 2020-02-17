define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('distributionService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, overlay) {

        function distributionService(form, menuDefinition) {
            var self = this;
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.setScreenMode = function (screenMode) {
                this.form.setScreenMode(screenMode);
                var corpDistField = this.form.getFieldByModelKey("corpDist");
                corpDistField.setGridModeByScreenMode();
                corpDistField.gridOptions.api.redrawRows();
            };

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                var tobeSavedData = {};
                var corpDist = [];
                var corpDistPayload = formServiceModel.corpDist;

                angular.forEach(corpDistPayload, function (payload) {
                    if (payload["corpDistFlag"]) {
                        payload["corpDistFlag"] = "t";
                    }
                    else {
                        payload["corpDistFlag"] = "f";
                    }
                    corpDist.push(payload);
                });
                tobeSavedData.distributionCode = formServiceModel.distributionCode;
                tobeSavedData.distributionName = formServiceModel.distributionName;
                tobeSavedData.corpDist = corpDist;
                return tobeSavedData;
            };

            this.runValidations = function (formServiceModel, operationType, parentForm) {
                var self = this;
                var defer = $q.defer();
                console.log("Validation Fired=", formServiceModel, operationType);
                var isValid = false;
                var regex = /^[a-zA-Z0-9\\s ]*$/;
                // var regex =  /^[a-zA-Z0-9]*$/;

                var distCode = formServiceModel.distributionCode;
                var distName = formServiceModel.distributionName;
                var corpDist = formServiceModel.corpDist;

                if (regex.test(distCode) && regex.test(distName)) {

                    if (distCode === "" || distName === "" || corpDist.length === 0) {
                        isValid = false;
                        overlay.hide();
                        Notification.error({
                            message: "Distribution Code, Distribution Name and grid fields are required.",
                            title: 'REQUIRED FIELDS',
                            delay: 5000
                        });
                    }
                    else {
                        if (operationType !== "EDIT") {
                            var url = 'vdi/hostfees/distributions/code/getone?distributionCode=' + angular.uppercase(formServiceModel.distributionCode);
                            httpService.get(url).then(function (results) {
                                if (results.status === 200) {
                                    if (results.data.dataset.length === 0) {
                                        isValid = true;
                                    }
                                    else {
                                        isValid = false;
                                        overlay.hide();
                                        Notification.error({
                                            message: "Distribution Code Already exists.",
                                            title: 'REQUIRED FIELDS',
                                            delay: 5000
                                        });
                                    }                                    
                                }
                                defer.resolve(isValid);                              
                            });
                        }
                        else {
                            isValid = true;
                            defer.resolve(isValid);
                        }
                    }
                }
                else {
                    isValid = false;
                    overlay.hide();
                    Notification.error({
                        message: "Special characters are not allowed in Distribution Code & Distribution Name",
                        title: 'REQUIRED FIELDS',
                        delay: 5000
                    });
                }
                return defer.promise;
            };

            this.getUpdatedRowData = function (gridData, data) {

                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.id === data.id) {
                        if (data.corpDistFlag === true) {
                            gridData.corpDistFlag = false;
                        }
                        else {
                            gridData.corpDistFlag = true;
                        }
                    }
                });
                return gridData;
            };

            this.deleteFromGrid = function (data, parentForm) {
                var corpDist = this.form.getFieldByModelKey("corpDist");
                var gridApi = corpDist.gridOptions.api;
                var gridColumns = corpDist.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);
                var rowData;

                if (parentForm.getScreenMode() === "ADD") {
                    rowData = _.filter(rowsData, function (filterRowData) {
                        var isExists = true;
                        if (filterRowData.corpName === data.corpName && filterRowData.beginDate === data.beginDate && filterRowData.endDate === data.endDate) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (parentForm.getScreenMode() === "EDIT") {

                    if (data.id === "" || data.id === undefined) {
                        rowData = _.filter(rowsData, function (filterRowData) {
                            var isExists = true;
                            if (filterRowData.corpName === data.corpName && filterRowData.beginDate === data.beginDate && filterRowData.endDate === data.endDate) {
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

                var corpNames = sectionDataModel["corpName"];
                var beginDate = sectionDataModel["beginDate"];
                var endDate = sectionDataModel["endDate"];
                var id = "";
                var isActive = true;
                var distributionEntityId = $stateParams.entityId;
                var corpDist = this.form.getFieldByModelKey("corpDist");
                var gridApi = corpDist.gridOptions.api;
                var gridColumns = corpDist.gridConfig.columns;

                var isBetween = function (n, a, b) {
                    return (n - a) * (n - b) <= 0;
                };

                var rowDataItem = [];
                console.log("add to grid");
                if (corpNames && beginDate && endDate) {

                    var beginDateTimeStamp = dateUtilService.convertToTimeStamp(beginDate);
                    var endDateTimeStamp = dateUtilService.convertToTimeStamp(endDate);
                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                    angular.forEach(corpNames, function (item, key) {

                        if (beginDateTimeStamp <= endDateTimeStamp) {

                            var existRowData = _.filter(filterRowsData, function (filterRowData) {
                                var isExists = true;

                                if (filterRowData.corpName === item.text) {
                                    var rowItemBeginDateTimeStamp = dateUtilService.convertToTimeStamp(filterRowData.beginDate);
                                    var rowItemEndDateTimeStamp = dateUtilService.convertToTimeStamp(filterRowData.endDate);

                                    if (isBetween(beginDateTimeStamp, rowItemBeginDateTimeStamp, rowItemEndDateTimeStamp)
                                        || isBetween(endDateTimeStamp, rowItemBeginDateTimeStamp, rowItemEndDateTimeStamp)
                                        || isBetween(rowItemBeginDateTimeStamp, beginDateTimeStamp, endDateTimeStamp)
                                        || isBetween(rowItemEndDateTimeStamp, beginDateTimeStamp, endDateTimeStamp)) {
                                        swal({
                                            text: "Criteria with selected Begin & End Date Range already in Grid. Please select a different Date Range!",
                                            icon: "info",
                                            button: "Okay"
                                        });

                                        isExists = true;

                                    } else {
                                        isExists = false;
                                    }

                                }
                                else {
                                    isExists = false;
                                }

                                return isExists;
                            });
                        }
                        else {
                            swal({
                                text: "Begin Date & End Date should be in proper range. Please select different date range!",
                                icon: "info",
                                button: "Okay"
                            });

                        }
                        console.log("existRowData", existRowData);
                        if (existRowData && existRowData.length === 0) {
                            rowDataItem.push({
                                operationType: "INSERT",
                                id: id,
                                corpEntityId: item.value,
                                corpName: item.text,
                                beginDate: beginDate,
                                endDate: endDate,
                                distributionEntityId: distributionEntityId,
                                corpDistFlag: isActive
                            });
                        }
                    });
                }
                else {
                    swal({
                        text: "Please fill all the fields!",
                        icon: "info",
                        button: "Okay"
                    });

                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                console.log("rowDataItem=", rowDataItem);
                gridApi.updateRowData({ add: rowDataItem });
            };

        };
        return distributionService;
    });

    return angularAMD;
});