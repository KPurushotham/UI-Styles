define(['angularAMD', 'utilService', 'gridService', 'dateUtilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('genericTermsService', function ($filter, utilService, gridService, $http,
        constants, $window, dateUtilService, Notification, httpService, $q, $stateParams, overlay) {

        function genericTermsService(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                console.log("formServiceModel=", formServiceModel);
                
                var tobeSavedData = {};
                var IsActive = formServiceModel.isActive;

                var isActivePayload = null;
                
                if (IsActive === true) {
                    isActivePayload = "t";
                }
                else {
                    isActivePayload = "f";
                }
                tobeSavedData.corpEntityId = formServiceModel.corpEntityId;
                tobeSavedData.termsTitle = formServiceModel.termsTitle;
                tobeSavedData.contractTypeCode = formServiceModel.contractTypeCode;
                tobeSavedData.isActive = isActivePayload;
                tobeSavedData.genericTerms = formServiceModel.genericTerms;
                return tobeSavedData;
            };

            this.runValidations = function (formServiceModel, operationType, parentForm) {

                var defer = $q.defer();
                var isValid = false;
                var title = formServiceModel.termsTitle;
                var terms = formServiceModel.genericTerms;
                var msg = "";

                if (title === "" || terms === "") {
                    msg = "Title and Terms Fields are required.";
                    Notification.error({
                        message: msg,
                        title: 'REQUIRED FIELDS',
                        delay: 5000
                    });
                    overlay.hide();
                    defer.resolve(isValid);
                }
                else {
                    isValid = true;
                    defer.resolve(isValid);
                }
                console.log("isValid==", isValid);
                return defer.promise;
            };
        }
        return genericTermsService;
    });

    return angularAMD;
});