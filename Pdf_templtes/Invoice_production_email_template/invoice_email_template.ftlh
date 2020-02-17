<!DOCTYPE html>
<html>
<head>
<title>Email Template</title>

<style>
.container{
width: 100%;
display: table;
}


.cell{
display: table-cell;
}

.cell .left{
text-align: left;
}

.cell.right{
text-align: right;
}
</style>
</head>
<body>


<#assign to=emailData["title"]>

<#assign invoiceNumber=campaignItem["applicationObjectId"]>

<#assign tenantCode=tenantContext["tenantCode"]>

<#assign directAccessToken=campaignItem["directAccessToken"]>

<#assign downloadUrl=emailData["attach_file"]>

<#assign sender=emailData["sender"]>


</div>
<div class="body">

<#if emailData["invoiceData"]??>

<#assign additionalInfo = parentCampaign["additionalInfo"]>
<#assign startDate = additionalInfo["startDate"]>
<#assign endDate = additionalInfo["endDate"]>

<p>Hello ${to},</p>
<p>
This e-mail contains your invoice <u>${invoiceNumber?c}</u> and gives you the option to Accept or Reject the Invoice</p>
<h3><b>Current period (${startDate}-${endDate}) balance:</b></h3>

<#assign from=emailData["from"]>

<#assign invoiceData = emailData["invoiceData"]>

<#assign invoiceDate = invoiceData["InvoiceDate"]>

<#assign invoiceBalance = invoiceData["InvBalance"]>

<#assign invoiceTotal = invoiceData["InvTotal"]>


<#assign invoiceHeaders = invoiceBalance["headers"]>
<#assign headerListSize = invoiceHeaders?size - 1>

<#assign invoiceImports = invoiceBalance["imports"]>

<#assign invoiceExports = invoiceBalance["exports"]>

<#assign senderAbver = invoiceData["SenderAbvr"]>

<#assign tenantLogo = tenantContext["logo"]>


<div class="header">
<table border = "1" cellpadding = "1"> 
<th style="width:25%" ></th>	
<th style="width:25%" > ${senderAbver} Imports</th>
<th style="width:25%" > ${senderAbver} Exports</th>

<#list 0..headerListSize as i>
<tr>

<td style="width:25%" > ${invoiceHeaders[i]}</td>
<#if invoiceHeaders[i] == "Rate">
<td style=" text-align:right" > ${invoiceImports[i]}%</td>
<td style=" text-align:right" > ${invoiceExports[i]}%</td> 

<#else>
<td><div class="container"><span class="cell left">$</span><span class="cell right">${invoiceImports[i]}</span>
</div> </td>

<td><div class="container"><span class="cell left">$</span><span class="cell right">${invoiceExports[i]}</span>
</div> </td>


</#if>
</tr>

</#list>
<td colspan="2" style="width:25%" ><b>Total due to (from) ${senderAbver}</b></td>

<td><div class="container"><span class="cell left"><b>$</b></span><span class="cell right"><b>${invoiceTotal}</b></span>
</div> </td>
</table>


<br>
<div>
<p>To Accept Now, please click here:<br><a href="https://invoices.chrims.com/email/directpage/${tenantCode}/${directAccessToken}?status=AUTOACCEPT">ACCEPT NOW</a></p>
<p>To Accept or Reject the invoice, please use the following links<br>
<a href="https://invoices.chrims.com/email/directpage/${tenantCode}/${directAccessToken}">Preview to Accept or Reject</a></p>
<p> You can download the invoice by clicking here:&nbsp;&nbsp; <br> <a href="${downloadUrl}" class="btn btn-primary btn-xs" role="button">Download</a></p>


<#if invoiceData["Statement"]??>
To preview your balance statement,please use the following URL:<br>
<#assign statementBalance = invoiceData["Statement"]>
<#assign statementURL = statementBalance["StatementURL"]>
<#assign oldDue = statementBalance["OldDue"]>
<#assign totalDue = statementBalance["TotalDue"]>
<a href=${statementURL}>Statement Balance</a><br>
<b>Past due balance:</b>${oldDue?replace(',' , '')}<br>
<b>Total balance:</b>${totalDue?replace(',' , '')}</p>
</#if> 
</div>
<b>Sincerely,</b><br>
<b>${sender}</b><br>
<img border="0" align="middle" alt="${sender}" src="https://invoices.chrims.com/email/${tenantLogo}" width="150" height="100">
<center><img border="0" align="middle" alt="chrims" src="https://invoices.chrims.com/email/tenants/chrims/images/logo.jpg" width="150" height="100"><br>
Trouble previewing invoices?&nbsp;&nbsp;Use <a href="https://www.google.com/chrome/">Chrome</a> to enhance your experience<br>
If the links above do not work, please use the link below to review your latest billing statement:<br/>
<a href="https://invoices.chrims.com/email/directPageIE.html?tokenid=${directAccessToken}" class="btn btn-primary btn-xs" role="button">Download, Accept or Reject invoice</a>&nbsp;&nbsp;<br></center>




<#else>
<h5> 
<div class="header">
<p>Hello ${to},</p>
</div>
<div class="body">
<p>
This e-mail contains your latest billing statement. &nbsp;&nbsp; <br> 
<a href="https://invoices.chrims.com/email/directpage/${tenantCode}/${directAccessToken}" class="btn btn-primary btn-xs" role="button">Please review and confirm the invoice</a>&nbsp;&nbsp;<br>
</p>
<p>
You can download the invoice by clicking here: &nbsp;&nbsp; <br> <a href="${downloadUrl}" class="btn btn-primary btn-xs" role="button">Download</a>
</p>
<p>If the above link doesn't work by any chance, please use below link to review your latest billing statement:<br/>
<a href="https://invoices.chrims.com/email/directPageIE.html?tokenid=${directAccessToken}" class="btn btn-primary btn-xs" role="button">Please download and review and confirm the invoice</a>&nbsp;&nbsp;<br> 
</p>

<p>Your Invoice number : <u>${invoiceNumber?c}</u></p>
<p>
<b>Sincerely,</b><br>
${sender}</p>
</div>
</h5>
<p align="center"><kbd>Powered By PGSI</kbd><br>
Issue previewing invoices Use <a href="https://www.google.com/chrome/">Chrome</a> to enhance your experience</p>
</p>
</#if>
</body>
</html>