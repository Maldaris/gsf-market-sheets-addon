/* jshint esversion:5 */

var GSF_BASE_ROUTE = "https://goonmetrics.apps.goonswarm.org/api/";

function parserFactory(spec, callback) {
    var specPath = spec.split('/');
    return function (body) {
        body = XmlService.parse(body);
        var root = body.getRootElement();
        if (root.getName() !== specPath[0]) {
            return callback(true, "Root element does not match path.");
        } else if (specPath.length === 1) {
            return callback(false, root.getText());
        } else {
            var specMatch = function (node, spec) {
                if (spec.name !== node.getName()) return false;
                var attrs = node.getAttributes();
                var specAttrs = Object.keys(spec);
                specAttrs.splice(specAttrs.indexOf('name'));
                for (var i = 0; i < specAttrs.length; i++) {
                    if(attrs.indexOf(specAttrs[i]) === -1){
                        return false;
                    }
                    if(attrs[attrs.indexOf(specAttrs[i]) !== spec[specAttrs[i]]]){
                        return false
                    }
                }
                return true;
            };
            var decompose = function (pathstring) {
                if (pathstring.indexOf(':') === -1) {
                    return {
                        name: pathstring
                    };
                } else {
                    var dat = pathstring.split(':');
                    var ret = {
                        name: dat[0]
                    };
                    var selectorArray = dat[1]
                        .replace('[', '')
                        .replace(']', '')
                        .split(',');
                    for (var i = 0; i < selectorArray.length; i++) {
                        kv = selectorArray[i].split('=');
                        ret[kv[0]] = kv[1];
                    }
                    return ret;
                }
            };
            var collect = function (node, seg) {
                var name = decompose(seg[0]);
                if (!specMatch(node, name)) {
                    return [];
                }
                if (seg.length === 1) {
                    Logger.log('leaf node(' + node.getName() + '): ' + node.getText());
                    return [node.getText()];
                } else {
                    var childSpec = decompose(seg[1]);
                    var children = node.getChildren(childSpec.name);
                    children.filter(function (e) {
                        return specMatch(e, childSpec);
                    });
                    var ret = [];
                    if (children.length === 0) {
                        return callback(true, 'No child nodes matching: ' + seg[1]);
                    }
                    for (var i = 0; i < children.length; i++) {
                        var leaves = collect(children[i], seg.slice(1));
                        if (leaves.length !== 0)
                            ret = ret.concat(leaves);
                    }
                    Logger.log("From node(" + node.getName() + "): " + ret);
                    return ret;
                }
            };

            var ret = [];
            var childSpec = decompose(specPath[1]);
            var nodes = root.getChildren();
            if (nodes.length === 0) {
                return callback(true, "No child nodes matching: " + specPath[1]);
            }
            for (var i = 0; i < nodes.length; i++) {
                ret = ret.concat(collect(nodes[i], specPath.slice(1)));
            }
            return callback(false, ret);
        }
    };
}

function querystring(obj) {
    var ret = '?';
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        if (Array.isArray(obj[keys[i]])) {
            ret += "" + keys[i] + "=" + obj[keys[i]].map(function (e) {
                return e.toString();
            }).join(',');
        } else {
            ret += "" + keys[i] + "=" + obj[keys[i]];
        }
        ret += (i + 1 === keys.length ? "" : "&");
    }
    return ret;
}

function gsf_make_request(route, params, parser) {
    var result = parser(UrlFetchApp.fetch(GSF_BASE_ROUTE + route + querystring(params)));
    Logger.log("got result for query(" + route + querystring(params) + "):" + result);
    return result;
}

function gsf_price_by_id(id, type, stationid) {
    if (stationid === undefined) {
        stationid = '1022734985679'; //1dq
    }
    var ROUTE_SUFFIX = "price_data/";
    var xmlSpec = 'goonmetrics/price_data/type:[id=' +
        id + ']/' +
        type + '/' +
        (type === 'buy' ? 'max' : 'min');
    Logger.log("getting relevant data for path: " + xmlSpec);
    var parser = parserFactory(xmlSpec, function (err, res) {
        if (err) throw new Error(res);
        Logger.log("got result from callback: " + res);
        return res;
    });
    return gsf_make_request(ROUTE_SUFFIX, {
        'station_id': stationid,
        'type_id': id
    }, parser);
}

function gsf_price_by_id_test() {
    Logger.log("result: " + gsf_price_by_id('34', 'sell'));
}

function querystring_test() {
    Logger.log(querystring({
        stationid: '60003760',
        'type_id': '34'
    }));
}