import React, { useEffect, useState } from "react";
import axios from "axios";

export default function NeedleLogsDashboard() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/needle-change-logs")
      .then(res => setLogs(res.data))
      .catch(err => console.error("Fetch failed:", err));
  }, []);

  return (
    <div>
      <h2>Admin — Needle Change Logs</h2>
      <table>
        <thead>
          <tr>
            <th>Machine</th>
            <th>Operator</th>
            <th>Supervisor</th>
            <th>Color</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.log_id}>
              <td>{log.machine_id}</td>
              <td>{log.operator_id}</td>
              <td>{log.supervisor_id}</td>
              <td>{log.color}</td>
              <td>{log.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
