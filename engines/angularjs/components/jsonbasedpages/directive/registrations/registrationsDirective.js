define(['app'], function (app) {
    'use strict';
    app.directive('registration', function () {
        var controller = function ($scope, httpService, overlay, $rootScope, $filter) {
             $scope.isSameAddress = false;
            var getPartySubCategoryTypes = function() {
                overlay.load();

                if($scope.selectedData.partyCategory.entityObjectId!=undefined)
                {
                var url = 'vdi/olims/party/partysubcategory/all?fk-partyCategoryId=' + $scope.selectedData.partyCategory.entityObjectId;
                httpService.get(url).then(function (results) {
                    overlay.hide();
                    if (results.status == 200) {
                        $scope.dropDownData.partySubCategoryDD = results.data.dataset;
                    } else {
                        $rootScope.showMessage({
                            messageStatus: constants.errorStatus,
                            messageText: constants.checkSave
                        });
                    }
                });
                }
            },
            getStates = function(country, type) {
                overlay.load();
                var url = 'vdi/olims/core/statebox/all?countryId=' + country.id;

                httpService.get(url).then(function (results) {
                    overlay.hide();
                    if (results.status == 200) {
                        if(type == "BANK") {
                            $scope.dropDownData.stateBankDD = results.data.dataset;
                        }else {
                            $scope.dropDownData.stateAddressDD = results.data.dataset;
                        }

                    } else {
                        $rootScope.showMessage({
                            messageStatus: constants.errorStatus,
                            messageText: constants.checkSave
                        });
                    }
                });
            },
            getCities = function(state, country, type) {
                overlay.load();
                var url = 'vdi/olims/core/citybox/all?stateId='+ state.id + '&countryId=' + country.id;

                httpService.get(url).then(function (results) {
                    overlay.hide();
                    if (results.status == 200) {
                        if(type == "BANK") {
                            $scope.dropDownData.cityBankDD = results.data.dataset;
                        }else {
                            $scope.dropDownData.cityAddressDD = results.data.dataset;
                        }
                    } else {
                        $rootScope.showMessage({
                            messageStatus: constants.errorStatus,
                            messageText: constants.checkSave
                        });
                    }
                });
            };

            $scope.partyCategoryChangeHandler = function() {
                getPartySubCategoryTypes();
            };

            $scope.partySubCategoryChangeHandler = function() {

            };

            $scope.changeCountry = function(country, type) {
                if(country.id)
                getStates(country, type);
            };
            $scope.changeState = function(state, country, type) {
                if(state.id)
                getCities(state, country, type);
            };

            $scope.changeCity = function() {

            };

            $scope.changeClub = function() {
                if($scope.selectedData.club.value === "HRC") {
                    $scope.selectedData.clubDisable = true;
                    if($scope.partyModel.basicDetails.nonLocal)
                    $scope.partyModel.basicDetails.nonLocal = false;
                }else {
                    $scope.selectedData.clubDisable = false;
                    if($scope.partyModel.basicDetails.nonLocal)
                    $scope.partyModel.basicDetails.nonLocal = true;
                }
            }

            $scope.samAsPermenent = function()
            {
              $scope.isSameAddress = !$scope.isSameAddress;
              //$scope.putTempCopy = angular.copy($scope.partyModel.address1);
              if($scope.isSameAddress)
               {
                 $scope.partyModel.address1 = angular.copy($scope.partyModel.address);
               }else {
                 $scope.partyModel.address1 = {};
               }
            }
            $scope.outStationChangeHandler = function() {
				 
                $scope.selectedData.club = '';
 
                $scope.tempClub = [];

              //  $scope.dropDownData.clubDD.push({value:'HRC',text:'HYDERABAD RACE CLUB'});
                var findObj = $filter('filter')($scope.dropDownData.clubDD, { value:  'HRC'}, true)[0];
                if(findObj==undefined)
                {
                    $scope.dropDownData.clubDD.push({value:'HRC',text:'HYDERABAD RACE CLUB'});

                }
                angular.forEach($scope.dropDownData.clubDD, function(club, key) {


                    if(club.value==='HRC' && $scope.partyModel.basicDetails.nonLocal)
                    {
                       $scope.dropDownData.clubDD.splice(key,1);
                       console.log('logged');

                    }
                });

                if(!$scope.partyModel.basicDetails.nonLocal) {
                  $scope.selectedData.clubDisable = true;
                    for(var i = 0; i < $scope.dropDownData.clubDD.length; i++) {
                        if($scope.dropDownData.clubDD[i].value === "HRC") {

                            setTimeout(function () {
                                $scope.selectedData.club = $scope.dropDownData.clubDD[i];
                            }, 1000);
                            break;
                        }
                    }
                }else {
                    setTimeout(function () {
                        $scope.selectedData.clubDisable = false;
                      //  $scope.selectedData.club = $scope.dropDownData.clubDD[0];
                    }, 1000);
                }
            };

            $scope.updatePublicationName = function(type) {
                $scope.partyModel.basicDetails['publicationName'] = angular.copy($scope.partyModel.basicDetails[type]);
            };
        };

        return {
            restrict: 'E',
            scope: {
                datasource: '=',
                screentype: '=',
                partyModel: '=',
                selectedData: '=',
                dropDownData: '=',
                saveSubmit: '=',
                partyForm: '=',
                disableFlag: '='
            },
            controller: controller,
            link: function(scope, element, attrs) {
                scope.getContentUrl = function() {
                    var type = 'directive/registrations/views/' + scope.datasource + '.html';

                    if(scope.screentype === "basic") {
                        type = 'directive/registrations/views/basicinformation/' + scope.datasource + '.html';
                    }

                    return type;
                }
            },
            template: '<div ng-include="getContentUrl()"></div>'
        }
    })
});
