define(['angularAMD', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.service('fieldService', function ($filter, dateUtilService) {
        var self = this;
        this.SUPPORTED_EVENT_MAP = {
            "change": "ng-change",
            "click": "ng-click"
        };
        this.SUPPORTED_PATTERN_REGEX_MAP = {
            "currency": /^[0-9]+(\.[0-9]{1,2})?$/,
            "phoneNumber": /^\(?(\d{3})\)?[ .-]?(\d{3})[ .-]?(\d{4})$/
        };

        this.SUPPORTED_FIELDS = [
            'label',
            'textbox',
            'email',
            'textarea',
            'checkbox',
            'date',
            'daterange',
            'currency',
            'dropdown',
            'multiselect',
            'hidden',
            'password',
            'systemcode',
            'radio',
            'composite-repeater-field',
            'grid',
            'excel-grid',
            'numeric',
            'multidatepicker',
            'hyperlink',
            'button',
            'number',
            'singleradio',
            'gauge',
            'repeater',
            'refresh',
            'ace',
            'fieldlabel',
            'nesteddrop',
            'nestedone',
            'file',
            'listbox',
            'kanban',
            'notification',
            "generic",
            'progresssteps'
        ];
        
        this.SUPPORTED_FIELDS_TEMPLATE_MAP = {
            "raceday": "engines/angularjs/components/jsonbasedpages/directive/racing/views/raceday",
            "webportal": "engines/angularjs/lib/customfields/webportalField/views/webportal",
            
        }
        //TODO: set defaults from field directive and extend here.
        var defaults = {
            "defaultControllerName": "fieldBaseController",
            controllers: {
                "grid": "gridFieldController",
                "excel-grid": "excelGridFieldController",
                "daterange": "dateRangeFieldController",
                "composite-repeater-field": "compositeRepeaterFieldController",
                "raceday": "raceDayFieldController",
                "webportal":"webPortalFieldController",
              //  "dropdown" : "dropDownController",
                "gauge" : "gaugeController",
                "repeater": "repeaterController",
                "ace":"aceController",
                "kanban":"kanbanController",
                "generic":"genericController",
                  "progresssteps":"progressstepsContrroller"
            }
        };
        this.getModelValue = function (field, forViewModel) {
            var modelValue;
            var modelKey = field.modelKey;
            modelValue = field.modelValue;// sectionFromView[modelKey];
            if (modelKey === 'daterange') {
                modelValue = self.getDateRangeModelValue(field, forViewModel);
            }
            return modelValue;
        };
        this.getDateRangeModelValue = function (field, forViewModel) {
            var resultModelValue = null;
            var dateRangeFieldModelKey = field.modelKey;
            var dateRangeValue = field.modelValue; // sectionFromView[dateRangeFieldModelKey];
            if (dateRangeValue) {

                var startDateModelKey;
                var endDateModelKey;
                resultModelValue = {};

                if (field.dateRangeConfig) {
                    startDateModelKey = field.dateRangeConfig["startDateModelKey"] || "startDate";
                    endDateModelKey = field.dateRangeConfig["endDateModelKey"] || "endDate";
                }
                else {
                    startDateModelKey = "startDate";
                    endDateModelKey = "endDate";
                }
                var startDate = dateRangeValue["startDate"];
                var endDate = dateRangeValue["endDate"];
                if (forViewModel) {
                    resultModelValue[startDateModelKey] = dateUtilService.convertToUIDate(startDate);
                    resultModelValue[endDateModelKey] = dateUtilService.convertToUIDate(endDate);
                }
                else {
                    resultModelValue[startDateModelKey] = dateUtilService.convertToDBFormat(startDate);
                    resultModelValue[endDateModelKey] = dateUtilService.convertToDBFormat(endDate);
                }
                
            }
            return resultModelValue;
        }
        this.getTemplateUrl = function (type) {
            var templateUrl = 'engines/angularjs/components/jsonbasedpages/directive/form/views/fields/';
            var fieldTemplateUrl = self.SUPPORTED_FIELDS_TEMPLATE_MAP[type];
            if (fieldTemplateUrl) {
                return templateUrl = fieldTemplateUrl + '.html';
            }
            else if (self.SUPPORTED_FIELDS.indexOf(type) >= 0) {
                return templateUrl += type + '.html';
            }
            return null;
        };

        this.getControllerName = function (fieldType) {
            var controllerName = defaults.controllers[fieldType] || defaults["defaultControllerName"];

            return controllerName;
        };
        this.getPatternRegEx = function (fieldType) {
            var regEx = self.SUPPORTED_PATTERN_REGEX_MAP[fieldType];

            return regEx;
        };
        this.getNGEvent = function (eventName) {
            var ngEventName = self.SUPPORTED_EVENT_MAP[eventName];

            return ngEventName;
        };

        this.getFieldPattern = function (field, parentForm) {
            var regexp = this.getPatternRegEx(field.fieldType);

            if (!regexp) {
                // console.log("no supported pattern for field:", field.fieldType);
                return null;
            }
            return {
                test: function (value) {
                    var isValid = true;
                    if (!value && field.required === false) {
                        return true;
                    }
                    if (field.fieldType === "currency" && field.decimalpalces != "2") {
                        regexp = new RegExp("^[0-9]+(\.[0-9]{1," + field.decimalpalces + "})?$");
                    }
                    isValid = regexp.test(value);

                    if (parentForm.df_form && parentForm.df_form[field.modelKey] && parentForm.df_form[field.modelKey].$error) {
                        parentForm.df_form[field.modelKey].$error.pattern = !isValid;
                    }
                    return isValid;
                }
            };
        };

        this.buildAdditionalDependancyParams = function (dependancyConfigList, formDataModel, callback) {
            var additionalKeyParams = '';
            var source;

            if (dependancyConfigList != undefined) {
                var dependancyConfig;
                if (angular.isArray(dependancyConfigList)) {
                    dependancyConfig = $filter('filter')(dependancyConfigList, { event: "self-load" }, true);
                    if (dependancyConfig && dependancyConfig.length > 0) {
                        dependancyConfig = dependancyConfig[0];
                    }
                    else if (dependancyConfigList.length === 1) {
                        dependancyConfig = dependancyConfigList[0];
                    }

                }
                else {
                    dependancyConfig = dependancyConfigList;
                }

                var sourceGlobalName = dependancyConfig["sourceGlobalName"];
                if (sourceGlobalName === "LS") {
                    sourceGlobalName = "localStorage";
                }

                source = window[sourceGlobalName] || formDataModel;
                if (source && dependancyConfig["loadData"] && dependancyConfig["loadData"]["keyParams"]) {
                    additionalKeyParams = dependancyConfig["loadData"]["keyParams"]
                }

            }
            callback(additionalKeyParams, source);
        };

        this.getFieldDataByModelKey = function (rows, fieldKey) {
            var cField = null;
            angular.forEach(rows, function (column, index) {
                var fields = column.fields;
                angular.forEach(fields, function (field, index) {

                    if (field.modelKey === fieldKey) {
                        cField = field;
                        return cField;
                    }
                });
            });
            return cField;
        };
    });

    return angularAMD;
});