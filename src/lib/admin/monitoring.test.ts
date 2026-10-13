import assert from "node:assert/strict";
import test from "node:test";
import { formatErrorRatio, formatLatency, formatRate, parseMonitoringStatus, severityRank } from "./monitoring";

const valid = {
  generatedAt: "2026-10-13T10:00:00Z",
  overall: "healthy",
  services: [{ name: "api-gateway", status: "up", latencyMs: 12, httpStatus: 200, error: null }],
  prometheus: { configured: true, reachable: true, alerts: [], requestRate: 1, errorRatio: 0 },
  grafanaUrl: null,
};

test("parseMonitoringStatus accepts the API shape", () => {
  assert.equal(parseMonitoringStatus(valid)?.overall, "healthy");
});

test("parseMonitoringStatus rejects an error body or unknown verdict instead of showing it as healthy", () => {
  assert.equal(parseMonitoringStatus(null), null);
  assert.equal(parseMonitoringStatus({ error: "Administrator access required." }), null);
  assert.equal(parseMonitoringStatus({ ...valid, overall: "fine" }), null);
  assert.equal(parseMonitoringStatus({ ...valid, services: "nope" }), null);
  assert.equal(parseMonitoringStatus({ ...valid, prometheus: { configured: true } }), null);
});

test("latency and rate formatting distinguish idle from not measured", () => {
  assert.equal(formatLatency(12.4), "12 ms");
  assert.equal(formatLatency(1450), "1.5 s");
  assert.equal(formatLatency(null), "–");
  assert.equal(formatRate(null), "Not measured");
  assert.equal(formatRate(0), "No traffic");
  assert.equal(formatRate(0.03), "<0.1 req/s");
  assert.equal(formatRate(12.34), "12.3 req/s");
  assert.equal(formatErrorRatio(null), "No traffic");
  assert.equal(formatErrorRatio(0), "0.0%");
  assert.equal(formatErrorRatio(0.0004), "0.04%");
  assert.equal(formatErrorRatio(0.123), "12.3%");
});

test("severityRank orders critical before warning before info", () => {
  assert.ok(severityRank("critical") < severityRank("warning"));
  assert.ok(severityRank("warning") < severityRank("info"));
  assert.ok(severityRank("info") < severityRank("mystery"));
});
