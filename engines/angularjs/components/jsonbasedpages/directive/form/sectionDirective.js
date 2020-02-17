define(['angularAMD', 'rowDivisionDirective', 'modelUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.directive('sectionDirective', ['modelUtilService', function (modelUtilService) {
        var sectionDirectiveController = function ($scope, modelUtilService) {

            $scope.section.runSectionSpecificRules = function (rulesList, args) {
                var sectionFieldMap = $scope.section["fieldMap"];
                if (!sectionFieldMap) {
                    console.log("sectionFieldMap build is missing, building it again");
                    buildSectionFieldMap();
                }

                for (var i = 0; i < rulesList.length; i++) {
                    var rule = rulesList[i];
                    for (var ruleName in rule) {
                        var ruleData = rule[ruleName];
                        for (var ruleFinalValue in ruleData) {
                            var modelKeyList = modelUtilService.getAsList(ruleData[ruleFinalValue]);
                            for (var j = 0; j < modelKeyList.length; j++) {
                                var modelKey = modelKeyList[j];
                                var field = sectionFieldMap[modelKey];
                                var resultFlag = (ruleFinalValue.toLowerCase() === "true");
                                field[ruleName] = resultFlag;
                            }
                        }
                    }
                }
            };
            $scope.$on('notifyDependantsOnParentDataChange', function (event, args) {
                console.log('notifyDependantsOnParentDataChange args:', args);
                var currentSection = $scope.section;

                $scope.parentForm.runDependancy("SECTION", currentSection, args);

            });

            $scope.section.getFieldByModelKey = function (modelKey) {
                var resultField;
                var sectionFieldMap = $scope.section["fieldMap"];
                if (!sectionFieldMap) {
                    console.log("sectionFieldMap build is missing, building it again");
                    buildSectionFieldMap();
                }
                if (modelKey) {
                    resultField = sectionFieldMap[modelKey];
                }
                return resultField;
            };

            var buildSectionFieldMap = function () {
                $scope.section["fieldMap"] = {};
                var section = $scope.section;
                var rowDivisions = section.rowDivisions;
                var tabs = section.tabs;

                buildRowDivisionLevelFieldMap(rowDivisions, section.modelKey);
                if (tabs != null) {
                    for (var i = 0; i < tabs.length; i++) {
                        buildRowDivisionLevelFieldMap(tabs[i].rowDivisions, section.modelKey, tabs[i].modelKey);
                    }
                }
            };

            var buildRowDivisionLevelFieldMap = function (rowDivisions, sectionModelKey, tabModelKey) {
                if (!rowDivisions) return;
                var fieldMap = $scope.section["fieldMap"];
                for (var j = 0; j < rowDivisions.length; j++) {

                    if (rowDivisions[j].columns && rowDivisions[j].columns.length > 0) {
                        for (var k = 0; k < rowDivisions[j].columns.length; k++) {
                            var cfields = rowDivisions[j].columns[k].fields;
                            pushToFiledMap(cfields,fieldMap,sectionModelKey,tabModelKey);
                        }
                    } else {
                        var fields = rowDivisions[j].fields;
                        pushToFiledMap(fields,fieldMap,sectionModelKey,tabModelKey);
                    }
                }
            }

            var pushToFiledMap = function (fields, fieldMap, sectionModelKey, tabModelKey) {
                                
                for (var k = 0; k < fields.length; k++) {
                    var field = fields[k];
                    field.sectionModelKey = sectionModelKey;
                    field.tabModelKey = tabModelKey;

                    if (field.modelKey === undefined) {
                        field.modelKey = field.fieldKey;
                    }

                    if (fieldMap.hasOwnProperty(field.modelKey)) {
                        if (angular.isArray(fieldMap[field.modelKey])) {
                            fieldMap[field.modelKey].push(field);
                        }
                        else {
                            fieldMap[field.modelKey] = [fieldMap[field.modelKey]];
                        }
                    }
                    else {
                        fieldMap[field.modelKey] = field;
                    }
                }
            }

            $scope.section.applyDefaultRules = function (ruleKey, isAtFieldLevel) {
                var defaults = $scope.section.defaultRules;
                var sectionFieldMap = $scope.section["fieldMap"];
                if (ruleKey) {
                    $scope.section[ruleKey] = defaults[ruleKey];
                }
                else {
                    angular.forEach(defaults, function (defaultValue, key) {
                        $scope.section[key] = defaultValue;
                    });
                }
                if (isAtFieldLevel) {
                    if (!sectionFieldMap) {
                        console.log("sectionFieldMap build is missing, building it again");
                        buildSectionFieldMap();
                    }
                    for (var fieldModelKey in sectionFieldMap) {
                        var field = sectionFieldMap[fieldModelKey];
                        field.applyDefaultRules(ruleKey);
                    }
                }

            };
            var init = function () {
                var defaults = { "show": true, "disabled": false };
                $scope.section.defaultRules = angular.copy(defaults);
                buildSectionFieldMap();
                angular.forEach(defaults, function (defaultValue, key) {
                    if ($scope.section[key] === undefined) {
                        $scope.section[key] = defaultValue;
                    }
                    $scope.section.defaultRules[key] = $scope.section[key];
                });

                var modelKey = $scope.section.modelKey;
                if (modelKey) {
                    $scope.sectionDataModel = $scope.formDataModel[modelKey] || {};
                }
                else {
                    $scope.sectionDataModel = $scope.formDataModel;
                }

            };
            console.log("$scope.section", $scope.section);
            init();
        };
        return {
            controller: sectionDirectiveController,
            templateUrl: 'engines/angularjs/components/jsonbasedpages/directive/form/views/section.html',
            restrict: 'EA',
            scope: {
                section: '=',
                parentForm: "=",
                formDataModel: "="
            }
        };
    }]);
    return angularAMD;
});