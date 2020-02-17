define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'alaSqlExtensions', 'localPersistenceService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('reportService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, $interval, alasql, localPersistenceService, overlay, $sce, $timeout) {

        function reportService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            //Event will fire after page loaded.
            this.afterLoad = function (form, parentForm) {
                //alert("After Load");
                overlay.load();
                form = form || self.form;
                var sections = form.sections;
                var dateField = getFieldByModelKey(sections, "beginDate");
                if (dateField.fieldType === "date") {
                    var beginDate = moment().subtract(1, 'day').toDate();
                    dateField.modelValue = dateUtilService.convertToDateFormat(moment(beginDate));
                }

                var stickyData = JSON.parse(localStorage.getItem("payload"));
                console.log("StickyData ", stickyData);
                //var stickyData = localPersistenceService.get("payload", true);
                this.submitButtonDisabledBeforeLoad(stickyData, sections);
                //this.bindStickyDataToFields(stickyData, sections);
                // this.reportByDropdownHandler();
            };

            //Disabled submit button before all dropdown load.
            this.submitButtonDisabledBeforeLoad = function (stickyData, sections) {
                var btn = $(".btnSubmit").find("button");
                $(".btnSubmit").addClass("submitButtonDisabled");
                btn.attr("disabled", true);
                var verifyAllLoaded = $interval(function () {
                    console.log("afterload inside");
                    if ($(".fa-spinner:visible").length === 0) {
                        console.log("afterload stop");
                        $interval.cancel(verifyAllLoaded);
                        verifyAllLoaded = undefined;
                        btn.removeAttr("disabled");
                        $(".btnSubmit").removeClass("submitButtonDisabled");
                        var stickyTimer = setTimeout(function () {
                            self.bindStickyDataToFields(stickyData, sections);
                            stickyTimer = null;
                        }, 2000);

                    }

                }, 2000);
            };

            this.buildPayLoad = function (sections) {
                var isGrid = false;
                var fullPayload = {};
                var viewPayLoad = [];
                var stickyPayLoad = {};
                var payload = {};

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
                                if (field["fieldType"] === "grid") {
                                    isGrid = true;
                                }
                                var modelKey = field["fieldKey"];
                                var viewField = {};
                                var res;
                                var pload;
                                viewField["title"] = field["title"] || "";
                                switch (field.fieldType) {
                                    case "dropdown":
                                    case "nesteddrop":
                                    case "nestedone":
                                        field["SelectedText"] = field.getSelectedText();
                                        if (modelKey !== "reportBy") {
                                            res = getValueFromDropDown(field, modelKey, fullPayload);

                                            pload = res["payload"];
                                            viewField = res["viewload"];
                                            viewPayLoad.push(viewField);

                                            self.getDependencyModelData(sections, field, fullPayload, viewPayLoad);

                                            if (field.fieldType === "dropdown") {
                                                if (fullPayload[field.fieldKey]) {
                                                    if (field["ismultiple"]) {
                                                        stickyPayLoad[field.stickyKey] = fullPayload[field.fieldKey][0].values;
                                                    }
                                                    else {
                                                        stickyPayLoad[field.stickyKey] = fullPayload[field.fieldKey][0].values[0];
                                                    }
                                                }
                                            }
                                            else if (field.fieldType === "nesteddrop") {
                                                stickyPayLoad[field.stickyKey] = fullPayload[field.fieldKey][0].values;
                                            }
                                        }
                                        //field.addClass("error text-danger");
                                        break;

                                    case "date":
                                        var dateFormat = "YYYY/MM/DD";
                                        if (field.modelValue !== undefined) {
                                            var beginDate = moment(field.modelValue).format(dateFormat);
                                            var endDate = moment(field.modelValue).format(dateFormat);
                                            fullPayload["startDate"] = beginDate;
                                            fullPayload["endDate"] = endDate;
                                            viewField["modelValue"] = beginDate;
                                            stickyPayLoad[field.stickyKey] = beginDate;
                                        }
                                        viewPayLoad.push(viewField);
                                        break;

                                    case "daterange":
                                        var period = field.getModel();
                                        if (period.beginDate === "Invalid date" || period.endDate === "Invalid date") {
                                            viewField["modelValue"] = undefined;
                                        }
                                        else {
                                            dateFormat = field['dateRangeConfig'].format;

                                            if (dateFormat && dateFormat !== 'undefined') {
                                                beginDate = moment(period.beginDate).format(dateFormat);
                                                endDate = moment(period.endDate).format(dateFormat);
                                            }
                                            else {
                                                beginDate = period.beginDate;
                                                endDate = period.endDate;
                                            }
                                            try {
                                                console.log("daterangeField", field);
                                                if (period) {
                                                    fullPayload["startDate"] = beginDate;
                                                    fullPayload["endDate"] = endDate;
                                                    viewField["modelValue"] = beginDate + " - " + endDate;
                                                    stickyPayLoad[field.stickyKey] = beginDate + " - " + endDate;
                                                    //stickyPayLoad["startDate"] = beginDate;
                                                    //stickyPayLoad["endDate"] = endDate;
                                                    //  viewField["modelValue"]=period.endDate;
                                                }
                                            } catch (err) {
                                                console.log("2222 getModel", err);
                                            }
                                        }

                                        viewPayLoad.push(viewField);
                                        break;
                                    case "number":
                                        fullPayload[field.fieldKey] = field.modelValue;
                                        viewField["modelValue"] = field.modelValue;
                                        stickyPayLoad[field.stickyKey] = field.modelValue;
                                        viewPayLoad.push(viewField);
                                        break;
                                    case "checkbox":
                                        if (field.dataSourceId) {
                                            if (field.modelValue === true) {
                                                fullPayload[field.modelKey] = [
                                                    {
                                                        "dataSourceId": field.dataSourceId,
                                                        "values": ["true"]
                                                    }
                                                ];
                                                viewField["modelValue"] = "Yes";
                                            }
                                            else {
                                                viewField["modelValue"] = "Yes/No";
                                            }
                                        }
                                        else {
                                            fullPayload[field.fieldKey] = field.modelValue;
                                            viewField["modelValue"] = field.modelValue;
                                        }
                                        stickyPayLoad[field.stickyKey] = field.modelValue;
                                        viewPayLoad.push(viewField);
                                        break;
                                    case "grid":
                                        console.log("gridData==>", field);
                                        console.log("gridData==>", field.gridOptions.api);
                                        break;
                                    case "textbox":
                                        viewField["modelValue"] = field.modelValue;
                                        viewPayLoad.push(viewField);
                                        break;
                                    case "listbox":
                                        res = getValueFromListBox(field, modelKey, fullPayload);
                                        pload = res["payload"];
                                        viewField = res["viewload"];
                                        viewPayLoad.push(viewField);
                                        if (field.stickyKey != null)
                                            stickyPayLoad[field.stickyKey] = fullPayload[field.stickyKey][0].values;
                                        break;
                                    default:
                                        break;
                                }

                            });
                        });
                    });
                });

                console.log("dField fullPayload=", fullPayload);

                return {
                    fullPayload: fullPayload,
                    viewPayLoad: viewPayLoad,
                    payload: payload,
                    isGrid: isGrid,
                    stickyPayLoad: stickyPayLoad
                };
            };

            this.getDependencyModelData = function (sections, field, fullPayload, viewPayLoad) {

                if (field["dependencyFields"] !== undefined) {
                    var dFields = field["dependencyFields"];
                    console.log("dField=", dFields);
                    var hasValuetitle = "";
                    angular.forEach(dFields, function (dField) {
                        var fieldObj = getFieldByModelKey(sections, dField);
                        var defaultValue = fieldObj.defaultValue || fieldObj.parentDefaultValue;
                        var selectedValue = fieldObj.getModel();
                        if (typeof selectedValue === "object" && selectedValue !== null) {
                            selectedValue = selectedValue[0].value;
                        }

                        console.log("dField defaultValue=", defaultValue);
                        console.log("dField value=", selectedValue);
                        if (defaultValue === selectedValue) {
                            console.log("dField default value =", defaultValue);
                            hasValuetitle = fieldObj.title;
                        }
                        var res = getValueFromDropDown(fieldObj, fieldObj.fieldKey, fullPayload);

                        console.log("dField 2=", fieldObj.fieldKey, res);
                    });

                    angular.forEach(viewPayLoad, function (vpayload, i) {
                        console.log("dField viewPayLoad =", vpayload, i, hasValuetitle);
                        if (vpayload.title === hasValuetitle) {
                            viewPayLoad.splice(i, 1);
                        }
                    });
                }
            };

            this.validateFields = function (sections) {

            };

            this.quickRangeHandler = function (field, parentForm, c, d) {
                var selectedValue = field.modelValue;
                var reportPeriod = getFieldByModelKey(parentForm.sections, "reportPeriod");
                if (selectedValue.length === 0) {
                    reportPeriod.modelValue = [];
                    reportPeriod.disabled = false;
                }
                else {
                    reportPeriod.disabled = true;
                    var startDate = new Date();
                    var endDate = new Date();
                    switch (selectedValue) {
                        case "yesterday":
                            startDate = moment().utc().subtract(1, 'Days').startOf('day').format('MM/DD/YYYY');
                            endDate = moment().utc().subtract(1, 'Days').endOf('day').format('MM/DD/YYYY');
                            break;
                        case "this_week":
                            startDate = moment().utc().startOf('week').format('MM/DD/YYYY');
                            endDate = moment().utc().format('MM/DD/YYYY');
                            break;
                        case "last_week":
                            startDate = moment().utc().subtract(1, 'weeks').startOf('week').format('MM/DD/YYYY');
                            endDate = moment().utc().subtract(1, 'weeks').endOf('week').format('MM/DD/YYYY');
                            break;
                        case "last_month":
                            startDate = moment().utc().subtract(1, 'M').startOf('month').format('MM/DD/YYYY');
                            endDate = moment().utc().subtract(1, 'M').endOf('month').format('MM/DD/YYYY');
                            break;
                        case "this_month":
                            startDate = moment().utc().startOf('month').format('MM/DD/YYYY');
                            endDate = moment().utc().format('MM/DD/YYYY');
                            break;
                        case "this_year":
                            startDate = moment().utc().startOf('year').format('MM/DD/YYYY');
                            endDate = moment().utc().format('MM/DD/YYYY');
                            break;
                        case "last_year":
                            startDate = moment().utc().subtract(1, 'Y').startOf('year').format('MM/DD/YYYY');
                            endDate = moment().utc().subtract(1, 'Y').endOf('year').format('MM/DD/YYYY');
                            break;
                        case "custom_range":
                            reportPeriod.disabled = false;
                            startDate = moment().utc().startOf('day').format('MM/DD/YYYY');
                            endDate = moment().utc().endOf('day').format('MM/DD/YYYY');
                            break;
                        default:

                            break;
                    }
                    reportPeriod.setModel({
                        beginDate: startDate,
                        endDate: endDate
                    });
                }

            };

            this.reportPeriodChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                console.log(sourceField);
            };
            this.MultiDropdownsHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var allOptionArray = []; var allExceptOptionsArray = [];
                var allOptionFlag = false; var allExceptOptionsFlag = false; var i = 0;
                angular.forEach(sourceField.modelValue, function (data, index) {
                    if (data.value !== sourceField.parentDefaultValue) {
                        allExceptOptionsArray[i] = data;
                        allOptionFlag = true;
                        allExceptOptionsFlag = false;
                        i++;
                    }
                    else {
                        allOptionArray[0] = data;
                        allExceptOptionsFlag = true;
                        allOptionFlag = false;
                    }
                });

                if (allOptionFlag) {
                    sourceField.modelValue = allExceptOptionsArray;
                    self.isDefaultValueTobeSet = false;
                }

                if (allExceptOptionsFlag) {
                    sourceField.modelValue = allOptionArray;
                }
            };
            this.allDropdownsHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var allOptionArray = []; var allExceptOptionsArray = [];
                var allOptionFlag = false; var allExceptOptionsFlag = false; var i = 0;
                angular.forEach(sourceField.modelValue, function (data, index) {
                    if (data.value !== sourceField.parentDefaultValue) {
                        allExceptOptionsArray[i] = data;
                        allOptionFlag = true;
                        allExceptOptionsFlag = false;
                        i++;
                    }
                    else {
                        allOptionArray[0] = data;
                        allExceptOptionsFlag = true;
                        allOptionFlag = false;
                    }
                });

                if (allOptionFlag) {
                    sourceField.modelValue = allExceptOptionsArray;
                    self.isDefaultValueTobeSet = false;
                }

                if (allExceptOptionsFlag) {
                    sourceField.modelValue = allOptionArray;
                }

                var parentField = getFieldByModelKey(parentForm.sections, sourceField.parentModelKey);
                if (parentField.modelValue !== parentField.defaultValue && self.isDefaultValueTobeSet !== true) {
                    parentField.modelValue = parentField.defaultValue;
                }
            };

            this.ogmDropdownsHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var childField = getFieldByModelKey(parentForm.sections, sourceField.childModelKey);
                if (childField.modelValue !== [childField.options[0]]) {
                    childField.setSelectedIndex(sourceField.childDefaultSelectedIndex);
                    self.isDefaultValueTobeSet = true;
                }
            };

            this.toSubmit = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event, selectedItem) {
                var payload = {};
                var sections = parentForm.sections;
                console.log("2223 sections=", sections);
                var reportCode = parentForm["reportCode"];

                var payloadData = this.buildPayLoad(sections);

                var fullPayload = payloadData.fullPayload;
                var viewPayLoad = payloadData.viewPayLoad;
                var stickyPayLoad = payloadData.stickyPayLoad;

                localStorage.setItem("payload", JSON.stringify(stickyPayLoad));
                //localPersistenceService.set("payload", JSON.stringify(stickyPayLoad),true);

                var flag = false;
                //angular.forEach(viewPayLoad, function (data, index) {
                //    if (viewPayLoad[index].modelValue === undefined) {
                //        //$(".field-check").addClass("field-checks");
                //        flag = true;
                //    }                    
                //});

                console.log("flag ", flag);

                if (!flag) {

                    $(".search-criteria-editmode").hide();
                    $(".report-grid").show();
                    if (reportCode === "POOLS_BY_RACE_REPORT" || reportCode === "BC_REPORTING_BY_RACES" || reportCode === "COMM_IMPORT") {
                        var reportByField = getFieldByModelKey(parentForm.sections, "reportBy");
                        console.log("2223 reportByField==>", reportByField);
                        fullPayload["reportBy"][0].dataSourceId = reportByField.dataSourceId;
                    }
                    var exportPayload = buildPayloadWithCriteria(fullPayload, viewPayLoad, reportCode);
                    //localStorage.setItem("payload", JSON.stringify(exportPayload));
                    console.log("Export payload ", exportPayload);

                    localPersistenceService.set("exportPayload", JSON.stringify(exportPayload), true);

                    localPersistenceService.set("fullPayload", JSON.stringify(fullPayload), true);

                    buildSearchDetailSection(viewPayLoad, parentForm);

                    if (payloadData.isGrid) {

                        var grid = getFieldByModelKey(parentForm.sections, "reportGrid");
                        var footerGrid = getFieldByModelKey(parentForm.sections, "reportFooterGrid");
                        grid.gridOptions.api.refreshView();
                        grid.gridOptions.api.setRowData([]);
                        grid.gridOptions.api.resetRowHeights();
                        grid.gridOptions.api.showLoadingOverlay();

                        grid.gridOptions.rowClass = "ag-grid-row-style";

                        if (footerGrid.title === undefined) {

                            makeServiceCallForGettingJsonResult(fullPayload, reportCode).then(function (res) {
                                console.log("run result=", res);
                                if (res) {
                                    bindReportGrid(parentForm, res, grid, footerGrid);
                                }
                                grid.gridOptions.api.hideOverlay();

                            });
                        }
                        else {
                            footerGrid.gridOptions.rowClass = "ag-footer-grid-row-style";
                            footerGrid.gridOptions.api.setRowData([]);

                            makeServiceCallForGettingJsonResult(fullPayload, reportCode).then(function (res) {
                                console.log("run result=", res);
                                if (res) {
                                    bindReportGrid(parentForm, res, grid, footerGrid);
                                }
                                grid.gridOptions.api.hideOverlay();

                            });
                        }
                    }
                    else {

                        var label = getFieldByModelKey(parentForm.sections, "reportLabel");
                        makeServiceCallForGettingHtmlResult(exportPayload, reportCode).then(function (res) {
                            console.log("run result=", res);
                            if (res) {
                                label.trustedHtml = $sce.trustAsHtml(res.data);
                            }

                        });

                    }

                }
                else {
                    Notification.error({
                        message: "All fields are mandatory.",
                        title: 'FIELDS REQUIRED',
                        delay: 5000
                    });
                }
            };

            var getValueFromListBox = function (field, modelKey, fullPayload) {

                var res = {};
                var fModel = {};
                var viewField = {};
                viewField["title"] = field["title"];
                fModel[modelKey] = [];
                try {
                    var selectedValue = {};
                    selectedValue.dataSourceId = field["dataSourceId"];
                    selectedValue.values = [];

                    var vals;
                    var modelValue;

                    var mVal = field.getModel();
                    if (angular.isNumber(mVal)) {
                        vals = String(mVal || "");
                    }
                    else {
                        vals = mVal;
                    }

                    if (vals && vals.length > 0) {

                        var mitem = {};
                        mitem["dataSourceId"] = field["dataSourceId"];

                        if (vals[0]["value"] === field.parentModelValue) {
                            var mval = replaceData(field, vals[0].value);

                            modelValue = {
                                "dataSourceId": mitem["dataSourceId"],
                                "values": [mval]
                            };
                        }
                        else {
                            mitem["values"] = [];
                            angular.forEach(vals, function (val) {
                                if (val["value"] !== undefined && val["value"] !== null) {
                                    mitem["values"].push(val["value"]);
                                }
                            });
                            modelValue = {
                                "dataSourceId": field["dataSourceId"],
                                "values": mitem["values"]
                            };
                        }
                        fModel[modelKey].push(modelValue);
                    }
                    else {
                        console.log("None Added");
                    }

                    var fModelObjKey = Object.getOwnPropertyNames(fModel)[0];
                    var fModalKey = field.stickyKey || fModelObjKey;
                    console.log("fModelObjKey=", fModelObjKey);
                    viewField["modelValue"] = selectedTextFromListBox(field);//["SelectedText"];
                    viewField["tooltip"] = selectedToolTipFromListBox(field);//field["SelectedText"];
                    fullPayload[fModalKey] = fModel[fModelObjKey];

                } catch (error) {
                    console.log("2222 getModel", error);
                }
                fullPayload[fModalKey] = fModel[fModelObjKey];
                res["viewload"] = viewField;
                return res;

            };
            var selectedTextFromListBox = function (field) {
                var selectedModal = field.getModel();
                var selectedText = "";
                var selectedTooltipItems = [];
                if (selectedModal.length > 1) {
                    angular.forEach(selectedModal, function (value, key) {
                        selectedTooltipItems.push(value.text);
                    });
                    selectedText = selectedTooltipItems.join(", ");
                } else {
                    if (selectedModal.length === 1) {
                        selectedText = selectedModal[0].text;
                    }
                }
                return selectedText;
            };

            var selectedToolTipFromListBox = function (field) {
                var selectedModal = field.getModel();
                var selectedText = "";
                angular.forEach(selectedModal, function (item, i) {
                    if (i === 0) {
                        selectedText = item.text;
                    } else {
                        selectedText = selectedText + ", " + item.text;
                    }

                });
                return selectedText;
            };

            var getValueFromDropDown = function (field, modelKey, fullPayload) {
                var res = {};
                var fModel = {};
                var viewField = {};
                viewField["title"] = field["title"];
                fModel[modelKey] = [];

                try {
                    var selectedValue = {};
                    selectedValue.dataSourceId = field["dataSourceId"];
                    selectedValue.values = [];

                    var vals;
                    var modelValue;

                    var mVal = field.getModel();
                    if (angular.isNumber(mVal)) {
                        vals = String(mVal || "");
                    }
                    else {
                        vals = mVal;
                    }

                    if (vals && vals.length > 0) {

                        if (angular.isArray(vals)) {
                            var groupbyParent = alasql("SELECT * FROM ? GROUP BY parentValue", [vals]);
                            angular.forEach(groupbyParent, function (item) {
                                if (item.parentValue) {
                                    var childItems = alasql("SELECT * FROM ? WHERE parentValue=? ", [vals, item.parentValue]);
                                    if (childItems.length > 0) {
                                        var citem = {};
                                        citem["dataSourceId"] = item["childDataSourceId"];
                                        citem["values"] = [];
                                        angular.forEach(childItems, function (cItem) {
                                            if (cItem["value"] !== undefined && cItem["value"] !== null) {
                                                citem["values"].push(cItem["value"]);
                                            }
                                        });
                                    }
                                    var pavlue = replaceData(field, item.parentValue);
                                    modelValue = {
                                        "dataSourceId": citem["dataSourceId"],
                                        "values": citem["values"]
                                    };
                                    fModel[modelKey].push(modelValue);
                                }
                                else {
                                    if (field["ismultiple"] && field["isgrouping"]) {
                                        var parentWithOutChildItems = alasql("SELECT * FROM ? WHERE parentValue=''", [vals, item.value]);
                                        angular.forEach(parentWithOutChildItems, function (parentWithOutChildItem) {
                                            var pavlue = replaceData(field, parentWithOutChildItem.value);
                                            modelValue = {
                                                "dataSourceId": parentWithOutChildItem.item["dataSourceId"],
                                                "values": [pavlue]
                                            };
                                            fModel[modelKey].push(modelValue);
                                        });
                                    }
                                    else if (field["ismultiple"]) {
                                        var mitem = {};
                                        mitem["dataSourceId"] = field["dataSourceId"];

                                        if (vals[0]["value"] === field.parentDefaultValue) {
                                            var mval = replaceData(field, vals[0].value);

                                            modelValue = {
                                                "dataSourceId": mitem["dataSourceId"],
                                                "values": [mval]
                                            };
                                        }
                                        else {
                                            mitem["values"] = [];
                                            angular.forEach(vals, function (val) {
                                                if (val["value"] !== undefined && val["value"] !== null) {
                                                    mitem["values"].push(val["value"]);
                                                }
                                            });
                                            modelValue = {
                                                "dataSourceId": field["childDataSourceId"],
                                                "values": mitem["values"]
                                            };
                                        }
                                        fModel[modelKey].push(modelValue);
                                    }
                                    else {
                                        pavlue = replaceData(vals);
                                        modelValue = {
                                            "dataSourceId": field["dataSourceId"],
                                            "values": [pavlue]
                                        };
                                        fModel[modelKey].push(modelValue);
                                    }
                                }
                            });
                        }
                        else {
                            if (field.fieldKey === "raceType"){
                                modelValue = {
                                    "dataSourceId": vals === "ALL_Types" ? field["dataSourceId"] : field["childDataSourceId"],
                                    "values": [vals]
                                };
                            }
                            else {
                                modelValue = {
                                    "dataSourceId": field["dataSourceId"],
                                    "values": [vals]
                                };
                            }
                            

                            fModel[modelKey].push(modelValue);
                        }
                        var fModelObjKey = Object.getOwnPropertyNames(fModel)[0];
                        viewField["modelValue"] = field["SelectedText"];
                        viewField["tooltip"] = field["SelectedText"];
                        fullPayload[fModelObjKey] = fModel[fModelObjKey];
                    }

                } catch (err) {
                    console.log("2222 getModel", err);
                }
                fullPayload[fModelObjKey] = fModel[fModelObjKey];
                res["viewload"] = viewField;
                return res;
            };

            var replaceData = function (field, data) {
                var replaceableData = field["replaceData"];
                var lData = data;
                if (replaceableData) {
                    angular.forEach(Object.getOwnPropertyNames(replaceableData), function (prop) {
                        if (prop === data) {
                            lData = replaceableData[prop];
                        }
                    });
                }
                if (lData === null) {
                    lData = "";
                }
                return lData;
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
                            column.cssClass = "col-md-3 padding-lftrht0";
                            var field = {};
                            field["fieldType"] = "fieldlabel";
                            field["title"] = viewPayLoad[j]["title"];
                            field["cssClass"] = "col-md-12 padding-lftrht0";

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
                            else if (viewPayLoad[j]["title"] === "Race Date") {
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
                            console.log("Report 123 Field=", field);
                            console.log("Report 123 viewPayLoad=", viewPayLoad);
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

            var buildPayloadWithCriteria = function (fullPayload, viewPayload, reportCode) {

                var modelData = {};
                modelData["includeReportHeader"] = true;
                modelData["includeTenantContext"] = true;
                if (reportCode === "POOLS_BY_RACE_REPORT" || reportCode === "POOLS_REPORT") {
                    modelData["pageOrientation"] = "2l";
                }
                else {
                    modelData["pageOrientation"] = "2l";
                }
                modelData["additionalServiceCriteria"] = fullPayload;
                var additionalModelData = {};
                additionalModelData["reportHeader"] = {};
                var reportHeader = {};
                angular.forEach(viewPayload, function (data, index) {
                    if (viewPayload[index].title === "Report Period") {
                        var dateRange = viewPayload[index].modelValue.split(" - ");
                        var beginDate = dateUtilService.convertToDateFormat(moment(dateRange[0]));
                        var endDate = dateUtilService.convertToDateFormat(moment(dateRange[1]));
                        var resultDate = beginDate.concat(" - ", endDate);
                        reportHeader[viewPayload[index].title] = resultDate;
                    }
                    else if (viewPayload[index].title === "Begin Date") {
                        var date = dateUtilService.convertToDateFormat(moment(viewPayload[index].modelValue));
                        reportHeader[viewPayload[index].title] = dateUtilService.convertStringToDateFormat(date, "MM/DD/YYYY");
                    }
                    else {
                        reportHeader[viewPayload[index].title] = viewPayload[index].modelValue;
                    }

                });
                modelData["additionalModelData"] = { "reportHeader": reportHeader, "sheetName": reportCode };

                console.log("Model Data ", modelData);
                return modelData;

            };

            var makeServiceCallForGettingJsonResult = function (payload, reportCode) {

                var url = "report/run/json/1002/" + reportCode;
                var defer = $q.defer();
                httpService.post(url, payload).then(function (result) {
                    defer.resolve(result);
                });
                return defer.promise;
            };

            var makeServiceCallForGettingHtmlResult = function (payload, reportCode) {

                var url = "report/run/html/1002/" + reportCode;
                var defer = $q.defer();
                httpService.post(url, payload).then(function (result) {
                    defer.resolve(result);
                });
                return defer.promise;
            };

            var getRowClassRules = function (data, columnvalue) {
                var res = false;
                angular.forEach(data, function (v, i) {
                    if (data[i]) {
                        if (data[i].toString().indexOf("Total") >= 0) {
                            res = true;
                        }
                    }
                });
                return res;
            };



            var bindReportGrid = function (parentForm, resultData, grid, footerGrid) {
                console.log("bindReportGrid=");
                if (footerGrid.title === undefined) {
                    if (resultData) {
                        dataHeaderList = resultData.data.datasets["dataHeader"][0] || [];
                        resultDataList = resultData.data.datasets["data"] || [];
                        //Setting column header for grid
                        grid.gridOptions.columnDefs = [];
                        columnDefs = grid.gridOptions.columnDefs;

                        dataHeaders = dataHeaderList["this"]["attributeMap"];
                        console.log("dataHeaders=", dataHeaders);
                        columnDefs = bindGridColumns(dataHeaders, columnDefs, grid);
                        console.log("columnDefs=", columnDefs);
                        grid.gridOptions.api.setColumnDefs(columnDefs);

                        $(".report-grid-field .ag-header ").css("height", "30px").css("min-height", "30px");

                        grid.gridOptions["rowClassRules"] = {
                            'bold-row': function (params) {
                                var res = false;
                                res = getRowClassRules(params.data);
                                return res;
                            }
                        };
                        grid.gridOptions.api.setRowData([]);

                        if (resultDataList.length > 0) {
                            grid.gridOptions.api.setRowData(resultDataList);
                            grid.gridOptions.api.setDomLayout('autoHeight');
                            try {
                                //grid.gridOptions.api.sizeColumnsToFit();
                            } catch (err) {
                                console.log("error=", err);
                            }



                        } else {
                            gridOptions.api.showNoRowsOverlay();
                            //grid.gridOptions.api.setRowData([]);
                            //$(".search-criteria-editmode").hide();
                        }
                    }
                }
                else {
                    if (resultData) {
                        var dataHeaderList = resultData.data.datasets["dataHeader"][0] || [];
                        var resultDataList = resultData.data.datasets["data"] || [];
                        if (dataHeaderList.title === "Pools Report"
                            && resultDataList.length != 0
                            || dataHeaderList.title === "Bc Reporting By Races"
                            && resultDataList.length != 0
                            || dataHeaderList.title === "Pools By Race Report"
                            && resultDataList.length != 0) {
                            var tempResultDataList = [];
                            var tempDataHeaderList = new Array();
                            var data1 = {};
                            var tempResultDataList = resultDataList;
                            var jsonvalue = tempResultDataList[0].json;
                            var jsonvalues = (jsonvalue.replace(/ISODate\(\"/g, '"').replace(/Z\"\)/g, 'Z"'));
                            var jsonData = JSON.parse(jsonvalues);
                            var jsondatas = Object.keys(jsonData);
                            var tempDataHeaderList = dataHeaderList["this"].attributeMap;
                            angular.forEach(tempDataHeaderList, function (item1, key) {
                                angular.forEach(jsondatas, function (item, value) {
                                    if (key === item) {
                                        data1[key] = item1;
                                    }
                                });
                                if (key.includes("json.")) {
                                    data1[key] = item1;
                                }
                            });
                            dataHeaderList["this"]["attributeMap"] = data1;
                            var json = resultDataList[0].json;
                            var jsonvalues = (json.replace(/ISODate\(\"/g, '"').replace(/Z\"\)/g, 'Z"'));
                            var jsonData = JSON.parse(jsonvalues);
                            var tempResultDataList = new Array();
                            var tempDataHeaderList = new Array();
                            tempResultDataList = resultDataList;
                            var json = tempResultDataList[0].json;
                            var jsonvalues = (json.replace(/ISODate\(\"/g, '"').replace(/Z\"\)/g, 'Z"'));
                            var jsonData = JSON.parse(jsonvalues);
                            console.log(jsonData);
                            tempResultDataList.forEach(function (item, index) {
                                var bson = tempResultDataList[index].json;
                                var jsonvalues = (bson.replace(/ISODate\(\"/g, '"').replace(/Z\"\)/g, 'Z"'));
                                var jsonData = JSON.parse(jsonvalues);
                                console.log(jsonData);
                                tempDataHeaderList.push(jsonData);
                            });
                            resultDataList = tempDataHeaderList;
                            resultData.data.datasets["data"] = tempDataHeaderList;
                        }
                        //Setting column header for grid
                        grid.gridOptions.columnDefs = [];
                        var columnDefs = grid.gridOptions.columnDefs;
                        //console.log("555 grid==", grid, columnDefs);

                        var dataHeaders = dataHeaderList["this"]["attributeMap"];
                        //var dataHeaders = dataHeaderList["modelMap"]["this"]["attributeMap"];

                        columnDefs = bindGridColumns(dataHeaders, columnDefs, grid);

                        var dataHeaderColumn1 = alasql("SELECT * from ?", [formatDataHeaderColumns(dataHeaders)]);
                        var colgroupData = alasql("SELECT DISTINCT  CAST(columngroupName AS STRING) AS columngroupName FROM ?  GROUP BY columngroupName ", [dataHeaderColumn1]);


                        console.log("columnsDefs == ", columnDefs);
                        console.log("gridOptions == ", grid);

                        if (grid.gridOptions.pivotMode === true) {
                            grid.gridOptions["processSecondaryColDef"] = function (colDef) {
                                console.log("processSecondaryColDef=", colDef);
                                console.log("colDef.headerName=", $(colDef.headerName).html());

                                colDef.headerName = $(colDef.headerName).html($(colDef.headerName).html() + " " + colDef.pivotKeys[0]).html();
                            };

                            grid.gridOptions["processSecondaryColGroupDef"] = function (colGroupDef) {
                                console.log("processSecondaryColDef colGroupDef=", colGroupDef);
                                colGroupDef.headerName = "";//'Race No ' + colGroupDef.headerName;
                            };
                            grid.gridOptions["groupHideOpenParents"] = true;
                        }

                        grid.gridOptions.api.setColumnDefs(columnDefs);
                        //grid.features["suppressHorizontalScroll"] = true;

                        grid.gridOptions.api.setRowData([]);
                        if (colgroupData.length > 1) {
                            $(".report-grid-field .ag-header ").css("height", "60px").css("min-height", "60px");
                        } else {
                            $(".report-grid-field .ag-header ").css("height", "30px").css("min-height", "30px");
                        }

                        $(".report-grid-field .ag-header-row").css("height", "30px !important");
                        $(".report-grid-field .ag-header-container .ag-header-row").eq(1).css("top", "30px");

                        if (resultDataList.length > 0) {
                            grid.gridOptions.api.setRowData(resultDataList);
                            try {
                                //grid.gridOptions.api.sizeColumnsToFit();
                            } catch (err) {
                                console.log("error=", err);
                            }
                            grid.gridOptions.api.setDomLayout('autoHeight');

                            console.log(" 444 grid height = ", $(".report-grid-field .ag-header ").css("height"));
                            console.log(" 444 grid height = ", $(".report-grid-field .ag-header-row").css("height"));

                            /* var vheight = (resultDataList.length * 35) + 53;
                             var height = (vheight > 470) ? 470 : vheight+60;
                              console.log("height=", height);
                             $(".report-grid-field").css("height", height.toString() + "px");
                             $(".report-grid-field .ag-header ").css("height","60px");
                             $(".report-grid-field .ag-header-row").css("height","30px");*/
                            //$(".report-footergrid-field").css("height", height.toString() + "px");
                            // $(".report-grid-field .ag-header ").css("height","60px");
                            // $(".report-grid-field .ag-header-row").css("height","30px");
                            // $(".report-footergrid-field").css("height",   "60px");
                            $(".report-footergrid-field").show();
                            console.log("report-grid-field .ag-header Height =", $(".report-grid-field .ag-header ").css("height"));
                            console.log("report-grid-field .ag-header Height =", $(".report-grid-field .ag-header-row").css("height"));

                        } else {
                            grid.gridOptions.api.showNoRowsOverlay();
                            //grid.gridOptions.api.setRowData([]);
                            //$(".search-criteria-editmode").hide();
                        }
                        console.log("777 bindReportFooterGrid grid.gridOptions.pivotMode=", grid.gridOptions.pivotMode)
                        grid.gridOptions.alignedGrids.push(footerGrid.gridOptions);
                        footerGrid.gridOptions.alignedGrids.push(grid.gridOptions);

                        console.log("301 ag-center-cols-clipper", $(".report-grid-field .ag-center-cols-clipper").css("height"));
                        console.log("777 bindReportFooterGrid grid.gridOptions.pivotMode=", grid.gridOptions.pivotMode)
                        if (grid.gridOptions.pivotMode === true) {
                            var totalRow = {};
                            var numberOfRowsCount = 0;
                            var totalData = getPivoteTotalData(grid);
                            if (totalData) {
                                totalRow = totalData["totals"];
                                numberOfRowsCount = totalData["numberOfRowsCount"];
                            }
                            console.log("Totals ", totalData);

                            var gridDisplayedColumns = grid.gridOptions.columnApi.columnController.allDisplayedColumns;

                            var colDefs = [];
                            angular.forEach(gridDisplayedColumns, function (col, index) {
                                var coldef = {};
                                coldef["headerName"] = gridDisplayedColumns[index].colDef.headerName;
                                coldef["field"] = gridDisplayedColumns[index].colDef.colId;
                                if (gridDisplayedColumns[index].colId === "ag-Grid-AutoColumn-reportBy") {
                                    coldef["cellClass"] = "ag-grid-cell-style-left";
                                    coldef["headerClass"] = "ag-grid-header-style-left";
                                    coldef["width"] = gridDisplayedColumns[index].actualWidth;
                                }
                                else {
                                    coldef["cellClass"] = "ag-grid-cell-style-right";
                                    coldef["headerClass"] = "ag-grid-header-style-right";
                                    coldef["width"] = gridDisplayedColumns[index].actualWidth;
                                }

                                colDefs.push(coldef);
                            });

                            console.log("colDefs ", colDefs);
                            vheight = (numberOfRowsCount * 35) + 53;
                            console.log("height 1=", vheight);
                            height = (vheight > 470) ? 470 : vheight + 60;
                            console.log("height 2=", height);
                            /*
                            $(".report-grid-field").css("height", height.toString() + "px");
                            $(".report-grid-field .ag-header").css("height","60px");
                            $(".report-grid-field .ag-header ").css("height","60px");
                            $(".report-grid-field .ag-header-row").css("height","30px");
                            */
                            grid.gridOptions.api.setDomLayout('autoHeight');
                            // $(".report-footergrid-field").css("height", height.toString() + "px");
                            //    $(".report-grid-field .ag-header ").css("height","60px");
                            //    $(".report-grid-field .ag-header-row").css("height","30px");
                            //     $(".report-footergrid-field").css("height",   "60px");
                            $(".report-footergrid-field").show();
                            $(".report-grid-field .ag-header ").css("height", "60px").css("min-height", "60px");
                            $(".report-grid-field .ag-header-row").css("height", "30px !important");
                            $(".report-grid-field .ag-header-container .ag-header-row").eq(1).css("top", "30px");
                            console.log("301 ag-center-cols-clipper", $(".report-grid-field .ag-center-cols-clipper").css("height"));
                            console.log("report-grid-field .ag-header Height =", $(".report-grid-field .ag-header ").css("height"));
                            console.log("report-grid-field .ag-header Height =", $(".report-grid-field .ag-header-row").css("height"));
                            bindPivotReportFooterGrid(parentForm, colDefs, totalRow, footerGrid, grid);
                        }
                        else {
                            console.log("777 bindReportFooterGrid calling=", resultData);
                            bindReportFooterGrid(parentForm, columnDefs, resultData, footerGrid, grid);

                        }
                    }
                }

                //$(".search-criteria-editmode").hide();
            };

            var getPivoteTotalData = function (grid) {

                var total = {};
                var numberOfRowsCount = 0;
                grid.gridOptions.api.forEachNode(function (node) {
                    //console.log(node.aggData);
                    if (node.aggData) {
                        numberOfRowsCount += 1;
                        //console.log(node.aggData)
                        angular.forEach(node.aggData, function (value, key) {
                            console.log("value key ", value, key, parseFloat(value));
                            total[key] = total[key] || 0.00;
                            total[key] += (parseFloat(value) || 0.00);
                            console.log(total);
                        });
                    }
                });
                console.log("race total", total);
                var totals = {};
                angular.forEach(total, function (key, value) {
                    console.log("ind totals", total[value]);
                    totals[value] = gridService.moneyFormatter(total[value]);
                });

                console.log("race totals", totals);
                return {
                    "totals": totals, "numberOfRowsCount": numberOfRowsCount
                };

            };

            var formatDataHeaderColumns = function (dataHeaderColumn) {
                var data = [];
                var orderCount = 1;
                var unorderCount = 1;
                angular.forEach(dataHeaderColumn, function (dataHeader, index) {
                    var dataMap = {};
                    if (index.indexOf(".") === -1) {
                        dataMap["field"] = index;
                        dataMap["unOrderId"] = unorderCount;
                        unorderCount++;
                    } else {
                        dataMap["valueGetter"] = index;
                        dataMap["orderId"] = orderCount;
                        orderCount++;
                    }

                    angular.forEach(dataHeader, function (value, key) {
                        dataMap[key] = value;
                    });
                    data.push(dataMap);
                });
                return data;
            };

            var buildColumn = function (colDef, dataHeaderDetails) {
                console.log("111a3 colDef,dataHeader, dataHeaderDetails ", dataHeaderDetails);
                if (angular.isObject(dataHeaderDetails)) {
                    //loop each property 
                    angular.forEach(Object.getOwnPropertyNames(dataHeaderDetails), function (header) {
                        //console.log("dataHeader 1=",header,dataHeaderDetails[header]);
                        var key = gridService.getMappedColumnName(header);
                        colDef[key] = dataHeaderDetails[header];

                        if (key === "headerName") {
                            colDef["headerName"] = dataHeaderDetails.headerText;// "<div class=" + dataHeaderDetails.headerClass + ">" + dataHeaderDetails.headerText + "</div>";
                        }

                        if (key === "operation") {
                            colDef["valueGetter"] = gridService.runBussinessRules;
                        }

                        if (key === "isdatesort") {
                            if (colDef[key]) {
                                colDef["comparator"] = gridService.datesorter;
                            }

                        }

                        if (key === "valueGetter") {
                            colDef["valueGetter"] = function (params) {
                                console.log("valueGetter params =", params);
                                var vgData = [];
                                var dataset = params.data.json;
                                var parsedData = params.data;
                                if (dataset) {
                                    var replacedDate = (dataset.replace(/ISODate\(\"/g, '"').replace(/Z\"\)/g, 'Z"'));
                                    parsedData = JSON.parse(replacedDate);
                                }
                                var colValue = parsedData[params.colDef["tooltipField"]];
                                if (colValue.length === 24 && Object(colValue).indexOf('Z') === 23 && Object(colValue).endsWith('Z')) {
                                    colValue = moment(colValue).utc().format('MM/DD/YYYY');
                                }
                                return colValue;

                            };
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

                        //console.log("key,value-->", key, dataHeaderDetails[header]);
                    });
                    if (colDef["valueGetter"] === undefined) {
                        colDef["field"] = dataHeaderDetails["field"];
                    }


                }
                else {
                    colDef = { field: dataHeaderDetails, headerName: dataHeaderDetails["field"] };
                }

                return colDef;
            };

            alasql.fn.convertdate = function (race_date) {
                if (race_date) {
                    return moment(race_date).format('MM/DD/YYYY');
                }
            };


            var buildGroupColumn = function (colRawDataByGroup) {
                var colDefList = [];
                angular.forEach(colRawDataByGroup, function (colHeader) {
                    var colDef = {};
                    if (colHeader.alignment === "left") {
                        colDef["cellClass"] = "ag-grid-cell-style-left";
                        colDef["headerClass"] = "ag-grid-header-style-left";
                    }
                    else if (colHeader.alignment === "right") {
                        colDef["cellClass"] = "ag-grid-cell-style-right";
                        colDef["headerClass"] = "ag-grid-header-style-right";
                    }
                    colDef = buildColumn(colDef, colHeader);
                    colDefList.push(colDef);
                });
                return colDefList;
            };

            var getfieldbyKeyFromObject = function (list, key) {
                var sItem = {};
                angular.forEach(list, function (item, index) {
                    if (item.field && item.field === key) {
                        sItem = item;
                    } else if (item.valueGetter && item.valueGetter === key) {
                        sItem = item;
                    }
                });

                return sItem;
            };

            var bindGridColumns = function (dataHeaderColumn, columnDefs, grid) {
                dataHeaderColumn = alasql("SELECT * from ?", [formatDataHeaderColumns(dataHeaderColumn)]);
                var colgroupData = alasql("SELECT DISTINCT  CAST(columngroupName AS STRING) AS columngroupName FROM ?  GROUP BY columngroupName ", [dataHeaderColumn]);
                var hasColumnGrouping = false;
                angular.forEach(colgroupData, function (colHeader) {

                    var colRawDataByGroups = alasql("SELECT  * FROM ?  WHERE CAST(columngroupName AS STRING) =? ", [dataHeaderColumn, colHeader.columngroupName]);
                    if (colHeader.columngroupName === "undefined" || colHeader.columngroupName === undefined) {
                        angular.forEach(colRawDataByGroups, function (dataHeader, index) {
                            var colDef = {};
                            var datakey = dataHeader.field || dataHeader.valueGetter;
                            if (datakey !== "reportBy") {
                                var colRawDataByGroup = getfieldbyKeyFromObject(dataHeaderColumn, datakey);
                                console.log("colRawDataByGroup 11 = ", datakey, colRawDataByGroup);
                                colDef = buildColumn(colDef, colRawDataByGroup);
                                columnDefs.push(colDef);
                                console.log("111a3 =", columnDefs);
                            }
                        });
                    }
                    else {
                        var colDef = {};
                        colDef["headerName"] = colHeader.columngroupName;
                        colDef["headerClass"] = 'my-css-class';
                        colDef["children"] = buildGroupColumn(colRawDataByGroups);
                        console.log("111a3 22 =", columnDefs);
                        columnDefs.push(colDef);
                        hasColumnGrouping = true;
                    }
                });
                if (!hasColumnGrouping) {
                    var reportByColumnDefs = alasql("SELECT * from ? where orderId >= 1", [columnDefs]);
                    var nonReportByColumnDefs = alasql("SELECT * from ? where unOrderId >= 1", [columnDefs]);
                    columnDefs = reportByColumnDefs.concat(nonReportByColumnDefs);

                }
                console.log("final grid headers-->", columnDefs);
                return columnDefs;
            };

            var bindReportFooterGrid = function (parentForm, parentColumnDefs, resultData, footerGrid, grid) {
                console.log("777 bindReportFooterGrid=", resultData)
                if (resultData) {
                    var dataHeaderList = resultData.data.datasets["dataHeader"][0] || [];
                    var resultDataList = resultData.data.datasets["data"] || [];

                    //Setting column header for grid
                    footerGrid.gridOptions.columnDefs = [];
                    var columnDefs = footerGrid.gridOptions.columnDefs;
                    //console.log("555 grid==", footerGrid, columnDefs,parentColumnDefs);

                    var dataFooterHeaders = dataHeaderList["this"]["totals"];
                    var dataHeaders = dataHeaderList["this"]["attributeMap"];
                    //var dataHeaders = dataHeaderList["modelMap"]["this"]["attributeMap"];

                    //  var dataFooterHeadersattrs = Object.getOwnPropertyNames(dataFooterHeaders);
                    var dataHeadersattrs = Object.getOwnPropertyNames(dataHeaders);

                    var total = {};
                    angular.forEach(dataFooterHeaders, function (header) {
                        total[header] = 0;
                    });

                    angular.forEach(parentColumnDefs, function (coldef, index) {
                        delete parentColumnDefs[index]["valueGetter"];
                        console.log("301 coldef=", coldef);
                        if (!coldef.field)
                            parentColumnDefs[index]["field"] = coldef.headerName;

                    });

                    footerGrid.gridOptions.api.setColumnDefs(parentColumnDefs);

                    //var allColumnIds = [];
                    //footerGrid.gridOptions.columnApi.getAllColumns().forEach(function (column) {
                    //    allColumnIds.push(column.colId);
                    //});
                    //footerGrid.gridOptions.columnApi.autoSizeColumns(allColumnIds);

                    footerGrid.gridOptions.api.setRowData([]);

                    angular.forEach(resultDataList, function (record) {
                        angular.forEach(dataFooterHeaders, function (prop) {

                            //console.log("666 prop=",prop);
                            if (prop.split("+").length === 1) {
                                total[prop] = total[prop] + record[prop];
                            } else {
                                angular.forEach(prop.split("+"), function (lprop) {
                                    // console.log("666-1 prop =",prop,lprop,record[lprop])
                                    if (parseFloat(record[lprop]))
                                        total[prop] = total[prop] + parseFloat(record[lprop]);
                                });
                            }

                        });
                    });
                    /*  grid.gridOptions.api.forEachNode( function(rowNode, index) {
                          console.log("666 rowNode=",rowNode);
                          angular.forEach(dataFooterHeaders, function (prop) {
                              console.log("666 rowNode prop=",prop);
                              total[prop] = total[prop] + rowNode.data[prop];
                          });
                      });*/

                    angular.forEach(Object.getOwnPropertyNames(total), function (prop) {
                        if (total[prop]) {
                            total[prop] = gridService.formatMoney(total[prop].toFixed(2));
                        }
                    });
                    if (parentColumnDefs[0].field) {
                        total[parentColumnDefs[0].field] = "Total:";
                    }
                    console.log("301 footerGrid total=", total);
                    console.log("301 footerGrid parentColumnDefs=", parentColumnDefs);
                    console.log("301 footerGrid resultDataList.length=", resultDataList.length);
                    if (resultDataList.length > 0) {
                        footerGrid.gridOptions.api.setRowData([total]);
                        //footerGrid.gridOptions.api.sizeColumnsToFit();
                    } else {
                        console.log("301 footerGrid no total=");
                        footerGrid.gridOptions.api.setRowData([]);
                        document.querySelector('#reportFooterGrid').style = "display:none";
                        //$(".search-criteria-editmode").hide();
                    }
                }
                //$(".search-criteria-editmode").hide();
            };

            var bindPivotReportFooterGrid = function (parentForm, parentColumnDefs, resultData, footerGrid, grid) {

                footerGrid.gridOptions.columnDefs = [];
                footerGrid.gridOptions.api.setColumnDefs(parentColumnDefs);
                footerGrid.gridOptions.api.setRowData([]);
                resultData[parentColumnDefs[0].field] = "Total:";
                footerGrid.gridOptions.api.setRowData([resultData]);

                //var allColumnIds = [];
                //footerGrid.gridOptions.columnApi.getAllColumns().forEach(function (column) {
                //    allColumnIds.push(column.colId);
                //});
                //footerGrid.gridOptions.columnApi.autoSizeColumns(allColumnIds);
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

            var getFieldByStickyKey = function (sections, stickyKey) {
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

                                if (field.stickyKey === stickyKey) {//} "reportGrid") {
                                    mfield = field;
                                    return mfield;
                                }

                            });
                        });
                    });
                });
                return mfield;
            };

            var getSelectedValueByModelKey = function (sections, modelKey) {
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
                                    field.disabled = false;
                                    field.modelValue = modelValue;

                                }
                                else if (field.fieldType === 'date') {
                                    var beginDate = moment().subtract(1, 'day').toDate();
                                    field.modelValue = dateUtilService.convertToDateFormat(moment(beginDate));
                                }
                                else if (field.fieldType === 'dropdown') {

                                    if (field.ismultiple) {
                                        field.setSelectedIndex(field.selectedIndex);
                                    }
                                    else {
                                        if (field.defaultValue === undefined) {
                                            field.defaultselectedindex = field.defaultselectedindex;
                                        }
                                        else {
                                            field.modelValue = field.defaultValue;
                                        }
                                    }
                                    field["SelectedText"] = field.getSelectedText();
                                    console.log(field.SelectedText);
                                }
                                else if (field.fieldType === 'nesteddrop') {
                                    field.modelValue = field.setDefaultValue();
                                }
                                else if (field.fieldType === "listbox") {
                                    var reportByField = getFieldByModelKey(parentForm.sections, "reportBy");
                                    field.options = reportByField.modelValue;
                                    var reportByListboxField = form.getFieldByModelKey('reportByMulti');
                                    var reportByModelValue = reportByField.modelValue;
                                    reportByListboxField.modelValue = reportByModelValue;
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

            this.showAdvancedOptions = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event, selectedItem) {
                $(".hideShow").toggle();
                if ($(".fa-search-plus").length > 0) {
                    $(".fa-search-plus").addClass("fa-search-minus");
                    $(".fa-search-minus").removeClass("fa-search-plus");
                }
                else {
                    $(".fa-search-minus").addClass("fa-search-plus");
                    $(".fa-search-plus").removeClass("fa-search-minus");
                }
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
                        var url = "report/run/xlsx/1002/" + reportCode;
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
                        var url = "report/run/pdf/1002/" + reportCode;
                        overlay.load();
                        httpService.openFileByPost(url, payload, "pdf", reportCode + ".pdf").then(function (results) {
                            console.log("file downloaded=", results);
                            overlay.hide();
                        });
                        // return defer.promise;
                    }
                }

            };

            this.bindStickyDataToFields = function (stickyData, sections) {
                if (!stickyData) {
                    overlay.hide();
                    return;
                }
                var field;
                angular.forEach(Object.getOwnPropertyNames(stickyData), function (key, keyIndex) {
                    console.log("value, fieldKey=", key, stickyData[key]);
                    var stickyValue = stickyData[key];
                    if (key === "reportBy") {
                        field = getFieldByModelKey(sections, key);
                    }
                    else {
                        field = getFieldByStickyKey(sections, key);
                    }

                    console.log("field=", field);

                    if (field.fieldType === "dropdown") {
                        var options;
                        var matchedoption = [];
                        if (field["ismultiple"]) {
                            options = field.options;
                            angular.forEach(stickyValue, function (value, index) {
                                angular.forEach(options, function (option) {
                                    if (option.value === value) {
                                        matchedoption.push(option);
                                    }
                                });
                            });

                            if (matchedoption.length > 0) {
                                field.modelValue = matchedoption;
                            }
                            else {
                                field.setSelectedIndex(field.selectedIndex);
                            }

                            if (key === "reportBy") {
                                var reportByMultiField = getFieldByModelKey(sections, "reportByMulti");
                                reportByMultiField.options = field.modelValue;
                                reportByMultiField.modelValue = field.modelValue;
                            }

                        }
                        else {
                            options = field.options;
                            var itemText;
                            matchedoption = _.filter(options, function (items) {
                                if (items.value === stickyValue) {
                                    itemText = items.text;
                                }
                                return items.value === stickyValue;
                            });
                            if (matchedoption.length > 0) {
                                field.modelValue = stickyValue;
                                field.SelectedText = itemText;
                            }
                            else {
                                if (field.defaultValue === undefined) {
                                    field.defaultselectedindex = field.defaultselectedindex;
                                }
                                else {
                                    field.modelValue = field.defaultValue;
                                }
                            }
                        }

                        if (field.fieldKey === "quickRange") {
                            if (field.modelValue === "custom_range") {
                                var dateRangeField = getFieldByStickyKey(sections, "reportPeriod");
                                dateRangeField.disabled = false;
                            }
                            else {
                                var dateRangeField = getFieldByStickyKey(sections, "reportPeriod");
                                dateRangeField.disabled = true;
                            }
                        }

                    }
                    else if (field.fieldType === "nesteddrop") {
                        if (stickyValue.length === 1 && stickyValue[0] === "") {
                            field.setDefaultValue();
                        }
                        else {
                            field.setModel(stickyValue, key);
                        }
                    }
                    else if (field.fieldType === "date") {
                        field.modelValue = dateUtilService.convertFromDBFormat(stickyValue);
                    }
                    else if (field.fieldKey === "reportPeriod") {
                        var dateRange = stickyValue.split(" - ");
                        var startDate = dateUtilService.convertToDateFormat(moment(dateRange[0]));
                        var endDate = dateUtilService.convertToDateFormat(moment(dateRange[1]));
                        var modelValue =
                            { "startDate": new moment(startDate, dateUtilService.DATE_FORMAT), "endDate": new moment(endDate, dateUtilService.DATE_FORMAT) };
                        field.modelValue = modelValue;
                    }

                });
                overlay.hide();
            };

            this.reportByDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event, selectedItem) {

                form = form || self.form;
                var reportByListboxField = form.getFieldByModelKey('reportByMulti');
                var reportByDropdownField = form.getFieldByModelKey('reportBy');
                var reportByModelValue = reportByDropdownField.modelValue;

                if (reportByDropdownField.modelValue === undefined) {
                    reportByListboxField.options = [];
                    reportByListboxField.modelValue = [];
                }
                else {
                    if (reportByDropdownField.modelValue["length"] <= 5) {
                        reportByListboxField.options = reportByModelValue;
                        reportByListboxField.modelValue = reportByModelValue;
                    }
                    else {
                        reportByDropdownField.modelValue = reportByListboxField.modelValue;
                        swal({
                            text: "Grouping is limited to 5",
                            icon: "info",
                            button: "Okay"
                        });
                    }
                }

            };

        }
        return reportService;
    });

    return angularAMD;
});