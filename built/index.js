"use strict";
const intermediate = require("./intermediate-format");
const depGraphModule = require("dependency-graph");
function main(swaggerDoc) {
    var source = intermediate.convert(swaggerDoc);
    return toString(source);
}
//"professional" testing
const fs = require("fs");
if (process.env.NODE_ENV === 'test') {
    try {
        let file = fs.readFileSync('./built/srctest.json');
        let parsed = JSON.parse(file.toString());
        let out = main(parsed);
        fs.writeFileSync('out.js', out);
    }
    catch (err) {
        console.error(err);
    }
}
function toString(source) {
    let depGraph = new depGraphModule.DepGraph();
    var out = {};
    Object.keys(source).forEach(key => {
        let deps = new Set();
        var item = source[key];
        var extend = [];
        var stringified = JSON.stringify(item, (key, value) => {
            if (key === '__extends__') {
                value.forEach(v => deps.add(v));
                extend = [...extend, ...value];
                return undefined;
            }
            if (value.__type__) {
                let out = {
                    type: '@@' + value.__type__ + '@@'
                };
                //one liner
                if (isOneLiner(value)) {
                    return out.type;
                }
                if (value.enum)
                    out.enum = value.enum;
                if (value.required)
                    out.required = value.required;
                return out;
            }
            if (value.__reference__) {
                deps.add(value.__reference__);
                return '@@' + value.__reference__ + '@@';
            }
            if (value.__array__) {
                return [value.__array__];
            }
            return value;
        }, 2);
        let replaced = stringified.replace(/"@@(.*?)@@"/g, "$1");
        if (extend.length) {
            replaced = `Object.assign({}, ${extend.join(',')}, ${replaced} )`;
        }
        out[key] = {
            text: 'var ' + key + ' = ' + replaced + '\nexports.' + key + ' = ' + key + '\n\n',
            deps: Array.from(deps)
        };
    });
    Object.keys(out).forEach(key => depGraph.addNode(key));
    Object.keys(out).forEach(key => {
        let item = out[key];
        item.deps.forEach(dep => depGraph.addDependency(key, dep));
    });
    let order = depGraph.overallOrder();
    return order.reduce((concat, key) => {
        concat += out[key].text;
        return concat;
    }, '');
}
function isOneLiner(obj) {
    return Object.keys(obj).filter(key => {
        let item = obj[key];
        if (item === undefined)
            return false;
        return true;
    }).length === 1;
}
module.exports = main;
