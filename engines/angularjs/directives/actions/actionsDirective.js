define(['angularAMD','appDefinitionService'], function (angularAMD) {
    'use strict';

    angularAMD.directive('actionsDirective', function () {
        return {
            controller: function ($scope, $http, $rootScope, $filter, appDefinitionService) {
                console.log('actions', $scope.actions);
            },
            templateUrl: 'engines/angularjs/directives/actions/actionsView.html',
            restrict: 'EA',
            scope: {
                actions: '=',
                screenMode: '='
            }
        };

    });

    return angularAMD;

});

