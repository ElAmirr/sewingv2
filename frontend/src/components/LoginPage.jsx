import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import en from "../locales/en.json";
import fr from "../locales/fr.json";
import ar from "../locales/ar.json";

export default function LoginPage({ onLogin }) {
  const [badge, setBadge] = useState("");
  const [machines, setMachines] = useState([]);
  const [machineId, setMachineId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load language from localStorage or default EN
  const [lang, setLang] = useState(localStorage.getItem("lang") || "EN");

  // Save language to localStorage on change
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // Translation dictionary
  const dictMap = { EN: en, FR: fr, AR: ar };
  const t = dictMap[lang];

  // Load machines from API
  useEffect(() => {
    api.get("/machines")
      .then(res => setMachines(res.data))
      .catch(err => {
        console.error(err);
        setError("Failed to load machines");
      });
  }, []);

  // Cycle language: EN -> FR -> AR
  const handleLangClick = () => {
    const langs = ["EN", "FR", "AR"];
    const currentIndex = langs.indexOf(lang);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLang(langs[nextIndex]);
  };

  const handleLogin = async () => {
    setError("");
    if (!badge.trim()) return setError(t.scanBadge);
    if (!machineId) return setError(t.selectMachine);

    setLoading(true);
    try {
      const res = await api.post("/operators/login", {
        badge_code: badge.trim()
      });

      const selectedMachine = machines.find(
        m => m.machine_id === Number(machineId)
      );

      onLogin({
        operator: res.data,
        machine: selectedMachine
      });
    } catch (err) {
      console.error(err);
      setError("Operator not found. Check badge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="action-card blue-glass login-card">
        {/* Language selector */}
        <div className="select-lang" onClick={handleLangClick}>
          <span className="lang">{lang}</span>
        </div>

        <h1>{t.title}</h1>

        {/* Badge input */}
        <input
          value={badge}
          onChange={(e) => setBadge(e.target.value)}
          placeholder={t.scanBadge}
          className="input"
          autoFocus
        />

        {/* Machine selection */}
        <select
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          className="input"
        >
          <option value="">{t.select}</option>
          {machines.map(machine => (
            <option key={machine.machine_id} value={machine.machine_id}>
              {machine.code}
            </option>
          ))}
        </select>

        {/* Login button */}
        <div className="btn-row">
          <button
            className="login btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : t.login}
          </button>
        </div>

        {/* Error message */}
        {error && <p className="error">{t.error}</p>}

        <p className="muted">{t.muted}</p>
      </div>
    </div>
  );
}
