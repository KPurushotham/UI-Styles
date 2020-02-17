define(['angularAMD', 'modelUtilService', 'dateUtilService', 'fieldService'], function (angularAMD) {
    'use strict';

    angularAMD.controller('dateRangeFieldController', function ($scope, $controller, httpService, overlay, Notification,
        $filter, modelUtilService, dateUtilService, fieldService) {

        $controller('fieldBaseController', { $scope: $scope });

        $scope.dateRangePickerOptions = {
            locale: {
                applyClass: 'btn-green',
                applyLabel: "Apply",
                fromLabel: "From",
                format: "MM/DD/YYYY",
                toLabel: "To",
                cancelLabel: 'Cancel',
                customRangeLabel: 'Custom range'
               
            },
            eventHandlers: {
                changeDate: function () {
                    console.log("$scope.field.modelValue", $scope.field.modelValue);
                }
            }
            //,
            //ranges: {
            //    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            //    'Last 30 Days': [moment().subtract(29, 'days'), moment()]
            //}
        };
        $scope.field.setModel = function (model) {
            var fieldModelKey = $scope.field.modelKey;
            var modelValue = null;
            if (model) {
                $scope.parentModel = model;
                var startDateModelKey;
                var endDateModelKey;
                if ($scope.field.dateRangeConfig) {
                    startDateModelKey = $scope.field.dateRangeConfig["startDateModelKey"] || "startDate";
                    endDateModelKey = $scope.field.dateRangeConfig["endDateModelKey"] || "endDate";
                }
                else {
                    startDateModelKey = "startDate";
                    endDateModelKey = "endDate";
                }

                var dateRangeValue = model;
                if (fieldModelKey && $scope.field.useFieldLevelModelKey) {
                    dateRangeValue = model[fieldModelKey];
                }
                var startDate = dateUtilService.convertFromDBFormat(dateRangeValue[startDateModelKey]);
                var endDate = dateUtilService.convertFromDBFormat(dateRangeValue[endDateModelKey]);

                modelValue = { "startDate": new moment(startDate, dateUtilService.DATE_FORMAT), "endDate": new moment(endDate, dateUtilService.DATE_FORMAT) };
                //modelValue = {};
                // modelValue[startDateModelKey] = startDate;
                // modelValue[endDateModelKey] = endDate;

            }
            if (modelValue == null) {
                $scope.setDefaultValue();
            }
            else {
                $scope.field.modelValue = modelValue;
            }

        };
        $scope.setDefaultValue = function () {
            var dateRangeConfig = $scope.field.dateRangeConfig;
            if (dateRangeConfig) {
                var startDateOption = dateRangeConfig["startDate"];
                if (startDateOption) $scope.setStartDate(startDateOption);
                var endDateOption = dateRangeConfig["endDate"];
                if (endDateOption) $scope.setEndDate(endDateOption);
            }
          
        };
        $scope.field.getModel = function (forViewModel) {
            var modelValue;
            modelValue = fieldService.getDateRangeModelValue($scope.field, forViewModel);
            return modelValue;
        };

        $scope.buildDate = function (dateOptions) {
            var dateValue;
            if (dateOptions) {
                dateValue = dateUtilService.convertToUIDate(dateOptions["value"]);
                var fromModelKey = dateOptions["fromModelKey"];
                if (!dateValue && fromModelKey) {
                   var dateValueFromModel = modelUtilService.getValueFromModelByKey(fromModelKey, this.sectionDataModel, null, $scope.parentForm);
                    var dateMoment = dateUtilService.getMoment(dateValueFromModel);
                    if (dateMoment) {
                        var addtion = dateOptions["addtion"];
                        if (addtion) {
                            addtion = addtion.toString().toUpperCase();
                            var additionFactor = parseInt(addtion.match(/[-]?\d+/)[0], 10);
                            var datePartType;
                            if (addtion.endsWith("D") || addtion.endsWith("DAY") || addtion.endsWith("DAYS")) {
                                datePartType = "days";
                            }
                            else if (addtion.endsWith("M") || addtion.endsWith("MONTH") || addtion.endsWith("MONTHS")) {
                                datePartType = "months";
                            }
                            else if (addtion.endsWith("Y") || addtion.endsWith("YEAR") || addtion.endsWith("YEARS")) {
                                datePartType = "years";
                            }
                            if (datePartType) {
                                dateMoment = dateMoment.add(additionFactor, datePartType);
                            }
                        }
                        else if (dateOptions["year"]) {
                            dateMoment = dateMoment.year(dateOptions["year"]);
                        }
                        else if (dateOptions["month"]) {
                            dateMoment = dateMoment.month(dateOptions["month"]);

                        }
                        else if (dateOptions["day"]) {
                            dateMoment = dateMoment.day(dateOptions["day"]);
                        }
                        dateValue = dateMoment.toDate();
                    }
                }
            }

            return dateValue;
        };
        $scope.setDate = function (dateKey, dateOptions, parentModel) {
            //{ "value": "", "fromModelKey": "expiryDate",  "addtion": "1D"}
            var dateValue = $scope.buildDate(dateOptions);
            parentModel = parentModel || $scope.field.modelValue;//$scope.sectionDataModel[$scope.field.modelKey];
            if (dateValue) {
                
                if (parentModel) parentModel[dateKey] = dateValue;
                $scope.field.modelValue = $scope.field.modelValue || {};
                $scope.field.modelValue[dateKey] = dateValue;
            }
           
            return dateValue;
        };
        $scope.setStartDate = function (dateOptions) {
            $scope.setDate("startDate", dateOptions);
        };
        $scope.setEndDate = function (dateOptions) {
            $scope.setDate("endDate", dateOptions);
        };
        $scope.setRange = function (dateRangeOptions) {
            $scope.setDate("startDate", dateRangeOptions["startDate"]);
            $scope.setDate("endDate", dateRangeOptions["endDate"]);
        };
        var setWatchOnModelDateValue = function (dateModelKey, dateViewKey) {
            if ($scope.sectionDataModel && dateModelKey) {
                $scope.$watch('sectionDataModel.' + dateModelKey, function (n) {
                    if (!$scope.sectionDataModel[$scope.field.modelKey]) {
                        $scope.sectionDataModel[$scope.field.modelKey] = {};
                    }
                
                    return $scope.setDate(dateViewKey, { "value": n }, $scope.sectionDataModel[$scope.field.modelKey]);
                });
            }
        };
        var setWatchOnDateViewValue = function (startDateModelKey, endDateModelKey) {
            //Watch for date changes
            if ($scope.sectionDataModel && $scope.field.modelKey) {
                $scope.$watch('sectionDataModel.' + $scope.field.modelKey, function (newDate) {
                    if ($scope.field.dateRangeConfig && newDate) {
                        if (startDateModelKey && newDate["startDate"]) {
                            $scope.sectionDataModel[startDateModelKey] = newDate["startDate"];
                        }
                        if (startDateModelKey && newDate["endDate"]) {
                            $scope.sectionDataModel[endDateModelKey] = newDate["endDate"];
                        }
                    }

                }, false);
            }

        };

        var init = function () {

            if ($scope.field.dateRangeConfig) {
                var dateRangeFieldModelKey = $scope.field.modelKey;
                var startDateModelKey = $scope.field.dateRangeConfig["startDateModelKey"] || dateRangeFieldModelKey + "StartDate";
                var endDateModelKey = $scope.field.dateRangeConfig["endDateModelKey"] || dateRangeFieldModelKey + "EndDate";

                //setWatchOnModelDateValue(startDateModelKey, "startDate");
                //setWatchOnModelDateValue(endDateModelKey, "endDate");
                //  setWatchOnDateViewValue(startDateModelKey, endDateModelKey);
                if ($scope.field.modelKey) {

                    var dependancyEvents = $scope.field["dependancyEvents"];
                    var changeEventConfig;
                    if (dependancyEvents) {
                        changeEventConfig = _.filter(dependancyEvents, function (item) {
                            return item.eventName == "change";
                        });
                        changeEventConfig = changeEventConfig[0];
                    }
                   
                    $scope.$watch('field.modelValue', function (n) {
                        if (!$scope.sectionDataModel[$scope.field.modelKey]) {
                            $scope.sectionDataModel[$scope.field.modelKey] = {};
                        }
                        if (changeEventConfig) {
                            $scope.eventHandler($scope.field, changeEventConfig["eventName"], null, changeEventConfig);
                        }
                       console.log($scope.field.modelKey, $scope.field.modelValue, );
                        return $scope.sectionDataModel[$scope.field.modelKey] = n;
                    });
                }
            }
            $scope.field.setModel($scope.field.parentModel);
            return self;
        }

        init();

    });

    return angularAMD;
});