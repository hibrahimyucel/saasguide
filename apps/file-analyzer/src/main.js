"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var client_1 = require("react-dom/client");
var App_1 = require("./App");
var file_info_provider_1 = require("./file-info/file-info-provider");
require("./index.css"); // <-- Bu satırın burada olduğundan emin olun!
client_1.default.createRoot(document.getElementById("root")).render((0, jsx_runtime_1.jsx)(react_1.default.StrictMode, { children: (0, jsx_runtime_1.jsx)(file_info_provider_1.FileInfoProvider, { children: (0, jsx_runtime_1.jsx)(App_1.default, {}) }) }));
