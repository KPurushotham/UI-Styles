define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('validateinfolistService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams) {

        function validateinfolistService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.showInEditMode = function (currentForm) {
                var self = this;
                var corpDropDown = currentForm.getFieldByModelKey("corporationEntityId");
                corpDropDown.disabled = true;

                console.log("I am through budgetReallocationFactory.showFormDetails");
            };


            this.afterLoad = function (screenDefConfig, form) {
            };

            this.populteRaceData = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                
                 
                var gridData = this.form.getFieldByModelKey("gridData");
                var searchDate = this.form.getFieldByModelKey("beginDate");
                var gridApi = gridData.gridOptions.api;
                var url = '/vdi/postget/gapp/spGetRacesPerDate/RacesData?@RaceDate=' + searchDate.modelValue;
                console.log("selected date..", searchDate.modelValue);
                httpService.get(url).then(function (results) {
                    var dataset = results.data.dataset || [];
                    console.log("datasetURL=", dataset);
                    var rowDataItem = [];
 
                    gridApi.setRowData(dataset);
                    console.log("done.."); 
                   // overlay.hide();
                    //    $scope.isLoaded = true;
                });

            };

        
        };
        return racesfordateService;
    });

    return angularAMD;
});