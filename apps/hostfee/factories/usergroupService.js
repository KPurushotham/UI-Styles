define(['angularAMD', 'utilService', 'gridService', 'dateUtilService','modalPopUpService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('usergroupService', function ($filter, utilService, gridService, $http, alasql,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, overlay, modalPopUpService, localPersistenceService, modelUtilService) {

        function usergroupService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.afterLoad = function (screenDefConfig, form) {
                form = form || self.form;
            };

            this.setScreenMode = function (screenMode) {
                this.form.setScreenMode(screenMode);
                self["screenMode"] = screenMode;
                if (screenMode === "EDIT") {
                    togglingScreenFields(screenMode);                    
                }
            };

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                var tobeSavedData = {};

                var roleCode = formServiceModel.roleName.replace(" ", "_").toUpperCase();
                var applicationId = 1000;
                formServiceModel.roleAccessContext["applicationId"] = applicationId;
                formServiceModel.roleAccessContext["isActive"] = "t";

                var tenantUserRole = [];
                var tenantUserRolePayload = formServiceModel.tenantUserRole;

                angular.forEach(tenantUserRolePayload, function (payload) {
                    if (payload["isActive"]) {
                        payload["isActive"] = "t";
                    }
                    else {
                        payload["isActive"] = "f";
                    }
                    tenantUserRole.push(payload);
                });

                tobeSavedData["roleId"] = formServiceModel.roleId;
                tobeSavedData["applicationId"] = applicationId;
                tobeSavedData["roleCode"] = roleCode;
                tobeSavedData["roleName"] = formServiceModel.roleName;
                tobeSavedData["description"] = formServiceModel.roleName;
                tobeSavedData["roleTypeCode"] = "WF_ROLE";
                tobeSavedData["isExternal"] = formServiceModel.isExternal;
                tobeSavedData["isActive"] = "t";
                tobeSavedData["roleAccessContext"] = formServiceModel.roleAccessContext;
                tobeSavedData["tenantUserRole"] = tenantUserRole;

                return tobeSavedData;
            };

            this.runValidations = function (formServiceModel, operationType, parentForm) {
                var self = this;
                var defer = $q.defer();
                console.log("Validation Fired=", formServiceModel, operationType);
                var isValid = false;
                var regex = /^[a-zA-Z0-9\\s ]*$/;

                var roleName = formServiceModel.roleName;
                var tenantUserRole = formServiceModel.tenantUserRole;

                var inactiveUsers = alasql('select tur.isActive from ? as tur where tur.isActive = false or tur.isActive = "f"', [tenantUserRole]);

                if (regex.test(roleName)) {

                    if (roleName === "" || tenantUserRole.length === 0) {
                        isValid = false;
                        overlay.hide();
                        Notification.error({
                            message: "Role Group & User grid are required.",
                            title: 'REQUIRED FIELDS',
                            delay: 5000
                        });
                    }
                    else if (tenantUserRole.length === inactiveUsers.length) {
                        isValid = false;
                        overlay.hide();
                        Notification.error({
                            message: "Atleast one User should be active for the Role Group.",
                            title: 'REQUIRED FIELDS',
                            delay: 5000
                        });
                    }
                    else {
                        if (operationType !== "EDIT") {
                            var url = 'vdi/workflow/usergroups/role/name/getone?roleName=' + roleName.toUpperCase();
                            httpService.get(url).then(function (results) {
                                if (results.status === 200) {
                                    if (results.data.dataset.length === 0) {
                                        isValid = true;
                                    }
                                    else {
                                        isValid = false;
                                        overlay.hide();
                                        Notification.error({
                                            message: "Role Group Already exists.",
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
                        message: "Special characters are not allowed in Role Group",
                        title: 'REQUIRED FIELDS',
                        delay: 5000
                    });
                }
                return defer.promise;
            };

            this.saveExternalUserModalHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var auth = localPersistenceService.get("auth", true);
                var emailField = this.getFieldByKeyValue("email", parentForm.modalform.sections);
                var phoneField = this.getFieldByKeyValue("phone", parentForm.modalform.sections);
                var accessContractsField = getFieldByKey("dataObjectTypeCode");

                var email = emailField.modelValue;
                var phone = phoneField.modelValue;
                var userName = email.split('@')[0];
                var isExternal = 't';
                var dataObjectTypeCode = accessContractsField.modelValue;
                var tenantId = auth.tenantId;
                var applicationId = 1000;

                var payload = {
                    "user": [
                        {
                            "userName": userName,
                            "email": email,
                            "phone": phone,
                            "isExternal": isExternal,
                            "isActive": "t",
                            "tenantUser": {
                                "tenantId": tenantId,
                                "isPrimary": "f",
                                "isActive": "t"
                            },
                            "userAccessContext": {
                                "tenantId": tenantId,
                                "applicationId": applicationId,
                                "dataObjectTypeCode": dataObjectTypeCode,
                                "isActive": "t"
                            }
                        }
                    ]
                };
                var userAccessContextUrl = "vdi/workflow/useraccesscontext/save";
                httpService.post(userAccessContextUrl, payload).then(function (results) {
                    if (results !== undefined) {
                        if (results.data.success === "true") {
                            successNotification();
                        }
                        else {
                            errorNotification();
                        }
                    }
                    else {
                        errorNotification();
                    }
                    var tenantUsers = getFieldByKey("tenantUsers");
                    loadTenantUserOptions(tenantUsers, 't', true, dataObjectTypeCode);
                });

            };

            this.saveExternalUserButtonHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var emailField = this.getFieldByKeyValue("email", parentForm.modalforms.addExternalUser.sections);
                var phoneField = this.getFieldByKeyValue("phone", parentForm.modalforms.addExternalUser.sections);
                emailField.modelValue = "";
                phoneField.modelValue = "";
                var formModalData = {};
                parentForm.modalforms["addExternalUser"]["functionalService"] = parentForm.functionalService;
                modalPopUpService.openDialog(parentForm.modalforms["addExternalUser"], formModalData, this.form, 'md').then(function (res) {
                    res.popupInstance.rendered.then(function (data) {
                        console.log(data);
                    });
                });
            };

            this.saveCAUsersModalHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var auth = localPersistenceService.get("auth", true);
                var accessContractsField = getFieldByKey("dataObjectTypeCode");
                var caPersonsGrid = this.getFieldByKeyValue("caPersonsGrid", parentForm.modalform.sections);
                var gridApi = caPersonsGrid.gridOptions.api;
                var selectedRows = gridApi.getSelectedNodes();
                var userArray = [];
                var isExternal = 't';
                var dataObjectTypeCode = accessContractsField.modelValue;
                var tenantId = auth.tenantId;
                var applicationId = 1000;
                var selectedUserIds = [];

                if (selectedRows.length === 0) {
                    alert("Please select atleast one from grid to save!");
                }
                else {
                    var tenantExternalUserUrl = "vdi/workflow/tenant/user/context/getone?isExternal=t&dataObjectTypeCode=" + dataObjectTypeCode;
                    httpService.get(tenantExternalUserUrl).then(function (results) {
                        var userDataset = results.data.dataset || [];
                        angular.forEach(selectedRows, function (item, index) {
                            var existsFlag = false;
                            selectedUserIds.push({ "externalRefId": item.data.serialId});
                            angular.forEach(userDataset, function (data, value) {
                                if (item.data.serialId === data.externalRefId) {
                                    existsFlag = true;
                                }                                
                            });
                            if (!existsFlag) {
                                var userPayload = {
                                    "firstName": item.data.PersonName,
                                    "userName": item.data.email.split('@')[0],
                                    "email": item.data.email,
                                    "phone": item.data.mobile,
                                    "isExternal": isExternal,
                                    "isActive": "t",
                                    "tenantUser": {
                                        "tenantId": tenantId,
                                        "isPrimary": "f",
                                        "isActive": "t"
                                    },
                                    "userAccessContext": {
                                        "tenantId": tenantId,
                                        "applicationId": applicationId,
                                        "dataObjectTypeCode": dataObjectTypeCode,
                                        "externalRefId": item.data.serialId,
                                        "contextJson": {
                                            "contextEntityId": item.data.contractAgentEntityId
                                        },
                                        "isActive": "t"
                                    }
                                };
                                userArray.push(userPayload);
                            }
                        });

                        var dataToBeSaved = {
                            "user": userArray
                        };

                        if (dataToBeSaved.user.length === 0) {
                            loadContractAgentUsersToGrid(dataObjectTypeCode, parentForm.screenMode, selectedUserIds);
                        }
                        else {
                            var userAccessContextUrl = "vdi/workflow/useraccesscontext/save";
                            httpService.post(userAccessContextUrl, dataToBeSaved).then(function (results) {
                                if (results !== undefined) {
                                    if (results.data.success === "true") {
                                        successNotification();
                                    }
                                    else {
                                        errorNotification();
                                    }
                                }
                                else {
                                    errorNotification();
                                }
                                loadContractAgentUsersToGrid(dataObjectTypeCode, parentForm.screenMode, selectedUserIds);
                            });
                        }                        
                    }); 
                }               
            };

            this.saveCAUsersButtonHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var primaryPersonsField = this.getFieldByKeyValue("primaryPersons", parentForm.modalforms.mapCAUsers.sections);
                primaryPersonsField.modelValue = false;
                var formModalData = {};
                parentForm.modalforms["mapCAUsers"]["functionalService"] = parentForm.functionalService;
                var url = "vdi/hostfees/contractagent/persons/getone";
                httpService.get(url).then(function (results) {
                    var dataset = results.data.dataset || [];
                    var tenantUserRole = getFieldByKey("tenantUserRole");
                    var gridData = tenantUserRole.getModel();
                    var filteredData = alasql('select d.* from ? as d where d.serialId not in (select externalRefId from ?) ', [dataset, gridData]);
                    formModalData["caPersonsGrid"] = filteredData;
                    modalPopUpService.openDialog(parentForm.modalforms["mapCAUsers"], formModalData, parentForm).then(function (res) {
                        res.popupInstance.rendered.then(function (data) {
                            console.log(data);
                        });
                    });
                    
                });
            };

            this.saveHostUsersModalHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var auth = localPersistenceService.get("auth", true);
                var accessContractsField = getFieldByKey("dataObjectTypeCode");
                var hostPersonsGrid = this.getFieldByKeyValue("hostPersonsGrid", parentForm.modalform.sections);
                var gridApi = hostPersonsGrid.gridOptions.api;
                var selectedRows = gridApi.getSelectedNodes();
                var userArray = [];
                var isExternal = 't';
                var dataObjectTypeCode = accessContractsField.modelValue;
                var tenantId = auth.tenantId;
                var applicationId = 1000;
                var selectedUserIds = [];

                if (selectedRows.length === 0) {
                    alert("Please select atleast one from grid to save!");
                }
                else {
                    var tenantExternalUserUrl = "vdi/workflow/tenant/user/context/getone?isExternal=t&dataObjectTypeCode=" + dataObjectTypeCode;
                    httpService.get(tenantExternalUserUrl).then(function (results) {
                        var userDataset = results.data.dataset || [];
                        angular.forEach(selectedRows, function (item, index) {
                            var existsFlag = false;
                            selectedUserIds.push({ "externalRefId": item.data.contactPersonEntityId });
                            angular.forEach(userDataset, function (data, value) {
                                if (item.data.contactPersonEntityId === data.externalRefId) {
                                    existsFlag = true;
                                }
                            });
                            if (!existsFlag) {
                                var userPayload = {
                                    "firstName": item.data.contactPersonName,
                                    "userName": item.data.contactPersonEmail.split('@')[0],
                                    "email": item.data.contactPersonEmail,
                                    "phone": item.data.mobile,
                                    "isExternal": isExternal,
                                    "isActive": "t",
                                    "tenantUser": {
                                        "tenantId": tenantId,
                                        "isPrimary": "f",
                                        "isActive": "t"
                                    },
                                    "userAccessContext": {
                                        "tenantId": tenantId,
                                        "applicationId": applicationId,
                                        "dataObjectTypeCode": dataObjectTypeCode,
                                        "externalRefId": item.data.contactPersonEntityId,
                                        "contextJson": {
                                            "contextEntityId": item.data.hostEntityId
                                        },
                                        "isActive": "t"
                                    }
                                };
                                userArray.push(userPayload);
                            }
                        });

                        var dataToBeSaved = {
                            "user": userArray
                        };

                        if (dataToBeSaved.user.length === 0) {
                            loadHostUsersToGrid(dataObjectTypeCode, parentForm.screenMode, selectedUserIds);
                        }
                        else {
                            var userAccessContextUrl = "vdi/workflow/useraccesscontext/save";
                            httpService.post(userAccessContextUrl, dataToBeSaved).then(function (results) {
                                if (results !== undefined) {
                                    if (results.data.success === "true") {
                                        successNotification();
                                    }
                                    else {
                                        errorNotification();
                                    }
                                }
                                else {
                                    errorNotification();
                                }
                                loadHostUsersToGrid(dataObjectTypeCode, parentForm.screenMode, selectedUserIds);
                            });
                        }
                    });


                }

            };

            this.saveHostUsersButtonHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var formModalData = {};
                parentForm.modalforms["mapHostUsers"]["functionalService"] = parentForm.functionalService;
                var url = "vdi/chrimsmasters/host/persons/get/all";
                httpService.get(url).then(function (results) {
                    var dataset = results.data.dataset || [];
                    var tenantUserRole = getFieldByKey("tenantUserRole");
                    var gridData = tenantUserRole.getModel();
                    var filteredData = alasql('select d.* from ? as d where d.contactPersonEntityId  not in (select externalRefId from ?) ', [dataset, gridData]);
                    formModalData["hostPersonsGrid"] = filteredData;
                    modalPopUpService.openDialog(parentForm.modalforms["mapHostUsers"], formModalData, parentForm).then(function (res) {
                        res.popupInstance.rendered.then(function (data) {
                            console.log(data);
                        });
                    });

                });
            };

            this.selectAllPrimaryPersonsHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                
                var caPersonsGrid = this.getFieldByKeyValue("caPersonsGrid", parentForm.sections);
                var gridApi = caPersonsGrid.gridOptions.api;
                if (!sourceField.modelValue) {
                    gridApi.forEachNodeAfterFilter(function (node) {
                        if (node.data !== undefined) {
                            if (node.data.isPrimary) {
                                node.setSelected(true);
                            }
                            else {
                                node.setSelected(false);
                            }
                        }

                    });
                }
                else {
                    gridApi.forEachNodeAfterFilter(function (node) {
                        if (node.data !== undefined) {
                            if (node.data.isPrimary) {
                                node.setSelected(false);
                            }
                        }

                    });
                } 
            };
            
            this.onUserGroupTypeChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                togglingScreenFields(parentForm.screenMode, "isExternalField");               
            };

            this.accessContextChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {               
                togglingScreenFields(parentForm.screenMode, "accessContextField"); 
            };

            this.getUpdatedRowData = function (gridData, data) {
                angular.forEach(gridData, function (gridData, index) {
                    if (gridData.tenantUserRoleId === data.tenantUserRoleId) {
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

            this.deleteUsersFromGrid = function (data, parentForm) {
                var tenantUserRole = this.form.getFieldByModelKey("tenantUserRole");
                var gridApi = tenantUserRole.gridOptions.api;
                var gridColumns = tenantUserRole.gridConfig.columns;
                var rowsData = gridService.getGridData(gridApi, gridColumns);
                var rowData;

                if (parentForm.getScreenMode() === "ADD") {
                    rowData = _.filter(rowsData, function (rowsData) {
                        var isExists = true;
                        if (rowsData.userName === data.userName && rowsData.userEntityId === data.userEntityId
                            && rowsData.roleId === data.roleId) {
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
                            if (rowsData.userName === data.userName && rowsData.userEntityId === data.userEntityId
                                && rowsData.roleId === data.roleId) {
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

            this.addToGridHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var users = sectionDataModel["tenantUsers"];
                var roleId = sectionDataModel["roleId"];
                var usersField = getFieldByKey("tenantUsers");
                var tenantUserRole = getFieldByKey("tenantUserRole");
                var gridApi = tenantUserRole.gridOptions.api;
                var gridColumns = tenantUserRole.gridConfig.columns;
                var rowDataItem = [];

                if (users) {

                    var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                    angular.forEach(users, function (item, key) {

                        var existRowData = _.filter(filterRowsData, function (filterRowData) {
                            var isExists = true;

                            if (filterRowData.userName === item.text && filterRowData.userEntityId === item.value) {
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

                        if (existRowData && existRowData.length === 0) {
                            rowDataItem.push({
                                operationType: "INSERT",
                                tenantUserRoleId: "",
                                tenantId: "",
                                roleId: roleId,
                                userName: item.text,
                                userEntityId: item.value,
                                email: item.item.email,
                                isActive: true
                            });
                        }
                    });
                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                gridApi.updateRowData({ add: rowDataItem });
                usersField.modelValue = [];
            };

            var loadTenantUserOptions = function (tenantuserField, isExternalFlag, isExternalUrlFlag, dataObjectTypeCode) {
                overlay.load();
                var tenantUserUrl = "vdi/workflow/tenant/user/getone?isExternal=" + isExternalFlag;
                var tenantExternalUserUrl = "vdi/workflow/tenant/user/context/getone?isExternal=" + isExternalFlag + "&dataObjectTypeCode=" + dataObjectTypeCode;
                var getOneUrl = isExternalUrlFlag === true ? tenantExternalUserUrl : tenantUserUrl;
                httpService.get(getOneUrl).then(function (results) {
                    var dataset = results.data.dataset || [];
                    tenantuserField.options = modelUtilService.formatResultDataForOptions(dataset, tenantuserField.dataConfig.displayKey, tenantuserField.dataConfig.valueKey);
                    overlay.hide();
                });
            };

            var loadContractAgentUsersToGrid = function (dataObjectTypeCode, screenMode, selectedUserIds) {

                screenMode = screenMode || self.screenMode;
                var tenantUserRole = getFieldByKey("tenantUserRole");
                overlay.load();
                var tenantExternalUserUrl = "vdi/workflow/tenant/user/context/getone?isExternal=t&dataObjectTypeCode=" + dataObjectTypeCode;
                httpService.get(tenantExternalUserUrl).then(function (results) {
                    var userDataset = results.data.dataset || [];
                    var contractAgentUrl = "vdi/hostfees/contractagent/all";
                    httpService.get(contractAgentUrl).then(function (results) {
                        var contractAgentDataset = results.data.dataset || [];
                        var updatedData = [];
                        var data = [];
                        var gridData = tenantUserRole.getModel();
                        if (screenMode === "VIEW") {
                            updatedData = alasql('select gd.*, ud.contextEntityId, ud.externalRefId, cd.contractAgentName \
                                            from ? as gd inner join ? as ud on gd.userEntityId = ud.userEntityId \
                                            inner join ? as cd on ud.contextEntityId = cd.contractAgentEntityId',
                                [gridData, userDataset, contractAgentDataset]);
                            tenantUserRole.gridOptions.api.setRowData(updatedData);
                        }
                        else if (screenMode === "EDIT") {
                            data = alasql('select ud.userEntityId,  ud.userName, ud.email, ud.externalRefId, ud.contextEntityId, "INSERT" as operationType, \
                                            "" as tenantUserRoleId, "" as tenantId, ' + $stateParams.roleId + ' as roleId, \
                                            true as isActive from ? as ud where ud.externalRefId not in (select externalRefId from ?)',
                                [userDataset, gridData]);
                            updatedData = alasql('select d.*, cd.contractAgentName from ? as d inner join ? as cd on \
                                        d.contextEntityId = cd.contractAgentEntityId', [data, contractAgentDataset]);
                            updatedData = alasql('select ud.* from ? as ud inner join ? as uid on ud.externalRefId = uid.externalRefId', [updatedData, selectedUserIds]);
                            tenantUserRole.gridOptions.api.updateRowData({ add: updatedData });

                        }
                        else {
                            data = alasql('select ud.userEntityId, ud.userName, ud.email, ud.externalRefId, "INSERT" as operationType, \
                                            "" as tenantUserRoleId, "" as tenantId, "" as roleId, cd.contractAgentName, ud.contextEntityId, \
                                            true as isActive from ? as ud inner join ? as cd on ud.contextEntityId = cd.contractAgentEntityId',
                                [userDataset, contractAgentDataset]);
                            if (selectedUserIds === undefined) {
                                tenantUserRole.gridOptions.api.setRowData(data);
                            }
                            else {
                                updatedData = alasql('select ud.* from ? as ud inner join ? as uid on ud.externalRefId = uid.externalRefId', [data, selectedUserIds]);
                                tenantUserRole.gridOptions.api.updateRowData({ add: updatedData });
                            }
                        }
                        tenantUserRole.gridOptions.api.sizeColumnsToFit();
                        tenantUserRole.gridOptions.api.redrawRows();
                        overlay.hide();
                    });
                    
                });

            };

            var loadHostUsersToGrid = function (dataObjectTypeCode, screenMode, selectedUserIds) {

                screenMode = screenMode || self.screenMode;
                var tenantUserRole = getFieldByKey("tenantUserRole");
                overlay.load();
                var tenantExternalUserUrl = "vdi/workflow/tenant/user/context/getone?isExternal=t&dataObjectTypeCode=" + dataObjectTypeCode;
                httpService.get(tenantExternalUserUrl).then(function (results) {
                    var userDataset = results.data.dataset || [];
                    var hostsUrl = "vdi/chrimsmasters/host/all";
                    httpService.get(hostsUrl).then(function (results) {
                        var hostDataSet = results.data.dataset || [];
                        var updatedData = [];
                        var data = [];
                        var gridData = tenantUserRole.getModel();
                        if (screenMode === "VIEW") {
                            updatedData = alasql('select gd.*, ud.contextEntityId, ud.externalRefId, hd.hostName \
                                            from ? as gd inner join ? as ud on gd.userEntityId = ud.userEntityId \
                                            inner join ? as hd on ud.contextEntityId = hd.hostEntityId',
                                [gridData, userDataset, hostDataSet]);
                            tenantUserRole.gridOptions.api.setRowData(updatedData);
                        }
                        else if (screenMode === "EDIT") {
                            data = alasql('select ud.userEntityId,  ud.userName, ud.email, ud.externalRefId, ud.contextEntityId, "INSERT" as operationType, \
                                            "" as tenantUserRoleId, "" as tenantId, ' + $stateParams.roleId + ' as roleId, \
                                            true as isActive from ? as ud where ud.externalRefId not in (select externalRefId from ?)',
                                [userDataset, gridData]);
                            updatedData = alasql('select d.*, hd.hostName from ? as d inner join ? as hd on \
                                        d.contextEntityId = hd.hostEntityId', [data, hostDataSet]);
                            updatedData = alasql('select ud.* from ? as ud inner join ? as uid on ud.externalRefId = uid.externalRefId', [updatedData, selectedUserIds]);
                            tenantUserRole.gridOptions.api.updateRowData({ add: updatedData });

                        }
                        else {
                            data = alasql('select ud.userEntityId, ud.userName, ud.email, ud.externalRefId, "INSERT" as operationType, \
                                            "" as tenantUserRoleId, "" as tenantId, "" as roleId, hd.hostName, ud.contextEntityId, \
                                            true as isActive from ? as ud inner join ? as hd on ud.contextEntityId = hd.hostEntityId',
                                [userDataset, hostDataSet]);
                            if (selectedUserIds === undefined) {
                                tenantUserRole.gridOptions.api.setRowData(data);
                            }
                            else {
                                updatedData = alasql('select ud.* from ? as ud inner join ? as uid on ud.externalRefId = uid.externalRefId', [data, selectedUserIds]);
                                tenantUserRole.gridOptions.api.updateRowData({ add: updatedData });
                            }
                        }
                        tenantUserRole.gridOptions.api.sizeColumnsToFit();
                        tenantUserRole.gridOptions.api.redrawRows();
                        overlay.hide();
                    });

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

            this.getFieldByKeyValue = function (modelKey, sections) {
                var mfield = {};
                //sections
                angular.forEach(sections, function (section, index) {
                    var rows = section.rowDivisions;
                    //rows
                    angular.forEach(rows, function (row, index) {
                        var columns = row.columns;
                        //columns
                        angular.forEach(columns, function (column, index) {
                            var fields = column.fields;
                            //fields
                            angular.forEach(fields, function (field, index) {
                                if (field.modelKey === modelKey) {
                                    mfield = field;
                                    return mfield;
                                }
                            });
                        });
                        //no Columns
                        var fields = row.fields;
                        //fields
                        angular.forEach(fields, function (field, index) {
                            if (field.modelKey === modelKey) {
                                mfield = field;
                                return mfield;
                            }
                        });
                    });
                });
                return mfield;
            };

            var successNotification = function () {
                Notification.success({
                    message: "Data saved successfully.",
                    title: 'Status',
                    delay: 5000
                });
            };

            var errorNotification = function () {
                Notification.error({
                    message: "Failed to save data.",
                    title: 'Status',
                    delay: 5000
                });
            };

            var togglingScreenFields = function (screenMode, source) {

                var accessContractsField = getFieldByKey("dataObjectTypeCode");
                var isExternal = getFieldByKey("isExternal");
                var btnAddExtUser = getFieldByKey("btnAddExtUser");
                var tenantUsers = getFieldByKey("tenantUsers");
                var btnAddToGrid = getFieldByKey("btnAddToGrid");
                var btnMapCAUser = getFieldByKey("btnMapCAUser");
                var btnMapHostUser = getFieldByKey("btnMapHostUser");
                var tenantUserRole = getFieldByKey("tenantUserRole");

                var colDefs = tenantUserRole.gridOptions.columnDefs;
                tenantUsers.modelValue = "";
                if (screenMode === "ADD") {
                    if (source === "isExternalField") {
                        if (isExternal.modelValue === 'f') {
                            accessContractsField.modelValue = "CONTRACT";
                            accessContractsField.disabled = true;
                            tenantUsers.show = true;
                            btnAddToGrid.show = true;
                            tenantUserRole.cssClass = "field-show";
                            loadTenantUserOptions(tenantUsers, 'f', false);
                        }
                        else {
                            accessContractsField.modelValue = "";
                            accessContractsField.disabled = false;
                            tenantUsers.show = false;
                            btnAddToGrid.show = false;
                            tenantUserRole.cssClass = "field-hide";
                        }
                        btnAddExtUser.show = false;
                        btnMapCAUser.show = false;
                        btnMapHostUser.show = false;

                        tenantUserRole.gridOptions.api.setRowData([]);
                    }
                    else if (source === "accessContextField") {
                        if (accessContractsField.modelValue === "CONTRACT" && isExternal.modelValue === 't') {
                            btnAddExtUser.show = true;
                            tenantUsers.show = true;
                            btnAddToGrid.show = true;
                            btnMapCAUser.show = false;
                            btnMapHostUser.show = false;
                            tenantUserRole.gridOptions.api.setRowData([]);
                            tenantUserRole.cssClass = "field-show";
                            loadTenantUserOptions(tenantUsers, 't', true, accessContractsField.modelValue);
                        }
                        else if (accessContractsField.modelValue === "CONTRACT_AGENT" && isExternal.modelValue === 't') {
                            btnAddExtUser.show = false;
                            tenantUsers.show = false;
                            btnAddToGrid.show = false;
                            btnMapCAUser.show = true;
                            btnMapHostUser.show = false;
                            tenantUserRole.cssClass = "field-show";
                            tenantUserRole.gridOptions.columnApi.getColumn(colDefs[5].field).colDef.hide = false;
                            loadContractAgentUsersToGrid(accessContractsField.modelValue, screenMode);
                        }
                        else if (accessContractsField.modelValue === "HOST" && isExternal.modelValue === 't') {
                            btnAddExtUser.show = false;
                            tenantUsers.show = false;
                            btnAddToGrid.show = false;
                            btnMapCAUser.show = false;
                            btnMapHostUser.show = true;
                            tenantUserRole.cssClass = "field-show";
                            tenantUserRole.gridOptions.columnApi.getColumn(colDefs[6].field).colDef.hide = false;
                            loadHostUsersToGrid(accessContractsField.modelValue, screenMode);
                        }
                        else {
                            btnAddExtUser.show = false;
                            tenantUsers.show = false;
                            btnAddToGrid.show = false;
                            btnMapCAUser.show = false;
                            btnMapCAUser.show = false;
                            tenantUserRole.gridOptions.api.setRowData([]);
                            tenantUserRole.cssClass = "field-hide";
                        }
                        tenantUserRole.gridOptions.api.sizeColumnsToFit();
                    }
                }
                else if (screenMode === "VIEW") {
                    if (accessContractsField.modelValue === "CONTRACT" && isExternal.modelValue === 't') {
                        loadTenantUserOptions(tenantUsers, 't', true, accessContractsField.modelValue);
                    }
                    else if (accessContractsField.modelValue === "CONTRACT_AGENT" && isExternal.modelValue === 't') {
                        loadContractAgentUsersToGrid(accessContractsField.modelValue, screenMode);
                    }
                    else if (accessContractsField.modelValue === "HOST" && isExternal.modelValue === 't') {
                        loadHostUsersToGrid(accessContractsField.modelValue, screenMode);
                    }
                    else if (accessContractsField.modelValue === "CONTRACT" && isExternal.modelValue === 'f') {
                        loadTenantUserOptions(tenantUsers, 'f', false);
                    }
                    btnAddExtUser.show = false;
                    tenantUsers.show = false;
                    btnAddToGrid.show = false;
                    btnMapCAUser.show = false;
                    btnMapCAUser.show = false;
                    tenantUserRole.cssClass = "field-show";
                }
                else if (screenMode === "EDIT") {
                    if (accessContractsField.modelValue === "CONTRACT" && isExternal.modelValue === 't') {
                        btnAddExtUser.show = true;
                        tenantUsers.show = true;
                        btnAddToGrid.show = true;
                    }
                    else if (accessContractsField.modelValue === "CONTRACT_AGENT" && isExternal.modelValue === 't') {
                        btnMapCAUser.show = true;
                    }
                    else if (accessContractsField.modelValue === "HOST" && isExternal.modelValue === 't') {
                        btnMapHostUser.show = true;
                    }
                    else {
                        tenantUsers.show = true;
                        btnAddToGrid.show = true;
                    }
                }               
            };

        }
        return usergroupService;
    });

    return angularAMD;
});