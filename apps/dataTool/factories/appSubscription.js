define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('appSubscription', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams) {

        function appSubscription(form, menuDefinition) {

            this.form = form;
            this.menuDefinition = menuDefinition;
            var  self = this;    

            this.showInEditMode = function (currentForm) {
                var self = this;
                var corpDropDown = currentForm.getFieldByModelKey("corporationEntityId");
                corpDropDown.disabled = true;

                console.log("I am through budgetReallocationFactory.showFormDetails");
            };

            this.afterLoad = function (screenDefConfig, form, menuDefinition, currentForm) {

                form = form || self.form;
                var dataset = null;
                //   var Service = getFieldByKey("serviceData");
                var Service = self.form.sections[0].rowDivisions[0].fields;

                console.log("Service===", Service);
                var url = 'vdi/servicebuilder/dataview/get/all';
                httpService.get(url).then(function (results) {
                    console.log("results===", results);
                    dataset = results.data.dataset[0] || [];

                    Service[0].modelvalue = JSON.stringify(dataset);
                    ace.edit("editor").setValue(JSON.stringify(dataset, null, '\t'));

                    console.log("dataset===", dataset);

                });
                if (dataset) {
                    console.log("dataset===", dataset);
                    Service[0].modelvalue = dataset;
                }

                return false;
            };

            //JSON.stringify(JSON.parse(ace.edit("editor").getValue()))

            var getFieldByKey = function (modelKey) {
                self["fields"] = self["fields"] || {};
                var field = self["fields"][modelKey];
                if (!field) {
                    field = self.form.getFieldByModelKey(modelKey);
                    self["fields"][modelKey] = field;
                }
                return field;
            }

        };
        return appSubscription;
    });

    return angularAMD;
});