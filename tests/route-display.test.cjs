const { test } = require("node:test");
const assert = require("node:assert/strict");
const { getRouteDisplay } = require("../src/lib/navigation/routeDisplay.ts");

test("public routes keep public navigation and footer", () => {
  for (const path of ["/", "/properties/some-listing-id", "/professionals", "/professionals/some-account-id", "/professional-tools", "/administrator", "/login/help"]) {
    assert.deepEqual(getRouteDisplay(path), { shell: "public", showFooter: true }, path);
  }
});

test("account and administration routes retain distinct shells", () => {
  for (const path of ["/dashboard", "/studio/build/new", "/professional/", "/professional/profile", "/execution/project-1", "/payments", "/invoices/1", "/contracts/1"]) {
    assert.deepEqual(getRouteDisplay(path), { shell: "account", showFooter: false }, path);
  }
  for (const path of ["/admin", "/admin/users", "/admin/properties"]) {
    assert.deepEqual(getRouteDisplay(path), { shell: "admin", showFooter: false }, path);
  }
});

test("the seller portal has its own shell without a footer", () => {
  assert.deepEqual(getRouteDisplay("/manager"), { shell: "manager", showFooter: false });
});

test("development and authentication pages keep the public shell without footer", () => {
  for (const path of ["/dev/worldlabs-test", "/login", "/signup", "/become-a-seller"]) {
    assert.deepEqual(getRouteDisplay(path), { shell: "public", showFooter: false }, path);
  }
});
