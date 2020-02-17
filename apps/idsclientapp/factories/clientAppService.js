define(["angularAMD", "utilService", "gridService", "dateUtilService"], function (angularAMD) {
  "use strict";

  angularAMD.factory("clientAppService", function ($filter, utilService, overlay, gridService, $http, constants, $window, dateUtilService, Notification, httpService, $q, $stateParams) {
    function clientAppService(form, menuDefinition) {
      this.form = form;
      var self = this;
      this.menuDefinition = menuDefinition;

      this.downloadExcel = function (data, parentForm) {
        var url = "report/run/xlsx/1075/ids_client_report";
        var payload = {
          "applicationId": 1075,
          "reportCode": "ids_client_report",
          "reportType": "xlsx",
          "additionalModelData": {
            "reportContextIndex": "continues",
            "dataRowIndex": "continues"
          },
          "additionalServiceCriteria": {}
        }
        overlay.load();
        var reportCode = "Data";
        httpService.openFileByPost(url, payload, "excel", reportCode + ".xlsx").then(function (results) {
          console.log("file downloaded=", results);
          overlay.hide();
        });
      };

      this.sendEmail = function (data, parentForm) {
        var url = "email/send/directemail";
        var payload = {
          "emailIds": {
            "TO": [
              "kreddy@chrims.com"
            ],
            "CC": [],
            "BCC": []
          },
          "subject": "ids_client_report",
          "body": "Please find the attachment",
          "fromEmail": "noreply@chrims.com",
          "templateConfig": {
            "applicationId": 1075,
            "subReportsCriteriaList": [
              {
                "subReportType": "ATTACHMENT",
                "reportCriteria": {
                  "applicationId": 1075,
                  "reportCode": "ids_client_report",
                  "reportType": "xlsx",
                  "additionalModelData": {
                    "title": "Client Report",
                    "name": "Client Report",
                    "reportHeader": {},
                    "reportContextIndex": "continues",
                    "dataRowIndex": "continues"
                  },
                  "additionalServiceCriteria": {}
                }
              }
            ]
          }
        };
        overlay.load();
        httpService.openFileByPost(url, payload)
        swal({
          text: "Mail Sent Sucessfully",
          icon: "info",
          button: "Okay"
        });
        overlay.hide();

      };

    }
    return clientAppService;
  });

  return angularAMD;
});
