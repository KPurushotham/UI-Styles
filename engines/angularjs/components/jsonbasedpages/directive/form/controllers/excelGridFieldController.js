define(['angularAMD', 'utilService', 'fieldService', 'gridService','modelUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.controller('excelGridFieldController', function ($scope, $injector, $location, $controller, httpService, overlay, Notification, $filter,
        $templateCache, utilService, fieldService, gridService, modelUtilService) {
        $controller('fieldBaseController', { $scope: $scope });
        var self = this;

        var getHandlerByName = function (handlerName) {
            if ($scope.parentForm && $scope.parentForm.functionalService) {
                return $scope.parentForm.functionalService[handlerName];
            }
            return;
        };

        var init = function () {
            //$scope.field.initializeExcelGridInstance();
            var initHandler = getHandlerByName($scope.field["initHandler"] || "init");
            if (angular.isFunction(initHandler)) {
                var promise = initHandler($scope.field, $scope.parentForm, $scope.parentSection, $scope.sectionDataModel, $scope.formDataModel, $scope.event);
                if (promise && promise.then) {
                    promise.then(function () {

                    });
                }
            }
            return self;
        };

        $scope.field.initializeExcelGridInstance = function () {
            var hot = $scope.field["excelGridInstance"];
            if (hot) {
                console.log("excel-grid field with modelkey " + $scope.field.modelKey + " was intialized already.");
                return hot;
            }
          
            var hotElement = document.getElementById($scope.field.modelKey);
            // var hotElementContainer = hotElement.parentNode;
            var hotSettings = getRootLevelSettingFromDefinition();
            console.log("hotSettings=", hotSettings);
            if ($scope.field.columns) {
                hotSettings["columns"] = getColumnsFromDefinition();
                hotSettings["onBeforeChange"] = function (data) {
                    console.log("aaa onBeforeChange 12=", data);
                };
                hotSettings["onAfterChange"] = function (data,source) {
                        console.log("aaa onAfterChange 1    2=",data,source);
                        hot.setDataAtCell( currentRow, 12, totalCost );
                    if ($scope.parentForm.functionalService.selectAllCheckBoxHandler) {
                        if ($(".htCheckboxRendererInput").length === $(".htCheckboxRendererInput:checked").length) {
                            $scope.parentForm.functionalService.selectAllCheckBoxHandler(true);
                        }
                        else {
                            $scope.parentForm.functionalService.selectAllCheckBoxHandler(false);
                        }
                    }
                };
            }
            hotSettings["colHeaders"] = true;

            if (hotElement) {
                hot = new Handsontable(hotElement, hotSettings);
                
                $scope.field["excelGridInstance"] = hot;
                console.log("111a percentage =");
                // hot.renderers.registerRenderer('percentage', function(){
                //     alert("aaa");
                // });
                return hot;
            }
            else {
                console.log("looks like handson table container is not on DOM yet.");
            }
        };

        $scope.field.getModel = function () {            
            var getModelHandler = getHandlerByName($scope.field["getModelHandler"] || "getModel");
            var data = $scope.field.getExcelData();
            var result = getModelHandler(data);
            console.log("getModelHandler=",result);
            if(result.length >0)
            return getModelHandler(data);
        };

        $scope.field.setModel = function (modelValue) {
            console.log("Excel grid setModel handler");
            var setModelHandler = getHandlerByName($scope.field["setModelHandler"] || "setModel");
            var data = setModelHandler(modelValue);
            $scope.field.bindExcelData(data);
        };

        $scope.field.getExcelData = function () {
            var hot = $scope.field.getExcelGridInstance();
            var data = null;
            if (hot) {
                data = hot.getSettings().data;
            }
            return data;
        };

        $scope.field.reset = function () {
            var hot = $scope.field.getExcelGridInstance();
            hot.updateSettings({ data: [] });
        };

        $scope.field.getSelectedRows = function () {
            var hot = $scope.field.getExcelGridInstance();
            var selectedRows = null;
            if (hot) {
                selectedRows = hot.getSelectedRange();
            }
            return selectedRows;
        };

        $scope.field.getExcelGridInstance = function () {
            var hot = $scope.field["excelGridInstance"];
            if (!hot) {
                hot = $scope.field.initializeExcelGridInstance();
            }
            return hot;
        };

        $scope.field.rebindExcelData = function (columnSources, dataSource) {
            var hot = $scope.field.getExcelGridInstance();
            if (!hot) {
                console.log("rebindExcelData: looks like handson table container is not on DOM yet.");
                return;
            }
            var data = hot.getSettings().data;
            // debugger;
            console.log("data in excel==",data);
            var columns = hot.getSettings().columns;
            var updatedSettings = {};
            if (columns && columnSources) {
                for (var i = 0; i < columns.length; i++) {
                    if (angular.isDefined(columnSources[i])) {
                        columns[i].source = columnSources[i];
                    }
                }
                updatedSettings["columns"] = columns;
            }
            if (data) {
                updatedSettings["data"] = dataSource;
            }
            if ($scope.parentForm.screenMode === "VIEW") {
              //  debugger;
                updatedSettings["readOnly"] = true;
                // angular.forEach(hiddenColumnIndexes, function (colIndex, index) {
                //     colWidths[colIndex] = 0.1;
                // });
            }

            updatedSettings.contextMenu = {
                //items: {
                //    "row_above": {
                //    },
                //    "row_below": {
                //    },
                //    "remove_row": {
                //    },
                //    "Custom": {
                //        name: "Autosize All Columns",
                //        callback: function (key, selection, clickEvent) {
                //            hot.updateSettings({"autoColumnSize":true});
                //        }
                //    }
                //},
                callback: function (key, options) {
                    var data = $scope.field.getExcelData();
                    var currentRowIndex = options.start.row;
                    if (["row_above", "row_below"].indexOf(key) !== -1) {
                        var emptyRowIndex = (key === "row_above") ? currentRowIndex - 1 : currentRowIndex + 1;
                        data.splice(emptyRowIndex, 0, []);
                    }
                    else if (key === "remove_row") {
                        //data.splice(currentRowIndex, 1);
                    }
                    $scope.field.bindExcelData(data);
                }
            };
            var setter = false;

            window.setInterval(function(){
            setter = false;
            }, 3000);

            if (columns) {
                updatedSettings["beforeChange"] = function (data,source) {
                    console.log("aaa beforeChange 1=", data,source);
                };
                updatedSettings["afterChange"] = function (data,source) {
                    console.log("aaa onAfterChange 1 =",data,source);
                    
                    if (data !== null) {
                        if ($scope.parentForm.functionalService.selectAllCheckBoxHandler) {
                            if ($(".htCheckboxRendererInput").length === $(".htCheckboxRendererInput:checked").length) {
                                $scope.parentForm.functionalService.selectAllCheckBoxHandler(true);
                            }
                            else {
                                $scope.parentForm.functionalService.selectAllCheckBoxHandler(false);
                            }
                        }
                        if ($scope.parentForm.functionalService.dropDownChangeEvent) {
                            $scope.parentForm.functionalService.dropDownChangeEvent(hot, data);
                        }
                    }
                };
            }
            hot.updateSettings(updatedSettings);
            $scope.field.calculateExcelGridHeightSetting();
            if ($scope.parentForm.functionalService.applyFormatToSelectedRows) {
                $scope.parentForm.functionalService.applyFormatToSelectedRows();
            }
            
        };

        $scope.field.setEditableMode = function () {
            var hot = $scope.field.getExcelGridInstance();
            if (!hot) {
                console.log("rebindExcelData: looks like handson table container is not on DOM yet.");
                return;
            }
            hot.updateSettings({ "readOnly": false });
        };

        $scope.field.manualRowHeightSetting = function () {
            var hot = $scope.field.getExcelGridInstance();
            var data = hot.getSettings().data;
            var rowHeight = [];
            for (var i = 0; i < data.length; i++) {
                rowHeight[i] = 10;
            }
            hot.updateSettings({ "rowHeights": rowHeight });            
        };
        //Temporary Fix
        $scope.field.manualColumnWidthSetting = function () {
            var hot = $scope.field.getExcelGridInstance();
            var columnHeaders = hot.getColHeader();
            if (!hot) {
                console.log("rebindExcelData: looks like handson table container is not on DOM yet.");
                return;
            }
            var colWidths = [];
            angular.forEach(columnHeaders, function (data, colIndex) {
                if (colIndex === 0 || colIndex === 1 || colIndex === 2) {
                    colWidths[colIndex] = 0.001;
                }
                else if (colIndex === 3) {
                    colWidths[colIndex] = 30;
                }
                else if (colIndex === 4) {
                    colWidths[colIndex] = 150;
                }
                else if (colIndex === 5 || colIndex === 6) {
                    colWidths[colIndex] = 280;
                }
                else {
                    if (data === "Begin Date" || data === "End Date") {
                        colWidths[colIndex] = 120;
                    }
                    else {
                        colWidths[colIndex] = 100;
                    }
                }
            });

            hot.updateSettings({ "colWidths": colWidths });

        };

        $scope.field.calculateExcelGridHeightSetting = function () {
            var hot = $scope.field.getExcelGridInstance();
            var data = hot.getSettings().data;
            var height = 80 + data.length * 20;
            if (height > 700) {
                height = 700;
            }
            else {
                height = 300;
            }
            //$scope.field.manualRowHeightSetting();
            //$(".ht_master").find(".wtHider")[0].style.height = "" + height.toString() + "px";
            hot.updateSettings({ height: height });
        };

        $scope.field.hideColumns = function (hiddenColumnIndexes) {
            var hot = $scope.field.getExcelGridInstance();
            if (!hot) {
                console.log("rebindExcelData: looks like handson table container is not on DOM yet.");
                return;
            }
            var colWidths = [];
            angular.forEach(hiddenColumnIndexes, function (colIndex, index) {
                colWidths[colIndex] = 0.1;
            });

            hot.updateSettings({ "colWidths": colWidths });
        };

        $scope.field.bindExcelData = function (dataSource) {
            var hot = $scope.field.getExcelGridInstance();
            if (!hot) {
                console.log("rebindExcelData: looks like handson table container is not on DOM yet.");
                return;
            }
            hot.updateSettings({ data: dataSource });
            $scope.field.calculateExcelGridHeightSetting(); 
            if ($scope.parentForm.functionalService.applyFormatToSelectedRows) {
                $scope.parentForm.functionalService.applyFormatToSelectedRows();
            }    
            console.log(hot);
        };

        var getColumnsFromDefinition = function (columnDefinition) {
            var hotColumnToFieldDefMap = {
                "data": "modelKey", "title": "title", "type": "type", "format": "format", "pattern": "pattern",
                "checkedTemplate": "checkedTemplate",
                "uncheckedTemplate": "uncheckedTemplate", "source": "source", "allowInvalid": "allowInvalid",
                "dateFormat": "dateFormat", "correctFormat": "correctFormat",
                "defaultDate": "defaultDate", "allowEmpty": "allowEmpty",
                "numericFormat": {
                    "pattern": "pattern", "culture": "culture"
                }
            };
            columnDefinition = columnDefinition || $scope.field.columns;
            return modelUtilService.buildTargetFromMetaMap(hotColumnToFieldDefMap, columnDefinition);
        };


        var getRootLevelSettingFromDefinition = function (settingDefinition) {
            var hotsettingToDefinitionMap = {
                "stretchH": "stretchH", "width": "width", "autoWrapRow": "autoWrapRow", "height": "height"
                , "maxRows": "maxRows", "rowHeaders": "rowHeaders", "manualRowMove": "manualRowMove",
                "manualColumnMove": "manualColumnMove", "contextMenu": "contextMenu", "minSpareRows": "minSpareRows"
                , "columnSorting": "columnSorting", "renderAllRows": "renderAllRows", "startRows": "startRows",
                "startCols": "startCols", "outsideClickDeselects": "outsideClickDeselects", "autoRowSize": "autoRowSize"
                , "manualColumnResize": "manualColumnResize", "manualRowResize": "manualRowResize", "dropdownMenu": "dropdownMenu"
                , "filters": "filters", "colWidths": "colWidths", "fixedColumnsLeft": "fixedColumnsLeft", "manualColumnFreeze": "manualColumnFreeze"
                , "hiddenColumns": "hiddenColumns", "autoColumnSize": "autoColumnSize"
            };
            settingDefinition = settingDefinition || $scope.field.setting;
            return modelUtilService.buildTargetFromMetaMap(hotsettingToDefinitionMap, settingDefinition, true);
        };

        $scope.field.rebuildColumns = function (columnDefinition, appendColumns, columnHeaders) {
            console.log("columnDefinition, appendColumns,columnHeaders", columnDefinition, appendColumns, columnHeaders);
            var hot = $scope.field.getExcelGridInstance();
            if (!hot) {
                console.log("rebindExcelData: looks like handson table container is not on DOM yet.");
                return;
            }
            var columns = getColumnsFromDefinition(columnDefinition);

            var colHeaders = columnHeaders;
            if (appendColumns) {
                var existingColumns = hot.getSettings().columns;
                columns = existingColumns.concat(columns);
            }
            var dataSchema = $scope.field["dataSchema"];
            if (columnHeaders) {
                hot.updateSettings({ columns: columns, colHeaders: colHeaders, dataSchema: dataSchema });
            } else {
                hot.updateSettings({ columns: columns, dataSchema: dataSchema });
            }
            var container = $("#" + $scope.field.modelKey);
            $(document).on('mouseup', 'input.selectall', function (event) {

                var excelData = $scope.field.getExcelData();
                var current = !$('input.checker').is(':checked'); //returns boolean
                for (var i = 0, ilen = excelData.length; i < ilen; i++) {
                    excelData[i].active = current;
                }
                // container.handsontable('render');
            });


        };

        $scope.field.setColumnSources = function (columnSources) {
            $scope.field.rebindExcelData(columnSources);
        };

        $scope.field.setColumnSource = function (columnIndex, columnSource) {
            var columnSources = [];
            columnSources[columnIndex] = columnSource;
            $scope.field.rebindExcelData(columnSources);
        };

        init();
        //Generate Grid
        $scope.$on("$destroy", function () {
            // $scope.field.gridOptions = {};
        });

    });

    return angularAMD;
});
