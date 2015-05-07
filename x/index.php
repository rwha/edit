<?php
date_default_timezone_set('America/New_York');
$parent = __DIR__ . '/files';
$response = array();

function recursive($d) {
	$result = array();
	$top =  array_diff(scandir($d), array('..','.'));
	foreach($top as $k => $v) {
		if(is_dir($d . '/' . $v)) {
			$result[$v] = recursive($d . '/' . $v);
		} else {
			$result[] = $v;
		}
	}
	$response['list'] = $result;
}

function saveFile($name){
	file_put_contents(__DIR__ . '/files/' . $name, $_POST['data']) && $response = 'saved' || $response = 'save failed';
	return $response;
}

$task = (isset($_POST['task']) ? $_POST['task'] : 'none');

if ($task == "save") {
	global $response, $parent;
	$fn = (isset($_POST['name']) ? $_POST['name'] : time()) . '.txt';
	$response['saved'] = saveFile($fn);
	$response['list'] = recursive($parent);
	return json_encode($response);
}
if ($task == "list") {
	return json_encode(recursive($parent));
}

//test

?>
