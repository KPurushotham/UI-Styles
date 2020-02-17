define(['angularAMD', 'utilService', 'ngHandsontable', 'alaSqlExtensions', 'httpService', 'authService', 'gridService', 'localPersistenceService', 'ngStorage', 'overlay'], function (angularAMD) {
    'use strict';

    angularAMD.factory('maildayService', function ($filter, $q, $timeout, alasql, utilService, hotRegisterer, $window,
        constants, dateUtilService, httpService, authService, gridService, localPersistenceService, _, overlay, $stateParams, $location) {

        function maildayService(form, menuDefinition) {
            var self = this;
            this.form = form;
            this.menuDefinition = menuDefinition;

            alasql.fn.convertdate = function (a) {
                if (a) {
                    return dateUtilService.convertToDateTimeFormat(a);
                }
            };

            alasql.fn.actionDatetime = function (a) {
                if (a) {
                    return dateUtilService.convertToDateTimeFormat(a);
                }
            };

            alasql.fn.convertStartdate = function (a) {
                if (a) {
                    var dateStr = a.lastUpdatedDate;
                    var sDate;
                    if (dateStr !== "" && dateStr !== null) {
                        sDate = moment(dateStr);
                    }
                    return dateUtilService.convertToDateTimeFormat(sDate);
                }
            };

            var campaignItemStatuses = {
                "TOTALINVOICES": ["ACCEPTED", "PENDING", "REJECTED"]
            };

            var emailStatusCategories = {
                "EMAILUNDELIVERD": ["SOFT_BOUNCE", "HARD_BOUNCE", "BLOCKED", "QUEUED"],
                "EMAILDELIVERD": ["COMPLAINT", "OPENED", "UNOPENED", "SENT"]
            };

            this.afterLoad = function (form, screenDefConfig) {
                var applicationObj = getFieldByModelKey(form.sections, "applicationId");
                var queryString = $location.search();
                var appInfo = form.getAppInfoByCode(form.AppsList, queryString["appCode"]);
                applicationObj.modelValue = appInfo.applicationId;

            };   

            this.refresh = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event, selectedItem) {             
                self.bindEmailDetails();
            };

            this.buildPayload = function (sections) {

                var fullPayload = {};                
                angular.forEach(sections.rowDivisions, function (row, index) {
                    var columns = row.columns;
                    angular.forEach(columns, function (column, index) {
                        var fields = column.fields;
                        angular.forEach(fields, function (field, index) {
                            var modelKey = field["fieldKey"];
                            if (field.modelValue !== "All") {
                                switch (field.fieldType) {
                                    case "dropdown":
                                        fullPayload["fk-" + modelKey] = field.modelValue;
                                        break;
                                    case "checkbox":
                                        fullPayload[modelKey] = field.modelValue === true ? 'true' : 'false';
                                        break;
                                    default:
                                        break;
                                }
                            }                          
                        });
                    });
                });
                return fullPayload;
            };

            this.bindEmailDetails = function () {
                overlay.load();
                var isProduction = $stateParams.isProduction;
                isProduction = $location.search()["isProduction"] || "t";

                var applicationObj = getFieldByKey("applicationId");

                if (applicationObj.modelValue === undefined || applicationObj.modelValue === "") {
                    var selectedApplicatonId = localPersistenceService.get("applicationId", true);
                    applicationObj.modelValue = selectedApplicatonId;
                }               

                var payload = self.buildPayload(self.form.sections[0]);
                payload["isProduction"] = isProduction;

                var serviceIdParams = self.form.ServiceIdParams;
                var url = "vdi/postget/" + serviceIdParams["apiCode"] + "/" + serviceIdParams["contextCode"] + "/" + serviceIdParams["serviceCode"];

                var gridData = self.form.getFieldByModelKey("gridData");
                var gridApi = gridData.gridOptions.api;
                var gridColumns = gridData.gridConfig.columns;

                httpService.post(url,payload).then(function (results) {
                    var dataset = results.data.dataset || [];

                    var res = alasql("SELECT *,convertdate(openDate)as OpendateTimeStamp,convertStartdate(campaignItemAdditionalInfo) as sentDate,  actionDatetime(actionDateTime)as actiontime FROM ?", [dataset]);
                    localPersistenceService.set("maildayGrid", res, true);
                    localPersistenceService.set("selctedInvoiceStatus", "", true);

                    if (res) {
                        gridApi.setRowData(res);
                        gridApi.sizeColumnsToFit();
                        getConslidatedData(dataset);
                    }
                    else {
                        self.bindEmailDetails();
                    }
                     overlay.hide();
                });
            };

            this.applicationChangeHandler = function (sourceField, parentForm) {
                var localPersistAppCode = localPersistenceService.get("emailApplications", true);
                var selectedItems = sourceField.getSelectedItem();
                var appCode;
                if (selectedItems.length > 0) {
                    var reportCode = selectedItems[0].item["emailApplications"];
                    appCode = (reportCode !== "") ? reportCode.replace("MAILDAY", "") : "";
                }
                if (appCode !== localPersistAppCode) {
                    localPersistenceService.set("emailApplications", appCode, true);
                    window.location.search = "?appCode=" + appCode;
                }
            };

            this.dropdownChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event, selectedItem) {           
                self.bindEmailDetails();
            };

            var getConslidatedData = function (mData) {
                var distinctCampaignItems = alasql('SELECT DISTINCT campaignItemApplicationObjectId,campaignItemActionStatus FROM ?', [mData]);

                var queryForCampaignItems = 'SELECT campaignItemActionStatus as statusCode, COUNT(DISTINCT campaignItemApplicationObjectId) AS statusCount FROM ? WHERE campaignItemActionStatus  IN @(?) GROUP BY campaignItemActionStatus';
                populateStatusGaugeModel(campaignItemStatuses, distinctCampaignItems, queryForCampaignItems, "statusCode");

                buildEmailStatusGauges(mData);
            };

            var buildEmailStatusGauges = function (dataset) {
                var emailTotalModel = {};
                emailTotalModel["EMAILTOTAL"] = { max: dataset.length, value: dataset.length };
                setStatusGaugeModelByKey("EMAILTOTAL", emailTotalModel);

                var queryForEmailStatus = "SELECT campaignItemEmailStatus as statusCode, COUNT(*)  AS statusCount FROM ? WHERE campaignItemEmailStatus IN @(?) GROUP BY campaignItemEmailStatus ";
                populateStatusGaugeModel(emailStatusCategories, dataset, queryForEmailStatus, "statusCode");
                //   console.log("statuModel", statuModel);
            };

            var populateStatusGaugeModel = function (categoryMap, dataset, query, statusGroupKey) {
                angular.forEach(categoryMap, function (statuses, categoryCode) {

                    var statusTypeCounts = alasql(query, [dataset, statuses]);
                    var statusTypeCountMap = _.indexBy(statusTypeCounts, statusGroupKey);

                    var categoryCount = _.reduce(statusTypeCounts, function (total, item) { return total + item.statusCount; }, 0);
                    var categoryModel = {};
                    categoryModel[categoryCode] = { max: dataset.length, value: categoryCount };

                    setStatusGaugeModelByKey(categoryCode, categoryModel);

                    angular.forEach(statuses, function (statusCode) {
                        var model = {};
                        var statusCount = statusTypeCountMap[statusCode] ? statusTypeCountMap[statusCode].statusCount : 0;
                        model[statusCode] = { max: categoryCount, value: statusCount };
                        setStatusGaugeModelByKey(statusCode, model);
                    });
                });
            };

            var setStatusGaugeModelByKey = function (statusCode, model) {
                try {
                    getFieldByKey(statusCode).setModel(model);
                }
                catch (err) {
                    console.log("error=", err);
                }
            };

            this.setSelectedCssClass = function (statusName) {
                var possibleSelectedList = _.keys(campaignItemStatuses);
                possibleSelectedList.push(_.values(campaignItemStatuses));
                possibleSelectedList.push(_.keys(emailStatusCategories));
                possibleSelectedList.push(_.values(emailStatusCategories));
                possibleSelectedList = _.flatten(possibleSelectedList);

                angular.forEach(possibleSelectedList, function (status) {
                    var gauge = getFieldByKey(status);
                    console.log("statusName gauge ", gauge.cssClass);
                    gauge.cssClass = gauge.cssClass.replace("gaugeSelectedColor", "");
                });
                var gauge = getFieldByKey(statusName);
                console.log("statusName gauge ", gauge.cssClass);
                gauge.cssClass = gauge.cssClass + " gaugeSelectedColor ";
            };

            var resetGaugeModel = function (categoryMap) {
                angular.forEach(categoryMap, function (statuses, categoryCode) {
                    var categoryModel = {};
                    categoryModel[categoryCode] = { max: 0, value: 0 };
                    setStatusGaugeModelByKey(categoryCode, categoryModel);
                    angular.forEach(statuses, function (statusCode) {
                        var model = {};
                        model[statusCode] = { max: 0, value: 0 };
                        setStatusGaugeModelByKey(statusCode, model);
                    });
                });
            };

            var updateEmailStatusGauge = function (currentCampaignItemData) {
                resetGaugeModel(emailStatusCategories);
                buildEmailStatusGauges(currentCampaignItemData);
                //var queryForEmailStatus = "SELECT campaignItemEmailStatus as statusCode, COUNT(*)  AS statusCount FROM ? WHERE campaignItemEmailStatus IN @(?) GROUP BY campaignItemEmailStatus ";
                //populateStatusGaugeModel(emailStatusCategories, currentCampaignItemData, queryForEmailStatus, "statusCode");
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
                            angular.forEach(fields, function (field, index) {

                                if (field.fieldKey === modelKey) {
                                    mfield = field;
                                    return mfield;
                                }

                            });
                        });
                    });
                });
                return mfield;
            };

            this.selectedChangeGaugeHandler = function (sourceField, screenDefConfig, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                
                var gridData = this.form.getFieldByModelKey("gridData");
                var gridApi = gridData.gridOptions.api;
                var modelKey = sourceField.modelKey;
                var parentStatus = '';
                localPersistenceService.set("parentStatus", "", true);
                if (sourceField.modelKey === 'ACCEPTED' || sourceField.modelKey === 'REJECTED' || sourceField.modelKey === 'PENDING') {
                    var status = sourceField.modelKey;
                    localPersistenceService.set("parentStatus", status, true);
                }
                
                var mainData = localPersistenceService.get("maildayGrid", true);
                var selctedInvoiceStatus = localPersistenceService.get("selctedInvoiceStatus", true);
                parentStatus = localPersistenceService.get("parentStatus", true);

                var result = [];
                var statusCodes;
                if (modelKey === "TOTALINVOICES") {
                    sessionStorage.setItem("parentStatus", '');
                    selctedInvoiceStatus = modelKey;
                    result = mainData;
                    updateEmailStatusGauge(result);
                }
                else if (modelKey === "EMAILTOTAL") {
                    //   selctedInvoiceStatus = modelKey;
                    if (parentStatus !== "") {
                        result = alasql("SELECT * FROM ? WHERE campaignItemActionStatus= ?", [mainData, parentStatus]);
                        // result = alasql("SELECT * FROM ? WHERE campaignItemActionStatus= ?", [mainData, selctedInvoiceStatus]);
                        // result = alasql("SELECT * FROM ? WHERE campaignItemActionStatus= ?", [mainData, selctedInvoiceStatus] "and " , [parentStatus]);
                        // result = alasql("SELECT * FROM ? WHERE campaignItemActionStatus= ?", [mainData, selctedInvoiceStatus]);
                    }
                    else {
                        result = mainData;
                    }
                }
                else if (campaignItemStatuses["TOTALINVOICES"].includes(modelKey)) {
                    selctedInvoiceStatus = modelKey;
                    result = alasql("SELECT * FROM ? where campaignItemActionStatus= ?", [mainData, modelKey]);
                    updateEmailStatusGauge(result);
                }
                else if (_.keys(emailStatusCategories).includes(modelKey)) {
                    statusCodes = emailStatusCategories[modelKey];
                    if (parentStatus !== "") {
                        result = alasql("SELECT * FROM ? WHERE campaignItemActionStatus= ? AND campaignItemEmailStatus IN @(?)", [mainData, parentStatus, statusCodes]);
                    }
                    else {
                        result = alasql("SELECT * FROM ? where campaignItemEmailStatus IN @(?)", [mainData, statusCodes]);
                    }
                }
                else {
                    statusCodes = _.flatten(_.values(emailStatusCategories));
                    if (statusCodes.includes(modelKey)) {
                        statusCodes = emailStatusCategories[modelKey];
                        if (parentStatus !== "") {
                            result = alasql("SELECT * FROM ? WHERE campaignItemActionStatus= ? AND campaignItemEmailStatus =? ", [mainData, parentStatus, modelKey]);
                        }
                        else {
                            result = alasql("SELECT * FROM ? where campaignItemEmailStatus =?", [mainData, modelKey]);
                        }
                    }
                }
                gridApi.setRowData(result);
                gridApi.sizeColumnsToFit();
                //self.setSelectedCssClass(selctedInvoiceStatus);
                if (result.length > 0) {
                    self.setSelectedCssClass(selctedInvoiceStatus);
                }
            };
        }
        return maildayService;
    });

    return angularAMD;
});