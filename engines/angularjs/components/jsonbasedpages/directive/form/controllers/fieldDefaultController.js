define(['angularAMD', 
        'ngSanitize',
        'utilService', 
        'dateUtilService', 
        'fieldService', 
        'fieldBaseController',
        'dateRangeFieldController', 
        'compositeRepeaterFieldController', 
        'gridFieldController', 
        'raceDayFieldController',
        'excelGridFieldController', 
        'gaugeController',
        'webPortalFieldController',
        'aceController',
        'kanbanController',
        'genericController',
        'progressstepsContrroller'
    ], function (angularAMD) {
    'use strict';

    angularAMD.controller('fieldDefaultController', function ($scope, $sce, $controller, httpService, overlay, Notification, $filter, fieldService) {

        var controllerName = fieldService.getControllerName($scope.field.fieldType);
        $controller(controllerName, { $scope: $scope });
        console.log("***controllerName", controllerName);
        console.log("***fieldType", $scope.field.fieldType);
        //console.log("*** $scope.field",$scope.field);
        
        var init = function () {
            $scope.field.trustedHtml = $sce.trustAsHtml($scope.field.innerHtml);
        };

        init();
    });

    return angularAMD;
});