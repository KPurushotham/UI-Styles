define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('poolsService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function poolsService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.afterLoad = function (screenDefConfig, form) {
                form = form || self.form;
        
            };

            this.accountTypeHandler =  function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
            
                var accountTypeValue = sectionDataModel["accountType"];
                var clientsDropdownField = form.getFieldByModelKey("clientsDropdown");
                var addButton = form.getFieldByModelKey("add");
                
                if (accountTypeValue === "1"){
                    clientsDropdownField.style= "display: none;";
                    clientsDropdownField.ignoreInServiceModel=true;
                    addButton.style = "display: none;";
                    
                }else {
                    clientsDropdownField.style= "display: block;";
                    clientsDropdownField.ignoreInServiceModel=false;
                     addButton.style = "display: block;";

                }
            };

            
            this.viewHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {

                var communityFieldValue = sectionDataModel["pools"];
                var countryFieldValue = sectionDataModel["country"];
                var poolsFieldValue = sectionDataModel["pools"];
                var URL ="/vdi/gapp/pools/poolsgetall?@UserId=8&@MasterAccountId=1&@AccountTypeId=2&@AccountId=1&@CommunityCodeId=1&@CountryCodeId=79&@Active=1";
          
                var defer = $q.defer();
        
                var communitygrid = form.getFieldByModelKey("communitygrid");
              //  var fullURL = URL+communityFieldValue;
                var fullURL = URL;
                overlay.load();
                httpService.get(URL).then(function (results) {
                        if (results.status === 200) {
                            var dataset = results.data.dataset ;
                            communitygrid.gridOptions.api.setRowData(dataset);
                            communitygrid.gridOptions.api.sizeColumnsToFit();
                            communitygrid.style = "display: block;";
                            overlay.hide();
                        }
                    });
              
                return defer.promise;
            };

            this.addHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                this.form.openDialog(sourceField.modalform);
                
            };

        }
        return poolsService;
    });

    return angularAMD;
});