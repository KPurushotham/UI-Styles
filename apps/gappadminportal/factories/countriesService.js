define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('countriesService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function countriesService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form) {
                form = form || self.form;
        
            };

            this.accountTypeHandler =  function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
            
                var accountTypeValue = sectionDataModel["accountType"];
                var communityDropdownField = form.getFieldByModelKey("community");
                var clientsDropdownField = form.getFieldByModelKey("clientsDropdown");
                //var communityField = communityDropdownField[1];
                var addButton = form.getFieldByModelKey("add");
                
                if (accountTypeValue === "1"){
                    communityDropdownField.style = "display: block;";
                    addButton.style = "display: none;";
                    clientsDropdownField.style = "display: none;";
                    
                }else {
                    communityDropdownField.style = "display: block;";
                    clientsDropdownField.style = "display: block;";
                     addButton.style = "display: block;";

                }
            };

      
            
            this.viewHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
             
                var communityFieldValue = sectionDataModel["community"];
                var countryFieldValue = sectionDataModel["country"];
                var URL = "vdi/gapp/Countries/CommunityCountries?@AccountId=31&@CommunityCodeId=2&@Active=1";  
                var defer = $q.defer();
              
                var countrygrid = form.getFieldByModelKey("countrygrid");
              //  var fullURL = URL+communityFieldValue;
                var fullURL = URL;
                overlay.load();
                httpService.get(URL).then(function (results) {
                        if (results.status === 200) {
                            var dataset = results.data.dataset;
                            countrygrid.gridOptions.api.setRowData(dataset);
                            countrygrid.gridOptions.api.sizeColumnsToFit();
                            countrygrid.style = "display: block;";
                            overlay.hide();
                        }
                    });
              
                return defer.promise;
            };

            this.addHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                this.form.openDialog(sourceField.modalform);
                // var parentSection =parentSection;
                // var sectionField = parentForm.sections[1];
                // sectionField.show=true;
             
            };

        }
        return countriesService;
    });

    return angularAMD;
});