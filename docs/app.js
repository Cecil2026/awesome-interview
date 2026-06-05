(function () {
  "use strict";

  const REPO_BLOB_BASE = ""; // optionally set to "https://github.com/<owner>/<repo>/blob/main/"

  const els = {
    category: document.getElementById("category"),
    difficulty: document.getElementById("difficulty"),
    topic: document.getElementById("topic"),
    pick: document.getElementById("pick"),
    result: document.getElementById("result"),
    rCategory: document.getElementById("r-category"),
    rDifficulty: document.getElementById("r-difficulty"),
    rTitle: document.getElementById("r-title"),
    rTopics: document.getElementById("r-topics"),
    rSource: document.getElementById("r-source"),
    status: document.getElementById("status"),
  };

  let questions = [];

  async function load() {
    try {
      const resp = await fetch("questions.json", { cache: "no-cache" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      questions = data.questions || [];
      els.status.textContent = `${data.total} questions loaded across ${data.categories.length} categories.`;
      populateCategories(data.categories || []);
      els.pick.disabled = false;
    } catch (err) {
      els.status.textContent = `Could not load questions.json — ${err.message}. Run "python tools/build_index.py" to generate it.`;
      els.pick.disabled = true;
    }
  }

  function populateCategories(cats) {
    for (const c of cats) {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      els.category.appendChild(opt);
    }
  }

  function filter() {
    const cat = els.category.value;
    const diff = els.difficulty.value;
    const topic = els.topic.value.trim().toLowerCase();
    return questions.filter((q) => {
      if (cat && q.category !== cat) return false;
      if (diff && q.difficulty !== diff) return false;
      if (topic) {
        const hay = (q.topics || []).join(",").toLowerCase() + " " + q.title.toLowerCase();
        if (!hay.includes(topic)) return false;
      }
      return true;
    });
  }

  function pick() {
    const pool = filter();
    if (pool.length === 0) {
      els.status.textContent = "No questions match those filters. Loosen them and try again.";
      els.result.classList.add("hidden");
      return;
    }
    const q = pool[Math.floor(Math.random() * pool.length)];
    render(q);
    els.status.textContent = `Picked from ${pool.length} matching question${pool.length === 1 ? "" : "s"}.`;
  }

  function render(q) {
    els.rTitle.textContent = q.title;
    els.rCategory.textContent = q.category;
    if (q.difficulty) {
      els.rDifficulty.textContent = q.difficulty;
      els.rDifficulty.className = "badge " + q.difficulty.toLowerCase();
      els.rDifficulty.style.display = "";
    } else {
      els.rDifficulty.style.display = "none";
    }
    els.rTopics.textContent = (q.topics || []).length ? `Topics: ${q.topics.join(", ")}` : "";
    const href = REPO_BLOB_BASE ? `${REPO_BLOB_BASE}${q.file}#L${q.line}` : `../${q.file}#L${q.line}`;
    els.rSource.href = href;
    els.rSource.textContent = `${q.file}:${q.line}`;
    els.result.classList.remove("hidden");
  }

  els.pick.addEventListener("click", pick);
  load();
})();
