$(document).ready(function() {

	$.each(themes, function(k,v) {
		$("#theme").append('<option id="'+k+'">'+k+'</option>');
	});

	$.each(modes, function(k,v) {
		$("#mode").append('<option id="'+k+'">'+k+'</option>');
	});

	$("#theme").change( function() {
		changeTheme(this.value);
	});

	$("#mode").change( function() {
		changeMode(this.value);
	});

	changeTheme('idle_fingers');

	changeMode('text');

	$('#Diag').on('show.bs.modal', function(event){
		var action = $(event.relatedTarget).data('fileaction') || 'save';
		$("#file_action_title").text(action + ' file...');
		$("#file_action_button").text(action);
		if(action == 'save') {
			$("#file_name_group").show();
		}
		if(action == 'open') {
			$("#file_name_group").hide();
		}
		popList('/');
	});

	$('#delDiag').on('show.bs.modal', function(event){
		delList('/');
	});

});

var editor = ace.edit("editor");
var themelist = ace.require("ace/ext/themelist");
var modelist = ace.require("ace/ext/modelist");
var themes = themelist.themesByName;
var modes = modelist.modesByName;

editor.$blockScrolling = Infinity

editor.on("change", function(e){
	$("#file_status").html("<em>unsaved</em>");
})


var changeTheme = function(t){
	editor.setTheme(themes[t].theme);
	$("#theme").val(t);
	$('.selectpicker').selectpicker('render');
	editor.focus();
}

var changeMode = function(t){
	editor.getSession().setMode(modes[t].mode);
	$("#mode").val(t);
	$('.selectpicker').selectpicker('render');
	editor.focus();
}

var syncFiles = function(file) {
	send = { name: 'current.archive', task: 'save', data: file };
	$.post( 'x/index.php', send ).done(function(response) {
		console.log(response);
	});
}

function onError(e){
	console.log("error: " + e.name);
}

var fs = new Filer();

fs.init({persistent: true, size: 1024*1024*10}, function(filer){
	console.log("file store initialized");
}, onError);

var newFile = function(){
	editor.setValue("");
	$("#file_name").text('untitled');
	$("#file_status").text('new');
	changeMode('text');
	editor.focus();
}

var saveCurrent = function(){
	var f = $("#file_name").text();
	if(f === 'untitled') {
		$('#Diag').modal('show');
	} else {
		var pos = editor.getCursorPosition();
		var data = editor.getValue();
		var opts = {data: data, type: 'text/plain'};
		fs.write(f, opts, function(e,w){
			editor.focus();
			editor.moveCursorToPosition(pos);
			$("#file_status").text('saved');
			console.log("saved: " + f);
		});
	}
};

var folderAdd = function() {
	var name = $("#new_folder_name").val()
	var cp = $("#currentpath").text()
	console.log('creating: ' + cp + '/' + name)
	fs.cd(cp, function(here) {
		fs.mkdir(name, function(there){
			popList(cp);
			console.log('created');
		});
	});

}
var deleteThis = function(item){
	fs.rm(item, function(){
		console.log(item + "deleted");
		delList('/');
	});
};

var updateBreadcrumb = function(path) {
	var bc = path.split('/');
	bc.shift();
	$("#cwd").empty();
	$("#cwd").append( $("<li>").append( $("<a>").attr('onclick', 'popList(\'/\')').text('root') ) );
	var x = '';
	if(bc.length > 1) {
		if (bc[0] === "") { bc.shift(); }
		bc.forEach(function(k,v){
			x = x+'/'+k;
			var nbc = $("<li>").append( $("<a>").attr('onclick', 'popList(\''+x+'\')').text(k) );
			$("#cwd").append(nbc);
		});
	} else {
		x = '/';
	}
	$("#currentpath").text(x);
};

var delList = function(path){
	var fldiv = $("#filelist_del");
	fs.ls(path, function(entries){
		fldiv.empty();
		entries.forEach(function(entry, i){
            var a = $("<a>").attr('href', '#').addClass("list-group-item");
			var p = $("<p>").addClass("list-group-item-text").attr('style', 'display: inline-block').text(' '+entry.name);
			if(entry.isDirectory) {
                var bgrp = $("<div>").addClass("btn-group btn-sm").attr('style', 'display: inline-block');
                var dbtn = $("<button>").addClass("btn btn-danger").append( $("<span>").addClass("glyphicon glyphicon-trash") );
                var obtn = $("<button>").addClass("btn btn-primary").append( $("<span>").addClass("glyphicon glyphicon-folder-open") );
                dbtn.attr('onclick', 'deleteThis(\''+entry.fullPath+'\')');
                obtn.attr('onclick', 'delList(\''+entry.fullPath+'\')');
                bgrp.append(dbtn,obtn);
                a.append(bgrp);
			} else {
				a.attr('onclick', 'deleteThis(\''+entry.fullPath+'\')');
			}
			a.append(p);
            fldiv.append(a);
		});
	});
	updateBreadcrumb(path);
};


var popList = function(path){
	var fldiv = $("#filelist");
	fs.ls(path, function(entries){
		fldiv.empty();
		//fs.cd(path);
		if($("#file_action_button").text() == 'save') {
			var pd = $("<div>").addClass("input-group");
			pd.append($("<input>").addClass("form-control").attr({type: "text", placeholder: "create new folder...", id: "new_folder_name"}));
			var btn = $("<button>").addClass("btn btn-default").attr({type: "button", onclick: "folderAdd()"});
			btn.append( $('<span>').addClass("glyphicon glyphicon-plus").attr('aria-hidden', 'true') );
			var s = $("<span>").addClass("input-group-btn");
			s.append(btn);
			pd.append(s);
			fldiv.append(pd);
		}
		entries.forEach(function(entry, i){
			var icon = $('<span>').addClass("glyphicon").attr('aria-hidden', 'true');
			var f = $("<a>").attr('href', '#').addClass("list-group-item");
			var t = $("<p>").addClass("list-group-item-text").attr('style', 'display: inline-block').text(' '+entry.name);
			var b = $("<span>").addClass("badge");
			if(entry.isDirectory) {
				icon.addClass("glyphicon-folder-open");
				f.attr('onclick', 'popList(\''+entry.fullPath+'\')');
			} else {
				icon.addClass("glyphicon-file");
				f.attr('onclick', 'openFile(\''+entry.fullPath+'\')');
			}
			b.append(icon);
			f.append(t,b);
			fldiv.append(f);
		});
	});
	updateBreadcrumb(path);
};

var openFile = function(f) {
	fs.open(f, function(inside){
		var reader = new FileReader();
		reader.onload = function(e) {
			editor.setValue(e.target.result);
			var mode = modelist.getModeForPath(f).name;
			changeMode(mode);
			editor.moveCursorToPosition({row: 0, column: 0});
			$('#Diag').modal('hide');
			$("#file_name").text(f);
			$("#file_status").text('saved');
			document.title = "editor: " + f;
		}
		reader.readAsText(inside);
	}, onError);
}

var saveFile = function() {
	var pos = editor.getCursorPosition();
	var data = editor.getValue();
	var opts = {data: data, type: 'text/plain'};
	var path = $("#currentpath").text();
	var name = $("#new_file_name").val();
	fs.cd(path, function(here){
		fs.write(name, opts, function(e,w){
			var mode = modelist.getModeForPath(name);
			changeMode(mode.name);
			$('#Diag').modal('hide');
			$("#file_name").text(path+'/'+name);
			$("#file_status").text('saved');
			$("#new_file_name").val('');
			document.title = "editor: " + path+'/'+name;
			editor.focus();
			editor.moveCursorToPosition(pos);
		});
	});
};
