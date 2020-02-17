<!DOCTYPE html>
<#assign reportTitle = dataHeader[1]>
<#assign logo = tenantContext["logo"]>
<#setting number_format=",##0.00">
<#setting locale="en_US">

<html>
	<head>
		<meta charset="UTF-8">
		<title>${reportTitle}</title>
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
	</head>
<html>
<body>
<img alt="Tenant Logo" src=${logo}>
<h4 style="text-align:center;"><b>${reportTitle}</b></h4>
<#assign metaHeaders = []>
<#assign totalsMap = {}>
<#assign attributeMap = dataHeader[0]>

<table style="font-size: 6pt;">
<#list reportContext as key,value>
	<tr>
		<th style="text-align:left">${key}</th>
		<th>:</th>
		<td>${value}</td>
	</tr>
</#list>
</table>
<br>
<table class="table" BORDER=0 CELLSPACING=0 CELLPADDING=1 style="font-size: 5pt;">
  <tr>
	<#list attributeMap?keys as headerKey>
		<#assign headerValue = attributeMap[headerKey]>		
		<#list headerValue?keys as Key>
		   <#if Key == "headerText">		   
				<#if headerKey != "reportBy">
					<th class="text-right" style="border:none;padding: 0px !important;">${headerValue["headerText"]}</th>
				<#else>
					<th class="text-left" style="border:none;padding: 0px !important;">${headerValue["headerText"]}</th>
				</#if>
				<#assign metaHeaders = metaHeaders + [headerKey]>
			</#if>
		</#list>
	</#list>	
			
  </tr> 
		 
<#list data as row>
	<tr>				
		<#list metaHeaders as header>	
			<#list row?keys as dataKey>
				<#if header == dataKey>
					<#if row[dataKey]??>
						<#if row[dataKey]?is_number>
							<td class="text-right" style="border:none;padding: 0px !important;">${row[dataKey]}</td>
						<#elseif row[dataKey]?is_date_like>
							<td class="text-left" style="border:none;padding: 0px !important;">${row[dataKey]?string("MM/dd/yyyy")}</td>
						<#else>
							<td class="text-left" style="border:none;padding: 0px !important;">${row[dataKey]}</td>
						</#if>
					<#else>
						<td class="text-right" style="border:none;padding: 0px !important;">0.00</td>						
					</#if>				
				</#if>				
			</#list>
		</#list>
	</tr>
</#list>


<#list metaHeaders as header>
	<#if header != "reportBy">
	   <#assign sum = 0>
	   <#list data as row>		
			<#list row?keys as dataKey>
				<#if header == dataKey>
					<#if row[dataKey]??>		
						<#assign sum = sum+row[dataKey]>
					</#if>
				</#if>
			</#list>
		<#assign totalsMap = totalsMap + { header : sum } >
		</#list>				
	</#if>
</#list>
	  
  <tr>
	<th style="border:none;padding: 0px !important;">Total</th>
	<#list totalsMap as key,value>
	<th class="text-right" style="border:none;padding: 0px !important;">${value}</th>	
	</#list>
  </tr>
</table>

</body>
</html>