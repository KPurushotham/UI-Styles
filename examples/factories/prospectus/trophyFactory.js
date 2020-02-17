    define(['angularAMD', 'utilService'], function (angularAMD) {
        'use strict';

    angularAMD.factory('trophyFactory', function ($filter, utilService) {
        function trophyFactory(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

           
            this.setTrophyShortCode = function (sourceField, targetField, parentForm, parentSection, sectionDataModel, event) {
                console.log("I am reached setWithInCostCenterRules", sourceField, targetField, parentForm, parentSection, sectionDataModel, event);
                var trophyValue = sectionDataModel["trophyValue"];
                if (parseInt(trophyValue) != NaN) {
                    trophyValue = parseInt(trophyValue) / 1000 + "K";
                }
                parentSection.getFieldByModelKey("trophyShortName").modelValue = "T-" + trophyValue;
            }
        };

        return trophyFactory;
    });

    return angularAMD;
});