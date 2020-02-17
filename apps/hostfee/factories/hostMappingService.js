define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'authService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('hostMappingService', function ($filter, utilService, gridService, dateUtilService, $q, Notification, httpService, authService) {

        function hostMappingService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            var self = this;
            this.showInEditMode = function (currentForm) {

                //var corpDropDown = currentForm.getFieldByModelKey("corporationEntityId");
                //corpDropDown.disabled = true;
                //var contractAgentDropDown = currentForm.getFieldByModelKey("contractAgentEntityId");
                //contractAgentDropDown.disabled = true;
                //console.log("I am through budgetReallocationFactory.showFormDetails");
            };

            this.afterLoad = function (screenDefConfig, form) {

                var corpEntityIdField = getFieldByKey("corporationEntityId");
                corpEntityIdField.setSelectedIndex(0);

                form = form || self.form;
                if (form.screenMode == "ADD") {
                    var corpEntityIdField = self.getModelValueByModelKey("corporationEntityId");
                    var hostEntityId = self.getFieldByModelKey("hostEntityId");

                    // *************************URl need to be replaced as get all service is not ready yet ***************************************
                    var url = 'vdi/hostfees/contractagent/mapping/all';

                    //httpService.get(url).then(function (results) {
                    //    var dataset = results.data.dataset || [];
                    //    if (results.status == 200) {

                    //        angular.forEach(dataset, function (item, key) {
                    //            hostEntityId.options = _.filter(hostEntityId.options, function (option) {
                    //                return option.value != item.hostEntityId;
                    //            });
                    //        });
                    //        //   contractAgentEntity.modelValue = selectedContactAgentEntityID;
                    //        console.log("results=", results);

                    //    }

                    //});
                }
            };

            var getFieldByKey = function (modelKey) {
                self["fields"] = self["fields"] || {};
                var field = self["fields"][modelKey];
                if (!field) {
                    field = self.form.getFieldByModelKey(modelKey);
                    self["fields"][modelKey] = field;
                }
                return field;
            }

   /*      this.runValidations = function (formServiceModel, operationType, parentForm) {

                var self = this;
                var defer = $q.defer();
                console.log("Validation Fired 1=", formServiceModel, operationType, parentForm);
                var isValid = false;
                var corporationEntityId = parentForm.getFieldByModelKey("corporationEntityId").getModel();
                var hostEntityId = parentForm.getFieldByModelKey("hostEntityId").getModel();
                var tracks = formServiceModel.tracks;
                var locations = formServiceModel.locations;

                if (corporationEntityId == ""
                    || hostEntityId == ""
                    //  || tracks.length ==0
                    //    || locations.length == 0
                ) {
                    Notification.error({
                        message: "Corporation , Host, tracks and locations fields are required.",
                        title: 'REQUIRED FIELDS',
                        delay: 5000
                    });
                    isValid = false;
                    defer.resolve(isValid);
                } else {

                    if (operationType != "EDIT") {
                        console.log("validate operationType =" + operationType);

                        // ************************URl need to be replaced as get one  service is not ready yet ***********************************
                        
                        var url = 'vdi/hostfees/contractagent/mapping/getone?corporationEntityId=' + corporationEntityId + '&hostEntityId=' + hostEntityId;
                        httpService.get(url).then(function (results) {
                            if (results.status == 200) {
                                console.log("results=", results);
                                if (results.data.dataset.length == 0) {
                                    isValid = true;
                                } else {
                                    isValid = false;
                                    Notification.error({
                                        message: "Corporation & Host Already exists.",
                                        title: 'REQUIRED FIELDS',
                                        delay: 5000
                                    });
                                }
                                defer.resolve(isValid);

                            } else {
                                Notification.error({
                                    message: "Corporation & Host Already exists.",
                                    title: 'REQUIRED FIELDS',
                                    delay: 5000
                                });
                                isValid = false;
                                defer.resolve(isValid);
                            }
                        });
                    } else {
                        isValid = true;
                        defer.resolve(isValid);
                    }
                    isValid = false;
                }
                console.log("isValid==", isValid);
                return defer.promise;
            }  */

            this.deleteTracksFromGrid = function (data, parentForm) {
                var tracksObj = this.form.getFieldByModelKey("tracks");
                var gridApi = tracksObj.gridOptions.api;
                var gridColumns = tracksObj.gridConfig.columns;
                var filterRowsData = gridService.getGridData(gridApi, gridColumns);

                var rowData = _.filter(filterRowsData, function (filterRowData) {
                    var isExists = true;
                    if (filterRowData.trackName == data.trackName && filterRowData.beginDate == data.beginDate && filterRowData.endDate == data.endDate) {
                        isExists = false;
                    }
                    return isExists;
                });
                gridApi.setRowData(rowData);
            };

            this.addTracks = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                var corporationEntityId = angular.isObject(sectionDataModel["corporationEntityId"]) ? sectionDataModel["corporationEntityId"].value : sectionDataModel.corporationEntityId;
                var hostEntityId = angular.isObject(sectionDataModel["hostEntityId"]) ? sectionDataModel["hostEntityId"].value : sectionDataModel.hostEntityId;

                var trackEntity = sectionDataModel["trackEntity"];
                var beginDate = sectionDataModel["trackBeginDate"];
                var endDate = sectionDataModel["trackEndDate"];

                var tracksObj = this.form.getFieldByModelKey("tracks");
                var gridColumns = tracksObj.gridConfig.columns;
                var gridApi = tracksObj.gridOptions.api;
                //var gridApi = parentForm.sections[1].tabs[0].rowDivisions[1].fields[0].gridOptions.api;

                var isBetween = function (n, a, b) {
                    return (n - a) * (n - b) <= 0
                }

                var newRowDataItem = [];
                var updateRowDataItem = [];
                var filterRowsData = gridService.getGridData(gridApi, gridColumns);
                if (trackEntity && beginDate && endDate) {

                    var beginDateTimeStamp = dateUtilService.convertToTimeStamp(beginDate);
                    var endDateTimeStamp = dateUtilService.convertToTimeStamp(endDate);


                    angular.forEach(trackEntity, function (item, key) {

                        if (beginDateTimeStamp < endDateTimeStamp) {

                            var existRowData = _.filter(filterRowsData, function (filterRowData) {
                                var isExists = true;
                                if (filterRowData.trackName === item.text) {

                                    var rowItemBeginDateTimeStamp = dateUtilService.convertToTimeStamp(filterRowData.beginDate);
                                    var rowItemEndDateTimeStamp = dateUtilService.convertToTimeStamp(filterRowData.endDate);

                                    if (isBetween(beginDateTimeStamp, rowItemBeginDateTimeStamp, rowItemEndDateTimeStamp)
                                        || isBetween(endDateTimeStamp, rowItemBeginDateTimeStamp, rowItemEndDateTimeStamp)
                                        || isBetween(rowItemBeginDateTimeStamp, beginDateTimeStamp, endDateTimeStamp)
                                        || isBetween(rowItemEndDateTimeStamp, beginDateTimeStamp, endDateTimeStamp)) {
                                        isExists = true;

                                    } else {
                                        isExists = false;
                                    }
                                    return isExists;
                                }

                            });
                        }
                        console.log("existRowData=", existRowData);
                        if (existRowData.length == 0) {
                            newRowDataItem.push({
                                operationType: "INSERT",
                                corporationEntityId: corporationEntityId,
                                hostEntityId: hostEntityId,
                                trackEntityId: item.value,
                                trackName: item.text,
                                beginDate: beginDate,
                                endDate: endDate
                            });
                        }
                    });
                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                gridApi.forEachNode(function (rowNode) {
                    rowNode.setDataValue("corporationEntityId", corporationEntityId);
                    rowNode.setDataValue("hostEntityId", hostEntityId);
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
                    if ((filterRowData.locationName == data.locationName && filterRowData.beginDate == data.beginDate && filterRowData.endDate == data.endDate)) {
                        isExists = false;
                    }
                    return isExists;
                });
                gridApi.setRowData(rowData);
            };

            this.addLocations = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var corporationEntityId = angular.isObject(sectionDataModel["corporationEntityId"]) ? sectionDataModel["corporationEntityId"].value : sectionDataModel.corporationEntityId;
                var hostEntityId = angular.isObject(sectionDataModel["hostEntityId"]) ? sectionDataModel["hostEntityId"].value : sectionDataModel.contractAgentEntityId;
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
                    return (n - a) * (n - b) <= 0
                }

                if (locationEntity && beginDate && endDate) {

                    var beginDateTimeStamp = dateUtilService.convertToTimeStamp(beginDate);
                    var endDateTimeStamp = dateUtilService.convertToTimeStamp(endDate);

                    angular.forEach(locationEntity, function (item, key) {

                        if (beginDateTimeStamp < endDateTimeStamp) {

                            var existRowData = _.filter(filterRowsData, function (filterRowData) {
                                var isExists = true;
                                if (filterRowData.locationName === item.text) {
                                    var rowItemBeginDateTimeStamp = dateUtilService.convertToTimeStamp(filterRowData.beginDate);
                                    var rowItemEndDateTimeStamp = dateUtilService.convertToTimeStamp(filterRowData.endDate);

                                    if (isBetween(beginDateTimeStamp, rowItemBeginDateTimeStamp, rowItemEndDateTimeStamp)
                                        || isBetween(endDateTimeStamp, rowItemBeginDateTimeStamp, rowItemEndDateTimeStamp)
                                        || isBetween(rowItemBeginDateTimeStamp, beginDateTimeStamp, endDateTimeStamp)
                                        || isBetween(rowItemEndDateTimeStamp, beginDateTimeStamp, endDateTimeStamp)) {
                                        isExists = true;

                                    } else {
                                        isExists = false;

                                    }
                                    return isExists;
                                }
                            });
                        }
                        if (existRowData.length === 0) {
                            newRowDataItem.push({
                                operationType: "INSERT",
                                corporationEntityId: corporationEntityId,
                                hostEntityId: hostEntityId,
                                locationEntityId: item.value,
                                locationName: item.text,
                                beginDate: beginDate,
                                endDate: endDate
                            });

                        }
                    });
                }
                parentForm.df_form.$setDirty();
                parentForm.df_form.$setSubmitted();
                gridApi.forEachNode(function (rowNode) {
                    rowNode.setDataValue("corporationEntityId", corporationEntityId);
                    rowNode.setDataValue("hostEntityId", hostEntityId);
                });

                gridApi.updateRowData({ add: newRowDataItem });

            };
        };
        return hostMappingService;
    });

    return angularAMD;
});