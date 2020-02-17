define(['angularAMD', 'utilService', 'ngHandsontable', 'alaSqlExtensions', 'httpService', 'authService', 
'gridService', 'localPersistenceService', 'overlay','ngStorage',  'dateUtilService' ], function (angularAMD) {
    'use strict';

    angularAMD.factory('slotentryService', function ($filter, $q, $timeout, alasql, utilService, hotRegisterer, $window,
        constants, httpService, authService, gridService, localPersistenceService, overlay, _,
         dateUtilService, $stateParams, $location,Notification ) {

        function slotentryService(form, menuDefinition) {
            var self = this;
            this.form = form;
            this.menuDefinition = menuDefinition;   
            
            this.runValidations = function (formServiceModel, operationType) {
                var defer = $q.defer();
                form.getFieldByModelKey("slotsGridData").gridOptions.api.stopEditing();
                defer.resolve(true);
                console.log("formServiceModel, operationType=", formServiceModel, operationType);

                return defer.promise;
            };
           
            this.buildDataTobeSubmitted = function (formServiceModel, operationType,parentForm) {
                var self = this;
                var mmm= parentForm.getFieldByModelKey("slotsGridData").getModel();
                console.log("mmm==", mmm);
                console.log("I am through budgetReallocationFactory.buildDataTobeSubmitted", formServiceModel);
                formServiceModel.slotsGridData =[];
                parentForm.getFieldByModelKey("slotsGridData").gridOptions.api.forEachNode( function(rowNode, index) {
                    console.log(  rowNode.data  );
                    formServiceModel.slotsGridData.push(rowNode.data);
                });
                return formServiceModel;
                //self.form.buildDataTobeSubmitted(formServiceModel, operationType);
            };

            this.afterSaveAction = function (formServiceModel, parentForm) {
                parentForm.getFieldByModelKey("slotsGridData").gridOptions.api.setRowData([]);
                $(".slots-grid").hide();
                Notification.success({
                    message: "Data saved successfully.",
                    title: 'Information',
                    delay: 5000
                });
            };

            this.getDataToGrid = function (sourceField, form, parentForm, parentSection, sectionDataModel, formDataModel, event, selectedItem) {

                var gridData = form.getFieldByModelKey("slotsGridData");
                var gridApi = gridData.gridOptions.api;
                gridApi.setRowData([]);

                form = form || self.form;
                var beginDate = sectionDataModel.beginDate;
                var endDate = sectionDataModel.endDate;
             
                var sd = new Date(beginDate);
                var startYear = sd.getFullYear();
                var startMonth = ('0' + (sd.getMonth() + 1)).slice(-2);
                var startDate = ('0' + sd.getDate()).slice(-2);
                var sDate = startYear + "-" + startMonth + "-" + startDate;

                var ld = new Date(endDate);
                var lastYear = ld.getFullYear();
                var lastMonth = ('0' + (ld.getMonth() + 1)).slice(-2);
                var lastDate = ('0' + ld.getDate()).slice(-2);
                var lDate = lastYear + "-" + lastMonth + "-" + lastDate;

                var daterange = getDateArray(sDate, lDate);
                var year, month, date;
                var parseddaterange = [];
                angular.forEach(daterange, function (item, index) {
                    year = daterange[index].getFullYear();
                    month = ('0' + (daterange[index].getMonth() + 1)).slice(-2);
                    date = ('0' + daterange[index].getDate()).slice(-2);
                    parseddaterange[index] = year + "-" + month + "-" + date;
                });
                console.log("Date Range", parseddaterange);
                overlay.load();
                var dataset = null;
                var url = 'vdi/webportal/slotentry/byracedate_get_one?beginDate=' + sDate + '&endDate=' + lDate;
                httpService.get(url).then(function (results) {
                    console.log("URL result ", results);
                    dataset = results.data.dataset || [];
                    console.log("URL dataset ", dataset);
                    
                    var bindtoGridDataset = new Array();
                    angular.forEach(parseddaterange, function (item, index) {
                        if (dataset.length > 0) {
                            var raceDate = alasql("SELECT * FROM ? WHERE raceDate=?", [dataset, parseddaterange[index]]);
                             
                            if (raceDate.length > 0) {
                                raceDate[0]["operationType"] = "UPDATE";
                                bindtoGridDataset.push(raceDate[0]);
                            }
                            else {
                                var len = gridData.gridConfig.columns.length;
                                var dummyData = new Object();
                                for (var i = 0; i < len; i++) {
                                   
                                    if (gridData.gridConfig.columns[i].field === "raceDate") {
                                        dummyData[gridData.gridConfig.columns[i].field] = parseddaterange[index];
                                    }
                                    else if (gridData.gridConfig.columns[i].field === "purTh") {
                                        dummyData[gridData.gridConfig.columns[i].field] = 0;
                                    }
                                    else if (gridData.gridConfig.columns[i].field === "purQT") {
                                        dummyData[gridData.gridConfig.columns[i].field] = 0;
                                    }
                                    else if (gridData.gridConfig.columns[i].field === "operationType") {
                                        dummyData[gridData.gridConfig.columns[i].field] = "INSERT";
                                    }
                                    else if (gridData.gridConfig.columns[i].field === "purMin") {
                                        dummyData[gridData.gridConfig.columns[i].field] = 0;
                                    }
                                    else {
                                        dummyData[gridData.gridConfig.columns[i].field] = null;
                                    }
                                };
                                console.log("Dummy ", dummyData);
                                bindtoGridDataset.push(dummyData);
                            }
                        }
                        else {
                            var len2 = gridData.gridConfig.columns.length;
                            var dummyData2 = new Object();
                            for (var j = 0; j < len2; j++) {
                                
                                if (gridData.gridConfig.columns[j].field === "raceDate") {
                                    dummyData2[gridData.gridConfig.columns[j].field] = parseddaterange[index];
                                }
                                else if (gridData.gridConfig.columns[j].field === "purTh") {
                                    dummyData2[gridData.gridConfig.columns[j].field] = 0;
                                }
                                else if (gridData.gridConfig.columns[j].field === "purQT") {
                                    dummyData2[gridData.gridConfig.columns[j].field] = 0;
                                }
                                else if (gridData.gridConfig.columns[j].field === "purMin") {
                                    dummyData2[gridData.gridConfig.columns[j].field] = 0;
                                }
                                else if (gridData.gridConfig.columns[j].field === "operationType") {
                                    dummyData2[gridData.gridConfig.columns[j].field] = "INSERT";
                                }
                                else {
                                    dummyData2[gridData.gridConfig.columns[j].field] = null;
                                }
                            };
                            console.log("Dummy ", dummyData2);
                            bindtoGridDataset.push(dummyData2);
                        }
                       
                    });
                    console.log("bindtoGridDataset ", bindtoGridDataset);
                    gridApi.setRowData(bindtoGridDataset);

                });
                $(".slots-grid").show();
                return false;
            };  

            var getDateArray = function (startDate, endDate) {
                var arr = new Array();
                var bd = new Date(startDate + "T12:00:00Z");
                var ed = new Date(endDate + "T12:00:00Z");
                // var bd = new Date(startDate);
                // var ed = new Date(endDate);
                while (bd <= ed) {
                    arr.push(new Date(bd));
                    bd.setDate(bd.getDate() + 1);
                }
                return arr;
            };
            
        }
        return slotentryService;
    });

    return angularAMD;
});