define(['angularAMD', 'modelUtilService', 'dateUtilService', 'fieldService', 'fieldBaseController', 'dateRangeFieldController', 'utilService'], function (angularAMD) {
    'use strict';

    angularAMD.controller('compositeRepeaterFieldController', function ($scope, $controller, httpService, overlay,
        Notification, $filter, fieldService, modelUtilService) {

        var defaultCompositeModel;

        $scope.$on('notifyDependantsOnParentDataChange', function (event, args) {
            console.log('notifyDependantsOnParentDataChange args:', args);
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
                    // this is to load field data by source selected value, for e.g. listing screen with dropdown dependancy, based on the selected value
                    // the grid, dropdown or other fields data would be loaded using the the specific loadData config.
                    var eventSourceValue = args["eventSourceValue"];
                    if (dataConfigs[eventSourceValue]) {
                        $scope.field["dataConfig"] = dataConfigs[eventSourceValue];
                    }
                    else {
                        $scope.field["dataConfig"] = null;
                    }
                }
                if (currentSourceDC.hasOwnProperty("defaultValue") || currentSourceDC.hasOwnProperty("defaultValueByKey")) {
                    defaultValue = currentSourceDC["defaultValue"] || defaultValue;
                    $scope.setDefaultValue(currentSourceDC["defaultValueByKey"], currentSourceDC["defaultValue"], $scope.formDataModel);
                }

                if (loadDataConfig) {
                    $scope.field.loadFieldData(loadDataConfig["keyParams"], $scope.parentModel);
                }
                else if (valuePrefixConfig) {
                    $scope.setValuePrefix(valuePrefixConfig);
                }


            });
        });

        $scope.field.reset = function () {
            // $scope.field.setDefaultValue();
            console.log("compositeRepeaterFieldController reset calling")
            if ($scope.field.selectAllHandler)
                $scope.field.selectAllHandler([]);
            if ($scope.compositeSectionDataModel[$scope.field.modelKey])
                $scope.compositeSectionDataModel[$scope.field.modelKey] = [];
            else {
                $scope.compositeSectionDataModel = [];
            }
            init();
        };
        $scope.field.setModel = function (serviceDataModel) {
            console.log("*****************************", serviceDataModel);
            var model;
            if ($scope.field.useGetOneModelAsFieldDataModel) {
                model = serviceDataModel;
            }
            else if ($scope.field.modelKey && serviceDataModel) {
                model = serviceDataModel[$scope.field.modelKey];
            }
            else {
                model = [];
            }
            if (model && model.length > 0) {
                //removing all empty records first before setting model to view 
                if ($scope.repeateCompositFieldList.length > 0) {
                    for (var i = 0; i < $scope.repeateCompositFieldList.length; i++) {
                        $scope.removeHandler(i);
                    }
                }
                var itemCount = model.length;
                for (var i = 0; i < itemCount; i++) {
                    var showTitle = i === 0 ? true : false;
                    var repeateCompositField = $scope.addCompositeFieldRow(i, showTitle, true);
                    $scope.setCompositeFieldModel(repeateCompositField, model[i]);

                }
            }
            if (model) {
                model.push(angular.copy(defaultCompositeModel));
                $scope.compositeSectionDataModel = model;
            }
        };

        $scope.field.getFieldByRowIndex = function (index) {
            return $scope.repeateCompositFieldList[index];
        };

        $scope.field.getOriginalModel = function () {
            var fieldViewModel = $scope.compositeSectionDataModel;
            console.log("fieldViewModel getOriginalModel", fieldViewModel);
            return fieldViewModel;
        };

        $scope.field.getModel = function () {
            var fieldViewModel = $scope.compositeSectionDataModel;

            var model = [];

            if (fieldViewModel && fieldViewModel.length > 0) {
                for (var i = 0; i < (fieldViewModel.length); i++) {
                    //for (var i = 0; i < (fieldViewModel.length) - 1; i++) {
                    var viewItem = fieldViewModel[i];

                    if ($scope.repeateCompositFieldList[i]) {
                        var compositefields = $scope.repeateCompositFieldList[i].compositefields;
                        var serviceItem = $scope.buildServiceModelItem(compositefields, viewItem);
                        if ($scope.isDirtyItem(i)) {
                            model.push(serviceItem);
                        }
                    }
                }
            }

            if ($scope.deletedItems) {
                model = model.concat($scope.deletedItems);
            }
            return model;
        };

        var init = function () {

            $scope.repeateCompositFieldList = [];
            $scope.compositeSectionDataModel = $scope.sectionDataModel[$scope.field.modelKey] || [];
            $scope.sectionDataModel[$scope.field.modelKey] = $scope.compositeSectionDataModel;

            $scope.compositeFieldCount = $scope.field["compositefields"].length;

            if ($scope.compositeFieldCount > 0) {
                var modelKeys = $scope.field.compositefields.map(function (x) { return x.modelKey; });
                $scope.compositeFieldModelKeys = modelKeys;
                defaultCompositeModel = {};
                for (var i = 0; i < modelKeys.length; i++) {
                    if (modelKeys[i]) defaultCompositeModel[modelKeys[i]] = "";
                }
            }
            $scope.addCompositeFieldRow(0, true, false);


        };
        var getModelMap = function () {
            var modelKeyMap = $scope.field.modelKeyMap || $scope.compositeFieldModelKeys || [];
            modelKeyMap.push("operartionType");
        };

        $scope.buildServiceModelItem = function (compositefields, viewItem) {
            var modelKeyMap = getModelMap();
            var serviceItem = {};

            for (var modelKey in viewItem) {
                if (!modelKeyMap || modelKeyMap.indexOf(modelKey) > -1) {
                    var modelValue = "";
                    var fromGetModelFn = false;
                    var useFieldLevelModelKey = true;
                    var ignoreInModelIfNull = false;

                    for (var j = 0; j < compositefields.length; j++) {
                        var compositefieldItem = compositefields[j];
                        if (modelKey === compositefieldItem["modelKey"]) {
                            if (compositefieldItem.getModel) {
                                modelValue = compositefieldItem.getModel(viewItem);
                                fromGetModelFn = true;
                            }
                            if (!angular.isUndefined(compositefieldItem["useFieldLevelModelKey"])) {
                                useFieldLevelModelKey = compositefieldItem["useFieldLevelModelKey"];
                            }
                            ignoreInModelIfNull = compositefieldItem["ignoreInModelIfNull"] || false;
                            break;
                        }
                    }
                    if (modelValue === "") {
                        modelValue = modelUtilService.getValueFromModelByKey(modelKey, viewItem, null, $scope.parentForm);
                    }
                    if ((modelValue !== "" && modelValue !== null && modelValue !== undefined) || !ignoreInModelIfNull) {
                        if (!useFieldLevelModelKey) {
                            serviceItem = angular.extend(serviceItem, modelValue);
                        }
                        else {
                            serviceItem[modelKey] = modelValue;
                        }
                    }
                }
            }
            return serviceItem;
        };

        $scope.isDirtyItem = function (itemIndex) {
            var df_form = $scope.parentForm["df_form"];
            var isDirty = false;
            if (df_form)
                var modelKeys = $scope.compositeFieldModelKeys;
            for (var i = 0; i < modelKeys.length; i++) {
                var modelKey = modelKeys[i];
                var viewField = df_form[modelKey + itemIndex];
                if (viewField && viewField["$dirty"] === true) {
                    isDirty = true;
                    break;
                }
            }
            return isDirty;
        };

        $scope.addCompositeFieldRow = function (index, showTitle, isExisted, isAddNew) {
            $scope.compositeSectionDataModel[index] = angular.copy(defaultCompositeModel);
            if (isAddNew) {
                $scope.compositeSectionDataModel[index]["operationType"] = "INSERT";
            }
            var repeateCompositField = angular.copy($scope.field);
            repeateCompositField.isExisted = isExisted;
            $scope.setShowTitle(repeateCompositField, showTitle);
            $scope.repeateCompositFieldList.push(repeateCompositField);
            $scope.resetRequiredValidation();
            // console.log($scope.repeatFieldList);
            return repeateCompositField;
        };

        $scope.setCompositeFieldModel = function (repeateCompositField, itemModel) {
            var compositeFields = repeateCompositField["compositefields"];

            for (var i = 0; i < compositeFields.length; i++) {
                var innerField = compositeFields[i];
                innerField.parentModel = itemModel;
            }

        };

        $scope.resetRequiredValidation = function () {
            //reset last record optional 
            var defaultCompositeFieldMap = {};
            var defaultFieldCompositeFields = $scope.field["compositefields"];
            for (var i = 0; i < defaultFieldCompositeFields.length; i++) {
                var compositeField = defaultFieldCompositeFields[i];
                defaultCompositeFieldMap[compositeField["modelKey"]] = compositeField;
            }
            var rowCount = $scope.repeateCompositFieldList.length;
            for (var i = 0; i < rowCount; i++) {
                var repeateCompositField = $scope.repeateCompositFieldList[i];
                var compositeFields = repeateCompositField["compositefields"];

                for (var j = 0; j < compositeFields.length; j++) {
                    var innerField = compositeFields[j];
                    var modelKey = innerField["modelKey"];
                    if (i === rowCount - 1) {
                        innerField.required = false;
                    }
                    else {
                        innerField.required = defaultCompositeFieldMap[modelKey].required;
                    }
                }

            }
        };

        $scope.addHandler = function (index) {
            $scope.addCompositeFieldRow(index + 1, false, false, true);
        };

        $scope.setShowTitle = function (repeateCompositField, value) {
            if (repeateCompositField) {
                for (var i = 0; i < $scope.compositeFieldCount; i++) {
                    repeateCompositField["compositefields"][i].showTitle = value || false;
                }
            }

        };

        $scope.removeHandler = function (index) {
            if ($scope.repeateCompositFieldList[index].isExisted) {
                $scope.deletedItems = $scope.deletedItems || [];
                var deletedViewItem = $scope.compositeSectionDataModel[index];
                var compositefields = $scope.repeateCompositFieldList[index]["compositefields"];
                var deletedItem = $scope.buildServiceModelItem(compositefields, deletedViewItem);
                if (deletedItem.hasOwnProperty("status")) deletedItem["status"] = "Inactive";
                $scope.deletedItems.push(deletedItem);
            }
            $scope.compositeSectionDataModel.splice(index, 1);
            $scope.repeateCompositFieldList.splice(index, 1);
            var repeateCompositField = $scope.repeateCompositFieldList[0];

            $scope.setShowTitle(repeateCompositField, true);
            $scope.resetRequiredValidation();
        };

        $scope.indexOfInModel = function (model, rowEntity) {

            var index = -1;
            var serviceData = model;
            if (serviceData) {
                var serviceItemCount = serviceData.length;
                for (var i = 0; i < serviceItemCount; i++) {
                    var serviceItem = serviceData[i];
                    var matchFlag = $scope.checkObjectEqualsTo(serviceItem, rowEntity);
                    if (matchFlag.indexOf("0") === -1) {
                        index = i;
                        break;
                    }
                }
            }
            return index;
        };

        $scope.checkObjectEqualsTo = function (source, target) {
            var matchFlag = "";
            var modelKeyMap = getModelMap();

            for (var k = 0; k < modelKeyMap.length; k++) {

                if (source[modelKeyMap[k]] === target[modelKeyMap[k]]) {
                    matchFlag = matchFlag + "1";
                }
                else {
                    matchFlag = matchFlag + "0";
                }
            }
            return matchFlag;
        };
        init();
    });

    return angularAMD;
});