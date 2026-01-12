import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api/api";
import TimerBox from "./TimerBox";
import SupervisorModal from "./SupervisorModal";

import en from "../locales/en.json";
import fr from "../locales/fr.json";
import ar from "../locales/ar.json";

function getCurrentCycleInfo(now = new Date()) {
  const hour = now.getHours();
  const cycleHour = hour - (hour % 2);
  const cycleStart = new Date(now);
  cycleStart.setHours(cycleHour, 0, 0, 0);
  const cycleEnd = new Date(cycleStart);
  cycleEnd.setHours(cycleStart.getHours() + 2);

  const cyclesSinceMidnight = Math.floor(cycleStart.getHours() / 2);
  const colors = ["Blue", "Green", "Yellow", "Red"];
  const color = colors[cyclesSinceMidnight % colors.length];

  let shift = "Shift3";
  if (hour >= 6 && hour < 14) shift = "Shift1";
  else if (hour >= 14 && hour < 22) shift = "Shift2";

  return { cycleStart, cycleEnd, color, shift };
}

export default function MachinePage({ operator, machine, onLogout }) {
  // Logs state
  const [logsRefreshing, setLogsRefreshing] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [pendingLogId, setPendingLogId] = useState(null);

  // Buttons state
  const [operatorPressed, setOperatorPressed] = useState(false);
  const [supervisorPressed, setSupervisorPressed] = useState(false);

  // Languages dictionary
  const languages = [localStorage.getItem("lang"),"EN", "FR", "AR"];
  const dictMap = { EN: en, FR: fr, AR: ar };

  const [langIndex, setLangIndex] = useState(0);
  const currentLang = languages[langIndex];
  const t = dictMap[currentLang]; // translation object

  const handleLangClick = () =>
    setLangIndex((prev) => (prev + 1) % languages.length);

  // Timer
  const [timeNow, setTimeNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { cycleStart, cycleEnd, color, shift } = getCurrentCycleInfo(timeNow);

  // 🔥 stable value
  const cycleId = cycleStart.getTime(); // number (milliseconds)
  useEffect(() => {
    // New 2h cycle → reset buttons
    setOperatorPressed(false);
    setSupervisorPressed(false);
    setPendingLogId(null);
  }, [cycleId]);
  


  const getStatusForPress = (now, cycleStart) => {
    return now - cycleStart <= 10 * 60 * 1000 ? "OK" : "DELAY";
  };

  const handleOperatorPress = async () => {
    try {
      const now = new Date();
      const status = getStatusForPress(now, cycleStart);
      const payload = {
        machine_id: machine.machine_id,
        operator_id: operator.operator_id,
        color,
        status,
        shift,
        cycle_start_time: cycleStart,
        cycle_end_time: cycleEnd,
      };

      const res = await api.post("/logs", payload);

      setOperatorPressed(true);
      setPendingLogId(res.data.log_id || null);
      await refreshLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSupervisor = () => setShowSupervisorModal(true);

  const handleSupervisorClosed = (confirmed) => {
    setShowSupervisorModal(false);
    setPendingLogId(null);
  
    if (confirmed) {
      setSupervisorPressed(true); // 🔥 THIS triggers re-render
    }
  };

  
    
  

  return (
    <div className="dashboard">
      {/* BRAND */}
      <div className="logo-flag">
        <div className="logo"></div>
        <div className="flag"></div>
      </div>

      {/* TOP BAR */}
      <header className="top-bar blue-glass">
        <div className="top-bar-container">
          <div className="top-item">
            <span className="label">{t.operator}</span>
            <strong>{operator.name}</strong>
          </div>

          <div className="top-item">
            <span className="label">{t.machine}</span>
            <strong>{machine.code}</strong>
          </div>

          <div className="top-item">
            <span className="label">{t.shift}</span>
            <strong>{shift}</strong>
          </div>
        </div>

        <div className="top-btn">
          <div className="select-lang" onClick={handleLangClick}>
            <span className="lang">{currentLang}</span>
          </div>
          <button className="btn logout" onClick={onLogout}>
            {t.logout}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="main-panel">
        {/* STATUS CARD */}
        <section className="status-card blue-glass">
          <div className="status-left">
            <div className="color_label">
              <h3>{t.current_color}</h3>
              <div className={`color-${color.toLowerCase()}`}></div>
            </div>
            <div className={`needle-color-${color.toLowerCase()} circular-needle` }></div>
          </div>

          <div className="status-right">
            <TimerBox
              cycleStart={cycleStart}
              cycleEnd={cycleEnd}
              timeNow={timeNow}
            />
          </div>
        </section>

        {/* ACTIONS */}
        <section className="action-card blue-glass">
          {/* Operator button */}
          <button
            className={`btn big ${
              operatorPressed ? "btn-success" : "primary"
            }`}
            onClick={handleOperatorPress}
            disabled={operatorPressed}
          >
            {operatorPressed ? t.needle_changed : t.i_changed_needle}
          </button>

          {/* Supervisor */}
          <button
            className={`btn big ${
              supervisorPressed
                ? "btn-success"
                : operatorPressed
                ? "btn-attention"
                : "outline"
            }`}
            onClick={handleOpenSupervisor}
            disabled={!operatorPressed || supervisorPressed} 
          >
            {supervisorPressed ? t.supervisor_verified : t.supervisor_confirm}
          </button>

          {logsRefreshing && (
            <p className="muted center">{t.refreshing_logs}</p>
          )}
        </section>
      </main>

      {/* SUPERVISOR MODAL */}
      {showSupervisorModal && (
        <SupervisorModal
          logId={pendingLogId}
          machineId={machine.machine_id}
          onClose={handleSupervisorClosed}
        />
      )}
    </div>
  );
}
