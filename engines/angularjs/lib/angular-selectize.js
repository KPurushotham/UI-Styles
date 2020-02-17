//!function(a){"use strict";a.module("ng-selectize",["ng"]).directive("selectize",["$timeout",function(b){return{restrict:"A",require:"ngModel",scope:{selectize:"&",options:"&",ngDisabled:"="},link:function(c,d,e,f){function g(a){a=a&&""!==a?a:void 0,o||(c.$parent.$apply(function(){f.$setViewValue(a)}),"single"===p.mode&&q.blur())}function h(b){return a.isArray(b)?b:b?String(b).split(p.delimiter):[]}function i(a,b){for(var c=0;c<a.length;c++)if(a[c]===b)return c;return-1}function j(a,b){return-1!==i(a,b)}function k(a,b){a.map(function(a){j(b,a)||j(r,a)||r.push(a)})}function l(a,b){var c,d;for(c=0;c<a.length;c++)d=i(r,a[c][q.settings.valueField]),-1!==d&&(b.push(a[c][q.settings.valueField]),r.splice(d,1))}function m(a){b(function(){var b=h(a);o||b===h(q.getValue())||(o=!0,q.setValue(b),k(b,h(q.getValue())),o=!1)})}function n(a){var b=h(f.$viewValue);"multi"===p.mode&&a&&l(a,b),a&&(Array.isArray(a)&&0===a.length&&q.clearOptions(),q.addOption(a),q.refreshOptions(!1),m(b))}var o,p,q,r=[],s=c.options(),t=c.selectize();p=a.extend({delimiter:",",persist:!0,mode:"SELECT"===d[0].tagName?d[0].hasAttribute("multiple")?"multi":"single":"multi"},t||{}),q=d.selectize(p)[0].selectize,q.on("change",function(){g(q.getValue())});var u=function(a){return a?void q.disable():void q.enable()};c.$watch("ngDisabled",u),c.$parent.$watch(e.ngModel,m),e.options&&c.$parent.$watch(e.options,n,!0),c.$parent.$watch(s,n(s),!0),c.$on("$destroy",function(){q.destroy()})}}}])}(this.angular);
(function(angular) {
  'use strict';

  angular.module('ng-selectize', ['ng']).directive('selectize', ['$timeout', function(timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        selectize: '&',
        options: '&',
        ngDisabled: '='
      },
      link: function(scope, element, attrs, ngModel) {
        var changing, options, selectize, invalidValues = [];
        var data = scope.options();
        var settings = scope.selectize();

        // Default options
        options = angular.extend({
          delimiter: ',',
          persist: true,
          mode: (element[0].tagName === 'SELECT') ? ((element[0].hasAttribute('multiple')) ? 'multi' : 'single') : 'multi' // if element isn't select or has attr 'multiple' set mode 'multi'
        }, settings || {});

        // Activate the widget
        selectize = element.selectize(options)[0].selectize;

        selectize.on('change', function() {
          setModelValue(selectize.getValue());
        });

        function setModelValue(value) {
          value = value && value !== '' ? value : undefined;
          if (changing) {
            return;
          }
          scope.$parent.$apply(function() {
            ngModel.$setViewValue(value);
          });

          if (options.mode === 'single') {
            selectize.blur();
          }
        }

        // Normalize the model value to an array
        function parseValues(value) {
          if (angular.isArray(value)) {
            return value;
          }
          if (!value) {
            return [];
          }
          return String(value).split(options.delimiter);
        }

        // Non-strict indexOf
        function indexOfLike(arr, val) {
          for (var i=0; i < arr.length; i++) {
            if (arr[i] === val) {
              return i;
            }
          }
          return -1;
        }

        // Boolean wrapper to indexOfLike
        function contains(arr, val) {
          return indexOfLike(arr, val) !== -1;
        }

        // Store invalid items for late-loading options
        function storeInvalidValues(values, resultValues) {
          values.map(function(val) {
            if (!(contains(resultValues, val) || contains(invalidValues, val))) {
              invalidValues.push(val);
            }
          });
        }

        function restoreInvalidValues(newOptions, values) {
          var i, index;
          for (i=0; i < newOptions.length; i++) {
            index = indexOfLike(invalidValues, newOptions[i][selectize.settings.valueField]);
            if (index !== -1) {
              values.push(newOptions[i][selectize.settings.valueField]);
              invalidValues.splice(index, 1);
            }
          }
        }

        function setSelectizeValue(value) {
          timeout(function() {
            var values = parseValues(value);

            if (changing || values === parseValues(selectize.getValue())) {
              return;
            }

            changing = true;

            selectize.setValue(values);
            storeInvalidValues(values, parseValues(selectize.getValue()));

            changing = false;
          });
        }

        function setSelectizeOptions(newOptions) {
          var values = parseValues(ngModel.$viewValue);

          if (options.mode === 'multi' && newOptions) {
            restoreInvalidValues(newOptions, values);
          }

          if(newOptions) {
          	
            if(Array.isArray(newOptions) && newOptions.length === 0) {
               timeout(function() {
                  selectize.clearOptions();
               },10);
            }
           
            selectize.addOption(newOptions);
            selectize.refreshOptions(false);
            setSelectizeValue(values);
            //
          }
        }

        var toggleDisabled = function(disabled) {
          if(disabled) {
            selectize.disable();
            return;
          }

          selectize.enable();
        };

        scope.$watch('ngDisabled', toggleDisabled);
        scope.$parent.$watch(attrs.ngModel, setSelectizeValue);

        if (attrs.options) {
          scope.$parent.$watch(attrs.options, setSelectizeOptions, true);
        }

        scope.$parent.$watch(data, setSelectizeOptions(data), true);

        scope.$on('$destroy', function() {
          selectize.destroy();
        });
      }
    };
  }]);

})(this.angular);

