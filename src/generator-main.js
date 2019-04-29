/**
 * Created by zy on 2018/3/14.
 */
const util = require("util");
const fs = require("fs");
const path = require("path");
const writeFile = require("util").promisify(fs.writeFile);
const xtpl = require("xtpl");
const xt = require('xtemplate');
// const request = require("request")
// const req = util.promisify(request);
// const http = require("http");

xtpl.config({
    encoding: 'utf-8',
    xt
})

const sequelizeSchema = async (jsonData, tableName = "testTableName", typesName = "types") => {

    const mapper = {
        string: typesName + ".STRING",
        // number: typesName + ".NUMBER",
        number: typesName + ".INTEGER",
        boolean: typesName + ".BOOLEAN",
        time: typesName + ".DATE",
        double: typesName + ".DOUBLE"
    }

    let hasId = false;
    const schemaData = {}
    Object.keys(jsonData).map(row => schemaData[row] = {});
    if (jsonData["id"]) {
        schemaData["id"] = {
            primaryKey: true,
        }
        hasId = true;
    }
    for (const prop in jsonData) {
        const type = typeof jsonData[prop]
        console.info(prop, type)
        if (!hasId && prop.indexOf("id") > -1) {
            schemaData[prop] = {
                primaryKey: true,
            }
        }
        if (type === true || type === false) {
            schemaData[prop] = Object.assign(schemaData[prop], {
                type: mapper.boolean,
                defaultValue: type,
                comment: prop
            })
        } else if (jsonData[prop] === "true") {
            schemaData[prop] = Object.assign(schemaData[prop], {
                type: mapper.boolean,
                defaultValue: true,
                comment: prop
            })
        } else if (jsonData[prop] === "false") {
            schemaData[prop] = Object.assign(schemaData[prop], {
                type: mapper.boolean,
                defaultValue: false,
                comment: prop
            })
        } else if (type === 'string') {
            const bigLength = jsonData[prop].length > 0 ? jsonData[prop].length * 10 : 100;
            const match = ["create", "update"].filter(word => word.indexOf(prop) > -1)
            if (match && match.length > 0) {
                try {
                    const date = new Date(jsonData[prop])
                    console.warn(date);
                    schemaData[prop] = Object.assign(schemaData[prop], {
                        type: mapper.time,
                        defaultValue: '"' + jsonData[prop] + '"',
                        comment: prop
                    })
                } catch (e) {
                    console.error("生成schema失败", e);
                    schemaData[prop] = Object.assign(schemaData[prop], {
                        type: mapper.string + "(" + bigLength + ")",
                        defaultValue: '"' + jsonData[prop].replace("\n", "") + '"',
                        comment: prop
                    })
                }
            } else {
                schemaData[prop] = Object.assign(schemaData[prop], {
                    type: mapper.string + "(" + bigLength + ")",
                    defaultValue: '"' + jsonData[prop].replace("\n", "") + '"',
                    comment: prop
                })
            }
        } else if (type === 'number') {
            if (jsonData[prop] - parseInt(jsonData[prop]) !== 0) {
                schemaData[prop] = Object.assign(schemaData[prop], {
                    type: mapper.double,
                    defaultValue: jsonData[prop],
                    comment: prop
                })
            } else {
                schemaData[prop] = Object.assign(schemaData[prop], {
                    type: mapper[type],
                    defaultValue: jsonData[prop],
                    comment: prop
                })
            }
        } else
            schemaData[prop] = Object.assign(schemaData[prop], {
                type: mapper[type],
                defaultValue: '"' + jsonData[prop] + '"',
                comment: prop
            })
    }
    console.info(schemaData);
    const renderFile = util.promisify(xtpl.renderFile);
    let content = await renderFile(__dirname + "/sequelize_template.xtpl", {
        name: tableName,
        schema: schemaData,
        typesName
    }).catch(e => e)
    if (content instanceof Error) {
        return console.error("bulkCreate" + content)
    }
    content = content.replace(/&quot;/g, '"')
    console.error(content);
    return writeFile(path.resolve(process.cwd(), "resources", tableName + "-entity.js"), content)
}


module.exports = sequelizeSchema;