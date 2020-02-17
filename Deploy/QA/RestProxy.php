<?php 
// Method: POST, PUT, GET etc
// Data: array("param" => "value") ==> index.php?param=value

$api_repo= array();
$api_repo["INVOICE_ACTION_SAVE"]="http://172.16.41.165:8082/public/email/campaign/item/action/save";

if(isset($_GET['accesscode']) && $_GET['accesscode']!=''){	
	$api_repo["INVOICE_ACCESS"]=sprintf("http://172.16.41.165:8082/public/email/campaign/item/preview/access/%s?recipientEmailId=%s@gmail.com"
	,$_GET['accesscode'], rand());
}
function CallAPI($method, $url, $data = false)
{
    $curl = curl_init();

    switch ($method)
    {
        case "POST":
            curl_setopt($curl, CURLOPT_POST, 1);

            if (!$data)$data=$_POST;
			if(!isset($data)){
				$result= array();
				$result['success']='false';
				$result['message']='empty data posted.';
				$result=json_encode($result);
				return $result;
			}
			else{
				curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
			}
            break;
        case "PUT":
            curl_setopt($curl, CURLOPT_PUT, 1);
            break;
        default:
            if ($data)
                $url = sprintf("%s?%s", $url, http_build_query($data));
    }
	$req_header= array();
	if(isset($_SERVER['HTTP_X_TENANTID'])){
		array_push($req_header,'X-TenantID:' . $_SERVER['HTTP_X_TENANTID']);
	}
	else if(isset($data['tenantId'])){
		array_push($req_header,'X-TenantID:' . $data['tenantId']);
	}
	//array_push($req_header,'Content-Type:application/json;charset=UTF-8');
	array_push($req_header,'Content-Type:application/json;charset=UTF-8');
	//echo json_encode($req_header);
	//exit;
	curl_setopt($curl, CURLOPT_HTTPHEADER, $req_header);
	curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
	
    $result = curl_exec($curl);
	if ($result === false) {
		$result= array();
		$result['success']='false';
		$result['message']=curl_error($curl);
		$result=json_encode($result);
    }

    curl_close($curl);

    return $result;
}

$api_url=$api_repo[$_GET['servicecode']];
if(isset($api_url)){
	$http_method= $_SERVER['REQUEST_METHOD'];
	$api_result = CallAPI($http_method, $api_url);
	echo $api_result;
}
else{
	$error_result= array();
	$error_result['success']='false';
	$error_result['message']='service not configured!';
	echo json_encode($error_result);
}

exit;
?>