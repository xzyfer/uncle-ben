if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function () {
        function pad(n) { return n < 10 ? '0' + n : n; }
        function ms(n) { return n < 10 ? '00'+ n : n < 100 ? '0' + n : n }
        return this.getFullYear() + '-' +
            pad(this.getMonth() + 1) + '-' +
            pad(this.getDate()) + 'T' +
            pad(this.getHours()) + ':' +
            pad(this.getMinutes()) + ':' +
            pad(this.getSeconds()) + '.' +
            ms(this.getMilliseconds()) + 'Z';
    }
}

function createHAR(address, title, timings, resources)
{
    var entries = [];

    resources.forEach(function (resource) {
        var request = resource.request,
            startReply = resource.startReply,
            endReply = resource.endReply;

        if (!request || !startReply || !endReply) {
            return;
        }

        entries.push({
            startedDateTime: request.time.toISOString(),
            time: endReply.time - request.time,
            request: {
                method: request.method,
                url: request.url,
                httpVersion: "HTTP/1.1",
                cookies: [],
                headers: request.headers,
                queryString: [],
                headersSize: -1,
                bodySize: -1
            },
            response: {
                status: endReply.status,
                statusText: endReply.statusText,
                httpVersion: "HTTP/1.1",
                cookies: [],
                headers: endReply.headers,
                redirectURL: "",
                headersSize: -1,
                bodySize: startReply.bodySize,
                content: {
                    size: startReply.bodySize,
                    mimeType: endReply.contentType
                }
            },
            cache: {},
            timings: {
                blocked: 0,
                dns: -1,
                connect: -1,
                send: 0,
                wait: startReply.time - request.time,
                receive: endReply.time - startReply.time,
                ssl: -1
            }
        });
    });

    return {
        log: {
            version: '1.2',
            creator: {
                name: "PhantomJS",
                version: phantom.version.major + '.' + phantom.version.minor +
                    '.' + phantom.version.patch
            },
            pages: [{
                startedDateTime: timings['startTime'].toISOString(),
                id: address,
                title: title,
                pageTimings: {
                    "onContentLoad": timings['contentLoadedTime'].getTime(),
                    "onLoad": timings['endTime'].getTime()
                }
            }],
            entries: entries
        }
    };
}

// HACK: remove when upgrading to phantom js 1.6
// source: http://stackoverflow.com/a/9838239/233633
function evaluate(page, func) {
    var args = [].slice.call(arguments, 2);
    var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
    return page.evaluate(fn);
}

const PHANTOM_FUNCTION_PREFIX = '/* PHANTOM_FUNCTION */';

var page = require('webpage').create(),
    system = require('system'),
    timings = {};

if (system.args.length === 1) {
    console.log('Usage: netsniff.coffee <some URL>');
    phantom.exit(1);
} else {

    page.address = system.args[1];
    page.resources = [];

    page.onLoadStarted = function () {
        timings.startTime = new Date();
    };

    page.onResourceRequested = function (req) {
        page.resources[req.id] = {
            request: req,
            startReply: null,
            endReply: null
        };
    };

    page.onResourceReceived = function (res) {
        if (res.stage === 'start') {
            page.resources[res.id].startReply = res;
        }
        if (res.stage === 'end') {
            page.resources[res.id].endReply = res;
        }
    };

    page.onInitialized = function() {
        // use page evaluate when upgraded to phantomjs 1.6
        // source: https://gist.github.com/2475509/84e42ef8ce630680e373510f808f958354bf98f2
        evaluate(page, function(domContentLoadedMsg) {
            document.addEventListener('DOMContentLoaded', function() {
                console.log(domContentLoadedMsg);
            }, false);
        }, PHANTOM_FUNCTION_PREFIX + page.onDOMContentLoaded);
    };

    page.onConsoleMessage = function(msg) {
        if (msg.indexOf(PHANTOM_FUNCTION_PREFIX) === 0) {
            eval('(' + msg + ')()');
        } else {
            console.log(msg);
        }
    };

    page.onDOMContentLoaded = function() {
        timings.contentLoadedTime = new Date();
    };

    page.open(page.address, function (status) {
        // onload
        timings.endTime = new Date();

        var har;
        if (status !== 'success') {
            console.log('FAIL to load the address');
        } else {
            page.title = page.evaluate(function () {
                return document.title;
            });

            har = createHAR(page.address, page.title, timings, page.resources);
            console.log(JSON.stringify(har, undefined, 4));
        }
        phantom.exit();
    });
}
