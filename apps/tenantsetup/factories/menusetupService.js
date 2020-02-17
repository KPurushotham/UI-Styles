define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('menusetupService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, $timeout, fieldService) {

        function menusetupService(form, menuDefinition) {
            this.form = form;
            var self = this;
            this.menuDefinition = menuDefinition;
      
            this.afterLoad = function (screenDefConfig, form, menuDefinition, formServiceModel, currentForm) {

                form = form || self.form;
                var pattern = form.currentMenuDefinition.pattern;

                var applicationDropdownModelValue = localPersistenceService.get("menusetupAppId", true);

                if (pattern === "FORM") {

                    var dataset = null;

                    var urlKey = form.getFieldByModelKey("urlKey");
                    var urlRoute = form.getFieldByModelKey("urlRoute");
                    var urlMap = form.getFieldByModelKey("urlMap");
                    var editKey = form.getFieldByModelKey("editKey");
                    var applicationEntityId = form.getFieldByModelKey("applicationEntityId");

                    if (form.screenMode === "ADD") {
                        applicationEntityId.modelValue = applicationDropdownModelValue;
                    }
                    else if (form.screenMode === "VIEW" || form.screenMode === "EDIT") {

                        urlKey.show = false;

                        if (urlRoute.modelValue === undefined) {
                            urlRoute.show = false;
                            urlMap["cssClass"] = "field-show";
                        }
                        if (urlMap.modelValue === {}) {
                            urlRoute.show = true;
                            urlMap["cssClass"] = "field-hide";
                        }

                        var editKeyValue = editKey.modelValue;
                        editKeyValue = editKeyValue.replace(/[' ]/g, "");
                        editKeyValue = editKeyValue.substr(1).slice(0, -1);
                        editKeyValue = editKeyValue.trim();
                        editKey.modelValue = editKeyValue;

                        var url = 'vdi/admin/application/menu/one?menuId=' + $stateParams.menuId;
                        httpService.get(url).then(function (results) {
                            dataset = results.data.dataset || [];
                            var urlMap = dataset[0]['urlMap'];
                            ace.edit("urlMap").setValue(JSON.stringify(urlMap, null, '\t'));
                        });
                    }
                }
                else {
                    var criteriaRows = screenDefConfig.criteria.rowDivisions;

                    var applicationDropdown = fieldService.getFieldDataByModelKey(criteriaRows[0].columns, "applicationEntityId");
                    //applicationDropdown.modelValue = applicationDropdownModelValue;

                    //$timeout(function () {
                    //    angular.element('#getResultsButton').triggerHandler('click');
                    //}, 0);
                }               

                return false;
            };

        

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                var urlMap = formServiceModel["menuSave"].urlMap;
                var showInMenu = formServiceModel["menuSave"].showInMenu;
                var editKey = formServiceModel["menuSave"].editKey;
                
                if (urlMap === null || urlMap === undefined) {
                    formServiceModel["menuSave"].urlMap = {};
                }
                
                if (showInMenu) {
                    formServiceModel["menuSave"].showInMenu = "t";
                }
                else {
                    formServiceModel["menuSave"].showInMenu = "f";
                }

                var editKeys = editKey.split(",");
                var arrayList = "[ ";
                for (var i = 0; i < editKeys.length; i++) {
                    var str = editKeys[i];
                    arrayList = arrayList.concat("'" + str + "'");
                    if (i === editKeys.length - 1) {
                        arrayList = arrayList;
                    }
                    else {
                        arrayList = arrayList.concat(" , ");
                    }
                    
                    console.log(arrayList);
                }
                arrayList = arrayList.concat(" ]");
                formServiceModel["menuSave"].editKey = arrayList;
                console.log(arrayList);
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

            this.applicationDropdownHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                
                localPersistenceService.set("menusetupAppId", sourceField.modelValue, true);

            };
            
        }
        return menusetupService;
    });

    return angularAMD;
});