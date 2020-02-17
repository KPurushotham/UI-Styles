<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
			<title>Exhibit PDF</title>
			<style>
			.c-header{
			text-align:center;
			margin:0px;
			font-weight:bold;
			}
			.red-header{
			color:red;}
			.main-container{
			margin:50px auto 20px auto;
			width:1080px;}
			.hostfee-dtls-tbl{
            cellspacing:0;
            border:0
			}
			.hostfee-dtls-tbl .tbl-header td{
			border-bottom:1px solid #000000;
			font-weight:bold;
			min-width:150px;
			}
			</style>
		</head>
<html>
<body>
<#assign corporationName = "na">
<#assign locOrTrack = "na">
<#assign contractAgentName = "na">
<#assign headerLocOrTrack ="na">
<#assign topickLocOrTrack = "na">



<#list mainMap?keys as k>
  <#if k == "contractAgentName">
	<#assign contractAgentName = mainMap[k]>

	
  <#elseif k == "corpName">
	<#assign corporationName = mainMap[k]>
  <#elseif k == "contractTypeCode">
	<#if mainMap[k] == "I">
		<#assign locOrTrack = "Track">
		<#assign headerLocOrTrack = "Location">	
		<#assign topickLocOrTrack = "locationName">
	<#else>
		<#assign locOrTrack = "Location">
		<#assign headerLocOrTrack = "Track">	
		<#assign topickLocOrTrack = "trackName">
	</#if>
  </#if>
</#list>

  <div class="header" align = "center">
 	<h3 class="c-header">Exhibit A </h3>
			<h4 class="c-header">${corporationName}</h4>
			<h4 class="c-header">Guest ${locOrTrack}: </h4>
			<h4 class="c-header red-header">${contractAgentName}</h4>
	</div>
			<div class="main-container">
			
				<table class="hostfee-dtls-tbl">
				
					<#assign searchTrackOrLoc = topickLocOrTrack>
					<#assign pivtoMap = {}>
					<#assign headerMap = {}>
					
					
					<#list mainMap["contractDetails"] as row>			
							
							<#assign distName = row["distributionName"]> 	
							<#if !headerMap[distName]?exists>
								<#assign headerMap = {distName:distName} + headerMap >
							</#if>
							

						<#assign searchBy = row[searchTrackOrLoc]>
						<#assign distMap ={row["distributionName"]: getAmount(row) } >
						
						<#if pivtoMap[searchBy]??>
							<#assign trackDetailsList = pivtoMap[searchBy] >	
							<#if !trackDetailsList?exists>	
								<#assign trackDetailsList = { } >	
							</#if>			
							<#assign trackDetailsList = distMap + trackDetailsList >
							<#assign pivtoMap  = pivtoMap + { searchBy : trackDetailsList}>
						<#else>
							<#assign pivtoMap = {searchBy:distMap} + pivtoMap >
						</#if>
					
					</#list>					
					<tr class="tbl-header" >
					<td >Host-${headerLocOrTrack} </td>
					<#list headerMap?keys as headerRowItemKey>											

						<td >${headerMap[headerRowItemKey]}</td>
										
					 </#list>
					 
					 </tr>
					<#assign tableHeaders = mainMap["tableHeadres"]>					
					<#assign tableHeaders = tableHeaders[0]>
					<#assign hostName = tableHeaders["hostName"]>
					<#assign rowList =[ ]>
					
					<#list pivtoMap?keys as key> 
						<tr>
						<#if (key?string)?exists>
							<td>${hostName} - ${key}</td>						
							<#else>
							<td>${hostName}</td>
						</#if>	
						
    						<#assign currentRowItem = {}>
    						<#assign currentRowItem = currentRowItem + pivtoMap[key]>
    						
    						<#assign rowString = " ">  		    									 																				
							
							
							  <#list headerMap?keys as distribution> 								
								       <#if currentRowItem[distribution]?exists>						 					
	    					     			<#assign rowString = rowString + "<td>"+currentRowItem[distribution]+"</td>">  	    									    							
	    						<#else>
	    						<#assign rowString = rowString + "<td>N/A</td>">  	    									    							
							</#if>
    									
																		
    					 </#list>
    					 ${rowString}
    				  </#list>    						
    					</tr>
										
				</table>
				
				
				</div>
				
				<div class="main-container">
				<ol>
				<li>Includes all races from ${corporationName}...</li>
				
				</ol>
				<p><b>NOTE: </b> Base host fee rates are based on Guest and Guest's Secondary Recipients..</p>
				</div>
				
 

</body>
</html>


<#function getAmount row>
		<#assign amount = 0>
		<#if (row["conventionalAmount"]?exists) &&( row["exoticAmount"]?exists)>
			<#assign amount = row["conventionalAmount"]+row["exoticAmount"]>
			
		<#elseif (row["conventionalAmount"]?exists) && (!row["exoticAmount"]?exists)>
			<#assign amount = row["conventionalAmount"]>
			
		<#elseif (!row["conventionalAmount"]?exists) && (row["exoticAmount"]?exists)>
			<#assign amount = row["exoticAmount"]>
			
		<#elseif (row["amount"]?exists)>
			<#assign amount = row["amount"]>
			
		<#else>
			<#assign amount = "N/A">
		</#if>
		<#return amount>
</#function>



