/**
 * Created by hari on 19/4/17.
 */
define(['angularAMD', 'utilService'], function (angularAMD) {
    'use strict';
    angularAMD.factory('partyLicensingFactory', function ($filter, utilService) {
        function partyLicensingFactory(form, menuDefinition) {
            this.form = form;
            this.menuDefinition = menuDefinition;
            this.setPartyType = function (sourceField, targetField, parentForm, parentSection,section, sectionDataModel, event) {
            var partyTypeValue=form.getFieldByModelKey("partyType").modelValue.value;
                if(partyTypeValue=="RIDING_BOY" || partyTypeValue=="JAMADAR" || partyTypeValue=="FARRIER"){
                   /* form.getFieldByModelKey("EmployedBy","partyDetails").show=true;*/
                    form.getSectionByModelKey("partyDetails").show=false;
                 }else if(partyTypeValue=="TRAINER"){

                   }else if(partyTypeValue=="JOCKEY"){

                   }else{

                }
            }
        };
        return partyLicensingFactory;
    });

    return angularAMD;
});
