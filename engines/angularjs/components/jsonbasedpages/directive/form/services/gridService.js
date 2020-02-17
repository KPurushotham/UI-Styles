define(['angularAMD', 'httpService'], function (angularAMD) {
    'use strict';

    angularAMD.service('gridService', function ($rootScope, $q, $timeout, $location, httpService, uiGridConstants, gridColumnMapping, gridDefaultFeatures, gridFeaturesMapping, constants, Notification, overlay, dateUtilService) {
        var self = this;
        this.SUPPORTED_GRID_FEATURES = ["edit", "selection", "pagination", "row-edit"];

        this.defaultGridOptions = {
            paginationPageSizes: [25, 50, 75],
            paginationPageSize: 15,
            rowHeight: 37,
            useExternalPagination: false,
            useExternalSorting: false,
            enableGridMenu: false,
            enableFiltering: true,
            useExternalFiltering: false,
            autoResize: true,
            rowTemplate: "<div ng-dblclick=\"grid.appScope.rowDblClick(row)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader }\" ui-grid-cell dbl-click-row></div>",
        };

        this.isSupportedGridFeatures = function (feature) {
            return self.SUPPORTED_GRID_FEATURES.indexOf(feature) >= 0;
        };

        this.buildAndOverwriteDefaultOptions = function (gridParams) {
            var currentFieldGridOptions = {};
            var colInfo = self.buildColumnMap(gridParams.columns);
            currentFieldGridOptions["columnDefs"] = colInfo;

            var gridFeatures = gridParams["gridFeatures"];
            if (gridFeatures && gridFeatures.indexOf("selection") >= 0) {
                currentFieldGridOptions["enableRowSelection"] = true;
                currentFieldGridOptions["multiSelect"] = gridParams["multiSelect"] || false;
            }

            for (var optionKey in self.defaultGridOptions) {
                if (gridParams[optionKey] !== undefined) {
                    currentFieldGridOptions[optionKey] = gridParams[optionKey];
                }
            }

            return currentFieldGridOptions;
        };
        this.buildEmptyRecord = function (columnsDef) {
            if (columnsDef === undefined || columnsDef === null || columnsDef.length === 0) {
                return null;
            }
            var emptyRow = {};
            for (var i = 0; i < columnsDef.length; i++) {
                var column = columnsDef[i];
                emptyRow[column["key"]] = "";
            }

            return emptyRow;
        };

        this.buildColumnMap = function (columnsDef, parentForm) {
            console.log("444 buildColumnMap");
            if (columnsDef === undefined || columnsDef === null || columnsDef.length === 0) {
                return null;
            }
            var gridColumns = [];
            var functionalService = parentForm.functionalService;
            angular.forEach(columnsDef, function (column, key) {
                //console.log("column ", column);
                var gridColumn = {};

                angular.forEach(column, function (columPropValue, columProp) {
                    console.log("444 column prop", column, columProp);
                    // console.log("actionType=",self.getMappedColumnName(columProp));
                    switch (self.getMappedColumnName(columProp)) {
                        case "actionType":

                            //console.log("functionalService=",functionalService);
                            gridColumn['cellRenderer'] = function (params) {
                                if (functionalService.customActionColumn) {
                                    return functionalService.customActionColumn(column, columPropValue, params);
                                } else {
                                    //console.log("params cellRenderer", params);
                                    var handlerName = column["handlerName"];
                                    var value = params.value || "";
                                    var actionElement = '';
                                    console.log("20190417-actionToggle=", column["actionToggle"]);
                                    console.log("20190417-actionToggleField=", column["actionToggleField"]);
                                    console.log("20190417-params=", params);

                                    if (params.data[column["actionModeField"]] === "") {
                                        actionElement = '<a data-handlerName="' + handlerName + '" data-action-type="' + columPropValue + '" class="' + column["actionIconClass"] + value + '"></a>';
                                    }
                                    else {
                                        if (column["actionToggle"] !== null && column["actionToggle"] !== undefined) {
                                            var dValue = params.data[column["actionToggleField"]];
                                            var conditions = column["actionToggle"][dValue];
                                            console.log("20190417-actionToggleClass=", conditions);
                                            actionElement = '<a data-handlerName="' + handlerName + '" data-action-type="' + columPropValue + '" class="' + conditions + value + '"></a>';
                                        } else {
                                            actionElement = '<a data-handlerName="' + handlerName + '" data-action-type="' + columPropValue + '" class="' + column["actionIconClass"] + value + '"></a>';
                                        }
                                    }
                                    return actionElement;
                                }
                            };
                            break;
                        case "multiActions":
                            //console.log("multiActions columPropValue=",columPropValue);

                            gridColumn['cellRenderer'] = function (params) {
                                var actionElement1 = '';
                                var value = params.value || "";

                                console.log("multiActions columPropValue=", params.node.group);

                                angular.forEach(columPropValue, function (actionColVal, actionColKey) {
                                    //console.log("multiActions actionColKey=",actionColVal,actionColKey);
                                    var skipInGroupColumn = actionColVal["skipInGroupColumn"] && params.node.group;
                                    if (!skipInGroupColumn) {
                                        actionElement1 += '<a title= "' + actionColVal["title"] + '" data-title= "' + actionColVal["title"] + '" data-handlerName="' + actionColVal["handlerName"] + '" data-action-type="' + actionColVal["actionType"] + '" class="' + actionColVal["actionIconClass"] + value + '"></a>&nbsp;&nbsp;&nbsp;';
                                    }
                                });
                                return actionElement1;
                            };
                            break;

                        case "toggleType":
                            gridColumn['cellRenderer'] = function (params) {
                                console.log("111111...");
                                var handlerName = column["handlerName"];
                                var value = params.value === undefined ? "" : params.value;
                                //var value = (params.value === undefined ? "" : params.value).trim().toLowerCase();
                                var actionElement = '';
                                var actionValue;
                                if (value) {
                                    actionValue = column["actionToggle"][value];
                                }
                                else {
                                    actionValue = column["actionToggle"][value];
                                }
                                actionElement = '<a data-handlerName="' + handlerName + '" data-action-type="' + columPropValue + '" class="' + actionValue + '"></a>';
                                return actionElement;
                            };
                            break;
                        case "formatType":

                            gridColumn['cellRenderer'] = function (params) {
                                var fieldValue = params.value;
                                var fType = column["formatType"] || "";
                                console.log(" 444 formatType =", fType);
                                switch (fType) {
                                    case "JSON":
                                        console.log(" 444 hi", fieldValue);
                                        fieldValue = fieldValue || "";
                                        fieldValue = "<span title='" + JSON.stringify(fieldValue) + "' >" + JSON.stringify(fieldValue) + "</span>";
                                        break;
                                    case "Date":
                                        if (fieldValue) {
                                            if (fieldValue.toString().split('/').length > 1) {
                                                fieldValue = dateUtilService.convertFromDBFormat(moment(fieldValue));
                                            }
                                            else {
                                                fieldValue = dateUtilService.convertToDateFormat(moment(fieldValue));
                                            }
                                        }
                                        break;
                                    case "DateTime":
                                        if (fieldValue) {
                                            if (fieldValue.toString().split('/').length > 1) {
                                                fieldValue = dateUtilService.convertFromDBFormat(moment(fieldValue));
                                            }
                                            else {
                                                fieldValue = dateUtilService.convertToDateTimeFormat(moment(fieldValue));
                                            }
                                        }
                                        break;
                                    case "Money":
                                        fieldValue = fieldValue || "";
                                        if (angular.isNumber(fieldValue)) {
                                            fieldValue = formatMoney(fieldValue.toFixed(2));
                                        }
                                        console.log("formatMoney=", fieldValue);
                                        break;
                                    default:
                                        break;
                                }
                                return fieldValue;
                            };
                            gridColumn['valueFormatter'] = function (params) {
                                var fType = column["formatType"] || "";
                                var fieldValue = params.value || "";
                                console.log(" 444 formatType =", fType);
                                console.log(" 444 valueFormatter", fieldValue);
                                switch (fType) {
                                    case "Date":
                                        if (fieldValue) {
                                            if (fieldValue.toString().split('/').length > 1) {
                                                fieldValue = dateUtilService.convertStringToDateFormat(moment(fieldValue));
                                            }
                                            else {
                                                fieldValue = dateUtilService.convertToDateFormat(moment(fieldValue));
                                            }
                                        }
                                        break;
                                    case "JSON":
                                        //fieldValue = fieldValue || "";
                                        //return  JSON.stringify(fieldValue) ;
                                        break;
                                    case "Money":
                                        fieldValue = fieldValue || "";
                                        if (angular.isNumber(fieldValue)) {
                                            fieldValue = formatMoney(fieldValue.toFixed(2));
                                        }
                                        console.log("formatMoney=", fieldValue);
                                        //return  JSON.stringify(fieldValue) ;
                                        break;
                                    default:
                                        break;
                                }
                                return fieldValue;
                            };
                            break;
                        case "isdatesort":
                            if (column["isdatesort"]) {
                                gridColumn["comparator"] = function (date1, date2) {
                                    var monthToComparableNumber = function (date) {
                                        if (date === undefined || date === null || date.length !== 10) {
                                            return null;
                                        }

                                        var yearNumber = date.substring(6, 10);
                                        var monthNumber = date.substring(3, 5);
                                        var dayNumber = date.substring(0, 2);

                                        var result = (yearNumber * 10000) + (dayNumber * 100) + monthNumber;
                                        return result;
                                    };
                                    var date1Number = monthToComparableNumber(date1);
                                    var date2Number = monthToComparableNumber(date2);

                                    if (date1Number === null && date2Number === null) {
                                        return 0;
                                    }
                                    if (date1Number === null) {
                                        return -1;
                                    }
                                    if (date2Number === null) {
                                        return 1;
                                    }

                                    return date1Number - date2Number;
                                }
                            }

                            break;
                        default:
                            gridColumn[self.getMappedColumnName(columProp)] = columPropValue;
                            break;
                    }

                });
                gridColumn.suppressRemoveSort = true;

                gridColumns.push(gridColumn);
                console.log("gridColumns=", gridColumns);

            });
            return gridColumns;//columnsDef;// gridColumns;
        };

        this.moneyFormatter = function (params) {
            // console.log("***moneyFormatter****",params)
            if (angular.isObject(params)) {

                var fieldValue = params.value;

                if (fieldValue !== "" && fieldValue !== undefined) {
                    fieldValue = fieldValue || "0.00";
                    if (angular.isNumber(fieldValue)) {
                        fieldValue = self.formatMoney(fieldValue.toFixed(2));
                    }
                    if (params.colDef.currency === "$") {
                        fieldValue = "$" + fieldValue;
                        //console.log("currency value ", fieldValue);
                        return fieldValue;
                    }
                    else {
                        //console.log("Noncurrency value ", fieldValue);
                        return fieldValue;
                    }
                } else {
                    return "";
                }
            }
            else {
                var value = self.formatMoney(params.toFixed(2));
                value = "$" + value;
                return value;
            }

        };

        this.pivotColumnComparator = function (a, b, c) {
            console.log("pivotColumnComparator=", a, b, this);
        };

        this.datesorter =  function (date1, date2) {
            console.log("444 datesorter=", date1, date2, this);
            var monthToComparableNumber = function (date) {
                if (date === undefined || date === null || date.length !== 10) {
                    return null;
                }

                var yearNumber = date.substring(6, 10);
                var monthNumber = date.substring(3, 5);
                var dayNumber = date.substring(0, 2);

                var result = (yearNumber * 10000) + (dayNumber * 100) +  monthNumber;
                return result;
            };
            var date1Number = monthToComparableNumber(date1);
            var date2Number = monthToComparableNumber(date2);

            if (date1Number === null && date2Number === null) {
                return 0;
            }
            if (date1Number === null) {
                return -1;
            }
            if (date2Number === null) {
                return 1;
            }

            return date1Number - date2Number;
        };


        this.numberFormatter = function (params) {
            var fieldValue = params.value;
            if (fieldValue !== "" && fieldValue !== undefined) {
                fieldValue = (fieldValue) ? fieldValue.toString() : "";
                if (fieldValue !== 0) {
                    if (fieldValue.includes(",")) {
                        fieldValue = fieldValue.replace(",", "");
                    }
                    fieldValue = parseInt(fieldValue);
                }
                return fieldValue;
            }
            else {
                return "";
            }
        };

        this.setFormatter = function (formatType, colDef) {
            if (formatType.toUpperCase() === "MONEY") {
                return self.moneyFormatter;

            }
            else if (formatType.toUpperCase() === "NUMBER") {
                return self.numberFormatter;
            }
        };

        this.decimalPlaceFormatter = function (params) {
            var decimalPlaces = params.colDef.decimalPlaces;
            var roundTo = decimalPlaces.match(/(\d+)/)[0];
            var fieldValue = params.value;
            if (fieldValue !== "" && fieldValue !== undefined) {
                return fieldValue.toFixed(parseInt(roundTo));
            }
            else {
                return "";
            }

        };

        this.setDecimalPlaces = function (formatType) {
            if (formatType) {
                return self.decimalPlaceFormatter;
            }
        };

        this.runBussinessRules = function (params) {

            var operation = params.colDef["operation"];

            var val = params.data[params.colDef.field] || 0;
            console.log("Params list ", val, angular.isNumber(val));
            switch (operation) {
                case "+":
                    val = 0;
                    angular.forEach(params.colDef.aggColumns, function (pval) {
                        var lVal = parseFloat(params.data[pval]) || 0;
                        val += lVal;
                        console.log("params 2", lVal, val);
                    });

                    break;
                case "-":
                    val = 0;
                    angular.forEach(params.colDef.aggColumns, function (pval) {
                        var lVal = parseFloat(params.data[pval]) || 0;
                        val += lVal;
                    });
                    break;
                default:
                    val = params.data[params.colDef.field];
                    break;
            }
            if ((parseFloat(val) && angular.isNumber(val)) || val === 0) {
                //val = val.tofixed(2);
                val = self.formatMoney(val);
                val = val === 0 ? "0.00" : val;
            }

            console.log("666 params 2", angular.isString(val), val);
            return val;
        };

        this.formatMoney = function (n, c, d, t) {
            var s = "", j, i = "";
            c = isNaN(c = Math.abs(c)) ? 2 : c,
                d = d === undefined ? "." : d,
                t = t === undefined ? "," : t,
                s = n < 0 ? "-" : "",
                i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
                j = (j = i.length) > 3 ? j % 3 : 0;

            return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
        };

        this.setEditableSetting = function (gridColumn, column) {
            if (!angular.isUndefined(column["edittype"]) && column["edittype"] === "dropdown") {
                gridColumn["editableCellTemplate"] = 'BootstrapSelect.html';

                var columnDataConfig = column["dataConfig"];
                var displayKey;
                var valueKey;

                if (!angular.isUndefined(columnDataConfig)) {
                    displayKey = columnDataConfig["displayKey"];
                    valueKey = columnDataConfig["valueKey"];

                    if (!angular.isUndefined(columnDataConfig["localData"])) {
                        gridColumn["editDropdownOptionsArray"] = columnDataConfig["localData"];
                    }
                }
                gridColumn["editDropdownValueLabel"] = displayKey || "text";
                gridColumn["editDropdownIdLabel"] = valueKey || "value";
                // gridColumn["editModelField"] = column["key"];

            }
        };

        this.getGridPageData = function (gridParams, currentPage, pageSize, sortOrder, sortColumn, filterParams) {
            var def = $q.defer();

            var paginationCriteria;
            var gridFeatures = gridParams["gridFeatures"];
            if (gridFeatures && gridFeatures.indexOf("pagination") >= 0) {
                var startIndex = ((currentPage - 1) * pageSize) || 1;
                pageSize = pageSize || this.defaultGridOptions.paginationPageSize;
                sortOrder = (sortOrder === uiGridConstants.ASC) ? "asc" : "desc";
                sortColumn = sortColumn || gridParams.defaultSortColumn;

                paginationCriteria = { "si": startIndex, "ps": pageSize, "so": sortOrder, "sc": sortColumn };
            }
            var gridUrls = buildGridUrls(gridParams, paginationCriteria, filterParams);
            var dataUrl = gridUrls.dataUrl;
            if (dataUrl) {
                def.resolve();
            }
            return httpService.get(dataUrl)
                .then(function (results) {
                    if (results === undefined) {
                        Notification.error({ message: 'URL<br/>' + constants.api_url + url, title: 'CODE ERROR - ' + results.code, delay: 5000 });
                        overlay.hide();
                    } else {
                        overlay.hide();
                        def.resolve(results);
                    }
                });
            return def.promise;
        };

        var buildGridUrls = function (gridParams, paginationCriteria, filterParams) {
            var dataUrl = gridParams.gridDataUrl || gridParams.dataUrl || "";
            var pdfUrl = gridParams.gridPdfUrl || gridParams.pdfUrl || "";

            dataUrl = self.buildUrlWithPaginationParams(dataUrl, paginationCriteria, filterParams, gridParams["additionalQSParams"], false);
            pdfUrl = self.buildUrlWithPaginationParams(pdfUrl, paginationCriteria, filterParams, gridParams["additionalQSParams"], false);

            return { "dataUrl": dataUrl, "pdfUrl": pdfUrl };
        };

        this.buildUrlWithPaginationParams = function (url, paginationCriteria, filterParams, additionalQSParams, isForfullData) {
            var urlpath = $location.path();
            var notificationParams = '';
            if (urlpath.indexOf("/app/thingstodo/") > 0) {
                notificationParams = "&append=notification";
            }
            var paginationParams = '';
            if (paginationCriteria) {
                var paramPairs = [];
                for (var key in paginationCriteria) {
                    if (!isForfullData || (isForfullData && ["si", "ps"].indexOf(key) < 0)) {
                        paramPairs.push(key + "=" + paginationCriteria[key]);
                    }
                }
                paginationParams = paramPairs.join("&");
            }

            if (url.indexOf("?") === -1) {
                url = url + "?";
            }
            else {
                url = url + "&";
            }

            url = url + paginationParams + notificationParams;
            if (filterParams) {
                if (!angular.isString(filterParams)) {

                    var filterParamsPairs = [];
                    for (var key in filterParams) {
                        var valueObj = filterParams[key];
                        var value;
                        if (!angular.isString(valueObj)) {
                            value = valueObj;
                        }
                        else {
                            value = valueObj;
                        }
                        filterParamsPairs.push(key + "=" + value);
                    }
                    filterParams = filterParamsPairs.join("&");
                }
                if (!filterParams.startsWith("&")) {
                    filterParams = "&" + filterParams;
                }
                url = url + filterParams;
            }
            if (additionalQSParams) {
                if (!additionalQSParams.startsWith("&")) {
                    additionalQSParams = "&" + additionalQSParams;
                }
                url = url + additionalQSParams;
            }

            return url;
        };

        this.getMappedColumnName = function (key) {
            var val = "";
            if (gridColumnMapping[key] !== "" && gridColumnMapping[key] !== undefined) {
                val = gridColumnMapping[key];
            } else {
                val = key;
            }
            return val;
        };

        this.getMappedGridFeatures = function (key) {
            var val = "";
            if (gridFeaturesMapping[key] !== "" && gridFeaturesMapping[key] !== undefined) {
                val = gridFeaturesMapping[key];
            } else {
                val = key;
            }
            return val;
        };
        this.hideOverlay = function () {
            overlay.hide();
        };

        this.buildGridFeatures = function (gridCurFeatures) {
            var gFeatures = {};
            if (gridCurFeatures === undefined || gridCurFeatures === null || gridCurFeatures.length == 0) {
                gFeatures = gridDefaultFeatures;
            } else {
                gFeatures = {};

                angular.forEach(gridCurFeatures, function (value, key) {
                    gFeatures[self.getMappedGridFeatures(key)] = value;
                    if (key === "detailCellRendererParams") {
                        gFeatures[key]["getDetailRowData"] = function (params) {
                            overlay.load();
                            var inputParams = self.buildParams(gFeatures[key]["getDetailRowDataParams"], params.data);
                            self.getDetailsInfoData(gFeatures[key]["getDetailRowDataUrl"], inputParams)
                                .then(function (res) {
                                    params.successCallback(res);
                                    overlay.hide();
                                });

                        };

                    }

                });
                gFeatures = angular.merge(gridDefaultFeatures, gFeatures);


            }
            console.log("gridFeatures gridCurFeatures=", gridCurFeatures);
            console.log("gridFeatures =", gFeatures);
            return gFeatures;
        };

        this.buildParams = function (params, data) {
            var param = {};
            angular.forEach(params, function (v, i) {
                console.log("v,i=", v, i);
                param[v] = data[v];
            });
            return param;
        };

        this.getDetailsInfoData = function (url, params) {
            var defer = $q.defer();
            httpService.post(url, params).then(function (res) {
                defer.resolve(res.data.dataset);
            });
            return defer.promise;
        };

        this.getGridData = function (gridApi, columns) {
            var rowData = [];
            console.log("self.gridConfig.columns =", columns);
            gridApi.forEachNode(function (node) {
                rowData.push(self.convertFromDBFormat(node.data, columns));
            });
            console.log("rowData 11", rowData);
            return rowData;
        };

        this.convertFromDBFormat = function (data, columns) {
            angular.forEach(data, function (dataColumnValue, colName) {
                angular.forEach(columns, function (key, val) {
                    var formatType = key["formatType"];
                    if (key["field"] === colName) {
                        if (formatType && formatType === "Date") {
                            data[colName] = dateUtilService.convertFromDBFormat(dataColumnValue) || dateUtilService.convertToDateTimeFormat(viewModelValue);
                        }
                    }

                });
            });
            console.log(data);
            return data;
        };


        //this.
    });

    return angularAMD;
});