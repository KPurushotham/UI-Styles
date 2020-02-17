define(['angularAMD', 'utilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('stakesFactory', function ($filter, utilService) {
        function stakesFactory(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.setStakesShortCode = function (sourceField, targetField, parentForm, parentSection, sectionDataModel, event) {
                console.log("I am reached setWithInCostCenterRules", sourceField, targetField, parentForm, parentSection, sectionDataModel, event);
                var stakesValue = sectionDataModel["stakesValue"];
                if (parseInt(stakesValue)!=NaN) {
                    stakesValue = parseInt(stakesValue) / 1000 + "K";
                }
                parentSection.getFieldByModelKey("stakesShortName").modelValue = "S-" + stakesValue;
            }
        };

        return stakesFactory;
    });

    return angularAMD;
});