/* eslint-disable no-undef */
/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

import fdir from "fdir";
import fs from "fs";

const api = new fdir().withFullPaths().crawl("./../models");

// get all files in a directory synchronously
const files = api.sync();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FITLER service.xml FILES

const PATTERN = /\.json$/;

const ROW_MODELS = files.filter((str) => {
    return PATTERN.test(str);
});

const allIds = []
const allData = [];
const mygraph = {
    links: [],
    nodes: []
}

// const service_files = JSON.stringify(ROW_MODELS);
// console.log(service_files);
let groupNum = 0
const foreignTables = []

// const allidfun = () => {
ROW_MODELS.forEach((file, index) => {
    // console.log("file -> ", file)
    const fileContent = fs.readFileSync(file)
    const readableContent = JSON.stringify(JSON.parse(fileContent))
    const uObject = JSON.parse(readableContent.replace(/-/g, "_").replace(/\$/g, "field"));
    // console.log("namespace -> ", namespace)
    const entity = uObject.service_builder.entity

    entity.forEach(table => {
        const tableLongReference = table.field.name || false // table ref
        table.column.forEach((attr) => {
            const attrLongName = attr.field.name
            // const attrDbName = attr.field.db_name || "no-dbname"
            const isAttrPrimary = attr.field.primary
            // const isForeignKey = finalArray.includes(attrLongName) ? true : false

            if (attrLongName.indexOf("Id") > -1 && isAttrPrimary) {
                // all primary keys
                allIds.push({
                    // attrLongName
                    key: attrLongName,
                    table: tableLongReference
                })
            }

            let tar;
            Object.keys(allIds).forEach(key => {
                if (allIds[key].key === attrLongName) {
                    tar = allIds[key].table
                    foreignTables.push(tar)
                }
            });

            
        })
    })
})
// }
// allidfun()

// console.log("allids ->", allIds)

// fs.writeFileSync("./allIds.json", JSON.stringify(allIds), (err) => {
//     err ? console.log(err) : console.log("Output saved to /allIds.json");
// });
const finalArray = allIds.map( obj => obj.key);
// const tablesArray = allIds.map(obj => obj.table);
// var counts = [];
// const i = 1
// foreignTables.forEach((x) => {
//     counts.push({
//         count: (x || 0) + 1,
//         tablename: x
//     })
// });
// console.log(counts)
const result = Object.values(foreignTables.reduce((c, v) => {
    c[v] = c[v] || [v, 0];
    c[v][1]++;
    return c;
}, {})).map(o => ({
    key: o[1],
    table: o[0],
}));
console.log("result ->", result);


// console.log("finalArray", finalArray)

ROW_MODELS.forEach((file, index) => {
        const fileContent = JSON.parse(fs.readFileSync(file))
        const readableContent = JSON.stringify(fileContent)
        const uObject = readableContent.replace(/-/g, "_").replace(/\$/g, "field")
        // console.log("namespace -> ", namespace)
        const entity = JSON.parse(uObject).service_builder.entity

        entity.forEach(table => {
            const tableLongReference = table.field.name || false // table ref
            table.column.forEach((attr) => {
                const attrLongName = attr.field.name
                const isForeignKey = finalArray.includes(attrLongName) ? true : false

                // let tar;
                // Object.keys(foreignTables).forEach(key => {

                // })
                let tar;

                Object.keys(allIds).forEach(key => {
                    // Object.keys(result).forEach(kk => {
                    
                        if (allIds[key].key === attrLongName) {
                            tar = allIds[key].table
                            // console.log(result[tar])
                            result.forEach(ee => {
                                if (ee.table === tar) {
                                    mygraph.links.push({
                                        source: tableLongReference,
                                        target: isForeignKey ? tar : "no-tar",
                                        value: ee.key
                                    })
                                }
                            })
                            
                            // foreignTables.push(tar)
                            // console.log(allIds[key].table);
                        }
                    // })

                });
        })
    })
})


ROW_MODELS.forEach((file, index) => {
    // console.log("file -> ", file)
    const fileContent = JSON.parse(fs.readFileSync(file))
    const readableContent = JSON.stringify(fileContent)
    const uObject = readableContent.replace(/-/g, "_").replace(/\$/g, "field")
    // console.log("namespace -> ", namespace)
    const entity = JSON.parse(uObject).service_builder.entity    

    entity.forEach(table => {
        const tableReference = table.field.table || false // table ref
        // console.log("tableReference -> ", tableReference)
        const tableLongReference = table.field.name || false // table ref
        // console.log(tableLongReference)
        
        const node = {
            items: [],
            tableLongReference,
            tableReference
        }
        
        table.column.forEach( attr => {
            const attrType = attr.field.type || "no-type" // type
            const attrLongName = attr.field.name
            const attrDbName = attr.field.db_name || "no-dbname"
            const isAttrPrimary = attr.field.primary ? true : false
            
            const isForeignKey = finalArray.includes(attrLongName) ? true : false
            // console.log(`field name: ${attrType},\ field type: ${attrType},\ field primary: ${isAttrPrimary}`)
            node.items.push({
                attrDbName,
                attrLongName,
                attrType,
                isAttrPrimary,
                isForeignKey,
                tableReference: tableReference || "none"
            })

            // object keys

        })

        mygraph.nodes.push({
            group: groupNum,
            id: tableLongReference
        })

        allData.push(node)

    })

    groupNum++

    fs.writeFileSync("./../db-schema.json", JSON.stringify(allData), (err) => {
        err ? console.log(err) : console.log("Output saved to /db-schema.json");
    });

    fs.writeFileSync("./../my-schema-nodes.json", JSON.stringify(mygraph), (err) => {
        err ? console.log(err) : console.log("Output saved to /my-schema-nodes.json")
    });

})

