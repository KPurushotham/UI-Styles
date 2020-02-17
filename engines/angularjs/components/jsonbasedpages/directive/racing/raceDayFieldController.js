define(['angularAMD', 'modelUtilService', 'fieldService', 'gridService'], function (angularAMD) {
    'use strict';

    angularAMD.controller('raceDayFieldController', function ($scope, $injector, $http, $location, $controller, httpService, overlay, Notification, $filter,
        $templateCache, modelUtilService, fieldService, gridService) {
        var self = this;

        var fieldConfigUrl = "directive/racing/fieldConfig.json";
        var loadingFieldConfiguration = function () {
            $http.get(fieldConfigUrl).then(function (remoteData) {
                $scope.sections = remoteData.data.sections;
                var sectionCount = $scope.sections.length;
                var hideFields = $scope.field.hideFields;
                var showFields = $scope.field.showFields;
                var requiredFields = $scope.field.requiredFields;
                for (var i = 0; i < sectionCount; i++) {
                    var section = $scope.sections[i];
                    var rowDivisions = section.rowDivisions;
                    for (var j = 0; j < rowDivisions.length; j++) {
                        var fields = rowDivisions[j].fields;
                        for (var k = 0; k < fields.length; k++) {

                            if ((showFields && showFields.indexOf(fields[k].modelKey) < 0) || (hideFields && hideFields.indexOf(fields[k].modelKey) > -1)) {
                                fields[k].show = false;
                            }
                            if ((requiredFields && requiredFields.indexOf(fields[k].modelKey) < 0)) {
                                fields[k].required = false;
                            }
                            //if ((showFields && showFields.indexOf(fields[k].modelKey) < 0)) {
                            //    fields[k].show = true;
                            //}
                        }
                    }
                }
                if (remoteData.data.globalDataServices) {
                    $scope.loadFieldDataFromGlobalDataServices(remoteData.data.globalDataServices);
                }

                //if ($scope.section) {
                //   $scope.populateSectionModel($scope.sections, $scope.formDataModel, $scope.formDataModel);
                //}

            }, function (error) {
                Notification.error({ message: 'Screen configuration is not found for "' + screenKey + '".', title: 'CODE ERROR - SCREEN CONFIG ERROR', delay: 5000 });
                overlay.hide();
            });
        };


        $scope.loadFieldDataFromGlobalDataServices = function (globalDataServices) {
            for (var i = 0; i < globalDataServices.length; i++) {
                modelUtilService.loadFieldDataFromSingleService(globalDataServices[i], function (targetFieldDataMap, originalServiceData) {
                    console.log("targetFieldDataMap", targetFieldDataMap);
                    modelUtilService.loadFormFieldsData($scope.sections, targetFieldDataMap);
                });
            }

        };
        $scope.populateSectionModel = function (sectionDefs, sourceModel, targetModel) {
            var sections;
            if (!angular.isArray(sectionDefs) && sectionDefs.rowDivisions) {
                sections = [];
                sections.push(sectionDefs);
            }
            else {
                sections = sectionDefs;
            }
            for (var i = 0; i < sections.length; i++) {
                var section = sections[i];
                var rowDivisions = section.rowDivisions;
                var rowItemCount = (rowDivisions && rowDivisions.length > 0) ? rowDivisions.length : 1;

                for (var i = 0; i < rowItemCount; i++) {
                    var rowFields = rowDivisions[i]["fields"];
                    for (var j = 0; j < rowFields.length; j++) {
                        var field = rowFields[j];
                        if (field.defaultValue) {
                            $scope.targetModel[field.modelKey] = field.defaultValue;
                        }
                        else if (field.defaultValueByKey) {
                            $scope.targetModel[field.modelKey] = modelUtilService.getValueFromModelByKey(field.defaultValueByKey, sourceModel, null, $scope.parentForm);
                        }

                    }
                }
            }
        };

        $scope.field.getModel = function () {
            if (!$scope.field.modelKeyMap) {
                console.log("modeKeyMap is missing");
                return;
            }
            var modelKeyMap = $scope.field.modelKeyMap;
            var fieldViewModel = $scope.sectionDataModel;
            console.log("fieldViewModel", fieldViewModel);
            console.log("formDataModel", $scope.formDataModel);
            var model = {};
            for (var i = 0; i < modelKeyMap.length; i++) {
                var modelKey = modelKeyMap[i];
                model[modelKey] = modelUtilService.getValueFromModelByKey(modelKey, fieldViewModel, null, $scope.parentForm);
            }
            return model;
        };

        $scope.setAdditionalDependancyParams = function (gridParams) {
            var dependancyConfigList = $scope.field["dependancyConfig"];

            fieldService.buildAdditionalDependancyParams(dependancyConfigList, $scope.formDataModel, function (additionalKeyParams, source) {
                if (additionalKeyParams && source) {
                    var qsParamsList = [];
                    var k = 0;
                    angular.forEach(additionalKeyParams, function (modelKey, paramName) {
                        if (modelKey) {
                            var parentSectionModelKey = $scope.parentSection ? $scope.parentSection.modelKey : '';
                            var sourceDataModelValue = modelUtilService.getValueFromModelByKey(modelKey, source, $scope.parentSection.modelKey, $scope.parentForm);

                            qsParamsList[k++] = paramName + "=" + sourceDataModelValue;
                        }

                    });
                    gridParams["additionalQSParams"] = qsParamsList.join("&");
                }
            });
        };

        var init = function () {
            loadingFieldConfiguration();
            return self;
        };

        init();
        //Generate Grid
        $scope.$on("$destroy", function () {
            $scope.fieldGridOptions = {};
        });

        $scope.actionHanlder = function (action, source, sectionDataModel) {
            console.log(action, source, sectionDataModel);
        }
    });

    return angularAMD;
});