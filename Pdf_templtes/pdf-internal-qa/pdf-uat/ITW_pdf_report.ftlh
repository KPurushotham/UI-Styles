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
<img src="C:\app-platform\images\tampa.png" alt="Tampa image">
<div class="image" style="display: none;width: 100%;height: 20px;">
    <p class="text-right" style="margin: auto;text-align:right;font-size:150%;"><b>${Title}</b></p><br>
</div>



 <#assign reportCriteria = ReportHeader?remove_beginning("{")> 
 <#assign reportCriteria = reportCriteria?remove_ending("}")>
 <#assign reportCriteria = reportCriteria?replace("=", ":")>
 <#assign selcolHeader = "">
 <#assign selColItemsCount = 0>
 <#assign groupColList=[]>
 <#assign groupColListSize = groupColList?size>
 <#assign groupColList=[]>

 
 
 
 <#list Data as row>
	<#list row as key,value>
		<#if key == "firstCol">
				<#if !value?contains("Total") && !value?contains("record")>
					 <#if !groupColList?seq_contains(value)>
						<#assign groupColList = groupColList+[value]>
					 </#if>					 
				</#if>
		</#if>
	</#list>
 </#list>

<div class="selected Criteria" style="width:100%;">
  <ul class="list-unstyled">
  <li><p class="text-right" style="margin: auto;text-align: right;font-size:150%;"><b>${Title}</b></p></li>
   <#list reportCriteria?split(",") as criteria>
	 <#if criteria?contains("ReportByHeader")>
		<#assign selcolHeader = criteria?keep_after(":")>
	 <#else>
		<#assign criteriaItem = criteria?split(":")>
        <li> <p class="h3" style="margin: auto;text-align: left-align;font-size:100%;"><b>${criteriaItem[0]}</b>: ${criteriaItem[1]}</p></li> 
	 </#if>
   </#list>
</div>
<div>
    <table class="table" BORDER=0 
CELLSPACING=0 CELLPADDING=1>
        <thead>
          <tr>
            
            <#list selcolHeader?split(" ") as selcol>
                <th style="width:10%">${selcol}</th>
				  <#assign selColItemsCount += 1>

            </#list>
            <th style="width:5%"  class="text-right" >Handle</th>
            <th style="width:6%"  class="text-right">Commission</th>
            <th style="width:6%"  class="text-right" >Break</th>
            <th style="width:6%"  class="text-right" >Fee to Import Track</th>
			<th style="width:6%"  class="text-right">State Tax</th>
            <th style="width:6%"  class="text-right">Breeders Awards</th>
            <th style="width:6%"  class="text-right">Guest Fee</th>
            <th style="width:6%"  class="text-right">Moneyroom</th>
            <th style="width:6%"  class="text-right">Guest Exp</th>
			<th style="width:6%"  class="text-right">Due TBD</th>
			
          </tr>
        </thead>
        <tbody>       
        <#assign keysNotToDisplay = ["sqlErr","sortOrder"]>
		<#if selColItemsCount == 1>
                    <#assign headerOrderList = ["firstCol", "Handle","Commission","Break","feetoImportTrack","stateTax","breedersAwards","guestFee","moneyroom","guestExp","dueTBD"]>
                
		<#elseif selColItemsCount == 2>
                    <#assign headerOrderList = ["firstCol","secondCol", "Handle","Commission","Break","feetoImportTrack","stateTax","breedersAwards","guestFee","moneyroom","guestExp","dueTBD"]>
		<#elseif selColItemsCount == 3>
                    <#assign headerOrderList = ["firstCol","secondCol","thirdCol", "Handle","Commission","Break","feetoImportTrack","stateTax","breedersAwards","guestFee","moneyroom","guestExp","dueTBD"]>             
		<#else>
						<#assign headerOrderList = ["firstCol", "secondCol","thirdCol","fourthCol", "Handle","Commission","Break","feetoImportTrack","stateTax","breedersAwards","guestFee","moneyroom","guestExp","dueTBD"]>
		
		</#if>
		
         <#setting number_format=",##0.00">
         <#setting locale="en_US">
		 <#assign totalList = []>

		<#assign groupCheckList = []>
		 
          <#list Data as rowMap>
		  
            <#assign isTotalRow = "false">
			<#assign isSortOrder2 = "false">
			<#assign isSortOrderZero = "false">

            <#list rowMap?keys as rowKey>
			  	<#if rowMap[rowKey]?is_number>
					<#assign lowerCaseRowKey = rowMap[rowKey]>
				<#else>
					<#assign lowerCaseRowKey = rowMap[rowKey]?lower_case>
				</#if>
				
                <#if lowerCaseRowKey?contains("total")>
                    <#assign isTotalRow = "true">
                </#if>
				
				<#if (rowKey == "sortOrder" && lowerCaseRowKey == 2) || lowerCaseRowKey?contains("record")>
					<#assign isSortOrder2 = "true">
				</#if>
				<#if rowKey == "sortOrder" && lowerCaseRowKey == 0>
					<#assign isSortOrderZero = "true">
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
								<#if value?is_number>
									<td style="border:none;padding: 0px !important;" class="text-right"><b>${value}<b></td>
								<#elseif value=="yy">
										<td style="border:none;padding: 0px !important;"> </td>
								<#else> 
									<td style="border:none;padding: 0px !important;"><b>${value}<b></td>
								</#if>
						  </#if>
					  </#list>
					</#list>
					
				<#elseif isSortOrderZero == "true">
					
					<p style="border:none;padding: 0px !important;" class="text-center" align="center"><b>No records to show</b></p>
					
                <#else>				
					<#list headerOrderList as header>					
							<#list rowMap as key, value> 
								<#if header == key && !keysNotToDisplay?seq_contains(key)> 
									<#if groupColList?seq_contains(value) && !groupCheckList?seq_contains(value)>
										<#if Data?size gt 1 && selColItemsCount gt 1>
										<tr><td style="border:none;padding: 0px !important;"><b>Group : ${value}</b></td></tr>
										<#assign groupCheckList = groupCheckList + [value]>
										</#if>
									</#if>
									<#if value?is_number>
									  <td class="text-right" style="border:none;padding: 0px !important;">${value}</td>
									<#elseif value=="yy">
										<td style="border:none;padding: 0px !important;"> </td>
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
				<#elseif total?contains("x")>
					<td style="border:none;padding: 0px !important;"> </td>
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