"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "@prisma/client/runtime/client":
/*!************************************************!*\
  !*** external "@prisma/client/runtime/client" ***!
  \************************************************/
/***/ ((module) => {

module.exports = require("@prisma/client/runtime/client");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("net");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("tls");

/***/ }),

/***/ "tty":
/*!**********************!*\
  !*** external "tty" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("tty");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs":
/*!*******************************************************************************!*\
  !*** external "@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs");;

/***/ }),

/***/ "@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs":
/*!*******************************************************************************************!*\
  !*** external "@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs" ***!
  \*******************************************************************************************/
/***/ ((module) => {

module.exports = import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");;

/***/ }),

/***/ "pg":
/*!*********************!*\
  !*** external "pg" ***!
  \*********************/
/***/ ((module) => {

module.exports = import("pg");;

/***/ }),

/***/ "node:buffer":
/*!******************************!*\
  !*** external "node:buffer" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:buffer");

/***/ }),

/***/ "node:path":
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),

/***/ "node:url":
/*!***************************!*\
  !*** external "node:url" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("node:url");

/***/ }),

/***/ "(instrument)/./src/instrumentation.ts":
/*!********************************!*\
  !*** ./src/instrumentation.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\nasync function register() {\n    if (true) {\n        try {\n            const { initServerNotificationWorker } = await Promise.all(/*! import() */[__webpack_require__.e(\"vendor-chunks/@prisma\"), __webpack_require__.e(\"vendor-chunks/postgres-array\"), __webpack_require__.e(\"vendor-chunks/tailwind-merge\"), __webpack_require__.e(\"vendor-chunks/clsx\"), __webpack_require__.e(\"vendor-chunks/asn1.js\"), __webpack_require__.e(\"vendor-chunks/web-push\"), __webpack_require__.e(\"vendor-chunks/jws\"), __webpack_require__.e(\"vendor-chunks/debug\"), __webpack_require__.e(\"vendor-chunks/inherits\"), __webpack_require__.e(\"vendor-chunks/https-proxy-agent\"), __webpack_require__.e(\"vendor-chunks/ecdsa-sig-formatter\"), __webpack_require__.e(\"vendor-chunks/agent-base\"), __webpack_require__.e(\"vendor-chunks/safer-buffer\"), __webpack_require__.e(\"vendor-chunks/safe-buffer\"), __webpack_require__.e(\"vendor-chunks/ms\"), __webpack_require__.e(\"vendor-chunks/minimalistic-assert\"), __webpack_require__.e(\"vendor-chunks/jwa\"), __webpack_require__.e(\"vendor-chunks/http_ece\"), __webpack_require__.e(\"vendor-chunks/buffer-equal-constant-time\"), __webpack_require__.e(\"vendor-chunks/bn.js\"), __webpack_require__.e(\"_instrument_src_lib_serverWorker_ts\")]).then(__webpack_require__.bind(__webpack_require__, /*! @/lib/serverWorker */ \"(instrument)/./src/lib/serverWorker.ts\"));\n            initServerNotificationWorker();\n        } catch (err) {\n            console.error(\"[Instrumentation] Failed to initialize server notification worker:\", err);\n        }\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vc3JjL2luc3RydW1lbnRhdGlvbi50cyIsIm1hcHBpbmdzIjoiOzs7O0FBQU8sZUFBZUE7SUFDcEIsSUFBSUMsSUFBcUMsRUFBRTtRQUN6QyxJQUFJO1lBQ0YsTUFBTSxFQUFFRyw0QkFBNEIsRUFBRSxHQUFHLE1BQU0sZ3RDQUE0QjtZQUMzRUE7UUFDRixFQUFFLE9BQU9DLEtBQUs7WUFDWkMsUUFBUUMsS0FBSyxDQUFDLHNFQUFzRUY7UUFDdEY7SUFDRjtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY29uc2lzdGVuY3ktZGFzaGJvYXJkLy4vc3JjL2luc3RydW1lbnRhdGlvbi50cz80ZmFiIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWdpc3RlcigpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5FWFRfUlVOVElNRSA9PT0gXCJub2RlanNcIikge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IGluaXRTZXJ2ZXJOb3RpZmljYXRpb25Xb3JrZXIgfSA9IGF3YWl0IGltcG9ydChcIkAvbGliL3NlcnZlcldvcmtlclwiKTtcbiAgICAgIGluaXRTZXJ2ZXJOb3RpZmljYXRpb25Xb3JrZXIoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJbSW5zdHJ1bWVudGF0aW9uXSBGYWlsZWQgdG8gaW5pdGlhbGl6ZSBzZXJ2ZXIgbm90aWZpY2F0aW9uIHdvcmtlcjpcIiwgZXJyKTtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJyZWdpc3RlciIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1JVTlRJTUUiLCJpbml0U2VydmVyTm90aWZpY2F0aW9uV29ya2VyIiwiZXJyIiwiY29uc29sZSIsImVycm9yIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(instrument)/./src/instrumentation.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(instrument)/./src/instrumentation.ts"));
module.exports = __webpack_exports__;

})();