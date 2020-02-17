define(['angularAMD', 'modelUtilService', 'dateUtilService', 'fieldService'], function (angularAMD) {
    'use strict';

    angularAMD.controller('dropDownController', function ($scope, $controller, httpService, overlay, Notification,
        $filter, modelUtilService, dateUtilService, fieldService) {

       $controller('fieldBaseController', { $scope: $scope });
       // debugger;
        //$scope.searchTerm;
        //$scope.field.modelValue;
        //$scope.clearSearchTerm = function () {
        //    // $scope.searchTerm = '';
        //    clear = $scope.field.modelValue
        //    clear = '';
        //};

        //$scope.invokeEventHandlerForReadMode = function () {
        //    if ($scope.parentForm.readOnlyForm && $scope.modelValuePopulated && ($scope.optionsLoaded || !$scope.field.dataConfig)
        //        && $scope.readModeDefaultEvent) {
        //        $scope.eventHandler($scope, $scope.readModeDefaultEvent["eventName"], $scope.readModeDefaultEvent["dependantModelKeysTobeFilled"]
        //            , $scope.readModeDefaultEvent["event"]);
        //    }
        //};
        //function($scope, $element) {
        //    //angular.element(element);
        //    $element.find('input').on('keydown', function (ev) {
        //        ev.stopPropagation();
        //    });
        //}
        //$scope.loadUsers = function () {
        //    return $timeout(function () {

        //    }, 650);
        //};
       $scope.updateOptions = function () {
           alert("aaaaa");
           if (typeof $scope.options === 'function') {
               $scope.options().then(function (resolvedOptions) {
                   $scope.resolvedOptions = resolvedOptions || [];
                   updateSelectionLists();
               });
           }
       };

       // This search function is optimized to take into account the search limit.
       // Using angular limitTo filter is not efficient for big lists, because it still runs the search for
       // all elements, even if the limit is reached
       $scope.search = function () {
           var counter = 0;
           return function (item) {
               if (counter > $scope.searchLimit) {
                   return false;
               }
               var displayName = $scope.getDisplay(item);
               if (displayName) {
                   var result = displayName.toLowerCase().indexOf($scope.searchFilter.toLowerCase()) > -1;
                   if (result) {
                       counter++;
                   }
                   return result;
               }
           };
       };

      

        $scope.getSelectedText = function () {
            var optionsList = $scope.field.options;
            console.log("optionsList=", optionsList);
        };
       $scope.field.getModel = function (data) {
        console.log("************* optionsList");
           var field = $scope.field;
           var resultModelValue = null;
           var viewModelValue = field.modelValue;
           if (field.fieldType === "hidden" && field["defaultValueByKey"]) {
               resultModelValue = modelUtilService.getValueFromModelByKey(field["defaultValueByKey"], $scope.formDataModel, null, $scope.parentForm);
           }
           else if (angular.isDefined(viewModelValue)) {
               if (field.fieldType === "checkbox") {
                   resultModelValue = viewModelValue;
               } else if (field.fieldType === "singleradio") {
                   // console.log("singleradio getModel",data);
                   resultModelValue = (data[field.modelKey] == "true") ? "t" : "f";
               } else if (field.fieldType === "date") {
                   resultModelValue = dateUtilService.convertToDBFormat(viewModelValue);
               }
               else if (field.fieldType === "daterange") {
                   resultModelValue = fieldService.getModelValue($scope.field);
               }

               else if (angular.isObject(viewModelValue) && viewModelValue.hasOwnProperty("value")) {
                   resultModelValue = viewModelValue["value"];
               }
               else {
                   resultModelValue = viewModelValue;
               }

           }
           return resultModelValue;
       }

       $scope.field.setModel = function (model) {
           var fieldModelKey = $scope.field.modelKey;
           var modelValue = null;
           if (model) {
               $scope.parentModel = model;
               console.log("************* optionsList");
               if (typeof model[fieldModelKey] === "boolean") {
                   if ($scope.field.fieldType === "checkbox") {
                       modelValue = model[$scope.field.modelKey];
                       console.log("checkbox=*************", modelValue);
                   } else {
                       modelValue = model[$scope.field.modelKey] ? 1 : 0;
                   }

               } else if ($scope.field.fieldType === "date") {
                   modelValue = dateUtilService.convertFromDBFormat(model[$scope.field.modelKey]);

               }
               else {
                   modelValue = model[$scope.field.modelKey];
               }
           }
           if (modelValue === null) {
               $scope.field.setDefaultValue();
           }
           else {
               $scope.field.modelValue = modelValue;
               $scope.sectionDataModel[$scope.field.modelKey] = modelValue;
               $scope.field.notifyDependantsOnLoadIfAny();
           }
           $scope.modelValuePopulated = true;
           $scope.invokeEventHandlerForReadMode();

       }


    });

    return angularAMD;
});