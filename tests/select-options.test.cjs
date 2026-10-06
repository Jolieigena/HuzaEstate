const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { parseSelectChildren, textOf } = require("../src/components/shared/selectOptions.ts");

const h = React.createElement;

test("reads plain options, using the text as the value when none is given", () => {
  const options = parseSelectChildren([h("option", { key: 1, value: "" }, "Any status"), h("option", { key: 2 }, "Active"), h("option", { key: 3, value: 5 }, "Five")]);
  assert.deepEqual(options, [
    { value: "", label: "Any status", disabled: false, group: undefined },
    { value: "Active", label: "Active", disabled: false, group: undefined },
    { value: "5", label: "Five", disabled: false, group: undefined },
  ]);
});

test("flattens arrays from .map and fragments, and ignores non-options", () => {
  const mapped = ["a", "b"].map((v) => h("option", { key: v, value: v }, v.toUpperCase()));
  const options = parseSelectChildren([h("option", { key: "x", value: "" }, "None"), mapped, h(React.Fragment, { key: "f" }, h("option", { value: "c" }, "C")), h("div", { key: "d" }, "ignored"), null, false]);
  assert.deepEqual(options.map((o) => [o.value, o.label]), [["", "None"], ["a", "A"], ["b", "B"], ["c", "C"]]);
});

test("keeps optgroup labels on their options and honours disabled", () => {
  const options = parseSelectChildren([
    h("optgroup", { key: "g1", label: "Kigali City" }, h("option", { value: "Gasabo" }, "Gasabo"), h("option", { value: "Kicukiro", disabled: true }, "Kicukiro")),
    h("optgroup", { key: "g2", label: "Northern Province" }, h("option", { value: "Burera" }, "Burera")),
  ]);
  assert.deepEqual(options.map((o) => [o.value, o.group, o.disabled]), [["Gasabo", "Kigali City", false], ["Kicukiro", "Kigali City", true], ["Burera", "Northern Province", false]]);
});

test("joins mixed text and numbers in an option label", () => {
  assert.equal(textOf(["Up to ", 3, " posts"]), "Up to 3 posts");
  const [option] = parseSelectChildren(h("option", { value: "3" }, 3, " days"));
  assert.equal(option.label, "3 days");
});
