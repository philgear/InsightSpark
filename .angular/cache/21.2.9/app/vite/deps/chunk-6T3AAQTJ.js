import {
  getConfig2
} from "./chunk-7EV7D32N.js";
import {
  __name
} from "./chunk-577WJDXA.js";
import {
  select_default
} from "./chunk-36YID3VH.js";

// node_modules/mermaid/dist/chunks/mermaid.core/chunk-WU5MYG2G.mjs
var selectSvgElement = __name((id) => {
  const { securityLevel } = getConfig2();
  let root = select_default("body");
  if (securityLevel === "sandbox") {
    const sandboxElement = select_default(`#i${id}`);
    const doc = sandboxElement.node()?.contentDocument ?? document;
    root = select_default(doc.body);
  }
  const svg = root.select(`#${id}`);
  return svg;
}, "selectSvgElement");

export {
  selectSvgElement
};
//# sourceMappingURL=chunk-6T3AAQTJ.js.map
