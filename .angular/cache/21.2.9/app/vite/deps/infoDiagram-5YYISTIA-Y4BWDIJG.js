import {
  parse
} from "./chunk-S5HXKLLA.js";
import "./chunk-MOA2IXYA.js";
import "./chunk-XRGSIJVE.js";
import "./chunk-J5TLH7X4.js";
import "./chunk-GEAH2BPF.js";
import "./chunk-DNNHVSND.js";
import "./chunk-SBWTRJPL.js";
import "./chunk-ICZCGJIU.js";
import "./chunk-DOPMVZ6Y.js";
import "./chunk-YU2573OJ.js";
import "./chunk-ELHU3LZM.js";
import "./chunk-WWPGVH6Q.js";
import {
  selectSvgElement
} from "./chunk-6T3AAQTJ.js";
import {
  configureSvgSize
} from "./chunk-7EV7D32N.js";
import {
  __name,
  log
} from "./chunk-577WJDXA.js";
import "./chunk-36YID3VH.js";
import "./chunk-46DXP6YY.js";

// node_modules/mermaid/dist/chunks/mermaid.core/infoDiagram-5YYISTIA.mjs
var parser = {
  parse: __name(async (input) => {
    const ast = await parse("info", input);
    log.debug(ast);
  }, "parse")
};
var DEFAULT_INFO_DB = {
  version: "11.15.0" + (true ? "" : "-tiny")
};
var getVersion = __name(() => DEFAULT_INFO_DB.version, "getVersion");
var db = {
  getVersion
};
var draw = __name((text, id, version) => {
  log.debug("rendering info diagram\n" + text);
  const svg = selectSvgElement(id);
  configureSvgSize(svg, 100, 400, true);
  const group = svg.append("g");
  group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
}, "draw");
var renderer = { draw };
var diagram = {
  parser,
  db,
  renderer
};
export {
  diagram
};
//# sourceMappingURL=infoDiagram-5YYISTIA-Y4BWDIJG.js.map
