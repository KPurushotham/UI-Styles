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
            'screenDefinitionService', 'appDefinitionService', 'stateService', 'localPersistenceService', '_',
            function ($scope, $state, $injector, $q, $http, $timeout, httpService, overlay, $location, $filter, $rootScope, $stateParams, constants,
                Notification, menuDefinitionService, dateUtilService, modelUtilService, utilService, requireProxy,
                screenDefinitionService, appDefinitionService, stateService, localPersistenceService, _
            ) {

                $scope.form = {};
                $scope.form.getScreenMode = function () {
                    return "VIEW";
                };
                $scope.form.isEditMode = function () {
                    return false;
                };

                $scope.$on('$viewContentLoaded', function (event) {
                    var currentAppKey;
                    console.log("stateParams=", $stateParams);
                    $scope.tenantCode = $stateParams.tenantCode;

                    $timeout(function () {
                        overlay.hide();
                    }, 10);

                    var auth = localPersistenceService.get("auth", true);
                    var allAppKeys = auth.apps;
                    auth["tenantCode"] = $scope.tenantCode;
                    auth["tenantId"] = auth["config"][$scope.tenantCode].tenantId;

                  //  var currentAppId = appDefinitionService.getCurrentApplicationId(allAppKeys, currentAppKey);
                   // localPersistenceService.set("currentAppId", currentAppId[0].applicationEntityId, true);
                    getApplicationId();
                    $timeout(function () {
                        if ($scope.functionalService && $scope.functionalService.afterLoad) {
                            $scope.functionalService.afterLoad($scope.form);
                        }
                    }, 7000);

                });

                var getApplicationId = function () {
                    var defer = $q.defer();
                    console.log("getApplicationId calling...");
                    var tenantId = localPersistenceService.get("tenantId", true);
                    var appUrl = 'vdi/emailapp/campaign/tenant/applications/getone?tenantId=' + tenantId;
                    httpService.get(appUrl).then(function (results) {
                        var res;
                        if( results.data.success )
                        {
                            res = results.data.dataset;
                            $scope.form.AppsList = res;
                        }
                        defer.resolve(res);
                    });
                    return defer.promise;
                };

                $scope.form.getAppInfoByCode = function(res,code){

                    var appCode = ((code)?code.toUpperCase():"")+"MAILDAY";
                    var appInfo= null;
                    angular.forEach(res,function(data,index){
                        if (data.emailApplications=== appCode){
                            appInfo = data;
                            return appInfo;
                        }
                    });
                    return appInfo;
                };

                var init = function () {
                    getApplicationId().then(function (res) {
                        var appCode = res[0].emailApplications.replace("MAILDAY", "");
                        var queryString = $location.search();
                        if (queryString.appCode === undefined) {
                            window.location.search = "?appCode=" + appCode;
                        }
                        var appInfo = $scope.form.getAppInfoByCode(res, queryString["appCode"]);
                        appInfo["reportCode"] = appInfo.emailApplications;
                        var selectedAppId = appInfo.applicationId;
                        localPersistenceService.set("applicationId", selectedAppId, true);
                        var reportCode = "";
                        var screenDefConfig = {};
                        var screenDefConfig1 = [];
                        screenDefConfig1["reportCode"] = appInfo.emailApplications;
                        screenDefConfig = {
                            "noWorkflow": true,
                            "submitted": false,
                            "externalService": "maildayService",
                            "ReportConfigUrl": "",
                            "reportCode": appInfo.emailApplications
                        };

                        console.log("db1--1 $location", $location.search());
                        menuDefinitionService.getActiveMenuMetadata().then(function (currentMenuDef) {
                            $scope.form.currentMenuDefinition = currentMenuDef;
                            reportCode = appInfo.reportCode;
                            screenDefinitionService.buildScreenMetaDataFromJson(reportCode, selectedAppId).then(function (reportData) {
                                console.log('db1 Report Screen screenConfig in dynamicFormDirective', screenDefConfig);
                                screenDefConfig1 = reportData.sections;
                                $scope.title = reportData.metaData.data.reportName;
                                $scope.form.ServiceIdParams = reportData.metaData.data["serviceIdParam"];
                                buildBreadcrumbModel($scope.title);
                                screenDefConfig.sections = screenDefConfig1;
                                afterInjectDynamicServices(screenDefConfig);

                            });

                        });
                    });
                };
                
                var buildBreadcrumbModel = function (title) {
                    $scope.form.activePageTitle = title;
                    //$scope.form.breadcrumbMap = $rootScope.breadcrumbMap;
                    $scope.form.breadcrumbMap = localPersistenceService.get("breadcrumb", true);
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
                    
                    $scope.save_submit = false;
                    
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
                    if ($scope.form.urlParams["isProduction"] === undefined) {
                        $scope.form.urlParams["isProduction"] = "t";
                    }
                    $scope.form.showUpdateButton = false;
                };

                $scope.setForm = function (df_form) {
                    $scope.form = $scope.form || {};
                    $scope.form["df_form"] = df_form;
                    $scope.form.readOnlyForm = false;
                };

                $scope.form.populateData = function (screenDefConfig) {
                    console.log("populateData==>", screenDefConfig);
                    overlay.load();
                    //Get Group Code
                    var serviceUrl = buildServiceUrl("GETONE");
                    console.log("serviceUrl", serviceUrl);
                    if (serviceUrl) {
                        httpService.get(serviceUrl).then(function (response) {
                            //debugger;
                            var results = {};
                            console.log("populateData results", response);
                            results = response.data[0];
                            if (results.data.success === "true" || results.data.success === true) {
                                overlay.hide();
                                var resultData;
                                if ($scope.form.getOneMultipleItems) {
                                    resultData = results.data.dataset;
                                }
                                else {
                                    resultData = results.data.dataset[0];
                                }
                                alert("bining");
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
                                Notification.error({
                                    message: 'URL<br/>' + constants.api_url + $scope.getOneUrl + '?entityObjectId=' + +$scope.form.entityObjectId,
                                    title: 'CODE ERROR - ' + results.data.code,
                                    delay: 5000
                                });
                            }
                        });
                    }

                };

                $scope.form.populateViewServiceDataModel = function (modelToBeSet) {

                    console.log("populateViewServiceDataModel-->", modelToBeSet);

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
                    console.log("populateRowLevelData==**==", populateRowLevelData);
                    if (section["modelType"] === "SINGLE" && angular.isArray(sectionFromService)) {
                        sectionFromService = sectionFromService[0];
                    }
                    for (var j = 0; j < rowDivisions.length; j++) {
                        var rowDivision = rowDivisions[j];
                        var field;
                        var k;
                        if (rowDivision.columns && rowDivision.columns.length > 0) {
                            for (var m = 0; m < rowDivision.columns.length; m++) {
                                var column = rowDivision.columns[m];
                                for (k = 0; k < rowDivision.columns[m].fields.length; k++) {
                                    field = rowDivision.columns[m].fields[k];
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
                            }
                        }
                        else {
                            for (k = 0; k < rowDivision.fields.length; k++) {
                                field = rowDivision.fields[k];
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

                var buildServiceUrl = function (operationType) {
                    console.log("buildServiceUrl--->", operationType);
                    var serviceUrl;
                    serviceUrl = $scope.getOneUrl;
                    var pageUrlParamsData = $scope.form.urlParams;

                    if (pageUrlParamsData && serviceUrl) {
                        var queryStringParams = $stateParams;

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
                                    $scope.functionalService = new serviceFactory($scope.form);
                                    $scope.dynamicServices[serviceName] = $scope.functionalService;
                                    $scope.form.functionalService = $scope.functionalService;
                                    defer.resolve();
                                }
                                else {
                                    // var service = require(servicePath);
                                    requireProxy([servicePath], function (service) {
                                        var serviceFactory = $injector.get(serviceName);
                                        $scope.functionalService = new serviceFactory($scope.form);
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

                

                init();

            }];
    });