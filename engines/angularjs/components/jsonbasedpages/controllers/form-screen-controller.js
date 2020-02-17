/*
1. form is divided into sections, sections into row divisions and divisions into fields
	form-> section[] -> division[] -> fields [] 
2. if modelKey of the section is not specified then considering it as the root model object
3. if modelKey is not specified for a field then it won't be part of the ng-model
4. dataConfig is for data to be populated for selectable elements like dropdown, radio group and checkbox group
	a. if you have static data for a field then specify the localData object with "text" and "value" keys
	b. to populate the from remote service then specify dataUrl that would be a rest api url and displayKey and valueKey where these to 
	   text and value by default
5. supported field types: textbox, textarea, checkbox, radio, email, number, amount, date, systemCode
6. each field will have agularjs custom directive, all styles and css will be part of the same
*/
define(['app', 'dynamicFormDirective', 'dateUtilService', 'actionsDirective', 'breadcrumbDirective',
    'httpService', 'stateService', 'screenDefinitionService', 'modelUtilService', 'utilService'], function () {
        'use strict';
        return ['$scope', '$state', '$injector', '$q', '$http', '$timeout', 'httpService', 'overlay', '$location', '$filter', '$rootScope', '$stateParams', 'constants',
            'Notification', 'menuDefinitionService', 'dateUtilService', 'modelUtilService', 'utilService', 'requireProxy',
            'screenDefinitionService', 'appDefinitionService', 'stateService', 'localPersistenceService', '$uibModal', '_', 'modalPopUpService',
            function ($scope, $state, $injector, $q, $http, $timeout, httpService, overlay, $location, $filter, $rootScope, $stateParams, constants,
                Notification, menuDefinitionService, dateUtilService, modelUtilService, utilService, requireProxy,
                screenDefinitionService, appDefinitionService, stateService, localPersistenceService, $uibModal, _, modalPopUpService
            ) {
                var $kbscope = $scope;
                $scope.form = {};
                $scope.form["isManidatoryRequired"] = true;
                $scope.form.getScreenMode = function () {
                    var paramKeys = Object.keys($stateParams);
                    if ($scope.form.noStateParamsRequired || (paramKeys.length > 0 && !(paramKeys.length === 1 && paramKeys[0] === 'tenantCode'))) {
                        if ($scope.form.screenMode === 'EDIT') {
                            return "EDIT";
                        }
                        return "VIEW";
                    }
                    else {
                        return "ADD";
                    }
                };

                $scope.form.isEditMode = function () {
                    return $scope.form.getScreenMode() === "EDIT";
                };

                var init = function () {
                    console.log("$stateParams loading.. ");
                    menuDefinitionService.getActiveMenuMetadata().then(function (currentMenuDef) {
                        $scope.form.currentMenuDefinition = currentMenuDef;
                        buildBreadcrumbModel();

                        screenDefinitionService.loadCurrentScreenMetaData(function (screenDefConfig) {
                            console.log('screenConfig in dynamicFormDirective', screenDefConfig);
                            console.log("$stateParams= ", $stateParams);

                            injectDynamicServices(screenDefConfig).then(function () {
                                if ($scope.functionalService) {
                                    attachServiceHandlers($scope.functionalService);
                                }
                                else {
                                    $scope.functionalService = $scope.form;
                                }
                                intializeScopeDataModel(screenDefConfig);

                                buildActionModel(screenDefConfig);
                                $scope.form.setScreenMode("ADD");
                                buildScreen(screenDefConfig);

                                $rootScope.$pageFinishedLoading = true;
                            });

                        });
                    });
                };

                var buildActionModel = function (screenDefConfig) {
                    console.log("buildActionModel");
                    var actions = screenDefConfig.actions;
                    angular.forEach(actions, function (action, index) {
                        var navigateTo = action.navigateTo;
                        if (action.actionType === "CLOSE") {
                            action.handler = $scope.form.close;
                        }
                        else if (action.actionType === "CANCEL" && navigateTo === "VIEW_MODE") {
                            action.handler = $scope.form.cancel;
                        }
                        else if (action.actionType === "WORKFLOW") {
                            action.handler = $scope.form.workflow;
                        }
                        else if (action.actionType === "DUPLICATE") {
                            action.handler = $scope.form.duplicate;
                        }
                        else if (action.actionType === "SUBMIT") {

                            var dynamicForm = $scope.form["df_form"];
                            var afterSaveHandler;
                            if (navigateTo === "SELF") {
                                afterSaveHandler = $scope.form.clear;
                            }
                            else if (navigateTo === "PARENT") {
                                afterSaveHandler = $scope.form.close;
                            }
                            else {
                                afterSaveHandler = navigateTo;
                            }
                            action.handler = function (sourceAction, parentForm) {
                                // to disable butoon after one click
                                // $rootScope.mainLoader =true;
                                console.log("sourceAction, parentForm=", sourceAction, parentForm)
                                overlay.load();
                                $scope.disableSubmit = true;
                                $scope.form["df_form"];
                                if ($scope.form.isEditMode()) {
                                    $scope.updateBackToService($scope.form["df_form"]).then(function (result) {
                                        console.log("afterSaveHandler", afterSaveHandler);
                                        afterSaveHandler(sourceAction);
                                    });
                                }
                                else {
                                    $scope.saveBackToService($scope.form["df_form"]).then(function (result) {
                                        //         alert("am in afterSaveHandler");
                                        console.log("afterSaveHandler", afterSaveHandler);
                                        afterSaveHandler(sourceAction);
                                    });
                                }

                            };
                        }
                        else if (action.actionType === "POPUP") {
                            console.log('action handler POPUP', action);
                            action.handler = function () {
                                console.log('action handler', action);
                                if (action.handlerName) {
                                    $scope.functionalService[action.handlerName](this, action);
                                }
                            };
                        }
                        else if (navigateTo) {
                            action.handler = function () {
                                console.log('action handler', this);

                            };
                        }

                    });
                    $scope.actions = actions;
                };
                var buildScreen = function (screenDefConfig) {
                    //buildFormDataModel();
                    //
                    console.log("from loadData method", Object.keys($stateParams));
                    var pageMode = $scope.form.getScreenMode();

                    console.log("pageMode=", pageMode);

                    if (pageMode === 'ADD') {
                        $scope.functionalService.setScreenMode("ADD");
                        // $scope.setPageTitle($scope.pageTitle);
                        $scope.functionalService.resetFormDataModel();

                    }
                    else {
                        if (!$scope.noWorkflow) {
                            $scope.form.getWorkflowActionsAndNotifications();
                        }

                        $scope.functionalService.populateData(screenDefConfig);
                        $scope.form.setScreenMode(pageMode);
                    }
                    $scope.form["modalforms"] = screenDefConfig["modalforms"];
                    overlay.hide();

                };

                var navigateTo = function (action) {
                    var toState = action.navigateTo;
                    var currentMenuKey = stateService.getActiveStateKey();
                    stateService.navigateToState(toState, { "parentState": currentMenuKey });

                };

                var intializeScopeDataModel = function (screenDefConfig) {
                    $scope.form = angular.extend($scope.form, screenDefConfig);

                    if (screenDefConfig.saveUrl) $scope.saveUrl = screenDefConfig.saveUrl;
                    if (screenDefConfig.getOneUrl) $scope.getOneUrl = screenDefConfig.getOneUrl;
                    if (screenDefConfig.workflowUrl) $scope.workflowUrl = screenDefConfig.workflowUrl;
                    if (screenDefConfig.noWorkflow) $scope.noWorkflow = screenDefConfig.noWorkflow;
                    if (screenDefConfig.queryStringParams) $scope.queryStringParams = screenDefConfig.queryStringParams;
                    if (screenDefConfig.entityTypeKey) $scope.entityTypeKey = screenDefConfig.entityTypeKey || "entity";
                    if (screenDefConfig.defaultStatus) $scope.defaultStatus = screenDefConfig.defaultStatus;

                    $scope.form.getOneMultipleItems = screenDefConfig.getOneMultipleItems || false;
                    $scope.form.alwaysNewMode = screenDefConfig.alwaysNewMode || false;
                    $scope.form.alwaysUpdateMode = screenDefConfig.alwaysUpdateMode || false;

                    $scope.editKeys = screenDefConfig.editKeys;
                    var parentDataUrl;
                    if (parentDataUrl) {
                        var baseUrl = parentDataUrl.substr(0, parentDataUrl.length - 3);
                        if ($scope.getOneUrl === undefined || $scope.getOneUrl === null) {
                            $scope.getOneUrl = baseUrl + "getone";
                        }
                        if ($scope.saveUrl === undefined || $scope.saveUrl === null) {
                            $scope.saveUrl = baseUrl + "save";
                        }
                    }
                    else {
                        //TODO: show error message.
                    }

                    //Form Submit Check Flag
                    $scope.save_submit = false;

                    //URL Params
                    if ($scope.editKeys && $scope.editKeys.length > 0) {
                        $scope.form.entityObjectId = $stateParams[$scope.editKeys[0]];
                    }
                    $scope.entityCode = $stateParams.entityCode;

                    $scope.form.urlParams = {};
                    for (var paramKey in $stateParams) {
                        $scope.form.urlParams[paramKey] = $stateParams[paramKey];
                    }

                    //check for status and display update button
                    //SentBack 
                    $scope.form.showUpdateButton = false;
                };

                var buildBreadcrumbModel = function () {
                    $scope.form.activePageTitle = $scope.form.currentMenuDefinition["title"];
                    //$scope.form.breadcrumbMap = $rootScope.breadcrumbMap;
                    var skipParentBreadcrumbMap = $scope.form.currentMenuDefinition["skipParentBreadcrumbMap"];
                    skipParentBreadcrumbMap = (skipParentBreadcrumbMap) ? skipParentBreadcrumbMap : false;
                    if (!skipParentBreadcrumbMap) {
                        $scope.form.breadcrumbMap = localPersistenceService.get("breadcrumb", true);
                    }
                };

                $scope.setForm = function (df_form) {
                    $scope.form = $scope.form || {};
                    $scope.form["df_form"] = df_form;
                    $scope.form.readOnlyForm = false;

                };

                $scope.form.setPageTitle = function (titleSource) {
                    console.log("titleSource=", titleSource);
                    var pageTitleKey = $scope.form.currentMenuDefinition["editTitleKey"];
                    var pageTitle = "Edit";
                    if (pageTitleKey) {
                        pageTitle = modelUtilService.getValueFromModelByKey(pageTitleKey, titleSource, null, $scope.form) || "Edit";

                    }
                    $scope.form.activePageTitle = pageTitle;
                };

                $scope.form.setScreenMode = function (mode) {
                    $scope.form.screenMode = mode;
                    if (mode === "VIEW") {
                        $scope.form.readOnlyForm = true;
                    }
                    else {
                        $scope.form.readOnlyForm = false;
                    }
                    //console.log(" $scope.form.readOnlyForm=", $scope.form);
                    //if($scope.form.functionalService){
                    //    $scope.form.functionalService.showInEditMode( $scope.form);
                    //}
                    $scope.form.save_submit = false;
                };

                $scope.form.populateData = function (screenDefConfig) {
                    console.log("populateData==>", screenDefConfig);
                    overlay.load();
                    var screenUrl = window.location.href;
                    //Need to changes this for now it is static
                    if (!screenUrl.includes("duplicateContract")) {
                        var serviceUrl = buildServiceUrl("GETONE");
                        console.log("serviceUrl", serviceUrl);
                        httpService.get(serviceUrl).then(function (response) {
                            //debugger;
                            var results = {};
                            console.log("populateData results", response);
                            results = response;
                            if (results && (results.data.success === "true" || results.data.success === true)) {
                                overlay.hide();
                                var resultData;
                                if ($scope.form.getOneMultipleItems) {
                                    resultData = results.data.dataset;
                                }
                                else {
                                    resultData = results.data.dataset[0];
                                }

                                // resultData=[{ "horseId": "28498", "equipmentId": "2", "equipmentOnDate": "2017/04/01", "equipmentOffDate": "2017/05/31", "remarks": "test" }];
                                //External Hook for populateViewServiceDataModelHandler
                                if ($scope.functionalService.populateViewServiceDataModel) {
                                    $scope.functionalService.populateViewServiceDataModel(resultData);
                                } else {
                                    $scope.form.populateViewServiceDataModel(resultData);
                                }
                            } else {
                                overlay.hide();
                                console.log("populateData results Error:-", response);
                                var errorCode = (results) ? results.data.code : "401";
                                Notification.error({
                                    message: 'URL<br/>' + constants.api_url + $scope.getOneUrl + '?entityObjectId=' + +$scope.form.entityObjectId,
                                    title: 'CODE ERROR - ' + errorCode,
                                    delay: 5000
                                });
                            }
                        });
                    }

                };

                $scope.form.populateViewServiceDataModel = function (modelToBeSet) {

                    console.log("populateViewServiceDataModel-->", modelToBeSet);
                    $scope.form.setPageTitle(modelToBeSet);

                    if (modelToBeSet) {
                        var screenDef = $scope.form;
                        if (!screenDef && !screenDef.sections) {
                            console.log("sections metadata is missing");
                            return;
                        }
                        $scope.formDataModel = $scope.formDataModel || {};
                        var fields2ToUseRootModel = [];
                        for (var i = 0; i < screenDef.sections.length; i++) {
                            var section = screenDef.sections[i];
                            if (section.modelKey) {
                                $scope.formDataModel[section.modelKey] = {};
                            }

                            var sectionDataModel = $scope.formDataModel[section.modelKey] || $scope.formDataModel;
                            var sectionFromService = modelToBeSet[section.modelKey] || modelToBeSet;

                            if (section.tabs) {
                                for (var l = 0; l < section.tabs.length; l++) {
                                    var tab = section.tabs[l];
                                    var sectionDataModelForTab = sectionFromService[tab.modelKey] || sectionFromService;
                                    var sectionFromServiceForTab = modelToBeSet[tab.modelKey] || modelToBeSet;
                                    populateRowLevelData(tab.rowDivisions, sectionFromServiceForTab, sectionDataModelForTab, section);
                                }
                            }
                            if (section.rowDivisions) {
                                populateRowLevelData(section.rowDivisions, sectionFromService, sectionDataModel, section);
                            }

                        }

                        for (var j = 0; j < fields2ToUseRootModel.length; j++) {
                            if (fields2ToUseRootModel[j].useGetOneModelAsFieldDataModel) {
                                fields2ToUseRootModel[j].setModel(modelToBeSet);
                            }
                        }
                    }
                };
                var populateRowLevelData = function (rowDivisions, sectionFromService, sectionDataModel, section) {

                    if (section["modelType"] === "SINGLE" && angular.isArray(sectionFromService)) {
                        sectionFromService = sectionFromService[0];
                    }
                    for (var j = 0; j < rowDivisions.length; j++) {
                        var rowDivision = rowDivisions[j];
                        for (var k = 0; k < rowDivision.fields.length; k++) {
                            var field = rowDivision.fields[k];
                            if (field.useGetOneModelAsFieldDataModel) {
                                fields2ToUseRootModel.push(field);
                            }
                            else {
                                if (field.setModel) {
                                    field.setModel(sectionFromService);
                                }
                                else {
                                    if (field.modelKey) {
                                        sectionDataModel[field.modelKey] = sectionFromService[field.modelKey];
                                    }
                                }
                            }
                        }

                        if (section.modelKey) {
                            $scope.formDataModel[section.modelKey] = sectionDataModel;
                        }
                        else {
                            if (!angular.isArray(sectionDataModel)) {
                                $scope.formDataModel = angular.extend($scope.formDataModel, sectionDataModel);
                            }
                        }
                    }
                };

                $scope.form.resetFormDataModel = function () {

                    var screenDef = $scope.form;
                    $scope.disableSubmit = false;
                    if (!screenDef && !screenDef.sections) {
                        console.log("sections metadata is missing");
                        return;
                    }
                    $scope.form["df_form"].$setPristine();
                    $scope.form["df_form"].$setValidity();
                    $scope.form["df_form"].$setUntouched();
                    $scope.form.save_submit = false;

                    var formDataModel = {};
                    angular.forEach(screenDef.sections, function (section, key) {
                        var sectionDataModel = {};

                        if (section.tabs) {
                            for (var l = 0; l < section.tabs.length; l++) {
                                var tab = section.tabs[l];
                                var sectionDataModelForTab = {};
                                resetRowLevelData(tab.rowDivisions, sectionDataModelForTab);
                                if (tab.modelKey) {
                                    sectionDataModel[tab.modelKey] = sectionDataModelForTab;
                                }
                                else {
                                    sectionDataModel = angular.extend(sectionDataModel, sectionDataModelForTab);
                                }
                            }
                        }
                        if (section.rowDivisions) {
                            resetRowLevelData(section.rowDivisions, sectionDataModel);
                        }

                        if (section.modelKey) {
                            formDataModel[section.modelKey] = sectionDataModel;
                        }
                        else {
                            formDataModel = angular.extend(formDataModel, sectionDataModel);
                        }
                    });
                    $scope.formDataModel = formDataModel;
                };
                var resetRowLevelData = function (rowDivisions, sectionDataModel) {
                    angular.forEach(rowDivisions, function (rowDivision, key) {
                        angular.forEach(rowDivision.fields, function (field, key) {
                            //console.log("reset==field.modelKey=", field.modelKey);
                            // console.log("field=", field);
                            if (field.modelKey) {
                                // console.log("field=", field);
                                if (field.reset)
                                    field.reset();
                                sectionDataModel[field.modelKey] = "";
                            }
                            field.modelValue = "";

                            if (field.setModel) {
                                field.setModel();
                            }
                        });
                    });
                };

                var getFormDataModelForService = function () {
                    var screenDef = $scope.form;
                    if (!screenDef && !screenDef.sections) {
                        console.log("sections metadata is missing");
                        return;
                    }
                    var formDataModelForService = {};
                    var formDataModelFromView = $scope.formDataModel;
                    for (var sectionIndex in screenDef.sections) {
                        var section = screenDef.sections[sectionIndex];
                        if (section["show"] === undefined || section["show"] === true) {
                            var sectionDataModelForService = {};
                            // var sectionFromView = formDataModelFromView[section.modelKey] || formDataModelFromView;

                            if (section.tabs) {
                                for (var l = 0; l < section.tabs.length; l++) {
                                    var tab = section.tabs[l];
                                    var sectionDataModelForServiceForTab = {};
                                    //var sectionFromViewTab = sectionFromView[tab.modelKey] || sectionFromView;
                                    sectionDataModelForServiceForTab = getFormDataModelForRowDivisions(tab.rowDivisions, sectionDataModelForServiceForTab);
                                    if (tab.modelKey) {
                                        sectionDataModelForService[tab.modelKey] = sectionDataModelForServiceForTab;
                                    }
                                    else {
                                        sectionDataModelForService = angular.extend(sectionDataModelForService, sectionDataModelForServiceForTab);
                                    }
                                }
                            }
                            if (section.rowDivisions) {
                                getFormDataModelForRowDivisions(section.rowDivisions, sectionDataModelForService);
                            }

                            if (section.modelKey) {
                                formDataModelForService[section.modelKey] = sectionDataModelForService;
                            }
                            else {
                                formDataModelForService = angular.extend(formDataModelForService, sectionDataModelForService);
                            }
                        }
                    }

                    //if (currentMenuDef["entityType"]) {
                    //    formDataModelForService.entityType = currentMenuDef["entityType"];
                    //}

                    //if (currentMenuDef["entityObjectId"]) {
                    //    formDataModelForService.entityObjectId = $scope.form.entityObjectId;
                    //}

                    return formDataModelForService;


                };
                var getFormDataModelForRowDivisions = function (rowDivisions, sectionDataModelForService) {
                    for (var rowIndex in rowDivisions) {
                        var rowDivision = rowDivisions[rowIndex];
                        for (var fieldIndex in rowDivision.fields) {
                            var field = rowDivision.fields[fieldIndex];
                            if (field.ignoreInServiceModel === undefined || field.ignoreInServiceModel === false) {
                                if (field.getModel) {
                                    var fieldModel = field.getModel();
                                    if (field.ignoreInModelIfNull === true && angular.isUndefined(fieldModel) && fieldModel === null) {
                                        continue;
                                    }
                                    if (!field.modelKey && !angular.isString(fieldModel) && !angular.isArray(fieldModel)) {
                                        sectionDataModelForService = angular.extend({}, sectionDataModelForService, fieldModel);
                                    }
                                    else {
                                        if (field.modelKey) {
                                            if (field["useFieldLevelModelKey"] === false) {
                                                sectionDataModelForService = angular.extend(sectionDataModelForService, fieldModel);
                                            }
                                            else {
                                                sectionDataModelForService[field.modelKey] = fieldModel;
                                            }

                                        }
                                        else if (!field.modelKey && field.fieldType === "composite-repeater-field") {
                                            return fieldModel;
                                        }
                                        else {
                                            sectionDataModelForService = angular.extend(sectionDataModelForService, fieldModel);
                                        }
                                    }

                                }
                            }
                        }
                    }
                    return sectionDataModelForService;
                };

                var saveOrUpdateBackToService = function (df_form, operationType) {
                    var defer = $q.defer();
                    /* if (  df_form.$dirty != undefined && df_form.$dirty == false) {
                         Notification.error({
                             message: "No change on the screen.",
                             title: 'There are no changes to be saved',
                             delay: 5000
                         });
                         defer.reject();
                     }*/
                    overlay.load();
                    if ($scope.form) {
                        $scope.form.df_form = df_form;
                        $scope.form.save_submit = true;
                    }
                    var preHandler = null;
                    // var externalServiceHandlers = getExternalServiceHandlers(operationType);

                    //var preHandler = externalServiceHandlers["preHandler"];
                    //var handler = externalServiceHandlers["handler"];
                    //var postHandler = externalServiceHandlers["postHandler"];
                    //var buildServiceModelHandler = externalServiceHandlers["buildServiceModelHandler"];
                    //var httpMethod = externalServiceHandlers["httpMethod"];

                    var formServiceModel = getFormDataModelForService();
                    var runValidateFn;
                    if ($scope.functionalService.runValidations) {
                        runValidateFn = $scope.functionalService.runValidations;
                    } else {
                        runValidateFn = $scope.form.runValidations;
                    }
                    // TODO: Run Validations
                    runValidateFn(formServiceModel, operationType, $scope.form).then(function (isValid) {
                        //alert("hi="+isValid);

                        if (!isValid) {
                            if ($scope.form) {
                                $scope.form.save_submit = false;
                            }
                            // alert("reject");
                            defer.reject();
                        } else {

                            if (preHandler) {
                                if (!preHandler(formServiceModel, $scope.form, $scope.runValidations, operationType)) {
                                    $scope.form.save_submit = false;
                                    return false;
                                }
                            }
                            var buildDataTobeSubmittedFn = $scope.functionalService.buildDataTobeSubmitted || $scope.functionalService.form.buildDataTobeSubmitted;

                            var dataTobeSubmitted = buildDataTobeSubmittedFn(formServiceModel, operationType, $scope.form);

                            console.log("formDataModel:", dataTobeSubmitted);
                            var serviceUrl = buildServiceUrl(operationType);

                            var operationCallback = function (results) {
                                overlay.hide();

                                console.log("operationCallback results", results);
                                //alert("after saving");
                                if (results === undefined) {
                                    Notification.error({
                                        message: "Failed to save data.",
                                        title: 'Status',
                                        delay: 5000
                                    });
                                }
                                else {
                                    if (results && (results.status === 201 && operationType === "ADD") || results.status === 202 && operationType === "EDIT") {
                                        // defer.resolve(results);
                                        //$rootScope.showMessage({
                                        //    messageStatus: constants.successStatus,
                                        //    messageText: constants.recordSave,
                                        //    redirectPath: $scope.redirectPath
                                        //});

                                        Notification.success({
                                            message: "Data saved successfully.",
                                            title: 'Status',
                                            delay: 5000
                                        });

                                        var afterSaveActionFn = $scope.functionalService.afterSaveAction || $scope.functionalService.form !== undefined ? $scope.functionalService.form.afterSaveAction : undefined;
                                        if (afterSaveActionFn) {
                                            afterSaveActionFn(formServiceModel, $scope.form);
                                        }

                                        return defer.resolve();
                                        //$location.path("app/purchase/uommaster");
                                    } else {

                                        console.log("results", results);
                                        //$rootScope.showMessage({
                                        //    messageStatus: constants.errorStatus,
                                        //    messageText: constants.checkSave
                                        //});

                                        Notification.error({
                                            message: "Data isn't saved.",
                                            title: 'Status',
                                            delay: 5000
                                        });

                                        return defer.reject();
                                    }
                                }

                                //return defer.resolve();
                            };

                            var httpServiceFn; // = httpService[httpMethod];
                            if (operationType === "EDIT") {
                                httpServiceFn = httpService.put;
                            }
                            else {
                                httpServiceFn = httpService.post;
                            }
                            fillEntityMapValues(dataTobeSubmitted, operationType).then(function (finalEnityModel) {

                                console.log("finalEnityModel", finalEnityModel);
                                sleep(1000);
                                httpServiceFn(serviceUrl, finalEnityModel).then(operationCallback);

                            });

                            if ($scope.form) {
                                $scope.form.save_submit = true;
                            }

                        }
                    });
                    // defer.resolve(true);
                    return defer.promise;
                };
                var sleep = function sleep(milliseconds) {
                    var start = new Date().getTime();
                    for (var i = 0; i < 1e7; i++) {
                        if (new Date().getTime() - start > milliseconds) {
                            break;
                        }
                    }
                };
                var fillEntityMapValues = function (dataTobeSubmitted, operationType) {
                    var defer = $q.defer();
                    var entityMap = $scope.form["entityMap"];

                    if (!entityMap) {
                        defer.resolve(dataTobeSubmitted);
                        return defer.promise;
                    }

                    //{"this":{"entityCode":"CONTRACT_AGENT","entityId":{"modelKey":"cid", value:"SYSTEM_KEY"},
                    // "this.contactPersons":{ "cid":"this.entityId" }}

                    var entityMapKeySet = Object.keys(entityMap);
                    var modelLevels = _.map(entityMapKeySet, function (key) { return key.split(/\./g).length; });
                    var maxLeafLevel = _.max(modelLevels);
                    setEntityIds(entityMap, operationType).then(function (finalEntityMap) {
                        fillRecursiveChildModels(finalEntityMap, entityMapKeySet, dataTobeSubmitted, 1, maxLeafLevel);
                        defer.resolve(dataTobeSubmitted);
                    });

                    return defer.promise;
                };
                var setEntityIds = function (entityMap, operationType) {
                    var defer = $q.defer();
                    var finalEntityMap = angular.copy(entityMap);
                    var systemKeyEntityIds = _.filter(entityMap, function (item) {
                        return (!angular.isUndefined(item.entityId)
                            && !angular.isString(item.entityId) && item.entityId["value"]
                            && item.entityId["value"][operationType]
                            && item.entityId["value"][operationType] === "SYSTEM_KEY");
                    });
                    var statePramEntityIds = _.filter(entityMap, function (item) {
                        return (!angular.isUndefined(item.entityId)
                            && !angular.isString(item.entityId) && item.entityId["value"]
                            && item.entityId["value"][operationType]
                            && item.entityId["value"][operationType].startsWith("SP."));
                    });
                    if (statePramEntityIds && statePramEntityIds.length > 0) {
                        var entityKeyValuesByCode = {};
                        angular.forEach(statePramEntityIds, function (entityIdMap, index) {
                            var entityCode = entityIdMap["entityCode"];
                            var modelKey = entityIdMap.entityId["modelKey"];
                            var entityIdFromParam = $stateParams[modelKey] || form.urlParams[modelKey];
                            entityKeyValuesByCode[entityCode] = entityIdFromParam;
                        });
                        setEntityIdsByEntityCodes(entityKeyValuesByCode, finalEntityMap);
                    }
                    if (!systemKeyEntityIds && systemKeyEntityIds.length === 0 || operationType === "EDIT") {
                        defer.resolve(finalEntityMap);
                    }
                    else {
                        var systemKeygenUrl = buildSystemKeyGenUrlWithParam(systemKeyEntityIds);
                        httpService.get(systemKeygenUrl).then(function (results) {
                            if (results) {
                                var entityKeyValuesByCode = {};
                                var rootEntityCode = systemKeyEntityIds[0]["entityCode"];
                                var sysKeyDataSet = results["dataset"] || results["data"]["dataset"];
                                if (sysKeyDataSet.length > 0) {
                                    if (sysKeyDataSet[0]["return"]) {
                                        entityKeyValuesByCode[rootEntityCode] = sysKeyDataSet[0]["return"];
                                    }
                                    else {
                                        entityKeyValuesByCode[rootEntityCode] = sysKeyDataSet[0]["newKey"];
                                    }
                                }

                                setEntityIdsByEntityCodes(entityKeyValuesByCode, finalEntityMap);

                            }

                            defer.resolve(finalEntityMap);
                        });
                    }
                    return defer.promise;
                };

                var setEntityIdsByEntityCodes = function (entityKeyValuesByCode, finalEntityMap) {
                    var entityKeyValuesByKey = {};
                    angular.forEach(finalEntityMap, function (mapItem, key) {
                        var entityCode = mapItem["entityCode"];
                        var entityIdConfig = mapItem["entityId"];
                        if (entityCode && entityIdConfig) {
                            var modelKey = entityIdConfig["modelKey"];
                            var entityIdValue = "";
                            if (!angular.isUndefined(entityKeyValuesByCode[entityCode])) {
                                entityIdValue = entityKeyValuesByCode[entityCode];
                            }
                            var entityKeyName = key + ".entityId";
                            entityKeyValuesByKey[entityKeyName] = entityIdValue;
                            finalEntityMap[key][modelKey] = entityIdValue;
                            if (modelKey !== "entityId") {
                                delete finalEntityMap[key]["entityId"];
                            }

                        }
                    });

                    angular.forEach(finalEntityMap, function (entityMapItem, key) {
                        angular.forEach(entityMapItem, function (modelValue, modelKey) {
                            if (!angular.isUndefined(entityKeyValuesByKey[modelValue])) {
                                entityMapItem[modelKey] = entityKeyValuesByKey[modelValue];
                            }
                        });
                    });
                    console.log("finalEntityMap", finalEntityMap);
                };
                var buildSystemKeyGenUrlWithParam = function (systemKeyEntityIds) {
                    if (!systemKeyEntityIds) return null;
                    var entityGroupCode = $scope.form["entityGroupCode"];
                    var entityTypeCode = $scope.form["entityTypeCode"];
                    var entityCodeList = [];
                    angular.forEach(systemKeyEntityIds, function (entityIdConfig, index) {
                        entityCodeList.push(entityIdConfig["entityCode"]);
                    });
                    var entityCodeCSV = entityCodeList.join(",");

                    var systemKeygenUrl =
                        utilService.formatString('vdi/metabase/keygenerator/nextkey?entityGroupCode={0}&entityTypeCode={1}&entityCode={2}',
                            entityGroupCode, entityTypeCode, entityCodeCSV);

                    return systemKeygenUrl;
                };

                var fillRecursiveChildModels = function (entityMap, entityMapKeySet, dataModel, currentLevel, maxLeafLevel) {
                    var dataItemList = angular.isArray(dataModel) ? dataModel : [dataModel];

                    for (var i = 0; i < dataItemList.length; i++) {
                        var dataItem = dataItemList[i];
                        var currentLevelMaps = _.filter(entityMapKeySet, function (key) { return key.split(/\./g).length === currentLevel; });
                        for (var j = 0; j < currentLevelMaps.length; j++) {
                            var entityMapKey = currentLevelMaps[j];
                            var entityToExtend = entityMap[entityMapKey];
                            var entityMapKeySplit = entityMapKey.split(/\./g);
                            var currentLevelEntityKey = entityMapKeySplit[currentLevel - 1];

                            var currentLevelDataItem = dataItem;
                            if (currentLevelEntityKey !== "this") {
                                if (!dataItem[currentLevelEntityKey]) {
                                    dataItem[currentLevelEntityKey] = {};
                                }
                                currentLevelDataItem = dataItem[currentLevelEntityKey];
                            }
                            if (angular.isArray(currentLevelDataItem)) {
                                angular.forEach(currentLevelDataItem, function (innerItem, innerIndex) {
                                    innerItem = angular.extend(innerItem, entityToExtend);
                                });
                            }
                            else {
                                currentLevelDataItem = angular.extend(currentLevelDataItem, entityToExtend);
                            }
                            console.log("current data item", dataItem);
                            if (currentLevel < maxLeafLevel) {
                                fillRecursiveChildModels(entityMap, entityMapKeySet, currentLevelDataItem, currentLevel + 1, maxLeafLevel);
                            }
                        }
                    }
                };

                $scope.form.buildDataTobeSubmitted = function (formServiceModel, operationType) {

                    var dataTobeSubmitted;
                    if ($scope.noWorkflow) {
                        dataTobeSubmitted = {};
                        if ($scope.form.mainModelName) {
                            dataTobeSubmitted[$scope.entityTypeKey || "entityType"] = $scope.entityType;
                            dataTobeSubmitted["status"] = $scope.defaultStatus || "Active";
                            dataTobeSubmitted[$scope.form.mainModelName || "masterInfo"] = formServiceModel;
                        }
                        else {
                            dataTobeSubmitted = formServiceModel;
                        }

                    }
                    else {

                        dataTobeSubmitted = {
                            department: localStorage.getItem("department"),
                            entity: $scope.entityType
                        };
                        dataTobeSubmitted[$scope.form.mainModelName || "masterInfo"] = formServiceModel;
                    }

                    return dataTobeSubmitted;
                };

                $scope.form.saveBackToService = function (df_form) {
                    var defer = $q.defer();
                    saveOrUpdateBackToService(df_form, "ADD").then(function () {
                        defer.resolve();
                    }).catch(function (reason) {
                        defer.reject();
                    });

                    return defer.promise;
                };
                $scope.saveBackToService = function (df_form) {
                    var defer = $q.defer();
                    var saveBackToService = $scope.functionalService.saveBackToService;
                    if (!saveBackToService) {
                        saveBackToService = $scope.functionalService.form.saveBackToService;
                    }
                    var savePromise = saveBackToService(df_form);

                    if (savePromise.then) {
                        savePromise.then(function () {
                            defer.resolve();
                        });
                    }
                    else {
                        // defer.resolve();
                        defer.reject();
                    }
                    return defer.promise;
                };

                $scope.form.updateBackToService = function (df_form) {

                    var defer = $q.defer();
                    saveOrUpdateBackToService(df_form, "EDIT").then(function () {
                        defer.resolve();
                    }).catch(function (reason) {
                        defer.reject();
                    });

                    return defer.promise;
                };
                $scope.updateBackToService = function (df_form) {

                    var defer = $q.defer();
                    var updateBackToService = $scope.functionalService.updateBackToService;
                    if (!updateBackToService) {
                        updateBackToService = $scope.functionalService.form.updateBackToService;
                    }
                    var updatePromise = updateBackToService(df_form);

                    if (updatePromise.then) {
                        updatePromise.then(function () {
                            defer.resolve();
                        });
                    }
                    else {
                        defer.resolve();
                    }
                    return defer.promise;
                };
                var buildValidationUrl = function (dataModel) {
                    console.log("buildValidationUrl=", dataModel);
                };
                var runValidation1 = function () {
                    console.log("runValidation1****--");
                    var screenDef = $scope.form;
                    if (!screenDef && !screenDef.sections) {
                        console.log("sections metadata is missing");
                        return;
                    }
                    var formDataModel = {};
                    angular.forEach(screenDef.sections, function (section, key) {
                        var sectionDataModel = {};

                        if (section.tabs) {
                            for (var l = 0; l < section.tabs.length; l++) {
                                var tab = section.tabs[l];
                                var sectionDataModelForTab = {};
                                resetRowLevelData1(tab.rowDivisions, sectionDataModelForTab);
                            }
                        }
                        if (section.rowDivisions) {
                            resetRowLevelData1(section.rowDivisions, sectionDataModel);
                        }
                        if (section.modelKey) {
                            formDataModel[section.modelKey] = sectionDataModel;
                        }
                        else {
                            formDataModel = angular.extend(formDataModel, sectionDataModel);
                        }
                    });

                };

                var resetRowLevelData1 = function (rowDivisions, sectionDataModel) {
                    angular.forEach(rowDivisions, function (rowDivision, key) {
                        angular.forEach(rowDivision.fields, function (field, key) {
                            console.log("field.modelKey=", field.modelKey);
                            console.log("field=", field);
                            if (field.modelKey) {
                                console.log("field=", field);

                            }
                        });
                    });
                };

                var buildServiceUrl = function (operationType) {
                    console.log("buildServiceUrl--->", operationType);
                    var serviceUrl;
                    if (operationType === "ADD") {
                        //if ($scope.noWorkflow && $scope.saveUrl) {
                        //    serviceUrl = $scope.saveUrl;
                        //}
                        //else {
                        //    serviceUrl = $scope.workflowUrl || 'vdi/olims/master/workflow';
                        //}
                        serviceUrl = $scope.saveUrl;
                    }
                    else if (operationType === "EDIT") {
                        serviceUrl = $scope.saveUrl;
                    }
                    else {
                        serviceUrl = $scope.getOneUrl;
                    }
                    var pageUrlParamsData = $scope.form.urlParams;
                    var ignoreParamsInUrl = $scope.form.ignoreParamsInServiceUrl;
                    if (pageUrlParamsData && serviceUrl) {
                        var queryStringParams = $stateParams;// $scope.queryStringParams;

                        var qsParams = [];

                        if (ignoreParamsInUrl !== undefined) {
                            angular.forEach($stateParams, function (val, key) {
                                angular.forEach(ignoreParamsInUrl, function (ival, ikey) {
                                    if (ival !== key) {
                                        var qsParam = key + "=" + val;
                                        qsParams.push(qsParam);
                                    }
                                });
                            });
                        }
                        else {
                            angular.forEach($stateParams, function (val, key) {
                                var qsParam = key + "=" + val;
                                qsParams.push(qsParam);
                            });
                        }

                        if (qsParams.length > 0) {
                            var urlQS = qsParams.join("&");
                            if (serviceUrl.indexOf("?") > -1) {
                                serviceUrl = serviceUrl + "&" + urlQS;
                            }
                            else {
                                serviceUrl = serviceUrl + "?" + urlQS;
                            }
                        }
                    }
                    console.log("serviceUrl--->", serviceUrl);
                    return serviceUrl;
                };

                $scope.form.runValidations = function (formServiceModel, operationType) {
                    var defer = $q.defer();
                    buildValidationUrl(formServiceModel);
                    runValidation1();
                    defer.resolve(true);
                    //TODO: run validations 
                    /* var df_form = $scope.form.df_form;
                     console.log("df_form error", df_form)
                     var isValid = df_form.$valid;
                     if (!isValid) {
                         $scope.save_submit = false;
                     }
                     return isValid;*/
                    return defer.promise;
                };

                var injectDynamicServices = function (screenDefConfig) {
                    var defer = $q.defer();

                    var externalServiceConfig = $scope.form.externalService || screenDefConfig["externalService"];
                    if (externalServiceConfig) {
                        $scope.externalServiceConfig = externalServiceConfig;
                        var serviceName;
                        if (angular.isString(externalServiceConfig)) {
                            serviceName = externalServiceConfig;
                        }
                        else {
                            serviceName = externalServiceConfig["name"];
                        }

                        if (serviceName) {
                            //  var servicePath = "../factories/";
                            var servicePath = "";
                            var serviceNameSplit = serviceName.split(".");
                            var appName = appDefinitionService.getCurrentAppDefKey();
                            console.log("appName is" + appName);
                            if (serviceNameSplit.length > 1) {
                                servicePath = servicePath + serviceNameSplit.join("/");
                                serviceName = serviceNameSplit[serviceNameSplit.length - 1];
                            }
                            else {
                                servicePath = "../../apps/" + appName + "/factories/" + serviceName;
                            }
                            if (serviceName) {
                                $scope.dynamicServices = {};
                                if ($injector.has(serviceName)) {
                                    var serviceFactory = $injector.get(serviceName);
                                    $scope.functionalService = new serviceFactory($scope.form);;
                                    $scope.dynamicServices[serviceName] = $scope.functionalService;
                                    $scope.form.functionalService = $scope.functionalService;
                                    defer.resolve();
                                }
                                else {
                                    // var service = require(servicePath);
                                    requireProxy([servicePath], function (service) {
                                        var serviceFactory = $injector.get(serviceName);
                                        $scope.functionalService = new serviceFactory($scope.form);;
                                        $scope.dynamicServices[serviceName] = $scope.functionalService;

                                        $scope.form.functionalService = $scope.functionalService;
                                        console.log("functionalService1", $scope.functionalService);
                                        defer.resolve();
                                    });
                                }

                                console.log("functionalService2", $scope.functionalService);
                            }
                        }
                    }
                    else {
                        defer.resolve();
                    }

                    return defer.promise;
                };
                var attachServiceHandlers = function (functionalService) {
                    for (var key in $scope.form) {
                        if (angular.isFunction($scope.form[key]) && !functionalService.hasOwnProperty(key)) {
                            functionalService[key] = $scope.form[key];
                        }
                    }
                };

                $scope.form.clear = function () {
                    $scope.functionalService.resetFormDataModel();
                    if ($scope.functionalService && $scope.functionalService.afterLoad) {
                        $scope.functionalService.afterLoad();
                    }
                };

                $scope.form.cancel = function () {
                    // Susheel
                    init();
                    //  $scope.functionalService.resetFormDataModel();
                    $scope.functionalService.setScreenMode("VIEW");
                };

                $scope.form.showInEditMode = function () {
                    $scope.functionalService.setScreenMode("EDIT");
                };

                $scope.form.duplicate = function () {
                    $scope.functionalService.dupilcateContractFromViewScreen($scope.formDataModel, $scope.form.screenState);
                };
                $scope.form.workflow = function (actionCode, prevActions) {
                    $scope.form.modalforms["workflowPopup"]["functionalService"] = $scope.functionalService;
                    $scope.form.modalforms["workflowPopup"]["form"] = $scope.form;
                    $scope.form.openDialog($scope.form.modalforms["workflowPopup"], { "actionCode": actionCode, "previousActions": prevActions });
                };

                $scope.form.auditHistory = function (auditUrl, params) {
                    console.log("$scope.form=", $scope.form)
                    var entityObjectId = $scope.form.urlParams[$scope.form.idForAudit || "entityObjectId"];
                    $scope.form.modalforms["auditPopup"]["functionalService"] = $scope.functionalService;
                    $scope.form.modalforms["auditPopup"]["form"] = $scope.form;
                    $scope.form.openDialog($scope.form.modalforms["auditPopup"], { "url": $scope.form.auditUrl, "params": { "entityId": entityObjectId } }, $scope.form.modalforms["auditPopup"]["size"]);
                };

                $scope.form.close = function () {
                    var navCount = $scope.form.breadcrumbMap.length;
                    var prevState = $scope.form.breadcrumbMap[navCount - 1];
                    console.log("prevState['stateKey']=", prevState["stateKey"]);
                    //stateService.navigateToState(prevState["stateKey"]);
                    $state.go(stateService.getStateKeyFromMenuKey(prevState["stateKey"]));
                    stateService.persistCurrentAppKey();
                };

                $scope.form.getWorkflowActionsAndNotifications = function () {
                    var entityObjectId = $scope.form.urlParams[$scope.form.idForNotification || "entityObjectId"];
                    var workFlowUrl = "workflow/state/current/actions/1000/CONTRACT/" + entityObjectId;
                    httpService.get(workFlowUrl).then(function (results) {
                        $scope.form.buildActionButtons(results);
                    });
                };

                $scope.form.buildActionButtons = function (results, prevActions) {
                    if (prevActions !== undefined) {
                        removePreviousActions(prevActions);
                    }
                    var noOfActions = $scope.form.actions.length;
                    if (results.data.statusCode === "SUCCESS") {
                        $scope.workflowCurrentState = results.data.entityCurrentStatus;
                        $scope.form.workflowState = $scope.workflowCurrentState;
                        if ($scope.workflowCurrentState !== "ENABLE_EDITING") {
                            $scope.form.actions.splice(0, 0,
                                {
                                    "title": $scope.workflowCurrentState,
                                    "modelKey": "workflowApprove",
                                    "navigateTo": "SELF",
                                    "cssClass": "disable_btn",
                                    "actionType": "WORKFLOW",
                                    "showModes": [
                                        "VIEW"
                                    ]
                                }
                            );
                        }

                        $scope.workflowActions = results.data.currentStateActions;
                        angular.forEach($scope.workflowActions, function (action, index) {
                            var title = action.actionName;
                            var indexToBeAddedIn = noOfActions + index - 3;
                            $scope.form.actions.splice(indexToBeAddedIn, 0,
                                {
                                    "title": title,
                                    "modelKey": "workflowApprove",
                                    "navigateTo": "SELF",
                                    "cssClass": action.actionCode + "_btn",
                                    "actionType": "WORKFLOW",
                                    "actionCode": action.actionCode,
                                    "showModes": [
                                        "VIEW"
                                    ],
                                    "handler": function () {
                                        $scope.form.workflow(action.actionCode, $scope.workflowActions);
                                    }
                                }
                            );
                        });
                    } else {
                        overlay.hide();
                        Notification.error({
                            message: 'Notifications Failed',
                            title: 'CODE ERROR - ' + results.data.code,
                            delay: 5000
                        });
                    }
                    console.log("$scope.form.enableAudit)=", $scope.form.enableAudit);
                    if ($scope.form.enableAudit) {
                        var indexToBeAddedIn = noOfActions + 3;
                        console.log("$scope.form.actions=", $scope.form.actions);
                        var hasAuditButton = _.find($scope.form.actions, function (rw) { return rw.modelKey == "audit" });
                        if (hasAuditButton === undefined) {
                            $scope.form.actions.splice(indexToBeAddedIn, 0,
                                {
                                    "title": " ",
                                    "modelKey": "audit",
                                    "navigateTo": "SELF",
                                    "cssClass": "fa fa-history history_icon",
                                    "actionType": "Audit",
                                    "showModes": [
                                        "VIEW"
                                    ],
                                    "handler": function () {
                                        $scope.form.auditHistory($scope.form.url, $scope.form.idForAudit);
                                    }
                                });
                        }
                    }
                };

                var removePreviousActions = function (prevActions) {
                    $scope.form.actions.splice(0, 1);
                    angular.forEach(prevActions, function (action, index) {
                        $scope.form.actions.splice($scope.form.actions.findIndex(({ actionCode }) => actionCode === action.actionCode), 1);
                    });
                };

                $scope.getButtonByKey = function (modelKey) {
                    var currentButton = {};
                    angular.forEach($scope.actions, function (item) {
                        if (item.modelKey === modelKey) {
                            currentButton = item;
                        }
                    });
                    return currentButton;
                };

                $scope.getFieldByModelKey = function (sections, modelKey) {
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
                                var fModel = {};
                                angular.forEach(fields, function (field, index) {

                                    if (field.modelKey === modelKey) {//} "reportGrid") {
                                        mfield = field;
                                        return mfield;
                                    }

                                });
                            });
                        });
                    });
                    return mfield;
                };

                $scope.getFieldByType = function (sections, type) {
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
                                var fModel = {};
                                angular.forEach(fields, function (field, index) {

                                    if (field.fieldType === type) {//} "reportGrid") {
                                        mfield = field;
                                        return mfield;
                                    }

                                });
                            });
                        });
                    });
                    return mfield;
                };



                $scope.form.openDialog = function (modalForm, modelData, size) {

                    modalPopUpService.openDialog(modalForm, modelData, this.form, size).then(function (res) {
                        res.popupInstance.rendered.then(function (aa) {
                            console.log("modalForm=", modalForm);
                            console.log("modelData=", modelData);
                            //$scope.getFieldByModelKey()
                            var getFieldByKey = function (modelKey, sections) {
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
                                            var fModel = {};
                                            angular.forEach(fields, function (field, index) {

                                                if (field.modelKey === modelKey) {//} "reportGrid") {
                                                    mfield = field;
                                                    return mfield;
                                                }

                                            });
                                        });
                                        //no Columns
                                        var fields = row.fields;
                                        //fields
                                        var fModel = {};
                                        angular.forEach(fields, function (field, index) {

                                            if (field.modelKey === modelKey) {//} "reportGrid") {
                                                mfield = field;
                                                return mfield;
                                            }
                                        });
                                    });
                                });
                                return mfield;
                            };

                            var auditgrid = getFieldByKey("grid", modalForm.sections);
                            if (auditgrid.gridOptions) {
                                auditgrid.gridOptions.api.showLoadingOverlay();
                                httpService.get(modelData.url, modelData.params).then(function (result) {
                                    console.log("result=", result);
                                    console.log("popup grid info=", auditgrid);
                                    if (auditgrid.gridOptions) {
                                        var gridApi = auditgrid.gridOptions.api;
                                        //gridApi.setRowData(result.data.dataset);
                                        auditgrid.gridOptions.api.setRowData(result.data.dataset);
                                        auditgrid.gridOptions.api.resetRowHeights();
                                        auditgrid.gridOptions.api.hideOverlay();
                                    }
                                });
                            }
                        });
                    });
                    /*
                     var pSelf = this;
                     //   console.log("controller.......", $controller);
                     console.log("controller.......", modelData);
                     console.log("controller.......", modalForm);
                     console.log("controller.............controller", pSelf.form);
 
                     var uiModalInstance = $uibModal.open(
                         {
                             size: 'lg',
                             templateUrl: "engines/angularjs/components/jsonbasedpages/views/modalContent.html",
                             scope: $kbscope,
                             resolve: {
                                 payload: function () {
                                     return {
                                         title: modalForm["title"],
                                         modalform: modalForm,
                                         modalData: modelData,
                                         parentForm: pSelf.form
                                     };
                                 }
                             },
                             //template:' <div class="modal-header"> <h3 class="modal-title">Hello</h3></div> <div class="modal-body">    I m a modal!</div><div class="modal-footer">    <button class="btn btn-primary" type="button" ng-click="ok()">OK</button>    <button class="btn btn-warning" type="button" ng-click="cancel()">Cancel</button></div>',
                             controller://$scope.field.get,
                                 function ($scope, payload, $uibModalInstance) {
                                     console.log("controller.............payload", payload);
 
                                     $scope.datas = payload;
                                     $scope.formDataModel = payload.modalData;
 
                                     //$kbscope.form.functionalService[payload.modalform["handlerName"]]($kbscope, $scope.datas);
                                     $scope.ok = function () {
                                         console.log("ok.............ok1", $scope.datas);
                                         console.log("ok.............ok1", $kbscope);
                                         $kbscope.form.functionalService[payload.modalform["handlerName"]]($kbscope, $scope.datas);
                                         $uibModalInstance.close();
                                     };
 
                                     $scope.cancel = function () {
                                         console.log("cancel.............cancel");
                                         $uibModalInstance.dismiss('cancel');
                                     };
 
 
                                 }
                         }
                     ).rendered.then(function (res) {
 
                         var getFieldByKey = function (modelKey, sections) {
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
                                         var fModel = {};
                                         angular.forEach(fields, function (field, index) {
 
                                             if (field.modelKey === modelKey) {//} "reportGrid") {
                                                 mfield = field;
                                                 return mfield;
                                             }
 
                                         });
                                     });
                                     //no Columns
                                     var fields = row.fields;
                                     //fields
                                     var fModel = {};
                                     angular.forEach(fields, function (field, index) {
 
                                         if (field.modelKey === modelKey) {//} "reportGrid") {
                                             mfield = field;
                                             return mfield;
                                         }
                                     });
                                 });
                             });
                             return mfield;
                         };
 
                         var grid = getFieldByKey("logInfo", modalForm.sections);
                         console.log("popup grid info=", grid);
                         if (grid.gridOptions) {
                             var gridApi = grid.gridOptions.api;
                             gridApi.setRowData(modelData["logInfo"]);
                         }
 
                     });
                     */
                };

                $scope.$on('$viewContentLoaded', function (event) {
                    // buildBreadcrumbModel();
                    console.log("Form Screen After load Loadad data 1 1");
                    $timeout(function () {
                        console.log("Form Screen After load Loadad data 1 2");
                        if ($scope.functionalService && $scope.functionalService.afterLoad) {
                            console.log(" Form Screen After load Loadad data 1 3");
                            $scope.functionalService.afterLoad($scope.form);
                        }
                    }, 2000);

                });

                init();

            }];
    });