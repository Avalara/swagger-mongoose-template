#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const path = require("path");
const generator = require("./index");
const fs = require("fs");
yargs.usage('Usage: mongtemplate <source.json> [<dest.js>]')
    .demand(1);
let [source, dest] = yargs.argv._;
dest = dest || path.parse(source).name + '.js';
let buffer = fs.readFileSync(path.resolve(source));
var parsed;
try {
    parsed = JSON.parse(buffer.toString());
}
catch (e) {
    console.error('Failed parsing the source json file.');
    process.exit(1);
}
let out = generator(parsed);
fs.writeFileSync(dest, out);
console.log('Fine!');
