define(['angularAMD', 'utilService', 'gridService', 'dateUtilService', 'localPersistenceService', 'alaSqlExtensions'], function (angularAMD) {
    'use strict';

    angularAMD.factory('communityService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, localPersistenceService, Notification, httpService, $q, $stateParams, overlay) {

        function communityService(form, menuDefinition) {
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
                var accountTypeValue = sectionDataModel["accountType"];
                //var URL = "vdi/postget/gapp/communities/details";
                var URL = "vdi/postget/gapp/ComRateschedule/all";
                // var params = {
                //     "@AccountId":1, 
                //     "@Active":1
                //     }

                var params = {
                    "@AccountId": 31,
                    "@CommunityCodeId": 2,
                    "@CountryCodeId": 77,
                    "@PoolCodeId": null
                };
                var defer = $q.defer();
               
                var sectionField = parentForm.sections[1];
                    sectionField.show=false;  
                var communitygrid = form.getFieldByModelKey("communitygrid");
              //  var fullURL = URL+communityFieldValue;
                var fullURL = URL;
                overlay.load();
                httpService.post(URL,params).then(function (results) {
                  
                        if (results.status === 200) {
                            var dataset = results.data.dataset ;
                            let res = alasql("SELECT *,convertdate(effectiveStartDate)as StartDate, lastupdateddate(effectiveEndDate)as EndDate  FROM ?", [dataset]);
                            communitygrid.gridOptions.api.setRowData(res);
                            communitygrid.gridOptions.api.sizeColumnsToFit();
                            communitygrid.style = "display: block;";
                            overlay.hide();
                        }
                       
                });
                return defer.promise;
            };

            alasql.fn.convertdate = function (a) {
                if (a) {
                    return moment(a).format("MM/DD/YYYY");
                }
            };

            alasql.fn.lastupdateddate = function (a) {
                if (a) {
                    return moment(a).format("MM/DD/YYYY");
                }
            };

            this.addHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                console.log("aaaa...", sourceField);
                this.form.openDialog(sourceField.modalform);
                // var parentSection =parentSection;
                // var sectionField = parentForm.sections[1];
                // sectionField.show=true;
             };

             this.saveModelForm = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
           
         
             };
             this.buildDataTobeSubmitted = function (formServiceModel, operationType) {

            

             };



             this.saveDataHandler = function (sourceField, parentForm, parentSection, sectionDataModel, formDataModel, event) {
                parentSection = parentSection;
                var sectionField = parentForm.sections[1];
                sectionField.show=false;


                var communitygrid = form.getFieldByModelKey("communitygrid");
                var URL = "vdi/hostfees/distributions/all";  
                httpService.get(URL).then(function (results) {
                    if (results.status === 200) {
                        var dataset = results.data.dataset;
                        communitygrid.gridOptions.api.setRowData(dataset);
                    }
                });
             };
        }
        return communityService;
    });

    return angularAMD;
});