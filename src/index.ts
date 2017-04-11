import intermediate = require('./intermediate-format')

function main(swaggerDoc) {
    var source = intermediate.convert(swaggerDoc)
    return toString(source)
}
export = main

//"profissional" testing
import fs = require('fs')
try {
    let file = fs.readFileSync('./built/srctest.json')
    let parsed = JSON.parse(file.toString())
    let out = main(parsed)
    fs.writeFileSync('out.js', out)
} catch(err) {
    console.error(err)
}


function toString(source) : string {

    var out = ''
    Object.keys(source).forEach(key => {
        var item = source[key]
        var extend: string[] = []
        var stringified = JSON.stringify(item, (key, value) => {
            if (key === '__extends__') {
                extend = [...extend, ...value]
                return undefined
            }

            if (value.__type__) {
                let out = {
                    type: '@@' + value.__type__ + '@@'
                } as any
                //one liner
                if (isOneLiner(value)) {
                    return out.type
                }
                if (value.enum) out.enum = value.enum
                if (value.required) out.required = value.required
                return out
            }

            if (value.__reference__) {
                /*
                let out = {
                    type: '@@' + value.__reference__ + '@@'
                } as any
                //one liner
                if (isOneLiner(value)) {
                    return out.type
                }
                if (value.enum) out.enum = value.enum
                if (value.required) out.required = value.required
                return out
                */
                return '@@' + value.__reference__ + '@@'
            }

            if (value.__array__) {
                return [value.__array__]
            }

            return value
        }, 2)

        let replaced = stringified.replace(/"@@(.*?)@@"/g, "$1")
        if (extend.length) {
            replaced = `Object.assign({}, ${extend.join(',')}, ${replaced} )`
        }

        out += 'var ' + key + ' = ' + replaced + '\nexports.' + key + ' = ' + key + '\n\n'
    })

    return out

}


function isOneLiner(obj) {
    return Object.keys(obj).filter(key => {
        let item = obj[key]
        if (item === undefined) return false
        return true
    }).length === 1
}