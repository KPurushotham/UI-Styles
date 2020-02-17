define(['app', 'gridService', 'modelUtilService', 'dynamicFormDirective', 'raceDayFieldController',
    'screenDefinitionService', 'actionsDirective', 'breadcrumbDirective'], function (app) {
        'use strict';
        return ['$scope', '$state', '$http', '$timeout', '$location', '$filter', 'overlay', '$rootScope', 'Notification', 'uiGridConstants',
            'menuDefinitionService', 'gridService', 'modelUtilService', 'screenDefinitionService', 'stateService', '$q', 'appDefinitionService',
            '$injector', 'requireProxy', 'localPersistenceService', 'httpService', '$uibModal',
            function ($scope, $state, $http, $timeout, $location, $filter, overlay, $rootScope, Notification, uiGridConstants, menuDefinitionService,
                gridService, modelUtilService, screenDefinitionService, stateService, $q, appDefinitionService, $injector, requireProxy, localPersistenceService, httpService, $uibModal) {

                $scope.showFilter = false;
                $scope.isLoaded = false;
                 $scope.form =$scope.form || {};
                var $kbscope = $scope;
                // global variable that will be set in buildScreen function and would be used in further functions.
                var screenDefinition;
                var init = function () {

                    menuDefinitionService.getActiveMenuMetadata().then(function (activeMenuData) {
                        $scope.form.currentMenuDefinition = activeMenuData;
                        $scope.title = $scope.form.currentMenuDefinition.title;
                        screenDefinitionService.loadCurrentScreenMetaData(function (screenDefConfig) {
                            injectDynamicServices(screenDefConfig).then(function () {
                                if ($scope.functionalService) {
                                    attachServiceHandlers($scope.functionalService);
                                }
                                else {
                                    $scope.functionalService = $scope.form;
                                }
                                $kbscope.functionalService= $scope.functionalService;
                                
                                $rootScope.$pageFinishedLoading = true;

                                if (angular.isArray(screenDefConfig)) {
                                    $scope.showFilter = true;

                                    $scope.screenConfig = screenDefConfig.map(function (s, index) {
                                        return {
                                            text: s.text,
                                            value: s.value
                                        };
                                    });

                                    $scope.filterKeyValue = screenDefConfig[0]["value"];

                                    var screenDef = screenDefConfig[0]["config"];
                                    console.log("screenDef=", screenDefConfig);
                                    buildActions(screenDef);
                                    buildScreen(screenDef);
                                    $scope.getResults();

                                }
                                else {
                                    console.log("screenDef 1=", screenDefConfig);
                                    buildActions(screenDefConfig);
                                    buildScreen(screenDefConfig);
                                    $scope.getResults();
                                }

                                setBreadcrumbModel();
                            });
                        });
                    });
                };

                var injectDynamicServices = function (screenDefConfig) {
                    console.log("screenDefConfig=", screenDefConfig);
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
                            console.log("appName is=" + appName);
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

                                console.log("functionalService listing screen=", $scope.functionalService);
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

                var buildActions = function (screenDefConfig) {
                    var actions = screenDefConfig.actions;
                    angular.forEach(actions, function (action, index) {
                        var currentMenuKey = stateService.getActiveStateKey();
                        var navigateTo = action.navigateTo;
                        $scope.disableSubmit = false;
                        if (navigateTo) {
                            action.handler = function () {
                                console.log('action handler', this);
                                // to disable butoon after one click
                                $scope.disableSubmit = true;
                                $state.go(stateService.getStateKeyFromMenuKey(navigateTo));
                                stateService.persistCurrentAppKey();
                                console.log("navigateTo ", navigateTo);
                                // stateService.navigateToState(navigateTo);
                            };
                        }

                    });
                    $scope.actions = actions;
                };

                var buildScreen = function (screenDefConfig) {
                    console.log("ls1-", screenDefConfig);
                    console.log("ls1-", $scope.form);
                    screenDefinition = screenDefConfig;

                    // Gapp (Passing Query Paramenter) 
                    var queryStringParams = screenDefinition.queryStringParams;
                    if (queryStringParams) {
                        var Parameters = queryStringParams;
                        var key;
                        var ServiceUrl = screenDefConfig.dataUrl;

                        var qsParams = [];
                        angular.forEach(Parameters, function (val, key) {
                            var qsParam = key + "=" + val;
                            qsParams.push(qsParam);
                        });
                        console.log("qsParams==", qsParams);

                        var urlQS = qsParams.join("&");
                        if (ServiceUrl.indexOf("?") > -1) {
                            ServiceUrl = ServiceUrl + "&" + urlQS;
                            $scope.dataUrl = ServiceUrl;
                        }
                        else {
                            $scope.dataUrl = ServiceUrl + "?" + urlQS;
                        }
                    }
                    else {
                        $scope.dataUrl = screenDefConfig.dataUrl;
                    }
                    // Gapp Query Parameter Ends
                    // $scope.dataUrl = screenDefConfig.dataUrl;
                    buildCriteriaSection(screenDefConfig);
                    buildGridSection(screenDefConfig);
                    console.log(" $scope.form 2=", $scope.form);
                    if (!(screenDefConfig.initLoad === false)) {
                        //  $scope.getResults();
                    }
                };

                var setBreadcrumbModel = function () {
                    var breadcrumb = [];
                    breadcrumb[0] = { "stateKey": $state.current["name"], title: $scope.title };

                    console.log("breadcrumb-->", breadcrumb);
                    //$rootScope.breadcrumbMap = breadcrumb;
                    localPersistenceService.set("breadcrumb", JSON.stringify(breadcrumb), true);
                };

                var buildCriteriaSection = function (screenDefConfig) {
                    var criteria = screenDefConfig.criteria;
                    var customactions = screenDefConfig.customactions;
                    $scope.form = $scope.form || {};
                    var sections = [];

                    var criteriaSection = $scope.criteria;

                    if (criteria) {
                        $scope.criteria = criteria;
                        $scope.criteriaDataModel = {};
                        //setCriteriaDataModel($scope.screenDef.criteria);
                        console.log("$scope.criteria-->", $scope.criteria);
                        $scope.criteria.show = angular.isUndefined($scope.criteria.show) ? true : $scope.criteria.show;
                        sections.push($scope.criteria);
                        //$scope.form.childForm = { "sections": [$scope.customactions], "functionalService": $scope.functionalService };
                    }
                    // if (customactions) {
                    //     $scope.customactions = customactions;
                    //     //setCriteriaDataModel($scope.screenDef.criteria);
                    //     console.log("$scope.criteria-->", $scope.criteria);
                    //     $scope.customactions.show = angular.isUndefined($scope.customactions.show) ? true : $scope.customactions.show;
                    //     $scope.form = { "sections": [$scope.customactions], "functionalService": $scope.functionalService };
                    //     $scope.form = { "sections": [$scope.customactions], "functionalService": $scope.functionalService };
                    // }
                    //$scope.form.gridInfo = {
                    var gridSection =
                    {
                        "title": "",
                        "rowDivisions": [
                            {
                                "columns": [
                                    {
                                        "fields": [
                                            {
                                                "modelKey": "gridData",
                                                "title": "Corp Map",
                                                "style": "height:560px !important",
                                                "fieldType": "grid",
                                                "initLoad": true,
                                                "show": false,
                                                "height": 568,
                                                "gridSummaryLabel": "total",
                                                "gridConfig": {
                                                    "features": {
                                                        "domLayout": "normal",
                                                        "sideBar": "",
                                                        "enableGridMenu": false,
                                                        "groupSelectsChildren": true,
                                                        "suppressRowClickSelection": true
                                                    },
                                                    "columns": screenDefConfig["columns"]
                                                },
                                                "disabled": false,
                                                "required": true
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    };

                    sections.push(gridSection);
                    $scope.form = { "sections": sections, "functionalService": $scope.functionalService };

                    $scope.form.getResults = function () {
                        buildGrid();
                    };

                    $scope.form.name = screenDefConfig.name;

                    $scope.form.getFieldByModelKey = function (modelKey) {
                        return getFieldByModelKey($scope.form.sections, modelKey);
                    };

                    console.log(" $scope.form 1=", $scope.form);
                };

                var buildGridSection = function (screenDefConfig) {

                    var sections = [];
                    console.log("$scope.form.gridInfo=",$scope.form);
                    $scope.formDataModel = $scope.formDataModel || {};
                    $scope.form.gridInfo = $scope.form.gridInfo || {};
                    //  $scope.formDataModel["sections"] = sections;
                    $scope.formDataModel = screenDefConfig;
                    $scope.form.formDataModel = screenDefConfig;
                };
                var getFieldByModelKey = function (sections, modelKey) {
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
                                        console.log("Field to be returned ", mfield);
                                        return mfield;
                                    }

                                });
                            });
                        });
                    });
                    return mfield;
                };
                var buildGrid = function () {

                    var gridParams = buildGridParams();
                    var gridDataUrl = buildUrlByCriteria();

                    var gridInfo = getFieldByModelKey($scope.form.sections, "gridData");
                    console.log(" $scope.form 3=", $scope.form);
                    console.log(" $scope.form gridInfo 3=", gridInfo.gridOptions);
                    if (gridDataUrl) {
                        gridParams["gridDataUrl"] = gridDataUrl;
                    }
                    overlay.load();
                    httpService.get(gridDataUrl).then(function (response) {
                        console.log("response=", response);
                        gridInfo.gridOptions.api.setRowData(response.data.dataset);
                        gridInfo.gridOptions.api.sizeColumnsToFit();
                        overlay.hide();
                        // gridInfo.gridOptions.api.setDomLayout('normal');
                        $('.ag-theme-bootstrap').css("height" , '568px');
                        $(" .ag-header ").css("height","30px").css("min-height","30px");
                        $(".ag-header-row").css("height","30px !important");
                    });

                };

                var buildGridParams = function () {
                    if (!screenDefinition) {
                        console.log('I am buildGridParams, screenDefinition is not set properly in buildScreen function');
                        return;
                    }
                    //Prepare grid columnMap
                    var gridFeatures = gridService.buildGridFeatures(screenDefinition["features"], screenDefinition["columns"]);
                    var gridRootLevelColumns = gridService.buildColumnMap(screenDefinition["columns"], $scope.form);

                    var gridLevel2Columns = gridService.buildColumnMap(screenDefinition["childColumns"]);
                    $scope.isNestedGrid = false;

                    var gridParams = {
                        gridDataUrl: screenDefinition["dataUrl"],
                        columnDefs: gridRootLevelColumns,
                        defaultSortColumn: screenDefinition["defaultSortColumn"],
                        editPageUrl: screenDefinition["editScreenState"] || screenDefinition["detailScreenUrl"] || $scope.editScreenUrl
                    };
                    console.log("gridFeatures =", gridFeatures);
                    angular.forEach(gridFeatures, function (value, key) {
                        console.log(value + "--->" + key);
                        gridParams[key] = value;
                    });
                    gridParams["onRowClicked"] = function (e) {
                        console.log($scope);
                        var targetEle = e.event.target;
                        if (targetEle !== undefined) {
                            let data = e.data || e.node;
                            let actionType = targetEle.getAttribute("data-action-type");
                            let handlerName = targetEle.getAttribute("data-handlerName");
                            if (handlerName) {
                                $scope.actionHanlder(data, handlerName, screenDefinition);
                            }
                        }
                    };

                    gridParams.onGridReady = function (params) {
                        params.api.sizeColumnsToFit();
                        console.log("gridkey screenDefinition=", screenDefinition);
                        var screenName = screenDefinition["name"] || "";

                        var key = screenName;

                        console.log("gridkey=", key);

                        var gridColumn = localPersistenceService.get(key, true);
                        console.log('restore column: ', params, gridColumn);

                        if (gridColumn !== null)
                            params.columnApi.setColumnState(gridColumn);

                        params.api.addGlobalListener(function (type, event) {
                            if (type.indexOf('column') >= 0) {
                                console.log("gridkey-1", key);
                                localPersistenceService.set(key, JSON.stringify(params.columnApi.getColumnState()), true);
                            }
                        });
                    };

                    var rowKey = screenDefinition["rowKey"];
                    gridParams.rowKey = rowKey;
                    gridParams.detailScreenUrl = gridParams.editPageUrl;
                    console.log("gridFeatures screenDefinition=", screenDefinition);
                    console.log("gridFeatures =", gridParams);

                    if (!(rowKey === undefined || rowKey === null)) {
                        gridParams["onRowDoubleClicked"] = function (row, data, rowIndex, rowPinned, context, event) {
                            //var gridParams = $scope.field["gridConfig"];
                            console.log("row double clikced row=", row);
                            var groupColumnName = "";
                            if (!gridParams) {
                                console.log("gridParams object is not set to the scope.");
                                return;
                            }
                            var rowData = null;
                            if (row.data) {
                                rowData = row.data;
                            } else {
                                var gridColumns = gridParams.columnDefs;
                                groupColumnName = row.node.field;
                                data = gridService.getGridData(row.api, gridColumns);
                                angular.forEach(data, function (item, key) {
                                    var groupColumn = item && item[row.node.field] || "";
                                    if (groupColumn === row.node.key) {
                                        rowData = item;
                                    }
                                });
                            }
                            console.log("rowData=", rowData);
                            var urlpath = $location.path();
                            var rowKeys = gridParams.rowKeys || gridParams.rowKey;

                            var urlParamKeyList = [];
                            var urlParamValuesList = {};
                            for (var key in rowKeys) {
                                urlParamValuesList[key] = rowData[key];
                                urlParamKeyList.push("/:" + key);
                            }
                            var urlParams = urlParamKeyList.join("");

                            var detailScreenUrl = gridParams.detailScreenUrl + urlParams;

                            var checkIsgroupColumnSkip = function (columnName, gridParams) {
                                var isExists = false;
                                var groupCol = _.filter(gridParams.columnDefs, function (item) {
                                    return item.field === columnName;
                                });
                                if (groupCol.length > 0)
                                    isExists = groupCol[0].skipDetailScreenNavigation || false;
                                return isExists;
                            };

                            var skipDetailScreenNavigation = checkIsgroupColumnSkip(groupColumnName, gridParams);
                            if (detailScreenUrl && !skipDetailScreenNavigation) {
                                console.log("row clicked", stateService.getStateKeyFromMenuKey(detailScreenUrl), urlParamValuesList);
                                var detailScreenUrlMain = stateService.getStateKeyFromMenuKey(detailScreenUrl);
                                //$state.go(detailScreenUrl, urlParamValuesList);
                                console.log("detailScreenUrlMain, urlParamValuesList=", detailScreenUrlMain, urlParamValuesList);
                                $state.go(detailScreenUrlMain, urlParamValuesList);
                            }
                            return false;
                        };

                    }
                    if (gridLevel2Columns) {
                        $scope.isNestedGrid = true;
                        gridParams["subcols"] = gridLevel2Columns;
                        gridParams["gridSecondUrl"] = screenDefinition["childDataUrl"];
                        gridParams["defaultSecondSortColumn"] = screenDefinition["childDefaultSortColumn"];
                    }
                    rowKey = screenDefinition["rowKey"];
                    if (!(rowKey === undefined || rowKey === null)) {
                        if (angular.isArray(rowKey)) {
                            gridParams["multipleKeys"] = true;
                            gridParams["rowMultipleKeys"] = rowKey;
                            gridParams["rowMultipleDataKeys"] = screenDefinition["dataKeys"];
                        }
                        else if (angular.isObject(rowKey)) {
                            gridParams["editEntityValue"] = rowKey;
                            if ($scope.isNestedGrid) {
                                gridParams["rowKey"] = rowKey["entityObjectId"];
                            }
                        }
                        else if (angular.isString(rowKey)) {
                            gridParams["rowKey"] = rowKey;
                        }
                    }
                    // $scope.gridParams = gridParams;
                    return gridParams;
                };

                $scope.actionHanlder = function (data, handlerName, screenDefinition) {
                    console.log("1111=", screenDefinition);
                    $scope.form.functionalService[handlerName](data, $scope.parentForm, $scope.form, $scope.getResults, screenDefinition);
                };

                var buildUrlByCriteria = function () {
                    var dataUrl = $scope.dataUrl;
                    if (!dataUrl) {
                        console.log('I am buildUrlByCriteria, dataUrl is not set properly in buildScreen function');
                        return;
                    }
                    var criteriaDataModel = getCriteriaDataModel();

                    if (criteriaDataModel) {
                        dataUrl = gridService.buildUrlWithPaginationParams(dataUrl, null, criteriaDataModel);
                    }
                    return dataUrl;
                };

                var getCriteriaDataModel = function () {
                    console.log("getCriteriaDataModel=");
                    var criteriaDataModel = {};
                    if (!$scope.criteria) {
                        return criteriaDataModel;
                    }

                    var rowDivisions = $scope.criteria.rowDivisions;
                    var rowItemCount = rowDivisions && rowDivisions.length > 0 ? rowDivisions.length : 1;

                    for (var i = 0; i < rowItemCount; i++) {

                        var columns = rowDivisions[i]["columns"];
                        for (var m = 0; m < columns.length; m++) {
                            var rowFields = columns[m]["fields"];
                            for (var j = 0; j < rowFields.length; j++) {
                                var field = rowFields[j];

                                var fieldDataModel;
                                if (field.getModel) {
                                    fieldDataModel = field.getModel();
                                }

                                if (!field.modelKey && angular.isObject(fieldDataModel) && !angular.isArray(fieldDataModel)) {
                                    criteriaDataModel = angular.extend(criteriaDataModel, fieldDataModel);
                                }
                                else if (field.modelKey && !field.ignoreInServiceModel) {
                                    if (angular.isUndefined(fieldDataModel)) {
                                        if (angular.isDefined(field.defaultValue)) {
                                            criteriaDataModel[field.modelKey] = field.defaultValue;
                                        }
                                        else if (field.defaultValueByKey) {
                                            criteriaDataModel[field.modelKey] = modelUtilService.getValueFromModelByKey(field.defaultValueByKey, localStorage);
                                        }
                                    }
                                    else {
                                        criteriaDataModel[field.modelKey] = fieldDataModel;
                                    }
                                }
                            }
                        }


                    }
                    console.log("getCriteriaDataModel=", criteriaDataModel);
                    return criteriaDataModel;
                };

                $scope.getResults = function () {
                    //this.functionalService.getGridData($rootScope);
                    buildGrid();
                };
                $scope.reloadScreen = function (currentItem) {
                    var found = $filter('filter')($scope.screenConfig, { value: currentItem.filterKeyValue }, true);
                    if (found && found.length > 0) {
                        $scope.isLoaded = false;
                        var screenDef = found[0]["config"];
                        buildActions(screenDef);
                        buildScreen(screenDef);
                    }
                };

                $scope.setForm = function (df_form) {
                    $scope.form = $scope.form || {};
                    $scope.form["df_form"] = df_form;
                    $scope.form.readOnlyForm = false;
                    console.log(" $scope.form 4 =", $scope.form);
                };
                //    if(!$rootScope.checkPermission('racing.maingroupmaster'))
                //        $location.path($rootScope.purchaseunauthorizedurl);

                //    //Flag to check navigation from main or thingsToDo 
                //    $scope.thingsToDo = $rootScope.checkThingsToDoPage();
                //    $rootScope.thingstodomenu = 'maingroupmaster';
                //    $rootScope.mastersmenu = true;

                /* pdf Block */

                $rootScope.pdfDefaultSettings();
                $rootScope.showPdfSettings = function (form) {
                    $rootScope.pdfSettings = true;
                };
                $scope.pdfGenerateUrl = function () {
                    $rootScope.pdfDefaultSettings();
                    overlay.load();
                    var pdfUrl = 'reports/generate/' + screenKey + $rootScope.pdfUrl + '&pageType=' + $rootScope.pageType + '&orientation=' + $rootScope.orientation;
                    $rootScope.pdfGenerate(pdfUrl);


                };
                /* pdf Block END*/

                //Generate Grid
                $scope.$on("$destroy", function () {
                    $rootScope.gridOptions = {};
                });

                $scope.getAddScreenUrl = function () {
                    return $state.href(addScreenUrl);
                };
                 
                var modalDataBinding = function(sections,modalData){
                       var defer = $q.defer();    
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
                                    console.log("1. field=",field);
                                    if(field.fieldType=="grid"){
                                        var gridApi = field.gridOptions.api;
                                         gridApi.setRowData(modalData[field.modelKey]);
                                    }else{
                                        console.log("1.field type=",field.fieldType);
                                        console.log("1.field type=",modalData[field.modelKey]);
                                        field.setModel(modalData[field.modelKey]);
                                    }

                                });
                            });
                            //no Columns
                             var fields = row.fields;
                                //fields
                                var fModel = {};
                                angular.forEach(fields, function (field, index) {
                                    console.log("2. field=",field);
                                    if(field.fieldType=="grid"){
                                        var gridApi = field.gridOptions.api;
                                         gridApi.setRowData(modalData[field.modelKey]);
                                    }else{
                                        console.log("1.field type=",field.fieldType);
                                        console.log("1.field type=",modalData[field.modelKey]);
                                        // field.setModel(modalData[field.modelKey]);
                                    }
                                     
                                });
                        });
                    });
                    defer.resolve(true);
                   // return mfield;
                 return  defer.promise;
               
                };

               
                $scope.$on('$viewContentLoaded', function (event) {
                    // buildBreadcrumbModel();
                    console.log("Listing Screen After load Loadad data 1 1");
                    $timeout(function () {
                        console.log("Listing Screen After load Loadad data 1 2");
                        if ($scope.functionalService && $scope.functionalService.afterLoad) {
                            console.log("Listing Screen After load Loadad data 1 3");
                            $scope.functionalService.afterLoad(screenDefinition);
                        }
                    }, 2000);

                });

                init();
            }];
    });
