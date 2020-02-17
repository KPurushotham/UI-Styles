define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'httpService', 'overlay'], function (angularAMD) {
    'use strict';

    angularAMD.factory('adminContractAgentService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, overlay, $q, $stateParams, alasql, localPersistenceService) {

        function adminContractAgentService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.setScreenMode = function (screenMode) {
                this.form.setScreenMode(screenMode);
                var contactPersonsField = this.form.getFieldByModelKey("contactPersons");
                contactPersonsField.setGridModeByScreenMode();
                contactPersonsField.gridOptions.api.redrawRows();
            };

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                var contactPersons = [];

                angular.forEach(formServiceModel.contactPersons, function (contractPerson) {
                    if (contractPerson["tenantId"] !== 0) {
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
                    }
                });
                formServiceModel.contactPersons = contactPersons;
                return formServiceModel;
            };

            this.runValidations = function (formServiceModel, operationType, parentForm) {

                var defer = $q.defer();
                var isValid = false;
                var msg = "";

                var contactPersons = formServiceModel.contactPersons;
                var primaryPersons = alasql('select cp.isPrimary from ? as cp where cp.isPrimary = true or cp.isPrimary = "t"', [contactPersons]);

                if (primaryPersons.length === 0) {
                    msg = "Atleast one person should be primary contact person.";
                    Notification.error({
                        message: msg,
                        title: 'REQUIRED FIELDS',
                        delay: 5000
                    });
                    overlay.hide();
                    defer.resolve(isValid);
                }
                else {
                    isValid = true;
                    defer.resolve(isValid);
                }                
                return defer.promise;
            };

            this.ondbClickHandler = function (gridRowData, rowIndex) {

                var auth = localPersistenceService.get("auth", true);

                var contactPersons = this.form.getFieldByModelKey("contactPersons");
                var gridApi = contactPersons.gridOptions.api;
                var gridColumns = contactPersons.gridConfig.columns;
                var gridData = gridService.getGridData(gridApi, gridColumns);
                if (gridRowData.tenantId === 0) {
                    gridData[rowIndex]["operationType"] = "INSERT";
                    gridData[rowIndex]["contactPersonId"] = gridRowData.serialId;
                    gridData[rowIndex]["serialId"] = "";
                    gridData[rowIndex]["tenantId"] = auth.tenantId;
                }
                gridApi.updateRowData({ update: gridData });
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
                var contactPersonName = sectionDataModel["contactPersonName"];
                var serialId = "";
                var contactPersonId = 0;
                var mobile = sectionDataModel["mobile"];
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
                var contractAgentEntityId = sectionDataModel["contractAgentEntityId"];

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
                            serialId: serialId,
                            contactPersonId: contactPersonId,
                            contractAgentEntityId: contractAgentEntityId,
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
                var fieldModelKeysToReset = ["contactPersonName", "mobile", "email"];
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
        return adminContractAgentService;
    });

    return angularAMD;
});