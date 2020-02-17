define(['angularAMD', 'utilService'], function (angularAMD) {
    'use strict';

    angularAMD.factory('budgetReallocationFactory', function ($filter, utilService) {
        function budgetReallocationFactory(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;

            // This handler is to reset the fields on the page, provide default options to the fields.
            this.resetFormDataModel = function () {
                var self = this;
                console.log("I am through budgetReallocationFactory.resetFormDataModel")
                self.form.resetFormDataModel();

                var allocationTypeField = self.form.getFieldByModelKey("allocationType");
               // allocationTypeField.title = utilService.getValueFromModelByKey("LS.financial_year-LS.departmentCode", localStorage, null, self.form);
                allocationTypeField.modelValue = "global";
            };
            // To take controll of entire data population on the page use this handler, from making service call and get service model and populate.
            this.populateData = function () {
                var self = this;
                console.log("I am through budgetReallocationFactory.populateData")
              //  self.form.populateData();
            };
            //This handler is just to massage the data service model and set to view.
            this.populateViewServiceDataModel = function (modelToBeSet) {
                var self = this;
                console.log("I am through budgetReallocationFactory.populateViewServiceDataModel", modelToBeSet)
                self.form.populateViewServiceDataModel(modelToBeSet);
            };
            //This handler is show page in edit mode.
            this.showInEditMode = function () {
                var self = this;
                console.log("I am through budgetReallocationFactory.showFormDetails")
                self.form.showInEditMode();
            };

            //This handler is run validations before save or update.
            this.runValidations = function (formServiceModel, operationType) {
                var self = this;
                console.log("I am through budgetReallocationFactory.runValidations", df_form)
                self.form.runValidations(formServiceModel, operationType);
            };
            //This handler is save data back to service.
            this.saveBackToService = function (df_form) {
                var self = this;
                console.log("I am through budgetReallocationFactory.saveBackToService", df_form)
                self.form.saveBackToService(df_form);
            };
            //This handler is update data back to service.
            this.updateBackToService = function (df_form) {
                var self = this;
                console.log("I am through budgetReallocationFactory.updateBackToService", df_form)
                self.form.updateBackToService(df_form);
            };
            //This handler is to build data model that is being sent back to service.
            this.buildDataTobeSubmitted = function (formServiceModel, operationType) {
                var self = this;
                console.log("I am through budgetReallocationFactory.buildDataTobeSubmitted", formServiceModel)
                self.form.buildDataTobeSubmitted(formServiceModel, operationType);
            };

            this.setWithInCostCenterRules = function (sourceField, targetField, parentForm, parentSection, sectionDataModel, event) {
                console.log("I am reached setWithInCostCenterRules", sourceField, targetField, parentForm, parentSection, sectionDataModel, event);
                var costCenterToModelValue = sectionDataModel["costCenterTo"];
                if (!costCenterToModelValue) {
                    parentSection.getFieldByModelKey("budgetTo").disabled = true;
                }
                else {
                    parentSection.getFieldByModelKey("budgetTo").disabled = false;
                }

            }
        };

        return budgetReallocationFactory;
    });

    return angularAMD;
});