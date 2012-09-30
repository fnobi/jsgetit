// load modules
var url     = require("url"),
    path    = require("path"),
    fs      = require("fs"),

// load npm modules
    async   = require("async"),
    request = require("request"),
    _       = require("underscore"),
    jsdom   = require("jsdom"),
    mkdirp  = require("mkdirp");

// 定数
var JSDOIT_BASEURL = "http://jsrun.it/";

// JSGetIt jsdo.itのcodeを読み込み、使いやすいファイル分割を行って保存
var JSGetIt = function (username, codename) {
	this.username = username;
	this.codename = codename;

	this.url = url.resolve(JSDOIT_BASEURL, username + "/" + codename);

	this.project_dir = path.resolve(this.codename);
};

// this.urlからcodeをダウンロードして保存
JSGetIt.prototype.download = function (url) {
	var self = this;
	async.waterfall([function (callback) {
		self.mkdir([".", "./js", "./css"], callback);
	},function (res, callback) {
		self.get(self.url, callback);
	}, function (body, callback) {
		jsdom.env({
			html: body,
			scripts: [
				"http://code.jquery.com/jquery-1.8.0.min.js",
				"http://sfcclip.net/js/photofade.js"
			],
			done: callback
		});
	}, function(window) {
		var $ = window.$;
		$("style").each(function (index) {
			var filepath = "./css/" + self.codename + (index || "") + ".css";

			self.write_file(filepath, $(this).html());
			$(this).after(
				$("<link></link>").attr({
					rel: "stylesheet",
					type: "text/css",
					href: filepath
				})
			);
			$(this).remove();
		});

		$("script:empty:not(.jsdom)").each(function (index) {
			console.log("[script] %s", $(this).attr("src"));
		});

		$("script:not(:empty)").each(function (index) {
			var filepath = "./js/" + self.codename + (index || "") + ".js";

			self.write_file(filepath, $(this).html());
			$(this).text("");
			$(this).attr("src", filepath);
		});

		$("script.jsdom").each(function (index) {
			$(this).remove();
		});

		self.write_file("./" + self.codename + ".html", [
			window.document.doctype,
			window.document.getElementsByTagName("html")[0].outerHTML
		].join("\n"));
	}], function (err, result) {
		if (err) { console.error(err); }
	});
};

// ファイル出力
JSGetIt.prototype.write_file = function (filepath, css, callback) {
	filepath = path.resolve(this.project_dir, filepath);
	console.log("[write] %s", filepath);
	fs.writeFile(filepath, css, "utf8", callback);
};


// ファイルをget (汎用)
JSGetIt.prototype.get = function (url, callback) {
	console.log("[get] %s", url);
	request.get(url, function (err, res, body) {
		callback(err, body);
	});
};


// ディレクトリを作成 (project_dir以下、複数パス対応)
JSGetIt.prototype.mkdir = function (dirs, callback) {
	if (!dirs.forEach) {
		this._mkdir(dirs, callback);
	}

	var self = this;
	var tasks = {};
	var paths = [];

	dirs.forEach(function (dir) {
		paths.push(path.resolve(self.project_dir, dir));
	});

	paths.forEach(function (dir) {
		tasks[dir] = _.filter(paths, function (item) {
			return (dir).indexOf(item) == 0 && dir != item;
		});
		tasks[dir].push(function (callback) {
			self._mkdir(dir, callback);
		});
	});

	async.auto(tasks, callback);
};

// ディレクトリを作成 (project_dir以下、ひとつだけ)
JSGetIt.prototype._mkdir = function (dir, callback) {
	// path.existsをはさみたい
	console.log("[mkdir] %s", dir);
	mkdirp(dir, 0755, callback);
};


module.exports = JSGetIt;