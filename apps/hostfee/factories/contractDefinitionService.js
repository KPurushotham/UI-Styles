define(['angularAMD', 'utilService', 'ngHandsontable', 'alaSqlExtensions', 'httpService', 'authService', 'localPersistenceService', 'modalPopUpService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('contractDefinitionService', function ($filter, $q, $timeout, alasql, utilService, hotRegisterer, $window, constants,
        dateUtilService, httpService, overlay, authService, localPersistenceService, $stateParams, Notification, $rootScope, $state, fieldService, modalPopUpService) {

        function contractDefinitionService(form, menuDefinition) {
            this.form = form;
            this.isvalid = true;
            this.menuDefinition = menuDefinition;
            var self = this;
            var contractForm = this;
            var count = 0;

            this.afterLoad = function (form, screenDefConfig) {

                form = form || self.form;

                var pattern = self.form.currentMenuDefinition.pattern;

                var auth = localPersistenceService.get("auth", true);

                if (pattern === "FORM") {
                    self.isScreenCopyContractMode = false;
                    var genericTermsField;
                    var url;
                    var modeType = $stateParams["contractEntityId"];
                    if (modeType === "duplicateContract") {
                        self.isScreenCopyContractMode = true;
                        form.setScreenMode("ADD");
                        self["screenMode"] = form.screenMode;
                        var contractPeriodField = getFieldByKey("contractPeriod");
                        contractPeriodField.reset();
                        var contractTypeField = getFieldByKey("contractTypeCode");
                        var contractAgentField = getFieldByKey("contractAgentEntityId");
                        contractTypeField.modelValue = localPersistenceService.get("contractTypeCode", false);
                        contractAgentField.modelValue = localPersistenceService.get("contractAgentEntityId", false);
                        contractTypeField.disabled = true;
                        contractAgentField.disabled = true;
                        self["contractTypeCode"] = contractTypeField.modelValue;
                        setTrackLocFieldTitles();
                        genericTermsField = form.getFieldByModelKey("genericTerms");
                        url = "vdi/hostfees/corporation/genericterms?contractTypeCode=" + contractTypeField.modelValue;
                        httpService.get(url).then(function (results) {
                            var dataset = results.data.dataset || [];
                            var genericTermsArray = alasql('select genericTerms from ?', [dataset]);
                            var genericTerms = "";
                            angular.forEach(genericTermsArray, function (terms) {
                                genericTerms = genericTerms + terms.genericTerms;
                            });
                            genericTermsField.modelValue = genericTerms;
                        });
                        var excelGridField = getFieldByKey("contractDetails");
                        var contractDatafromCopy = localPersistenceService.get("copy_contract", false);
                        excelGridField.bindExcelData(contractDatafromCopy);
                    }
                    else {
                        if (form.screenMode === "ADD") {
                            self["screenMode"] = form.screenMode;
                            setTrackLocFieldTitles();
                            var contractTypeCodeField = form.getFieldByModelKey("contractTypeCode");
                            self["contractTypeCode"] = contractTypeCodeField.modelValue;
                            genericTermsField = form.getFieldByModelKey("genericTerms");
                            url = "vdi/hostfees/corporation/genericterms?contractTypeCode=" + contractTypeCodeField.modelValue;
                            httpService.get(url).then(function (results) {
                                var dataset = results.data.dataset || [];
                                var genericTermsArray = alasql('select genericTerms from ?', [dataset]);
                                var genericTerms = "";
                                angular.forEach(genericTermsArray, function (terms) {
                                    genericTerms = genericTerms + terms.genericTerms;
                                });
                                genericTermsField.modelValue = genericTerms;
                            });
                        }
                        else if (form.screenMode === "VIEW" || form.screenMode === "EDIT") {
                            self["screenMode"] = form.screenMode;
                            setTrackLocFieldTitles();
                        }
                    }
                }
                else {
                    var criteriaRows = form.criteria.rowDivisions;
                    var notificationicon = fieldService.getFieldDataByModelKey(criteriaRows[0].columns, "notificationicon");
                    var expiryDate = dateUtilService.convertToDBFormat(moment().add(notificationicon.expiryDays, 'days'));
                    var expiryUrl = "vdi/hostfees/contract/definition/expiry/contracts?iexpiryDate=" + expiryDate + "&itenantId=" + auth.tenantId + "&imonthsGap=" + notificationicon.monthsGap;
                    httpService.get(expiryUrl).then(function (results) {
                        var dataset = results.data.dataset || [];
                        var updatedDataSet = alasql('select * from ? order by daysDifference', [dataset]);
                        var expiryContractsData = [];
                        angular.forEach(updatedDataSet, function (data, index) {
                            var expiryContractText = data["contractAgentName"] + " - " + data["contractTypeName"] + " contract " + data["contractPeriod"] + " is about to expire in " + data["daysDifference"] + " days.";
                            expiryContractsData.push(expiryContractText);
                        });
                        notificationicon["notificationData"] = expiryContractsData;
                        notificationicon.dataCount = dataset.length;
                    });
                }

            };

            this.setScreenMode = function (mode) {
                this.form.setScreenMode(mode);
                var excelGridField = getFieldByKey("contractDetails");
                if (excelGridField) excelGridField.setEditableMode();
            };

            this.bulkCopy = function (sourceField, action, parentForm, bb) {

                var contractPeriodField = this.getFieldByKeyValue("contractPeriod", action.formDataModel.modalforms.bulkCopyPopUp.sections);
                contractPeriodField.modelValue = [];

                var gridInfo = getFieldByKeyInfo("gridData", action.sections);
                var selectedRows = gridInfo.gridOptions.api.getSelectedNodes();
                var data = [];
                angular.forEach(selectedRows, function (item, index) {
                    data.push(item.data);
                });
                var formModalData = {};
                formModalData["selectedContractsInfo"] = data;
                self.initalLoadFlagInContractPeriod = false;
                action.formDataModel.modalforms["bulkCopyPopUp"]["functionalService"] = action.functionalService;
                modalPopUpService.openDialog(action.formDataModel.modalforms["bulkCopyPopUp"], formModalData, this.form).then(function (res) {
                    res.popupInstance.rendered.then(function (aa) {
                        var selectedContractsInfo = self.getFieldByKeyValue("selectedContractsInfo", res.modalForm.sections);
                        selectedContractsInfo.gridOptions.api.forEachNodeAfterFilter(function (node) {
                            node.setSelected(true);
                            self.initalLoadFlagInContractPeriod = true;
                        });
                    });
                });
            };

            this.saveBulkContracts = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var contractPeriodField = this.getFieldByKeyValue("contractPeriod", parentForm.modalform.sections);

                var selectedContractsInfoGrid = this.getFieldByKeyValue("selectedContractsInfo", parentForm.modalform.sections);
                var gridApi = selectedContractsInfoGrid.gridOptions.api;
                var selectedRows = gridApi.getSelectedNodes();

                if (contractPeriodField.modelValue === undefined || contractPeriodField.modelValue.length === 0) {
                    alert("Please Select New Contract Period!");
                }
                else if (selectedRows.length === 0){
                    alert("Please check atleast one contract to create a new Contract!");
                }
                else {

                    var startDate = dateUtilService.convertToDBFormat(contractPeriodField.modelValue.startDate);
                    var endDate = dateUtilService.convertToDBFormat(contractPeriodField.modelValue.endDate);

                    var contractEntityIds = "";
                    angular.forEach(selectedRows, function (item, index) {
                        contractEntityIds = contractEntityIds + "," + item.data.contractEntityId;
                    });
                    contractEntityIds = contractEntityIds.substr(1);

                    var payload = {
                        "icontractEntityIds": contractEntityIds,
                        "inewStartDate": startDate,
                        "inewEndDate": endDate
                    };

                    var bulkSaveUrl = "vdi/hostfees/contract/batch/save";
                    overlay.load();
                    httpService.post(bulkSaveUrl, payload).then(function (results) {
                        if (results !== undefined) {
                            if (results.data.success === "true") {
                                Notification.success({
                                    message: "Data saved successfully.",
                                    title: 'Status',
                                    delay: 5000
                                });
                            }
                            else {
                                Notification.error({
                                    message: "Failed to save data.",
                                    title: 'Status',
                                    delay: 5000
                                });
                            }
                        }
                        else {
                            Notification.error({
                                message: "Failed to save data.",
                                title: 'Status',
                                delay: 5000
                            });
                        }
                        $timeout(function () {
                            angular.element('#getResultsButton').triggerHandler('click');
                        }, 0);
                        overlay.hide();
                    });
                }
                
            };

            this.bcContractPeriodChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                

                if (self.initalLoadFlagInContractPeriod === true) {
                    var startDate = dateUtilService.convertToDBFormat(sourceField.modelValue.startDate);
                    var endDate = dateUtilService.convertToDBFormat(sourceField.modelValue.endDate);

                    var selectedContractsInfoGrid = this.getFieldByKeyValue("selectedContractsInfo", parentForm.sections);
                    var gridApi = selectedContractsInfoGrid.gridOptions.api;
                    var gridData = [];
                    gridApi.forEachNode(function (node) {
                        gridData.push(node.data);
                    });
                    var selectedRows = gridApi.getSelectedNodes();
                    var contractEntityIds = "";
                    angular.forEach(gridData, function (item, index) {
                        contractEntityIds = contractEntityIds + "," + item.contractEntityId;
                    });
                    contractEntityIds = contractEntityIds.substr(1);
                    var payload = {
                        "icontractEntityIds": contractEntityIds,
                        "inewStartDate": startDate,
                        "inewEndDate": endDate
                    };

                    var validateUrl = "vdi/postget/hostfees/contract/batch/validation";
                    overlay.load();
                    httpService.post(validateUrl, payload).then(function (results) {
                        var dataSet = results.data.dataset;
                        console.log(dataSet);
                        console.log(gridData);
                        var updatedData = alasql('select data.contractEntityId, data.corpEntityId, data.corpName, data.contractAgentEntityId, \
                                                    data.contractAgentName, data.contractTypeCode, data.contractTypeName, data.createdDate, \
                                                    data.startDate, data.expiryDate, data.isPast, data.isCurrent, data.isFuture, data. additionalTerms, data.genericTerms, \
                                                    res.contractentityid as icontractEntityId, res.isvalidflag as isValidFlag, res.remarks as remarks, \
                                                    res.validcamappingentityids as iCAMappingEntityIds, res.contracttypecode as icontractType \
                                                    from ? as res inner join ? as data on res.contractentityid = data.contractEntityId ', [dataSet, gridData]);
                        gridApi.setRowData([]);
                        gridApi.setRowData(updatedData);
                        gridApi.forEachNodeAfterFilter(function (node) {
                            if (node.data.isValidFlag === 0) {
                                node.setSelected(false);
                            }
                            else {
                                node.setSelected(true);
                            }

                        });
                        overlay.hide();
                    });
                }

            };

            //This handler is just to massage the data service model and set to view.
            this.populateViewServiceDataModel = function (modelToBeSet) {
                console.log("I am through contractDefinitionService.populateViewServiceDataModel", modelToBeSet);
                if (modelToBeSet.contractAdditionalTerms.length !== 0) {
                    if (modelToBeSet.contractAdditionalTerms[0].additionalTerms === "NAN") {
                        modelToBeSet.contractAdditionalTerms[0].additionalTerms = null;
                    }
                    if (modelToBeSet.contractAdditionalTerms[0].genericTerms === "NAN") {
                        modelToBeSet.contractAdditionalTerms[0].genericTerms = null;
                    }
                }
                self.getOneContractDetails = modelToBeSet;
                self.form.populateViewServiceDataModel(modelToBeSet);
            };

            this.printFromGrid = function (data, parentForm) {
                overlay.load();
                var selectedContractEntityId = data.contractEntityId;
                var tenantId = data.tenantId;
                //  var url = constants.api_url + "vdi/hostfees/exhibit/pdf/getone?contractEntityId=" + selectedContractEntityId + "&tenantId=" + tenantId;
                var url = constants.api_url + "report/run/pdf/1000/CONTRACT_EXHIBIT_A?contractEntityId=" + selectedContractEntityId;
                //urlNew =http://localhost:8081/report/run/pdf/1000/CONTRACT_EXHIBIT_A?contractEntityId=15383";

                //$window.open(url,"_self");
                httpService.openFile(url, null, "pdf").then(function (results) {
                    console.log("file downloaded");
                });
            };

            this.customActionColumn = function (column, columPropValue, params) {
                var handlerName = column["handlerName"];
                var value = params.value || "";
                if (params.node.field !== "contractAgentName") {
                    return '<a  data-handlerName="' + handlerName + '" data-action-type="' + columPropValue + '" class="' + column["actionIconClass"] + value + '"></a>';
                } else {
                    return "";
                }
            };

            this.runValidations = function (formServiceModel, operationType, parentForm) {
                var defer = $q.defer();
                var isValid = false;
                var contractDetails = formServiceModel.contractDetails;

                var msg = "";
                if (contractDetails === undefined) {
                    if (self.errorMsg !== undefined) {
                        msg = self.errorMsg;
                        self.errorMsg = undefined;
                    }
                    else {
                        msg = "Excel grid should not be empty.";
                    }
                    Notification.error({
                        message: msg,
                        title: 'REQUIRED FIELDS',
                        delay: 5000
                    });
                    overlay.hide();
                    defer.resolve(isValid);
                }
                else {
                    isValid = true;
                    defer.resolve(isValid);
                }

                return defer.promise;
            };

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                if (operationType === "EDIT") {
                    if (formServiceModel.contractAdditionalTerms.contractEntityId === null) {
                        formServiceModel.contractAdditionalTerms.contractEntityId = formServiceModel.contractEntityId;
                    }
                }
                return formServiceModel;
            };

            var setDefaultContractDetails = function () {
                var genericTerms = self.form.getFieldByModelKey('genericTerms');
                var additionalTerms = self.form.getFieldByModelKey('additionalTerms');
                if (additionalTerms.modelValue === "" || additionalTerms.modelValue === undefined) {
                    additionalTerms.modelValue = "NAN";
                }
                if (genericTerms.modelValue === "" || genericTerms.modelValue === undefined) {
                    genericTerms.modelValue = "NAN";
                }
            };

            this.sendEmail = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var gridInfo = parentForm.getFieldByModelKey("gridData");
                var selectedRows = gridInfo.gridOptions.api.getSelectedNodes();
                var data = [];
                angular.forEach(selectedRows, function (item, index) {
                    data.push(item.data);
                });
                var contractAgents = alasql("select * from ? as data group by data.contractAgentEntityId", [data]);
                var tenantId = localPersistenceService.get("tenantId", true);
                var payload = {
                    "apiUrl": constants.api_url + "public/report/run/pdf/1000/CONTRACT_EXHIBIT_A?tenantId=" + tenantId + "&contractEntityId",
                    "tenantId": tenantId,
                    "contractAgent": []
                };
                angular.forEach(contractAgents, function (entityId, index) {
                    var contract = {};
                    contract["contractAgentEntityId"] = entityId.contractAgentEntityId;
                    contract["contractEntityIds"] = [];
                    angular.forEach(data, function (item, index) {
                        if (entityId.contractAgentEntityId === item.contractAgentEntityId) {
                            contract.contractEntityIds.push(item.contractEntityId);
                        }
                    });
                    payload.contractAgent.push(contract);
                });
                console.log(payload);
                var url = "email/hostfee/exhibit/campaign/initiate";
                overlay.load();
                httpService.post(url, payload).then(function (result) {
                    overlay.hide();
                    if (result !== undefined) {
                        if (result.data[0].data.status === "SUCCESS") {
                            swal("Mail Status", "Mails sent Successfully", "success");
                        }
                        else {
                            swal("Mail Status", "Failed to Send Mails", "error");
                        }
                    }
                    else {
                        swal("Mail Status", "Failed to Send Mails", "error");
                    }
                });
            };

            var setter = false;
            this.dropDownChangeEvent = function (hot, data) {

                var allCells = hot.getCellsMeta();
                try {
                    if (!setter) {
                        setter = true;
                        var rowIndex = data[0][0];
                        var colName = data[0][1];

                        var columns = alasql("SELECT * FROM ? v1 WHERE v1.[row]=? AND v1.prop=? ", [allCells, rowIndex, colName]);
                        var colIndex = columns[0].col + 1;

                        var rowData = hot.getData(rowIndex, 13);
                        var currentRowData = rowData[rowData.length - 1];

                        var cellValueAt9 = currentRowData[9];
                        var cellValueAt10 = currentRowData[10];

                        if (data[0][3] === "% of") {
                            hot.setCellMeta(rowIndex, colIndex, 'readOnly', false);
                            hot.setCellMeta(rowIndex, colIndex + 1, 'format', "0.0000 %");
                            hot.setCellMeta(rowIndex, colIndex + 2, 'format', "0.0000 %");
                            hot.setCellMeta(rowIndex, colIndex + 2, 'readOnly', false);

                            hot.setDataAtCell(rowIndex, colIndex + 1, cellValueAt9);
                            hot.setDataAtCell(rowIndex, colIndex + 2, cellValueAt10);

                        }
                        else if (data[0][3] === "Flat") {
                            hot.setDataAtCell(rowIndex, colIndex, "");
                            hot.setCellMeta(rowIndex, colIndex, 'readOnly', true);
                            hot.setCellMeta(rowIndex, colIndex + 1, 'format', "$ 0.00");
                            hot.setCellMeta(rowIndex, colIndex + 2, 'format', "$ 0.00");
                            hot.setCellMeta(rowIndex, colIndex + 2, 'readOnly', true);

                            hot.setDataAtCell(rowIndex, colIndex + 1, cellValueAt9);
                            hot.setDataAtCell(rowIndex, colIndex + 2, 0.00000);
                        }

                    }
                    if (!setter && (colIndex === 10 || colIndex === 11)) {
                        setter = true;
                        rowData = hot.getData(rowIndex, 13);
                        currentRowData = rowData[rowData.length - 1];
                        var percentageRowData = currentRowData[7];
                        var cellValue = "";
                        if (percentageRowData === "% of") {
                            cellValue = data[0][3];

                        } else {
                            cellValue = data[0][3];
                        }
                        hot.setDataAtCell(rowIndex, colIndex - 1, cellValue);
                    }
                    else {
                        setter = false;
                    }

                }
                catch (err) {
                    console.log("111a error:-", err);
                }

            };

            this.applyFormatToSelectedRows = function () {
                var excelGridField = getFieldByKey("contractDetails");
                var hot = excelGridField.getExcelGridInstance();
                var excelData = excelGridField.getExcelData();
                setter = false;
                console.log("111a 12 applyFormatToSelectedRows excelData ", excelData);
                var colName = "";
                var allCells = hot.getCellsMeta();
                try {
                    angular.forEach(excelData, function (v, i) {
                        var rowIndex = i;
                        colName = Object.getOwnPropertyNames(v)[0] + ".calcType";
                        var columns = alasql("SELECT * FROM ? v1 WHERE v1.[row]=? AND v1.prop=? ", [allCells, rowIndex, colName]);
                        var colIndex = columns[0].col + 1;
                        var calcType = v[Object.getOwnPropertyNames(v)[0]]["calcType"];

                        if (calcType === "% of") {
                            hot.setCellMeta(rowIndex, colIndex, 'readOnly', false);
                            hot.setCellMeta(rowIndex, colIndex + 1, 'format', "0.0000 %");
                            hot.setCellMeta(rowIndex, colIndex + 2, 'format', "0.0000 %");
                            hot.setCellMeta(rowIndex, colIndex + 2, 'readOnly', false);
                            self.dropDownChangeEvent(hot, [[rowIndex, colName, "Flat", "% of"]]);
                        }
                        else if (calcType === "Flat") {
                            hot.setDataAtCell(rowIndex, colIndex, "");
                            hot.setCellMeta(rowIndex, colIndex, 'readOnly', true);
                            hot.setCellMeta(rowIndex, colIndex + 1, 'format', "$ 0.00");
                            hot.setCellMeta(rowIndex, colIndex + 2, 'format', "$ 0.00");
                            hot.setCellMeta(rowIndex, colIndex + 2, 'readOnly', true);
                            self.dropDownChangeEvent(hot, [[rowIndex, colName, "% of", "Flat"]]);
                        }

                    });
                }
                catch (err) {
                    console.log("catch error:-", err);
                }

            };

            this.selectAllCheckBoxHandler = function (flag) {
                var selectAllCheckBox = getFieldByKey("selectAll");
                if (flag) {
                    selectAllCheckBox.modelValue = true;
                }
                else {
                    selectAllCheckBox.modelValue = false;
                }
            };

            this.viewContract = function (data, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var urlParamKeyList = [];
                var urlParamValuesList = {};
                var rowKeys = parentForm.formDataModel.rowKey;
                for (var key in rowKeys) {
                    urlParamValuesList[key] = data[key];
                    urlParamKeyList.push("/:" + key);
                }
                var urlParams = urlParamKeyList.join("");
                var nagivateScreenState = parentForm.formDataModel.editScreenState + urlParams;
                $state.go(nagivateScreenState, urlParamValuesList);
            };

            this.editContract = function (data, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var urlParamKeyList = [];
                var urlParamValuesList = {};
                var rowKeys = parentForm.formDataModel.rowKey;
                for (var key in rowKeys) {
                    urlParamValuesList[key] = data[key];
                    urlParamKeyList.push("/:" + key);
                }
                var urlParams = urlParamKeyList.join("");
                var nagivateScreenState = parentForm.formDataModel.editScreenState + urlParams;
                $state.go(nagivateScreenState, urlParamValuesList);
            };

            this.dupilcateContractFromListingScreen = function (rowData, parentForm, parentSection, sectionDataModel, screenMetadata, event) {
                console.log("copyContract=", rowData);
                var urlParamKeyList = ["/:contractEntityId"];
                var urlParamValuesList = {
                    "contractEntityId": "duplicateContract"
                };
                var urlParams = urlParamKeyList.join("");
                var nagivateScreenState = parentForm.formDataModel.editScreenState + urlParams;

                var queryParamsValue = rowData.contractEntityId;
                var contractTypeCode = rowData.contractTypeCode;
                var contractAgentEntityId = rowData.contractAgentEntityId;
                localPersistenceService.set("contractTypeCode", contractTypeCode, false);
                localPersistenceService.set("contractAgentEntityId", contractAgentEntityId, false);
                var promiseObj = self.getContractData(queryParamsValue, contractTypeCode);

                promiseObj.then(function (isvalid) {
                    if (isvalid) {
                        $state.go(nagivateScreenState, urlParamValuesList);
                    }
                });

            };

            this.dupilcateContractFromViewScreen = function (rowData, screenState) {
                console.log("copyContract=", rowData);
                var urlParamKeyList = ["/:contractEntityId"];
                var urlParamValuesList = {
                    "contractEntityId": "duplicateContract"

                };
                var urlParams = urlParamKeyList.join("");
                var nagivateScreenState = screenState + urlParams;

                var queryParamsValue = rowData.contractEntityId;
                var contractTypeCode = rowData.contractTypeCode;
                var contractAgentEntityId = rowData.contractAgentEntityId;
                localPersistenceService.set("contractTypeCode", contractTypeCode, false);
                localPersistenceService.set("contractAgentEntityId", contractAgentEntityId, false);
                var promiseObj = self.getContractData(queryParamsValue, contractTypeCode);

                promiseObj.then(function (isvalid) {
                    if (isvalid) {
                        $state.go(nagivateScreenState, urlParamValuesList);
                    }
                });

            };

            this.getContractData = function (contractEntityId, contractTypeCode) {
                var url = "vdi/hostfees/contract/definition/getone?contractEntityId=" + contractEntityId;
                var defer = $q.defer();
                httpService.get(url).then(function (results) {
                    var dataset = results.data.dataset;
                    var formatedContractDetails = self.setContractDetails(dataset[0], contractTypeCode, true);
                    localPersistenceService.set("copy_contract", formatedContractDetails, false);
                    defer.resolve(true);
                });

                return defer.promise;
            };

            this.setContractDetails = function (excelGridData, contractTypeCode, copyContractsFlag) {
                if (!excelGridData) return;
                console.log("Contract Defination 20016 in setContractDetails");
                console.log("excelGridData ", excelGridData);
                self.getOneData = excelGridData;
                var contractDetails = excelGridData["contractDetails"] || contractDetails;
                console.log("setContractDetailsExcelDataInput", contractDetails);
                var contractType = self["contractTypeCode"] || contractTypeCode;
                //var contractEntityId = 
                var selectColumnKeys = 'contractEntityId, contractAgentEntityId, corpEntityId, hostEntityId, hostName, breedTypeCode';
                if (contractType === 'E') {
                    selectColumnKeys += ', IFNULL(trackName, "All") AS hostPartyName, trackEntityId AS hostPartyEntityId, IFNULL(locName, "All") AS agentPartyName, locEntityId AS agentPartyEntityId';
                }
                else {
                    selectColumnKeys += ', IFNULL(trackName, "All") AS agentPartyName, trackEntityId AS agentPartyEntityId, IFNULL(locName, "All") AS hostPartyName, locEntityId AS hostPartyEntityId';
                }
                if (contractDetails && angular.isArray(contractDetails)) {
                    var query = "";
                    if (copyContractsFlag) {
                        query = 'SELECT ' + selectColumnKeys + ', \
                            terms, ARRAY({ distributionEntityId: distributionEntityId, \
                            condition: condition, calcType:calcType, amount:amount, convAmount:convAmount, exAmount:exAmount,id:id }) AS distributions \
                            FROM ? GROUP BY contractEntityId, contractAgentEntityId, corpEntityId, hostEntityId, trackEntityId, \
                            locEntityId, breedTypeCode, terms, hostName, trackName, locName';
                    }
                    else {
                        query = 'SELECT ' + selectColumnKeys + ',convertFromDBFormat(beginDate) AS beginDate, convertFromDBFormat(endDate) AS endDate, \
                            terms, ARRAY({ distributionEntityId: distributionEntityId, \
                            condition: condition, calcType:calcType, amount:amount, convAmount:convAmount, exAmount:exAmount,id:id }) AS distributions \
                            FROM ? GROUP BY contractEntityId, contractAgentEntityId, corpEntityId, hostEntityId, trackEntityId, \
                            locEntityId, breedTypeCode, beginDate, endDate, terms, hostName, trackName, locName';
                    }

                    console.log("setContractDetails");
                    contractDetails = alasql(query, [contractDetails]);
                    console.log("setContractDetailscontractDetails_alaAQL_output", contractDetails);
                    console.log("setContractDetails Output", contractDetails);
                }
                //self.afterLoad(contractDetails);

                angular.forEach(contractDetails, function (item, index) {
                    var distMap = _.indexBy(item.distributions, 'distributionEntityId');
                    delete item.distributions;
                    item = angular.extend(item, distMap);
                });

                self["contractDetailsDataFromService"] = contractDetails;
                console.log("Contract Defination 20017 in setContractDetails after self");
                console.log("excelGridData contractDetailsDataFromService", contractDetails);
                return contractDetails;
            };

            this.getContractDetails = function (excelGridData) {
                // var defer = $q.defer();
                var isValid = false;
                setDefaultContractDetails();
                var contractDetails = [];
                var corpDistributionIds = _.map(self["corpDistributions"], function (corpDistItem) {
                    return corpDistItem.value;
                });

                var corpDistributionNames = _.map(self["corpDistributions"], function (corpDistItem) {
                    var distributionsValues = corpDistItem['item'];
                    return distributionsValues;
                });

                var corpEntityIdField = getFieldByKey("corpEntityId");
                var corpEntityId = corpEntityIdField.modelValue;
                var contractAgentEntityIdField = getFieldByKey("contractAgentEntityId");
                var contractAgentEntityId = contractAgentEntityIdField.modelValue;
                var contractEntityId = $stateParams.contractEntityId === "duplicateContract" ? "" : $stateParams.contractEntityId;
                // Date Validation 
                var contractPeriod = getFieldByKey("contractPeriod");
                console.log("contractPeriod=", contractPeriod);
                var contractPeriodStartDate = dateUtilService.convertToTimeStamp(contractPeriod.modelValue.startDate);
                var contractPeriodEndDate = dateUtilService.convertToTimeStamp(contractPeriod.modelValue.endDate);

                var operationTypeValue = "INSERT";

                console.log("excelGridData=", excelGridData);
                var errorMsg = "";

                for (var i = 0; i < excelGridData.length; i++) {
                    var excelGridDataItem = excelGridData[i];

                    var contractDetailItemBeginDate = dateUtilService.convertToTimeStamp(excelGridDataItem["beginDate"]);
                    var contractDetailItemEndDate = dateUtilService.convertToTimeStamp(excelGridDataItem["endDate"]);

                    for (var j = 0; j < corpDistributionIds.length; j++) {

                        //if (contractDetailItemBeginDate >= contractPeriodStartDate && contractDetailItemEndDate <= contractPeriodEndDate) {
                        //if ((contractPeriodStartDate >= contractDetailItemBeginDate) && (contractPeriodEndDate >= contractDetailItemEndDate)){
                        //    isValid = true;

                        if (contractDetailItemBeginDate <= contractDetailItemEndDate) {

                            var distId = corpDistributionIds[j];
                            var contractDetailItem = angular.copy(excelGridDataItem[distId]);

                            contractDetailItem = angular.extend({}, contractDetailItem);
                            if (distId === corpDistributionNames[j].distributionEntityId) {
                                //    if (corpDistributionNames[j].distributionCode == 'HF') {
                                contractDetailItem["convAmount"] = parseFloat(contractDetailItem.convAmount) || 0;
                                contractDetailItem["exAmount"] = parseFloat(contractDetailItem.exAmount) || 0;
                                //     } else {
                                contractDetailItem["amount"] = parseFloat(contractDetailItem.amount) || 0;
                                contractDetailItem["condition"] = contractDetailItem.condition === "" ? null : contractDetailItem.condition;
                                //   }
                            }
                            if (self.isScreenCopyContractMode) {
                                operationTypeValue = "INSERT";
                                contractDetailItem["id"] = "";
                            }
                            else {
                                if (contractDetailItem["id"]) {
                                    operationTypeValue = "UPDATE";
                                } else {
                                    operationTypeValue = "INSERT";
                                }
                            }
                            contractDetailItem["hostEntityId"] = getHostEntityId(excelGridDataItem);

                            var locDropDownValue = getLocEntityId(excelGridDataItem);
                            if (locDropDownValue) {
                                contractDetailItem["locEntityId"] = locDropDownValue;
                            } else {
                                contractDetailItem["locEntityId"] = null;
                            }
                            var trackDropDownValue = getTrackEntityId(excelGridDataItem);
                            if (trackDropDownValue) {
                                contractDetailItem["trackEntityId"] = trackDropDownValue;
                            } else {
                                contractDetailItem["trackEntityId"] = null;
                            }

                            //  contractDetailItem["locEntityId"] = getLocEntityId(excelGridDataItem);
                            //  contractDetailItem["trackEntityId"] = getTrackEntityId(excelGridDataItem);

                            contractDetailItem["beginDate"] = dateUtilService.convertToDBFormat(excelGridDataItem["beginDate"]);
                            contractDetailItem["endDate"] = dateUtilService.convertToDBFormat(excelGridDataItem["endDate"]);
                            contractDetailItem["terms"] = excelGridDataItem["terms"];
                            contractDetailItem["breedTypeCode"] = excelGridDataItem["breedTypeCode"];
                            contractDetailItem["distributionEntityId"] = distId;
                            contractDetailItem["contractEntityId"] = contractEntityId;
                            contractDetailItem["corpEntityId"] = corpEntityId;
                            contractDetailItem["contractAgentEntityId"] = contractAgentEntityId;
                            contractDetailItem["operationType"] = operationTypeValue;
                            //contractDetailItem["exAmount"] = parseFloat(contractDetailItem.exAmount);
                            //contractDetailItem["amount"] = parseFloat(contractDetailItem.amount);
                            //  if (contractDetailItem.hostEntityId && contractDetailItem.trackEntityId && contractDetailItem.locEntityId) {
                            contractDetails.push(contractDetailItem);
                            //    }
                            // else {
                            //     var Host = excelGridDataItem["hostEntityId"];
                            //     var Locations = excelGridDataItem["locEntityId"];
                            //     var Tracks = excelGridDataItem["trackEntityId"];


                            //     errorMsg =  "Host, Locations & Tracks Are Mandatory Fields"
                            //     break;
                            // }
                            //contractDetails.push(contractDetailItem);
                        }
                        else {
                            var excelBeginDate = excelGridDataItem["beginDate"];
                            var excelEndDate = excelGridDataItem["endDate"];
                            errorMsg = "Contract Begin Date " + excelBeginDate + " & End Date " + excelEndDate + " are not Valid";
                            break;
                        }
                        //}
                        //else {
                        //    var beginDate = excelGridDataItem["beginDate"];
                        //    var endDate = excelGridDataItem["endDate"];
                        //    errorMsg = "Contract Begin Date " + beginDate + " & End Date " + endDate + " in Excel should be In Contract Period Range";
                        //    break;
                        //}
                    }
                }

                if (errorMsg !== "") {
                    self.errorMsg = errorMsg;
                    contractDetails = [];
                }
                console.log("contractDetails=", contractDetails);
                //  return defer.promise;
                return contractDetails;
            };

            this.contractTypeHanlder = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                console.log("Contract Defination 20001 in Contract Type Handler");
                var contractType = sourceField.modelValue;
                self["contractTypeCode"] = contractType;

                if (parentForm.screenMode === "ADD") {
                    swal({
                        title: "Are you sure?",
                        text: "Unsaved data will be lost!",
                        icon: "warning",
                        buttons: true,
                        dangerMode: true
                    })
                        .then((confirmflag) => {
                            if (confirmflag) {
                                setTrackLocFieldTitles();
                                var fieldModelKeysToReset = ["contractAgentEntityId", "contractDetails", "hosts", "tracks", "locations", "valueToApply", "calcCondition", "calcType", "hostFeeDistributions", "distributionGlobal", "calcActionType", "contractPeriod"];
                                angular.forEach(fieldModelKeysToReset, function (modelKey, ind) {
                                    var field = getFieldByKey(modelKey);
                                    if (field.fieldType === "dropdown") {
                                        if (field.ismultiple) {
                                            field.options = [];
                                            field.reset();
                                            field.modelValue = null;
                                        }
                                        else {
                                            field.modelValue = [];
                                        }
                                    }
                                    else if (field.fieldType === "excel-grid") {
                                        field.reset();
                                    }
                                    else if (field.fieldType === "number") {
                                        field.modelValue = null;
                                    }
                                    //else if (field.fieldType === "daterange") {
                                    //    field.setDefaultValue();
                                    //    var start = field.modelValue.startDate;
                                    //    var end = field.modelValue.endDate;
                                    //    var modelValue = {
                                    //        "startDate": start,
                                    //        "endDate": end
                                    //    };
                                    //    field.modelValue = modelValue;                                
                                    //}
                                });

                                var corpEntityIdField = getFieldByKey("corpEntityId");

                                if (corpEntityIdField.modelValue) {
                                    self.corporationChangeHandler(corpEntityIdField, parentForm, parentSection, sectionDataModel, formDataModel, event);
                                }

                                var genericTermsField = getFieldByKey("genericTerms");
                                var url = "vdi/hostfees/corporation/genericterms?contractTypeCode=" + contractType;
                                httpService.get(url).then(function (results) {
                                    var dataset = results.data.dataset || [];
                                    var genericTermsArray = alasql('select genericTerms from ?', [dataset]);
                                    var genericTerms = "";
                                    angular.forEach(genericTermsArray, function (terms) {
                                        genericTerms = genericTerms + terms.genericTerms;
                                    });
                                    genericTermsField.modelValue = genericTerms;

                                });
                                self["contractTypeCode"] = sourceField.modelValue;
                            }
                            else {
                                contractType = sourceField.modelValue;
                                if (contractType === 'I') {
                                    sourceField.modelValue = 'E';
                                }
                                else {
                                    sourceField.modelValue = 'I';
                                }
                                self["contractTypeCode"] = sourceField.modelValue;
                            }
                        });
                }

            };

            this.contractPeriodChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                if (sourceField.modelValue.length !== 0) {
                    if (self.contractPeriodResetFlag) {
                        self.contractPeriodResetFlag = false;
                        return;
                    }
                    else {
                        if (parentForm.screenMode === "ADD") {
                            self["screenMode"] = form.screenMode;
                            if (self.initalLoadFlagInContractPeriod) {
                                var excelGridField = getFieldByKey("contractDetails");
                                var contractAgentField = getFieldByKey("contractAgentEntityId");
                                var corporationField = getFieldByKey("corpEntityId");
                                filterCorpDistributionsAndRebuildExcelGridColumns();
                                if (excelGridField.getExcelData().length === 0 && (contractAgentField.modelValue === "" || contractAgentField.modelValue.length === 0)) {
                                    self.persistedCPModelValue = sourceField.modelValue;
                                    hostsAndHostPartiesDropdownsOptionsLoad(sectionDataModel, corporationField);
                                }
                                else if (excelGridField.getExcelData().length === 0 && contractAgentField.modelValue !== 0) {
                                    self.persistedCPModelValue = sourceField.modelValue;
                                    hostsAndHostPartiesDropdownsOptionsLoad(sectionDataModel, corporationField, contractAgentField);
                                }
                                else if (contractAgentField.modelValue !== 0) {
                                    if (self.isScreenCopyContractMode) {
                                        self.persistedCPModelValue = sourceField.modelValue;
                                        hostsAndHostPartiesDropdownsOptionsLoad(sectionDataModel, corporationField, contractAgentField);
                                    }
                                    else {
                                        swal({
                                            title: "Are you sure?",
                                            text: "Excel Grid will get repopulated since Contract Period has been modified!",
                                            icon: "warning",
                                            buttons: true,
                                            dangerMode: true
                                        })
                                        .then((confirmflag) => {
                                            if (confirmflag) {
                                                self.persistedCPModelValue = sourceField.modelValue;
                                                hostsAndHostPartiesDropdownsOptionsLoad(sectionDataModel, corporationField, contractAgentField);
                                            } else {
                                                sourceField.modelValue = self.persistedCPModelValue;
                                                self.contractPeriodResetFlag = true;
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

            };

            this.getFieldByKeyValue = function (modelKey, sections) {
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

                                if (field.modelKey === modelKey) {
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

                            if (field.modelKey === modelKey) {
                                mfield = field;
                                return mfield;
                            }
                        });

                    });
                });
                return mfield;
            };

            this.corporationChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                console.log("Contract Defination 20003  in Corporation Handler");
                if (parentForm.screenMode === "ADD") {
                    self["screenMode"] = parentForm.screenMode;
                }
                self.initalLoadFlagInContractPeriod = true;
                var contractPeriodField = getFieldByKey("contractPeriod");
                self.persistedCPModelValue = contractPeriodField.modelValue;
                var excelGridField = getFieldByKey("contractDetails");
                excelGridField.initializeExcelGridInstance();
                rebuildExcelGridColumns();

                getDistributionList(sectionDataModel).then(function (corpDistributions) {
                    console.log("Contract Defination 20004 in getDistributionsList");
                    filterCorpDistributionsAndRebuildExcelGridColumns(corpDistributions);
                    self.applyFormatToSelectedRows();
                    var screenUrl = window.location.href;
                    if (parentForm.screenMode === "VIEW" && !screenUrl.includes("duplicateContract")) {
                        if (!self.isScreenCopyContractMode) {
                            console.log("Contract Defination 20005 in before host and hosts parties method");
                            var contractAgentField = getFieldByKey("contractAgentEntityId");
                            hostsAndHostPartiesDropdownsOptionsLoad(sectionDataModel, sourceField, contractAgentField);
                        }
                    }
                    else {
                        if (!self.isScreenCopyContractMode) {
                            excelGridField.reset();
                            hostsAndHostPartiesDropdownsOptionsLoad(sectionDataModel, sourceField);
                        }
                    }
                });
            };

            this.contractAgentChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                if (!self.isScreenCopyContractMode) {
                    console.log("Contract Defination 20006 in contract Agent Handler");
                    var args = {};
                    if (parentForm.screenMode === "ADD") {
                        args["eventSourceField"] = sourceField;
                        var hostsField = getFieldByKey("hosts");
                        var caPartyField = getContractAgentPartyField();
                        var hostPartyField = getHostPartyField();
                        hostsField.modelValue = null;
                        hostPartyField.modelValue = null;
                        caPartyField.modelValue = null;
                        var corpEntityId = self.form.getFieldByModelKey("corpEntityId").modelValue;
                        var contractTypeCodeField = getFieldByKey("contractTypeCode");
                        var excelGridField = getFieldByKey("contractDetails");

                        if (contractTypeCodeField.modelValue === "E") {
                            var allTracks = localPersistenceService.get(corpEntityId + "_trackOptions", false);
                            hostPartyField.options = allTracks;
                        }
                        else {
                            var allLocations = localPersistenceService.get(corpEntityId + "_locationOptions", false);
                            hostPartyField.options = allLocations;
                        }

                        if (sourceField.modelValue.length === 0 || sourceField.modelValue === []) {
                            excelGridField.reset();
                            caPartyField.options = [];
                        }
                        else {
                            if (excelGridField.getExcelData().length !== 0) {
                                swal({
                                    title: "Are you sure?",
                                    text: "Excel Grid will get repopulated since Contract Agent has been modified!",
                                    icon: "warning",
                                    buttons: true,
                                    dangerMode: true
                                })
                                .then((confirmflag) => {
                                    if (confirmflag) {
                                        self.persistedCAModelValue = sourceField.modelValue;
                                        agentPartiesOptionsLoadAndExcelGridDataBind(sectionDataModel, sourceField);
                                    } else {
                                        sourceField.modelValue = self.persistedCAModelValue;
                                    }
                                });
                            }
                            else {
                                self.persistedCAModelValue = sourceField.modelValue;
                                agentPartiesOptionsLoadAndExcelGridDataBind(sectionDataModel, sourceField);
                            }
                        }
                    }
                }
            };

            var hostsAndHostPartiesDropdownsOptionsLoad = function (sectionDataModel, corporationField, contractAgentField) {
                console.log("Contract Defination 20007 in host and hosts parties method");
                var args = {};
                args["eventSourceField"] = corporationField;
                var corpEntityId = sectionDataModel["corpEntityId"];
                var hostsField = getFieldByKey("hosts");
                hostsField.modelValue = null;
                hostsField.loadFieldData(null, sectionDataModel, args).then(function (hostFieldOptions) {
                    console.log("Contract Defination 20008 in hostsField load");
                    var hostPartyField = getHostPartyField();
                    hostPartyField.modelValue = null;
                    var contractTypeCodeField = getFieldByKey("contractTypeCode");
                    hostPartyField.runDependancy(contractTypeCodeField, "change", sectionDataModel, args).then(function (hostPartyOptions) {
                        console.log("Contract Defination 20009 in host parties load");
                        localPersistHostPartiesDropdownData(corpEntityId);
                        if (contractAgentField !== undefined) {
                            console.log("Contract Defination 20010 in hosts and hosts parties load before agent parties load");
                            agentPartiesOptionsLoadAndExcelGridDataBind(sectionDataModel, contractAgentField);
                        }
                    });
                });
            };

            var agentPartiesOptionsLoadAndExcelGridDataBind = function (sectionDataModel, contractAgentField) {
                console.log("Contract Defination 20011 in agent parties load and excel grid method");
                var args = {};
                args["eventSourceField"] = contractAgentField;
                var caPartyField = getContractAgentPartyField();
                caPartyField.modelValue = null;
                var excelGridField = getFieldByKey("contractDetails");
                var corpEntityId = sectionDataModel["corpEntityId"];
                if (contractAgentField.modelValue !== "") {
                    var contractTypeCodeField = getFieldByKey("contractTypeCode");
                    caPartyField.runDependancy(contractTypeCodeField, "change", sectionDataModel, args).then(function (agentPartiesOptions) {
                        caPartyField.options = alasql('select DISTINCT agentParties.text, agentParties.value from ? as agentParties', [agentPartiesOptions]);
                        localPersistAgentPartiesDropdownData(corpEntityId);
                        console.log("Contract Defination 20012 in contract agent options load");
                        if (self.screenMode === "ADD") {
                            if (agentPartiesOptions.length > 0) {
                                bindDataToExcelGrid(true, null);
                            }
                            else {
                                excelGridField.reset();
                                swal({
                                    text: "Contract Agent Locations/Tracks are not mapped to the selected Contract Agent with the given Contract Period. Please, visit Contract Agent Mapping and map Locations/Tracks!",
                                    icon: "info",
                                    button: "Okay"
                                });
                            }
                        }
                        else {
                            console.log("Contract Defination 20013 view before going to bind excel grid");
                            if (!self["contractDetailsDataFromService"]) {
                                console.log("self[contractDetailsDataFromService] if undefined");
                                self["contractDetailsDataFromService"] = self.setContractDetails(self.getOneContractDetails);
                            }
                            bindDataToExcelGrid(true, self["contractDetailsDataFromService"]);
                        }
                    });
                }
                else {
                    excelGridField.reset();
                }

            };

            this.hostsChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var corpEntityId = self.form.getFieldByModelKey("corpEntityId").modelValue;
                var hostsFieldModelValues = sourceField.modelValue;
                var filteredOptions = [];
                var allTracks = localPersistenceService.get(corpEntityId + "_trackOptions", false);
                var allLocations = localPersistenceService.get(corpEntityId + "_locationOptions", false);

                if (sectionDataModel["contractTypeCode"] === "E") {

                    var tracksField = getFieldByKey("tracks");
                    filteredOptions = [];
                    if (hostsFieldModelValues === undefined || hostsFieldModelValues === null) {
                        tracksField.options = allTracks;
                        tracksField.modelValue = [];
                    }
                    else {
                        if (hostsFieldModelValues.length === 0) {
                            tracksField.options = allTracks;
                            tracksField.modelValue = [];
                        }
                        else {
                            angular.forEach(hostsFieldModelValues, function (item, key) {
                                angular.forEach(allTracks, function (option, key) {
                                    if (item.value === option.item.hostEntityId) {
                                        filteredOptions.push(option);
                                    }
                                });
                            });
                            tracksField.options = filteredOptions;
                            tracksField.modelValue = filteredOptions;
                        }
                    }

                }
                else {

                    var locationsField = getFieldByKey("locations");
                    filteredOptions = [];
                    if (hostsFieldModelValues === undefined || hostsFieldModelValues === null) {
                        locationsField.options = allLocations;
                        locationsField.modelValue = [];
                    }
                    else {
                        if (hostsFieldModelValues.length === 0) {
                            locationsField.options = allLocations;
                            locationsField.modelValue = [];
                        }
                        else {
                            angular.forEach(hostsFieldModelValues, function (item, key) {
                                angular.forEach(allLocations, function (option, key) {
                                    if (item.value === option.item.hostEntityId) {
                                        filteredOptions.push(option);
                                    }
                                });
                            });
                            locationsField.options = filteredOptions;
                            locationsField.modelValue = filteredOptions;
                        }

                    }

                }

                if (parentForm.screenMode === "ADD" || parentForm.screenMode === "EDIT") {
                    if (self["readyForExcelBinding"]) {
                        console.log(sourceField);
                    }
                }
            };

            this.tracksChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                if (parentForm.screenMode === "ADD" || parentForm.screenMode === "EDIT") {
                    if (self["readyForExcelBinding"]) {
                        console.log(sourceField);
                    }
                }
            };

            this.locsChangeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                if (parentForm.screenMode === "ADD" || parentForm.screenMode === "EDIT") {
                    if (self["readyForExcelBinding"]) {
                        console.log(sourceField);
                    }
                }
            };

            this.distributionsHandle = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var distribution = getModelValueByModelKey('distributionGlobal');
                var distributionValue;
                if (distribution !== undefined) {
                    distributionValue = distribution[0].item['distributionCode'];
                }
                var hostFeeDistributions = getFieldByKey("hostFeeDistributions");
                if (distributionValue === 'HF') {
                    hostFeeDistributions.show = true;
                } else {
                    hostFeeDistributions.show = false;
                }

            };

            this.calcTypeHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var calModelValue = sourceField.modelValue;
                var calcConditionField = getFieldByKey("calcCondition");
                var hostFeeDistributionsField = getFieldByKey("hostFeeDistributions");

                if (calModelValue === 'P') {
                    calcConditionField.show = true;
                    hostFeeDistributionsField.options = [
                        {
                            "text": "Conv Amount",
                            "value": "CA"
                        },
                        {
                            "text": "EX Amount",
                            "value": "EA"
                        }
                    ];
                }
                else {
                    calcConditionField.show = false;
                    hostFeeDistributionsField.options = [
                        {
                            "text": "Conv Amount",
                            "value": "CA"
                        }
                    ];
                }
                calcConditionField.reset();

            };

            this.selectAllHandler = function (e, b, c) {
                var excelGridField = getFieldByKey("contractDetails");
                var data = excelGridField.getExcelData();
                var isSelected = e.modelValue === false || e.modelValue === "" || e.modelValue === undefined ? true : false;
                angular.forEach(data, function (item) {
                    item.rowSelect = isSelected;
                });
                excelGridField.rebindExcelData([], data);
            };

            this.removeSelectedHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var selectAllCheckBox = getFieldByKey("selectAll");
                var excelGridField = getFieldByKey("contractDetails");
                var excelData = excelGridField.getExcelData();
                var data = [];
                angular.forEach(excelData, function (item) {
                    if (item.rowSelect !== true) {
                        data.push(item);
                    }
                });
                excelGridField.rebindExcelData([], data);
                selectAllCheckBox.modelValue = false;
            };

            this.applyToSelectedHosts = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var excelGridField = getFieldByKey("contractDetails");
                var excelData = excelGridField.getExcelData();
                var selectedItems = _.filter(excelData, function (item) {
                    return item.rowSelect === true;
                });
                var actionTypeDropDown = getModelValueByModelKey("calcActionType");
                var calcCondition = getModelValueByModelKey("calcCondition");
                var calcTypeDropDowm = getModelValueByModelKey("calcType");
                var valueToApply = getModelValueByModelKey("valueToApply");
                var distributionGlobal = getModelValueByModelKey("distributionGlobal");
                var hostFeeDistributions = getModelValueByModelKey("hostFeeDistributions");

                if (actionTypeDropDown === undefined || valueToApply === "" || distributionGlobal === undefined) {
                    swal({
                        text: "All fields are required when applying to grid. Please select all fields!",
                        icon: "info",
                        button: "Okay"
                    });
                }
                else {
                    var calcType, actionType;
                    if (angular.isArray(calcTypeDropDowm)) {
                        calcType = calcTypeDropDowm[0].value;
                    }
                    if (angular.isArray(actionTypeDropDown)) {
                        actionType = actionTypeDropDown[0].value;
                    }

                    if (!distributionGlobal || !valueToApply || !actionType) return;
                    var distributionId; var distributionCode;
                    if (angular.isArray(distributionGlobal)) {
                        distributionId = distributionGlobal[0].value;
                        distributionCode = distributionGlobal[0].item.distributionCode;
                    }
                    else {
                        distributionId = distributionGlobal.value;
                        distributionCode = distributionGlobal.item.distributionCode;
                    }
                    valueToApply = parseFloat(valueToApply);
                    // var amountModelKey = distributionCode === 'HF' ? 'convAmount' : 'amount';
                    var amountModelKey = null; //distributionCode == 'HF' ? 'convAmount' : 'amount';
                    if (distributionCode === 'HF') {
                        if (hostFeeDistributions === undefined) {
                            swal({
                                text: "All fields are required when applying to grid. Please select all fields!",
                                icon: "info",
                                button: "Okay"
                            });
                        }
                        else {
                            if (hostFeeDistributions[0].value === 'CA') {
                                amountModelKey = 'convAmount';
                            }
                            else if (hostFeeDistributions[0].value === 'EA') {
                                amountModelKey = 'exAmount';
                            }
                        }
                    }
                    else {
                        amountModelKey = 'amount';
                    }
                    if (amountModelKey === null || amountModelKey === "") {
                        amountModelKey = 0;
                    }
                    angular.forEach(selectedItems, function (item, index) {
                        var currentValue = item[distributionId][amountModelKey];
                        console.log("currentValue=", currentValue);
                        if (currentValue) {
                            //  currentValue = parseInt(currentValue);
                            //  currentValue = parseFloat(Number(currentValue).toFixed(2));
                            currentValue = parseFloat(currentValue);
                        }
                        else {
                            currentValue = 0;
                        }
                        console.log("currentValue=", currentValue);
                        if (actionType === 'I') {
                            //   var setIValue = Number((currentValue + valueToApply).toFixed(2));
                            var setIValue = (currentValue + valueToApply);
                            console.log("setIValue=", setIValue);
                            item[distributionId][amountModelKey] = setIValue >= 0 ? setIValue : 0;
                        }
                        else if (actionType === 'D') {
                            //var setDValue = currentValue - valueToApply;
                            var setDValue = Number((currentValue - valueToApply).toFixed(2));
                            item[distributionId][amountModelKey] = setDValue >= 0 ? setDValue : 0;
                        }
                        else if (actionType === 'R') {
                            if (calcTypeDropDowm === undefined) {
                                swal({
                                    text: "All fields are required when applying to grid. Please select all fields!",
                                    icon: "info",
                                    button: "Okay"
                                });
                            }
                            else if (calcTypeDropDowm[0].value === "P" && calcCondition === undefined) {
                                swal({
                                    text: "All fields are required when applying to grid. Please select all fields!",
                                    icon: "info",
                                    button: "Okay"
                                });
                            }
                            else {
                                if (calcCondition !== undefined) {
                                    item[distributionId]["condition"] = calcCondition[0].text;
                                }
                                else {
                                    item[distributionId]["condition"] = "";
                                }
                                item[distributionId]["calcType"] = calcTypeDropDowm[0].text;
                                item[distributionId][amountModelKey] = valueToApply >= 0 ? valueToApply : 0;
                            }

                        }
                    });

                    console.log("111a selectedItems=", selectedItems);
                    console.log(excelData);
                    excelGridField.bindExcelData(excelData);
                    self.applyFormatToSelectedRows();
                }

            };

            this.addToExcelGrid = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                bindDataToExcelGrid(false, self["contractDetailsDataFromService"]);
            };

            this.saveWorkflow = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var contractEntityId = sourceField.form.urlParams["contractEntityId"];
                var auth = localPersistenceService.get("auth", true);
                var comments = parentForm.modalData["commnets"];
                var actionCode = parentForm.modalData["actionCode"];
                var workflowSaveUrl = "workflow/state/process/1000/CONTRACT/" + contractEntityId;
                var payload = {
                    actionCode: actionCode,
                    comments: comments
                };
                overlay.load();
                httpService.post(workflowSaveUrl, payload).then(function (results) {
                    sourceField.form.buildActionButtons(results, parentForm.modalData["previousActions"]);
                    overlay.hide();
                });
            };

            var bindDataToExcelGrid = function (intialExcelGridLoadFlag, excelData) {

                console.log("Contract Defination 20014 in bind excel grid");
                var contractType = self["contractTypeCode"];
                var hostsOptions = getOptionsByModelKey("hosts");
                var hostsModelValue = getModelValueByModelKey("hosts");

                var hostNameList = _.map(hostsOptions, function (item) {
                    return item.text;
                });

                var hostPartyField = getHostPartyField();
                var agentPartyField = getContractAgentPartyField();

                var hostPartiesOptions = hostPartyField.options || [];
                var agentPartiesOptions = agentPartyField.options || [];

                var hostPartiesModelValue = hostPartyField.modelValue || [];
                var agentPartiesModelValue = agentPartyField.modelValue || [];

                var hostPartyNameList = _.map(hostPartiesOptions, function (item) {
                    if (contractType === "E") {
                        return item.item.trackName;
                    }
                    else {
                        return item.item.locName;
                    }
                });
                var agentPartyNameList = _.map(agentPartiesOptions, function (item) {
                    return item.text;
                });

                var coreColIndexes = getCoreColumnIndexesInGrid();
                var excelGridField = getFieldByKey("contractDetails");

                var columnSources = [];

                var data = excelGridField.getExcelData();
                var dataSchema = getDataSchema(excelGridField.columns);
                var contractPeriod = getFieldByKey("contractPeriod").getModel();
                var hosts = hostsOptions || [];

                if (intialExcelGridLoadFlag) {
                    if (!excelData) {
                        if (self.isScreenCopyContractMode) {
                            data = buildDataToExcelGridWithContractPeriodToCopiedContracts(data, contractPeriod);
                        }
                        else {
                            data = buildDataToExcelGridWithDefaultOptions(hosts, hostPartiesOptions, data, contractPeriod, dataSchema, contractType);
                        }
                    }
                    else {
                        data = excelData;
                    }
                    console.log(data);
                }
                else {
                    hosts = hostsModelValue || [];
                    data = buildDataToExcelGridWithModelValues(hosts, hostPartiesModelValue, agentPartiesModelValue, data, hostPartiesOptions, agentPartiesOptions, contractPeriod, dataSchema, contractType);
                }

                //var chainData = _.chain(data);
                //hostNameList = chainData.map(function (item) { return item.hostName; }).uniq().value();
                //hostPartyNameList = chainData.map(function (item) { return item.hostPartyName; }).uniq().value();
                //agentPartyNameList = chainData.map(function (item) { return item.agentPartyName; }).uniq().value();
                columnSources[coreColIndexes.hostIndex] = hostNameList;
                columnSources[coreColIndexes.hostPartyIndex] = hostPartyNameList;
                columnSources[coreColIndexes.agentIndex] = agentPartyNameList;
                excelGridField.rebindExcelData(columnSources, data);
                console.log("Contract Defination 20015 after bind excel grid");

            };

            var buildDataToExcelGridWithDefaultOptions = function (hosts, hostPartiesOptions, data, contractPeriod, dataSchema, contractType) {
                var formatedDataToExcel = [];
                if (contractType === "E") {
                    formatedDataToExcel = alasql('SELECT hosts.value AS hostEntityId, hosts.text AS hostName, \
                                          hostPartiesOptions.value AS hostPartyEntityId, hostPartiesOptions.item.trackName AS hostPartyName \
                                         FROM ? hosts INNER JOIN ? hostPartiesOptions ON hosts.value=hostPartiesOptions.item.hostEntityId \
                                         ', [hosts, hostPartiesOptions]);
                }
                else {
                    formatedDataToExcel = alasql('SELECT hosts.value AS hostEntityId, hosts.text AS hostName, \
                                          hostPartiesOptions.value AS hostPartyEntityId, hostPartiesOptions.item.locName AS hostPartyName \
                                         FROM ? hosts INNER JOIN ? hostPartiesOptions ON hosts.value=hostPartiesOptions.item.hostEntityId \
                                         ', [hosts, hostPartiesOptions]);

                }

                if (formatedDataToExcel) {
                    var newDataRows = [];
                    angular.forEach(formatedDataToExcel, function (item, index) {
                        var defaultItem = angular.copy(dataSchema);
                        var beginDate = dateUtilService.convertFromDBFormat(contractPeriod["beginDate"]);
                        var endDate = dateUtilService.convertFromDBFormat(contractPeriod["endDate"]);

                        var newDataItem = angular.extend({}, defaultItem, {
                            "hostName": item.hostName, "hostEntityId": item.hostEntityId, "hostPartyEntityId": item.hostPartyEntityId,
                            "hostPartyName": item.hostPartyName, "agentPartyName": "All", "beginDate": beginDate, "endDate": endDate
                        });
                        newDataRows.push(newDataItem);
                    });
                    data = newDataRows;
                }
                return data;
            };

            var buildDataToExcelGridWithContractPeriodToCopiedContracts = function (data, contractPeriod) {
                var bDate = dateUtilService.convertFromDBFormat(contractPeriod.beginDate);
                var eDate = dateUtilService.convertFromDBFormat(contractPeriod.endDate);
                var formatedDataToExcel = [];
                angular.forEach(data, function (item, index) {
                    if (item.beginDate) {
                        item.beginDate = bDate;
                    }
                    else {
                        item["beginDate"] = bDate;
                    }
                    if (item.endDate) {
                        item.endDate = eDate;
                    }
                    else {
                        item["endDate"] = eDate;
                    }
                    formatedDataToExcel.push(item);
                });
                return formatedDataToExcel;
            };

            var buildDataToExcelGridWithModelValues = function (hosts, hostPartiesModelValue, agentPartiesModelValue, data, hostPartiesOptions, agentPartiesOptions, contractPeriod, dataSchema, contractType) {
                var formatedDataToExcel = [];
                if (hosts.length > 0 && hostPartiesModelValue.length > 0 && agentPartiesModelValue.length > 0) {

                    if (contractType === "E") {
                        formatedDataToExcel = alasql('SELECT hosts.text AS hostName, \
                                         IFNULL(hostPartiesModelValue.item.trackName, "All") AS hostPartyName,\
                                         hostPartiesModelValue.value AS hostPartyEntityId, \
                                         hostPartiesModelValue.item.hostEntityId AS hostEntityId, \
                                         agentPartiesModelValue.value AS agentPartyEntityId, \
                                         IFNULL(agentPartiesModelValue.text, "All") AS agentPartyName \
                                         FROM ?  hosts  \
                                         INNER JOIN ? hostPartiesModelValue ON hosts.value=hostPartiesModelValue.item.hostEntityId \
                                         CROSS JOIN ? agentPartiesModelValue \
                                       ', [hosts, hostPartiesModelValue, agentPartiesModelValue]);
                    }
                    else {
                        formatedDataToExcel = alasql('SELECT hosts.text AS hostName, \
                                         IFNULL(hostPartiesModelValue.item.locName, "All") AS hostPartyName,\
                                         hostPartiesModelValue.value AS hostPartyEntityId, \
                                         hostPartiesModelValue.item.hostEntityId AS hostEntityId, \
                                         agentPartiesModelValue.value AS agentPartyEntityId, \
                                         IFNULL(agentPartiesModelValue.text, "All") AS agentPartyName \
                                         FROM ?  hosts  \
                                         INNER JOIN ? hostPartiesModelValue ON hosts.value=hostPartiesModelValue.item.hostEntityId \
                                         CROSS JOIN ? agentPartiesModelValue \
                                       ', [hosts, hostPartiesModelValue, agentPartiesModelValue]);
                    }

                    if (agentPartiesOptions.length === agentPartiesModelValue.length) {
                        angular.forEach(formatedDataToExcel, function (item, index) {
                            data = _.filter(data, function (dataItem) {
                                if (dataItem.hostEntityId !== item.hostEntityId) {
                                    return dataItem;
                                }
                                else {
                                    if (dataItem.hostPartyEntityId !== item.hostPartyEntityId) {
                                        return dataItem;
                                    }
                                }
                            });
                        });
                    }

                    if (formatedDataToExcel) {

                        var newDataRows = [];
                        angular.forEach(formatedDataToExcel, function (item, index) {
                            var defaultItem = angular.copy(dataSchema);
                            var existedItems = _.filter(data, function (dataItem) {
                                return dataItem.hostEntityId === item.hostEntityId
                                    && dataItem.hostPartyEntityId === item.hostPartyEntityId && dataItem.agentPartyEntityId === item.agentPartyEntityId;
                            });
                            if (existedItems.length <= 0) {
                                var beginDate = dateUtilService.convertFromDBFormat(contractPeriod["beginDate"]);
                                var endDate = dateUtilService.convertFromDBFormat(contractPeriod["endDate"]);

                                var newDataItem = angular.extend({}, defaultItem, {
                                    "hostName": item.hostName, "hostEntityId": item.hostEntityId, "hostPartyEntityId": item.hostPartyEntityId,
                                    "hostPartyName": item.hostPartyName, "agentPartyEntityId": item.agentPartyEntityId, "agentPartyName": item.agentPartyName, "beginDate": beginDate, "endDate": endDate
                                });
                                newDataRows.push(newDataItem);
                            }
                        });
                        if (data && data[0] && data[0]["hostName"]) {
                            data = data.concat(newDataRows);
                        }
                        else {
                            data = newDataRows;
                        }
                    }
                }
                else {
                    swal({
                        text: "Hosts, Tracks and Locations dropdowns should not be empty when adding to grid, please select!",
                        icon: "info",
                        button: "Okay"
                    });

                }
                return data;
            };

            var buildDataToExcelGridWithGetOneData = function (excelData, hosts, hostPartiesOptions, agentPartiesOptions, contractType) {
                var data = [];
                if (contractType === "E") {
                    data = alasql('SELECT excelData.*, hosts.text AS hostName, \
                                            IFNULL(hostPartiesOptions.item.trackName, "All") AS hostPartyName, \
                                            IFNULL(agentPartiesOptions.text, "All") AS agentPartyName \
                                            FROM ? excelData \
                                            INNER JOIN ? hosts ON hosts.value = excelData.hostEntityId \
                                            LEFT OUTER JOIN ? hostPartiesOptions ON excelData.hostEntityId=hostPartiesOptions.item.hostEntityId AND excelData.hostPartyEntityId=hostPartiesOptions.value\
                                            LEFT OUTER  JOIN ? agentPartiesOptions ON excelData.agentPartyEntityId=agentPartiesOptions.value\
                                          ', [excelData, hosts, hostPartiesOptions, agentPartiesOptions]);

                }
                else {
                    data = alasql('SELECT excelData.*, hosts.text AS hostName, \
                                            IFNULL(hostPartiesOptions.item.locName, "All") AS hostPartyName, \
                                            IFNULL(agentPartiesOptions.text, "All") AS agentPartyName \
                                            FROM ? excelData \
                                            INNER JOIN ? hosts ON hosts.value = excelData.hostEntityId \
                                            LEFT OUTER JOIN ? hostPartiesOptions ON excelData.hostEntityId=hostPartiesOptions.item.hostEntityId AND excelData.hostPartyEntityId=hostPartiesOptions.value\
                                            LEFT OUTER  JOIN ? agentPartiesOptions ON excelData.agentPartyEntityId=agentPartiesOptions.value\
                                          ', [excelData, hosts, hostPartiesOptions, agentPartiesOptions]);

                }
                return data;
            };

            var localPersistHostPartiesDropdownData = function (corpEntityId) {
                console.log("All dropdown data stored");
                var contractTypeCode = self.form.getModelValueByModelKey('contractTypeCode');

                if (contractTypeCode === 'E') {
                    var tracks = self.form.getFieldByModelKey('tracks');
                    localPersistenceService.set(corpEntityId + "_trackOptions", tracks.options, false);
                }
                else {
                    var locations = self.form.getFieldByModelKey('locations');
                    localPersistenceService.set(corpEntityId + "_locationOptions", locations.options, false);
                }

            };

            var localPersistAgentPartiesDropdownData = function (corpEntityId) {
                console.log("All dropdown data stored");
                var contractTypeCode = self.form.getModelValueByModelKey('contractTypeCode');

                if (contractTypeCode === 'E') {
                    var locations = self.form.getFieldByModelKey('locations');
                    localPersistenceService.set(corpEntityId + "_locationOptions", locations.options, false);
                }
                else {
                    var tracks = self.form.getFieldByModelKey('tracks');
                    localPersistenceService.set(corpEntityId + "_trackOptions", tracks.options, false);
                }

            };

            this.initializeContractDetails = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
            };

            var getDataSchema = function (columns) {
                var dataSchema = {};
                angular.forEach(columns, function (col, index) {
                    var modeKeySplit = col.modelKey.split(/\./g);
                    var modelKey = modeKeySplit[modeKeySplit.length - 1];
                    var childSchema = dataSchema;
                    if (modeKeySplit.length > 1) {
                        dataSchema[modeKeySplit[0]] = dataSchema[modeKeySplit[0]] || {};
                        childSchema = dataSchema[modeKeySplit[0]];

                    }
                    if (modelKey.endsWith("calcType")) {
                        childSchema[modelKey] = '% of';
                    }
                    else if (modelKey.endsWith("condition")) {
                        childSchema[modelKey] = 'Handle';
                    }
                    else {
                        childSchema[modelKey] = null;
                    }
                });
                console.log("dataSchema", dataSchema);
                return dataSchema;
            };

            var filterCorpDistributionsAndRebuildExcelGridColumns = function (corpDistributions) {
                var contractPeriodField = getFieldByKey("contractPeriod");
                var contractPeriodStartDate = dateUtilService.convertFromDBFormat(contractPeriodField.modelValue.startDate);
                if (self.screenMode === "ADD") {
                    var distributionGlobalField = getFieldByKey("distributionGlobal");
                    corpDistributions = corpDistributions || self["corpDistributionOptions"];
                    corpDistributions = alasql('select * from ? as corpDist where corpDist.item.isActive = true', [corpDistributions]);
                    if (contractPeriodStartDate !== null) {
                        corpDistributions = _.filter(corpDistributions, function (data) {
                            return moment(data.item.beginDate) <= moment(contractPeriodStartDate) && moment(data.item.endDate) >= moment(contractPeriodStartDate);
                        });
                    }
                    if (corpDistributions.length === 0) {
                        swal({
                            text: "Please make sure atleast one Distribution available to define a contract!",
                            icon: "info",
                            button: "Okay"
                        });
                    }
                    distributionGlobalField.options = corpDistributions;
                }
                self["corpDistributions"] = corpDistributions;
                rebuildExcelGridColumns(corpDistributions);
            };

            var rebuildExcelGridColumns = function (corpDistributions) {
                var columns = getCoreColumns();
                console.log("getCoreColumns=", columns);
                corpDistributions = corpDistributions || self["corpDistributions"];
                var dynamicColumns = getDynamicColumns(corpDistributions);
                var dateAndTermsColumns = getDateAndTermsColumns();

                console.log("dateAndTermsColumns=", dateAndTermsColumns);

                columns = columns.concat(dynamicColumns, dateAndTermsColumns);

                var excelGridField = getFieldByKey("contractDetails");
                excelGridField.dataSchema = getDataSchema(columns);
                excelGridField.columns = columns;
                excelGridField.colHeaders = function (col, colItem) {
                    // var selectAll = function () {
                    //     alert("select all");
                    // }

                    // if (col == 3) {
                    //     var htmlCheckBox = '<input type="checkbox"  id="check" class="checker excelCheckALL"> Select All';
                    //     return htmlCheckBox;
                    // }
                    // switch (col) {
                    //     case 3:
                    //     var htmlCheckBox='<input type="checkbox"  id="check" class="checker excelCheckALL"> Select All';

                    //         return htmlCheckBox;
                    //     default:
                    //         return;  
                    // }
                };
                excelGridField.rebuildColumns(undefined, undefined, excelGridField.colHeaders);
                //excelGridField.hideColumns([0, 1, 2]);
                excelGridField.manualColumnWidthSetting();
            };

            var getDistributionList = function (sectionDataModel) {
                var defer = $q.defer();
                var distributionGlobal = getFieldByKey("distributionGlobal");
                if (distributionGlobal) {
                    var dynamicColumnSource = distributionGlobal.options;
                    if (!dynamicColumnSource || dynamicColumnSource.length === 0) {
                        var corpField = getFieldByKey("corpEntityId");
                        var args = {};
                        args["eventSourceField"] = corpField;
                        distributionGlobal.runDependancy(corpField, "change", sectionDataModel, args).then(function (dynamicColumnSource) {
                            self["corpDistributionOptions"] = dynamicColumnSource;
                            defer.resolve(dynamicColumnSource);
                        });
                    }
                    else {
                        self["corpDistributionOptions"] = dynamicColumnSource;
                        defer.resolve(dynamicColumnSource);
                    }
                }
                return defer.promise;
            };

            var getAmountColumnMap = function (distributionCode) {
                var commonAmountColumn = [{ "modelKey": "amount", "title": "Amount", type: 'numeric', format: "0,0.0000" }];
                var handleAmountColumns = [{ "modelKey": "convAmount", "title": "Conv Amount", type: 'numeric', format: "0,0.0000" },
                { "modelKey": "exAmount", "title": "Ex Amount", type: 'numeric', format: "0,0.0000" }];
                if (distributionCode === 'HF') {
                    return handleAmountColumns;
                }
                return commonAmountColumn;
            };

            var getDynamicColumns = function (distributions) {
                var dynamicColumns = [];
                var commonCalcColumns =
                    [
                        {
                            modelKey: "calcType",
                            title: "Calc Type",
                            type: "dropdown",
                            source: ["% of", "Flat"],
                            allowInvalid: false,
                            validator: "numberValidator",
                            strict: true
                        },
                        {
                            modelKey: "condition",
                            title: "Condition",
                            type: "dropdown",
                            source: ["Handle", "Takeout", ""],
                            validator: "numberValidator",
                            strict: true,
                            allowInvalid: false
                        }
                    ];

                angular.forEach(distributions, function (distributionItem, index) {
                    var distributionEntityId = distributionItem.item.distributionEntityId || "";
                    var distributionCode = distributionItem.item.distributionCode || "";
                    var distributionName = distributionItem.item.distributionName || "";
                    var distAmountColumns = getAmountColumnMap(distributionCode);
                    var distColumns = commonCalcColumns.concat(distAmountColumns);
                    angular.forEach(distColumns, function (item, key) {
                        var colTitle = distributionName + "<br/> " + item.title;
                        var colModelKey = distributionEntityId + '.' + item.modelKey;
                        dynamicColumns.push({
                            title: colTitle,
                            modelKey: colModelKey,
                            type: item.type,
                            source: item.source,
                            strict: item.strict,
                            allowInvalid: false,
                            width: 300,
                            format: item.format,
                            renderer: function () {
                                alert("aaa");
                            },
                            numericFormat: {
                                pattern: '$0,0.00',
                                culture: 'en-US' // this is the default culture, set up for USD
                            }
                        });
                    });

                });

                return dynamicColumns;
            };

            var getCoreColumns = function (columns) {
                columns = columns || [];
                var colIndexes = getCoreColumnIndexesInGrid();

                columns[0] = {
                    modelKey: "hostEntityId"
                };
                columns[1] = {
                    modelKey: "hostPartyEntityId"
                };
                columns[2] = {
                    modelKey: "agentPartyEntityId"
                };
                columns[colIndexes.rowSelectCheckIndex] = {
                    modelKey: "rowSelect",
                    type: "checkbox",
                    strict: true,
                    width: 10
                };
                columns[colIndexes.hostIndex] = {
                    title: "Host",
                    modelKey: "hostName",
                    type: "autocomplete",
                    strict: true,
                    width: 300
                };
                var hostPartyCol = getHostPartyGridColumn();
                columns[colIndexes.hostPartyIndex] = angular.extend({
                    type: "autocomplete",
                    strict: true,
                    width: 300
                }, hostPartyCol);

                var agentPartyCol = getContractAgentPartyGridColumn();
                columns[colIndexes.agentIndex] = angular.extend({
                    type: "autocomplete",
                    strict: true,
                    width: 300
                }, agentPartyCol);

                return columns;
            };

            var getDateAndTermsColumns = function () {
                var dateAndTermsColumns = [];

                dateAndTermsColumns.push({
                    title: "Begin Date",
                    modelKey: "beginDate",
                    type: "date",
                    dateFormat: dateUtilService.DATE_FORMAT,
                    correctFormat: true,
                    defaultDate: '01/01/1900',
                    allowEmpty: false,
                    width: 300
                });
                dateAndTermsColumns.push({
                    title: "End Date",
                    modelKey: "endDate",
                    type: "date",
                    dateFormat: dateUtilService.DATE_FORMAT,
                    correctFormat: true,
                    defaultDate: '01/01/1900',
                    allowEmpty: false,
                    width: 300
                });
                dateAndTermsColumns.push({
                    title: "Terms",
                    modelKey: "terms",
                    minWidth: 400
                });

                return dateAndTermsColumns;
            };

            var getCoreColumnIndexesInGrid = function () {
                return { "rowSelectCheckIndex": 3, "hostIndex": 4, "hostPartyIndex": 5, "agentIndex": 6 };
            };

            var getHostPartyGridColumn = function () {
                var hostPartyCol = {
                    title: "Track",
                    modelKey: "hostPartyName"
                };
                if (self["contractTypeCode"] === undefined) {
                    self["contractTypeCode"] = localPersistenceService.get("contractTypeCode", false);
                }
                if (self["contractTypeCode"] === "I") {
                    hostPartyCol = {
                        title: "Location",
                        modelKey: "hostPartyName"
                    };
                }
                return hostPartyCol;
            };

            var getContractAgentPartyGridColumn = function () {
                var agentPartyCol = {
                    title: "Location",
                    modelKey: "agentPartyName"
                };

                if (self["contractTypeCode"] === undefined) {
                    self["contractTypeCode"] = localPersistenceService.get("contractTypeCode", false);
                }

                if (self["contractTypeCode"] === "I") {
                    agentPartyCol = {
                        title: "Track",
                        modelKey: "agentPartyName"
                    };
                }
                return agentPartyCol;
            };

            var getEntityIdByName = function (sourceFieldModelKey, entityNameInGrid, entityNameKeyInSourceOptions, entityIdKeyInSourceOptions) {
                var sourceField = getFieldByKey(sourceFieldModelKey);
                var sourceOptions = sourceField.options;

                var matchedOptions = _.filter(sourceOptions, function (item) {
                    return item[entityNameKeyInSourceOptions] === entityNameInGrid || item["text"] === entityNameInGrid;
                });
                var result;
                if (matchedOptions.length > 0) {
                    result = matchedOptions[0][entityIdKeyInSourceOptions] || matchedOptions[0]["value"];
                }

                return result;
            };

            var getHostEntityId = function (excelGridDataItem) {
                var result = excelGridDataItem["hostEntityId"];
                if (!result) {
                    var entityName = excelGridDataItem['hostName'];
                    result = getEntityIdByName("hosts", entityName, "hostName", "hostEntityId");
                }
                return result;
            };

            var getTrackEntityId = function (excelGridDataItem) {
                var entityIdKeyInGrid = self["contractTypeCode"] === 'E' ? "hostPartyEntityId" : "agentPartyEntityId";
                var entityNameKeyInGrid = self["contractTypeCode"] === 'E' ? "hostPartyName" : "agentPartyName";
                var contractTypeCode = self["contractTypeCode"];
                //var result = excelGridDataItem[entityIdKeyInGrid];
                var result;
                if (contractTypeCode === 'E') {
                    result = getSelectedTrackValue(excelGridDataItem["hostPartyName"], contractTypeCode);
                }
                else {
                    result = getSelectedTrackValue(excelGridDataItem["agentPartyName"], contractTypeCode);
                }

                if (!result) {
                    var entityName = excelGridDataItem[entityNameKeyInGrid];
                    result = getEntityIdByName("tracks", entityName, "trackName", "trackEntityId");
                }

                return result;
            };

            var getLocEntityId = function (excelGridDataItem) {
                var entityIdKeyInGrid = self["contractTypeCode"] === 'I' ? "hostPartyEntityId" : "agentPartyEntityId";
                var entityNameKeyInGrid = self["contractTypeCode"] === 'I' ? "hostPartyName" : "agentPartyName";
                var contractTypeCode = self["contractTypeCode"];
                var result;
                if (contractTypeCode === 'E') {
                    result = getSelectedLocValue(excelGridDataItem["agentPartyName"], contractTypeCode);
                }
                else {
                    result = getSelectedLocValue(excelGridDataItem["hostPartyName"], contractTypeCode);
                }

                if (!result) {
                    var entityName = excelGridDataItem[entityNameKeyInGrid];
                    result = getEntityIdByName("locations", entityName, "locName", "locEntityId");
                }

                return result;
            };

            var getSelectedTrackValue = function (trackName, contractTypeCode) {
                var corpEntityId = self.form.getFieldByModelKey("corpEntityId").modelValue;
                var trackOptions = localPersistenceService.get(corpEntityId + "_trackOptions", false);
                var result;
                if (contractTypeCode === "E") {
                    result = _.filter(trackOptions, function (item) {
                        return item.item.trackName === trackName;
                    });
                }
                else {
                    result = _.filter(trackOptions, function (item) {
                        return item.text === trackName;
                    });
                }
                var valueResult = _.map(result, function (item) {
                    return item.value;
                });
                return valueResult[0];
            };

            var getSelectedLocValue = function (locName, contractTypeCode) {
                var corpEntityId = self.form.getFieldByModelKey("corpEntityId").modelValue;
                var locOptions = localPersistenceService.get(corpEntityId + "_locationOptions", false);
                var result;
                if (contractTypeCode === "E") {
                    result = _.filter(locOptions, function (item) {
                        return item.text === locName;
                    });
                }
                else {
                    result = _.filter(locOptions, function (item) {
                        return item.item.locName === locName;
                    });
                }
                var valueResult = _.map(result, function (item) {
                    return item.value;
                });
                return valueResult[0];
            };

            var getHostPartyField = function () {
                var fieldModelKey = 'tracks';
                if (self["contractTypeCode"] === "I") {
                    fieldModelKey = 'locations';
                }
                return getFieldByKey(fieldModelKey);
            };

            var setTrackLocFieldTitles = function () {
                var tracksField = getFieldByKey("tracks");
                var locsField = getFieldByKey("locations");

                var contractTypeCode = self["contractTypeCode"];

                if (contractTypeCode === 'I') {
                    tracksField.title = 'Contract Agent Tracks';
                    locsField.title = 'Host Locations';
                }
                else {
                    tracksField.title = 'Host Tracks';
                    locsField.title = 'Contract Agent Locations';
                }

            };

            var getContractAgentPartyField = function () {
                var fieldModelKey = 'locations';
                if (self["contractTypeCode"] === "I") {
                    fieldModelKey = 'tracks';
                }
                return getFieldByKey(fieldModelKey);
            };

            var getSelectedHostIds = function () {
                var result = getModelValueByModelKey("hosts", "value");
                return result;
            };

            var getSelectedHostNames = function () {
                var result = getModelValueByModelKey("hosts", "text");
                return result;
            };

            var getAllHostNames = function () {
                var result = getOptionsByModelKey("hosts", "text");
                return result;
            };

            var getSelectedTracks = function () {
                var selectedOptions = getModelValueByModelKey("tracks");
                var result = _.map(selectedOptions, function (item) {
                    return item.text;
                });
                return result;
            };

            var getSelectedLocs = function () {
                var selectedOptions = getModelValueByModelKey("locations");
                var result = _.map(selectedOptions, function (item) {
                    return item.text;
                });
                return result;
            };

            var getModelValueByModelKey = function (modelKey, pluckKey) {
                var field = getFieldByKey(modelKey);
                var ismultiple = field["ismultiple"];
                var result = "";
                if (field.fieldType === "dropdown") {
                    if (ismultiple === true) {
                        result = field.modelValue;
                    } else {
                        result = field.getSelectedItem();
                    }
                } else {
                    result = field.modelValue;
                }

                //  var result = field.fieldType == "dropdown" && ismultiple == true ? field.modelValue : field.getSelectedItem();
                if (pluckKey) {
                    result = _.map(result, function (item) {
                        return item[pluckKey];
                    });
                }
                return result;
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

            var getFieldByKeyInfo = function (modelKey, sections) {
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

            var getOptionsByModelKey = function (modelKey, pluckKey) {
                var field = getFieldByKey(modelKey);
                var ismultiple = field["ismultiple"];
                var result = "";
                if (field.fieldType === "dropdown") {
                    if (ismultiple === true) {
                        result = field.options;
                    }
                } else {
                    result = field.options;
                }

                if (pluckKey) {
                    result = _.map(result, function (item) {
                        return item[pluckKey];
                    });
                }
                return result;
            };


        }
        return contractDefinitionService;
    });

    return angularAMD;
});
