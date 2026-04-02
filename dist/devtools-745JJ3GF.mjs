import { createRequire as __$$createRequire } from "module"; const require = __$$createRequire(import.meta.url);
import {
  wrapper_default
} from "./chunk-WCZB74EQ.mjs";

// node_modules/ink/build/devtools-window-polyfill.js
var customGlobal = global;
customGlobal.WebSocket ||= wrapper_default;
customGlobal.window ||= global;
customGlobal.self ||= global;
customGlobal.window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = [
  {
    // ComponentFilterElementType
    type: 1,
    // ElementTypeHostComponent
    value: 7,
    isEnabled: true
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: "InternalApp",
    isEnabled: true,
    isValid: true
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: "InternalAppContext",
    isEnabled: true,
    isValid: true
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: "InternalStdoutContext",
    isEnabled: true,
    isValid: true
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: "InternalStderrContext",
    isEnabled: true,
    isValid: true
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: "InternalStdinContext",
    isEnabled: true,
    isValid: true
  },
  {
    // ComponentFilterDisplayName
    type: 2,
    value: "InternalFocusContext",
    isEnabled: true,
    isValid: true
  }
];

// node_modules/ink/build/devtools.js
import devtools from "react-devtools-core";
devtools.initialize();
devtools.connectToDevTools();
