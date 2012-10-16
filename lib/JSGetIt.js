// load modules
var path    = require('path'),
    fs      = require('fs'),
    url     = require('url'),

// load npm modules
    async   = require('async'),
    request = require('request'),
    _       = require('underscore'),
    jsdom   = require('jsdom'),
    mkdirp  = require('mkdirp');

// 定数
var JSDOIT_BASEURL = 'http://jsrun.it/';

// JSGetIt jsdo.itのcodeを読み込み、使いやすいファイル分割を行って保存
var JSGetIt = function (url) {
	console.log(url);

	if (url.match(/^https?:\/\/jsdo\.it\/(.*)$/)) {
		this.url = JSDOIT_BASEURL + RegExp.$1;
	} else if (url.match(/^http/)) {
		this.url = url;
	} else {
		this.url = JSDOIT_BASEURL + url;
	}

	this.codename = this.url.split('/').pop();

	this.htmlName = 'index';
	this.jsName = this.codename;
	this.cssName = this.codename;
};

// this.urlからcodeをダウンロードして保存
JSGetIt.prototype.download = function (path) {
	var self = this;
	var outputDir = (path || './' + this.codename) + '/';

	async.waterfall([function (callback) {
		self.mkdir([
			outputDir,
			outputDir + 'js',
			outputDir + 'css'
		], callback);
	},function (res, callback) {
		self.get(self.url, callback);
	}, function (body, callback) {
		jsdom.env({
			html: body,
			scripts: [
				'http://code.jquery.com/jquery-1.8.0.min.js',
				'http://sfcclip.net/js/photofade.js'
			],
			done: callback
		});
	}, function(window) {
		var $ = window.$;
		$('style').each(function (index) {
			var filepath = 'css/' + self.cssName + (index || '') + '.css';

			self.writeFile(
				outputDir + filepath,
				$(this).html()
			);
			$(this).after(
				$('<link></link>').attr({
					rel: 'stylesheet',
					type: 'text/css',
					href: filepath
				})
			);
			$(this).remove();
		});

		$('script:empty:not(.jsdom)').each(function (index) {
			var $element = $(this);

			if ($element.attr('src').match(/^\/\//)) {
				$element.attr('src', 'http:' + $element.attr('src'))
			}

			if ($element.attr('src').match(/^https?:\/\//)) {
				return;
			}

			var outputPath = 'js/' + (
				$element.attr('src')
					.slice(1)
					.replace(/\/js$/, '')
					.replace(/\//g, '_')
			) + '.js';

			self.downloadLibrary($element.attr('src'), outputDir + outputPath);
			$element.attr('src', outputPath);
		});

		$('script:not(:empty)').each(function (index) {
			var filepath = 'js/' + self.jsName + (index || '') + '.js';

			self.writeFile(
				outputDir + filepath,
				$(this).html()
			);
			$(this).text('');
			$(this).attr('src', filepath);
		});

		$('script.jsdom').each(function (index) {
			$(this).remove();
		});

		self.writeFile(
			outputDir + self.htmlName + '.html',
			[
				window.document.doctype,
				window.document.getElementsByTagName('html')[0].outerHTML
			].join('\n')
		);
	}], function (err, result) {
		if (err) { console.error(err); }
	});
};

var Downloader = function (projectDir) {

};

// ファイル出力
JSGetIt.prototype.writeFile = function (filepath, content, callback) {
	console.log('[write] %s', filepath);
	fs.writeFile(filepath, content, 'utf8', callback);
};


// ファイルをget (汎用)
JSGetIt.prototype.get = function (url, callback) {
	console.log('[get] %s', url);
	request.get(url, function (err, res, body) {
		callback(err, body);
	});
};

JSGetIt.prototype.downloadLibrary = function (libpath, outputPath, callback) {
	callback = callback || function () {};

	var self = this;

	this.get(JSDOIT_BASEURL + libpath, function (err, res) {
		self.writeFile(
			outputPath, res, function (err, res) {
				callback(err, outputPath);
			}
		);
	});
};


// ディレクトリを作成
JSGetIt.prototype.mkdir = function (dirs, callback) {
	if (!dirs.forEach) {
		this._mkdir(dirs, callback);
	}

	var self = this;
	var tasks = {};

	dirs.forEach(function (dir) {
		tasks[dir] = _.filter(dirs, function (item) {
			return (dir).indexOf(item) == 0 && dir != item;
		});
		tasks[dir].push(function (callback) {
			self._mkdir(dir, callback);
		});
	});

	async.auto(tasks, callback);
};

// ディレクトリを作成
JSGetIt.prototype._mkdir = function (dir, callback) {
	// path.existsをはさみたい
	console.log('[mkdir] %s', dir);
	mkdirp(dir, 0755, callback);
};

module.exports = JSGetIt;