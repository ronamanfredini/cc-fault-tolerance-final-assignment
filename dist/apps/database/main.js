/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./libs/utils/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/utils/src/lib/utils.ts"), exports);


/***/ }),

/***/ "./libs/utils/src/lib/utils.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.saveJson = exports.readJson = void 0;
//@ts-ignore
const fs = __webpack_require__("fs");
function readJson(path) {
    const content = fs.readFileSync(path, 'utf-8');
    return JSON.parse(content);
}
exports.readJson = readJson;
function saveJson(path, data) {
    fs.writeFileSync(path, JSON.stringify(data));
}
exports.saveJson = saveJson;


/***/ }),

/***/ "express":
/***/ ((module) => {

module.exports = require("express");

/***/ }),

/***/ "tslib":
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),

/***/ "fs":
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "path":
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
const utils_1 = __webpack_require__("./libs/utils/src/index.ts");
const express = __webpack_require__("express");
const path = __webpack_require__("path");
const fs = __webpack_require__("fs");
const app = express();
app.use(express.json());
const dbBasePaths = path.resolve('datastore');
const thisDbDatastore = path.join(dbBasePaths, process.env.DB_FILE);
function createDatastore() {
    const datastores = fs.readdirSync(dbBasePaths);
    const hasDatastoreCreated = datastores.indexOf(process.env.DB_FILE);
    if (hasDatastoreCreated === -1) {
        fs.writeFileSync(thisDbDatastore, '[]');
    }
}
createDatastore();
function getRecordFromId(id) {
    const data = (0, utils_1.readJson)(thisDbDatastore);
    return data.find((record) => record.id == id);
}
function getAllRecords() {
    return (0, utils_1.readJson)(thisDbDatastore);
}
app.get('/:id', (req, res) => {
    const retrievedData = getRecordFromId(req.params.id);
    res.send(retrievedData);
});
app.post('/', (req, res) => {
    const data = req.body;
    const allRecords = getAllRecords();
    data.id = allRecords.length;
    allRecords.push(data);
    (0, utils_1.saveJson)(thisDbDatastore, allRecords);
    res.send({ message: 'Saved' });
});
app.patch('/:id', (req, res) => {
    const data = req.body;
    const record = getRecordFromId(req.params.id);
    if (!record) {
        res.send('Record not found');
    }
    const newRecord = Object.assign(Object.assign({}, record), data);
    const allRecords = getAllRecords();
    allRecords[req.params.id] = newRecord;
    (0, utils_1.saveJson)(thisDbDatastore, allRecords);
    res.send({ message: 'Saved' });
});
app.delete('/:id', (req, res) => {
    const allRecords = getAllRecords();
    console.log(req.params.id);
    let recordIndex = -1;
    allRecords.forEach((record, idx) => {
        if (record.id == req.params.id) {
            recordIndex = idx;
        }
    });
    if (recordIndex === -1) {
        return res.send('Record not found');
    }
    allRecords.splice(recordIndex, 1);
    (0, utils_1.saveJson)(thisDbDatastore, allRecords);
    res.send({ message: 'Deleted' });
});
const port = process.env.port || 3333;
const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);

})();

var __webpack_export_target__ = exports;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=main.js.map