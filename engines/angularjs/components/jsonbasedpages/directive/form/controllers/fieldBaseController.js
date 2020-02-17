define(['angularAMD', 'modelUtilService', 'dateUtilService', 'fieldService', 'httpService'
, 'ui-ace', 'alaSqlExtensions', 'ngSanitize' ], function (angularAMD) {
    'use strict';

    angularAMD.controller('fieldBaseController', function ($scope, $injector, $q, httpService, overlay, Notification,
        $filter, modelUtilService, dateUtilService, fieldService, $interpolate, alasql, $sce,$uibModal) {
        var self = this;
            console.log("$uibModal=",$uibModal);
        // HyperLink 
        $scope.field.handler = function () {
            var handlerName = $scope.field["handlerName"];
            if (handlerName && !angular.isUndefined($scope.parentForm.functionalService)
                && angular.isFunction($scope.parentForm.functionalService[handlerName])) {
                $scope.parentForm.functionalService[handlerName]();
            }

        };

        $scope.field.reset = function () {
            $scope.field.setDefaultValue();
            if ($scope.field.selectAllHandler)
                $scope.field.selectAllHandler([], true);
            // $scope.field.options = null;
        };
        // Add to grid Button
        $scope.eventHandler = function (sourceField, eventName, dependantModelKeysTobeFilled, event, selectedItem) {

            var handlerName = $scope.field["handlerName"];
            if (event) {
                handlerName = event["handlerName"] || event["handler"];
            }
            if (!selectedItem) {
                selectedItem = $scope.field.getSelectedItem();
            }
            $scope.field.SelectedText = $scope.field.getSelectedText();
            var hasDependants = !handlerName || (event && event["hasDependants"]);

            dependantModelKeysTobeFilled = dependantModelKeysTobeFilled;
            if (event && !dependantModelKeysTobeFilled) dependantModelKeysTobeFilled = event["modelKeyMapTobeFilled"];

            //    var dependantModelKeysTobeFilled = dependantModelKeysTobeFilled || event["modelKeyMapTobeFilled"];
            console.log("am in field base buttonHandler ",handlerName);
            if (hasDependants) {
                $scope.notifyDependants($scope, eventName, dependantModelKeysTobeFilled, event);
            }
            if (handlerName && !angular.isUndefined($scope.parentForm.functionalService)
                && angular.isFunction($scope.parentForm.functionalService[handlerName])) {
                $scope.parentForm.functionalService[handlerName]($scope.field, $scope.parentForm, $scope.parentSection, $scope.sectionDataModel, $scope.formDataModel, $scope.event, selectedItem);
            }

            if (handlerName && !angular.isUndefined($scope.parentForm[handlerName])
                && angular.isFunction($scope.parentForm[handlerName])) {
                $scope.parentForm[handlerName]($scope.field, $scope.parentForm, $scope.parentSection, $scope.sectionDataModel, $scope.formDataModel, $scope.event, selectedItem);
            }
        };

        $scope.getEventDetails = function (eventName) {
            var dependancyEvents = $scope.field["dependancyEvents"];
            var eventDetails;
            if (dependancyEvents) {
                for (var i = 0; i < dependancyEvents.length; i++) {
                    eventDetails = dependancyEvents[i];
                    if (eventDetails["eventName"] === eventName) {
                        break;
                    }
                }
            }
            return eventDetails;
        };
      
        $scope.onDrop = function(event, effect) {
            console.log("ddd1 drop 1", event.dataTransfer.effectAllowed, event.dataTransfer.dropEffect);
        
                event.preventDefault();
                 event.dataTransfer.dropEffect = effect;
                return {};
         };
         
        $scope.field.dragoverCallback = function(event, effect,options,type) {
            console.log("ddd1 dragoverCallback 2", event.dataTransfer ,effect);
        
                event.preventDefault();
            // event.dataTransfer.items = options;
        
                return true;
        };
        $scope.field.onDrop = function(event, effect) {
            console.log("ddd1 drop 2", event,effect);
        
                event.preventDefault();
               // event.dataTransfer.items = effect.targetList;
                event.dataTransfer.dropEffect = effect;
                return {};//effect.targetList[0];
        };
        $scope.field.onDropCallback = function(event, index,targetList,tindex) {
            console.log("ddd1 onDropCallback 2", event, index,targetList,tindex);
        
                event.preventDefault();
                event.dataTransfer.dropEffect = targetList;
                return {};
        };
     
     
        $scope.field.onDragover = function(event, effect) {
            console.log("ddd1 dragover", event,effect);

                event.preventDefault();
            event.dataTransfer.dropEffect = effect;

                return true;
        };
        $scope.bindEvent = function (element, event) {
            var eventName;
            var dependantModelKeysTobeFilled;
            if (angular.isString(event)) {
                eventName = event;
            }
            else if (event["eventName"]) {
                eventName = event["eventName"];
                dependantModelKeysTobeFilled = event["modelKeyMapTobeFilled"];
            }
            var ngEventName = fieldService.getNGEvent(eventName);
            if (ngEventName) {
                var eventHandleString = "eventHandler(this, '" + eventName + "',"
                    + JSON.stringify(dependantModelKeysTobeFilled) + "," + JSON.stringify(event) + ")";

                element.attr(ngEventName, eventHandleString);
            }
            if ($scope.parentForm.readOnlyForm) {
                $scope.readModeDefaultEvent = {};
                $scope.readModeDefaultEvent["eventName"] = eventName;
                $scope.readModeDefaultEvent["dependantModelKeysTobeFilled"] = dependantModelKeysTobeFilled;
                $scope.readModeDefaultEvent["event"] = event;
                $scope.invokeEventHandlerForReadMode();

            }
        };

        $scope.invokeEventHandlerForReadMode = function () {
            if ($scope.parentForm.readOnlyForm && $scope.modelValuePopulated && ($scope.optionsLoaded || !$scope.field.dataConfig)
                && $scope.readModeDefaultEvent) {
                $scope.eventHandler($scope, $scope.readModeDefaultEvent["eventName"], $scope.readModeDefaultEvent["dependantModelKeysTobeFilled"]
                    , $scope.readModeDefaultEvent["event"]);
            }
        };

        $scope.field.getModel = function (data) {

            var field = $scope.field;
            var resultModelValue = null;
            var viewModelValue = field.modelValue;

            console.log("field.fieldType=", field.fieldType);
            if (field.fieldType === "hidden" && field["defaultValueByKey"]) {
                resultModelValue = modelUtilService.getValueFromModelByKey(field["defaultValueByKey"], $scope.formDataModel, null, $scope.parentForm);
            }
            else if (angular.isDefined(viewModelValue)) {
                if (field.fieldType === "checkbox") {
                    resultModelValue = viewModelValue;
                } else if (field.fieldType === "singleradio") {
                    // console.log("singleradio getModel",data);
                    resultModelValue = (data[field.modelKey] === "true") ? "t" : "f";
                } else if (field.fieldType === "date") {
                    //resultModelValue = dateUtilService.convertToDBFormat(viewModelValue.toDate());
                    resultModelValue = dateUtilService.convertToDBFormat(viewModelValue);
                }
                else if (field.fieldType === "daterange") {
                    resultModelValue = fieldService.getModelValue($scope.field);
                }
                else if (angular.isObject(viewModelValue) && viewModelValue.hasOwnProperty("value")) {
                    resultModelValue = viewModelValue["value"];
                }
                else 
                {
                    resultModelValue = viewModelValue;
                }

            }
            else if (angular.isUndefined(viewModelValue)) {
                if (field.fieldType === "checkbox") {
                    if (viewModelValue === undefined || viewModelValue === null) {
                        viewModelValue = false;
                    }
                    resultModelValue = viewModelValue;
                }  
                else if (field.fieldType === "listbox") {
                    resultModelValue =$scope.field.options;
                }
            }
            return resultModelValue;
        };

        $scope.field.getSelectedItem = function () {
            var selectedItem;
            if ($scope.field.options) {

                var selectedItems = null;
                if(!$scope.field.ismultiple){
                    selectedItems = _.filter($scope.field.options, function (item) {
                        return item.value === $scope.field.modelValue;
                    });
                }else{
                    selectedItems = $scope.field.modelValue ||[];
                    // _.filter($scope.field.options, function (item) {
                    //     return _.filter($scope.field.modelValue, function (item1) {
                    //         return item1.value === item.value;
                    //     });
                    // });
                }
                
             //   console.log("selectedItems =", selectedItems);
                if (selectedItems.length === 0) {
                    selectedItem = selectedItems[0];
                } else {
                    return selectedItems;
                }
            }
            console.log("selectedItems  11=", selectedItems);
            return selectedItem;
        };

        $scope.field.setModel = function (model) {
            var fieldModelKey = $scope.field.modelKey;
            console.log("modelValue=* fieldModelKey ", $scope.field.modelKey);
            var modelValue = null;
            if (model) {
                $scope.parentModel = model;
                console.log("*************");
                if (typeof model[fieldModelKey] === "boolean") {
                    if ($scope.field.fieldType === "checkbox") {
                        modelValue = model[$scope.field.modelKey];
                        console.log("checkbox=*************", modelValue);
                    }
                    else if ($scope.field.fieldType === "singleradio") {
                        modelValue = model[$scope.field.modelKey] === true ? true : false;
                    }
                    else {
                        modelValue = model[$scope.field.modelKey] ? "t" : "f";
                    }
                }
                else if ($scope.field.fieldType === "date") {
                    modelValue = dateUtilService.convertFromDBFormat(model[$scope.field.modelKey]);
                    console.log("date=*************", modelValue);
                }
                else {
                    console.log("other modelValue=*************", modelValue);
                    modelValue = model[$scope.field.modelKey];
                }
            }
            if (modelValue === null) {
                console.log("setDefaultValue is null modelValue=*************", modelValue);
                if ($scope.field.defaultSelectedIndex) {
                    setModelValueBySelectedIndex($scope.field.selectedIndex);
                }
                else {
                    $scope.field.setDefaultValue();
                }
            }
            else {
                console.log("setDefaultValue modelValue=*************", modelValue);
                $scope.field.modelValue = modelValue;
                $scope.sectionDataModel[$scope.field.modelKey] = modelValue;
                $scope.field.notifyDependantsOnLoadIfAny();
            }
            $scope.modelValuePopulated = true;
            $scope.invokeEventHandlerForReadMode();

        };
        /*
        sample metadata json for runIfElseRules:
            "if":[{ "conditions": [ { "modelKey":"allocationType","in":["local"] } ],
                  "then":{"defaultValueByKey":"costCenterFrom","rules":{"disabled":true}},
                   "else":{"defaultValue":"","rules":{"disabled":false}}}]
        */
        $scope.field.runIfRules = function (args, currentSourceDC) {

            var ifClauseList = modelUtilService.getAsList(currentSourceDC["if"]);

            for (var i = 0; i < ifClauseList.length; i++) {
                var singleIfCaluse = ifClauseList[i];
                var conditionResult = evaluateConditions(singleIfCaluse["conditions"], args);
                if (conditionResult) {
                    executeRules(singleIfCaluse["then"], args);
                }
                else {
                    var elseIfClauseList = modelUtilService.getAsList(singleIfCaluse["elseIf"]);

                    var elseIfConditionResult = false;
                    for (var i = 0; i < elseIfClauseList.length; i++) {
                        var singleElseIfCaluse = elseIfClauseList[i];
                        elseIfConditionResult = evaluateConditions(singleElseIfCaluse["conditions"], args);
                        if (elseIfConditionResult) {
                            executeRules(singleElseIfCaluse["then"], args);
                        }
                        else {
                            executeRules(singleElseIfCaluse["else"], args);
                        }
                    }
                    if (!elseIfConditionResult) {
                        executeRules(singleIfCaluse["else"], args);
                    }
                }
            }
        };
        var evaluateConditions = function (conditionsClause, args) {
            /* "conditions": [ { "modelKey":"allocationType","in":["local"] } ] */

            var conditionList = modelUtilService.getAsList(conditionsClause);
            var isPassed = false;
            for (var i = 0; i < conditionList.length; i++) {
                var condition = conditionList[i];
                var conditionModelKey = condition["modelKey"];
                var eventSourceItem = args["eventSourceItem"];
                var conditionModelValue;
                if (eventSourceItem) {
                    conditionModelValue = eventSourceItem[conditionModelKey];
                }
                if (angular.isUndefined(conditionModelValue)) {
                    conditionModelValue = $scope.sectionDataModel[conditionModelKey];
                }
                var inValues = condition["in"];
                var notInValues = condition["not-in"];
                if ((inValues && ((angular.isString(inValues) && inValues.toUpperCase() === "ALL")
                    || (angular.isArray(inValues) && inValues.indexOf(conditionModelValue) >= 0)))
                    || (notInValues && !(notInValues.indexOf(conditionModelValue) >= 0))) {
                    isPassed = true;
                    break;
                }

            }

            return isPassed;
        };
        var executeRules = function (rulesConfig, args) {
            /* {"defaultValueByKey":"costCenterFrom","rules":{"disabled":true} */
            $scope.field.runDefaultValuePopulation(rulesConfig, args);
            var ruleList = modelUtilService.getAsList(rulesConfig["rules"]);
            $scope.field.runFieldSpecificRules(ruleList, args);
        };

        $scope.field.runFieldSpecificRules = function (ruleList, args) {
            var commonRules = ["show", "required", "disabled"];
            for (var i = 0; i < ruleList.length; i++) {
                var rule = ruleList[i];
                for (var ruleName in rule) {
                    var ruleData = rule[ruleName];
                    if (commonRules.indexOf(ruleName) > -1) {
                        $scope.field[ruleName] = ruleData;
                    }
                }
            }
        };

        $scope.field.runDefaultValuePopulation = function (validationConfig, args) {

            var defaultValueByKey = validationConfig["defaultValueByKey"];
            var defaultValue = validationConfig["defaultValue"];

            if (!angular.isUndefined(defaultValueByKey) || !angular.isUndefined(defaultValue)) {
                $scope.field.setDefaultValue(defaultValueByKey, defaultValue, args["eventSourceItem"]);
            }
        };

        $scope.field.runDependancy = function (eventSourceField, eventName, sourceDataModel, args) {
            console.log("runDependancy-----");
            var defer = $q.defer();
            var sourceFieldKey = eventSourceField["modelKey"];
            var eventSourceValue = eventSourceField["modelValue"];
            eventName = (eventName || 'change');
            var dependancyConfig = $scope.field["dependancyConfig"];
            var currentSourceDCs = _.filter(dependancyConfig, function (item) {
                return (item["sourceKey"] === sourceFieldKey
                    && (item["event"] === eventName || item["eventName"] === eventName));
            });
            if (currentSourceDCs && currentSourceDCs.length > 0) {

                var currentSourceDC = currentSourceDCs[0];
                var dataConfigs = currentSourceDC["dataConfigs"];
                var dataConfig = currentSourceDC["dataConfig"];
                if (dataConfigs && dataConfigs[eventSourceValue]) {
                    dataConfig = dataConfigs[eventSourceValue];
                }
                $scope.field["dataConfig"] = dataConfig;

                if (currentSourceDC.hasOwnProperty("defaultValue") || currentSourceDC.hasOwnProperty("defaultValueByKey")) {
                    var defaultValue = currentSourceDC["defaultValue"] || defaultValue;
                    $scope.field.setDefaultValue(currentSourceDC["defaultValueByKey"], currentSourceDC["defaultValue"], $scope.formDataModel);
                }
                if (dataConfig) {
                    $scope.field.loadFieldData(null, sourceDataModel, args).then(function (result) {
                        defer.resolve(result);

                    });
                }
                else if (valuePrefixConfig) {
                    $scope.setValuePrefix(valuePrefixConfig);
                    defer.resolve();
                }
            }
            else {
                defer.resolve();
            }

            return defer.promise;

        };

        $scope.field.getSectionModel = function () {
            var sectionModel = $scope.sectionDataModel;
            var sectionModelKey = $scope.field.sectionModelKey;
            sectionModel = !sectionModel ? $scope.formDataModel[sectionModelKey] : $scope.formDataModel;
            return sectionModel;
        };

        $scope.$on('notifyDependantsOnParentDataChange', function (event, args) {
          //  console.log('notifyDependantsOnParentDataChange args:', args);
            var currentField = $scope.field;
            $scope.parentForm.runDependancy("FIELD", currentField, args, function (currentSourceDC) {
                var loadDataConfig = currentSourceDC["loadData"];
                var valuePrefixConfig = currentSourceDC["valuePrefix"];
                var dataConfigs = currentSourceDC["dataConfigs"];
                var dependantFieldsData = args["dependantFieldsData"];
                var currentFieldModelKey = currentField.modelKey;

                var defaultValue = currentField.defaultValue;
                if (dependantFieldsData && dependantFieldsData[currentFieldModelKey]) {
                    currentField.options = dependantFieldsData[currentFieldModelKey].options;

                    defaultValue = dependantFieldsData[currentFieldModelKey].defaultValue;
                }
                else if (dataConfigs) {
                    var eventSourceValue = args["eventSourceValue"];
                    if (dataConfigs[eventSourceValue]) {
                        currentField["dataConfig"] = dataConfigs[eventSourceValue];
                    }
                    else {
                        currentField["dataConfig"] = null;
                    }
                }
                else if (currentSourceDC["dataConfig"]) {
                    currentField["dataConfig"] = currentSourceDC["dataConfig"];
                }
                if (currentSourceDC.hasOwnProperty("defaultValue") || currentSourceDC.hasOwnProperty("defaultValueByKey")) {
                    defaultValue = currentSourceDC["defaultValue"] || defaultValue;
                    $scope.field.setDefaultValue(currentSourceDC["defaultValueByKey"], currentSourceDC["defaultValue"], $scope.formDataModel);
                }
                var dataConfig = currentField["dataConfig"];
                if ((dataConfig && !dataConfig["keyParams"]) && (loadDataConfig && loadDataConfig["keyParams"])) {
                    dataConfig["keyParams"] = loadDataConfig["keyParams"];
                }
                if (dataConfig && dataConfig["keyParams"]) {
                    $scope.field.loadFieldData(null, $scope.parentModel, args);

                }
                else if (valuePrefixConfig) {
                    $scope.setValuePrefix(valuePrefixConfig);
                }
            });
        });

        $scope.field.notifyDependantsOnLoadIfAny = function () {
            var dependancyEvents = $scope.field["dependancyEvents"];
            if (!dependancyEvents) {
                return;
            }
            var dependancyEventsMap = {};
            var defaultEventNameOnLoad = "change";
            for (var i = 0; i < dependancyEvents.length; i++) {
                var event = dependancyEvents[i];
                dependancyEventsMap[event["eventName"]] = event;
            }
            var defaultEventOnLoad = dependancyEventsMap[defaultEventNameOnLoad];
            if (defaultEventOnLoad) {
                var dependantModelKeysTobeFilled;
                if (defaultEventOnLoad) {
                    dependantModelKeysTobeFilled = defaultEventOnLoad["modelKeyMapTobeFilled"];
                }
                $scope.notifyDependants($scope.field, defaultEventNameOnLoad, dependantModelKeysTobeFilled, defaultEventOnLoad);
            }
        };

        $scope.field.notifyDependants = function (sourceField, eventName, dependantModelKeysTobeFilled, event) {
            $scope.notifyDependants(sourceField, eventName, dependantModelKeysTobeFilled, event);
        };

        $scope.notifyDependants = function (sourceField, eventName, dependantModelKeysTobeFilled, event) {
           // console.log("current_scope_field:", $scope.field, sourceField);
            if (sourceField && sourceField["field"]) {
                sourceField = sourceField["field"];
            }

            var eventSourceSelectedObject = sourceField.modelValue; //  $scope.sectionDataModel[sourceField.modelKey];
            var eventSourceValue;
            var eventSourceItem;
            var dependantFieldsData;
            if (eventSourceSelectedObject !== undefined) {

                if (eventSourceSelectedObject["dependantFieldsData"]) {
                    dependantFieldsData = eventSourceSelectedObject["dependantFieldsData"];
                }
                if (eventSourceSelectedObject["value"]) {
                    eventSourceValue = eventSourceSelectedObject["value"];
                }
                else {
                    eventSourceValue = eventSourceSelectedObject;
                }

                if (eventSourceSelectedObject["item"]) {
                    eventSourceItem = eventSourceSelectedObject["item"];
                }
                else {
                    if (sourceField.options) {
                        eventSourceItem = _.filter(sourceField.options, function (item) {
                            return item.value === eventSourceValue;
                        });
                        if (eventSourceItem.length > 0)
                            eventSourceItem = eventSourceItem[0]["item"];
                    }
                }
            }

            if ($scope.sectionDataModel) {
                $scope.sectionDataModel[sourceField.modelKey] = eventSourceValue;
            }

            //$scope.sectionDataModel[sourceField.modelKey] = eventSourceValue;
            $scope.fillDependantModelValues(dependantModelKeysTobeFilled, eventSourceItem);
            $scope.$emit('parentDataChanged', {
                "eventSourceValue": eventSourceValue, "eventSourceItem": eventSourceItem, "dependantFieldsData": dependantFieldsData,
                "eventName": eventName, "eventSourceField": sourceField, "sourceFieldSectionData": $scope.sectionDataModel
            });
        };

        $scope.fillDependantModelValues = function (dependantModelKeysTobeFilled, eventSourceItem) {
            angular.forEach(dependantModelKeysTobeFilled, function (sourceItemKey, modelKey) {
                if (sourceItemKey && modelKey) {
                    var sourceItemKeySplits = sourceItemKey.split("||");
                    var defaultValue;
                    if (sourceItemKeySplits.length > 1) {
                        defaultValue = sourceItemKeySplits[1];
                    }
                    if (eventSourceItem) {
                        var fieldTobePopulated = $scope.parentSection.getFieldByModelKey(modelKey);
                        if (fieldTobePopulated) {
                            fieldTobePopulated.modelValue = eventSourceItem[sourceItemKeySplits[0]] || defaultValue;
                        }
                        else {
                            console.log("unable to find the field with modelKey", modelKey);
                        }
                        // $scope.sectionDataModel[modelKey] = fieldTobePopulated.modelValue;
                    }
                    else {
                        console.log("missing eventSourceItem to populate dependant modelKey", modelKey);
                    }
                }
            });
        };

        $scope.setSystemCodeFromService = function () {
            var keyGenConfig = $scope.field["keyGenConfig"],
                generateInEdit = $scope.field["generateInEdit"];

            if ((!$scope.parentForm.readOnlyForm && keyGenConfig) || generateInEdit) {

                var keyGenServiceUrl = keyGenConfig["url"] || 'vdi/olims/keygenerator/nextkey';
                var codeKeyParam = keyGenConfig["params"];
                if (keyGenServiceUrl.indexOf("?") >= 0) {
                    keyGenServiceUrl = keyGenServiceUrl + "&";
                }
                else {
                    keyGenServiceUrl = keyGenServiceUrl + "?";
                }
                keyGenServiceUrl = keyGenServiceUrl + (codeKeyParam || "");

                //Get Group Code
                httpService.get(keyGenServiceUrl).then(function (results) {
                    if (overlay) overlay.hide();
                    if (results.data.success === 'true') {
                        var modelValue = results.data.dataset[0].return;
                        $scope.field[$scope.field["modelKey"] + "KeyGenValue"] = modelValue;
                        $scope.field.modelValue = modelValue;
                    } else {
                        Notification.error({
                            message: 'URL<br/>' + constants.api_url + 'vdi/olims/keygenerator/nextkey?' + codeKeyParam,
                            title: 'CODE ERROR - ' + results.data.code,
                            delay: 5000
                        });

                    }
                });
            }
        };

        $scope.setValuePrefix = function (valuePrefixConfig) {
            var dilimiter = valuePrefixConfig["delimiter"] || "-";
            if (valuePrefixConfig["keys"]) {
                var modelValuePrefixList = [];
                var k = 0;
                angular.forEach(valuePrefixConfig["keys"], function (modelKey, index) {
                    var modelValue = $scope.field.modelValue;
                    if (modelValue && modelValue["value"]) {
                        modelValuePrefixList[k++] = modelValue["value"];
                    }
                    else {
                        modelValuePrefixList[k++] = modelValue;
                    }

                });

                var modelValue = $scope.field.modelValue; // $scope.sectionDataModel[$scope.field["modelKey"]];
                if (modelValue) {
                    var modelValueSplit = modelValue.split(dilimiter);
                    $scope.field[$scope.field["modelKey"] + "KeyGenValue"] = modelValueSplit[modelValueSplit.length - 1];
                }

                if (modelValuePrefixList.length > 0) {
                    modelValue = modelValuePrefixList.join(dilimiter);

                    modelValue = modelValue + dilimiter + $scope.field[$scope.field["modelKey"] + "KeyGenValue"];
                    // $scope.sectionDataModel[$scope.field["modelKey"]] = modelValue;
                    $scope.field.modelValue = modelValue;
                }
            }
        };

        $scope.field.loadFieldData = function (additionalKeyParams, sourceDataModel, eventArgs) {
            //else if ($scope.field.fieldType === "checkbox") {
            //    var value = $scope.sectionDataModel[$scope.field.modelKey];
            //    if (value === 'Y' || value === true || value === "true") {
            //        $scope.sectionDataModel[$scope.field.modelKey] = 1;
            //    }
            //    else {
            //        $scope.sectionDataModel[$scope.field.modelKey] = 0;
            //    }
            //}
            var defer = $q.defer();
            $scope.field.options = [];
          console.log("$scope.field.options =", $scope.field.options);
            var dataConfig = $scope.field["dataConfig"];
            if (dataConfig) {
                additionalKeyParams = additionalKeyParams || {};
                additionalKeyParams = angular.extend(additionalKeyParams, dataConfig["keyParams"]);

                if (additionalKeyParams) {
                    var qsParamsList = [];
                    var k = 0;
                    angular.forEach(additionalKeyParams, function (modelKey, paramName) {
                        if (modelKey) {
                            var sourceDataModelValue;
                            var eventSourceField = eventArgs ? eventArgs["eventSourceField"] : null;
                            if (eventSourceField && eventSourceField.modelKey === modelKey) {
                                sourceDataModelValue = eventArgs["eventSourceValue"];
                                if (!sourceDataModelValue && eventSourceField.modelValue) {
                                    sourceDataModelValue = angular.isDefined(eventSourceField.modelValue['value']) ? eventSourceField.modelValue.value
                                        : eventSourceField.modelValue;
                                }
                            }
                            else {
                                //var sourceDataModelMap = buildSourceDataModelMap(sourceDataModel);
                                sourceDataModelValue = modelUtilService.getValueFromModelByKey(modelKey, sourceDataModel, null, $scope.parentForm, true);
                            }
                            if(modelKey.split(".").length > 1){
                                var prefixText = modelKey.split(".")[0];
                                var pName = modelKey.split(".")[1];
                                console.log("prefixText=",prefixText);
                                switch(prefixText){
                                    case "UP":
                                           // sourceDataModelValue=  localStorage.getItem(pName); 
                                    break;
                                    case "LS":
                                            sourceDataModelValue=  localStorage.getItem(pName); 
                                    break;
                                    case "DEF":
                                        sourceDataModelValue = pName;
                                        break;
                                    default:

                                    break;
                                }
                            }


                            qsParamsList[k++] = paramName + "=" + (angular.isUndefined(sourceDataModelValue) ? "" : sourceDataModelValue);
                        }
                    });
                    dataConfig["additionalQSParams"] = qsParamsList.join("&");
                }
                else {
                    dataConfig["additionalQSParams"] = null;
                }
                console.log("dd200", $scope.sectionDataModel);
                console.log("dd200", $scope.field.modelValue);
                var modelForParams = sourceDataModel || $scope.sectionDataModel;

                $scope.field.isLoaded = false;
                //console.log("before isLoaded..",$scope.field.isLoaded);
                modelUtilService.buildSelectOptions(dataConfig, modelForParams).then(
                    function (result) {
                        $scope.field.isLoaded = true;
                       console.log("loading options result..", result);
                        // console.log("after isLoaded ..",$scope.field.isLoaded);
                        if ($scope.field.dataConfig && $scope.field.dataConfig.localOptions) {
                            result = $scope.field.dataConfig.localOptions.concat(result);
                        }
                        console.log("Loadad data 2");
                        $scope.field.options = result;

                        console.log("dd200 $scope.field.selectedIndex=", $scope.field.selectedIndex);
                        setModelValueBySelectedIndex($scope.field.selectedIndex);
                        $scope.field.SelectedText = $scope.field.getSelectedText();
                        defer.resolve(result);
                        $scope.optionsLoaded = true;
                        $scope.field.isLoaded = true;
                        console.log("95055 $scope.field.selectedIndex =", $scope.field.selectedIndex);
                        if ($scope.field.selectedIndex !== -1) {

                            var eventName = "change";
                            var eventDetails = $scope.getEventDetails(eventName);
                            $scope.eventHandler($scope, eventName, null, eventDetails, result[$scope.field.selectedIndex]);
                        }
                        else {
                            console.log("dd200 =", $scope.field.defaultValue);
                            $scope.field.modelValue = $scope.field.defaultValue || $scope.field.modelValue;
                            $scope.field.SelectedText = $scope.field.getSelectedText();
                            $scope.invokeEventHandlerForReadMode();
                        }

                    });
            }
            else {
                $scope.field.isLoaded = true;
                defer.reject();
            }
            return defer.promise;
        };

        $scope.loadFieldDataOnInit = function () {
            var filedType = $scope.field.fieldType;
            switch(filedType){
                case "kanban":
                        $scope.field["containers"]=$scope.field["containers"];
                        $scope.field["containerswidth"]= 100 /$scope.field["containers"].length;
                break;
                default:
                        if ($scope.field.alwaysReloadOptions === false && $scope.field.options ) {
                            return;
                        }
                        console.log("model key", $scope, $scope.field["modelKey"]);
                        var dependancyConfigList = $scope.field["dependancyConfig"];
                        var initLoad = $scope.field["initLoad"];
                        if (initLoad === undefined) {
                            initLoad = dependancyConfigList !== undefined ? false : true;
                        }
            
                        if (initLoad) {
                            fieldService.buildAdditionalDependancyParams(dependancyConfigList, $scope.formDataModel,
                                function (additionalKeyParams, source) {
                                    $scope.field.loadFieldData(additionalKeyParams, source);
                                });
                        } else {
                            console.log("model key", $scope.field["modelKey"]);
                        }
                break;
            }
            
        };

        var setModelValueBySelectedIndex = function (selectedIndex) {
            var options = $scope.field.options;
            var dataConfig = $scope.field["dataConfig"];
            if (selectedIndex !== -1 && options && options.length > 0) {
                if (options.length === 1) {
                    if ($scope.field["ismultiple"] === true && $scope.field["isgrouping"] === false) {
                        $scope.field.modelValue = [options[0]];
                    }
                    else {
                        $scope.field.modelValue = options[0].value;
                    }                    
                    var modelKey = $scope.field["modelKey"];
                    $scope.sectionDataModel[modelKey] = $scope.field.modelValue;
                }
                else {
                    if ($scope.field["ismultiple"] === true && $scope.field["isgrouping"] === false) {
                        $scope.field.modelValue = [options[selectedIndex]];
                    }
                    else {
                        $scope.field.modelValue = options[selectedIndex].value;
                    }
                    
                    modelKey = $scope.field["modelKey"];
                    $scope.sectionDataModel[modelKey] = $scope.field.modelValue;
                }
            }
        };

        $scope.field.setSelectedIndex = function (selectedIndex) {
            console.log("777--setSelectedIndex=");
            $scope.field.selectedIndex = selectedIndex;
            setModelValueBySelectedIndex(selectedIndex);
        };

        $scope.field.setDefaultValue = function (defaultValueByKey, defaultValue, sourceDataModel) {
            //alert("aaa 1");
            $scope.setDefaultValue(defaultValueByKey, defaultValue, sourceDataModel);
        };

        $scope.setDefaultValue = function (defaultValueByKey, defaultValue, sourceDataModel) {
            //alert("aaa 2");
            console.log("201 setDefaultValue=", defaultValueByKey, defaultValue, sourceDataModel);
            if (angular.isObject(defaultValueByKey)) {
                sourceDataModel = defaultValueByKey;
                defaultValueByKey = "";
            }
            if (angular.isObject(defaultValue)) {
                sourceDataModel = defaultValue;
                defaultValue = "";
            }
            defaultValueByKey = defaultValueByKey || $scope.field["defaultValueByKey"];
            defaultValue = defaultValue || $scope.field["defaultValue"];

            if (angular.isUndefined(defaultValueByKey) && angular.isUndefined(defaultValue)) { return; }

            var modelKey = $scope.field["modelKey"];
            if (defaultValueByKey) {
                var sourceDataModelMap = buildSourceDataModelMap(sourceDataModel);

                defaultValue = modelUtilService.getValueFromModelByKey(defaultValueByKey, sourceDataModelMap, null, $scope.parentForm);
            }
            if (defaultValue && modelKey) {
                $scope.field.modelValue = defaultValue;
                $scope.sectionDataModel[modelKey] = defaultValue;

            }
            $scope.field.notifyDependantsOnLoadIfAny();
            console.log("$scope.field.modelValue modelValue=*", $scope.field.modelValue);
        };

        var buildSourceDataModelMap = function (sourceDataModel) {
            var sourceDataModelMap = {};
            if (sourceDataModel) sourceDataModelMap["eventSourceModel"] = sourceDataModel;
            if ($scope.sectionDataModel) sourceDataModelMap["sectionDataModel"] = $scope.sectionDataModel;

            return sourceDataModelMap;
        };

        var injectDynamicServices = function () {
            $scope.functionalService = $scope.parentForm.functionalService;
            var serviceName = $scope.field.ngServiceName || $scope.parentForm.ngServiceName;
            if (serviceName) {
                var servicePath = "../factories/";
                var serviceNameSplit = serviceName.split(".");
                if (serviceNameSplit.length > 1) {
                    servicePath = servicePath + serviceNameSplit.join("/");
                    serviceName = serviceNameSplit[serviceNameSplit.length - 1];
                }
                else {
                    servicePath = servicePath + serviceName;
                }
                if (serviceName) {
                    $scope.dynamicServices = {};
                    if ($injector.has(serviceName)) {
                        $scope.dynamicServices[serviceName] = $injector.get(serviceName);
                        $scope.functionalService = $scope.dynamicServices[serviceName];
                    }
                    else {
                        // var service = require(servicePath);
                        require(['require', servicePath], function (require) {
                            //var service = require(servicePath);
                            var servicesModule = angular.module('app', ["services"]);
                            servicesModule.run([serviceName, function (service) {
                                $scope.dynamicServices[serviceName] = service;
                                $scope.functionalService = service;
                                console.log("functionalService1", $scope.functionalService);
                            }]);
                            // service = angular.injector([serviceName]).get(serviceName);
                        });

                    }
                    console.log("functionalService2", $scope.functionalService);
                }
            }
        };

        $scope.field.applyDefaultRules = function (ruleKey) {
            var defaults = $scope.field.defaultRules;
            if (ruleKey) {
                $scope.field[ruleKey] = defaults[ruleKey];
            }
            else {
                angular.forEach(defaults, function (defaultValue, key) {
                    $scope.field[key] = defaultValue;
                });
            }
        };

        $scope.field.selectChanged = function () {
            $scope.field.SelectedText = $scope.field.getSelectedText();

            var selectedItems1 = [];
            angular.forEach($scope.field.modelValue, function (value, key) {
                selectedItems1.push(value.text);
            });
            $scope.field.tooltip = selectedItems1.join(",");

            console.log("selected selectChanged=", $scope.field.SelectedText);
            console.log("selected tooltip=", $scope.field.tooltip);
        };

        $scope.getSelectedText = function () {
            var selectedText = "";
            var selectedTooltipItems = [];
            console.log("selected optionslist=", $scope.field.modelValue, $scope.field.options);
            var selectedItems = $scope.field.getSelectedItem() || $scope.field.modelValue;
            if (angular.isArray(selectedItems)) {
                if (selectedItems.length > 1) {
                    angular.forEach(selectedItems, function (value, key) {
                        selectedTooltipItems.push(value.text);
                    });
                    $scope.field.tooltip = $sce.trustAsHtml(selectedTooltipItems.join(",\n"));
                    selectedText = selectedTooltipItems.join(", ");
                }
                else {
                    if (selectedItems[0] !== undefined) {
                        console.log("selectedItems[0] =", selectedItems[0]);
                        selectedText = selectedItems[0].text;
                        $scope.field.tooltip = $sce.trustAsHtml(selectedText);
                    }
                }
            }
            else {
                selectedText = selectedItems || "";
            }
            return selectedText;
        };

        $scope.field.getSelectedText = function () {
            return $scope.getSelectedText();
        };

        $scope.field.selectAllHandler = function (options) {
            var selectedItems = [];
            $scope.field.modelValue = [];
            $scope.field.tooltip = "";
            console.log("$scope.field.tooltip ", $scope.field.tooltip);
            if (options.length > 0) {
                angular.forEach(options, function (value, key) {
                    $scope.field.modelValue.push(value);
                    selectedItems.push(value.text);
                });
                $scope.field.tooltip = $sce.trustAsHtml(selectedItems.join(",\n"));
            } else {
                $scope.field.modelValue = [];
                $scope.field.tooltip = "";
            }
        };

        $scope.selectAllEvent = function () {
            var selectedItems = [];
            $scope.field.modelValue = [];
            angular.forEach($scope.field.options, function (value, key) {
                $scope.field.modelValue.push(value);
                selectedItems.push(value.text);
            });
            $scope.field.tooltip = $sce.trustAsHtml(selectedItems.join(",\n"));

            var eventName = "change";
            var eventDetails = $scope.getEventDetails(eventName);
            $scope.eventHandler($scope, eventName, null, eventDetails, $scope.field.options[-1]);
            // var res = alasql("SELECT aa.value  FROM ?aa", [$scope.field.options]);
            // console.log("select all ",res);
        };

        $scope.deSelectAllEvent = function () {
            console.log("deSelectAllHandler--", $scope.field);
            $scope.field.modelValue = [];
            $scope.field.tooltip = "";
            $scope.field.selectedText = "";
            $scope.field.reset();
            var eventName = "change";
            var eventDetails = $scope.getEventDetails(eventName);
            $scope.eventHandler($scope, eventName, null, eventDetails, $scope.field.options[-1]);
        };

        var init = function () {
            // injectDynamicServices();
           // alert("aa");
           console.log("init $scope.field =",$scope.field)
            var defaults = { "show": true, "selectedIndex": -1, "showTitle": true, "disabled": $scope.field.fieldType === "systemcode" ? true : false, "required": $scope.field.fieldType === "systemcode" ? true : false };
            $scope.field.defaultRules = angular.copy(defaults);

            $scope.fieldPattern = fieldService.getFieldPattern($scope.field, $scope.parentForm);
            if ($scope.field["ismultiple"]) {
                console.log("ismultiple", $scope.field["ismultiple"]);
                $scope.field.ismultiple = $scope.field["ismultiple"];
                if (!$scope.field["isgrouping"] && $scope.field["defaultValue"]) {
                    $scope.field.defaultValue = JSON.parse($scope.field.defaultValue);
                }                
            } else {
                $scope.field.ismultiple = false;
            }

            if ($scope.field["isgrouping"]) {
                console.log("isgrouping", $scope.field["isgrouping"]);
                $scope.field.isgrouping = $scope.field["isgrouping"];
            } else {
                $scope.field.isgrouping = false;
            }

            $scope.field.isLoaded = false;
            angular.forEach(defaults, function (defaultValue, key) {
                if ($scope.field[key] === undefined) {
                    $scope.field[key] = defaultValue;
                }
                $scope.field.defaultRules[key] = $scope.field[key];
            });
            if (!$scope.field.cssClass) {
                $scope.field.cssClass = "col_" + $scope.fieldDivisionCount;
                if ($scope.field.fieldType === "systemcode") {
                    $scope.field.cssClass = "col_1";
                }
            }
            if ($scope.field.fieldType === "systemcode") {
                $scope.field.disabled = $scope.field.disabled === undefined ? true : $scope.field.disabled;
                $scope.field.required = $scope.field.required === undefined ? true : $scope.field.required;

                $scope.setSystemCodeFromService();
            }

            if ($scope.field.titleDynamicKeys !== undefined) {
                for (var key in $scope.field.titleDynamicKeys) {
                    if ($scope.field.titleDynamicKeys.hasOwnProperty(key)) {
                        $scope.field.titleDynamicKeys[key] = localStorage.getItem($scope.field.titleDynamicKeys[key]);
                    }
                }
                $scope.field.title = $interpolate($scope.field.title)($scope.field.titleDynamicKeys);
            }

            $scope.loadFieldDataOnInit();
            console.log("defaultselectedindex=", $scope.field["defaultselectedindex"], $scope.field);
            if ($scope.field["defaultselectedindex"] >= 0) {
                $scope.field["selectedIndex"] = $scope.field["defaultselectedindex"];
                if($scope.field.options.length>0){
                    $scope.field["modelValue"] = $scope.field.options[$scope.field["defaultselectedindex"]].value;
                }
               
            }
            // $scope.setDefaultValue($scope.formDataModel);
            if ($scope.field.modelKey) {
                $scope.$watch('field.modelValue', function (n) {
                    if (!$scope.sectionDataModel[$scope.field.modelKey]) {
                        $scope.sectionDataModel[$scope.field.modelKey] = {};
                    }
                    return $scope.sectionDataModel[$scope.field.modelKey] = n;
                });
            }
            if ($scope.field.parentModel) $scope.field.setModel($scope.field.parentModel);
            else $scope.field.setDefaultValue($scope.formDataModel);
        };

        init();
    });

    return angularAMD;
});