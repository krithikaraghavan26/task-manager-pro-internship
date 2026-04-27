console.log("admin script loaded");

/* ===== TABLE DATA ===== */
fetch("/api/admin/tasks")
  .then(r => r.json())
  .then(tasks => {
    const table = document.getElementById("adminTable");
    table.innerHTML = "";

    tasks.forEach(t => {
      const prBadge =
        t.priority === "High" ? "danger" :
        t.priority === "Medium" ? "warning" : "success";

      const stBadge =
        t.status === "Done" ? "success" :
        t.status === "In-Progress" ? "primary" : "secondary";

      table.innerHTML += `
        <tr>
          <td>${t.username}</td>
          <td>${t.title}</td>
          <td><span class="badge bg-${prBadge}">${t.priority}</span></td>
          <td><span class="badge bg-${stBadge}">${t.status}</span></td>
        </tr>
      `;
    });
  });

/* ===== STATS ===== */
fetch("/api/admin/stats")
  .then(r => r.json())
  .then(s => {
    adminTotal.innerText = s.total;
    adminPending.innerText = s.pending;
    adminDone.innerText = s.done;
    adminUsers.innerText = s.users;
  });

/* ===== CHART ===== */
fetch("/api/admin/chart-data")
  .then(r => r.json())
  .then(data => {
    new Chart(document.getElementById("adminChart"), {
      type: "doughnut",
      data: {
        labels: ["Todo", "In‑Progress", "Done"],
        datasets: [{
          data: [data.todo, data.in_progress, data.done],
          backgroundColor: ["#94a3b8", "#60a5fa", "#22c55e"],
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          legend: { position: "bottom" }
        },
        cutout: "65%"
      }
    });
  });