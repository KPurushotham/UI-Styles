define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('usersetupService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, localPersistenceService, httpService, $q, $stateParams, tenantService, $timeout, fieldService, alasql) {

        function usersetupService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;

            this.showInEditMode = function (currentForm) {
                var self = this;
            };  

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var pattern = form.currentMenuDefinition.pattern;

                var auth = localPersistenceService.get("auth", true);
                var loginTenantId = auth.loginTenantId;

                var subTenantsUrl = "vdi/admin/tenant/relation/one?parentTenantId=" + loginTenantId;

                httpService.get(subTenantsUrl).then(function (results) {

                    var tenantsDataset = results.data.dataset || [];
                    console.log("dataset ", tenantsDataset);
                    var tenantMatchedOptions = [];

                    if (pattern === "FORM") {

                        var copyUserDropdown = form.getFieldByModelKey("copyUserId");
                        var primaryTenant = form.getFieldByModelKey("tuIsPrimary");
                        
                        if (form.screenMode === "VIEW" || form.screenMode === "EDIT") {
                            copyUserDropdown.show = false;
                            primaryTenant.modelValue = false;
                        }
                        else {
                            primaryTenant.modelValue = true;
                        }
                        
                        var tenantUserDropdown = form.getFieldByModelKey("userTenantId");
                        var tuDropdown = form.getFieldByModelKey("tuTenantId");
                        var tauDropdown = form.getFieldByModelKey("tauTenantId");
                        var turDropdown = form.getFieldByModelKey("turTenantId");
                        var tenantUserDropdownOptions = tenantUserDropdown.options;

                        angular.forEach(tenantsDataset, function (item, key) {
                            angular.forEach(tenantUserDropdownOptions, function (option, key) {

                                if (option.value === item.tenantId) {
                                    tenantMatchedOptions.push(option);
                                }
                            });
                        });

                        tenantUserDropdown.options = tenantMatchedOptions;  
                        tuDropdown.options = tenantMatchedOptions;
                        tauDropdown.options = tenantMatchedOptions;
                        turDropdown.options = tenantMatchedOptions;

                    }
                    else {

                        var criteriaRows = screenDefConfig.criteria.rowDivisions;
                        var listingTenantDropdown = fieldService.getFieldDataByModelKey(criteriaRows[0].columns, "tenantId");
                        var listingTenantOptions = listingTenantDropdown.options;

                        angular.forEach(tenantsDataset, function (item, key) {
                            angular.forEach(listingTenantOptions, function (option, key) {

                                if (option.value === item.tenantId) {
                                    tenantMatchedOptions.push(option);
                                }
                            });
                        });

                        listingTenantDropdown.options = tenantMatchedOptions;
                        console.log("matchedOptions ", tenantMatchedOptions);
                    }

                });                

                return false;
            };

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                
                var tobeSavedData = {};
                var tenantUser = [];
                var tenantApplicationUser = [];
                var tenantUserRole = [];
                var tenantUserPayload = formServiceModel.tenantUser;
                var tenantApplicationUserPayload = formServiceModel.tenantApplicationUser;
                var tenantUserRolePayload = formServiceModel.tenantUserRole;

                angular.forEach(tenantUserPayload, function (payload) {
                    if (payload["isPrimary"] || payload["isPrimary"] === "true") {
                        payload["isPrimary"] = "t";
                    }
                    else {
                        payload["isPrimary"] = "f";
                    }
                    if (payload["isActive"]) {
                        payload["isActive"] = "t";
                    }
                    else {
                        payload["isActive"] = "f";
                    }
                    tenantUser.push(payload);
                });

                angular.forEach(tenantApplicationUserPayload, function (payload) {
                    if (payload["isActive"]) {
                        payload["isActive"] = "t";
                    }
                    else {
                        payload["isActive"] = "f";
                    }
                    tenantApplicationUser.push(payload);
                });

                angular.forEach(tenantUserRolePayload, function (payload) {
                    if (payload["isActive"]) {
                        payload["isActive"] = "t";
                    }
                    else {
                        payload["isActive"] = "f";
                    }
                    tenantUserRole.push(payload);
                });
                
                tobeSavedData.userEntityId = formServiceModel.userEntityId;
                tobeSavedData.entityTypeCode = formServiceModel.entityTypeCode;
                tobeSavedData.firstName = formServiceModel.firstName;
                tobeSavedData.lastName = formServiceModel.lastName;
                tobeSavedData.userName = formServiceModel.userName;
                tobeSavedData.password = formServiceModel.password;
                tobeSavedData.email = formServiceModel.email;
                tobeSavedData.company = formServiceModel.company;
                tobeSavedData.phone = formServiceModel.phone;
                tobeSavedData.tenantUser = tenantUser;
                tobeSavedData.tenantApplicationUser = tenantApplicationUser;
                tobeSavedData.tenantUserRole = tenantUserRole;

                return tobeSavedData;
            }; 

            this.getTenantUserUpdatedRowData = function (gridData, data) {
                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.tenantUserId === data.tenantUserId) {
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

            this.tuDeleteFromGrid = function (data, parentForm) {
                var tenantUser = this.form.getFieldByModelKey("tenantUser");
                var gridApi = tenantUser.gridOptions.api;
                var gridColumns = tenantUser.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);
                var rowData;

                if (parentForm.getScreenMode() === "ADD") {
                    rowData = _.filter(rowsData, function (rowsData) {
                        var isExists = true;
                        if (rowsData.tenantName === data.tenantName && rowsData.applicationTitle === data.applicationTitle && rowsData.beginDate === data.beginDate && rowsData.endDate === data.endDate) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else {
                    if (data.tenantUserId === "" || data.tenantUserId === undefined) {
                        rowData = _.filter(rowsData, function (rowsData) {
                            var isExists = true;
                            if (rowsData.tenantName === data.tenantName && rowsData.applicationTitle === data.applicationTitle && rowsData.beginDate === data.beginDate && rowsData.endDate === data.endDate) { 
                                isExists = false;
                            }
                            return isExists;
                        });
                        gridApi.setRowData(rowData);
                    }
                    else {
                        var updatedData = this.getTenantUserUpdatedRowData(rowsData, data);
                        gridApi.setRowData(updatedData);
                    }
                }
                
            };

            this.tuAddToGrid = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var tenantDropdown = this.form.getFieldByModelKey("tuTenantId");
                var tenantId = sectionDataModel["tuTenantId"];
                var tenantName = tenantDropdown.getSelectedText();
                var tenantUserId = "";
                var userEntityId = sectionDataModel["userEntityId"];
                var isActive = true;
                var isPrimary = sectionDataModel["tuIsPrimary"];
                if (isPrimary === undefined) {
                    isPrimary = false;
                }
                var tenantUser = this.form.getFieldByModelKey("tenantUser");
                var gridApi = tenantUser.gridOptions.api;
                var gridColumns = tenantUser.gridConfig.columns;

                var rowDataItem = [];
                console.log("add to grid");
                if (tenantId !== undefined && tenantName) {
                    
                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);
                    gridApi.setRowData([]);
                    var existRowData = _.filter(filterRowsData, function (filterRowData) {
                        var isExists = true;
                        if (filterRowData.tenantId !== tenantId) {
                            if (isPrimary) {
                                filterRowData.isPrimary = false;
                            }
                        }

                        if (filterRowData.tenantName === tenantName) {
                            isExists = true;
                            gridApi.updateRowData({ add: [filterRowData] });
                            swal({
                                text: "Seleted Tenant already exists in the grid!",
                                icon: "info",
                                button: "Okay"
                            });

                        }
                        else {
                            isExists = false;
                            gridApi.updateRowData({ add: [filterRowData] });
                        }
                        return isExists;
                    });

                    console.log("existRowData", existRowData);
                    if (existRowData && existRowData.length === 0) {
                        rowDataItem.push({
                            operationType: "INSERT",
                            tenantUserId: tenantUserId,
                            tenantId: tenantId,
                            tenantName: tenantName,
                            userEntityId: userEntityId,
                            isPrimary: isPrimary,
                            isActive: isActive
                        });
                    }
                        
                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                console.log("rowDataItem=", rowDataItem);
                gridApi.updateRowData({ add: rowDataItem });
            };

            this.getTenantAppUserUpdatedRowData = function (gridData, data) {

                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.tenantApplicationUserId === data.tenantApplicationUserId) {                        
                        
                        var yesterdaysDate = dateUtilService.convertToDateFormat(moment().subtract(1, 'day').toDate());
                       
                        if ((new Date(data.endDate) > new Date(yesterdaysDate)) && (data.isActive === true)) {
                            localStorage.setItem(gridData.tenantApplicationUserId, gridData.endDate);
                            gridData.endDate = yesterdaysDate;
                            gridData.isActive = false;
                        }
                        else {
                            var localStorageEndDate = localStorage.getItem(gridData.tenantApplicationUserId); 
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

            this.tauDeleteFromGrid = function (data, parentForm) {
                var tenantAppUser = this.form.getFieldByModelKey("tenantApplicationUser");
                var gridApi = tenantAppUser.gridOptions.api;
                var gridColumns = tenantAppUser.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);
                var rowData;
                if (parentForm.getScreenMode() === "ADD") {
                    rowData = _.filter(rowsData, function (rowsData) {
                        var isExists = true;
                        if (rowsData.tenantName === data.tenantName && rowsData.applicationTitle === data.applicationTitle && rowsData.beginDate === data.beginDate && rowsData.endDate === data.endDate) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (parentForm.getScreenMode() === "EDIT") {

                    if (data.tenantApplicationUserId === "" || data.tenantApplicationUserId === undefined) {
                        rowData = _.filter(rowsData, function (rowsData) {
                            var isExists = true;
                            if (rowsData.tenantName === data.tenantName && rowsData.applicationTitle === data.applicationTitle && rowsData.beginDate === data.beginDate && rowsData.endDate === data.endDate) {
                                isExists = false;
                            }
                            return isExists;
                        });
                        gridApi.setRowData(rowData);
                    }
                    else {
                        var updatedData = this.getTenantAppUserUpdatedRowData(rowsData, data);
                        gridApi.setRowData(updatedData);
                    }
                }
                
            };

            this.tauAddToGrid = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                
                var appNames = sectionDataModel["tauApplicationEntityId"];
                var tenantApplicationUserId = "";
                var userEntityId = sectionDataModel["userEntityId"];
                var beginDate = sectionDataModel["tauBeginDate"];
                var endDate = sectionDataModel["tauEndDate"];
                var isActive = true;

                var tenantAppUser = this.form.getFieldByModelKey("tenantApplicationUser");
                var gridApi = tenantAppUser.gridOptions.api;
                var gridColumns = tenantAppUser.gridConfig.columns;

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

                                if (filterRowData.applicationTitle === item.text && filterRowData.tenantName === item.item.tenantTitle) {
                                    isExists = true;
                                    swal({
                                        text: "Seleted Criteria already exists in the grid!",
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
                                    tenantApplicationUserId: tenantApplicationUserId,
                                    tenantId: item.item.tenantId,
                                    tenantName: item.item.tenantTitle,
                                    applicationEntityId: item.value,
                                    applicationTitle: item.text,
                                    userEntityId: userEntityId,
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

            this.getTenantUserRoleUpdatedRowData = function (gridData, data) {

                angular.forEach(gridData, function (gridData, i) {
                    if (gridData.tenantUserRoleId === data.tenantUserRoleId) {                        
                        
                        var yesterdaysDate = dateUtilService.convertToDateFormat(moment().subtract(1, 'day').toDate());

                        if ((new Date(data.endDate) > new Date(yesterdaysDate)) && (data.isActive === true)) {
                            localStorage.setItem(gridData.tenantUserRoleId, gridData.endDate);
                            gridData.endDate = yesterdaysDate;
                            gridData.isActive = false;
                        }
                        else {
                            var localStorageEndDate = localStorage.getItem(gridData.tenantUserRoleId);
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

            this.turDeleteFromGrid = function (data, parentForm) {
                var tenantUserRole = this.form.getFieldByModelKey("tenantUserRole");
                var gridApi = tenantUserRole.gridOptions.api;
                var gridColumns = tenantUserRole.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);
                var rowData;
                if (parentForm.getScreenMode() === "ADD") {
                    rowData = _.filter(rowsData, function (rowsData) {
                        var isExists = true;
                        if (rowsData.tenantName === data.tenantName && rowsData.roleName === data.roleName && rowsData.beginDate === data.beginDate && rowsData.endDate === data.endDate) {
                            isExists = false;
                        }
                        return isExists;
                    });
                    gridApi.setRowData(rowData);
                }
                else if (parentForm.getScreenMode() === "EDIT") {
                    if (data.tenantUserRoleId === "" || data.tenantUserRoleId === undefined) {
                        rowData = _.filter(rowsData, function (rowsData) {
                            var isExists = true;
                            if (rowsData.tenantName === data.tenantName && rowsData.roleName === data.roleName && rowsData.beginDate === data.beginDate && rowsData.endDate === data.endDate) {
                                isExists = false;
                            }
                            return isExists;
                        });
                        gridApi.setRowData(rowData);
                    }
                    else {
                        var updatedData = this.getTenantUserRoleUpdatedRowData(rowsData, data);
                        gridApi.setRowData(updatedData);
                    }
                }
                
            };

            this.turAddToGrid = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                
                var roleNames = sectionDataModel["turRoleId"];
                var tenantUserRoleId = "";
                var userEntityId = sectionDataModel["userEntityId"];
                var beginDate = sectionDataModel["turBeginDate"];
                var endDate = sectionDataModel["turEndDate"];
                var isActive = true;

                var tenantUserRole = this.form.getFieldByModelKey("tenantUserRole");
                var gridApi = tenantUserRole.gridOptions.api;
                var gridColumns = tenantUserRole.gridConfig.columns;

                var isBetween = function (n, a, b) {
                    return (n - a) * (n - b) <= 0;
                };

                var rowDataItem = [];
                console.log("add to grid");
                if (roleNames && beginDate && endDate) {

                    var beginDateTimeStamp = dateUtilService.convertToTimeStamp(beginDate);
                    var endDateTimeStamp = dateUtilService.convertToTimeStamp(endDate);
                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);
                    
                    angular.forEach(roleNames, function (item, key) {

                        if (beginDateTimeStamp < endDateTimeStamp) {

                            var existRowData = _.filter(filterRowsData, function (filterRowData) {
                                var isExists = true;

                                if (filterRowData.roleName === item.text && filterRowData.tenantName === item.item.tenantName) {
                                    isExists = true;
                                    swal({
                                        text: "Seleted Criteria already exists in the grid!",
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
                                    tenantUserRoleId: tenantUserRoleId,
                                    tenantId: item.item.tenantId,
                                    tenantName: item.item.tenantName,
                                    roleId: item.value,
                                    roleName: item.text,
                                    userEntityId: userEntityId,
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

            this.tenantUserDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var selectedOptions = sourceField.modelValue;
                var userTenantsDropdown = this.form.getFieldByModelKey("tuTenantId");
                var applicationTenantsDropdown = this.form.getFieldByModelKey("tauTenantId");
                var roleTenantsDropdown = this.form.getFieldByModelKey("turTenantId");

                userTenantsDropdown.options = selectedOptions;
                applicationTenantsDropdown.options = selectedOptions;
                roleTenantsDropdown.options = selectedOptions;

            };
      
            this.copyUserHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                if (this.form.screenMode === "ADD") {

                    var tenantGrid = this.form.getFieldByModelKey("tenantUser");
                    var applicationGrid = this.form.getFieldByModelKey("tenantApplicationUser");
                    var roleGrid = this.form.getFieldByModelKey("tenantUserRole");

                    tenantGrid.gridOptions.api.setRowData([]);
                    applicationGrid.gridOptions.api.setRowData([]);
                    roleGrid.gridOptions.api.setRowData([]);

                    var tenantUrl = "vdi/admin/user/tenants?userEntityId=" + sourceField.modelValue;
                    var tenantAppsUrl = "vdi/admin/tenant/copy/user/apps?userEntityId=" + sourceField.modelValue;
                    var tenantRolesUrl = "vdi/admin/tenant/copy/user/roles?userEntityId=" + sourceField.modelValue;

                    httpService.get(tenantUrl).then(function (results) {

                        var dataset = results.data.dataset || [];
                        var tenantUserDataSet = [];
                        angular.forEach(dataset, function (data) {
                            data.operationType = "INSERT";
                            data.tenantUserId = "";
                            data.userEntityId = "";
                            tenantUserDataSet.push(data);
                        });
                        console.log("dataset ", tenantUserDataSet);
                        tenantGrid.gridOptions.api.setRowData(tenantUserDataSet);

                    });

                    httpService.get(tenantAppsUrl).then(function (results) {

                        var dataset = results.data.dataset || [];
                        var tenantAppUserDataSet = [];
                        angular.forEach(dataset, function (data) {
                            data.operationType = "INSERT";
                            data.tenantApplicationUserId = "";
                            data.userEntityId = "";
                            tenantAppUserDataSet.push(data);
                        });
                        console.log("dataset ", tenantAppUserDataSet);
                        applicationGrid.gridOptions.api.setRowData(tenantAppUserDataSet);

                    });

                    httpService.get(tenantRolesUrl).then(function (results) {

                        var dataset = results.data.dataset || [];
                        var tenantUserRoleDataSet = [];
                        angular.forEach(dataset, function (data) {
                            data.operationType = "INSERT";
                            data.tenantUserRoleId = "";
                            data.userEntityId = "";
                            tenantUserRoleDataSet.push(data);
                        });
                        console.log("dataset ", tenantUserRoleDataSet);
                        roleGrid.gridOptions.api.setRowData(tenantUserRoleDataSet);

                    });
                }

            };

            this.tenantAppDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var applicationDropdown = this.form.getFieldByModelKey("tauApplicationEntityId");
                applicationDropdown.reset();

            };

            this.tenantRoleDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {                
                var roleDropdown = this.form.getFieldByModelKey("turRoleId");
                roleDropdown.reset();
            };
        }

        return usersetupService;
    });

    return angularAMD;
});