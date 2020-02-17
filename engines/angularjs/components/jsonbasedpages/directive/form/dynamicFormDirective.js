define(['angularAMD', 'sectionDirective', 'gridService', 'modelUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.directive('dynamicFormDirective', ['$filter', 'modelUtilService', function ($filter, modelUtilService) {


        var dynamicFormDirectiveController = function ($scope) {
            var formFieldMap;
            var runDependancy = function (levelType, dependerConfig, args, callback) {
                var eventSourceField = args.eventSourceField;
                var dependancyEvents = eventSourceField.dependancyEvents;
                var eventName = args["eventName"];
                if (!dependancyEvents || eventSourceField.modelKey === dependerConfig.modelKey) {
                    return;
                }
                var dependancyConfig = dependerConfig["dependancyConfig"];
                if (!dependancyConfig) {
                    console.log("no dependancy for " + levelType + " with model" + dependerConfig.modelKey + " on source field with model key " + eventSourceField.modelKey);
                    return;
                }
                for (var i = 0; i < dependancyConfig.length; i++) {
                    var currentSourceDC = dependancyConfig[i];
                    var sourceKey = currentSourceDC["sourceKey"];
                    var sourceKeyMap = currentSourceDC["sourceKeyMap"];

                    var sourceKeyList = [];
                    var isCurrentSourceEventMatched = false;
                    if (angular.isArray(sourceKey) || angular.isArray(sourceKeyMap)) {
                        var sourceKeyMap = sourceKeyMap || sourceKey;
                        if (sourceKeyMap.indexOf(eventSourceField.modelKey) > -1) {
                            var sourceEventName = currentSourceDC["event"];
                            isCurrentSourceEventMatched = sourceEventName === eventName;
                        }
                        else {
                            var matchedItems = $filter('filter')(sourceKeyMap, { "sourceKey": eventSourceField.modelKey, "event": eventName });
                            isCurrentSourceEventMatched = matchedItems && matchedItems.length > -1

                        }
                    }
                    else if (angular.isString(sourceKey)) {
                        var sourceEventName = currentSourceDC["event"];
                        isCurrentSourceEventMatched = (eventSourceField.modelKey == sourceKey && sourceEventName === eventName);
                    }

                    if (isCurrentSourceEventMatched) {
                        runValidations(levelType, dependerConfig, args, currentSourceDC);
                        if (callback) callback(currentSourceDC);
                        break;
                    }
                }
            };
            var isCurrentSourceEventMatched = function (sourceKeyMap, currentSourceDC) {

            }
            var runDefaultRules = function (levelType, dependerConfig) {
                var defaultRules = angular.copy(dependerConfig["defaultRules"]);

                angular.forEach(defaultRules, function (validationData, validationKey) {
                    dependerConfig[validationKey] = validationData;
                });
                if (levelType === "SECTION") {
                    var rowDivisions = dependerConfig.rowDivisions
                    if (rowDivisions && rowDivisions.length > 0) {
                        for (var i = 0; i < rowDivisions.length; i++) {
                            var fields = rowDivisions[i]["fields"];
                            if (fields && fields.length > 0) {
                                for (var j = 0; j < fields.length; j++) {
                                    var fieldDefaultRules = fields[j]["defaultRules"];

                                    angular.forEach(fieldDefaultRules, function (validationData, validationKey) {
                                        fields[j][validationKey] = validationData;
                                    });
                                }
                            }
                        }
                    }
                }
            };
            var runSpecificRules = function (levelType, rules, dependerConfig, args) {
                //"rules":{"show":{"true":[],"false":[]},"disabled":{"true":[],"false":[]},"required":{"true":[],"false":[]}}
                var rulesList = modelUtilService.getAsList(rules);
                if (levelType === "FIELD") {
                    dependerConfig.runFieldSpecificRules(rulesList, args);
                }
                else if (levelType === "SECTION") {
                    dependerConfig.runSectionSpecificRules(rulesList, args);
                }
            };
            var runDefaultValuePopulation = function (levelType, validationConfig, dependerConfig, args) {
                dependerConfig.runDefaultValuePopulation(validationConfig, args);
            };
            /*
            "if":[{"modelKey":"allocationType","in":["local"],
                  "then":{"defaultValueByKey":"costCenterFrom","rules":{"disabled":true}},
                   "else":{"defaultValue":"","rules":{"disabled":false}}}]
            */
            var runIfRules = function (levelType, dependerConfig, args, currentSourceDC) {
                if (levelType == "FIELD") {
                    dependerConfig.runIfRules(args, currentSourceDC);
                }
            };
            var runValidations = function (levelType, dependerConfig, args, currentSourceDC) {
                var eventSourceValue = args["eventSourceValue"];

                runDefaultRules(levelType, dependerConfig);
                runIfRules(levelType, dependerConfig, args, currentSourceDC);
                var validationsConfig = currentSourceDC["validations"];
                if (validationsConfig) {
                    angular.forEach(validationsConfig, function (validationData, validationKey) {
                        if (validationKey === "show" || levelType === "FIELD") {
                            dependerConfig[validationKey] = validationData;
                        }
                        else if (validationKey == "disabled") {
                            var rowDivisions = dependerConfig.rowDivisions
                            if (rowDivisions && rowDivisions.length > 0) {
                                for (var i = 0; i < rowDivisions.length; i++) {
                                    var fields = rowDivisions[i]["fields"];
                                    if (fields && fields.length > 0) {
                                        for (var j = 0; j < fields.length; j++) {
                                            var field = fields[j];
                                            field[validationKey] = validationData;
                                        }
                                    }
                                }
                            }
                        }
                        if (validationKey === "ifSourceValue") {
                            var validationDataList = modelUtilService.getAsList(validationData);

                            for (var k = 0; k < validationDataList.length; k++) {
                                var validationConfig = validationDataList[k];
                                var inValues = validationConfig["in"];
                                var notInValues = validationConfig["not-in"];
                                var rules = validationConfig["rules"];
                                if (inValues && (inValues === "ALL" || (angular.isArray(inValues) && inValues.indexOf(eventSourceValue))) >= 0) {
                                    runDefaultValuePopulation(levelType, validationConfig, dependerConfig, args);
                                    runSpecificRules(levelType, rules, dependerConfig);
                                }
                                else if (notInValues && !(notInValues.indexOf(eventSourceValue) >= 0)) {
                                    runDefaultValuePopulation(levelType, validationConfig, dependerConfig, args);
                                    runSpecificRules(levelType, rules, dependerConfig);
                                }
                            }
                            var result = validationData;
                            if (angular.isObject(validationData)) {
                                var ifSourceValueInList = validationData["ifSourceValueIn"];
                                if (ifSourceValueInList && ifSourceValueInList.indexOf(eventSourceValue) >= 0) {
                                    result = validationData["result"];
                                }
                            }

                        }
                    });
                }

            };

            $scope.form.getModelValueByModelKey = function (fieldModelKey, sectionModelKey) {
                var resultFieldModelValue;
                var sectionModel = $scope.formDataModel[sectionModelKey] || $scope.formDataModel;
                if (sectionModel) {
                    resultFieldModelValue = sectionModel[fieldModelKey];
                    if (resultFieldModelValue && resultFieldModelValue["value"]) {
                        resultFieldModelValue = resultFieldModelValue["value"];
                    }
                }
               
                return resultFieldModelValue;
            };

            $scope.form.applyDefaultRules = function (ruleKey, isAtFieldLevel, sectionModelKey) {
                for (var i = 0; i < $scope.form.sections.length; i++) {
                    var section = $scope.form.sections[i];
                    if (sectionModelKey) {
                        if (section.modelKey == sectionModelKey) {
                            section.applyDefaultRules(ruleKey, isAtFieldLevel);
                            break;
                        }
                    }
                    else {
                        section.applyDefaultRules(ruleKey, isAtFieldLevel);
                    }
                }
            };
            $scope.form.getSectionByModelKey = function (sectionModelKey) {
                var restultSection;
                var formSections = $scope.sections || $scope.form.sections;
                for (var i = 0; i < formSections.length; i++) {
                    var section = formSections[i];
                    if (sectionModelKey) {
                        if (section.modelKey === sectionModelKey) {
                            restultSection = section;
                            break;
                        }
                    }
                }
                return restultSection;
            };

            $scope.form.getFieldByModelKey = function (fieldModelKey, sectionModelKey, tabModelKey) {
                var restultFields;

                var sections = $scope.form.sections;
                restultFields = [];
                for (var i = 0; i < sections.length; i++) {
                    var section = sections[i];
                    if (angular.isFunction(section.getFieldByModelKey)) {
                        var matchedFields = section.getFieldByModelKey(fieldModelKey);
                        if (matchedFields) {
                            restultFields.push(matchedFields);
                        }
                    }
                    
                }
                restultFields = _.filter(restultFields, function (item) {
                    return (item.sectionModelKey === sectionModelKey) ||
                        (item.tabModelKey === tabModelKey);
                });
                if (restultFields.length === 1) {
                    restultFields = restultFields[0];
                }
                else if (restultFields.length === 0) {
                    restultFields = null;
                }
                return restultFields;
            };

            $scope.getFieldByType = function (sections, type) {
                var mfield = {};
                //sections
                angular.forEach(sections, function (section, index) {
                    var rows = section.rowDivisions;
                    //rows
                    angular.forEach(rows, function (row, index) {
                        var columns = row.columns;
                        //columns
                        angular.forEach(columns, function (column, index) {
                            var fields = column.fields;
                            //fields
                            var fModel = {};
                            angular.forEach(fields, function (field, index) {

                                if (field.fieldType === type) {//} "reportGrid") {
                                    mfield = field;
                                    return mfield;
                                }

                            });
                        });
                    });
                });
                return mfield;
            };

     
            var init = function () {
                console.log("runDependancy=",runDependancy);
                if ($scope.form) $scope.form.runDependancy = runDependancy;
                $scope.formDataModel = $scope.formDataModel || {};

                if ($scope.form.globalDataServices) {
                    $scope.loadFieldDataFromGlobalDataServices();
                }
            };

            $scope.loadFieldDataFromGlobalDataServices = function () {
                modelUtilService.loadFieldDataFromSingleService($scope.form.globalDataServices, function (targetFieldDataMap, originalServiceData) {
                    modelUtilService.loadFormFieldsData($scope.form.sections, targetFieldDataMap);

                });
            };
            $scope.$on('parentDataChanged', function (event, args) {
                console.log('parentDataChanged args:', args);

                $scope.$broadcast('notifyDependantsOnParentDataChange', args);

            });
            $scope.submit = function () {
                alert('Form submitted..');
                $scope.form.submitted = true;
            };

            $scope.cancel = function () {
                alert('Form canceled..');
            };

            init();
        };

        return {
            controller: dynamicFormDirectiveController,
            templateUrl: 'engines/angularjs/components/jsonbasedpages/directive/form/views/dynamicForm.html',
            restrict: 'EA',
            scope: {
                form: '=',
                formDataModel: "="
            }
        };
    }])
    .directive("dynamicName", function ($compile, gridService) {
        var evalDependancyEvents = function (scope, element, attrs) {
            var dependancyEvents = scope.$eval(attrs.dependancyEvents);
            if (dependancyEvents) {
                if (angular.isArray(dependancyEvents)) {
                    angular.forEach(dependancyEvents, function (event, key) {
                        scope.bindEvent(element, event);
                    });
                }
                if (angular.isString(dependancyEvents)) {
                    scope.bindEvent(element, dependancyEvents);
                }
            }

            element.removeAttr("dependancy-events");
        };

        var evalGridFeaturesList = function (scope, element, attrs) {
            if (attrs.gridFeatures) {
                var gridFeatures = scope.$eval(attrs.gridFeatures);
                if (angular.isString(gridFeatures)) {
                    var feature = gridFeatures;
                    gridFeatures = [];
                    gridFeatures.push(feature);
                }
                if (angular.isArray(gridFeatures)) {
                    angular.forEach(gridFeatures, function (feature, index) {
                        if (gridService.isSupportedGridFeatures(feature)) {
                            element.attr('ui-grid-' + feature, "");
                        }
                        else {
                            console.log(feature + "is not a supported grid feature, supported features are:", gridService.SUPPORTED_GRID_FEATURES);
                        }
                    });
                }
            }

            element.removeAttr("grid-features");
        };

        return {
            restrict: "A",
            terminal: true,
            priority: 1000,
            link: function (scope, element, attrs) {
                element.attr('name', scope.$eval(attrs.dynamicName));
                element.removeAttr("dynamic-name");

                evalDependancyEvents(scope, element, attrs);
                evalGridFeaturesList(scope, element, attrs);

                $compile(element)(scope);
            }
        };

    }).directive("validateUndefined", function ($compile) {

        function link($scope, $element, $attrs, $ctrl) {
            var UNDEFINED_REGEXP = /\bundefined\b/;
            $ctrl.$validators.undefined = function undefinedParser(modelValue, viewValue) {
                var value = modelValue || viewValue;
                if (value) {
                    value = angular.isNumber(value) ? value.toString() : value.toLowerCase();
                    var isValid = (UNDEFINED_REGEXP.test(value));
                    isValid = isValid || (value.indexOf("--") == -1) ? false : true;
                    // if (isValid) $ctrl.$error.undefined = !isValid;
                    return !isValid;
                }
                return true;
            };
        }

        return {
            require: 'ngModel',
            link: link
        };

    });

    return angularAMD;
});