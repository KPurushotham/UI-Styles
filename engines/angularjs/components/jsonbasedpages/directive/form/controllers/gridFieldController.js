define(['angularAMD', 'modelUtilService', 'fieldService', 'gridService', 'dateUtilService', 'localPersistenceService', 'stateService'], function (angularAMD) {
    'use strict';

    angularAMD.controller('gridFieldController', function ($scope, $injector, $location, $controller, httpService, overlay, Notification, $filter,
        $templateCache, modelUtilService, fieldService, gridService, dateUtilService, localPersistenceService, stateService, $state) {
        var dynamicServices = {};
        var functionalService;

        $scope.field.reset = function () {
            //   debugger;
            console.log("grid field clear()", $scope.field.gridOptions);
            $scope.field.gridOptions.api.setRowData([]);
        };

        $scope.$on('notifyDependantsOnParentDataChange', function (event, args) {
            console.log('notifyDependantsOnParentDataChange args:', args);
            var currentField = $scope.field;
            $scope.parentForm.runDependancy("FIELD", currentField, args, function (currentSourceDC) {
                var loadDataConfig = currentSourceDC["loadData"];
                var dataConfigs = currentSourceDC["dataConfigs"];
                if (dataConfigs) {
                    var eventSourceValue = args["eventSourceValue"];
                    if (dataConfigs[eventSourceValue]) {
                        $scope.field["dataConfig"] = dataConfigs[eventSourceValue];
                    }
                    else {
                        $scope.field["dataConfig"] = null;
                    }
                }
                console.log("start buildGrid -->gridFieldController.js-->Line No:- 24 --");
                $scope.field.buildGrid();
            });
        });

        $scope.rowDblClick = function (row) {
            console.log("In row Double Click event");
            var gridParams = $scope.field["gridConfig"];
            if (!gridParams) {
                console.log("gridParams object is not set to the scope.");
                return;
            }

            var urlpath = $location.path();
            var rowKeys = gridParams.rowKeys || gridParams.rowKey;
            var urlParamList = [];
            for (var key in rowKeys) {
                urlParamList.push(row.data[key]);
            }
            var urlParams = urlParamList.join('/');

            var detailScreenUrl = gridParams.detailScreenUrl;
            if (detailScreenUrl) {
                if (urlpath.indexOf("/app/thingstodo/") > 0) {

                    var splitUrl = detailScreenUrl.split("/");
                    splitUrl[0] = "thingstodo";
                    detailScreenUrl = splitUrl.join("/");
                    if (row.entity['notificationId'] !== null && row.entity['notificationId'] !== undefined)
                        urlParams = urlParams + "/" + row.entity['notificationId'];
                }
                if (!detailScreenUrl.endsWith("/")) {
                    detailScreenUrl += "/";
                }
                $location.path("app/" + detailScreenUrl + urlParams);
            }
            return false;
        };

        $templateCache.put('ui-grid/selectionRowHeaderButtons',
            "<div class=\"ui-grid-selection-row-header-buttons \" ng-class=\"{'ui-grid-row-selected': row.isSelected}\" ><input style=\"margin: 0; vertical-align: middle\" type=\"checkbox\" ng-model=\"row.isSelected\" ng-click=\"row.isSelected=!row.isSelected;selectButtonClick(row, $event)\">&nbsp;</div>"
        );

        $templateCache.put('ui-grid/selectionSelectAllButtons',
            "<div class=\"ui-grid-selection-row-header-buttons \" ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ng-if=\"grid.options.enableSelectAll\"><input style=\"margin: 0; vertical-align: middle\" type=\"checkbox\" ng-model=\"grid.selection.selectAll\" ng-click=\"grid.selection.selectAll=!grid.selection.selectAll;headerButtonClick($event)\"></div>"
        );
        $scope.field.getModel = function () {
            //  var rows = $scope.field.gridApi.grid.rows;
            var rowData = [];
            $scope.field.gridOptions.api.stopEditing();
            $scope.field.gridOptions.api.forEachNode(function (node) {
                $scope.convertToDBFormat(node.data);
                rowData.push(node.data);
            });
            console.log('Row Data:');
            console.log(rowData);

            $scope.sectionDataModel[$scope.field.modelKey] = rowData;
            $scope.populateModelForService(rowData);
            var model = $scope.sectionDataModel[$scope.field.modelKey];
            var isRequiredFailed = false;
            if (model && model.length <= 0 && $scope.field.required) {
                Notification.error({ message: $scope.field.requiredMessage || "Atleast one item should be there in grid.", title: 'REQUIRED FIELDS', delay: 5000 });
                isRequiredFailed = true;
            }
            $scope.parentForm.df_form[$scope.field.modelKey].$setValidity("required", isRequiredFailed);
            console.log('model:');
            console.log(model);

            return model;
        };

        $scope.convertToDBFormat = function (data) {
            angular.forEach(data, function (dataColumnValue, colName) {
                angular.forEach($scope.field.gridConfig.columns, function (key, val) {
                    var formatType = key["formatType"];
                    if (key["field"] === colName) {
                        if (formatType && formatType === "Date") {
                            data[colName] = dateUtilService.convertToDBFormat(moment(dataColumnValue));
                            console.log(" data[colName] ==", data[colName]);
                        }
                    }

                });
            });
            return data;
        };

        $scope.convertFromDBFormat = function (data) {
            angular.forEach(data, function (dataColumnValue, colName) {
                angular.forEach($scope.field.gridConfig.columns, function (key, val) {
                    var formatType = key["formatType"];
                    var gridDate;
                    if (key["field"] === colName) {
                        if (formatType && formatType === "Date") {
                            var parsedate = Date.parse(dataColumnValue);
                            console.log(" parsedate == ", parsedate);
                            data[colName] = dateUtilService.convertToDateFormat(moment(dataColumnValue));
                        }
                        else if (formatType && formatType === "DateTime") {
                            console.log(" formatType == DateTime");
                            data[colName] = dateUtilService.convertToDateTimeFormat(moment(dataColumnValue));
                        }
                    }

                });
            });
            console.log(data);
            return data;
        };

        $scope.populateModelForService = function (row) {
            if (!$scope.field.gridConfig || !$scope.field.gridConfig.modelKeyMap) {
                console.log("modeKeyMap is missing");
                return;
            }
            var modelKeyMap = $scope.field.gridConfig.modelKeyMap;
            var rows = !angular.isArray(row) ? [row] : row;

            var serviceModel = $scope.sectionDataModel[$scope.field.modelKey] || [];

            var itemCount = serviceModel.length;
            var unselectedItemIndexes = [];
            for (var i = 0; i < rows.length; i++) {
                var rowEntity = rows[i];
                var isSelectionFeatureEnabled = $scope.isSelectionFeatureEnabled();
                if (isSelectionFeatureEnabled && rows[i].isSelected === false) {
                    //  var existedModel = $filter('filter')(gridFieldModel, { "$$hashKey": rowEntity["$$hashKey"] }, true);
                    for (var k = 0; k < itemCount; k++) {
                        if (unselectedItemIndexes.indexOf(k) === -1) {
                            var modelItem = serviceModel[k];
                            var matchFlag = $scope.checkObjectEqualsTo(rowEntity, modelItem);
                            if (matchFlag.indexOf("0") === -1) {
                                serviceModel.splice(k, 1);
                                unselectedItemIndexes.push(k);
                                itemCount--;
                            }
                        }
                    }
                }
                else {
                    if (!isSelectionFeatureEnabled || (isSelectionFeatureEnabled && rows[i].isSelected === true)) {
                        var itemIndex = $scope.indexOfInModel(rowEntity);
                        if (itemIndex < 0) {
                            itemIndex = itemCount++;
                        }
                        serviceModel[itemIndex] = serviceModel[itemIndex] || {};
                        for (var j = 0; j < modelKeyMap.length; j++) {
                            var modelKey = modelKeyMap[j];
                            if (rowEntity.hasOwnProperty(modelKey)) {
                                serviceModel[itemIndex][modelKey] = rowEntity[modelKey];
                            }
                            else {
                                console.log("modelKey " + modelKey + " is not exist in grid row entity", rowEntity["entity"])
                            }
                        }
                    }
                }
            }
            $scope.sectionDataModel[$scope.field.modelKey] = serviceModel;
        };

        $scope.indexOfInModel = function (rowEntity) {

            var index = -1;
            var serviceData = $scope.sectionDataModel[$scope.field.modelKey];
            if (serviceData) {
                var serviceItemCount = serviceData.length;
                for (var i = 0; i < serviceItemCount; i++) {
                    var serviceItem = serviceData[i];
                    var matchFlag = $scope.checkObjectEqualsTo(serviceItem, rowEntity);
                    if (matchFlag.indexOf("0") === -1) {
                        index = i;
                        break;
                    }
                }
            }
            return index;
        };
        $scope.checkObjectEqualsTo = function (source, target) {
            var matchFlag = "";
            var modelKeyMap = $scope.field.gridConfig.modelKeyMap;
            for (var k = 0; k < modelKeyMap.length; k++) {

                if (source[modelKeyMap[k]] === target[modelKeyMap[k]]) {
                    matchFlag = matchFlag + "1";
                }
                else {
                    matchFlag = matchFlag + "0";
                }
            }
            return matchFlag;
        };

        $scope.field.setAdditionalDependancyParams = function (gridParams) {
            var dependancyConfigList = $scope.field["dependancyConfig"];

            fieldService.buildAdditionalDependancyParams(dependancyConfigList, $scope.formDataModel, function (additionalKeyParams, source) {
                if (additionalKeyParams && source) {
                    var qsParamsList = [];
                    var k = 0;
                    angular.forEach(additionalKeyParams, function (modelKey, paramName) {
                        if (modelKey) {
                            var parentSectionModelKey = $scope.parentSection ? $scope.parentSection.modelKey : '';
                            var sourceDataModelValue = modelUtilService.getValueFromModelByKey(modelKey, source, $scope.parentSection.modelKey, $scope.parentForm);

                            qsParamsList[k++] = paramName + "=" + sourceDataModelValue;
                        }

                    });
                    gridParams["additionalQSParams"] = qsParamsList.join("&");
                }
            });
        };

        $scope.field.buildGrid = function () {
            console.log("buildGrid");
            var gridParams = $scope.field["gridConfig"];
            if (!gridParams.gridDataUrl && !gridParams.dataUrl) {
                return;
            }
            console.log("start buildGrid -->gridFieldController.js-->Line No:- 195 --");
            //   $scope.field.gridOptions = buildGridOptions();  // angular.extend({}, gridService.defaultGridOptions, currentFieldGridOptions);
            gridService.getGridPageData(gridParams, 1).then($scope.field.successCallback);
        };

        var buildGridOptions = function () {
            console.log("buildGridOptions");
            var gridParams = $scope.field["gridConfig"];
            if (!gridParams) {
                console.log("missing gridConfig object in field config.");
                return;
            }
            var gridFeatures = gridParams["gridFeatures"];

            //$scope.field.gridLoadData = "Loading";

            $scope.field.setAdditionalDependancyParams(gridParams);
            var gridOptions = gridService.buildAndOverwriteDefaultOptions(gridParams);

            gridOptions["onRegisterApi"] = function (gridApi) {
                console.log("onRegisterApi", onRegisterApi);
                $scope.field.gridApi = gridApi;
                if ($scope.isSelectionFeatureEnabled()) {
                    gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                        //   $scope.populateModelForService(row);
                    });//end single row

                    // Multiple row selections
                    gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
                        // $scope.populateModelForService(rows);
                    });//end batch selection

                }
                if ($scope.isEditFeatureEnabled()) {

                    gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                        $scope.msg.lastCellEdited = 'edited row id:' + rowEntity.id + ' Column:' + colDef.name + ' newValue:' + newValue + ' oldValue:' + oldValue;
                        $scope.$apply();
                    });
                }
                if (gridParams["enableFiltering"] === true) {
                    $scope.field.gridApi.core.on.filterChanged($scope, function () {
                        var grid = this.grid;
                        var i = 0;
                        $scope.filterParams = '';
                        angular.forEach(grid.columns, function (value, key) {
                            if (value.filter.term !== undefined && value.filter.term !== '') {

                                $scope.filterParams += '&';
                                $scope.filterParams += "fk-" + value.field + "=" + value.filter.term;
                            }
                        });
                        var paginationOptions = {
                            sort: null
                        };
                        gridService.getGridPageData(gridParams, grid.options.paginationCurrentPage, grid.options.paginationPageSize,
                            paginationOptions.sort, this.grid.sortCustomColumn, $scope.filterParams)
                            .then($scope.field.successCallback);

                    });
                }
                if (gridParams["useExternalSorting"] === true || gridParams["enableSorting"] === true) {

                    $scope.field.gridApi.core.on.sortChanged($scope, function (grid, sortColumns) {
                        while (sortColumns.length > 1) { sortColumns[0].unsort(); sortColumns.shift(); }
                        if (getPage) {

                            if (sortColumns.length > 0) {

                                paginationOptions.sort = sortColumns[0].sort.direction;
                            } else {
                                paginationOptions.sort = null;
                            }
                            this.grid.sortCustomColumn = sortColumns[0].field;
                            gridService.getGridPageData(gridParams, grid.options.paginationCurrentPage, grid.options.paginationPageSize,
                                paginationOptions.sort, sortColumns[0].field, $scope.filterParams).then($scope.field.successCallback);
                        }
                    });
                }
                if (gridFeatures && gridFeatures.indexOf("pagination") >= 0) {

                    gridApi.pagination.on.paginationChanged($rootScope, function (newPage, pageSize) {
                        gridService.getGridPageData(gridParams, newPage, pageSize, paginationOptions.sort,
                            this.grid.sortCustomColumn, $scope.filterParams).then($scope.field.successCallback);
                    });
                }
            };

            return gridOptions;
        };

        $scope.field.setModel = function (gridModelData) {
            if (!gridModelData) {
                return;
            }

            console.log("grid-setModel==", gridModelData);
            var rowData = [];
            angular.forEach(gridModelData[$scope.field["modelKey"]], function (node) {
                $scope.convertFromDBFormat(node);

            });
            //$scope.field.isDataLoaded = true;
            // $scope.isLoaded = true;

            // $scope.field.gridOptions = buildGridOptions(); 
            $scope.field.setGridModeByScreenMode();

            if (gridModelData.data) {
                gridModelData = gridModelData.data;
            }
            else if (gridModelData.items)
                $scope.field.gridOptions.data = gridModelData.items;
            else if (gridModelData.dataset)
                $scope.field.gridOptions.data = gridModelData.dataset;
            else
                $scope.field.gridOptions.data = gridModelData[$scope.field["modelKey"]];

            if (!gridModelData.totalCount)
                $scope.field.gridOptions.totalItems = gridModelData.totalCount;
            else if (!gridModelData.totalItems)
                $scope.field.gridOptions.totalItems = gridModelData.totalItems;
            else
                $scope.field.gridOptions.totalItems = $scope.field.gridOptions.data.length;

            //TODO: for testing only.
            console.log("gridApi", $scope.field.gridOptions);
            //  $scope.sectionDataModel[$scope.field.modelKey] = [{ "costCenterCode": "ccc354", "status":"A" }, { "costCenterCode": "44", "status":"I"  }];
            if ($scope.field.gridOptions.data && $scope.field.gridOptions.data.length > 0) {
                if (!$scope.field.gridOptions.api) {
                    $scope.field.gridOptions = buildGridOptions();
                }
                $scope.field.gridOptions.api.updateRowData({ add: $scope.field.gridOptions.data });
                // $scope.field.gridApi.grid.modifyRows($scope.field.gridOptions.data);
                if ($scope.isSelectionFeatureEnabled()) {
                    $scope.field.setSelectedItemsFromService();
                }

                //if ($scope.isEditFeatureEnabled()) {
                //    var gridRows = $scope.field.gridApi.grid.rows;
                //    var gridItemCount = gridRows.length;
                //    for (var i = 0; i < gridItemCount; i++) {
                //        // gridRows[i].inlineEdit = InlineEdit;
                //        gridRows[i].inlineEdit.enterEditMode();
                //    }
                //}
            }
            else {

                //$scope.field.gridOptions.data = $scope.field.gridOptions.data || [];
                //var emptyRecord = gridService.buildEmptyRecord($scope.field["gridConfig"]["columns"]);
                //$scope.field.gridOptions.data.push(emptyRecord);
                //$scope.field.gridOptions.totalItems = 1;
            }

            // $rootScope.gridOptions.data = results.dataset;
            $scope.field.gridLoadData = "No Data Found";

        };

        $scope.field.setGridModeByScreenMode = function () {

            var defaultColDef = $scope.field.gridOptions["defaultColDef"] || {};
            if ($scope.parentForm.readOnlyForm) {
                defaultColDef["editable"] = false;
            }
            else {
                defaultColDef["editable"] = true;
            }
            $scope.field.gridOptions["defaultColDef"] = defaultColDef;

            var columnDefs = $scope.field.gridOptions["columnDefs"] || {};
            angular.forEach(columnDefs, function (colDef, index) {
                if ($scope.parentForm.readOnlyForm) {
                    $scope.field.gridOptions.columnApi.getColumn(colDef.field).colDef.editable = false;
                }
                else {
                    console.log("Before ", $scope.field.gridOptions.columnApi.getColumn(colDef.field));
                    $scope.field.gridOptions.columnApi.getColumn(colDef.field).colDef.editable = colDef.editable === undefined ? false : colDef.editable;
                    console.log("After ", $scope.field.gridOptions.columnApi.getColumn(colDef.field));
                }
            });
            console.log($scope.field.gridOptions.columnApi.getAllColumns());
        };

        $scope.field.successCallback = function (results) {
            $scope.field.setModel(results);
        };

        // test to populate Count
        $scope.field.totalCount = function (results) {
            alert("am in total count");
            $scope.field.setModel(results);
        };
        $scope.field.getDataPath = function (data) {
            // alert ("am in get data path");
            return data.orgHierarchy;
        };

        $scope.isFeatureEnabled = function (feature) {
            var gridParams = $scope.field["gridConfig"];
            if (!gridParams) {
                console.log("missing gridConfig object in field config.");
                return false;
            }

            var gridFeatures = gridParams["gridFeatures"];

            return (gridFeatures && gridFeatures.indexOf(feature) >= 0);
        };

        $scope.isSelectionFeatureEnabled = function () {
            return $scope.isFeatureEnabled("selection");
        };
        $scope.isEditFeatureEnabled = function () {
            return $scope.isFeatureEnabled("edit");
        };
        $scope.field.setSelectedItemsFromService = function () {
            if (!$scope.field.gridConfig || !$scope.field.gridConfig.modelKeyMap) {
                console.log("modeKeyMap is missing");
                return;
            }
            if (!$scope.field.gridOptions.data || $scope.field.gridOptions.data.length <= 0) {
                console.log("no grid data");
                return;
            }
            if (!$scope.sectionDataModel[$scope.field.modelKey] || $scope.sectionDataModel[$scope.field.modelKey].length <= 0) {
                console.log("empty data from service");
                return;
            }

            var gridData = $scope.field.gridOptions.data;
            var serviceData = $scope.sectionDataModel[$scope.field.modelKey];
            var gridItemCount = gridData.length;
            var serviceItemCount = serviceData.length;
            var selectedItemIndexes = [];
            for (var i = 0; i < serviceItemCount; i++) {
                var serviceItem = serviceData[i];
                for (var j = 0; j < gridItemCount; j++) {
                    if (selectedItemIndexes.indexOf(j) === -1) {
                        var gridItem = gridData[j];

                        var matchFlag = $scope.checkObjectEqualsTo(serviceItem, gridItem);
                        if (matchFlag.indexOf("0") === -1) {
                            $scope.field.gridApi.selection.selectRow($scope.field.gridOptions.data[j]);
                            selectedItemIndexes.push(j);
                            break;
                        }
                    }

                }
            }
        };

        var injectDynamicServices = function () {
            var serviceName = $scope.field.ngServiceName || $scope.parentForm.ngServiceName;
            if (serviceName) {
                dynamicServices[serviceName] = $injector.get(serviceName);
                functionalService = dynamicServices[serviceName];
            }
            return functionalService;
        };

        var init = function () {
            var gridParams = $scope.field["gridConfig"];
            console.log("333  grid init=", $scope.field, gridParams);
            console.log(" $scope.parentForm=", $scope.parentForm);
            gridParams.features["sideBar"] = "";
            var gridFeatures = gridService.buildGridFeatures(gridParams.features);
            var gridRootLevelColumns = gridService.buildColumnMap(gridParams.columns, $scope.parentForm);

            if (!gridParams) {
                console.log("missing gridConfig object in field config.");
                return;
            }

            var gridParamsList = {
                // gridDataUrl: screenDefinition["dataUrl"],
                editType: 'fullRow',
                columnDefs: gridRootLevelColumns,
                enableCharts: true,
                enableRangeSelection: true
                //  defaultSortColumn: screenDefinition["defaultSortColumn"],
                // editPageUrl: screenDefinition["editScreenState"] || screenDefinition["detailScreenUrl"] || $scope.editScreenUrl,
            };
            angular.forEach(gridFeatures, function (value, key) {
                console.log("2221 grid features -->", value + "--->" + key);
                gridParamsList[key] = value;
            });
            $scope.field["height"] = "200px";
            gridParamsList.onGridReady = function (params) {
                params.api.sizeColumnsToFit();
                params.api.hideOverlay();
                var screenName = $scope.parentForm["name"] || "";
                var gridModelKey = $scope.field["modelKey"] || "";
                var key = screenName + "_" + gridModelKey;

                console.log("key=", key);

                var gridColumn = localPersistenceService.get(key, true);
                console.log('restore column: ', params, gridColumn);

                if (gridColumn !== null)
                    params.columnApi.setColumnState(gridColumn);

                params.api.addGlobalListener(function (type, event) {
                    if (type.indexOf('column') >= 0) {
                        localPersistenceService.set(key, JSON.stringify(params.columnApi.getColumnState()), true);
                    }
                });
            };

            injectDynamicServices();

            gridParamsList["onRowClicked"] = function (e) {
                console.log($scope);
                console.log("onRowClicked=");
                var targetEle = e.event.target;
                if (targetEle !== undefined) {
                    let data = e.data;
                    let actionType = targetEle.getAttribute("data-action-type");
                    let handlerName = targetEle.getAttribute("data-handlerName");
                    $scope.actionHanlder(data, handlerName);
                }
            };
            gridParamsList["onRowDoubleClicked"] = function (row, data, rowIndex, rowPinned, context, event) {

                var ondbClickHandler = $scope.field.gridConfig["ondbClickHandler"];
                if (ondbClickHandler && $scope.parentForm.functionalService && $scope.parentForm.screenMode === "EDIT") {
                    $scope.parentForm.functionalService[ondbClickHandler](row.data, row.rowIndex);
                }
                if ($scope.parentForm.formDataModel) {
                    var gridParams = {
                        rowKey: $scope.parentForm.formDataModel["rowKey"],
                        gridDataUrl: $scope.parentForm.formDataModel["dataUrl"],
                        columnDefs: gridRootLevelColumns,
                        defaultSortColumn: $scope.parentForm.formDataModel["defaultSortColumn"],
                        editPageUrl: $scope.parentForm.formDataModel["editScreenState"] || $scope.parentForm.formDataModel["detailScreenUrl"] || $scope.editScreenUrl
                    };
                    gridParams.detailScreenUrl = gridParams.editPageUrl;
                }
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

            $scope.field.gridOptions = gridParamsList;
            $scope.field.gridOptions["sideBar"] = "none";
            $scope.field.gridOptions["suppressSizeToFit"] = false;
            $scope.field.show = true;
            $scope.gridFeatures = gridParams.gridFeatures;
            if ($scope.field["initLoad"] === true) {

                $scope.field.buildGrid();
            }
            return self;
        };

        init();
        //Generate Grid
        $scope.$on("$destroy", function () {
            $scope.field.gridOptions = {};
        });

        $scope.actionHanlder = function (data, handlerName) {
            if (handlerName)
                $scope.parentForm.functionalService[handlerName](data, $scope.parentForm);
        };


        function getDatePicker() {
            // function to act as a class
            function Datepicker() { }

            // gets called once before the renderer is used
            Datepicker.prototype.init = function (params) {
                // create the cell
                this.eInput = document.createElement('input');
                this.eInput.value = params.value;

                // https://jqueryui.com/datepicker/
                $(this.eInput).datepicker({
                    dateFormat: 'dd/mm/yy'
                });
            };

            // gets called once when grid ready to insert the element
            Datepicker.prototype.getGui = function () {
                return this.eInput;
            };

            // focus and select can be done after the gui is attached
            Datepicker.prototype.afterGuiAttached = function () {
                this.eInput.focus();
                this.eInput.select();
            };

            // returns the new value after editing
            Datepicker.prototype.getValue = function () {
                return this.eInput.value;
            };

            // any cleanup we need to be done here
            Datepicker.prototype.destroy = function () {
                // but this example is simple, no cleanup, we could
                // even leave this method out as it's optional
            };

            // if true, then this editor will appear in a popup
            Datepicker.prototype.isPopup = function () {
                // and we could leave this method out also, false is the default
                return false;
            };

            return Datepicker;
        }

    });

    return angularAMD;
});