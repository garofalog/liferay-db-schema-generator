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
import rimraf from "rimraf";
import xml2js from "xml2js";
// the builder
const parser = new xml2js.Parser();
const PATH_AND_NAMES = []

let fol = ""

try {
    let obj = JSON.parse(fs.readFileSync('./project-path.json'))
    fol = obj[0].choices
} catch (err) { console.log(err) }


// get all files list in a directory synchronously
const files = new fdir()
    .withFullPaths()
    .crawl(fol)
    .sync();

// filter service.xml from all files array paths list - excluding META-INF/service.xml files
const PATTERN = /service\.xml$/;
const SERVICES_PATHS_LIST = files
    .filter(str => PATTERN.test(str))
    .filter(nometa => nometa.indexOf("META") === -1)
// console.log("SERVICES_PATHS_LIST -> ", SERVICES_PATHS_LIST)

const createPathList = async () => {
    SERVICES_PATHS_LIST.forEach((el) => {
        var re = new RegExp("(?<=" + fol + "/)(.*)?(?=/service.xml)");
        const tempname = el.match(re);

        PATH_AND_NAMES.push({
            filename: tempname[0].replace(/\//g, "_"),
            path: tempname.input
        })
    });
}

const clearStuff = async () => {
    try {

        // create file path_and_names.json to map filenames and paths of service.xml
        fs.unlink("./path_and_names.json")
        fs.writeFileSync("./../path_and_names.json", JSON.stringify(PATH_AND_NAMES), (err) => {
            err ? console.log(err) : console.log("Output saved to /path_and_names.json")
        })
        // remove and recreate /models folder
        rimraf.sync("./../models");
        fs.mkdirSync("./../models");

    } catch (err) {console.error(err)}
}

const allInOne = async () => {
    try {
        // add converted json files in /models folder
        PATH_AND_NAMES.forEach((el) => {
            let resultA = ""
            fs.readFile(el.path, (err, data) => {
                if (err) throw err;
                parser.parseString(data, (err, result) => {
                    if (err) throw err;
                    resultA = JSON.stringify(result);
                    fs.writeFileSync(`./../models/${el.filename}.json`, resultA, (err) => {
                        err ? console.log(err) : console.log("Output saved to " + el.filename + ".json");
                    });
                    console.log(el.filename + ': Done');
                });
            });
        });
    } catch (err) {
        console.error(err)
    }
}


const main = async () => {
        const a = await createPathList()
        const b = await clearStuff()
        const c = await allInOne()
}

main()