define(['angularAMD', 'dateUtilService','modelUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.service('dateRangeService', function (dateUtilService, modelUtilService) {
        var self = this;
        this.dateRangePickerOptions = {
            locale: {
                applyClass: 'btn-green',
                applyLabel: "Apply",
                fromLabel: "From",
                format: "DD/MM/YYYY",
                toLabel: "To",
                cancelLabel: 'Cancel',
                customRangeLabel: 'Custom range'
            }
            //,
            //ranges: {
            //    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            //    'Last 30 Days': [moment().subtract(29, 'days'), moment()]
            //}
        };
        this.buildDate = function (dateOptions) {
            var dateValue;
            if (dateOptions) {
                dateValue = dateUtilService.convertToUIDate(dateOptions["value"]);
                var fromModelKey = dateOptions["fromModelKey"];
                if (!dateValue && fromModelKey) {
                    dateValueFromModel = modelUtilService.getValueFromModelByKey(fromModelKey, this.sectionDataModel);
                    var dateMoment = dateUtilService.getMoment(dateValueFromModel);
                    if (dateMoment) {
                        var addtion = dateOptions["addtion"];
                        if (addtion) {
                            addtion = addtion.toUpperCase();
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
                            if (additionFactor && datePartType) {
                                dateValue = dateMoment.subtract(additionFactor, datePartType).toDate();
                            }
                        }

                    }
                }
            }

            return dateValue;
        };
        this.setDate = function (dateKey, dateOptions, parentModel) {
            //{ "value": "", "fromModelKey": "expiryDate",  "addtion": "1D"}
            var dateValue = this.buildDate(dateOptions);
            if (dateValue) {
                parentModel[dateKey] = dateValue;
            }

            return dateValue;
        };
        this.setStartDate = function (dateOptions) {
            this.setDate("startDate", dateOptions);
        };
        this.setEndDate = function (dateOptions) {
            this.setDate("endDate", dateOptions);
        };
        this.setRange = function (dateRangeOptions) {
            this.setDate("startDate", dateRangeOptions["startDate"]);
            this.setDate("endDate", dateRangeOptions["endDate"]);
        };
        var setWatchOnModelDateValue = function (scope, dateModelKey, dateViewKey) {
            if (scope.sectionDataModel && dateModelKey) {
                scope.$watch('sectionDataModel.' + dateModelKey, function (n) {
                    if (scope.sectionDataModel[scope.field.modelKey]) {
                        scope.sectionDataModel[scope.field.modelKey] = {};
                    }
                    return scope.setDate(dateViewKey, { "value": n }, scope.sectionDataModel[ scope.field.modelKey]);
                });
            }
        };
        var setWatchOnDateViewValue = function (scope, startDateModelKey, endDateModelKey) {
            //Watch for date changes
            if (scope.sectionDataModel && scope.field.modelKey) {
                scope.$watch('sectionDataModel.' + scope.field.modelKey, function (newDate) {
                    if (scope.field.dateRangeConfig && newDate) {
                        if (startDateModelKey && newDate["startDate"]) {
                            scope.sectionDataModel[startDateModelKey] = newDate["startDate"];
                        }
                        if (startDateModelKey && newDate["endDate"]) {
                            scope.sectionDataModel[endDateModelKey] = newDate["endDate"];
                        }
                    }

                }, false);
            }
           
        };

        this.init = function (scope) {
            if (!scope) return null;
            scope.buildDate = self.buildDate;
            scope.setDate = self.setDate;
            scope.setRange = self.setRange;

            scope.setStartDate = self.setStartDate;
            scope.setEndDate = self.setEndDate;
            scope.options = self.dateRangePickerOptions;


            if (scope.field.dateRangeConfig) {
                var dateRangeFieldModelKey = scope.field.modelKey;
                var startDateModelKey = scope.field.dateRangeConfig["startDateModelKey"] || dateRangeFieldModelKey + "StartDate";
                var endDateModelKey = scope.field.dateRangeConfig["endDateModelKey"] || dateRangeFieldModelKey + "EndDate";

                setWatchOnModelDateValue(scope, startDateModelKey, "startDate");
                setWatchOnModelDateValue(scope, endDateModelKey, "endDate");
                setWatchOnDateViewValue(scope, startDateModelKey, endDateModelKey);

            }

            return self;
        };
    });

    return angularAMD;
});