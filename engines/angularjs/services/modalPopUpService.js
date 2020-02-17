define(['angularAMD'], function (angularAMD) {
    'use strict';

    angularAMD.service('modalPopUpService', [ '$rootScope', '$http', '$q', '$state', '$filter','$uibModal',
        function ($rootScope, $http, $q, $state, $filter,$uibModal) {
            var globalStore = localStorage;
            var sessionStore = sessionStorage;

            var serializer = angular.toJson;
            var deserializer = angular.fromJson;
            var self = this;
            
            this.openDialog = function (modalForm, modelData,$scope,size) {
                var pSelf = this;
                var defer = $q.defer(); 
                console.log("controller.......", modalForm,modelData);
                var mSize = size || 'lg';
                var uibModalInstance = $uibModal.open(
                    {
                        size: mSize,//'lg',
                        templateUrl: "engines/angularjs/components/jsonbasedpages/views/modalContent.html",
                       // scope: $scope,
                        resolve: {
                            payload: function () {
                                return {
                                    title: modalForm["title"],
                                    hideSaveButton:modalForm["hideSaveButton"],
                                    modalform: modalForm,
                                    modalData: modelData,
                                    parentForm: pSelf.form
                                };
                            }
                        },
                        controller:
                            function ($scope, payload, $uibModalInstance) {

                                $scope.datas = payload;
                                $scope.hideSaveButton = payload.hideSaveButton
                                $scope.formDataModel = payload.modalData;
                                $scope.formDataModel1 = payload.modalData;
                                $scope.parentForm = {};
                                console.log("$scope.hideSaveButton=",$scope.hideSaveButton);
                                $scope.ok = function () {
                                    payload.modalform.functionalService[payload.modalform["handlerName"]](payload.modalform, $scope.datas);
                                    $uibModalInstance.close();
                                };

                                $scope.cancel = function () {
                                    $uibModalInstance.dismiss('cancel');
                                };


                            }
                    }
                );
               uibModalInstance.rendered.then(function (res) {
                   
                    self.modalDataBinding(modalForm.sections,modelData).then(function() {
                        defer.resolve({
                            popupInstance:uibModalInstance,
                            modalForm:modalForm
                        });
                    });                        
                });
                return defer.promise;
            };

            this.modalDataBinding = function(sections,modalData){
                var defer = $q.defer();    
             var mfield = {};
             //sections
             angular.forEach(sections, function (section, index) {
                 var rows = section.rowDivisions;
                 //rows
                 angular.forEach(rows, function (row, index) {
                     var columns = row.columns;
                     //columns
                     angular.forEach(columns, function (column, index) {
                         var fields = column.fields;
                         //fields
                         var fModel = {};
                         angular.forEach(fields, function (field, index) {
                             console.log("1. field=",field);
                             if(field.fieldType==="grid"){
                                 var gridApi = field.gridOptions.api;
                                  gridApi.setRowData(modalData[field.modelKey]);
                             }
                             else {
                                 console.log("1.field type=",field.fieldType);
                                 console.log("1.field type=",modalData[field.modelKey]);
                                 field.setModel(modalData[field.modelKey]);
                             }

                         });
                     });
                     //no Columns
                      var fields = row.fields;
                         //fields
                         var fModel = {};
                         angular.forEach(fields, function (field, index) {
                             console.log("2. field=",field);
                             if(field.fieldType === "grid"){
                                 var gridApi = field.gridOptions.api;
                                  gridApi.setRowData(modalData[field.modelKey]);
                             }
                             else {
                                 console.log("1.field type=",field.fieldType);
                                 console.log("1.field type=",modalData[field.modelKey]);
                                 // field.setModel(modalData[field.modelKey]);
                             }
                              
                         });
                 });
             });
             defer.resolve(true);
            // return mfield;
          return  defer.promise;
        
         };
        }]);

    return angularAMD;
});