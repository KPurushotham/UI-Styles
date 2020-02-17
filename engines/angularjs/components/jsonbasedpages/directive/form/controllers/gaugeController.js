define(['angularAMD', 'modelUtilService', 'dateUtilService', 'fieldService','angularjs-gauge'], function (angularAMD) {
    'use strict';

    angularAMD.controller('gaugeController', function ($scope, $controller, httpService, overlay, Notification,
        $filter, modelUtilService, dateUtilService, fieldService) {
        $controller('fieldBaseController', { $scope: $scope });

        $scope.field.getModel = function (data) {
            var field = $scope.field;
            var resultModelValue = null;
            var viewModelValue = field.modelValue;
            if (field.fieldType === "hidden" && field["defaultValueByKey"]) {
                resultModelValue = modelUtilService.getValueFromModelByKey(field["defaultValueByKey"], $scope.formDataModel, null, $scope.parentForm);
            }
            else if (angular.isDefined(viewModelValue)) {
                if (angular.isObject(viewModelValue) && viewModelValue.hasOwnProperty("value")) {
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
              // console.log("binding gauge",model);
               // $scope.parentModel = model;
                modelValue = model[fieldModelKey];
               var totalCount = modelValue[$scope.field["totalItems"]] ||0;
               var completedItems  = modelValue[$scope.field["setValue"]] ||0;
               var value =(totalCount!=0)?((completedItems*100)/totalCount).toFixed(1):0;
              // console.log("guage value=", $scope.field.title,totalCount,completedItems,value);
                $scope.field.value =  value;
                $scope.field.label= completedItems  +"/"+totalCount;
                $scope.field.fColor =  $scope.field["fcolor"]  ||"#ffcc66";
                $scope.field.bgColor  =  $scope.field["bgcolor"]  || "#EEE";
           
            }
            $scope.modelValuePopulated = true;
        }

        $scope.refresh = function () {
            $scope.field.modelValue = Math.random(0, 1);

        }
    });

    return angularAMD;
});