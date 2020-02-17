<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
			<title>Excel To HTML using codebeautify.org</title>
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
		<body>
			
			<h3 class="c-header">Exhibit A </h3>
			<h4 class="c-header">${corporationName}</h4>
			<h4 class="c-header">Guest ${locOrTrack}: </h4>
			<h4 class="c-header red-header">${contractAgentName}</h4>
			<div class="main-container">
			
				<table class="hostfee-dtls-tbl">
					<tr class="tbl-header" >
						<td >Host-${headerLocOrTrack} </td>
						<td></td>
						<td >Host Fee </td>
						<td></td>
						<td >Purse Fee </td>
						<td></td>
						<td >Ca Work Comp </td>
						<td></td>
						<td >Tv Fee </td>
						<td></td>
						<td >Term(s) </td>						
					</tr>
					<#assign searchTrackOrLoc = topickLocOrTrack>
					<#list rowList as row>				
					<tr>
							<#assign distName = row["distributionName"]>
							
							<#if (row["locationName"]?string)?exists>
								<td>${row["hostName"]} & ${row["locationName"]}</td>
							<#elseif (row["trackName"]?string)?exists >
								<td>${row["hostName"]} & ${row["trackName"]}</td>
								<#else>
								<td>${row["hostName"]}</td>
							</#if>
							
							
							
								<#if distName == "Host Fee">
									<td></td> <td> </td> <td></td> <td>N/A</td> <td></td> <td>N/A</td> <td></td> <td>N/A</td> <td></td>
								<#elseif distName == "Purse Fee">
									<td></td> <td>N/A</td> <td></td> <td> </td> <td></td> <td>N/A</td> <td></td> <td>N/A</td> <td></td>
								<#elseif distName == "Work Comp">
									<td></td> <td>N/A</td> <td></td> <td>N/A</td> <td></td> <td> </td> <td></td> <td>N/A</td> <td></td>
								<#elseif distName == "Tv Fee">
								  <td></td> <td>N/A</td> <td></td> <td>N/A</td> <td></td> <td>N/A</td> <td></td> <td> </td> <td></td>
								<#else>
								   <td></td> <td>N/A</td> <td></td> <td>N/A</td> <td></td> <td>N/A</td> <td></td> <td>N/A</td> <td></td>
								</#if>
								<#if (row["terms"]?string)?exists>
								<td>${row["terms"]}</td>
								<#else>
								<td>N/A</td>
								</#if>
				</tr>
					</#list>
					
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