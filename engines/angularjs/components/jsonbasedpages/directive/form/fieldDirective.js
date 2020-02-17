define(['angularAMD', 'utilService', 'dateUtilService', 'fieldService', 'fieldDefaultController', 'numericStepper',
    , 'localPersistenceService'
    , 'ngHandsontable', 'angularjs-gauge'], function (angularAMD) {
        'use strict';

        angularAMD.directive('fieldDirective', function ($http, $compile, utilService, dateUtilService, fieldService, localPersistenceService) {


            var linker = function (scope, element, attrs) {
                // GET template content from path
                var templateUrl = fieldService.getTemplateUrl(scope.field.fieldType);
               // console.log(" fieldDirective templateUrl=", templateUrl, scope.field, scope.field.fieldType);
                var elementData = localPersistenceService.get(scope.field.fieldType, true);
                if (elementData) {
                   // console.log("fieldDirective elementData data =", elementData);
                    element.html(elementData);
                    $compile(element.contents())(scope);
                } else {
                    if (templateUrl) {
                        $http.get(templateUrl).success(function (data) {
                            //console.log("fieldDirective data =", data);
                            localPersistenceService.set(scope.field.fieldType, data, true);
                            element.html(data);
                            //var coreElement = angular.element(scope.field.)
                            $compile(element.contents())(scope);
                        });
                    }
                }
            }
            return {
                controller: 'fieldDefaultController',
                restrict: 'E',
                scope: {
                    field: '=',
                    fieldDivisionCount: '=',
                    parentForm: "=",
                    parentSection: "=",
                    sectionDataModel: "=",
                    formDataModel: "=",
                    fieldIndex: "="
                },
                link: linker
            };
        });
        return angularAMD;
    });