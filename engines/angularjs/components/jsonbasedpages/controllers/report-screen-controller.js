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
    'httpService', 'stateService', 'screenDefinitionService', 'modelUtilService', 'utilService', 'alaSqlExtensions'], function () {
        'use strict';
        return ['$scope', '$state', '$injector', '$q', '$http', '$timeout', 'httpService', 'overlay', '$location', '$filter', '$rootScope', '$stateParams', 'constants',
            'Notification', 'menuDefinitionService', 'dateUtilService', 'modelUtilService', 'utilService', 'requireProxy',
            'screenDefinitionService', 'appDefinitionService', 'stateService', 'localPersistenceService', '_',
            function ($scope, $state, $injector, $q, $http, $timeout, httpService, overlay, $location, $filter, $rootScope, $stateParams, constants,
                Notification, menuDefinitionService, dateUtilService, modelUtilService, utilService, requireProxy,
                screenDefinitionService, appDefinitionService, stateService, localPersistenceService, _, alasql,
            ) {

                $scope.form = {};
                $scope.form.getScreenMode = function () {
                    return "EDIT";
                };
                $scope.form.isEditMode = function () {
                    return $scope.form.getScreenMode() === "EDIT";
                };
                var init = function () {
                    var reportCode = "";
                    var screenDefConfig1 = [];
                    console.log("***Report Screen stateParams=", $stateParams,$stateParams["reportName"]);
                    //screenDefinitionService.buildScreenMetaDataFromJson(reportCode).then(function (screenDefConfig1) {
                    // console.log("screenDefConfig1=", screenDefConfig1);
                    screenDefConfig1["reportCode"] = reportCode;
                   // menuDefinitionService.getActiveMenuMetadata().then(function (currentMenuDef) {
                    var currentMenuDef = {
                        "key": "report.auditcheckform",
                        "pattern": "REPORT",
                        "title": "Audit Check Report",
                        "viewName": "mainPagesection",
                        "urlRoute": "auditcheckform",
                        "editKeys": [
                            "reportCode"
                        ]
                    };
                    console.log("Report Screen currentMenuDef=", currentMenuDef);
                    $scope.form.currentMenuDefinition = currentMenuDef;
                       
                    $scope.title = $stateParams["reportName"];//(currentMenuDef) ? currentMenuDef.title : "Report";
                    $scope.tenantCode = $stateParams["tenantCode"];
                    $scope.appKey = appDefinitionService.getCurrentAppDefKey();
                        var screenDefConfig={};
                        screenDefConfig = {
                            //"name": "auditcheckform",
                            "noWorkflow": true,
                            "submitted": false,
                            "externalService": "reportService",
                            "ReportConfigUrl":"",
                            "reportCode": $stateParams["reportCode"]
                        };

                      //  screenDefinitionService.loadCurrentScreenMetaData(function (screenDefConfig) {
                            reportCode = screenDefConfig["reportCode"];
                            var selectedAppId = localPersistenceService.get("currentAppId",true);
                            screenDefinitionService.buildScreenMetaDataFromJson(reportCode,selectedAppId).then(function (reportData) {
                                console.log(' Report Screen screenConfig in dynamicFormDirective', screenDefConfig);
                                screenDefConfig1 = reportData.sections;
                                $scope.title = reportData.metaData.data.reportName;
                                buildBreadcrumbModel($scope.title);
                                var reportUrl = screenDefConfig["ReportConfigUrl"];
                                if (reportUrl) {
                                    getReportConfigData(reportUrl).then(function () {
                                        // "hideFields": [ "zone" ],
                                        afterInjectDynamicServices(screenDefConfig);
                                    });
                                } else {
                                    console.log("Report Screen Report  screenDefConfig ", screenDefConfig1);
                                    screenDefConfig.sections = screenDefConfig1;
                                    afterInjectDynamicServices(screenDefConfig);
                                }
                            });
                      //  });

                   // });
                    console.log("Report Screen screenDefConfig1=", screenDefConfig1);
                    //});
                };



                var afterInjectDynamicServices = function (screenDefConfig) {
                    injectDynamicServices(screenDefConfig).then(function () {
                        if ($scope.functionalService) {
                            attachServiceHandlers($scope.functionalService);
                        }
                        else {
                            $scope.functionalService = $scope.form;
                        }
                        intializeScopeDataModel(screenDefConfig);
                        $rootScope.$pageFinishedLoading = true;
                    });
                };

                var getReportConfigData = function (reportConfigUrl) {
                    var defer = $q.defer();
                    httpService.get(reportConfigUrl).then(function (response) {
                        defer.resolve(response);
                    });
                    return defer.promise;
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
                    console.log("additionalQSParams=", $location);
                    for (var paramKey1 in $location.search()) {
                        $scope.form.urlParams[paramKey1] = $location.search()[paramKey1];
                    }
                    //check for status and display update button
                    //SentBack 
                    $scope.form.showUpdateButton = false;
                };

                var buildBreadcrumbModel = function (title) {
                     $scope.form.activePageTitle = title;
                    //$scope.form.breadcrumbMap = $rootScope.breadcrumbMap;
                    $scope.form.breadcrumbMap = localPersistenceService.get("breadcrumb", true);
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
                            console.log("reset==field.modelKey=", field.modelKey);
                            console.log("field=", field);
                            if (field.modelKey) {
                                console.log("field=", field);
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
                                    getFormDataModelForRowDivisions(tab.rowDivisions, sectionDataModelForServiceForTab);
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
                    };

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
                                    if (field.ignoreInModelIfNull === true && angular.isUndefined(fieldModel) && fieldModel == null) {
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
                }
                /*     var saveOrUpdateBackToService = function (df_form, operationType) {
                        var defer = $q.defer();
                        if (!df_form.$dirty) {
                            Notification.error({
                                message: "No change on the screen.",
                                title: 'There are no changes to be saved',
                                delay: 5000
                            });
                            defer.reject();
                        }
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
    
                                var dataTobeSubmitted = buildDataTobeSubmittedFn(formServiceModel, operationType);
    
                                console.log("formDataModel:", dataTobeSubmitted);
                                var serviceUrl = buildServiceUrl(operationType);
    
                                var operationCallback = function (results) {
                                    overlay.hide();
    
                                    //alert("after saving");
                                    if (results && (results.status == 201 && operationType == "ADD") || (results.status == 202 && operationType == "EDIT")) {
                                        // defer.resolve(results);
                                        $rootScope.showMessage({
                                            messageStatus: constants.successStatus,
                                            messageText: constants.recordSave,
                                            redirectPath: $scope.redirectPath
                                        });
                                        return defer.resolve();
                                        //$location.path("app/purchase/uommaster");
                                    } else {
    
                                        console.log("results", results);
                                        $rootScope.showMessage({
                                            messageStatus: constants.errorStatus,
                                            messageText: constants.checkSave
                                        });
                                        return defer.reject();
                                    }
                                    return defer.resolve();
                                };
    
                                var httpServiceFn; // = httpService[httpMethod];
                                if (operationType == "EDIT") {
                                    httpServiceFn = httpService.put;
                                }
                                else {
                                    httpServiceFn = httpService.post;
                                }
                                fillEntityMapValues(dataTobeSubmitted, operationType).then(function (finalEnityModel) {
    
                                    console.log("finalEnityModel", finalEnityModel);
                                    httpServiceFn(serviceUrl, finalEnityModel).then(operationCallback);
                                });
    
                                if ($scope.form) {
                                    $scope.form.save_submit = true;
                                }
    
                            }
                        });
                        return defer.promise;
                    }; */
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
                            var entityIdFromParam = $stateParams[modelKey];
                            entityKeyValuesByCode[entityCode] = entityIdFromParam;
                        });
                        setEntityIdsByEntityCodes(entityKeyValuesByCode, finalEntityMap);
                    }
                    if (!systemKeyEntityIds && systemKeyEntityIds.length == 0 || operationType == "EDIT") {
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
                        var currentLevelMaps = _.filter(entityMapKeySet, function (key) { return key.split(/\./g).length == currentLevel; });
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
                                fillRecursiveChildModels(entityMap, entityMapKeySet, currentLevelDataItem, currentLevel + 1, maxLeafLevel)
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
                        defer.resolve();
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
                        if ($scope.noWorkflow && $scope.saveUrl) {
                            serviceUrl = $scope.saveUrl;
                        }
                        else {
                            serviceUrl = $scope.workflowUrl || 'vdi/olims/master/workflow';
                        }
                    }
                    else if (operationType === "EDIT") {
                        serviceUrl = $scope.saveUrl;
                    }
                    else {
                        serviceUrl = $scope.getOneUrl;
                    }
                    var pageUrlParamsData = $scope.form.urlParams;

                    if (pageUrlParamsData && serviceUrl) {
                        var queryStringParams = $stateParams;// $scope.queryStringParams;

                        var qsParams = [];
                        angular.forEach($stateParams, function (val, key) {
                            var qsParam = key + "=" + val;
                            qsParams.push(qsParam);
                        });

                        var urlQS = qsParams.join("&");
                        if (serviceUrl.indexOf("?") > -1) {
                            serviceUrl = serviceUrl + "&" + urlQS;
                        }
                        else {
                            serviceUrl = serviceUrl + "?" + urlQS;
                        }

                    }
                    console.log("serviceUrl--->", serviceUrl);
                    return serviceUrl;
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

               
                $scope.form.getWorkflowActionsAndNotifications = function () {
                    var entityObjectId = $scope.form.urlParams[$scope.form.idForNotification || "entityObjectId"];
                    httpService.getNotification(entityObjectId).then(function (notificationresults) {
                        //overlay.hide();
                        if (notificationresults.status === 200) {
                            $scope.workflowActions = notificationresults.data.actions;
                            delete notificationresults.data.actions;
                            $scope.notificationObj = notificationresults.data;
                            $scope.notificationObj.entityObjectId = entityObjectId;
                        } else {
                            overlay.hide();
                            Notification.error({
                                message: 'Notifications Failed',
                                title: 'CODE ERROR - ' + results.data.code,
                                delay: 5000
                            });
                        }
                    });
                };

                $scope.$on('$viewContentLoaded', function (event) {
                    // buildBreadcrumbModel();
                    $timeout(function () {
                        if ($scope.functionalService && $scope.functionalService.afterLoad) {
                            $scope.functionalService.afterLoad();
                        }
                    }, 3000);

                });

                init();

            }];
    });