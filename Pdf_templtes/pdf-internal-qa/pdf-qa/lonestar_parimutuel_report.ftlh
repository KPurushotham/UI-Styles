<!DOCTYPE html>
<html lang="en">
<head>
  <title>Lonestar Parimutuel Report</title>
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

<div class="selected Criteria" style="width:100%;">
  <ul class="list-unstyled">
  <li><p class="text-right" style="display: block;padding-top: 5px;text-align: center;"><b>${Title}</b></p></li>
   <#list reportCriteria?split(",") as criteria>
      <li> <p class="h5" style="margin: auto;text-align: center;"><b>${criteria}</b></p></li> 
   </#list>
</div>
<div>
    <table class="table" BORDER=0 
CELLSPACING=0 CELLPADDING=1>
        <thead>
          <tr>
            <th style="width:16%">Track</th>
            <th style="width:8%"  class="text-right" >Net Hand</th>
            <th style="width:6%"  class="text-right">Payout</th>
            <th style="width:5%"  class="text-right" >Brk</th>
            <th style="width:5%"  class="text-right" >Money Room</th>
			<th style="width:5%"  class="text-right">TXBred</th>
            <th style="width:5%"  class="text-right">PurTh</th>
            <th style="width:5%"  class="text-right">PurQT</th>
            <th style="width:5%"  class="text-right">PurMIN</th>
            <th style="width:5%"  class="text-right">PurPT</th>
			<th style="width:5%"  class="text-right">BrkTH</th>
			<th style="width:5%"  class="text-right">BrkQT</th>
			<th style="width:5%"  class="text-right">BrkMIN</th>
			<th style="width:5%"  class="text-right">BrkPT</th>
            <th style="width:5%"  class="text-right">PM Tax</th>
			<th style="width:5%"  class="text-right">Host Fee</th>
			<th style="width:5%">Host Fee Rate</th>
          </tr>
        </thead>
        <tbody>       
        <#assign keysNotToDisplay = ["breed", "sortorder", "sql_err"]>
		<#assign headerOrderList = ["selcol", "nethand", "payout","breakage","moneyroom","txbred","purth","purqt","purmin","purpt","brkth","brkqt","brkmin","brkpt","pmtax","hostfee","hostfeerate"]>
          <#setting number_format=",##0.00">
         <#setting locale="en_US">
          <#list Data as rowMap>
            
            <#assign isTotalRow = "false">

            <#list rowMap?keys as rowKey>
              <#assign lowerCaseRowKey = rowMap[rowKey]?lower_case>
                <#if lowerCaseRowKey?contains("total")>
                    <#assign isTotalRow = "true">
                </#if>
            </#list>

            <tr>            
                <#if  isTotalRow == "true">   
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

        </tbody>
      </table>           
</div>

</body>
</html>