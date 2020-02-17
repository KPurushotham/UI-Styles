define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions', 'localPersistenceService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('reportService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, $interval, alasql, localPersistenceService,overlay, $sce) {

        function reportService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;          

            this.buildPayLoad = function (sections) {
               
                var fullPayload = {
                    "@toteProviderId": null,
                    "@accountId": null,
                    "@clientAccountId": null
                };
                var viewPayLoad = [];

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

                                var modelKey = field["fieldKey"];
                                var viewField = {};
                                var fieldKey;
                                viewField["title"] = field["title"] || "";

                                switch (field.fieldType) {
                                    case "dropdown":
                                        fieldKey = "@" + field.fieldKey;
                                        fullPayload[fieldKey] = field.modelValue;
                                        viewField["modelValue"] = field.modelValue;
                                        viewPayLoad.push(viewField);
                                        break;

                                    case "daterange":
                                        var period = field.getModel();
                                        var beginDate = period.beginDate;
                                        var endDate = period.endDate;
                                        console.log("daterangeField", field);
                                        if (period) {                                          
                                            fullPayload["@startDate"] = beginDate;
                                            fullPayload["@endDate"] = endDate;
                                        }
                                        viewField["modelValue"] = beginDate + " - " + endDate;
                                        viewPayLoad.push(viewField);
                                        break;
                                    default:
                                        break;
                                }

                            });
                        });
                    });
                });

                return {
                    viewPayLoad: viewPayLoad,
                    fullPayload: fullPayload                    
                };
            };
          
            this.toSubmit = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event, selectedItem) {

                var sections = parentForm.sections;
                var payloadData = this.buildPayLoad(sections);  
                var viewPayLoad = payloadData.viewPayLoad;
                var fullPayload = payloadData.fullPayload;
              
                $(".search-criteria-editmode").hide();
                $(".report-grid").show();                    
                var reportCode = parentForm["reportCode"];
                var exportPayload = buildPayloadWithCriteria(fullPayload, reportCode);
                console.log("Export payload ", exportPayload);

                localPersistenceService.set("exportPayload", JSON.stringify(exportPayload), true);                

                localPersistenceService.set("fullPayload", JSON.stringify(fullPayload), true);

                buildSearchDetailSection(viewPayLoad, parentForm);
                        
                var grid = getFieldByModelKey(parentForm.sections, "reportGrid");
                var footerGrid = getFieldByModelKey(parentForm.sections, "reportFooterGrid");
               
                grid.gridOptions.api.setRowData([]);
                grid.gridOptions.api.resetRowHeights();
                grid.gridOptions.api.showLoadingOverlay();

                grid.gridOptions.rowClass = "ag-grid-row-style";

                makeServiceCallForGettingJsonResult(exportPayload, reportCode).then(function (res) {
                    if (res) {
                        grid.gridOptions["rowClassRules"]= {
                            'bold-row': function(params) {
                                var res = false;
                               var res =  getRowClassRules(params.data);
                              return res;
                            } 
                        }
                        bindReportGrid(parentForm, res, grid, footerGrid);
                    }
                    grid.gridOptions.api.hideOverlay();
                   
                });
                
            };      
            var getRowClassRules = function(data,columnvalue){
                var res =false;
                angular.forEach(data,function(v,i){
                    if(data[i]){
                        if(data[i].toString().indexOf("Total")>=0){
                            res = true;
                        } 
                    }
                })
                return res;
            }    

            var buildPayloadWithCriteria = function (fullPayload,reportCode) {

                var modelData = {};
                modelData["applicationId"] =1013;
                modelData["reportCode"] = reportCode;
                modelData["additionalModelData"] = {};
                modelData["pageOrientation"] ="4l",
                modelData["additionalServiceCriteria"] = fullPayload;
                console.log("Model Data ", modelData);
                if(reportCode==="BUILD_DAILY_BALANCE") {
                    modelData.additionalModelData.masterBalance = {
                        "master": "GWG",
                        "accountBalances": "99",
                        "date": fullPayload["@startDate"] + "-" + fullPayload["@endDate"]
                    };
                }
                else if(reportCode==="BETSCOUNT_REPORT") {
                    modelData.additionalModelData = {
                        "sheetName": "Bets Count Report"
                    };
                }
                else if(reportCode==="UK_TOTEPOOL_ACCOUNT") {
                    modelData.additionalModelData = {
                        "reportName": {
                            "date": fullPayload["@startDate"] + " To " + fullPayload["@endDate"],
                            "master": "GAPP Account Report",
                            "reportFormat": "G-APP-FRA-GWG-H-01 Account Report"
                        },

                        "sheetName": "Player Report"
                    };      
                             
                }
                else if(reportCode==="BUILD_SETTLEMENT") {
                    modelData.additionalModelData = {
                        "sheetMap": {
                            "sheet1": "UK_totepool",
                            "sheet2": "PF_Tote_Processing"
                        },
                        "reportName": {
                            "date": fullPayload["@startDate"] + " To " + fullPayload["@endDate"]
                        }

                    };
                }
                else if(reportCode==="MANAGEMENT_SUMMARY"){
                    modelData.additionalModelData = {
                        "sheetMap": {
                            "sheet1": "GWG Management Summary"
                        },
                        "reportName": {
                            "date": "GWG Management Summary " + fullPayload["@startDate"] + " To " + fullPayload["@endDate"],
                        },
                        "sheetName": "GWG Management Summary"

                    };
                      
                }
                return modelData;

            };            

            var makeServiceCallForGettingJsonResult = function (payload, reportCode) {

                var url = "report/run/json/1013/"+ reportCode;
                var defer = $q.defer();
                httpService.post(url, payload).then(function (result) {
                    defer.resolve(result);
                });
                return defer.promise;
            };

            var bindReportGrid = function (parentForm, resultData, grid, footerGrid) {

                if (resultData) {
                    var dataHeaderList = resultData.data.datasets["dataHeader"][0] || [];

                    var dataHeaders = dataHeaderList;
                    dataHeaders = dataHeaderList["this"]["attributeMap"];
                    var dataSetCode = dataHeaderList["this"]["dataCode"];
                    var resultDataList = resultData.data.datasets[dataSetCode] || [];

                    //Setting column header for grid
                    grid.gridOptions.columnDefs = [];
                    var columnDefs = grid.gridOptions.columnDefs;

                    //var dataHeaders = dataHeaderList;

                    columnDefs = bindGridColumns(dataHeaders, columnDefs, grid);

                    grid.gridOptions.api.setColumnDefs(columnDefs);

                    grid.gridOptions.api.setRowData([]);
                        
                    if (resultDataList.length > 0) {
                        grid.gridOptions.api.sizeColumnsToFit();
                        grid.gridOptions.api.setRowData(resultDataList);
                        var vheight = (resultDataList.length * 25) + 53;
                        var height = (vheight > 470) ? 470 : vheight;
                        $(".report-grid-field").css("height", height.toString() + "px");
                    } else {
                        grid.gridOptions.api.showNoRowsOverlay();
                    }
                }

            };

            var bindGridColumns = function (dataHeaderColumn, columnDefs, grid) {
                console.log("pivotColumnComparator grid", grid);
                angular.forEach(Object.getOwnPropertyNames(dataHeaderColumn), function (dataHeader) {
                    var colDef = {};
                    console.log("dataHeader=", dataHeader, dataHeaderColumn);
                    var dataHeaderDetails = dataHeaderColumn[dataHeader];    

                    if (dataHeaderDetails.alignment === "left") {
                        dataHeaderColumn[dataHeader]["cellClass"] = "ag-grid-cell-style-left";
                        dataHeaderColumn[dataHeader]["headerClass"] = "ag-grid-header-style-left";
                    }
                    else if (dataHeaderDetails.alignment === "right") {
                        dataHeaderColumn[dataHeader]["cellClass"] = "ag-grid-cell-style-right";
                        dataHeaderColumn[dataHeader]["headerClass"] = "ag-grid-header-style-right";
                    } 

                    if (angular.isObject(dataHeaderDetails)) {
                        //loop each property 
                        angular.forEach(Object.getOwnPropertyNames(dataHeaderDetails), function (header) {

                            var key = gridService.getMappedColumnName(header);
                            colDef[key] = dataHeaderDetails[header];

                            if (key === "headerName") {
                                colDef["headerName"] =dataHeaderDetails.headerText;// "<div class=" + dataHeaderDetails.headerClass + ">" + dataHeaderDetails.headerText + "</div>";
                            }

                            if (key === "operation") {
                                colDef["valueGetter"] = gridService.runBussinessRules;
                            }

                            if (key === "enablePivot") {
                                colDef["pivot"] = true;
                                console.log("pivotColumnComparator grid 1", grid);
                                colDef["pivotComparator"] = function (a, b) {
                                    var requiredOrder = [];
                                    for (var i = 0; i < 100; i++) {
                                        requiredOrder.push(i.toString());
                                    }
                                    return requiredOrder.indexOf(a) - requiredOrder.indexOf(b);
                                };
                            }
                            if (key === "formatType") {
                                colDef["valueFormatter"] = gridService.setFormatter(dataHeaderDetails[header], dataHeaderDetails);
                            }

                            if (key === "decimalPlaces") {
                                colDef["valueFormatter"] = gridService.setDecimalPlaces(dataHeaderDetails[header]);
                            }

                        });
                        colDef["field"] = dataHeader;
                        columnDefs.push(colDef);

                    } else {
                        columnDefs.push({ field: dataHeader, headerName: dataHeaderColumn[dataHeader] });
                    }

                });

                return columnDefs;
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

                                if (field.fieldKey === modelKey) {//} "reportGrid") {
                                    mfield = field;
                                    return mfield;
                                }

                            });
                        });
                    });
                });
                return mfield;
            };

            var buildSearchDetailSection = function (viewPayLoad, parentForm) {

                var cSection = {};
                cSection.title = "Search Context";
                cSection.class = "search-details";
                cSection.cssClass = "search-details";
                cSection.rowDivisions = [];
                var j = 0;
                var rowsCount = viewPayLoad.length / 3;

                var rowDivision1 = {};
                rowDivision1.columns = [];
                var column1 = {};
                //column1.cssClass ="col-md-4"
                column1.fields = [];
                var bfield = {};
                bfield["fieldType"] = "hyperlink";
                bfield["title"] = "New Search";
                bfield["cssClass"] = "back2Search pull-right";
                bfield["href"] = "javascript:void(0)";
                bfield["eventName"] = "click";
                bfield["handlerName"] = "showSearchSection";
                bfield["innerHtml"] = "<i class=\"fa fa-arrow-left\" style=\"font-size: 11px !important;\" aria-hidden=\"true\"></i>";

                column1.fields.push(bfield);
                rowDivision1.columns.push(column1);
                cSection.rowDivisions.push(rowDivision1);

                for (var i = 0; i < rowsCount; i++) {
                    var rowDivision = {};
                    rowDivision.columns = [];
                    var startIndex = i === 0 ? 0 : i * 3;
                    for (var j = startIndex; j < viewPayLoad.length; j++) {
                        //angular.forEach(viewPayLoad,function(vfield){
                        if (startIndex + 3 > j) {
                            var column = {};
                            column.fields = [];
                            column.cssClass = "col-md-3 paddingleft0";
                            var field = {};
                            field["fieldType"] = "fieldlabel";
                            field["title"] = viewPayLoad[j]["title"];
                            field["cssClass"] = "col-md-12 paddingleft0";

                            if (viewPayLoad[j]["title"] === "Report Period") {
                                field["tooltip"] = viewPayLoad[j]["tooltip"];
                                var dateRange = viewPayLoad[j]["modelValue"];
                                var dates = dateRange.split(" - ");
                                var beginDate = dateUtilService.convertToDateFormat(moment(dates[0]));
                                var endDate = dateUtilService.convertToDateFormat(moment(dates[1]));
                                var resultDate = beginDate.concat(" - ", endDate);
                                //console.log("Final Date ", resultDate);
                                field["modelValue"] = resultDate;
                            }
                            else if (viewPayLoad[j]["title"] === "Begin Date") {
                                field["tooltip"] = viewPayLoad[j]["tooltip"];
                                var date = viewPayLoad[j]["modelValue"];
                                beginDate = dateUtilService.convertToDateFormat(moment(date));
                                field["modelValue"] = beginDate;
                            }
                            else {
                                field["tooltip"] = viewPayLoad[j]["tooltip"];
                                field["modelValue"] = viewPayLoad[j]["modelValue"];
                            }
                            //field["tooltip"] = viewPayLoad[j]["tooltip"];
                            //field["modelValue"] = viewPayLoad[j]["modelValue"];
                            column.fields.push(field);
                            rowDivision.columns.push(column);
                        }
                    }

                    cSection.rowDivisions.push(rowDivision);
                }
                console.log("55 cSection= ", cSection);
                var isNew = true;
                for (var k = 0; k < parentForm.sections.length; k++) {
                    if (parentForm.sections[k].class === "search-details") {
                        parentForm.sections[k] = cSection;
                        isNew = false;
                    }
                }
                if (isNew) {
                    parentForm.sections.splice(parentForm.sections.length - 1, 0, cSection);
                }
            };
                     
            this.toReset = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event, selectedItem, fullPayload, selectedData) {

                var sections = parentForm.sections;

                $(".nested-dropdown").removeClass("nested_error");

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

                                if (field.fieldType === 'daterange') {
                                    field.modelValue = field.modelValue;
                                    console.log("field.modelValue==", field.modelValue);
                                    //var start = moment()['_d'];
                                    //var end = moment()['_d'];
                                    var start = moment().subtract(1, 'day').toDate();
                                    var end = moment().subtract(1, 'day').toDate();
                                    var modelValue = {
                                        "startDate": start,
                                        "endDate": end
                                    };
                                    field.modelValue = modelValue;

                                }
                                else if (field.fieldType === 'date') {
                                    var beginDate = moment().subtract(1, 'day').toDate();
                                    field.modelValue = dateUtilService.convertToDateFormat(moment(beginDate));
                                }
                                else if (field.fieldType === 'dropdown') {

                                    if (field.defaultValue === undefined) {
                                        field.defaultselectedindex = field.defaultselectedindex;
                                    }
                                    else {
                                        field.modelValue = field.defaultValue;
                                        var selectedItems = field.getSelectedItem();
                                        if (selectedItems.length > 0) {
                                            field["SelectedText"] = field.getSelectedItem()[0].text;
                                        }                                       
                                       
                                    }
                                }
                                else if (field.fieldType === 'nesteddrop') {
                                    field.modelValue = field.setDefaultValue();
                                }
                                else {
                                    console.log("Else Field=", field);
                                }
                                console.log("resetField=", field);

                            });
                        });
                    });
                });
            };

            this.showSearchSection = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event, selectedItem) {

                $(".search-criteria-editmode").show();
                $(".search-details").hide();
                $(".report-grid").hide();

            };

            this.exportToExcel = function (sourceField, parentForm) {
                var grid = getFieldByModelKey(parentForm.sections, "reportGrid");
                if (grid.gridOptions.api.getDisplayedRowCount() > 0) {
                    var reportCode = parentForm["reportCode"];
                    var payload = localPersistenceService.get("exportPayload", true);
                    if (payload && payload !== "") {
                        var url = "report/run/xlsx/1013/" + reportCode;
                        overlay.load();
                        httpService.openFileByPost(url, payload, "excel", reportCode + ".xlsx").then(function (results) {
                            console.log("file downloaded=", results);
                            overlay.hide();
                        });
                        // return defer.promise;
                    }
                }

            };

            this.exportToPDF = function (sourceField, parentForm) {
                var grid = getFieldByModelKey(parentForm.sections, "reportGrid");
                if (grid.gridOptions.api.getDisplayedRowCount() > 0) {
                    var reportCode = parentForm["reportCode"];
                    var payload = localPersistenceService.get("exportPayload", true);
                    if (payload && payload !== "") {
                        var url = "report/run/pdf/1013/" + reportCode;
                        overlay.load();
                        httpService.openFileByPost(url, payload, "pdf", reportCode + ".pdf").then(function (results) {
                            console.log("file downloaded=", results);
                            overlay.hide();
                        });
                        // return defer.promise;
                    }
                }

            };
            

        };
        return reportService;
    });

    return angularAMD;
});