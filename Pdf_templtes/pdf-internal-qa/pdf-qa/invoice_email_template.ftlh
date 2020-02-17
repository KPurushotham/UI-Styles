<!DOCTYPE html>
<html>
<head>
<title>Email Template</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
</head>
<body>
 <h5> 
<div class="header">
 <p>Hello ${to},</p>
</div>
<div class="body">
 <p>
   This e-mail contains your latest billing statement. &nbsp;&nbsp; <br> <a href="http://developeriis.chrims.com/app-platform-uat/directpage/${tenantCode}/${directAccessToken}" class="btn btn-primary btn-xs" role="button">Please review and confirm the invoice</a>&nbsp;&nbsp;<br>
</p>
<p>If the above link doesn’t work by any chance, please use below link to review your latest billing statement:<br/>
 <a href="http://developeriis.chrims.com/app-platform-uat/directPageIE.html?tokenid=${directAccessToken}" class="btn btn-primary btn-xs" role="button">Please download and review and confirm the invoice</a>&nbsp;&nbsp;<br> 
</p>
<p>
You can download the invoice by clicking on below button:&nbsp;&nbsp; <br> <a href="${downloadUrl}" class="btn btn-primary btn-xs" role="button">Download</a>
</p>
<p>Your Invoice number : <u>${invoiceNumber}</u></p>
<p>
    Sincerely,<br>
    ${from}</p>
</div>
</h5>
<p align="center"><kbd>Powered By PGSI</kbd></p>
</body>
</html>
