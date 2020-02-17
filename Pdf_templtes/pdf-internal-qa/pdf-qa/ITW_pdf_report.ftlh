<!DOCTYPE html>
<html lang="en">
<head>
  <title>ITW Report</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</head>
<body>
<div class="image" style="display: none;width: 100%;height: 20px;">
    <p class="text-right" style="display: block;/* float: right; */padding-top: 40px;text-align: center;"><b>${Title}</b></p><br>
</div>



 <#assign reportCriteria = ReportHeader?remove_beginning("{")> 
 <#assign reportCriteria = reportCriteria?remove_ending("}")>
 <#assign reportCriteria = reportCriteria?replace("=", ":")>
 <#assign selcolHeader = "">
  <#assign count = 0>


<div class="selected Criteria" style="width:100%;">
  <ul class="list-unstyled">
  <li><p class="text-right" style="display: block;padding-top: 5px;text-align: center;"><b>${Title}</b></p></li>
   <#list reportCriteria?split(",") as criteria>
	 <#if criteria?contains("ReportByHeader")>
		<#assign selcolHeader = criteria?keep_after(":")>
	 <#else>
        <li> <p class="h5" style="margin: auto;text-align: center;"><b>${criteria}</b></p></li> 
	 </#if>
   </#list>
</div>`
<div>
    <table class="table" BORDER=0 
CELLSPACING=0 CELLPADDING=1>
        <thead>
          <tr>
            
            <#list selcolHeader?split(" ") as selcol>
                <th style="width:10%">${selcol}</th>
				  <#assign count += 1>

            </#list>
            <th style="width:5%"  class="text-right" >Handle</th>
            <th style="width:6%"  class="text-right">Commission</th>
            <th style="width:6%"  class="text-right" >Break</th>
            <th style="width:6%"  class="text-right" >Fee to Import Track</th>
			<th style="width:6%"  class="text-right">Tax</th>
            <th style="width:6%"  class="text-right">Breeders Awards</th>
            <th style="width:6%"  class="text-right">Guest Fee</th>
            <th style="width:6%"  class="text-right">Moneyroom</th>
            <th style="width:6%"  class="text-right">Guest Exp</th>
			<th style="width:6%"  class="text-right">Due TBD</th>
			
          </tr>
        </thead>
        <tbody>       
        <#assign keysNotToDisplay = ["sqlErr","sortOrder"]>
		<#if count == 1>
                    <#assign headerOrderList = ["firstCol", "Handle","Commission","Break","feetoImportTrack","stateTax","breedersAwards","guestFee","moneyroom","guestExp","dueTBD"]>
                
		<#elseif count == 2>
                    <#assign headerOrderList = ["firstCol","secondCol", "Handle","Commission","Break","feetoImportTrack","stateTax","breedersAwards","guestFee","moneyroom","guestExp","dueTBD"]>
		<#elseif count == 3>
                    <#assign headerOrderList = ["firstCol","secondCol","thirdCol", "Handle","Commission","Break","feetoImportTrack","stateTax","breedersAwards","guestFee","moneyroom","guestExp","dueTBD"]>             
		<#else>
						<#assign headerOrderList = ["firstCol", "secondCol","thirdCol","fourthCol", "Handle","Commission","Break","feetoImportTrack","stateTax","breedersAwards","guestFee","moneyroom","guestExp","dueTBD"]>
		
		</#if>
          <#setting number_format=",##0.00">
         <#setting locale="en_US">
		 <#assign totalList = []>
          <#list Data as rowMap>
            
            <#assign isTotalRow = "false">
			<#assign isSortOrder2 = "false">
            <#list rowMap?keys as rowKey>
              <#assign lowerCaseRowKey = rowMap[rowKey]?lower_case>
                <#if lowerCaseRowKey?contains("total")>
                    <#assign isTotalRow = "true">
                </#if>
				<#if lowerCaseRowKey == "2.00">
					<#assign isSortOrder2 = "true">
				</#if>
            </#list>

            <tr>            
                <#if  isTotalRow == "true">   
				  <#list headerOrderList as header>
					  <#list rowMap as key, value> 
						  <#if header == key && !keysNotToDisplay?seq_contains(key)>  
							<#--below logic should be implemented for numbers to get align as right and it is not implemented dont get confused -->
								<#if value?is_number>
									<#assign totalList = totalList + [value]>
								  <!-- <td style="border:none;padding: 0px !important;" class="text-right"><b>${value}<b></td> -->
								<#else> 
									<#assign totalList = totalList + [value]>
									 <!-- <td style="border:none;padding: 0px !important;"><b>${value}<b></td> -->
								</#if>
						  </#if>
					  </#list>
					</#list>
				<#elseif isSortOrder2 == "true">
					<#list headerOrderList as header>
					  <#list rowMap as key, value> 
						  <#if header == key && !keysNotToDisplay?seq_contains(key)>  
							<#--below logic should be implemented for numbers to get align as right and it is not implemented dont get confused -->
								<#if value?is_number>
									<td style="border:none;padding: 0px !important;" class="text-right"><b>${value}<b></td>
								<#else> 
									<td style="border:none;padding: 0px !important;"><b>${value}<b></td>
								</#if>
						  </#if>
					  </#list>
					</#list>
                <#else>            
				<#list headerOrderList as header>				
                    <#list rowMap as key, value> 
                        <#if header == key && !keysNotToDisplay?seq_contains(key)> 
							<#--below logic should be implemented for numbers to get align as right and it is not implemented dont get confused -->
							<#if value?is_number>
							  <td class="text-right" style="border:none;padding: 0px !important;">${value}</td>
							<#else>
							 <td style="border:none;padding: 0px !important;">${value}</td>
							</#if>
                        </#if>                    
                    </#list>  
				</#list>					
                </#if>
            </tr>

          </#list>
		  
		  <tr>
			<#list totalList as  total>
				<#if total?is_number>
					<td style="border:none;padding: 0px !important;" class="text-right"><b>${total}<b></td>
				<#else>
					<td style="border:none;padding: 0px !important;"><b>${total}<b></td>
				</#if>
				
			</#list>
		  </tr>		  

        </tbody>
      </table>           
</div>

</body>
</html>