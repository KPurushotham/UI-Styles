define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('rolesetupService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, localPersistenceService, httpService, $q, $stateParams, tenantService, $timeout, fieldService) {

        function rolesetupService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var pattern = form.currentMenuDefinition.pattern;

                var tenantDropdownModelValue = localPersistenceService.get("rolesetupTenantId", true);

                var auth = localPersistenceService.get("auth", true);
                var loginTenantId = auth.loginTenantId;

                var subTenantsUrl = "vdi/admin/tenant/relation/one?parentTenantId=" + loginTenantId;

                httpService.get(subTenantsUrl).then(function (results) {

                    var dataset = results.data.dataset || [];
                    console.log("dataset ", dataset);
                    var matchedOptions = [];

                    if (pattern === "FORM") {

                        var formTenantDropdown = form.getFieldByModelKey("tenantId");

                        if (form.screenMode === "VIEW" || form.screenMode === "EDIT") {
                            formTenantDropdown.disabledInEditMode = true;
                        }

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

                        //$timeout(function () {
                        //    angular.element('#get-result').triggerHandler('click');
                        //}, 0);
                    }

                });               

                return false;
            };

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                var tobeSavedData = {};
                var roleSave = [];
                var rolePayload = formServiceModel.roleSave;

                angular.forEach(rolePayload, function (payload) {
                    if (payload["isActive"]) {
                        payload["isActive"] = "t";
                    }
                    else {
                        payload["isActive"] = "f";
                    }
                    roleSave.push(payload);
                });
                tobeSavedData.roleSave = roleSave;
                return tobeSavedData;
            };

            this.addDefaultRoles = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var tenantId = sectionDataModel["tenantId"];
                var tenantRole = this.form.getFieldByModelKey("roleSave");
                var gridApi = tenantRole.gridOptions.api;
                var gridColumns = tenantRole.gridConfig.columns;

                if (sourceField.modelValue) {

                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);
                    var rowData = _.filter(filterRowsData, function (filterRowData) {
                        var isExists = true;
                        if ((filterRowData.roleCode === "APP_USER" || filterRowData.roleCode === "PLATFORM_USER") &&
                            (filterRowData.roleName === "Application User" || filterRowData.roleName === "Platform User") &&
                            (filterRowData.description === "Application User" || filterRowData.description === "Platform User")) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (sourceField.modelValue === "" || sourceField.modelValue === false || sourceField.modelValue === undefined) {

                    var defaultRoles = [
                        {
                            "roleId": "",
                            "tenantId": "",
                            "roleCode": "APP_USER",
                            "roleName": "Application User",
                            "description": "Application User"
                        },
                        {
                            "roleId": "",
                            "tenantId": "",
                            "roleCode": "PLATFORM_USER",
                            "roleName": "Platform User",
                            "description": "Platform User"
                        }
                    ];

                    var rowDataItem = [];
                    console.log("add to grid");

                    angular.forEach(defaultRoles, function (data, index) {

                        rowDataItem.push({
                            operationType: "INSERT",
                            roleCode: data.roleCode,
                            roleName: data.roleName,
                            description: data.description,
                            roleId: data.roleId,
                            tenantId: tenantId,
                            isActive: true
                        });

                    });

                    parentForm.df_form.$setDirty();
                    parentForm.df_form.$setSubmitted();
                    console.log("rowDataItem=", rowDataItem);
                    gridApi.updateRowData({ add: rowDataItem });
                }

            };

            this.getUpdatedRowData = function (gridData, data) {

                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.roleId === data.roleId) {
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

                var tenantRole = this.form.getFieldByModelKey("roleSave");
                var gridApi = tenantRole.gridOptions.api;
                var gridColumns = tenantRole.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);
                var rowData;

                if (parentForm.getScreenMode() === "ADD") {
                    rowData = _.filter(rowsData, function (rowsData) {
                        var isExists = true;
                        if (rowsData.roleId === data.roleId && rowsData.tenantId === data.tenantId &&
                            rowsData.roleCode === data.roleCode && rowsData.roleName === data.roleName && rowsData.description === data.description) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (parentForm.getScreenMode() === "EDIT") {
                    if ( data.roleId === "" || data.roleId === undefined ) {
                        rowData = _.filter(rowsData, function (rowsData) {
                            var isExists = true;
                            if (rowsData.roleId === data.roleId && rowsData.tenantId === data.tenantId &&
                                rowsData.roleCode === data.roleCode && rowsData.roleName === data.roleName && rowsData.description === data.description) {
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

                var roleCode = sectionDataModel["trRoleCode"];
                var roleName = sectionDataModel["trRoleName"];
                var description = sectionDataModel["trDescription"];
                var roleId = "";
                var tenantId = sectionDataModel["tenantId"];
                var isActive = true;

                var tenantRole = this.form.getFieldByModelKey("roleSave");
                var gridApi = tenantRole.gridOptions.api;
                var gridColumns = tenantRole.gridConfig.columns;

                var rowDataItem = [];
                console.log("add to grid");
                if (roleCode && roleName && description) {

                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                    var existRowData = _.filter(filterRowsData, function (filterRowData) {
                        var isExists = true;

                        if (filterRowData.roleCode === roleCode || filterRowData.roleName === roleName) {
                            isExists = true;
                            swal({
                                text: "Roles already exists in the grid!",
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
                            roleId: roleId,
                            tenantId: tenantId,
                            roleCode: roleCode,
                            roleName: roleName,
                            description: description,
                            isActive: isActive
                        });
                    }
                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                console.log("rowDataItem=", rowDataItem);
                gridApi.updateRowData({ add: rowDataItem });
            };

            this.tenantRoleHandler = function (sourceField, form, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                
                localPersistenceService.set("rolesetupTenantId", sourceField.modelValue, true);
                form = form || self.form;
                var tenantRoleGrid = this.form.getFieldByModelKey("roleSave");
                var defaultRoles = this.form.getFieldByModelKey("defaultRoles");

                defaultRoles.show = true;
                defaultRoles.modelValue = false;

                var url = 'vdi/admin/tenant/role/get/one?tenantId=' + sourceField.modelValue;
                httpService.get(url).then(function (results) {

                    var dataset = results.data.dataset || [];
                    console.log("dataset ", dataset);
                    tenantRoleGrid.gridOptions.api.setRowData(dataset);

                    var roleCodes = alasql("SELECT roleCode FROM ?", [dataset]);
                    console.log("roleCodes ",roleCodes);

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

                    angular.forEach(roleCodes, function (key, index) {
                        console.log("roleCode ", key["roleCode"]);
                        if (key["roleCode"] === "APP_USER" || key["roleCode"] === "PLATFORM_USER") {
                            defaultRoles.show = false;
                        }
                    });

                });

            };

        };
        return rolesetupService;
    });

    return angularAMD;
});