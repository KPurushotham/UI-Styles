define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'authService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('contractAgentService', function ($filter, utilService, gridService, dateUtilService, $q, Notification, httpService, authService, overlay, alasql) {

        function contractAgentService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;

            this.setScreenMode = function (screenMode) {
                this.form.setScreenMode(screenMode);
                var locationsField = this.form.getFieldByModelKey("locations");
                locationsField.setGridModeByScreenMode();
                locationsField.gridOptions.api.redrawRows();
                var tracksField = this.form.getFieldByModelKey("tracks");
                tracksField.setGridModeByScreenMode();
                tracksField.gridOptions.api.redrawRows();
            };

            this.afterLoad = function (screenDefConfig, form) {
                form = form || self.form;
                if (form.screenMode === "ADD") {
                    var url = 'vdi/hostfees/contractagent/mapping/all';
                    var promise = isDropDownLoaded();
                    var contractAgentEntity = this.form.getFieldByModelKey("contractAgentEntityId");
                    overlay.load();
                    promise.then(function () {
                        var contractAgentOptions = contractAgentEntity.options;
                        httpService.get(url).then(function (results) {
                            if (results.status === 200) {
                                var dataset = results.data.dataset || [];
                                var filteredContractAgents = alasql("select DISTINCT cap.* from ? as cap LEFT OUTER JOIN ? as ds \
                                                                     ON cap.value = ds.contractAgentEntityId WHERE ds.contractAgentEntityId IS NULL \
                                                                    ", [contractAgentOptions, dataset]);                                
                                contractAgentEntity.options = filteredContractAgents;
                                overlay.hide();
                            }
                        });
                    });

                }
            };

            var isDropDownLoaded = function () {
                var deferred = $q.defer();
                var timer = setInterval(function () {
                    console.log("2110 start");
                    try {
                        if (isAllDropDownDataLoaded()) {
                            deferred.resolve("success");
                        }
                    }
                    catch (err) {
                        console.log("2110--> error " + err);
                    }
                }, 1000);
                return deferred.promise;
            };

            var isAllDropDownDataLoaded = function () {
                var isAllddLoaded = false;
                var contractAgent = getFieldByKey('contractAgentEntityId');
                if ((contractAgent.options).length > 0) {
                    isAllddLoaded = true;
                } else {
                    isAllddLoaded = false;
                }
                return isAllddLoaded;
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

            //this.removeCorpName = function (screenDefConfig) {

            //    var corpEntityIdField = self.getModelValueByModelKey("corporationEntityId");
            //    var contractAgentEntity = self.getFieldByModelKey("contractAgentEntityId");

            //    var options = contractAgentEntity.options;
            //    options = _.filter(options, function (item) {
            //        //return item.value != corporationEntityId;
            //        return item.value != corpEntityIdField;
            //    });
            //    contractAgentEntity.options = options;
            //};

            this.runValidations = function (formServiceModel, operationType, parentForm, parentSection, sectionDataModel) {

                var defer = $q.defer();
                var isValid = false;
                var corporationEntityId = parentForm.getFieldByModelKey("corporationEntityId").getModel();
                var contractAgentEntityId = parentForm.getFieldByModelKey("contractAgentEntityId").getModel();
                var tracks = formServiceModel["tracks"];
                var locations = formServiceModel["locations"];

                if (corporationEntityId === "" || contractAgentEntityId === "") {
                    isValid = false;
                    overlay.hide();
                    Notification.error({
                        message: "Corporation and Contract Agent fields are required.",
                        title: 'REQUIRED FIELDS',
                        delay: 5000
                    });
                }
                else {
                    if (tracks.length === 0 && locations.length === 0) {
                        isValid = false;
                        overlay.hide();
                        Notification.error({
                            message: "Track(IMPORT) / Location(EXPORT) grid should not be empty.",
                            title: 'REQUIRED FIELDS',
                            delay: 5000
                        });
                    }
                    else {
                        if (operationType !== "EDIT") {
                            var url = 'vdi/hostfees/contractagent/mapping/getone?corporationEntityId=' + corporationEntityId + '&contractAgentEntityId=' + contractAgentEntityId;
                            httpService.get(url).then(function (results) {
                                if (results.status === 200) {
                                    console.log("results=", results);
                                    if (results.data.dataset.length === 0) {
                                        isValid = true;
                                    }
                                    else {
                                        isValid = false;
                                        overlay.hide();
                                        Notification.error({
                                            message: "Track(IMPORT) / Location(EXPORT) are already mapped to the selected Contract Agent. Get back to edit mode and add more.",
                                            title: 'REQUIRED FIELDS',
                                            delay: 5000
                                        });
                                    }
                                }
                                defer.resolve(isValid);
                            });
                        }
                        else {
                            isValid = true;
                            defer.resolve(isValid);
                        }
                    }

                }
                return defer.promise;
            };

            this.deleteTracksFromGrid = function (data, parentForm) {
                var tracksObj = this.form.getFieldByModelKey("tracks");
                var gridApi = tracksObj.gridOptions.api;
                var gridColumns = tracksObj.gridConfig.columns;
                var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                var rowData = _.filter(filterRowsData, function (filterRowData) {
                    var isExists = true;
                    if (filterRowData.trackName === data.trackName && filterRowData.beginDate === data.beginDate && filterRowData.endDate == data.endDate) {
                        isExists = false;
                    }
                    return isExists;
                });
                gridApi.setRowData(rowData);
            };

            this.addTracks = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var corporationEntityId = angular.isObject(sectionDataModel["corporationEntityId"]) ? sectionDataModel["corporationEntityId"].value : sectionDataModel.corporationEntityId;
                var contractAgent = parentForm.getFieldByModelKey('contractAgentEntityId');
                //    var contractAgentOne = contractAgent.getModel();
                var contractAgentEntityId = contractAgent.getModel();
                //   var contractAgentEntityId =  contractAgent.getModel()[0].value;

                // var contractAgentEntityId = angular.isObject(sectionDataModel["contractAgentEntityId"]) ? sectionDataModel["contractAgentEntityId"].value : sectionDataModel.contractAgentEntityId;

                var res = parentSection.getFieldByModelKey('trackEntity');
                var testCorpName = res.getModel();
                var trackEntity = sectionDataModel["trackEntity"];
                var beginDate = sectionDataModel["trackBeginDate"];
                var endDate = sectionDataModel["trackEndDate"];

                var tracksObj = this.form.getFieldByModelKey("tracks");
                var gridColumns = tracksObj.gridConfig.columns;
                var gridApi = tracksObj.gridOptions.api;
                //var gridApi = parentForm.sections[1].tabs[0].rowDivisions[1].fields[0].gridOptions.api;

                var isBetween = function (n, a, b) {
                    return (n - a) * (n - b) <= 0;
                };

                var newRowDataItem = [];
                var updateRowDataItem = [];
                var filterRowsData = gridService.getGridData(gridApi, gridColumns);
                if (trackEntity && beginDate && endDate) {

                    var beginDateTimeStamp = dateUtilService.convertToTimeStamp(beginDate);
                    var endDateTimeStamp = dateUtilService.convertToTimeStamp(endDate);


                    angular.forEach(trackEntity, function (item, key) {

                        if (beginDateTimeStamp <= endDateTimeStamp) {

                            var existRowData = _.filter(filterRowsData, function (filterRowData) {
                                var isExists = true;
                                if (filterRowData.trackName === item.text) {

                                    var rowItemBeginDateTimeStamp = dateUtilService.convertToTimeStamp(filterRowData.beginDate);
                                    var rowItemEndDateTimeStamp = dateUtilService.convertToTimeStamp(filterRowData.endDate);

                                    if (isBetween(beginDateTimeStamp, rowItemBeginDateTimeStamp, rowItemEndDateTimeStamp)
                                        || isBetween(endDateTimeStamp, rowItemBeginDateTimeStamp, rowItemEndDateTimeStamp)
                                        || isBetween(rowItemBeginDateTimeStamp, beginDateTimeStamp, endDateTimeStamp)
                                        || isBetween(rowItemEndDateTimeStamp, beginDateTimeStamp, endDateTimeStamp)) {
                                        swal({
                                            text: "Criteria with selected Begin & End Date Range already in Grid. Please select a different Date Range!",
                                            icon: "info",
                                            button: "Okay"
                                        });

                                        isExists = true;

                                    } else {
                                        isExists = false;
                                    }
                                    return isExists;
                                }

                            });
                        }
                        else {
                            swal({
                                text: "Begin Date & End Date should be in proper range. Please select different date range!",
                                icon: "info",
                                button: "Okay"
                            });

                        }
                        console.log("existRowData=", existRowData);
                        if (existRowData && existRowData.length === 0) {
                            newRowDataItem.push({
                                operationType: "INSERT",
                                corporationEntityId: corporationEntityId,
                                contractAgentEntityId: contractAgentEntityId,
                                trackEntityId: item.value,
                                trackName: item.text,
                                beginDate: beginDate,
                                endDate: endDate
                            });
                        }
                    });
                }
                else {
                    swal({
                        text: "Please fill all the fields!",
                        icon: "info",
                        button: "Okay"
                    });

                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                gridApi.forEachNode(function (rowNode) {
                    rowNode.setDataValue("corporationEntityId", corporationEntityId);
                    rowNode.setDataValue("contractAgentEntityId", contractAgentEntityId);
                });

                gridApi.updateRowData({ add: newRowDataItem });

            };

            this.deleteLocationsFromGrid = function (data, parentForm) {
                var locationsObj = this.form.getFieldByModelKey("locations");
                var gridApi = locationsObj.gridOptions.api;
                var gridColumns = locationsObj.gridConfig.columns;
                var filterRowsData = gridService.getGridData(gridApi, gridColumns);
                var rowData = _.filter(filterRowsData, function (filterRowData) {
                    var isExists = true;
                    //if ((filterRowData.locationName == data.locationName && filterRowData.beginDate == data.beginDate && filterRowData.endDate == data.endDate) && (filterRowData.beginDate >= beginDate && beginDate <= filterRowData.endDate && filterRowData.beginDate <= endDate && endDate >= filterRowData.endDate)) {
                    if ((filterRowData.locName === data.locName && filterRowData.beginDate === data.beginDate && filterRowData.endDate === data.endDate)) {
                        isExists = false;
                    }
                    return isExists;
                });
                gridApi.setRowData(rowData);
            };

            this.addLocations = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var corporationEntityId = angular.isObject(sectionDataModel["corporationEntityId"]) ? sectionDataModel["corporationEntityId"].value : sectionDataModel.corporationEntityId;
                // var contractAgentEntityId = angular.isObject(sectionDataModel["contractAgentEntityId"]) ? sectionDataModel["contractAgentEntityId"].value : sectionDataModel.contractAgentEntityId;
                var contractAgent = parentForm.getFieldByModelKey('contractAgentEntityId');
                var contractAgentOne = contractAgent.getModel();
                var contractAgentEntityId = contractAgent.getModel();
                //    var contractAgentEntityId =  contractAgent.getModel()[0].value;

                var res = parentSection.getFieldByModelKey('locationEntity');
                var testCorpName = res.getModel();
                var locationEntity = sectionDataModel["locationEntity"];
                var beginDate = sectionDataModel["locBeginDate"];
                var endDate = sectionDataModel["locEndDate"];

                var locationsObj = this.form.getFieldByModelKey("locations");
                var gridApi = locationsObj.gridOptions.api;
                var gridColumns = locationsObj.gridConfig.columns;

                var newRowDataItem = [];
                var updateRowDataItem = [];
                var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                var isBetween = function (n, a, b) {
                    return (n - a) * (n - b) <= 0;
                };

                if (locationEntity && beginDate && endDate) {

                    var beginDateTimeStamp = dateUtilService.convertToTimeStamp(beginDate);
                    var endDateTimeStamp = dateUtilService.convertToTimeStamp(endDate);

                    angular.forEach(locationEntity, function (item, key) {

                        if (beginDateTimeStamp <= endDateTimeStamp) {

                            var existRowData = _.filter(filterRowsData, function (filterRowData) {
                                var isExists = true;
                                if (filterRowData.locName === item.text) {
                                    var rowItemBeginDateTimeStamp = dateUtilService.convertToTimeStamp(filterRowData.beginDate);
                                    var rowItemEndDateTimeStamp = dateUtilService.convertToTimeStamp(filterRowData.endDate);

                                    if (isBetween(beginDateTimeStamp, rowItemBeginDateTimeStamp, rowItemEndDateTimeStamp)
                                        || isBetween(endDateTimeStamp, rowItemBeginDateTimeStamp, rowItemEndDateTimeStamp)
                                        || isBetween(rowItemBeginDateTimeStamp, beginDateTimeStamp, endDateTimeStamp)
                                        || isBetween(rowItemEndDateTimeStamp, beginDateTimeStamp, endDateTimeStamp)) {
                                        swal({
                                            text: "Criteria with selected Begin & End Date Range already in Grid. Please select a different Date Range!",
                                            icon: "info",
                                            button: "Okay"
                                        });

                                        isExists = true;

                                    } else {
                                        isExists = false;

                                    }
                                    return isExists;
                                }
                            });
                        }
                        else {
                            swal({
                                text: "Begin Date & End Date should be in proper range. Please select different date range!",
                                icon: "info",
                                button: "Okay"
                            });

                        }
                        if (existRowData.length === 0) {
                            newRowDataItem.push({
                                operationType: "INSERT",
                                corporationEntityId: corporationEntityId,
                                contractAgentEntityId: contractAgentEntityId,
                                locationEntityId: item.value,
                                locName: item.text,
                                beginDate: beginDate,
                                endDate: endDate
                            });

                        }
                    });
                }
                else {
                    swal({
                        text: "Please fill all the fields!",
                        icon: "info",
                        button: "Okay"
                    });

                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                gridApi.forEachNode(function (rowNode) {
                    rowNode.setDataValue("corporationEntityId", corporationEntityId);
                    rowNode.setDataValue("contractAgentEntityId", contractAgentEntityId);
                });

                gridApi.updateRowData({ add: newRowDataItem });

            };
        }
        return contractAgentService;
    });

    return angularAMD;
});