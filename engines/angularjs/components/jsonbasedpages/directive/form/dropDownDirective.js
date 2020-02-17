/* define(['angularAMD', 'utilService', 'dateUtilService', 'fieldService', 'fieldDefaultController', 'numericStepper'
    , 'btorfs.multiselect','dropDownController'
    , 'ngHandsontable'], function (angularAMD) {
        'use strict';

        angularAMD.directive('dropDownDirective', function ($http, $compile, utilService, dateUtilService, fieldService) {


            var linker = function (scope, element, attrs) {
                // GET template content from path
                var templateUrl = fieldService.getTemplateUrl(scope.field.fieldType);

                $http.get(templateUrl).success(function (data) {
                    element.html(data);
                    //var coreElement = angular.element(scope.field.)
                    $compile(element.contents())(scope);
                });

                function($scope, $element) {
                 //   $scope.vegetables = ['Corn', 'Onions', 'Kale', 'Arugula', 'Peas', 'Zucchini'];
                    $scope.searchTerm;
                    $scope.clearSearchTerm = function () {
                        $scope.searchTerm = '';
                    };
                    // The md-select directive eats keydown events for some quick select
                    // logic. Since we have a search input here, we don't need that logic.
                    $element.find('input').on('keydown', function (ev) {
                        ev.stopPropagation();
                   // });
                });
            }
            return {
                controller: 'dropDownController',
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
    }); */