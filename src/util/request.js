const { stringify } = require('querystring');
const { request: hs } = require('https');
const { request: h } = require('http');
const { parse } = require('url');
const { isObject, isFunction } = require('util');
const { Buffer } = require('buffer');

const webAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36';
const mobileAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1';

const defHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
};

module.exports = fetch;
module.exports.webAgent = webAgent;
module.exports.mobileAgent = mobileAgent;
module.exports.defaultContentType = defHeaders['Content-Type'];

function parseResBody(resBody, resType = '') {
    let result = resBody;
    if (resType.toLocaleLowerCase() === 'json') {
        try {
            const bodyStr = resBody.toString();
            result = JSON.parse(bodyStr);
        } catch (error) {
            // ...
        }
    }
    return result;
}

function getRequest(url = '') {
    const request = url.includes('https') ? hs : h;
    return request;
}

function isGet(options = {}) {
    const { method = 'GET' } = options;
    return method.toLocaleLowerCase() === 'get';
}

function computeOption(url, options = {}) {
    const { body = {}, headers = {}, method = 'GET', mobile = false, ...other } = options; // eslint-disable-line
    const bodyStr = isObject(body) ? stringify(body) : body;

    const urlParse = parse(url);
    const requestOptions = {
        ...urlParse,
        method: method.toLocaleUpperCase(),
        headers: {
            Origin: `${urlParse.protocol}//${urlParse.hostname}`,
            'User-Agent': mobile ? mobileAgent : webAgent,
            ...defHeaders,
            ...headers,
        },
    };

    if (isGet(options)) {
        if (bodyStr) {
        const { query = '', pathname, hostname, protocol, hash } = urlParse; // eslint-disable-line
            const q = query ? `${query}&${bodyStr}` : bodyStr;
            const s = `?${q}`;
            const p = `${pathname}${s}`;

            requestOptions.href = `${protocol}//${hostname}${p}${hash}`;
            requestOptions.query = q;
            requestOptions.search = s;
            requestOptions.path = p;
        }
    } else {
        requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    const finalOptions = {
        ...requestOptions,
        ...other,
        data: bodyStr,
    };
    return finalOptions;
}

function fetch(url, options = {}, callback) {
    if (isFunction(options)) {
        callback = options; // eslint-disable-line
        options = {}; // eslint-disable-line
    }

    const { data, resType, ...finalOptions } = computeOption(url, options);
    const request = getRequest(url);
    return new Promise((resolve, reject) => {
        let req = null;
        try {
            req = request(finalOptions);
        } catch (error) {
            reject(new Error({
                result: {
                    status: 400,
                    statusCode: 400,
                    message: "Connection failed.",
                },
                error
            }))
        }
        
        req.on("response", (res) => {
            let resBody = Buffer.alloc(0);
            const result = {
                status: res.statusCode,
                statusCode: res.statusCode,
                message: res.statusMessage,
                headers: res.headers,
            };
            res.on('data', (chunk) => {
                resBody = Buffer.concat([resBody, chunk]);
            });
            res.on('end', () => {
                result.body = parseResBody(resBody, resType);
                if (callback) {
                    callback(result);
                }
                resolve(result);
            });
            res.on('error', (error) => {
                reject(new Error({
                    result,
                    error,
                }));
            });
        });
        if (!isGet(finalOptions) && data) {
            req.write(data);
        }
        req.end();
        req.on('error', (error) => {
            reject(new Error(error));
        });
    });
}

