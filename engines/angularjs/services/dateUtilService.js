define(['angularAMD'], function (angularAMD) {
    'use strict';

    angularAMD.service('dateUtilService', function () {
        this.DATE_FORMAT = "MM/DD/YYYY";
        this.DB_DATE_FORMAT = "YYYY/MM/DD";// "MM/DD/YYYY";// "DD/MM/YYYY";  //"YYYY-MM-DD"; 
        this.DATE_TIME_FORMAT = "MM/DD/YYYY hh:mm a";
        this.VDI_DATE_FORMAT = "MMM D, YYYY";
        this.FINANCIAL_MONTH_END = "31/03";
        var supportedDateFormats = [this.DB_DATE_FORMAT, this.DATE_FORMAT, this.DATE_TIME_FORMAT, this.VDI_DATE_FORMAT];
        var self = this;
        this.getCurrentDate = function (cdate) {
            if (cdate === "" || cdate === undefined)
                return moment().format(self.DATE_FORMAT);
            else {
                var newDate = moment().add('days', 15);
                return newDate.format(self.DATE_FORMAT);
            }

        };

        this.getMoment = function (dateValue) {
            var momentObject;
            if (dateValue) {
                momentObject = moment(dateValue, self.DATE_FORMAT);

                if (!momentObject.isValid() && parseInt(dateValue) != NaN) {
                    var timestamp = dateValue;
                    momentObject = moment.unix(timestamp / 1000);
                }
            }

            return momentObject;
          
        };
        this.getCurrentFinancialYearEndDate = function () {

            var ls = localStorage || window["localStorage"];

            var yearEnd;
            if (ls || ls["financial_year"]) {
                var yearSplit = ls["financial_year"].split("-");
                if (yearSplit.length > 1) {
                    yearEnd = yearSplit[1];
                }
            }

            if (!yearEnd) {
                var currentYear = moment().year();
                var currentMonth = moment().month();
                var currentDay = moment().day();
                if (currentMonth <= 3 && currentDay <= 31) {
                    yearEnd = currentYear;
                }
                else {
                    yearEnd = currentYear + 1;
                }
            }

            financialYearEndDate = self.FINANCIAL_MONTH_END + "/" + yearEnd;

            return financialYearEndDate;
        };
        this.convertToUIDate = function (dateValue) {
            var momentObject = this.getMoment(dateValue);
            return momentObject ? momentObject.toDate() : null;
        }
        this.getMaxDate = function (d) {
            var c = moment().format(self.DATE_FORMAT);
            var a = moment(c, self.DATE_FORMAT).add(d, 'days');
            return self.convertToDateFormat(self.convertDateToMillSec(a));
        };
        this.addToCurrentDate = function (d) {
            var c = moment().format(self.DATE_FORMAT);
            return moment(c, self.DATE_FORMAT).add(d, 'days');
            //moment().format(self.DATE_FORMAT).add(d, 'days');

        };
        this.addDaysToCurrentDate = function (d) {
            var c = moment().format(self.DATE_FORMAT);
            c = moment(c, self.DATE_FORMAT).add(d, 'days');
            return self.convertToDateFormat(self.convertDateToMillSec(c));

            //moment().format(self.DATE_FORMAT).add(d, 'days');

        };

        this.getCurrentDateTime = function (dateFormat) {
            var dateTime;
            if (dateFormat) {
                dateTime = moment().format(dateFormat);
            }
            else {
                dateTime = moment().format(self.DATE_TIME_FORMAT);
            }

            return dateTime;
        };
        this.getCurrentDateInSeconds = function () {
            return moment().format('x');
        };

        this.convertToTimeStamp = function (date) {
            return moment(date, self.DATE_FORMAT).valueOf(); //moment().format(self.DATE_FORMAT);
        };

        this.convertionToTimeStamp = function (date) {
            return (moment(date, self.DATE_TIME_FORMAT).unix() * 1000);
        };
        this.convertStringToDateFormat = function (string) {
             var mydate = moment(string, "MM/DD/YYYY");  
           return moment(mydate).format(self.DATE_FORMAT);
        };
        this.convertStringToDateFormat = function (date, format) {
            var mydate = moment(date, format);
            return moment(mydate).format(format);
        };
        this.convertToDateFormat = function (timestamp) {
            return moment.unix(timestamp / 1000).format(self.DATE_FORMAT);
        };
        this.convertToDateTimeFormat = function (timestamp) {
            return moment.unix(timestamp / 1000).format(self.DATE_TIME_FORMAT);
        };
        this.convertToDBFormat = function (dateValue) {
            if (dateValue !== '' && dateValue !== undefined) {
                var tempTime;
                if (angular.isNumber(dateValue)) {
                    tempTime = dateValue;
                }
                else {
                    tempTime = self.convertToTimeStamp(dateValue);
                }
                return moment.unix(tempTime / 1000).format(self.DB_DATE_FORMAT);
            }
            return null;
        };
        this.convertFromDBFormat = function (dateValue) {
            var convertedDate=null;
            if (dateValue !== '' && dateValue !== undefined) {
                var tempTime;
                if (angular.isNumber(dateValue)) {
                    tempTime = dateValue;
                }
                else {
                 //   tempTime = self.convertionToTimeStamp(dateValue);
                 tempTime = moment(dateValue).format("x");
                }
                convertedDate= moment.unix(tempTime / 1000).format(self.DATE_FORMAT);
                if(convertedDate==="Invalid date"){
                    convertedDate= self.getIfUIFormatedDate(dateValue);
                }
            }
            if (convertedDate === "Invalid date") {
                convertedDate = dateValue;
            }
            return convertedDate;
        };
        this.convertDateToMillSec = function (sec) {
            return (moment(sec, self.DATE_FORMAT).unix() * 1000);
        };
        this.getIfFormatedDate = function (dataModelValue, forServiceModel) {
            var dateValue;
            if (forServiceModel) {
                dateValue= this.convertToDBFormat(dataModelValue);
            }
            else {
                dateValue= this.convertFromDBFormat(dataModelValue);
            }

            if (dateValue === "Invalid date") {
                dateValue = dataModelValue;
            }

            return dateValue;
        }
        this.getIfUIFormatedDate = function (dateValue) {
            var dateMoment;
            var isValidDate=false;
            for (var i = 0; i < supportedDateFormats.length; i++) {
                dateMoment = new moment(dateValue, supportedDateFormats[i], true);
                isValidDate = dateMoment.isValid();
                if (isValidDate) {
                    break;
                }
            }

            if (isValidDate) {
                return dateMoment.format(self.DATE_FORMAT);
            }
            return dateValue;
        };

        this.convertToUTC = function(dateValue){
            return moment(dateValue).utc().format(this.DB_DATE_FORMAT);
        }
        this.getTimeStampInMillis = function (){
            var mydate = new Date();
            return ("" + mydate.getFullYear() + "" + mydate.getMonth() + "" + mydate.getDay() + "" + mydate.getHours() + "" + mydate.getSeconds() + "" + mydate.getUTCMilliseconds());
        };
        this.secoundsToMillis = function (secounds){
            return secounds*1000;
        };
    });

    return angularAMD;
});