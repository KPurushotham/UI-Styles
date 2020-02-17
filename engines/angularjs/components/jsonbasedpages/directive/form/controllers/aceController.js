define(['angularAMD', 'modelUtilService', 'dateUtilService', 'fieldService','angularjs-gauge','ui-ace'], function (angularAMD) {
    'use strict';

    angularAMD.controller('aceController', function ($scope, $controller, httpService, overlay, Notification,
        $filter, modelUtilService, dateUtilService, fieldService) {
        $controller('fieldBaseController', { $scope: $scope });

        $scope.field.aceLoaded = function (_editor) {

            _editor.on('focus', function () {
                _editor.getSession().setUseWorker(true);
            });

            _editor.on('blur', function () {
                _editor.getSession().setUseWorker(false);
            });
            var _session = _editor.getSession();
            _session.setUseWorker(false);
            _session.setMode('ace/mode/json');
            var _renderer = _editor.renderer;
            _editor.$blockScrolling = Infinity;
        };
            
        $scope.field.getModel = function (data) {
            var field = $scope.field;
            var resultModelValue = null;
            var val = ace.edit(field.modelKey).getValue();
            if (val.trim() !== "") {
                var viewModelValue = JSON.stringify(JSON.parse(val)) || field.modelValue;

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
                return JSON.parse(resultModelValue);
            } else {
                return;
            }

        };
        $scope.field.setModel = function (model) {

            var fieldModelKey = $scope.field.modelKey;
            var modelValue = null;
            if (model) {
                console.log("Ace Key", $scope.field.modelKey);
                modelValue = model[$scope.field.modelKey];
                console.log("Ace Value ", modelValue);
                $scope.field.modelValue = JSON.stringify(modelValue, null, '\t');
                try {
                    ace.edit($scope.field.modelkey).setvalue(json.stringify(modelvalue, null, '\t'));
                } catch (err) {
                    console.log();
                }

            }
        };

        $scope.refresh = function () {
            $scope.field.modelValue = Math.random(0, 1);
        };
    });

    return angularAMD;
});