define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('configsetupService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams) {

        function configsetupService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var pattern = form.currentMenuDefinition.pattern;

                if (pattern === "FORM") {

                    var urlKey = form.getFieldByModelKey("urlKey");
                    var urlRoute = form.getFieldByModelKey("urlRoute");
                    var urlMap = form.getFieldByModelKey("urlMap");
                    var dataset = null;

                    if (form.screenMode === "VIEW" || form.screenMode === "EDIT") {

                        urlKey.show = false;

                        if (urlRoute.modelValue === undefined) {
                            urlRoute.show = false;
                            urlMap["cssClass"] = "field-show";
                        }
                        if (urlMap.modelValue === {}) {
                            urlRoute.show = true;
                            urlMap["cssClass"] = "field-hide";
                        }

                        var url = 'vdi/admin/application/config/getone?applicationEntityId=' + $stateParams.applicationEntityId;
                        httpService.get(url).then(function (results) {
                            dataset = results.data.dataset || [];
                            var urlMap = dataset[0]['urlMap'];
                            ace.edit("urlMap").setValue(JSON.stringify(urlMap, null, '\t'));
                        });

                    }
                }

                return false;
            };

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                var urlMap = formServiceModel["applicationSave"].urlMap;
                if (urlMap === null || urlMap === undefined) {
                    formServiceModel["applicationSave"].urlMap = {};
                }
                return formServiceModel;
            }; 

            this.urlRouteOrMapHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var urlKey = this.form.getFieldByModelKey("urlKey");
                var urlRoute = this.form.getFieldByModelKey("urlRoute"); 
                var urlMap = this.form.getFieldByModelKey("urlMap"); 

                if (urlKey.modelValue === true) {
                    ace.edit("urlMap").setValue(JSON.stringify({}, null, '\t'));
                    urlMap["cssClass"] = "field-hide";
                    urlRoute.show = true;
                    urlKey["title"] = "Check for Url Map";
                }
                else if (urlKey.modelValue === "" || urlKey.modelValue === false) {
                    urlRoute.modelValue = "";
                    urlMap["cssClass"] = "field-show";
                    urlRoute.show = false;
                    urlKey["title"] = "Uncheck for Url Route";
                }

            };

        };
        return configsetupService;
    });

    return angularAMD;
});