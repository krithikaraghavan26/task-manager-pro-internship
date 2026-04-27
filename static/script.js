console.log("dashboard script loaded");

const API = "/api/tasks";
let currentFilter = "All";
let editTaskId = null;
let taskMap = {};      // ✅ prevents quote bugs in titles

/* ---------- STATS ---------- */
function loadStats() {
  fetch("/api/stats")
    .then(r => r.json())
    .then(s => {
      statToday.innerText = s.today;
      statPending.innerText = s.pending;
      statDone.innerText = s.done;
    });
}

/* ---------- LOAD TASKS ---------- */
function loadTasks() {
  fetch(API)
    .then(r => r.json())
    .then(tasks => {
      taskList.innerHTML = "";
      taskMap = {};

      tasks.forEach(t => {
        taskMap[t.id] = t; // store

        if (currentFilter !== "All" && t.status !== currentFilter) return;

        const badge =
          t.priority === "High" ? "danger" :
          t.priority === "Medium" ? "warning" : "success";

        taskList.innerHTML += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>${escapeHtml(t.title)}</strong>
              <span class="badge bg-${badge} ms-2">${t.priority}</span>
            </div>

            <div class="d-flex gap-2">
              <select class="form-select form-select-sm"
                onchange="updateStatus(${t.id}, this.value)">
                <option ${t.status === "Todo" ? "selected" : ""}>Todo</option>
                <option ${t.status === "In-Progress" ? "selected" : ""}>In-Progress</option>
                <option ${t.status === "Done" ? "selected" : ""}>Done</option>
              </select>

              <button class="btn btn-outline-primary btn-sm"
                onclick="openEdit(${t.id})">Edit</button>

              <button class="btn btn-outline-danger btn-sm"
                onclick="deleteTask(${t.id})">✕</button>
            </div>
          </li>
        `;
      });
    });
}

/* ---------- ADD TASK ---------- */
addBtn.onclick = () => {
  const titleVal = title.value.trim();
  const priorityVal = priority.value;

  if (!titleVal) {
    alert("Task title is required");
    return;
  }

  fetch(API, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ title: titleVal, priority: priorityVal })
  }).then(() => {
    title.value = "";
    loadTasks();
    loadStats();
    loadChart();   // ✅ update chart
  });
};

/* ---------- FILTER ---------- */
document.querySelectorAll("#filterTabs button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("#filterTabs .nav-link")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    currentFilter = btn.dataset.status;
    loadTasks();
  };
});

/* ---------- EDIT MODAL ---------- */
function openEdit(id) {
  const t = taskMap[id];
  if (!t) return;

  editTaskId = id;
  editTitle.value = t.title;
  editPriority.value = t.priority;
  editStatus.value = t.status;

  editError.style.display = "none";
  new bootstrap.Modal(editModal).show();
}

saveEditBtn.onclick = () => {
  const newTitle = editTitle.value.trim();

  if (!newTitle) {
    editError.innerText = "Title cannot be empty";
    editError.style.display = "block";
    return;
  }

  fetch(`${API}/${editTaskId}`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      title: newTitle,
      priority: editPriority.value,
      status: editStatus.value
    })
  }).then(async (res) => {
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      editError.innerText = msg.error || "Update failed";
      editError.style.display = "block";
      return;
    }

    bootstrap.Modal.getInstance(editModal).hide();
    loadTasks();
    loadStats();
    loadChart();  // ✅ update chart
  });
};

/* ---------- UPDATE STATUS ---------- */
function updateStatus(id, status) {
  fetch(`${API}/${id}`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ status })
  }).then(() => {
    loadTasks();
    loadStats();
    loadChart();  // ✅ update chart
  });
}

/* ---------- DELETE ---------- */
function deleteTask(id) {
  if (!confirm("Delete this task?")) return;

  fetch(`${API}/${id}`, { method: "DELETE" })
    .then(() => {
      loadTasks();
      loadStats();
      loadChart(); // ✅ update chart
    });
}

/* ---------- CHART ---------- */
let taskChart = null;

function loadChart() {
  fetch("/api/chart-data")
    .then(res => res.json())
    .then(data => {
      const canvas = document.getElementById("taskChart");
      if (!canvas) return;

      if (taskChart) taskChart.destroy();


      taskChart = new Chart(canvas, {
        type: "doughnut",
        data: {
           labels: ["Todo", "In-Progress", "Done"],
           datasets: [{
            data: [data.todo, data.in_progress, data.done],
            backgroundColor: ["#94a3b8", "#60a5fa", "#22c55e"],
            hoverOffset: 8,
            borderWidth: 2,
            borderColor: "#020617"
            }]
        },
        options: {
          responsive: true,
          cutout: "65%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: document.body.classList.contains("dark") ? "#e5e7eb" : "#111827"
              }
            }
          }
        }
      });
    });
}

/* ---------- HELPER: prevent HTML injection ---------- */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- DARK / LIGHT MODE (POLISHED) ---------- */
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.onclick = () => {
    const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
    loadChart(); // ✅ redraw chart for correct legend colors
  };
}

/* ---------- INIT ---------- */
loadTasks();
loadStats();
loadChart();