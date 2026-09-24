const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { BuildStorageService } = require("../src/lib/build/storage.ts");
const { RenovationStorageService } = require("../src/lib/renovate/storage.ts");
const { FinanceStorageService } = require("../src/lib/finance/storage.ts");

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else delete globalThis.window;
});

function installStorage() {
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  } };
  return values;
}

test("project storage recovers corrupt data and preserves existing session keys", () => {
  const values = installStorage();
  for (const [feature, service] of [["build", BuildStorageService], ["renovate", RenovationStorageService]]) {
    const key = `huzaestate_${feature}_projects_v2`;
    values.set(key, "invalid json");
    assert.deepEqual(service.loadProjects(), []);
    values.set(key, '{"unexpected":"object"}');
    assert.deepEqual(service.loadProjects(), []);
    const projects = [{ id: "existing-project", title: "Preserved project" }];
    assert.equal(service.saveProjects(projects), true);
    assert.deepEqual(service.loadProjects(), projects);
    assert.deepEqual(JSON.parse(values.get(key)), projects);
    assert.equal(service.hasSeeded(), false);
    service.markSeeded();
    assert.equal(values.get(`huzaestate_${feature}_seeded_v2`), "true");
  }
});

test("unavailable storage fails safely without reseeding or throwing", () => {
  globalThis.window = {};
  Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage disabled"); } });
  for (const service of [BuildStorageService, RenovationStorageService, FinanceStorageService]) {
    assert.equal(service.isAvailable(), false);
    assert.equal(service.hasSeeded(), true);
    assert.doesNotThrow(() => service.markSeeded());
  }
  assert.deepEqual(BuildStorageService.loadProjects(), []);
  assert.deepEqual(RenovationStorageService.loadProjects(), []);
  assert.equal(FinanceStorageService.loadStore(), null);
  assert.equal(BuildStorageService.saveProjects([]), false);
  assert.equal(FinanceStorageService.saveStore({}), false);
});

test("quota errors do not replace the previous saved value", () => {
  const values = installStorage();
  const key = "huzaestate_finance_v2";
  const existing = { payments: [{ id: "payment-1" }] };
  values.set(key, JSON.stringify(existing));
  window.localStorage.setItem = () => { throw new Error("Quota exceeded"); };
  assert.equal(FinanceStorageService.saveStore({ payments: [] }), false);
  assert.deepEqual(FinanceStorageService.loadStore(), existing);
});
