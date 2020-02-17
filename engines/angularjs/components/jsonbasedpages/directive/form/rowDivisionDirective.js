define(['angularAMD', 'fieldDirective'], function (angularAMD) {
    'use strict';

    angularAMD.directive('rowDivisionDirective', function () {
        return {
            controller: function ($scope) {
                if( $scope.rowDivision["columns"]){
                    $scope.fieldDivisionCount =12/ $scope.rowDivision["columns"].length;
                }else{
                    $scope.fieldDivisionCount = $scope.rowDivision["fields"].length;
                }
                  $scope.submit = function () {
                    alert('Form submitted..');
                    $scope.parentForm.submitted = true;
                }

                $scope.cancel = function () {
                    alert('Form canceled..');
                }
            },
            templateUrl: 'engines/angularjs/components/jsonbasedpages/directive/form/views/rowDivision.html',
            restrict: 'EA',
            scope: {
                rowDivision: "=",
                parentForm: "=",
                parentSection: "=",
                sectionDataModel: "=",
                formDataModel: "="
            }
        };
    });

    return angularAMD;
});