const { test } = require("node:test");
const assert = require("node:assert/strict");
const { getRouteDisplay } = require("../src/lib/navigation/routeDisplay.ts");

test("public and professional application routes keep public navigation and footer", () => {
  for (const path of ["/", "/properties/prop-1", "/professionals/apply", "/professional-tools", "/administrator", "/login/help"]) {
    assert.deepEqual(getRouteDisplay(path), { shell: "public", showFooter: true }, path);
  }
});

test("account and administration routes retain distinct shells", () => {
  for (const path of ["/dashboard", "/studio/build/new", "/professional/", "/execution/project-1", "/payments", "/invoices/1", "/contracts/1"]) {
    assert.deepEqual(getRouteDisplay(path), { shell: "account", showFooter: false }, path);
  }
  assert.deepEqual(getRouteDisplay("/admin/listings"), { shell: "admin", showFooter: false });
});

test("manager, development, and authentication pages keep public shell without footer", () => {
  for (const path of ["/manager", "/dev/worldlabs-test", "/login", "/signup", "/become-a-seller"]) {
    assert.deepEqual(getRouteDisplay(path), { shell: "public", showFooter: false }, path);
  }
});
