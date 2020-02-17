define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('approvalProcessService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, overlay, $sce, alasql) {

        function approvalProcessService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;
            var workflowStateDefinitionArray = [];
            self.isUpdateStepDataFlag = false;
            self.isActiveValidationFlag = false;
            self.payloadToBeUpdated = [];

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {
                form = form || self.form;
                
                //var stateField = form.getFieldByModelKey("workflowStateCode");
                //var rejectField = form.getFieldByModelKey("rejectStatusCode");
                //var approveField = form.getFieldByModelKey("approveStatusCode");
                //var promise = isDropDownLoaded();
                //promise.then(function () {
                //    self["stateOptions"] = stateField.options;
                //    self["rejectOptions"] = rejectField.options;
                //    self["approveOptions"] = approveField.options;
                //});

                self["stateOptions"] = [{ "text": "Draft", "value": "DRAFT" }, { "text": "Review", "value": "REVIEW" }, { "text": "Final", "value": "FINAL" }];
                self["rejectOptions"] = [{ "text": "Enable Contract Editing", "value": "ENABLE_EDITING" }, { "text": "Draft", "value": "DRAFT" }, { "text": "Review", "value": "REVIEW" }];
                self["approveOptions"] = [{ "text": "Review", "value": "REVIEW" }, { "text": "Final", "value": "FINAL" }];

                if (form.screenMode === "VIEW") {
                    var workflowDefinitionId = form.getFieldByModelKey("workflowDefinitionId");
                    var url = 'vdi/workflow/approvalprocess/state/get/one?workflowDefinitionId=' + workflowDefinitionId.modelValue;
                    httpService.get(url).then(function (results) {
                        if (results.status === 200) {
                            var dataSet = results.data.dataset || [];
                            populateStepsDataToKanban(dataSet);
                        }
                    });

                }
            };

            this.makeWorkflowActiveHandler = function (rowData, parentForm) {
                console.log(rowData);

                if (rowData.isActive === true) {
                    Notification.success({
                        message: "Atleast one workflow should be active",
                        title: 'Status',
                        delay: 5000
                    });
                }
                else {
                    var validateUrl = 'vdi/workflow/approvalprocess/validate/active/approvals?isActive=t';
                    httpService.get(validateUrl).then(function (results) {
                        if (results.status === 200) {
                            if (results.data.dataset.length !== 0) {
                                var updateUrl = 'vdi/workflow/approvalprocess/isactive/update';
                                var payload = {
                                    "isActive": "f"
                                };
                                httpService.put(updateUrl, payload).then(function (results) {
                                    if (results.status === 202) {
                                        Notification.success({
                                            message: "Existing Workflows Inactived Successfully",
                                            title: 'Status',
                                            delay: 5000
                                        });
                                    }
                                });
                            }
                        }
                    }); 
                }                  
            };

            this.setScreenMode = function (screenMode) {
                this.form.setScreenMode(screenMode);
                self["screenMode"] = screenMode;
                if (screenMode === "EDIT") {
                    var workflowStateTypeId = getFieldByKey("workflowStateTypeId");
                    workflowStateTypeId.setDefaultValue();

                    var workFlowKanban = getFieldByKey("workFlowKanban");

                    var workflowStateCode = getFieldByKey("workflowStateCode");
                    workflowStateCode.options = removeSpecifiedOptionFromField(self["stateOptions"], workFlowKanban.steps, true);
                }
            };

            var populateStepsDataToKanban = function (stepsData) {

                var workFlowKanban = getFieldByKey("workFlowKanban");
                workFlowKanban.containers = [];
                var roleField = getFieldByKey("roleEntityId");

                angular.forEach(stepsData, function (data, index) {
                    if (data.workflowStateRoleGroup) {
                        var roleIds = alasql('select roleEntityId, sequenceNo from ?', [data.workflowStateRoleGroup]);
                        data["roleGroupSequenceBox"] = alasql('select * from ? as rp inner join ? ri on rp.value=ri.roleEntityId order by ri.sequenceNo', [roleField.options, roleIds]);
                        data["roleEntityId"] = data["roleGroupSequenceBox"];
                        var kanbanStepData = bindDataToKanban(data, false);
                        workFlowKanban.containers.push(kanbanStepData);
                        delete data.roleEntityId;
                        delete data.roleGroupSequenceBox;
                        workflowStateDefinitionArray.push(data);
                    }
                });

            };

            var isDropDownLoaded = function () {
                var deferred = $q.defer();
                var timer = setInterval(function () {
                    try {
                        if (isAllDropDownDataLoaded()) {
                            deferred.resolve("success");
                        }
                    }
                    catch (err) {
                        console.log("2110--> error " + err);
                    }
                }, 1000);
                return deferred.promise;
            };

            var isAllDropDownDataLoaded = function () {
                var isAllddLoaded = false;
                var rejectField = getFieldByKey("rejectStatusCode");
                var approveField = getFieldByKey("approveStatusCode");
                if (rejectField.options.length > 0 && approveField.options.length > 0) {
                    isAllddLoaded = true;
                } else {
                    isAllddLoaded = false;
                }
                return isAllddLoaded;
            };

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                var tobeSavedData = {};
                tobeSavedData["workflowDefinitionId"] = formServiceModel.workflowDefinitionId;
                tobeSavedData["applicationEntityId"] = 1000;
                tobeSavedData["workflowName"] = formServiceModel.workflowName;
                tobeSavedData["entityTypeCode"] = 'CONTRACT';
                tobeSavedData["isActive"] = "f";
                var wfsdArray = [];

                angular.forEach(workflowStateDefinitionArray, function (data, index) {
                    data.isActive = data.isActive === true || data.isActive === "t" ? "t" : "f";
                    data.isStartState = data.isStartState === true || data.isStartState === "t" ? "t" : "f";
                    data.isEndState = data.isEndState === true || data.isEndState === "t" ? "t" : "f";
                    wfsdArray.push(data);
                });
                tobeSavedData["workflowStateDefinition"] = wfsdArray;
                return tobeSavedData;
            };

            this.runValidations = function (formServiceModel, operationType, parentForm) {

                var defer = $q.defer();
                var isValid = false;
                var regex = /^[a-zA-Z0-9\\s ]*$/;

                var workflowName = formServiceModel.workflowName;
                var startStateArrayList = alasql('select * from ? as wsd where wsd.isStartState=true', [workflowStateDefinitionArray]);

                if (regex.test(workflowName)) {

                    if (workflowName === "" || workflowName === null) {
                        isValid = false;
                        overlay.hide();
                        Notification.error({
                            message: "Workflow name is required",
                            title: 'REQUIRED FIELDS',
                            delay: 5000
                        });
                    }
                    else if (workflowStateDefinitionArray.length === 0) {
                        isValid = false;
                        overlay.hide();
                        Notification.error({
                            message: "Atleast one step required to create workflow",
                            title: 'REQUIRED FIELDS',
                            delay: 5000
                        });
                    }
                    else if (startStateArrayList.length === 0) {
                        isValid = false;
                        overlay.hide();
                        Notification.error({
                            message: "One start state is required from workflow steps",
                            title: 'REQUIRED FIELDS',
                            delay: 5000
                        });
                    }
                    else {
                        if (operationType !== "EDIT") {
                            var url = 'vdi/workflow/approvalprocess/workflow/name/getone?workflowName=' + workflowName.toUpperCase();
                            httpService.get(url).then(function (results) {
                                if (results.status === 200) {
                                    if (results.data.dataset.length === 0) {
                                        isValid = true;
                                    }
                                    else {
                                        isValid = false;
                                        overlay.hide();
                                        Notification.error({
                                            message: "Workflow Name Already exists",
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
                        message: "Special characters are not allowed in Workflow Name",
                        title: 'REQUIRED FIELDS',
                        delay: 5000
                    });
                }
                return defer.promise;
            };

            this.populateViewServiceDataModel = function (modelToBeSet) {
                console.log("I am through populateViewServiceDataModel", modelToBeSet);
                self.form.populateViewServiceDataModel(modelToBeSet);
            };

            this.workflowStepHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                if (self["screenMode"] !== "VIEW") {
                    var modelValue = sourceField.modelValue;
                    var rejectField = getFieldByKey("rejectStatusCode");
                    var approveField = getFieldByKey("approveStatusCode");
                    var startStateField = getFieldByKey("isStartState");

                    rejectField.options = removeSpecifiedOptionFromField(self["rejectOptions"], modelValue, false);
                    approveField.options = removeSpecifiedOptionFromField(self["approveOptions"], modelValue, false);

                    if (modelValue === "DRAFT") {
                        rejectField.modelValue = self["isUpdateStepDataFlag"] === false ? "ENABLE_EDITING" : rejectField.modelValue;
                        approveField.show = true;
                        rejectField.disabled = true;
                        startStateField.modelValue = true;
                        startStateField.disabled = true;
                    }
                    else if (modelValue === "FINAL") {
                        approveField.modelValue = self["isUpdateStepDataFlag"] === false ? "" : approveField.modelValue;
                        approveField.show = false;
                        rejectField.disabled = false;
                        startStateField.disabled = false;
                    }
                    else {
                        rejectField.modelValue = self["isUpdateStepDataFlag"] === false ? "" : rejectField.modelValue;
                        approveField.show = true;
                        rejectField.disabled = false;
                        startStateField.disabled = false;
                    }
                }                

            };

            this.approvalTypeChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                if (self["screenMode"] !== "VIEW") {
                    var modelValue = sourceField.modelValue;
                    var roleGroupSequenceBox = getFieldByKey("roleGroupSequenceBox");
                    var minGroups = getFieldByKey("minGroups");
                    var roleGroupField = getFieldByKey("roleEntityId");

                    if (modelValue === "1" || modelValue === 1) {
                        roleGroupSequenceBox.show = true;
                        minGroups.show = false;
                    }
                    else if (modelValue === "2" || modelValue === 2) {
                        roleGroupSequenceBox.show = false;
                        minGroups.show = true;
                    }

                    if (!self.isUpdateStepDataFlag) {
                        roleGroupSequenceBox.options = [];
                        roleGroupSequenceBox.modelValue = [];
                        minGroups.options = [];
                        minGroups.modelValue = [];
                        roleGroupField.modelValue = [];
                    }
                    else {
                        this.multiRoleGroupsChangeHandler(roleGroupField, parentForm, parentSection, sectionDataModel, formDataModel, event);
                    }
                }
            };

            this.multiRoleGroupsChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                if (self["screenMode"] !== "VIEW") {
                    var modelValue = sourceField.modelValue;
                    if (modelValue !== undefined) {
                        var selectedLength = sourceField.modelValue.length;
                        var roleGroupSequenceBox = getFieldByKey("roleGroupSequenceBox");
                        var minGroups = getFieldByKey("minGroups");
                        var stateTypeField = getFieldByKey("workflowStateTypeId");

                        if (stateTypeField.modelValue === "1" || stateTypeField.modelValue === 1) {
                            roleGroupSequenceBox.options = modelValue;
                            roleGroupSequenceBox.modelValue = modelValue;
                        }
                        else if (stateTypeField.modelValue === "2" || stateTypeField.modelValue === 2) {
                            var options = [];
                            for (var i = 1; i <= selectedLength; i++) {
                                var option = {
                                    "text": i + " of " + selectedLength,
                                    "value": i + "_" + selectedLength
                                };
                                options.push(option);
                            }
                            minGroups.dataConfig.localData = options;
                            minGroups.options = options;
                        }

                        if (sectionDataModel !== undefined && sectionDataModel["workflowStateDefinitionId"] !== "") {
                            if (sectionDataModel["workflowStateDefinitionId"] !== undefined) {
                                removeUncheckedRoleFromPayload(sourceField.modelValue);
                            }
                        }
                    }
                }                
            };
            
            this.startStateHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var modelValue = sourceField.modelValue;
                var endStateField = getFieldByKey("isEndState");
                if (modelValue === "" || modelValue === false) {
                    endStateField.modelValue = false;
                }
            };

            this.endStateHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var modelValue = sourceField.modelValue;
                var startStateField = getFieldByKey("isStartState");
                if (modelValue === "" || modelValue === false) {
                    startStateField.modelValue = false;
                }
            };

            this.addToWorkflowHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                sectionDataModel["roleEntityId"] = sectionDataModel["roleEntityId"] === undefined || sectionDataModel["roleEntityId"].length === 0 ? "" : sectionDataModel["roleEntityId"];
                sectionDataModel["roleGroupSequenceBox"] = sectionDataModel["roleGroupSequenceBox"] === undefined || sectionDataModel["roleGroupSequenceBox"].length === 0 ? "" : sectionDataModel["roleGroupSequenceBox"];
                sectionDataModel["minGroups"] = sectionDataModel["minGroups"] === undefined || sectionDataModel["minGroups"].length === 0 ? "" : sectionDataModel["minGroups"];

                var startStateArrayList = alasql('select * from ? as wsd where wsd.isStartState=true', [workflowStateDefinitionArray]);
                var endStateArrayList = alasql('select * from ? as wsd where wsd.isEndState=true', [workflowStateDefinitionArray]);

                if (sectionDataModel["workflowStateCode"] === "" || sectionDataModel["rejectStatusCode"] === ""
                    || sectionDataModel["workflowStateTypeId"] === "" || sectionDataModel["roleEntityId"] === "") {
                    swal({
                        text: "All fields are mandatory!",
                        icon: "info",
                        button: "Okay"
                    });
                }
                else if ((startStateArrayList.length !== 0 && sectionDataModel["isStartState"] === true && !self.isUpdateStepDataFlag)
                    || (endStateArrayList.length !== 0 && sectionDataModel["isEndState"] === true && !self.isUpdateStepDataFlag)) {
                    swal({
                        text: "Only one start state and end state allowed in the workflow!",
                        icon: "info",
                        button: "Okay"
                    });
                }
                else {
                    if ((sectionDataModel["workflowStateCode"] !== "FINAL" && sectionDataModel["approveStatusCode"] === "") ||
                        (sectionDataModel["workflowStateTypeId"] === "1" && sectionDataModel["roleGroupSequenceBox"] === "") ||
                        (sectionDataModel["workflowStateTypeId"] === "2" && sectionDataModel["minGroups"] === "")) {
                        swal({
                            text: "All fields are mandatory!",
                            icon: "info",
                            button: "Okay"
                        });
                    }
                    else {
                        var workFlowKanban = getFieldByKey("workFlowKanban");
                        var workflowStateField = getFieldByKey("workflowStateCode");

                        var stepDataToKanban = bindDataToKanban(sectionDataModel, true);
                        var stepDataToPayload = buildDataToPayload(sectionDataModel);

                        if (!self.isUpdateStepDataFlag) {
                            workFlowKanban.containers.push(stepDataToKanban);
                            workflowStateDefinitionArray.push(stepDataToPayload);
                        }
                        else {
                            if (self.payloadToBeUpdated.length !== 0 && self.payloadToBeUpdated[0].workflowStateDefinitionId === stepDataToPayload.workflowStateDefinitionId) {
                                angular.forEach(self.payloadToBeUpdated, function (data, index) {
                                    stepDataToPayload["workflowStateRoleGroup"].push(data);
                                });
                            }
                            workFlowKanban.containers.splice(self["stepIndexInContainer"], 1, stepDataToKanban);
                            workflowStateDefinitionArray.splice(self["stepIndexInPayload"], 1, stepDataToPayload);
                        }

                        workflowStateField.options = removeSpecifiedOptionFromField(self["stateOptions"], workFlowKanban.steps, true);
                        resetAllFieldsAfterStepAddedToWorkflow();

                        self.isUpdateStepDataFlag = false;
                    }
                }

            };

            var bindDataToKanban = function (sectionDataModel, isAddToWorkflowButtonClicked) {

                var workFlowKanban = getFieldByKey("workFlowKanban");

                var workflowStateTypeId = sectionDataModel["workflowStateTypeId"];
                var roleGroupSequenceBox = sectionDataModel["roleGroupSequenceBox"];
                var roleEntityId = sectionDataModel["roleEntityId"];

                var stepField = getFieldByKey("workflowStateCode");
                var approveField = getFieldByKey("approveStatusCode");
                var rejectField = getFieldByKey("rejectStatusCode");
                var stateTypeField = getFieldByKey("workflowStateTypeId");
                var minGroups = getFieldByKey("minGroups");

                var workflowStateName; var approveName; var rejectName; var stateTypeName; var stateName;

                if (sectionDataModel["isStartState"] === true) {
                    stateName = "Start";
                }
                else if (sectionDataModel["isEndState"] === true) {
                    stateName = "End";
                }
                else {
                    stateName = "None";
                }

                if (isAddToWorkflowButtonClicked) {
                    workflowStateName = stepField.getSelectedText();
                    approveName = approveField.getSelectedText();
                    rejectName = rejectField.getSelectedText();
                    stateTypeName = stateTypeField.getSelectedText();
                }
                else {
                    workflowStateName = getSelectedTextByModelValue(self["stateOptions"], sectionDataModel["workflowStateCode"]);
                    approveName = getSelectedTextByModelValue(self["approveOptions"], sectionDataModel["approveStatusCode"]);
                    rejectName = getSelectedTextByModelValue(self["rejectOptions"], sectionDataModel["rejectStatusCode"]);
                    stateTypeName = getSelectedTextByModelValue(stateTypeField.options, sectionDataModel["workflowStateTypeId"]);
                }

                var stepDetails = "";
                if (workflowStateName !== "Final") {
                    stepDetails = "<div><span>Approval Type: </span>" + stateTypeName + "</div><div><span>Approve: </span>" + approveName + "</div><div><span>Reject: </span>" + rejectName + "</div><div><span>State Type: </span>" + stateName + "</div>";
                }
                else {
                    stepDetails = "<div><span>Approval Type: </span>" + stateTypeName + "</div><div><span>Reject: </span>" + rejectName + "</div><div><span>State Type: </span>" + stateName + "</div>";
                }

                workFlowKanban.steps.push(sectionDataModel["workflowStateCode"]);

                var stepData = {};
                var groupItems = [];
                if (workflowStateTypeId === "1" || workflowStateTypeId === 1) {
                    angular.forEach(roleGroupSequenceBox, function (data, index) {
                        var users = data.item.user;
                        var userItems = [];
                        angular.forEach(users, function (data, index) {
                            var userItem = {
                                "name": data.userName
                            };
                            userItems.push(userItem);
                        });
                        var groupItem = {
                            "label": data.text,
                            "items": userItems
                        };
                        groupItems.push(groupItem);
                    });
                }
                else {
                    angular.forEach(roleEntityId, function (data, index) {
                        var users = data.item.user;
                        var userItems = [];
                        angular.forEach(users, function (data, index) {
                            var userItem = {
                                "name": data.userName
                            };
                            userItems.push(userItem);
                        });
                        var groupItem = {
                            "label": data.text,
                            "items": userItems
                        };
                        groupItems.push(groupItem);
                    });
                    var minGroupText = isAddToWorkflowButtonClicked ? minGroups.getSelectedText() : sectionDataModel["additionalConfig"]["minGroup"] + " of " + sectionDataModel["additionalConfig"]["maxGroup"];
                    var stepDetailsList = stepDetails.split("Parallel", 2);
                    stepDetails = stepDetailsList[0] + "Parallel (" + minGroupText + ")" + stepDetailsList[1];
                }
                stepData = {
                    "status": workflowStateName,
                    "stepdetails": (stepDetails),
                    "items": groupItems
                };
                return stepData;
            };

            var buildDataToPayload = function (sectionDataModel) {

                var workflowStateTypeId = sectionDataModel["workflowStateTypeId"];
                var roleGroupSequenceBox = sectionDataModel["roleGroupSequenceBox"];
                var roleEntityId = sectionDataModel["roleEntityId"];
                var minGroups = sectionDataModel["minGroups"];
                var workflowDefinitionId = sectionDataModel["workflowDefinitionId"];
                var workflowStateDefinitionId = sectionDataModel["workflowStateDefinitionId"];

                var stepField = getFieldByKey("workflowStateCode");
                var workflowStateName = stepField.getSelectedText();

                var workflowStateData = {
                    "workflowStateDefinitionId": workflowStateDefinitionId,
                    "workflowDefinitionId": workflowDefinitionId,
                    "workflowStateName": workflowStateName,
                    "workflowStateCode": sectionDataModel["workflowStateCode"],
                    "workflowStateTypeId": workflowStateTypeId,
                    "isStartState": sectionDataModel["isStartState"],
                    "isEndState": sectionDataModel["isEndState"],
                    "approveStatusCode": sectionDataModel["approveStatusCode"] === "" ? "NULL" : sectionDataModel["approveStatusCode"],
                    "rejectStatusCode": sectionDataModel["rejectStatusCode"],
                    "isActive": "t",
                    "operationType": workflowStateDefinitionId === "" || workflowStateDefinitionId === undefined ? "INSERT" : "UPDATE"
                };
                var workflowStateRoleGroup = [];
                if (workflowStateTypeId === "1" || workflowStateTypeId === 1) {
                    workflowStateData["additionalConfig"] = {};
                    angular.forEach(roleGroupSequenceBox, function (data, index) {
                        var workflowStateRoleGroupId = getWorkflowStateRoleGroupIdByRoleId(data.value);
                        var stateGroup = {
                            "workflowStateRoleGroupId": workflowStateRoleGroupId,
                            "workflowDefinitionId": workflowDefinitionId,
                            "workflowStateDefinitionId": workflowStateDefinitionId,
                            "roleEntityId": data.value,
                            "sequenceNo": index + 1,
                            "beginDate": moment("01/01/2019").format("YYYY/MM/DD"),
                            "endDate": moment("01/01/2099").format("YYYY/MM/DD"),
                            "operationType": workflowStateRoleGroupId === "" || workflowStateRoleGroupId === undefined ? "INSERT" : "UPDATE"
                        };
                        workflowStateRoleGroup.push(stateGroup);
                    });
                }
                else {
                    var minArray = minGroups.split("_");
                    workflowStateData["additionalConfig"] = {
                        "minGroup": minArray[0],
                        "maxGroup": minArray[1]
                    };
                    angular.forEach(roleEntityId, function (data, index) {
                        var workflowStateRoleGroupId = getWorkflowStateRoleGroupIdByRoleId(data.value);
                        var stateGroup = {
                            "workflowStateRoleGroupId": workflowStateRoleGroupId,
                            "workflowDefinitionId": workflowDefinitionId,
                            "workflowStateDefinitionId": workflowStateDefinitionId,
                            "roleEntityId": data.value,
                            "sequenceNo": 0,
                            "beginDate": moment("01/01/2019").format("YYYY/MM/DD"),
                            "endDate": moment("01/01/2099").format("YYYY/MM/DD"),
                            "operationType": workflowStateRoleGroupId === "" || workflowStateRoleGroupId === undefined ? "INSERT" : "UPDATE"
                        };
                        workflowStateRoleGroup.push(stateGroup);
                    });
                }
                workflowStateData["workflowStateRoleGroup"] = workflowStateRoleGroup;
                return workflowStateData;
            };

            this.editWorkflowStepDetailsHandler = function (sourceField, container) {

                var stepName = container.status;

                var workFlowKanban = getFieldByKey("workFlowKanban");
                var containerData = workFlowKanban.containers;
                var payloadData = workflowStateDefinitionArray;

                addSpecifiedOptionBackToField(stepName);

                var stepData = payloadData.find(({ workflowStateName }) => workflowStateName === stepName);
                self["stepIndexInPayload"] = payloadData.findIndex(({ workflowStateName }) => workflowStateName === stepName);
                self["stepIndexInContainer"] = containerData.findIndex(({ status }) => status === stepName);

                self.isUpdateStepDataFlag = true;

                assignStepDataToField(stepData);
                console.log(getFieldByKey("rejectStatusCode"));

                var stepField = getFieldByKey("workflowStateCode");
                var stepTypeField = getFieldByKey("workflowStateTypeId");
                this.workflowStepHandler(stepField);
                this.approvalTypeChangeHandler(stepTypeField);
            };

            this.deleteWorkflowStepDetailsHandler = function (sourceField, container) {

                swal({
                    title: "Are you sure?",
                    text: "Step will be deleted and cannot be reverted!",
                    icon: "warning",
                    buttons: true,
                    dangerMode: true
                })
                .then((confirmflag) => {
                    if (confirmflag) {
                        var stepName = container.status;

                        var workFlowKanban = getFieldByKey("workFlowKanban");
                        var containerData = workFlowKanban.containers;
                        var payloadData = workflowStateDefinitionArray;

                        var stepDataToBeDeletedInContainer = containerData.find(({ status }) => status === stepName);
                        var stepDataToBeDeletedInPayload = payloadData.find(({ workflowStateName }) => workflowStateName === stepName);
                        
                        var payloadStepIndex = payloadData.findIndex(({ workflowStateName }) => workflowStateName === stepName);

                        if ("workflowStateDefinitionId" in stepDataToBeDeletedInPayload) {
                            stepDataToBeDeletedInPayload["isActive"] = false;
                            payloadData.splice(payloadStepIndex, 1, stepDataToBeDeletedInPayload);
                        }
                        else {
                            payloadData = payloadData.filter(item => item !== stepDataToBeDeletedInPayload);
                        }

                        containerData = containerData.filter(item => item !== stepDataToBeDeletedInContainer);

                        workFlowKanban.containers = containerData;
                        workflowStateDefinitionArray = payloadData;

                        addSpecifiedOptionBackToField(stepName);
                    }
                });
            };

            var assignStepDataToField = function (stepData) {

                angular.forEach(stepData, function (value, key) {
                    var field = getFieldByKey(key);
                    if (field !== null) {
                        if (field.fieldType === "dropdown") {
                            field.modelValue = value;
                        }
                        else if (field.fieldType === "radio") {
                            if (value === 1) {
                                value = "1";
                            }
                            else if (value === 2) {
                                value = "2";
                            }
                            field.modelValue = value;
                        }
                        else if (field.fieldType === "hidden") {
                            field.modelValue = value;
                        }
                        else if (field.fieldType === "checkbox") {
                            field.modelValue = value;
                        }
                    }
                    else if (field === null && key === "workflowStateRoleGroup") {
                        var roleField = getFieldByKey("roleEntityId");
                        roleField.modelValue = roleField.modelValue === undefined ? [] : roleField.modelValue;
                        angular.forEach(value, function (data, index) {
                            if (moment(data["endDate"]) >= moment()) {
                                roleField.modelValue.push(getSpecifiedOptionFromOptions(roleField.options, data.roleEntityId));
                            }
                        });
                        var rolesLength = roleField.modelValue.length;
                        if (stepData["workflowStateTypeId"] === "1" || stepData["workflowStateTypeId"] === 1) {
                            var roleGroupSequenceBox = getFieldByKey("roleGroupSequenceBox");
                            roleGroupSequenceBox.options = roleField.modelValue;
                            roleGroupSequenceBox.modelValue = roleField.modelValue;
                        }
                        else {
                            var minGroups = getFieldByKey("minGroups");
                            var options = [];
                            for (var i = 1; i <= rolesLength; i++) {
                                var option = {
                                    "text": i + " of " + rolesLength,
                                    "value": i + "_" + rolesLength
                                };
                                options.push(option);
                            }
                            minGroups.dataConfig.localData = options;
                            minGroups.options = options;
                            minGroups.modelValue = stepData["additionalConfig"]["minGroup"] + "_" + stepData["additionalConfig"]["maxGroup"];
                        }
                    }
                });
            };

            var getWorkflowStateRoleGroupIdByRoleId = function (roleId) {
                var workflowStateRoleGroupId = "";
                if (workflowStateDefinitionArray.length !== 0 && self.isUpdateStepDataFlag) {
                    var stepData = workflowStateDefinitionArray[self["stepIndexInPayload"]];
                    var stepRoleGroups = stepData["workflowStateRoleGroup"];
                    angular.forEach(stepRoleGroups, function (data, index) {
                        if (data.roleEntityId === roleId) {
                            workflowStateRoleGroupId = data.workflowStateRoleGroupId;
                        }
                    });
                }
                return workflowStateRoleGroupId;
            };

            var removeUncheckedRoleFromPayload = function (modelValue) {

                if (workflowStateDefinitionArray.length !== 0) {
                    var stepData = workflowStateDefinitionArray[self["stepIndexInPayload"]];
                    var stepRoleGroups = stepData["workflowStateRoleGroup"];
                    self["payloadToBeUpdated"] = alasql('select srg.* from ? as srg left outer join ? as mv on srg.roleEntityId = mv.value where mv.value is null', [stepRoleGroups, modelValue]);
                    angular.forEach(self.payloadToBeUpdated, function (data, index) {
                        self.payloadToBeUpdated[index]["beginDate"] = moment(data["beginDate"]).format("YYYY/MM/DD");
                        self.payloadToBeUpdated[index]["endDate"] = moment().subtract(1, 'day').format("YYYY/MM/DD");
                    });
                }
            };

            var getSpecifiedOptionFromOptions = function (options, roleId) {
                var option;
                angular.forEach(options, function (data, index) {
                    if (data.value === roleId) {
                        option = data;
                    }
                });
                return option;
            }; 

            var addSpecifiedOptionBackToField = function (stepName) {
                var stepField = getFieldByKey("workflowStateCode");
                var options = self["stateOptions"];

                angular.forEach(options, function (data, index) {
                    if (data.text === stepName) {
                        stepField.options.push(data);
                    }
                });
            };

            var removeSpecifiedOptionFromField = function (options, dataToBeRemoved, isStepFilter) {
                var updatedOptions = [];
                if (isStepFilter) {
                    angular.forEach(options, function (data, index) {
                        var existsFlag = false;
                        angular.forEach(dataToBeRemoved, function (item, value) {
                            if (data.value === item) {
                                existsFlag = true;
                            }
                        });
                        if (!existsFlag) {
                            updatedOptions.push(data);
                        }
                    });
                }
                else {
                    angular.forEach(options, function (data, index) {
                        if (data.value !== dataToBeRemoved) {
                            updatedOptions.push(data);
                        }
                    });
                }
                return updatedOptions;
            };

            var getSelectedTextByModelValue = function (options, modelValue) {
                var SelectedText = "";
                if (!isNaN(modelValue)) {
                    modelValue = modelValue.toString();
                }
                angular.forEach(options, function (data, index) {
                    if (data.value === modelValue) {
                        SelectedText = data.text;
                    }
                });
                return SelectedText;
            };

            var resetAllFieldsAfterStepAddedToWorkflow = function () {
                var fieldModelKeysToReset = ["workflowStateCode", "rejectStatusCode", "approveStatusCode", "roleEntityId", "roleGroupSequenceBox", "minGroups", "isStartState", "isEndState"];
                angular.forEach(fieldModelKeysToReset, function (modelKey, ind) {
                    var field = getFieldByKey(modelKey);
                    if (field.fieldType === "dropdown") {
                        if (field.ismultiple) {
                            field.reset();
                            field.modelValue = [];
                        }
                        else {
                            field.modelValue = "";
                        }
                        field.disabled = false;
                    }
                    else if (field.fieldType === "listbox") {
                        field.options = [];
                        field.modelValue = [];
                    }
                    else if (field.fieldType === "hidden") {
                        field.modelValue = "";
                    }
                    else if (field.fieldType === "checkbox") {
                        field.modelValue = false;
                        field.disabled = false;
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
        return approvalProcessService;
    });

    return angularAMD;
});