define(['angularAMD', 'utilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('raceSeasonFactory', function ($filter, utilService) {
        function raceSeasonFactory(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.setRaceYear = function (sourceField, targetField, parentForm, parentSection, sectionDataModel, event) {
                console.log("I am reached setWithInCostCenterRules", sourceField, targetField, parentForm, parentSection, sectionDataModel, event);
                var financialYear = form.getModelValueByModelKey("financialYear");//|| localStorage.getItem("");
                var season = sectionDataModel["season"];
                if (financialYear) {
                    var raceYear;
                    var finYearSplit = financialYear.split("-");
                    if (season == "W") {
                        raceYear= finYearSplit[1];
                    }
                    else {
                        raceYear= finYearSplit[0];
                    }
                    parentSection.getFieldByModelKey("raceYear").modelValue = raceYear;
                }
               
            }
        };

        return raceSeasonFactory;
    });

    return angularAMD;
});