var url     = require("url"),
    path    = require("path"),
    fs      = require("fs"),
    mkdirp  = require("mkdirp"),
    jsdom   = require("jsdom"),
    request = require("request");

var JSDOIT_BASEURL = "http://jsrun.it/";

var JSGetIt = function (username, codename) {
	this.username = username;
	this.codename = codename;

	this.url = url.resolve(JSDOIT_BASEURL, username + "/" + codename);
};

JSGetIt.prototype.download = function () {
	var self = this;
	var dirname = path.resolve(this.username + "-" + this.codename);


	console.log("[%s]", this.url);

	request.get(self.url, function (err, res, body) {
		jsdom.env({
			html: body,
			scripts: [
				'http://code.jquery.com/jquery-1.8.0.min.js'
			],
			done: function(errors, window) {
				var $ = window.$;
				$("script").each(function () {
					console.log($(this).html());
				});
				console.log($("title").html());

			}
		});
	});

	// mkdirp(dirname, 0755, function () {
	// 	request(self.url).pipe(
	// 		fs.createWriteStream(path.join(dirname, "index.html"))
	// 	);
	// });
};

module.exports = JSGetIt;