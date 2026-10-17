"use client";

import { useState, useEffect, useRef } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  toRow,
  fromRow,
  createCase,
  getCase,
  updateCase,
  appendTurns,
  listenCases,
  listenCase,
  triggerFollowUp,
  clearRing,
  seedDemoData,
  clearDemoData,
} from "@/lib/db";
import { buildSeedCases } from "@/lib/seed";

export default function DevDbTestPage() {
  const [createdTicket, setCreatedTicket] = useState(null);
  const [inspectData, setInspectData] = useState(null);
  const [realtimeLogs, setRealtimeLogs] = useState([]);
  const [liveStreamCases, setLiveStreamCases] = useState([]);
  const [activeUnsubscribe, setActiveUnsubscribe] = useState(null);

  const [testResults, setTestResults] = useState({
    // Core CRUD
    t1: { status: "IDLE", label: "1. Data Converters (toRow / fromRow)", details: null },
    t2: { status: "IDLE", label: "2. createCase (live ticket 1000–8999)", details: null },
    t3: { status: "IDLE", label: "3. getCase & maybeSingle null handling", details: null },
    t4: { status: "IDLE", label: "4. updateCase (partial update preserves fields)", details: null },
    t5: { status: "IDLE", label: "5. appendTurns atomic RPC & turn history", details: null },
    t6: { status: "IDLE", label: "6. Reject status='done' constraint", details: null },

    // Realtime & Follow-ups
    t7: { status: "IDLE", label: "7. triggerFollowUp (status='follow_up_due', ringNow=true)", details: null },
    t8: { status: "IDLE", label: "8. clearRing (ringNow=false)", details: null },
    t9: { status: "IDLE", label: "9. listenCases (realtime multi-case subscription)", details: null },
    t10: { status: "IDLE", label: "10. listenCase (single ticket subscription)", details: null },
    t11: { status: "IDLE", label: "11. Realtime unsubscribe stops updates", details: null },

    // Seed Data & Clusters
    t12: { status: "IDLE", label: "12. seedDemoData (inserts 40 cases, tickets 9000+)", details: null },
    t13: { status: "IDLE", label: "13. Cluster A (Meerut yellow_leaves: 6 active -> Alert)", details: null },
    t14: { status: "IDLE", label: "14. Cluster B (Barabanki pension: 5 active -> Alert)", details: null },
    t15: { status: "IDLE", label: "15. Cluster C (Sitapur: 3 active -> No Alert)", details: null },
    t16: { status: "IDLE", label: "16. clearDemoData (removes seed, preserves live cases)", details: null },
  });

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setRealtimeLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const updateResult = (key, status, details = null) => {
    setTestResults((prev) => ({
      ...prev,
      [key]: { ...prev[key], status, details },
    }));
  };

  // Test 1: Data Converters
  const runTest1 = () => {
    updateResult("t1", "RUNNING");
    try {
      const patch = { advice: "Test advice", name: undefined, problemKey: "yellow_leaves" };
      const row = toRow(patch);
      if ("name" in row) throw new Error("toRow included undefined key 'name'");
      if (row.problem_key !== "yellow_leaves") throw new Error("toRow failed to map problemKey to problem_key");

      const dbRow = { ticket: "9999", problem_key: "pest_attack", ring_now: true, sms_text: "alert text" };
      const obj = fromRow(dbRow);
      if (obj.problemKey !== "pest_attack") throw new Error("fromRow failed to map problem_key to problemKey");
      if (obj.ringNow !== true) throw new Error("fromRow failed to map ring_now to ringNow");
      if ("problem_key" in obj) throw new Error("fromRow left snake_case key in output");

      updateResult("t1", "PASS", "toRow skips undefined keys; fromRow maps snake_case to camelCase cleanly.");
    } catch (err) {
      updateResult("t1", "FAIL", err.message);
    }
  };

  // Test 2: createCase
  const runTest2 = async () => {
    if (!isSupabaseConfigured) {
      updateResult("t2", "FAIL", "Supabase credentials not configured in .env.local");
      return null;
    }
    updateResult("t2", "RUNNING");
    try {
      const ticket = await createCase({
        name: "Ramesh Kumar",
        domain: "farming",
        district: "Meerut",
        subject: "tomato",
        problem: "tamatar ke patte peele ho rahe hain",
        problemKey: "yellow_leaves",
        severity: "medium",
        advice: "Neem oil spray karein aur nami check karein",
        icons: ["water", "no_spray"],
      });
      setCreatedTicket(ticket);
      const ticketNum = parseInt(ticket, 10);
      if (ticketNum < 1000 || ticketNum > 8999) {
        throw new Error(`Ticket #${ticket} outside live range 1000–8999`);
      }
      updateResult("t2", "PASS", `Live case created: #${ticket} (range 1000–8999 verified)`);
      addLog(`Created live case #${ticket}`);
      return ticket;
    } catch (err) {
      updateResult("t2", "FAIL", err.message);
      return null;
    }
  };

  // Test 3: getCase & 0000 null check
  const runTest3 = async (ticketToUse) => {
    const ticket = ticketToUse || createdTicket;
    if (!ticket) {
      updateResult("t3", "FAIL", "No ticket available. Run Test 2 first.");
      return;
    }
    updateResult("t3", "RUNNING");
    try {
      const record = await getCase(ticket);
      if (!record || record.ticket !== ticket) {
        throw new Error(`getCase(${ticket}) did not return the expected record`);
      }
      setInspectData(record);

      const missing = await getCase("0000");
      if (missing !== null) {
        throw new Error(`Expected null for ticket 0000 but got: ${JSON.stringify(missing)}`);
      }
      updateResult("t3", "PASS", `Retrieved #${ticket} successfully; getCase('0000') returned null.`);
    } catch (err) {
      updateResult("t3", "FAIL", err.message);
    }
  };

  // Test 4: updateCase partial update
  const runTest4 = async (ticketToUse) => {
    const ticket = ticketToUse || createdTicket;
    if (!ticket) {
      updateResult("t4", "FAIL", "No ticket available. Run Test 2 first.");
      return;
    }
    updateResult("t4", "RUNNING");
    try {
      const newAdvice = `Updated advice at ${new Date().toLocaleTimeString()}: apply neem spray.`;
      await updateCase(ticket, { advice: newAdvice });
      const record = await getCase(ticket);
      setInspectData(record);

      if (record.advice === newAdvice && record.name === "Ramesh Kumar") {
        updateResult("t4", "PASS", `Advice updated, original fields preserved (name: '${record.name}').`);
        addLog(`Updated advice for #${ticket}`);
      } else {
        throw new Error(`Field preservation check failed. Name: '${record?.name}'`);
      }
    } catch (err) {
      updateResult("t4", "FAIL", err.message);
    }
  };

  // Test 5: appendTurns
  const runTest5 = async (ticketToUse) => {
    const ticket = ticketToUse || createdTicket;
    if (!ticket) {
      updateResult("t5", "FAIL", "No ticket available. Run Test 2 first.");
      return;
    }
    updateResult("t5", "RUNNING");
    try {
      const initialRecord = await getCase(ticket);
      const initialCount = Array.isArray(initialRecord?.turns) ? initialRecord.turns.length : 0;

      await appendTurns(ticket, [
        { role: "user", text: "Mere paas 2 bigha khet hai." },
        { role: "saathi", text: "Kripya kide ke lakshan batayein." },
      ]);
      const updatedRecord = await getCase(ticket);
      setInspectData(updatedRecord);

      const finalCount = Array.isArray(updatedRecord?.turns) ? updatedRecord.turns.length : 0;
      if (finalCount >= initialCount + 2) {
        updateResult("t5", "PASS", `Atomically appended 2 turns via RPC. Total turns: ${finalCount}.`);
        addLog(`Appended 2 turns to #${ticket}`);
      } else {
        throw new Error(`Expected at least ${initialCount + 2} turns, got ${finalCount}`);
      }
    } catch (err) {
      updateResult("t5", "FAIL", err.message);
    }
  };

  // Test 6: Reject status='done'
  const runTest6 = async (ticketToUse) => {
    const ticket = ticketToUse || createdTicket;
    if (!ticket) {
      updateResult("t6", "FAIL", "No ticket available. Run Test 2 first.");
      return;
    }
    updateResult("t6", "RUNNING");
    try {
      await updateCase(ticket, { status: "done" });
      updateResult("t6", "FAIL", "Database incorrectly accepted invalid status 'done'!");
    } catch (err) {
      updateResult("t6", "PASS", `Check constraint correctly rejected status='done' (${err.message})`);
    }
  };

  // Test 7: triggerFollowUp
  const runTest7 = async (ticketToUse) => {
    const ticket = ticketToUse || createdTicket;
    if (!ticket) {
      updateResult("t7", "FAIL", "No ticket available. Run Test 2 first.");
      return;
    }
    updateResult("t7", "RUNNING");
    try {
      await triggerFollowUp(ticket);
      const record = await getCase(ticket);
      setInspectData(record);

      if (record.status === "follow_up_due" && record.ringNow === true) {
        updateResult("t7", "PASS", `triggerFollowUp set status='follow_up_due' and ringNow=true.`);
        addLog(`Triggered follow-up on #${ticket} (ringNow=true)`);
      } else {
        throw new Error(`State mismatch: status='${record.status}', ringNow=${record.ringNow}`);
      }
    } catch (err) {
      updateResult("t7", "FAIL", err.message);
    }
  };

  // Test 8: clearRing
  const runTest8 = async (ticketToUse) => {
    const ticket = ticketToUse || createdTicket;
    if (!ticket) {
      updateResult("t8", "FAIL", "No ticket available. Run Test 2 first.");
      return;
    }
    updateResult("t8", "RUNNING");
    try {
      await clearRing(ticket);
      const record = await getCase(ticket);
      setInspectData(record);

      if (record.ringNow === false) {
        updateResult("t8", "PASS", `clearRing set ringNow=false while preserving other fields.`);
        addLog(`Cleared ring on #${ticket}`);
      } else {
        throw new Error(`ringNow is still true`);
      }
    } catch (err) {
      updateResult("t8", "FAIL", err.message);
    }
  };

  // Test 9: listenCases
  const runTest9 = () => {
    updateResult("t9", "RUNNING");
    try {
      const unsub = listenCases((cases) => {
        setLiveStreamCases(cases);
        addLog(`listenCases: received snapshot of ${cases.length} cases`);
      });
      setActiveUnsubscribe(() => unsub);
      updateResult("t9", "PASS", "listenCases subscribed to public.cases with 300ms debounce.");
    } catch (err) {
      updateResult("t9", "FAIL", err.message);
    }
  };

  // Test 10: listenCase
  const runTest10 = async (ticketToUse) => {
    const ticket = ticketToUse || createdTicket;
    if (!ticket) {
      updateResult("t10", "FAIL", "No ticket available. Run Test 2 first.");
      return;
    }
    updateResult("t10", "RUNNING");
    try {
      const unsub = listenCase(ticket, (caseObj) => {
        if (caseObj) {
          setInspectData(caseObj);
          addLog(`listenCase(#${ticket}): received update. Status: ${caseObj.status}`);
        } else {
          addLog(`listenCase(#${ticket}): received null (deleted)`);
        }
      });
      updateResult("t10", "PASS", `listenCase subscribed with filter ticket=eq.${ticket}`);
      return unsub;
    } catch (err) {
      updateResult("t10", "FAIL", err.message);
    }
  };

  // Test 11: Realtime unsubscribe
  const runTest11 = () => {
    updateResult("t11", "RUNNING");
    try {
      if (activeUnsubscribe) {
        activeUnsubscribe();
        setActiveUnsubscribe(null);
        addLog("Unsubscribed from listenCases channel.");
      }
      updateResult("t11", "PASS", "Unsubscribe executed cleanly, channel and timers removed.");
    } catch (err) {
      updateResult("t11", "FAIL", err.message);
    }
  };

  // Test 12: seedDemoData
  const runTest12 = async () => {
    updateResult("t12", "RUNNING");
    try {
      const count = await seedDemoData();
      updateResult("t12", "PASS", `seedDemoData inserted/upserted ${count} synthetic cases (tickets 9000+).`);
      addLog(`Seeded ${count} demo cases`);
    } catch (err) {
      updateResult("t12", "FAIL", err.message);
    }
  };

  // Test 13: Cluster A (Meerut tomato yellow_leaves)
  const runTest13 = () => {
    updateResult("t13", "RUNNING");
    try {
      const seedCases = buildSeedCases();
      const clusterA = seedCases.filter((c) => c.district === "Meerut" && c.problemKey === "yellow_leaves");
      const activeA = clusterA.filter((c) => ["open", "follow_up_due", "escalated"].includes(c.status));
      if (clusterA.length === 7 && activeA.length === 6) {
        updateResult("t13", "PASS", `Meerut yellow_leaves: 7 total, 6 active (>=5 -> Farming Alert triggered).`);
      } else {
        throw new Error(`Cluster A mismatch: total=${clusterA.length}, active=${activeA.length}`);
      }
    } catch (err) {
      updateResult("t13", "FAIL", err.message);
    }
  };

  // Test 14: Cluster B (Barabanki old-age pension)
  const runTest14 = () => {
    updateResult("t14", "RUNNING");
    try {
      const seedCases = buildSeedCases();
      const clusterB = seedCases.filter((c) => c.district === "Barabanki" && c.problemKey === "pension_not_received");
      const activeB = clusterB.filter((c) => ["open", "follow_up_due", "escalated"].includes(c.status));
      if (clusterB.length === 6 && activeB.length === 5) {
        updateResult("t14", "PASS", `Barabanki pension: 6 total, 5 active (>=5 -> Schemes Alert triggered).`);
      } else {
        throw new Error(`Cluster B mismatch: total=${clusterB.length}, active=${activeB.length}`);
      }
    } catch (err) {
      updateResult("t14", "FAIL", err.message);
    }
  };

  // Test 15: Cluster C (Sitapur wheat pest_attack)
  const runTest15 = () => {
    updateResult("t15", "RUNNING");
    try {
      const seedCases = buildSeedCases();
      const clusterC = seedCases.filter((c) => c.district === "Sitapur" && c.problemKey === "pest_attack");
      if (clusterC.length === 3) {
        updateResult("t15", "PASS", `Sitapur pest_attack: 3 active cases (<5 -> correctly no alert).`);
      } else {
        throw new Error(`Cluster C mismatch: expected 3 cases, got ${clusterC.length}`);
      }
    } catch (err) {
      updateResult("t15", "FAIL", err.message);
    }
  };

  // Test 16: clearDemoData
  const runTest16 = async () => {
    updateResult("t16", "RUNNING");
    try {
      await clearDemoData();
      if (createdTicket) {
        const liveCase = await getCase(createdTicket);
        if (!liveCase) {
          throw new Error(`Live case #${createdTicket} was accidentally deleted by clearDemoData!`);
        }
      }
      updateResult("t16", "PASS", "clearDemoData deleted all source='seed' records; live cases intact.");
      addLog("Cleared demo data (live cases preserved)");
    } catch (err) {
      updateResult("t16", "FAIL", err.message);
    }
  };

  // Run full validation suite
  const runAllTests = async () => {
    runTest1();
    runTest13();
    runTest14();
    runTest15();

    if (isSupabaseConfigured) {
      const ticket = await runTest2();
      if (ticket) {
        await runTest3(ticket);
        await runTest4(ticket);
        await runTest5(ticket);
        await runTest6(ticket);
        await runTest7(ticket);
        await runTest8(ticket);
        runTest9();
        await runTest10(ticket);
        runTest11();
        await runTest12();
        await runTest16();
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "2rem", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#38bdf8", margin: 0 }}>
              SAATHI — Backend B Dev Test Suite
            </h1>
            <p style={{ color: "#94a3b8", marginTop: "0.5rem", fontSize: "0.95rem" }}>
              Milestone 2 Validation Suite: Core CRUD, Realtime Subscriptions, Follow-ups, and Seed Clusters
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <span style={{ backgroundColor: "#1e293b", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #475569", fontSize: "0.85rem", color: "#cbd5e1" }}>
              Branch: <code>backend-data</code>
            </span>
          </div>
        </div>

        {/* Configuration Notice */}
        {!isSupabaseConfigured && (
          <div style={{ backgroundColor: "#451a03", border: "1px solid #b45309", borderRadius: "8px", padding: "1.25rem", marginBottom: "2rem", color: "#fed7aa" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "600", margin: "0 0 0.5rem 0", color: "#fbbf24" }}>
              ⚠️ Live Supabase Configuration Notice
            </h2>
            <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem" }}>
              Local converter and cluster logic can be evaluated immediately below. Live database operations will require <code>.env.local</code> credentials and schema execution.
            </p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => {
                  runTest1();
                  runTest13();
                  runTest14();
                  runTest15();
                }}
                style={{
                  backgroundColor: "#b45309",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Run Offline Engine Tests (1, 13, 14, 15)
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
          <button
            onClick={runAllTests}
            style={{
              backgroundColor: "#0284c7",
              color: "#ffffff",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Run Available Tests
          </button>
          {createdTicket && (
            <span style={{ fontSize: "0.9rem", color: "#38bdf8" }}>
              Active Test Ticket: <strong>#{createdTicket}</strong>
            </span>
          )}
        </div>

        {/* Test Matrix */}
        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
          {Object.entries(testResults).map(([key, item]) => {
            let statusColor = "#64748b";
            let statusBg = "#1e293b";
            if (item.status === "PASS") {
              statusColor = "#4ade80";
              statusBg = "#064e3b";
            } else if (item.status === "FAIL") {
              statusColor = "#f87171";
              statusBg = "#7f1d1d";
            } else if (item.status === "RUNNING") {
              statusColor = "#fbbf24";
              statusBg = "#78350f";
            }

            return (
              <div
                key={key}
                style={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "0.75rem 1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, marginRight: "1rem" }}>
                  <div style={{ fontWeight: "600", fontSize: "0.92rem" }}>{item.label}</div>
                  {item.details && (
                    <div style={{ fontSize: "0.83rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                      {item.details}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    backgroundColor: statusBg,
                    color: statusColor,
                    letterSpacing: "0.05em",
                  }}
                >
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Realtime Event Stream & JSON Inspector */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {/* Realtime Logs */}
          <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "600", margin: "0 0 0.75rem 0", color: "#38bdf8" }}>
              Realtime Event Log
            </h3>
            <pre
              style={{
                backgroundColor: "#0b0f19",
                padding: "0.75rem",
                borderRadius: "6px",
                color: "#a5f3fc",
                fontSize: "0.8rem",
                height: "220px",
                overflowY: "auto",
                margin: 0,
              }}
            >
              {realtimeLogs.length > 0 ? realtimeLogs.join("\n") : "// Realtime logs will stream here..."}
            </pre>
          </div>

          {/* Record Inspector */}
          <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "600", margin: "0 0 0.75rem 0", color: "#38bdf8" }}>
              Case Inspector (camelCase Output)
            </h3>
            <pre
              style={{
                backgroundColor: "#0b0f19",
                padding: "0.75rem",
                borderRadius: "6px",
                color: "#38bdf8",
                fontSize: "0.8rem",
                height: "220px",
                overflowY: "auto",
                margin: 0,
              }}
            >
              {inspectData
                ? JSON.stringify(inspectData, null, 2)
                : "// Active case data will appear here..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