/*!
 * bootstrap-select v1.5.4
 * http://silviomoreto.github.io/bootstrap-select/
 *
 * Copyright 2013 bootstrap-select
 * Licensed under the MIT license
 */
;!function(b){b.expr[":"].icontains=function(e,c,d){return b(e).text().toUpperCase().indexOf(d[3].toUpperCase())>=0};var a=function(d,c,f){if(f){f.stopPropagation();f.preventDefault()}this.$element=b(d);this.$newElement=null;this.$button=null;this.$menu=null;this.$lis=null;this.options=b.extend({},b.fn.selectpicker.defaults,this.$element.data(),typeof c=="object"&&c);if(this.options.title===null){this.options.title=this.$element.attr("title")}this.val=a.prototype.val;this.render=a.prototype.render;this.refresh=a.prototype.refresh;this.setStyle=a.prototype.setStyle;this.selectAll=a.prototype.selectAll;this.deselectAll=a.prototype.deselectAll;this.init()};a.prototype={constructor:a,init:function(){var c=this,d=this.$element.attr("id");this.$element.hide();this.multiple=this.$element.prop("multiple");this.autofocus=this.$element.prop("autofocus");this.$newElement=this.createView();this.$element.after(this.$newElement);this.$menu=this.$newElement.find("> .dropdown-menu");this.$button=this.$newElement.find("> button");this.$searchbox=this.$newElement.find("input");if(d!==undefined){this.$button.attr("data-id",d);b('label[for="'+d+'"]').click(function(f){f.preventDefault();c.$button.focus()})}this.checkDisabled();this.clickListener();if(this.options.liveSearch){this.liveSearchListener()}this.render();this.liHeight();this.setStyle();this.setWidth();if(this.options.container){this.selectPosition()}this.$menu.data("this",this);this.$newElement.data("this",this)},createDropdown:function(){var c=this.multiple?" show-tick":"";var d=this.$element.parent().hasClass("input-group")?" input-group-btn":"";var i=this.autofocus?" autofocus":"";var h=this.options.header?'<div class="popover-title"><button type="button" class="close" aria-hidden="true">&times;</button>'+this.options.header+"</div>":"";var g=this.options.liveSearch?'<div class="bootstrap-select-searchbox"><input type="text" class="input-block-level form-control" /></div>':"";var f=this.options.actionsBox?'<div class="bs-actionsbox"><div class="btn-group btn-block"><button class="actions-btn bs-select-all btn btn-sm btn-default">Select All</button><button class="actions-btn bs-deselect-all btn btn-sm btn-default">Deselect All</button></div></div>':"";var e='<div class="btn-group bootstrap-select'+c+d+'"><button type="button" class="btn dropdown-toggle selectpicker" data-toggle="dropdown"'+i+'><span class="filter-option pull-left"></span>&nbsp;<span class="caret"></span></button><div class="dropdown-menu open">'+h+g+f+'<ul class="dropdown-menu inner selectpicker" role="menu"></ul></div></div>';return b(e)},createView:function(){var c=this.createDropdown();var d=this.createLi();c.find("ul").append(d);return c},reloadLi:function(){this.destroyLi();var c=this.createLi();this.$menu.find("ul").append(c)},destroyLi:function(){this.$menu.find("li").remove()},createLi:function(){var d=this,e=[],c="";this.$element.find("option").each(function(){var i=b(this);var g=i.attr("class")||"";var h=i.attr("style")||"";var m=i.data("content")?i.data("content"):i.html();var k=i.data("subtext")!==undefined?'<small class="muted text-muted">'+i.data("subtext")+"</small>":"";var j=i.data("icon")!==undefined?'<i class="'+d.options.iconBase+" "+i.data("icon")+'"></i> ':"";if(j!==""&&(i.is(":disabled")||i.parent().is(":disabled"))){j="<span>"+j+"</span>"}if(!i.data("content")){m=j+'<span class="text">'+m+k+"</span>"}if(d.options.hideDisabled&&(i.is(":disabled")||i.parent().is(":disabled"))){e.push('<a style="min-height: 0; padding: 0"></a>')}else{if(i.parent().is("optgroup")&&i.data("divider")!==true){if(i.index()===0){var l=i.parent().attr("label");var n=i.parent().data("subtext")!==undefined?'<small class="muted text-muted">'+i.parent().data("subtext")+"</small>":"";var f=i.parent().data("icon")?'<i class="'+i.parent().data("icon")+'"></i> ':"";l=f+'<span class="text">'+l+n+"</span>";if(i[0].index!==0){e.push('<div class="div-contain"><div class="divider"></div></div><dt>'+l+"</dt>"+d.createA(m,"opt "+g,h))}else{e.push("<dt>"+l+"</dt>"+d.createA(m,"opt "+g,h))}}else{e.push(d.createA(m,"opt "+g,h))}}else{if(i.data("divider")===true){e.push('<div class="div-contain"><div class="divider"></div></div>')}else{if(b(this).data("hidden")===true){e.push("<a></a>")}else{e.push(d.createA(m,g,h))}}}}});b.each(e,function(g,h){var f=h==="<a></a>"?'class="hide is-hidden"':"";c+='<li rel="'+g+'"'+f+">"+h+"</li>"});if(!this.multiple&&this.$element.find("option:selected").length===0&&!this.options.title){this.$element.find("option").eq(0).prop("selected",true).attr("selected","selected")}return b(c)},createA:function(e,c,d){return'<a tabindex="0" class="'+c+'" style="'+d+'">'+e+'<i class="'+this.options.iconBase+" "+this.options.tickIcon+' icon-ok check-mark"></i></a>'},render:function(e){var d=this;if(e!==false){this.$element.find("option").each(function(i){d.setDisabled(i,b(this).is(":disabled")||b(this).parent().is(":disabled"));d.setSelected(i,b(this).is(":selected"))})}this.tabIndex();var h=this.$element.find("option:selected").map(function(){var k=b(this);var j=k.data("icon")&&d.options.showIcon?'<i class="'+d.options.iconBase+" "+k.data("icon")+'"></i> ':"";var i;if(d.options.showSubtext&&k.attr("data-subtext")&&!d.multiple){i=' <small class="muted text-muted">'+k.data("subtext")+"</small>"}else{i=""}if(k.data("content")&&d.options.showContent){return k.data("content")}else{if(k.attr("title")!==undefined){return k.attr("title")}else{return j+k.html()+i}}}).toArray();var g=!this.multiple?h[0]:h.join(this.options.multipleSeparator);if(this.multiple&&this.options.selectedTextFormat.indexOf("count")>-1){var c=this.options.selectedTextFormat.split(">");var f=this.options.hideDisabled?":not([disabled])":"";if((c.length>1&&h.length>c[1])||(c.length==1&&h.length>=2)){g=this.options.countSelectedText.replace("{0}",h.length).replace("{1}",this.$element.find('option:not([data-divider="true"]):not([data-hidden="true"])'+f).length)}}this.options.title=this.$element.attr("title");if(!g){g=this.options.title!==undefined?this.options.title:this.options.noneSelectedText}this.$button.attr("title",b.trim(g));this.$newElement.find(".filter-option").html(g)},setStyle:function(e,d){if(this.$element.attr("class")){this.$newElement.addClass(this.$element.attr("class").replace(/selectpicker|mobile-device/gi,""))}var c=e?e:this.options.style;if(d=="add"){this.$button.addClass(c)}else{if(d=="remove"){this.$button.removeClass(c)}else{this.$button.removeClass(this.options.style);this.$button.addClass(c)}}},liHeight:function(){if(this.options.size===false){return}var f=this.$menu.parent().clone().find("> .dropdown-toggle").prop("autofocus",false).end().appendTo("body"),g=f.addClass("open").find("> .dropdown-menu"),e=g.find("li > a").outerHeight(),d=this.options.header?g.find(".popover-title").outerHeight():0,h=this.options.liveSearch?g.find(".bootstrap-select-searchbox").outerHeight():0,c=this.options.actionsBox?g.find(".bs-actionsbox").outerHeight():0;f.remove();this.$newElement.data("liHeight",e).data("headerHeight",d).data("searchHeight",h).data("actionsHeight",c)},setSize:function(){var i=this,d=this.$menu,j=d.find(".inner"),u=this.$newElement.outerHeight(),f=this.$newElement.data("liHeight"),s=this.$newElement.data("headerHeight"),m=this.$newElement.data("searchHeight"),h=this.$newElement.data("actionsHeight"),l=d.find("li .divider").outerHeight(true),r=parseInt(d.css("padding-top"))+parseInt(d.css("padding-bottom"))+parseInt(d.css("border-top-width"))+parseInt(d.css("border-bottom-width")),p=this.options.hideDisabled?":not(.disabled)":"",o=b(window),g=r+parseInt(d.css("margin-top"))+parseInt(d.css("margin-bottom"))+2,q,v,t,k=function(){v=i.$newElement.offset().top-o.scrollTop();t=o.height()-v-u};k();if(this.options.header){d.css("padding-top",0)}if(this.options.size=="auto"){var e=function(){var x,w=i.$lis.not(".hide");k();q=t-g;if(i.options.dropupAuto){i.$newElement.toggleClass("dropup",(v>t)&&((q-g)<d.height()))}if(i.$newElement.hasClass("dropup")){q=v-g}if((w.length+w.find("dt").length)>3){x=f*3+g-2}else{x=0}d.css({"max-height":q+"px",overflow:"hidden","min-height":x+s+m+h+"px"});j.css({"max-height":q-s-m-h-r+"px","overflow-y":"auto","min-height":Math.max(x-r,0)+"px"})};e();this.$searchbox.off("input.getSize propertychange.getSize").on("input.getSize propertychange.getSize",e);b(window).off("resize.getSize").on("resize.getSize",e);b(window).off("scroll.getSize").on("scroll.getSize",e)}else{if(this.options.size&&this.options.size!="auto"&&d.find("li"+p).length>this.options.size){var n=d.find("li"+p+" > *").filter(":not(.div-contain)").slice(0,this.options.size).last().parent().index();var c=d.find("li").slice(0,n+1).find(".div-contain").length;q=f*this.options.size+c*l+r;if(i.options.dropupAuto){this.$newElement.toggleClass("dropup",(v>t)&&(q<d.height()))}d.css({"max-height":q+s+m+h+"px",overflow:"hidden"});j.css({"max-height":q-r+"px","overflow-y":"auto"})}}},setWidth:function(){if(this.options.width=="auto"){this.$menu.css("min-width","0");var e=this.$newElement.clone().appendTo("body");var c=e.find("> .dropdown-menu").css("width");var d=e.css("width","auto").find("> button").css("width");e.remove();this.$newElement.css("width",Math.max(parseInt(c),parseInt(d))+"px")}else{if(this.options.width=="fit"){this.$menu.css("min-width","");this.$newElement.css("width","").addClass("fit-width")}else{if(this.options.width){this.$menu.css("min-width","");this.$newElement.css("width",this.options.width)}else{this.$menu.css("min-width","");this.$newElement.css("width","")}}}if(this.$newElement.hasClass("fit-width")&&this.options.width!=="fit"){this.$newElement.removeClass("fit-width")}},selectPosition:function(){var e=this,d="<div />",f=b(d),h,g,c=function(i){f.addClass(i.attr("class").replace(/form-control/gi,"")).toggleClass("dropup",i.hasClass("dropup"));h=i.offset();g=i.hasClass("dropup")?0:i[0].offsetHeight;f.css({top:h.top+g,left:h.left,width:i[0].offsetWidth,position:"absolute"})};this.$newElement.on("click",function(){if(e.isDisabled()){return}c(b(this));f.appendTo(e.options.container);f.toggleClass("open",!b(this).hasClass("open"));f.append(e.$menu)});b(window).resize(function(){c(e.$newElement)});b(window).on("scroll",function(){c(e.$newElement)});b("html").on("click",function(i){if(b(i.target).closest(e.$newElement).length<1){f.removeClass("open")}})},mobile:function(){this.$element.addClass("mobile-device").appendTo(this.$newElement);if(this.options.container){this.$menu.hide()}},refresh:function(){this.$lis=null;this.reloadLi();this.render();this.setWidth();this.setStyle();this.checkDisabled();this.liHeight()},update:function(){this.reloadLi();this.setWidth();this.setStyle();this.checkDisabled();this.liHeight()},setSelected:function(c,d){if(this.$lis==null){this.$lis=this.$menu.find("li")}b(this.$lis[c]).toggleClass("selected",d)},setDisabled:function(c,d){if(this.$lis==null){this.$lis=this.$menu.find("li")}if(d){b(this.$lis[c]).addClass("disabled").find("a").attr("href","#").attr("tabindex",-1)}else{b(this.$lis[c]).removeClass("disabled").find("a").removeAttr("href").attr("tabindex",0)}},isDisabled:function(){return this.$element.is(":disabled")},checkDisabled:function(){var c=this;if(this.isDisabled()){this.$button.addClass("disabled").attr("tabindex",-1)}else{if(this.$button.hasClass("disabled")){this.$button.removeClass("disabled")}if(this.$button.attr("tabindex")==-1){if(!this.$element.data("tabindex")){this.$button.removeAttr("tabindex")}}}this.$button.click(function(){return !c.isDisabled()})},tabIndex:function(){if(this.$element.is("[tabindex]")){this.$element.data("tabindex",this.$element.attr("tabindex"));this.$button.attr("tabindex",this.$element.data("tabindex"))}},clickListener:function(){var c=this;b("body").on("touchstart.dropdown",".dropdown-menu",function(d){d.stopPropagation()});this.$newElement.on("click",function(){c.setSize();if(!c.options.liveSearch&&!c.multiple){setTimeout(function(){c.$menu.find(".selected a").focus()},10)}});this.$menu.on("click","li a",function(n){var t=b(this).parent().index(),m=c.$element.val(),i=c.$element.prop("selectedIndex");if(c.multiple){n.stopPropagation()}n.preventDefault();if(!c.isDisabled()&&!b(this).parent().hasClass("disabled")){var l=c.$element.find("option"),d=l.eq(t),f=d.prop("selected"),r=d.parent("optgroup"),p=c.options.maxOptions,h=r.data("maxOptions")||false;if(!c.multiple){l.prop("selected",false);d.prop("selected",true);c.$menu.find(".selected").removeClass("selected");c.setSelected(t,true)}else{d.prop("selected",!f);c.setSelected(t,!f);if((p!==false)||(h!==false)){var o=p<l.filter(":selected").length,j=h<r.find("option:selected").length,s=c.options.maxOptionsText,g=s[0].replace("{n}",p),q=s[1].replace("{n}",h),k=b('<div class="notify"></div>');if((p&&o)||(h&&j)){if(s[2]){g=g.replace("{var}",s[2][p>1?0:1]);q=q.replace("{var}",s[2][h>1?0:1])}d.prop("selected",false);c.$menu.append(k);if(p&&o){k.append(b("<div>"+g+"</div>"));c.$element.trigger("maxReached.bs.select")}if(h&&j){k.append(b("<div>"+q+"</div>"));c.$element.trigger("maxReachedGrp.bs.select")}setTimeout(function(){c.setSelected(t,false)},10);k.delay(750).fadeOut(300,function(){b(this).remove()})}}}if(!c.multiple){c.$button.focus()}else{if(c.options.liveSearch){c.$searchbox.focus()}}if((m!=c.$element.val()&&c.multiple)||(i!=c.$element.prop("selectedIndex")&&!c.multiple)){c.$element.change()}}});this.$menu.on("click","li.disabled a, li dt, li .div-contain, .popover-title, .popover-title :not(.close)",function(d){if(d.target==this){d.preventDefault();d.stopPropagation();if(!c.options.liveSearch){c.$button.focus()}else{c.$searchbox.focus()}}});this.$menu.on("click",".popover-title .close",function(){c.$button.focus()});this.$searchbox.on("click",function(d){d.stopPropagation()});this.$menu.on("click",".actions-btn",function(d){if(c.options.liveSearch){c.$searchbox.focus()}else{c.$button.focus()}d.preventDefault();d.stopPropagation();if(b(this).is(".bs-select-all")){c.selectAll()}else{c.deselectAll()}c.$element.change()});this.$element.change(function(){c.render(false)})},liveSearchListener:function(){var d=this,c=b('<li class="no-results"></li>');this.$newElement.on("click.dropdown.data-api",function(){d.$menu.find(".active").removeClass("active");if(!!d.$searchbox.val()){d.$searchbox.val("");d.$lis.not(".is-hidden").removeClass("hide");if(!!c.parent().length){c.remove()}}if(!d.multiple){d.$menu.find(".selected").addClass("active")}setTimeout(function(){d.$searchbox.focus()},10)});this.$searchbox.on("input propertychange",function(){if(d.$searchbox.val()){d.$lis.not(".is-hidden").removeClass("hide").find("a").not(":icontains("+d.$searchbox.val()+")").parent().addClass("hide");if(!d.$menu.find("li").filter(":visible:not(.no-results)").length){if(!!c.parent().length){c.remove()}c.html(d.options.noneResultsText+' "'+d.$searchbox.val()+'"').show();d.$menu.find("li").last().after(c)}else{if(!!c.parent().length){c.remove()}}}else{d.$lis.not(".is-hidden").removeClass("hide");if(!!c.parent().length){c.remove()}}d.$menu.find("li.active").removeClass("active");d.$menu.find("li").filter(":visible:not(.divider)").eq(0).addClass("active").find("a").focus();b(this).focus()});this.$menu.on("mouseenter","a",function(f){d.$menu.find(".active").removeClass("active");b(f.currentTarget).parent().not(".disabled").addClass("active")});this.$menu.on("mouseleave","a",function(){d.$menu.find(".active").removeClass("active")})},val:function(c){if(c!==undefined){this.$element.val(c);this.$element.change();return this.$element}else{return this.$element.val()}},selectAll:function(){if(this.$lis==null){this.$lis=this.$menu.find("li")}this.$element.find("option:enabled").prop("selected",true);b(this.$lis).filter(":not(.disabled)").addClass("selected");this.render(false)},deselectAll:function(){if(this.$lis==null){this.$lis=this.$menu.find("li")}this.$element.find("option:enabled").prop("selected",false);b(this.$lis).filter(":not(.disabled)").removeClass("selected");this.render(false)},keydown:function(p){var q,o,i,n,k,j,r,f,h,m,d,s,g={32:" ",48:"0",49:"1",50:"2",51:"3",52:"4",53:"5",54:"6",55:"7",56:"8",57:"9",59:";",65:"a",66:"b",67:"c",68:"d",69:"e",70:"f",71:"g",72:"h",73:"i",74:"j",75:"k",76:"l",77:"m",78:"n",79:"o",80:"p",81:"q",82:"r",83:"s",84:"t",85:"u",86:"v",87:"w",88:"x",89:"y",90:"z",96:"0",97:"1",98:"2",99:"3",100:"4",101:"5",102:"6",103:"7",104:"8",105:"9"};q=b(this);i=q.parent();if(q.is("input")){i=q.parent().parent()}m=i.data("this");if(m.options.liveSearch){i=q.parent().parent()}if(m.options.container){i=m.$menu}o=b("[role=menu] li:not(.divider) a",i);s=m.$menu.parent().hasClass("open");if(!s&&/([0-9]|[A-z])/.test(String.fromCharCode(p.keyCode))){if(!m.options.container){m.setSize();m.$menu.parent().addClass("open");s=m.$menu.parent().hasClass("open")}else{m.$newElement.trigger("click")}m.$searchbox.focus()}if(m.options.liveSearch){if(/(^9$|27)/.test(p.keyCode)&&s&&m.$menu.find(".active").length===0){p.preventDefault();m.$menu.parent().removeClass("open");m.$button.focus()}o=b("[role=menu] li:not(.divider):visible",i);if(!q.val()&&!/(38|40)/.test(p.keyCode)){if(o.filter(".active").length===0){o=m.$newElement.find("li").filter(":icontains("+g[p.keyCode]+")")}}}if(!o.length){return}if(/(38|40)/.test(p.keyCode)){n=o.index(o.filter(":focus"));j=o.parent(":not(.disabled):visible").first().index();r=o.parent(":not(.disabled):visible").last().index();k=o.eq(n).parent().nextAll(":not(.disabled):visible").eq(0).index();f=o.eq(n).parent().prevAll(":not(.disabled):visible").eq(0).index();h=o.eq(k).parent().prevAll(":not(.disabled):visible").eq(0).index();if(m.options.liveSearch){o.each(function(e){if(b(this).is(":not(.disabled)")){b(this).data("index",e)}});n=o.index(o.filter(".active"));j=o.filter(":not(.disabled):visible").first().data("index");r=o.filter(":not(.disabled):visible").last().data("index");k=o.eq(n).nextAll(":not(.disabled):visible").eq(0).data("index");f=o.eq(n).prevAll(":not(.disabled):visible").eq(0).data("index");h=o.eq(k).prevAll(":not(.disabled):visible").eq(0).data("index")}d=q.data("prevIndex");if(p.keyCode==38){if(m.options.liveSearch){n-=1}if(n!=h&&n>f){n=f}if(n<j){n=j}if(n==d){n=r}}if(p.keyCode==40){if(m.options.liveSearch){n+=1}if(n==-1){n=0}if(n!=h&&n<k){n=k}if(n>r){n=r}if(n==d){n=j}}q.data("prevIndex",n);if(!m.options.liveSearch){o.eq(n).focus()}else{p.preventDefault();if(!q.is(".dropdown-toggle")){o.removeClass("active");o.eq(n).addClass("active").find("a").focus();q.focus()}}}else{if(!q.is("input")){var c=[],l,t;o.each(function(){if(b(this).parent().is(":not(.disabled)")){if(b.trim(b(this).text().toLowerCase()).substring(0,1)==g[p.keyCode]){c.push(b(this).parent().index())}}});l=b(document).data("keycount");l++;b(document).data("keycount",l);t=b.trim(b(":focus").text().toLowerCase()).substring(0,1);if(t!=g[p.keyCode]){l=1;b(document).data("keycount",l)}else{if(l>=c.length){b(document).data("keycount",0);if(l>c.length){l=1}}}o.eq(c[l-1]).focus()}}if(/(13|32|^9$)/.test(p.keyCode)&&s){if(!/(32)/.test(p.keyCode)){p.preventDefault()}if(!m.options.liveSearch){b(":focus").click()}else{if(!/(32)/.test(p.keyCode)){m.$menu.find(".active a").click();q.focus()}}b(document).data("keycount",0)}if((/(^9$|27)/.test(p.keyCode)&&s&&(m.multiple||m.options.liveSearch))||(/(27)/.test(p.keyCode)&&!s)){m.$menu.parent().removeClass("open");m.$button.focus()}},hide:function(){this.$newElement.hide()},show:function(){this.$newElement.show()},destroy:function(){this.$newElement.remove();this.$element.remove()}};b.fn.selectpicker=function(e,f){var c=arguments;var g;var d=this.each(function(){if(b(this).is("select")){var m=b(this),l=m.data("selectpicker"),h=typeof e=="object"&&e;if(!l){m.data("selectpicker",(l=new a(this,h,f)))}else{if(h){for(var j in h){l.options[j]=h[j]}}}if(typeof e=="string"){var k=e;if(l[k] instanceof Function){[].shift.apply(c);g=l[k].apply(l,c)}else{g=l.options[k]}}}});if(g!==undefined){return g}else{return d}};b.fn.selectpicker.defaults={style:"btn-default",size:"auto",title:null,selectedTextFormat:"values",noneSelectedText:"Nothing selected",noneResultsText:"No results match",countSelectedText:"{0} of {1} selected",maxOptionsText:["Limit reached ({n} {var} max)","Group limit reached ({n} {var} max)",["items","item"]],width:false,container:false,hideDisabled:false,showSubtext:false,showIcon:true,showContent:true,dropupAuto:true,header:false,liveSearch:false,actionsBox:false,multipleSeparator:", ",iconBase:"glyphicon",tickIcon:"glyphicon-ok",maxOptions:false};b(document).data("keycount",0).on("keydown",".bootstrap-select [data-toggle=dropdown], .bootstrap-select [role=menu], .bootstrap-select-searchbox input",a.prototype.keydown).on("focusin.modal",".bootstrap-select [data-toggle=dropdown], .bootstrap-select [role=menu], .bootstrap-select-searchbox input",function(c){c.stopPropagation()})}(window.jQuery);

