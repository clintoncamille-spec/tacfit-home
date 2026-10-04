// This app has no module system — every js/*.js file is a plain <script> tag
// sharing one global scope (see CLAUDE.md). vm.runInThisContext runs source
// the same way a top-level <script> does, so top-level `function`/`const`
// declarations attach to the real Node global object without editing the
// app files themselves.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadGlobal(relPath) {
  const fullPath = path.join(__dirname, "..", relPath);
  const code = fs.readFileSync(fullPath, "utf8");
  vm.runInThisContext(code, { filename: fullPath });
}

module.exports = { loadGlobal };
