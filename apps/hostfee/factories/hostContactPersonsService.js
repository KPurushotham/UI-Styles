define(['angularAMD', 'utilService', 'gridService', 'ngHandsontable', 'alaSqlExtensions', 'httpService', 'authService', 'localPersistenceService', 'modalPopUpService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('hostContactPersonsService', function ($filter, $q, $timeout, alasql, utilService, gridService, hotRegisterer, $window, constants,
        dateUtilService, httpService, overlay, authService, localPersistenceService, $stateParams, Notification, $rootScope, $state, fieldService, modalPopUpService) {

        function hostContactPersonsService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.afterLoad = function (form, screenDefConfig) {
                form = form || self.form;
            };

            this.setScreenMode = function (screenMode) {
                this.form.setScreenMode(screenMode);
                if (screenMode !== "ADD") {
                    var contactPersonsField = this.form.getFieldByModelKey("contactPersons");
                    contactPersonsField.setGridModeByScreenMode();
                    contactPersonsField.gridOptions.api.redrawRows();
                }
            };

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                var contactPersons = [];

                angular.forEach(formServiceModel.contactPersons, function (contractPerson) {
                    if (contractPerson["isPrimary"]) {
                        contractPerson["isPrimary"] = "t";
                    }
                    else {
                        contractPerson["isPrimary"] = "f";
                    }
                    if (contractPerson["contactPersonEmail"] === "") {
                        contractPerson["contactPersonEmail"] = null;
                    }
                    if (contractPerson["mobile"] === "") {
                        contractPerson["mobile"] = null;
                    }
                    contactPersons.push(contractPerson);
                });
                formServiceModel.contactPersons = contactPersons;
                return formServiceModel;
            };

            this.isPrimaryHandler = function (data, parentForm) {
                if (parentForm.screenMode !== "VIEW") {
                    var contactPersons = this.form.getFieldByModelKey("contactPersons");
                    var gridApi = contactPersons.gridOptions.api;
                    var gridColumns = contactPersons.gridConfig.columns;
                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);
                    var rowData = angular.forEach(filterRowsData, function (filterRowsData) {
                        if (filterRowsData.contactPersonName === data.contactPersonName && filterRowsData.mobile === data.mobile && filterRowsData.contactPersonEmail === data.contactPersonEmail
                            && filterRowsData.isPrimary === data.isPrimary) {
                            filterRowsData.isPrimary = true;
                        }
                        else {
                            filterRowsData.isPrimary = false;
                        }
                        return filterRowsData;
                    });
                    gridApi.updateRowData({ update: rowData });
                }
            };

            this.deleteFromGrid = function (data, parentForm) {
                var contactPersons = this.form.getFieldByModelKey("contactPersons");
                var gridApi = contactPersons.gridOptions.api;
                var gridColumns = contactPersons.gridConfig.columns;
                var filterRowsData = gridService.getGridData(gridApi, gridColumns);
                var rowData = _.filter(filterRowsData, function (filterRowData) {
                    var isExists = true;
                    if (filterRowData.contactPersonName === data.contactPersonName && filterRowData.mobile === data.mobile && filterRowData.contactPersonEmail === data.contactPersonEmail) {
                        isExists = false;
                    }
                    return isExists;
                });
                gridApi.setRowData(rowData);
            };

            this.addToGrid = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var contactPersonName = sectionDataModel["cpName"];
                var contactPersonEntityId = "";
                var mobile = sectionDataModel["phoneno"];
                if (mobile === null || mobile === undefined || mobile === "") {
                    mobile = null;
                }
                else {
                    mobile = mobile.toString();
                }
                var contactPersonEmail = sectionDataModel["email"];
                if (contactPersonEmail === null || contactPersonEmail === undefined || contactPersonEmail === "") {
                    contactPersonEmail = null;
                }
                var hostEntityId = sectionDataModel["hostEntityId"];

                var contactPersons = this.form.getFieldByModelKey("contactPersons");
                var gridApi = contactPersons.gridOptions.api;
                var gridColumns = contactPersons.gridConfig.columns;

                var rowDataItem = [];
                if (contactPersonName !== undefined) {

                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);
                    var existRowData = _.filter(filterRowsData, function (filterRowData) {
                        var isExists = true;
                        if (filterRowData.contactPersonName === contactPersonName || (filterRowData.mobile === mobile && mobile !== null)
                            || filterRowData.contactPersonEmail === contactPersonEmail && contactPersonEmail !== null) {
                            isExists = true;
                            swal({
                                text: "Contact Person Details already exists in the grid!",
                                icon: "info",
                                button: "Okay"
                            });
                        }
                        else {
                            isExists = false;
                        }
                        return isExists;
                    });

                    if (existRowData && existRowData.length === 0) {
                        rowDataItem.push({
                            operationType: "INSERT",
                            contactPersonEntityId: contactPersonEntityId,
                            hostEntityId: hostEntityId,
                            contactPersonName: contactPersonName,
                            mobile: mobile,
                            contactPersonEmail: contactPersonEmail,
                            isPrimary: false
                        });
                        resetAllFieldsAfterAddingToGrid();
                    }
                    parentForm.df_form.$setDirty();
                    parentForm.df_form.$setSubmitted();
                    console.log("rowDataItem=", rowDataItem);
                    gridApi.updateRowData({ add: rowDataItem });
                }
                else {
                    swal({
                        text: "Contract Person Name is mandatory, please fill!",
                        icon: "info",
                        button: "Okay"
                    });
                }
            };

            var resetAllFieldsAfterAddingToGrid = function () {
                var fieldModelKeysToReset = ["cpName", "phoneno", "email"];
                angular.forEach(fieldModelKeysToReset, function (modelKey, ind) {
                    var field = getFieldByKey(modelKey);
                    if (field.fieldType === "textbox" || field.fieldType === "number" || field.fieldType === "email") {
                        field.modelValue = "";
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
        return hostContactPersonsService;
    });

    return angularAMD;
});
