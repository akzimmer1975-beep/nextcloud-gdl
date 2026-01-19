// ----------------------------
// CONFIG
// ----------------------------
const apiUpload = "https://nextcloud-backend1.onrender.com/api/upload";
const apiFiles  = "https://nextcloud-backend1.onrender.com/api/files";

function $(id) { return document.getElementById(id); }

const containers = [
  { dropId: "drop-wahlausschreiben", filetype: "wahlausschreiben", prog: "prog-wahlausschreiben", status: "status-wahlausschreiben", list: "list-wahlausschreiben" },
  { dropId: "drop-niederschrift",   filetype: "niederschrift",   prog: "prog-niederschrift",   status: "status-niederschrift",   list: "list-niederschrift" },
  { dropId: "drop-wahlvorschlag",   filetype: "wahlvorschlag",   prog: "prog-wahlvorschlag",   status: "status-wahlvorschlag",   list: "list-wahlvorschlag" }
];

// ----------------------------
// AUTO-REFRESH DATEILISTE
// ----------------------------
let refreshTimer = null;

function refreshFileListDebounced() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(loadExistingFiles, 300);
}

async function loadExistingFiles() {
  const bezirk = $("bezirk").value;
  const bkz    = $("bkz").value.trim();

  if (!bezirk || !bkz) {
    const target = $("existing-files");
    if (target) target.textContent = "Bitte Bezirk und BKZ auswählen";
    return;
  }

  try {
    const res = await fetch(
      `${apiFiles}?bezirk=${encodeURIComponent(bezirk)}&bkz=${encodeURIComponent(bkz)}`
    );

    const files = await res.json();
    const target = $("existing-files");
    if (!target) return;

    if (!files.length) {
      target.textContent = "Keine Dateien vorhanden";
      return;
    }

    // Neueste zuerst
    files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    target.innerHTML = `
      <ul>
        ${files.map(f => `
          <li>
            ${f.name}<br>
            <small>
              hochgeladen am:
              ${new Date(f.lastModified).toLocaleString("de-DE")}
            </small>
          </li>
        `).join("")}
      </ul>
    `;
  } catch (err) {
    console.error("Fehler beim Laden der Dateien", err);
  }
}

// ----------------------------
// DRAG & DROP SETUP
// ----------------------------
function setupDrops() {

  document.addEventListener("dragover", e => e.preventDefault());
  document.addEventListener("drop", e => e.preventDefault());

  containers.forEach(c => {
    const el     = $(c.dropId);
    const status = $(c.status);
    const prog   = $(c.prog);
    const list   = $(c.list);

    el.addEventListener("dragover", e => {
      e.preventDefault();
      el.classList.add("hover");
    });

    el.addEventListener("dragleave", () => {
      el.classList.remove("hover");
    });

    el.addEventListener("drop", e => {
      e.preventDefault();
      el.classList.remove("hover");

      const files = e.dataTransfer.files;
      el._files = files;

      list.innerHTML = "";
      for (let i = 0; i < files.length; i++) {
        const div = document.createElement("div");
        div.textContent = "📄 " + files[i].name + " (" + Math.round(files[i].size / 1024) + " KB)";
        list.appendChild(div);
      }

      status.textContent = files.length + " Datei(en) bereit";
      prog.style.display = "none";
      prog.value = 0;

      updateUploadButton();
    });
  });
}

// ----------------------------
// UPLOAD-BUTTON AKTIVIERUNG
// ----------------------------
function updateUploadButton() {
  const btn = $("upload-btn");

  const hasFiles = containers.some(c => {
    const el = $(c.dropId);
    return el._files && el._files.length > 0;
  });

  btn.disabled = !hasFiles;
}

// ----------------------------
// EINZELDATEI-UPLOAD
// ----------------------------
function uploadSingleFile(file, filetype, container) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("bezirk", $("bezirk").value);
    form.append("bkz", $("bkz").value);
    form.append("code", $("code").value || "");
    form.append("containers", filetype);
    form.append("files", file, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUpload);

    const progEl   = $(container.prog);
    const statusEl = $(container.status);

    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable) {
        const p = Math.round((e.loaded / e.total) * 100);
        progEl.style.display = "block";
        progEl.value = p;
        statusEl.textContent = `Upload: ${p}%`;
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        statusEl.textContent = "✓ Erfolgreich hochgeladen";

        // 🔁 AUTO-REFRESH NACH UPLOAD
        refreshFileListDebounced();

        resolve(true);
      } else {
        statusEl.textContent = "❌ Fehler: " + xhr.status;
        reject(xhr.status);
      }
    };

    xhr.onerror = () => {
      statusEl.textContent = "❌ Netzwerkfehler";
      reject("network");
    };

    xhr.send(form);
  });
}

// ----------------------------
// ALLE UPLOADS
// ----------------------------
async function uploadAll() {
  const bezirk = $("bezirk").value;
  const bkz    = $("bkz").value;

  if (!bezirk || !bkz) {
    alert("Bitte Bezirk und BKZ ausfüllen.");
    return;
  }

  $("upload-btn").disabled = true;

  for (let c of containers) {
    const el = $(c.dropId);
    const files = el._files;

    if (!files || files.length === 0) continue;

    for (let i = 0; i < files.length; i++) {
      try {
        await uploadSingleFile(files[i], c.filetype, c);
      } catch (err) {
        console.error("Fehler bei Datei:", files[i].name, err);
      }
    }
  }

  alert("Alle Uploads abgeschlossen.");
  $("upload-btn").disabled = false;
}

// ----------------------------
// INIT
// ----------------------------
document.addEventListener("DOMContentLoaded", () => {
  setupDrops();
  $("upload-btn").addEventListener("click", uploadAll);
  $("bezirk").addEventListener("change", refreshFileListDebounced);
  $("bkz").addEventListener("input", refreshFileListDebounced);
  updateUploadButton();
});
