define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('datasyncService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, overlay) {

        function datasyncService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;

            this.tableChangeHandler = function (sourceField) {
                var dataSyncResultGrid = this.form.getFieldByModelKey("dataSyncResult");
                var selectedValue = sourceField.getModel();
                var url = "report/ui/metadata/1000/" + selectedValue;

                overlay.load();
                httpService.get(url).then(function (results) {
                    if (results.status === 200) {
                        var fieldData = self.getFieldCriteriaByModelKey("viewGrid", results.data.data.criteriaMetadata);
                        var colDefs = fieldData["additionalConfigMap"]["gridConfig"]["columns"];
                        var runsyncUrl = "http://apps.chrims.com:8180/vdi/chrimsmasters/" + selectedValue.toLowerCase() + "/public/all";
                        httpService.get(runsyncUrl).then(function (results) {
                            if (results.status === 200) {
                                dataSyncResultGrid.gridOptions.api.setColumnDefs(colDefs);
                                dataSyncResultGrid.gridOptions.api.setRowData(results.data.dataset);
                                dataSyncResultGrid.gridOptions.api.sizeColumnsToFit();
                            }
                            overlay.hide();
                        });
                    }
                });
            };

            this.getFieldCriteriaByModelKey = function (fieldKey, fieldList) {
                var field = null;
                angular.forEach(fieldList, function (fieldItem, index) {
                    if (fieldItem.fieldKey.toLowerCase() === fieldKey.toLowerCase()) {
                        field = fieldItem;
                    }
                });
                return field;
            };

            this.updateSyncData = function (sourceField) {
                var dataSyncResultGrid = this.form.getFieldByModelKey("dataSyncResult");
                var selectedRows = dataSyncResultGrid.gridOptions.api.getSelectedNodes();
                var data = [];
                angular.forEach(selectedRows, function (item, index) {
                    data.push(item.data);
                });
                console.log(data);
            };
        }
        return datasyncService;
    });

    return angularAMD;
});