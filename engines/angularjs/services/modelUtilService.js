define(['angularAMD', 'dateUtilService', 'httpService'], function (angularAMD) {
    'use strict';

    angularAMD.service('modelUtilService', function ($rootScope, $q, $http, $urlRouter, httpService,
        dateUtilService, constants, Notification, localPersistenceService, $location, _) {
        var self = this;
        this.buildTargetFromMetaMap = function (sourceToTargetMap, sourceModel, asSingleMap) {
            var targetModel = [];
            if (sourceModel) {
                var sourceModelAsArray = angular.isArray(sourceModel) ? sourceModel : [sourceModel];
                var length = sourceModelAsArray.length;
                for (var i = 0; i < length; i++) {
                    var sourceItem = sourceModelAsArray[i];
                    var targetItem = {};
                    
                        angular.forEach(sourceToTargetMap, function (sourceMapkey, targetMapKey) {
                            // if (sourceMapkey != null && typeof sourceMapkey == 'object'){
                            //     targetItem[targetMapKey] = sourceMapkey["pattern"];
                            //     targetItem[targetMapKey] = sourceMapkey["culture"];
                            // }
                            if (!angular.isUndefined(sourceMapkey) && !angular.isString(sourceMapkey)) {
                                targetItem[targetMapKey] = sourceItem[sourceMapkey["key"]] || sourceMapkey["default"] || sourceMapkey["defaultValue"];
                              // Need to fix it here 
                                //  if (angular.isObject(sourceMapkey) && (sourceMapkey == "numericFormat")){
                                //         alert();

                                //       targetItem[targetMapKey] =  "numericFormat":{"pattern":"pattern","culture":"culture"};
                                //     }
                            }
                            else {
                                targetItem[targetMapKey] = sourceItem[sourceMapkey];
                            }
                        });
              
                    targetModel.push(targetItem);
                }
            }

            if (asSingleMap) {
                targetModel = targetModel[0];
            }

            return targetModel;
        };

        this.getAsList = function (sourceObject) {
            var list = [];
            if (angular.isArray(sourceObject)) {
                list = sourceObject;
            }
            else if (!angular.isUndefined(sourceObject)) {
                list.push(sourceObject);
            }

            return list;
        };
        this.getDropdownItemsList = function (sourceDataModel, textKey, valueKey) {
            var itemList = [];
            if (sourceDataModel) {
                for (var i = 0; i < sourceDataModel.length; i++) {
                    var item = sourceDataModel[i];
                    itemList.push({ "text": item[textKey || "text"], "value": item[valueKey || "value"] });
                }
            }
            return itemList;
        };

        this.loadFieldDataFromSingleService = function (fieldsDataServiceConfig, successCallback) {
            if (!fieldsDataServiceConfig) {
                console.log("fieldServiceModelMap: missing fields Data Service Config");
                return;
            }
            var dataUrl = fieldsDataServiceConfig.url;
            var fieldServiceModelMap = fieldsDataServiceConfig.fieldServiceModelMap;

            //TODO: build and append any additional params to the service url.
            httpService.get(dataUrl).then(function (results) {
                var fieldsViewDataMap = {};
                if (results.data.success == 'true') {
                    var options = [];
                    var remoteData = results.data.dataset;
                    var targetFieldDataMap = buildModelDataRecursive(fieldServiceModelMap, remoteData);
                    if (successCallback) {
                        successCallback(targetFieldDataMap, remoteData);
                    }

                } else {
                    Notification.error({
                        message: 'URL<br/>' + constants.api_url + dataUrl,
                        title: 'CODE ERROR - ' + results.data.code,
                        delay: 5000
                    });
                }
            });
        };
        var buildModelDataRecursive = function (fieldServiceModelMap, sourceData, parentModelKey, parentValue) {
            var targetFieldDataMap = {};
            for (var fieldModelKey in fieldServiceModelMap) {
                var serviceModelMap = fieldServiceModelMap[fieldModelKey];
                var datasourceKeyName = serviceModelMap["datasourceKeyName"];
                var dependantFieldServiceModelMap = serviceModelMap["dependantFields"];

                // var fieldServiceData = sourceData[datasourceKeyName] || sourceData;
                //var flatInParent = false;
                //if (!angular.isUndefined(serviceModelMap["flatInParent"])) {
                //    flatInParent = serviceModelMap["flatInParent"];
                //}

                var defaultValueByIndex = serviceModelMap["defaultValueByIndex"];
                var defaultValueByKey = serviceModelMap["defaultValueByKey"];
                var defaultValueByOtherKeyValue = serviceModelMap["defaultValueByOtherKeyValue"];
                var valueKey = serviceModelMap["value"];
                var textKey = serviceModelMap["text"];
                var defaultValue;
                var optionList = [];
                for (var i = 0; i < sourceData.length; i++) {
                    var sourceDataItem = sourceData[i][datasourceKeyName] || sourceData[i];

                    var dataItemList;
                    if (!angular.isArray(sourceDataItem)) {
                        dataItemList = [];
                        dataItemList.push(sourceDataItem);
                    }
                    else {
                        dataItemList = sourceDataItem;
                    }
                    if (angular.isUndefined(parentModelKey) || (sourceData[i][parentModelKey] == parentValue)) {
                        for (var j = 0; j < dataItemList.length; j++) {
                            var dataItem = dataItemList[j];
                            if (!angular.isUndefined(defaultValueByIndex) && defaultValueByIndex == j) {
                                defaultValue = dateUtilService.getIfUIFormatedDate(dataItem[valueKey]);
                            }
                            else if (!angular.isUndefined(defaultValueByKey)) {
                                defaultValue = self.getValueFromModelByKey(defaultValueByKey, dataItem);
                            }
                            //TODO: defaultValueByOtherKeyValue
                            var text = self.getValueFromModelByKey(textKey, dataItem);
                            var value = self.getValueFromModelByKey(valueKey, dataItem);
                            var option = { "text": text, "value": value };
                            option["item"] = dataItem;
                            // option["item"][textKey] = text;
                            // option["item"][valueKey] = value;
                            if (dependantFieldServiceModelMap) {
                                option["dependantFieldsData"] = buildModelDataRecursive(dependantFieldServiceModelMap, dataItemList, valueKey, value);
                            }
                            if (optionList.indexOf(option) == -1) {
                                optionList.push(option);
                            }
                        }
                    }
                }
                targetFieldDataMap[fieldModelKey] = {};
                targetFieldDataMap[fieldModelKey]["defaultValue"] = defaultValue || serviceModelMap["defaultValue"];
                targetFieldDataMap[fieldModelKey].options = optionList;
            }
            return targetFieldDataMap;
        };

        this.loadFormFieldsData = function (sections, sourceFieldDataMap) {
            var sectionCount = sections.length;
            var updatedField = [];
            for (var fieldDataItemKey in sourceFieldDataMap) {
                var fieldDataItem = sourceFieldDataMap[fieldDataItemKey];
                for (var i = 0; i < sectionCount; i++) {
                    var section = sections[i];

                    var rowDivisions = section.rowDivisions;
                    var tabs = section.tabs;
                    if (tabs) {
                        for (var l = 0; l < tabs.length; l++) {
                            var tab = tabs[l];
                            var tabRowDivisions = tab.rowDivisions;
                            for (var j = 0; j < tabRowDivisions.length; j++) {
                                var fields = tabRowDivisions[j].fields;
                                for (var k = 0; k < fields.length; k++) {
                                    if (updatedField.indexOf(fields[k]) == -1 && fieldDataItemKey == fields[k].modelKey) {
                                        fields[k].options = fieldDataItem.options;
                                        fields[k].defaultValue = fieldDataItem["defaultValue"];
                                        updatedField.push(fields[k]);
                                        break;
                                    }
                                }
                            }
                        }

                    }
                    if (rowDivisions) {

                        for (var j = 0; j < rowDivisions.length; j++) {
                            var fields = rowDivisions[j].fields;
                            for (var k = 0; k < fields.length; k++) {
                                if (updatedField.indexOf(fields[k]) == -1 && fieldDataItemKey == fields[k].modelKey) {
                                    fields[k].options = fieldDataItem.options;
                                    fields[k].defaultValue = fieldDataItem["defaultValue"];
                                    updatedField.push(fields[k]);
                                    break;
                                }
                            }
                        }
                    }

                }
            }


        };
        this.buildSelectOptions = function (dataConfig, sectionDataModel) {
            console.log("dataConfig, sectionDataMode=",dataConfig, sectionDataModel);
            var defer = $q.defer();
            if (!dataConfig) {
                defer.reject();
            }
            else if (dataConfig["localData"]) {
                defer.resolve(dataConfig["localData"]);
            }
            else {
                var url = dataConfig["dataUrl"];
                var displayKey = dataConfig["displayKey"];
                var valueKey = dataConfig["valueKey"];

                var childDataKeyMap = dataConfig["childDataKeyMap"];

                var displayTemplate = dataConfig["displayTemplate"];
                var additionalQSParams = dataConfig["additionalQSParams"];

                if (additionalQSParams) {
                    url += url.indexOf("?") > 0 ? "&" : "?";
                    url = url + additionalQSParams;
                }

                displayKey = displayKey || "text";
                valueKey = valueKey || "value";

                httpService.get(url).then(function (results) {
                    // debugger;
                    if (results && results.data && results.data.success === 'true') {
                        var options = [];
                        var resultData = results.data.dataset || results.data.data;
                        options = self.formatResultDataForOptions(resultData, displayKey, valueKey, displayTemplate, childDataKeyMap, true, undefined);
                        /*angular.forEach(resultData, function (item, key) {
                            var displayKeyItems = displayKey.split("-");

                            var text;
                            if (displayKeyItems.length > 1) {
                                var textItems = [];
                                angular.forEach(displayKeyItems, function (displayKeyItem, key) {
                                    textItems.push(item[displayKeyItem]);
                                });
                                text = textItems.join("-");
                            } 
                            else if(displayTemplate){
                                text = $.tmpl(displayTemplate,item)[0].data;
                            } else{
                                text = item[displayKey];

                            }
                            //console.log("option template",displayTemplate);
                            //console.log("data for option",item);
                            //console.log("final text for option", $.tmpl(displayTemplate,item));
                            var value = item[valueKey];

                            var option = { "text": text, "value": value, "item": item };
                            options.push(option);
                        });*/
                        defer.resolve(options);
                    } else {
                        defer.reject(results);
                        Notification.error({
                            message: 'URL<br/>' + constants.api_url + url,
                            title: 'CODE ERROR - ' + (results && results.data ? results.data.code : "Service Error"),
                            delay: 5000
                        });
                    }

                });
            }
            return defer.promise;
        };

        this.formatResultDataForOptions = function (resultData, displayKey, valueKey, displayTemplate, childDataKeyMap, hasChildData, parentData) {
            var options = [];
            angular.forEach(resultData, function (item, key) {
                var displayKeyItems = displayKey.split("-");

                var text, parentItem;
                if (displayKeyItems.length > 1) {
                    var textItems = [];
                    angular.forEach(displayKeyItems, function (displayKeyItem, key) {
                        textItems.push(item[displayKeyItem]);
                    });
                    text = textItems.join("-");
                }
                else if (displayTemplate) {
                    text = $.tmpl(displayTemplate, item)[0].data;
                } else {
                    text = item[displayKey];

                }
                var value = item[valueKey];
                var childrenData = [];
                if (hasChildData) {
                    if (item["childDataSourceId"] != null && item["childDataSourceId"] != undefined) {

                        var childdisplayKey = childDataKeyMap["displayKey"];
                        var childvalueKey = childDataKeyMap["valueKey"];
                        var parentDataItem = {
                            "text": text,
                            "value": value,
                            "dataSourceId": item["dataSourceId"],
                            "childDataSourceId": item["childDataSourceId"]
                        };
                        //console.log("aaaaaa,",parentDataItem);
                        childrenData = self.formatResultDataForOptions(item["childDataItems"], childdisplayKey, childvalueKey, displayTemplate, undefined, false, parentDataItem);
                        // item.options.push()
                        // item.options.splice( 0, 0, parentDataItem );
                    }
                }
                var option = { "text": text, "value": value, "item": item, "children": childrenData };
                if (parentData) {
                    option["parentText"] = parentData["text"];
                    option["parentValue"] = parentData["value"];
                    option["parentDataSourceId"] = parentData["dataSourceId"];
                    option["childDataSourceId"] = parentData["childDataSourceId"];
                    // parentItem =parentData
                } else {
                    option["parentValue"] = "";
                }
                options.push(option);
            });
            //  console.log("children options=",options);
            return options;
        };

        var processChildrenData = function () {

        };

        var formatResultDataForOptions1 = function(resultData,displayKey,valueKey,displayTemplate,childDataKeyMap,hasChildData,parentData){
            var options = [];
            angular.forEach(resultData, function (item, key) {
                var displayKeyItems = displayKey.split("-");

                var text,parentItem;
                if (displayKeyItems.length > 1) {
                    var textItems = [];
                    angular.forEach(displayKeyItems, function (displayKeyItem, key) {
                        textItems.push(item[displayKeyItem]);
                    });
                    text = textItems.join("-");
                } 
                else if(displayTemplate){
                    text = $.tmpl(displayTemplate,item)[0].data;
                } else{
                    text = item[displayKey];

                }
               
                //console.log("option template",displayTemplate);
                //console.log("data for option",item);
                //console.log("final text for option", $.tmpl(displayTemplate,item));
                var value = item[valueKey];
                if(hasChildData){
                    if(item["childDataSourceId"]!= null && item["childDataSourceId"] != undefined){
                        
                        var childdisplayKey = childDataKeyMap["displayKey"];
                        var childvalueKey = childDataKeyMap["valueKey"];
                        var parentDataItem ={ "text": text, 
                                              "value": value, 
                                              "dataSourceId": item["dataSourceId"],
                                              "childDataSourceId":item["childDataSourceId"] 
                                            };
                        //console.log("aaaaaa,",parentDataItem);
                        item.options= self.formatResultDataForOptions(item["childDataItems"],childdisplayKey,childvalueKey,displayTemplate,undefined ,false,parentDataItem);
                        item.options.push()
                        item.options.splice( 0, 0, parentDataItem );
                    }
                }
                var option = { "text": text, "value": value, "item": item };
                if(parentData){
                    option["parentText"]=parentData["text"];
                    option["parentValue"]=parentData["value"];
                    option["parentDataSourceId"]=parentData["dataSourceId"];
                    option["childDataSourceId"]=parentData["childDataSourceId"];
                   // parentItem =parentData
                }else{
                    option["parentValue"] = "";
                }
               
                options.push(option);
            });
            console.log("options=",options);
            return options;
        }

        this.getValueFromModelByKey = function (modelKey, dataModel, parentmodelKey, parentForm, forServiceModel) {
            var dataModelValue;
            dataModel = dataModel || sessionStorage;
            if (modelKey) {
                if (modelKey === "currentDate") {
                    dataModelValue = dateUtilService.getCurrentDate();
                }
                else if (modelKey === "createdDate") {
                    var creationDate = dateUtilService.getCurrentDate();
                    dataModelValue = dateUtilService.convertToDBFormat(creationDate);
                    console.log("dataModelValue : " + dataModelValue);
                }
                else if (modelKey === "currentDateTime") {
                    dataModelValue = dateUtilService.getCurrentDateTime();
                } else if (modelKey === "currentFinancialYearEndDate" || modelKey === "CFYED") {
                    dataModelValue = dateUtilService.getCurrentFinancialYearEndDate();
                }
                else {
                    var multipleKeysSplit = modelKey.split("-");
                    if (multipleKeysSplit.length >= 1) {
                        var dataModelValueArray = [];
                        for (var i = 0; i < multipleKeysSplit.length; i++) {
                            var dataModelSingleValue = this.getValueFromModelBySingleKey(multipleKeysSplit[i], dataModel, parentmodelKey, parentForm, forServiceModel);
                            dataModelValueArray.push(dataModelSingleValue);
                        }
                        dataModelValue = dataModelValueArray.join("-");
                    }
                }
            }
            return dataModelValue;
        };
        this.getValueFromModelBySingleKey = function (modelKey, dataModel, parentmodelKey, parentForm, forServiceModel) {
            var modelKeySplits = modelKey.split(".");
            dataModel = dataModel || sessionStorage;
            var dataModelValue;
            if (modelKeySplits.length >= 1) {

                var sourceModelKey;
                if (modelKeySplits.length == 1) {
                    sourceModelKey = modelKeySplits[0];
                    if (parentmodelKey && dataModel.hasOwnProperty(parentmodelKey)) {
                        dataModel = dataModel[parentmodelKey];
                    }
                }
                if (modelKeySplits.length == 2) {
                    sourceModelKey = modelKeySplits[1];
                    var dataSourceKey = modelKeySplits[0];
                    if (dataSourceKey === "LS" || dataSourceKey === "localStorage") {
                        dataModel = localStorage;
                    }
                    else if (dataSourceKey === "UP" || dataSourceKey === "UrlParams") {
                        dataModel = parentForm.urlParams;
                    }
                    else if ((dataSourceKey === "SM" || dataSourceKey === "PSM" || dataSourceKey === "ParentSectionModel")) {
                        if (dataModel && dataModel.hasOwnProperty("sectionDataModel")) {
                            dataModel = dataModel["sectionDataModel"];
                        }
                        else if (parentmodelKey && dataModel && dataModel.hasOwnProperty(parentmodelKey)) {
                            dataModel = dataModel[parentmodelKey];
                        }
                    }
                    else if ((dataSourceKey === "ESM" || dataSourceKey === "EventSourceModel")) {
                        if (dataModel && dataModel.hasOwnProperty("eventSourceModel")) {
                            dataModel = dataModel["eventSourceModel"];
                        }
                        else if (parentmodelKey && dataModel && dataModel.hasOwnProperty(parentmodelKey)) {
                            dataModel = dataModel[parentmodelKey];
                        }
                    }
                    else if (dataModel.hasOwnProperty(dataSourceKey)) {
                        dataModel = dataModel[dataSourceKey];
                    }

                }
                var sourceDataModelList = self.getAsList(dataModel);

                for (var i = 0; i < sourceDataModelList.length; i++) {
                    var sourceModel = sourceDataModelList[i];
                    dataModelValue = sourceModel[sourceModelKey];
                    break;
                }
                if (dataModelValue && !angular.isString(dataModelValue) && dataModelValue.hasOwnProperty("value")) {
                    dataModelValue = dataModelValue["value"];
                }
                if (angular.equals(dataModel, dataModelValue)) {
                    dataModelValue = null;
                }
                if (!angular.isNumber(dataModelValue) && dataModelValue) {
                    dataModelValue = dateUtilService.getIfFormatedDate(dataModelValue, forServiceModel);
                }

            }

            return angular.isUndefined(dataModelValue) ? "" : dataModelValue;
        }
        
        this.getValueFromMapByKey = function (valueKey, valueMap) {
            var headedrValue;
            var valueKeyPair = valueKey.split("||");
            for (var i = 0; i < valueKeyPair.length; i++) {
                headedrValue = valueMap[valueKeyPair[i]];
                if (angular.isDefined(headedrValue)) {
                    headedrValue = headedrValue;
                    break;
                }
            }

            return headedrValue;
        }

        this.getValueFromQS = function(qskey){
            var qsValue = $location.search()[qskey];
            return qsValue;
        }
    });


    return angularAMD;
});