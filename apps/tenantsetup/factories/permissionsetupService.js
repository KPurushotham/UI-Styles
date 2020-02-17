define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('permissionsetupService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification,modelUtilService, localPersistenceService, httpService, $q, $stateParams, tenantService, $timeout, fieldService) {

        function permissionsetupService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;

            this.showInEditMode = function (currentForm) {
                var self = this;
            };

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var pattern = form.currentMenuDefinition.pattern;

                var applicationDropdownModelValue = localPersistenceService.get("permissionsetupAppId", true);
                var tenantDropdownModelValue = localPersistenceService.get("permissionsetupTenantId", true);

                var auth = localPersistenceService.get("auth", true);
                var loginTenantId = auth.loginTenantId;

                var subTenantsUrl = "vdi/admin/tenant/relation/one?parentTenantId=" + loginTenantId;

                httpService.get(subTenantsUrl).then(function (results) {

                    var dataset = results.data.dataset || [];
                    console.log("dataset ", dataset);
                    var matchedOptions = [];

                    if (pattern === "FORM") {

                        var tenantField = form.getFieldByModelKey("tenantId");
                        var appField = form.getFieldByModelKey("applicationEntityId");
                        var roleField = form.getFieldByModelKey("roleId");

                        if (form.screenMode === "VIEW" || form.screenMode === "EDIT") {
                            tenantField.disabledInEditMode = true;
                            appField.disabledInEditMode = true;
                            roleField.disabledInEditMode = true;
                        }

                        var formTenantDropdown = form.getFieldByModelKey("tenantId");
                        var formTenantOptions = formTenantDropdown.options;

                        angular.forEach(dataset, function (item, key) {
                            angular.forEach(formTenantOptions, function (option, key) {

                                if (option.value === item.tenantId) {
                                    matchedOptions.push(option);
                                }
                            });
                        });

                        formTenantDropdown.options = matchedOptions;
                        console.log("matchedOptions ", matchedOptions);

                    }
                    else {
                        var criteriaRows = screenDefConfig.criteria.rowDivisions;

                        var listingTenantDropdown = fieldService.getFieldDataByModelKey(criteriaRows[0].columns, "tenantId");
                        var listingApplicationDropdown = fieldService.getFieldDataByModelKey(criteriaRows[0].columns, "applicationEntityId");

                        var listingTenantOptions = listingTenantDropdown.options;

                        angular.forEach(dataset, function (item, key) {
                            angular.forEach(listingTenantOptions, function (option, key) {

                                if (option.value === item.tenantId) {
                                    matchedOptions.push(option);
                                }
                            });
                        });

                        listingTenantDropdown.options = matchedOptions;
                        console.log("matchedOptions ", matchedOptions);

                        //listingTenantDropdown.modelValue = tenantDropdownModelValue;
                        //console.log("Tenant Data ", listingTenantDropdown);
                        //listingApplicationDropdown.modelValue = applicationDropdownModelValue;
                        //console.log("App Data ", listingApplicationDropdown);

                        //$timeout(function () {
                        //    angular.element('#get-result').triggerHandler('click');
                        //}, 0);
                    }

                });                

                return false;
            };

            this.tenantDropdownListingHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                localPersistenceService.set("tenantId", sourceField.modelValue, true);
                var appField = fieldService.getFieldDataByModelKey(parentForm.sections[0].rowDivisions[0].columns, "applicationEntityId");
                var url = "vdi/admin/tenant/application?tenantId=" + sourceField.modelValue;
                httpService.get(url).then(function (results) {
                    if (results.status === 200) {
                        var dataset = results.data.dataset || [];
                        appField.options = modelUtilService.formatResultDataForOptions(dataset, appField.dataConfig.displayKey, appField.dataConfig.valueKey);
                        appField.isLoaded = true;
                    }
                });

            };

            this.buildDataTobeSubmitted = function (formServiceModel) {
                console.log("formServiceModel=", formServiceModel);
                var tobeSavedData = {};
                var permissionsSave = [];
                var permissionPayload = formServiceModel.permissionsSave;

                angular.forEach(permissionPayload, function (payload) {
                    if (payload["isActive"]) {
                        payload["isActive"] = "t";
                    }
                    else {
                        payload["isActive"] = "f";
                    }
                    permissionsSave.push(payload);
                });
                tobeSavedData.permissionsSave = permissionsSave;
                return tobeSavedData;
            };   

            this.getUpdatedRowData = function (gridData, data) {

                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.serialId === data.serialId) {
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
                var permissionSave = this.form.getFieldByModelKey("permissionsSave");
                var gridApi = permissionSave.gridOptions.api;
                var gridColumns = permissionSave.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);
                var rowData;

                if (parentForm.getScreenMode() === "ADD") {
                    rowData = _.filter(rowsData, function (rowsData) {
                        var isExists = true;
                        if (rowsData.tenantTitle === data.tenantTitle && rowsData.applicationTitle === data.applicationTitle
                            && rowsData.roleName === data.roleName && rowsData.menuKey === data.menuKey) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (parentForm.getScreenMode() === "EDIT") {
                    if ( data.serialId === "" || data.serialId === undefined ) {
                        rowData = _.filter(rowsData, function (rowsData) {
                            var isExists = true;
                            if (rowsData.tenantTitle === data.tenantTitle && rowsData.applicationTitle === data.applicationTitle
                                && rowsData.roleName === data.roleName && rowsData.menuKey === data.menuKey) {
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

                var tenantField = this.form.getFieldByModelKey("tenantId");
                var applicationField = this.form.getFieldByModelKey("applicationEntityId");
                var roleField = this.form.getFieldByModelKey("roleId");

                var serialId = "";
                var menus = sectionDataModel["menuId"];
                var tenantId = sectionDataModel["tenantId"];
                var tenantTitle = tenantField.getSelectedText();
                var applicationEntityId = sectionDataModel["applicationEntityId"];
                var applicationTitle = applicationField.getSelectedText();
                var roleId = sectionDataModel["roleId"];
                var roleName = roleField.getSelectedText();
                var beginDate = "2018/01/01";
                var endDate = "2099/01/01";
                var isActive = true;

                var permissionSave = this.form.getFieldByModelKey("permissionsSave");
                var gridApi = permissionSave.gridOptions.api;
                var gridColumns = permissionSave.gridConfig.columns;

                var rowDataItem = [];

                if (menus && tenantId !== undefined && applicationEntityId && roleId) {

                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                    angular.forEach(menus, function (item, key) {                        

                        var existRowData = _.filter(filterRowsData, function (filterRowData) {
                            var isExists = true;

                            if (filterRowData.menuKey === item.text && filterRowData.tenantTitle === tenantTitle
                                && filterRowData.applicationTitle === applicationTitle && filterRowData.roleName === roleName) {
                                isExists = true;
                                swal({
                                    text: "Selected menus already exists in the grid!",
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
                                serialId: serialId,
                                tenantId: tenantId,
                                tenantTitle: tenantTitle,
                                applicationEntityId: applicationEntityId,
                                applicationTitle: applicationTitle,
                                roleId: roleId,
                                roleName: roleName,
                                menuId: item.value,
                                menuKey: item.text,
                                beginDate: beginDate,
                                endDate: endDate,
                                isActive: isActive
                            });
                        }
                    });
                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                console.log("rowDataItem=", rowDataItem);
                gridApi.updateRowData({ add: rowDataItem });
            };

            this.tenantDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                localPersistenceService.set("permissionsetupTenantId", sourceField.modelValue, true);
                
                form = form || self.form;
                var permissionGrid = this.form.getFieldByModelKey("permissionsSave");
                var applicationField = this.form.getFieldByModelKey("applicationEntityId");
                var roleField = this.form.getFieldByModelKey("roleId");
                var menuField = this.form.getFieldByModelKey("menuId");

                if (this.form.screenMode !== "VIEW") {

                    if (this.form.screenMode === "ADD") {
                        applicationField.reset();
                        roleField.reset();
                        menuField.reset();
                        menuField.options = [];
                    }

                    var url = "vdi/admin/application/permission?tenantId=" + sourceField.modelValue;
                    httpService.get(url).then(function (results) {

                        var dataset = results.data.dataset || [];
                        console.log("dataset ", dataset);
                        permissionGrid.gridOptions.api.setRowData(dataset);

                        if (dataset.length === 0) {
                            form.screenMode = "ADD";
                            form.activePageTitle = "ADD";
                            form.noStateParamsRequired = false;
                        }
                        else {
                            if (form.screenMode === "ADD") {
                                form.screenMode = "EDIT";
                                form.activePageTitle = "EDIT";
                                form.noStateParamsRequired = true;
                            }
                        }

                    });
                }                

            };

            this.applicationDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                localPersistenceService.set("permissionsetupAppId", sourceField.modelValue, true);

                form = form || self.form;
                var permissionGrid = this.form.getFieldByModelKey("permissionsSave");
                var tenantField = this.form.getFieldByModelKey("tenantId");
                var menuField = this.form.getFieldByModelKey("menuId");

                if (this.form.screenMode !== "VIEW") {
                    menuField.reset();
                    menuField.options = [];

                    var url = "vdi/admin/application/menu/permissions/all?tenantId=" + tenantField.modelValue + "&applicationEntityId=" + sourceField.modelValue;
                    httpService.get(url).then(function (results) {

                        var dataset = results.data.dataset || [];
                        console.log("dataset ", dataset);
                        permissionGrid.gridOptions.api.setRowData(dataset);

                        if (dataset.length === 0) {
                            form.screenMode = "ADD";
                            form.activePageTitle = "ADD";
                            form.noStateParamsRequired = false;
                        }
                        else {
                            if (form.screenMode === "ADD") {
                                form.screenMode = "EDIT";
                                form.activePageTitle = "EDIT";
                                form.noStateParamsRequired = true;
                            }
                        }

                    });
                }              
                
            };

            this.roleDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                form = form || self.form;
                var permissionGrid = this.form.getFieldByModelKey("permissionsSave");
                var tenantField = this.form.getFieldByModelKey("tenantId");
                var appField = this.form.getFieldByModelKey("applicationEntityId");

                var url = "vdi/admin/application/menu/permissions/one?tenantId=" + tenantField.modelValue + "&applicationEntityId=" + appField.modelValue + "&roleId=" + sourceField.modelValue;
                httpService.get(url).then(function (results) {

                    var dataset = results.data.dataset || [];
                    console.log("dataset ", dataset);
                    permissionGrid.gridOptions.api.setRowData(dataset);                    

                    if (dataset.length === 0) {
                        form.screenMode = "ADD";
                        form.activePageTitle = "ADD";
                        form.noStateParamsRequired = false;
                    }
                    else {
                        if (form.screenMode === "ADD") {
                            form.screenMode = "EDIT";
                            form.activePageTitle = "EDIT";
                            form.noStateParamsRequired = true;
                        }
                    }

                });

            };

        }
        return permissionsetupService;
    });

    return angularAMD;
});