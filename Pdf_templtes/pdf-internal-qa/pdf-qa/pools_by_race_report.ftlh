<!DOCTYPE html>
<#assign reportTitle = dataHeader[1]>
<#assign logo = tenantContext["logo"]>
<#setting number_format="currency">
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

<#assign attributeMap = dataHeader[0]>
<#assign reportByList = []>
<#assign headerList = []>

<#assign reportByMap = attributeMap["reportBy"]>

<#assign reportBy = reportByMap["headerText"]>

<#assign headerList = headerList + ["reportBy"]>	

<#assign ifNull = 0>

<#list data as row>		
	<#list row?keys as dataKey>
		<#assign value = row[dataKey]>
		<#if dataKey == "raceno" && !headerList?seq_contains(value)>
			<#assign headerList = headerList + [value]>
		</#if>				
	</#list>
</#list>

<#list data as row>		
	<#list row?keys as dataKey>
		<#if dataKey == "reportBy" && !reportByList?seq_contains(row[dataKey])>
			<#assign reportByList = reportByList + [row[dataKey]]>
		</#if>				
	</#list>
</#list>

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
	<#list headerList as header>
		<#if !header?is_number>
			<th class="text-left" style="border:none;padding: 0px !important;">${reportBy}</th>
		<#else>
			<#assign value = "Race " + header?string.number>
			<th class="text-right" style="border:none;padding: 0px !important;">${value}</th>
		</#if>
	</#list>
  </tr> 
  
<#list reportByList as reportByValue>
	<tr>
		<td class="text-left" style="border:none;padding: 0px !important;">${reportByValue}</td>
		<#list  1..headerList?size-1 as raceNumber>
			<#list data as row>
				<#if reportByValue == row["reportBy"] && row["raceno"] == raceNumber>
					<td class="text-right" style="border:none;padding: 0px !important;">${row["netsales"]}</td>
				</#if>
			</#list>
		</#list> 
	</tr>		
</#list>
  
</table>

</body>
</html>