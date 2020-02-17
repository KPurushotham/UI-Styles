define(['angularAMD','appDefinitionService'], function (angularAMD) {
    'use strict';

    angularAMD.directive('breadcrumbDirective', function () {
        return {
            controller: function ($scope, $http, $rootScope, $filter, appDefinitionService) {
                console.log('actions', $scope.actions);
            },
            templateUrl: 'engines/angularjs/directives/breadcrumb/breadcrumbView.html',
            restrict: 'EA',
            scope: {
                breadcrumbMap: '=',
                activePageTitle:'='
            }
        };

    });

    return angularAMD;

});

