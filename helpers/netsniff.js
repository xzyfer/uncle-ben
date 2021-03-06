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
                cookies: request.cookies || [],
                headers: request.headers,
                queryString: [],
                headersSize: -1,
                bodySize: -1
            },
            response: {
                status: endReply.status,
                statusText: endReply.statusText,
                httpVersion: "HTTP/1.1",
                cookies: endReply.cookies || [],
                headers: endReply.headers,
                redirectURL: "",
                headersSize: -1,
                bodySize: startReply.bodySize,
                content: {
                    size: startReply.bodySize,
                    mimeType: endReply.contentType
                }
            },
            cache: {
                beforeRequest: null,
                afterRequest: null
            },
            timings: {
                blocked: 0,
                dns: -1,
                connect: -1,
                send: 0,
                wait: startReply.time - request.time,
                receive: endReply.time - startReply.time,
                ssl: -1
            }
            // rawRequest: request,
            // rawResponse: endReply
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
                    "onContentLoad": timings['contentLoadedTime'].getTime() - timings['startTime'].getTime(),
                    "onLoad": timings['endTime'].getTime() - timings['startTime'].getTime()
                }
            }],
            entries: entries
        }
    };
}

// take from the node module cookie.js
function parseCookie(str) {
    var obj = {}
    var pairs = str.split(/[;,] */);

    pairs.forEach(function(pair) {
        var eq_idx = pair.indexOf('=')
        var key = pair.substr(0, eq_idx).trim()
        var val = pair.substr(++eq_idx, pair.length).trim();

        // quoted values
        if ('"' == val[0]) {
            val = val.slice(1, -1);
        }

        // only assign once
        if (undefined == obj[key]) {
            val = val.replace(/\+/g, ' ');
            try {
                obj[key] = decodeURIComponent(val);
            } catch (err) {
                if (err instanceof URIError) {
                    obj[key] = val;
                } else {
                    throw err;
                }
            }
        }
    });

    return obj;
}

// take from the node module cookie.js
function serializeCookie(name, val, opt) {
    var pairs = [name + '=' + encodeURIComponent(val)];
    opt = opt || {};

    if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
    if (opt.domain) pairs.push('Domain=' + opt.domain);
    if (opt.path) pairs.push('Path=' + opt.path);
    if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
    if (opt.httpOnly) pairs.push('HttpOnly');
    if (opt.secure) pairs.push('Secure');

    return pairs.join('; ');
}

const PHANTOM_FUNCTION_PREFIX = '/* PHANTOM_FUNCTION */';
const PHANTOM_ARG_SEPARATOR = '/*+*/'; // obscure enough?

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

            page.evaluate(function(cookieMsg, separator, resId) {
                if(document.location.href !== 'about:blank') {
                    console.log([cookieMsg, document.cookie, resId].join(separator));
                }
            }, PHANTOM_FUNCTION_PREFIX + page.onCookie, PHANTOM_ARG_SEPARATOR, res.id);
        }
    };

    page.onInitialized = function() {
        page.evaluate(function(domContentLoadedMsg) {
            document.addEventListener('DOMContentLoaded', function() {
                console.log(domContentLoadedMsg);
            }, false);
        }, PHANTOM_FUNCTION_PREFIX + page.onDOMContentLoaded);
    };

    page.onConsoleMessage = function(msg) {
        if (msg.indexOf(PHANTOM_FUNCTION_PREFIX) === 0) {
            var parts = msg.split(PHANTOM_ARG_SEPARATOR);
            var args;

            // TODO: handle escapeing of " within arg strings
            if(parts.length > 1) {
                args = '"' + parts.slice(1).join('","') + '"';
            }

            eval('(' + parts[0] + ')(' + args + ')');
        } else {
            try {
                JSON.parse(msg);
                console.log(msg);
            } catch(err) { }
        }
    };

    page.onCookie = function(str, resId) {
        var cookies = [];

        var temp = parseCookie(str);
        for (var prop in temp) {
             cookies.push({ 'name' : prop, 'value' : temp[prop]})
        }

        page.resources[resId].endReply.cookies = cookies;
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