/**
 * @license nya-bootstrap-select v1.2.7.1
 * Copyright 2014 nyasoft
 * Licensed under MIT license
 */

angular.module('nya.bootstrap.select',[])
  .directive('nyaSelectpicker', ['$parse', function ($parse) {
    'use strict';

    // NG_OPTIONS_REGEXP copy from angular.js select directive
    var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;
    return {
      restrict: 'CA',
      scope: false,
      require: ['^ngModel', 'select'],

      link: function(scope, element, attrs, ctrls) {
        var optionsExp = attrs.ngOptions;
        var valuesFn, match, track, groupBy;
        if(optionsExp && (match = optionsExp.match(NG_OPTIONS_REGEXP))) {
          groupBy = match[3];
          //console.log(optionsExp, groupBy);
          valuesFn = $parse(match[7]);
          track = match[8];
        }
        console.log(ctrls[0]);
        var ngCtrl = ctrls[0];
        var selectCtrl = ctrls[1];
        // prevent selectDirective render an unknownOption.
        selectCtrl.renderUnknownOption = angular.noop;
        var optionArray = [];

        // store data- attribute options of select
        var selectorOptions = {};
        var BS_ATTR = ['container', 'countSelectedText', 'dropupAuto', 'header', 'hideDisabled', 'selectedTextFormat', 'size', 'showSubtext', 'showIcon', 'showContent', 'style', 'title', 'width', 'disabled'];

        var checkSelectorOptionsEquality = function() {
          var isEqual = true;
          angular.forEach(BS_ATTR, function(attr) {
            isEqual = isEqual && attrs[attr] === selectorOptions[attr];
          });
        };

        var updateSelectorOptions = function() {
          angular.forEach(BS_ATTR, function(attr) {
            selectorOptions[attr] = attrs[attr];
          });

          return selectorOptions;
        };

        /**
         * Check option data attributes, text and value equality.
         * @param opt the option dom element
         * @param index the index of the option
         * @returns {boolean}
         */
        var checkOptionEquality = function(opt, index) {
          var isEqual = opt.value === optionArray[index].value && opt.text === optionArray[index].text;
          if(isEqual) {
            for(var i = 0; i< opt.attributes.length; i++){
              if(opt.attributes[i].nodeName.indexOf('data-')!==-1) {
                if(optionArray[index].attributes[opt.attributes[i].nodeName] !== opt.attributes[i].nodeValue) {
                  isEqual = false;
                  break;
                }
              }
            }
          }
          return isEqual;
        };

        var resetDataProperties = function(opt) {
          var attributes = opt.attributes;
          for(var i = 0; i < attributes.length; i++) {
            if(attributes[i].nodeName.indexOf('data-')!==-1) {
              angular.element(opt).data(attributes[i].nodeName.substring(5, attributes[i].nodeName.length), attributes[i].value);
            }
          }
        };

        function optionDOMWatch(){
          // check every option if has changed.
          var optionElements = element.find('option');

          //if the first option has no value and label or value an value of ?, this must be generated by ngOptions directive. Remove it.
          if(!optionElements.eq(0).html() && (optionElements.eq(0).attr('value') ==='?' || !optionElements.eq(0).attr('value'))) {
            // angular seams incorrectly remove the first element of the options. so we have to keep the ? element in the list
            // only remove this ? element when group by is provided.
            //if(!!groupBy) 
            { 
              optionElements.eq(0).remove();
            }
          }

          if(optionElements.length !== optionArray.length) {
            optionArray = makeOptionArray(optionElements);
            buildSelector();
          } else {
            var hasChanged = false;
            optionElements.each(function(index, value){
              if(!checkOptionEquality(value, index)) {
                // if check fails. reset all data properties.
                resetDataProperties(value);
                hasChanged = true;
              }
            });
            if(hasChanged) {
              buildSelector();
            }
            if(!checkSelectorOptionsEquality()) {
              updateSelectorOptions();
              element.selectpicker('refresh');
            }
            optionArray = makeOptionArray(optionElements);
          }
        }

        scope.$watch(function(){
          // Create an object to deep inspect if anything has changed.
          // This is slow, but not as slow as calling optionDOMWatch every $digest
          return {
            ngModel: ngCtrl.$viewValue,
            options: makeOptionArray( element.find('option') ),
            selectors: updateSelectorOptions()
          };
        // If any of the above properties change, call optionDOMWatch.
        }, optionDOMWatch, true);

        var setValue = function(modelValue) {
          var collection = valuesFn(scope);
          if(angular.isArray(collection) && !angular.isArray(modelValue)) {
            // collection is array and single select mode
            var index = indexInArray(modelValue, collection);
            if(index > -1) {
              element.val(index).selectpicker('render');
            }
          } else if(angular.isArray(collection) && angular.isArray(modelValue)) {
            // collection is array and multiple select mode.
            var indexArray = [];
            for(var i = 0; i < modelValue.length; i++) {
              var indexOfOptions = indexInArray(modelValue[i], collection);
              if(indexOfOptions > -1) {
                indexArray.push(indexOfOptions);
              }
            }
            element.val(indexArray).selectpicker('render');
          } else if(!angular.isArray(collection) && !angular.isArray(modelValue)) {
            // collection is object and single select mode.
            var key = keyOfObject(modelValue, collection);
            if(key) {
              element.val(key).selectpicker('render');
            }
          } else if(!angular.isArray(collection) && angular.isArray(modelValue)) {
            // collection is object and multiple select mode.
            var keyArray = [];
            for(var j = 0; j < modelValue.length; j++) {
              var k = keyOfObject(modelValue[j], collection);
              if(k) {
                keyArray.push(k);
              }
            }
            element.val(keyArray).selectpicker('render');
          }
        };

        ngCtrl.$render = function() {
          // model -> view
          var data = element.data('selectpicker');
          if(data) {
            if(!!valuesFn && !track) {
              // transform value to index of options
              setValue(ngCtrl.$viewValue);
            } else {
              element.val(ngCtrl.$viewValue).selectpicker('render');
            }
          }
        };

        function indexInArray(value, array) {
          for(var i = 0; i < array.length; i++) {
            if(angular.equals(value, array[i])) {
              return i;
            }
          }
          return -1;
        }

        function keyOfObject(value, object) {
          var key = null;
          angular.forEach(object, function(v, k) {
            if(angular.equals(v, value)) {
              key = k;
            }
          });
          return key;
        }

        /**
         * Copy option value and text and data attributes to an array for future comparison.
         * @param optionElements the source option elements. a jquery objects' array.
         * @returns {Array} the copied array.
         */
        function makeOptionArray(optionElements) {
          var optionArray = [];
          optionElements.each(function(index, childNode){
            var attributes = {};
            for(var i = 0; i < childNode.attributes.length; i++) {
              if(childNode.attributes[i].nodeName.indexOf('data-')!==-1) {
                attributes[childNode.attributes[i].nodeName] = childNode.attributes[i].nodeValue;
              }
            }
            optionArray.push({
              value: childNode.value,
              text: childNode.text,
              attributes: attributes
            });
          });
          return optionArray;
        }

        function buildSelector() {
          // build new selector. if previous select exists. remove previous data and DOM
          var oldSelectPicker = element.data('selectpicker');
          if(oldSelectPicker) {
            oldSelectPicker.$menu.parent().remove();
            oldSelectPicker.$newElement.remove();
            element.removeData('selectpicker');
          }
          element.selectpicker();
          if(!!valuesFn && !track) {
            setValue(ngCtrl.$modelValue);
          } else {
            element.val(ngCtrl.$modelValue).selectpicker('render');
          }

        }

      }
    };
  }]);



    angular.module('multipleSelect',[]).directive('multipleAutocomplete', [
        '$filter',
        '$http',
        '$timeout',
        function ($filter, $http, $timeout) {
            return {
                restrict: 'EA',
                scope : {
                    suggestionsArr : '=?',
                    modelArr : '=ngModel',
                    apiUrl : '@',
                    beforeSelectItem : '=?',
                    afterSelectItem : '=?',
                    beforeRemoveItem : '=?',
                    afterRemoveItem : '=?',
                    onLoadCallback: '=?'
                },
                template: '<div class=\"ng-ms form-item-container multi-dropdown-list\">\r\n    <ul class=\"list-inline\">\r\n        <li ng-repeat=\"item in modelArr\">\r\n            <span ng-if=\"objectProperty == undefined || objectProperty == \'\'\">\r\n              {{item}} <span class=\"remove\" ng-click=\"removeAddedValues(item)\">\r\n                <i class=\"icon-close\"></i></span>&nbsp;\r\n          </span>\r\n            <span ng-if=\"objectProperty != undefined && objectProperty != \'\'\">\r\n               {{item[objectProperty]}} <span class=\"remove\" ng-click=\"removeAddedValues(item)\">\r\n                <i class=\"icon-close\"></i></span>&nbsp;\r\n          </span>\r\n        </li>\r\n        <li style=\"\">\r\n            <input name=\"{{name}}\" ng-model=\"inputValue\" placeholder=\"\" ng-keydown=\"keyParser($event)\"\r\n                   err-msg-required=\"{{errMsgRequired}}\"\r\n                   ng-focus=\"onFocus()\" ng-blur=\"onBlur()\" ng-required=\"!modelArr.length && isRequired\"\r\n                    ng-change=\"onChange()\">\r\n        </li>\r\n    </ul>\r\n<div class=\"autocomplete-list\" ng-show=\"isFocused || isHover\" ng-mouseenter=\"onMouseEnter()\" ng-mouseleave=\"onMouseLeave()\">\r\n    <ul ng-if=\"objectProperty == undefined || objectProperty == \'\'\">\r\n        <li ng-class=\"{\'autocomplete-active\' : selectedItemIndex == $index}\"\r\n            ng-repeat=\"suggestion in suggestionsArr | filter : inputValue | filter : alreadyAddedValues\"\r\n            ng-click=\"onSuggestedItemsClick(suggestion)\" ng-mouseenter=\"mouseEnterOnItem($index)\">\r\n            {{suggestion}}\r\n        </li>\r\n    </ul>\r\n    <ul ng-if=\"objectProperty != undefined && objectProperty != \'\'\">\r\n        <li ng-class=\"{\'autocomplete-active\' : selectedItemIndex == $index}\"\r\n            ng-repeat=\"suggestion in suggestionsArr | filter : inputValue | filter : alreadyAddedValues\"\r\n             ng-mouseenter=\"mouseEnterOnItem($index)\">\r\n<a href=\"\" ng-click=\"onSuggestedItemsClick(suggestion)\">            {{suggestion[objectProperty]}}</a><a href=\"\" ng-click=\"onViewClick(suggestion)\" style=\"float:right;\" class=\"show-history menu_icon_grey\"></a>\r\n        </li>\r\n    </ul>\r\n</div></div>\r\n',
                link : function(scope, element, attr){
                    scope.objectProperty = attr.objectProperty;
                    scope.selectedItemIndex = 0;
                    scope.name = attr.name;
                    scope.isRequired = attr.required;
                    scope.errMsgRequired = attr.errMsgRequired;
                    scope.isHover = false;
                    scope.isFocused = false;

                   

                    var getSuggestionsList = function () {
                        var url = scope.apiUrl;
                        $http({
                            method: 'GET',
                            url: url
                        }).then(function (response) {
                            scope.suggestionsArr = response.data;
                        }, function (response) {
                            console.log("*****Angular-multiple-select **** ----- Unable to fetch list");
                        });
                    };

                    if(scope.suggestionsArr == null || scope.suggestionsArr == ""){
                        if(scope.apiUrl != null && scope.apiUrl != "")
                            getSuggestionsList();
                        else{
                            console.log("*****Angular-multiple-select **** ----- Please provide suggestion array list or url");
                        }
                    }

                    if(scope.modelArr == null || scope.modelArr == ""){
                        scope.modelArr = [];
                    }
                    scope.onFocus = function () {
                        scope.isFocused=true
                    };

                    scope.onMouseEnter = function () {
                        scope.isHover = true
                    };

                    scope.onMouseLeave = function () {
                        scope.isHover = false;
                    };

                    scope.onBlur = function () {
                        scope.isFocused=false;
                    };

                    scope.onChange = function () {
                        scope.selectedItemIndex = 0;
                    };

                    scope.onViewClick = function (item) {
                        console.log(item);
                        $timeout(function(){
                         scope.onLoadCallback(item);
                        });
                    }

                    scope.keyParser = function ($event) {
                        var keys = {
                            38: 'up',
                            40: 'down',
                            8 : 'backspace',
                            13: 'enter',
                            9 : 'tab',
                            27: 'esc'
                        };
                        var key = keys[$event.keyCode];
                        if(key == 'backspace' && scope.inputValue == ""){
                            if(scope.modelArr.length != 0){
                                scope.removeAddedValues(scope.modelArr[scope.modelArr.length-1]);
                                //scope.modelArr.pop();
                            }
                        }
                        else if(key == 'down'){
                            var filteredSuggestionArr = $filter('filter')(scope.suggestionsArr, scope.inputValue);
                            filteredSuggestionArr = $filter('filter')(filteredSuggestionArr, scope.alreadyAddedValues);
                            if(scope.selectedItemIndex < filteredSuggestionArr.length -1)
                                scope.selectedItemIndex++;
                        }
                        else if(key == 'up' && scope.selectedItemIndex > 0){
                            scope.selectedItemIndex--;
                        }
                        else if(key == 'esc'){
                            scope.isHover = false;
                            scope.isFocused=false;
                        }
                        else if(key == 'enter'){
                            var filteredSuggestionArr = $filter('filter')(scope.suggestionsArr, scope.inputValue);
                            filteredSuggestionArr = $filter('filter')(filteredSuggestionArr, scope.alreadyAddedValues);
                            if(scope.selectedItemIndex < filteredSuggestionArr.length)
                                scope.onSuggestedItemsClick(filteredSuggestionArr[scope.selectedItemIndex]);
                        }
                    };

                    scope.onSuggestedItemsClick = function (selectedValue) {
                        if(scope.beforeSelectItem && typeof(scope.beforeSelectItem) == 'function')
                            scope.beforeSelectItem(selectedValue);

                        scope.modelArr.push(selectedValue);

                        if(scope.afterSelectItem && typeof(scope.afterSelectItem) == 'function')
                            scope.afterSelectItem(selectedValue);
                        scope.inputValue = "";
                    };

                    var isDuplicate = function (arr, item) {
                        var duplicate = false;
                        if(arr == null || arr == "")
                            return duplicate;

                        for(var i=0;i<arr.length;i++){
                            duplicate = angular.equals(arr[i], item);
                            if(duplicate)
                                break;
                        }
                        return duplicate;
                    };

                    scope.alreadyAddedValues = function (item) {
                        var isAdded = true;
                        isAdded = !isDuplicate(scope.modelArr, item);
                        //if(scope.modelArr != null && scope.modelArr != ""){
                        //    isAdded = scope.modelArr.indexOf(item) == -1;
                        //    console.log("****************************");
                        //    console.log(item);
                        //    console.log(scope.modelArr);
                        //    console.log(isAdded);
                        //}
                        return isAdded;
                    };

                    scope.removeAddedValues = function (item) {
                        if(scope.modelArr != null && scope.modelArr != "") {
                            var itemIndex = scope.modelArr.indexOf(item);
                            if (itemIndex != -1) {
                                if(scope.beforeRemoveItem && typeof(scope.beforeRemoveItem) == 'function')
                                    scope.beforeRemoveItem(item);

                                scope.modelArr.splice(itemIndex, 1);

                                if(scope.afterRemoveItem && typeof(scope.afterRemoveItem) == 'function')
                                    scope.afterRemoveItem(item);
                            }
                        }
                    };

                    scope.mouseEnterOnItem = function (index) {
                        scope.selectedItemIndex = index;
                    };
                }
            };
        }
    ]);

