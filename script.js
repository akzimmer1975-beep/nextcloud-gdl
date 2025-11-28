// ----------------------------
// CONFIG
// ----------------------------
const apiBase = "https://nextcloud-backend1.onrender.com/api/upload";

function $(id) { return document.getElementById(id); }

const containers = [
  { dropId: "drop-wahlausschreiben", filetype: "wahlausschreiben", prog: "prog-wahlausschreiben", status: "status-wahlausschreiben", list: "list-wahlausschreiben" },
  { dropId: "drop-niederschrift", filetype: "niederschrift", prog: "prog-niederschrift", status: "status-niederschrift", list: "list-niederschrift" },
  { dropId: "drop-wahlvorschlag", filetype: "wahlvorschlag", prog: "prog-wahlvorschlag", status: "status-wahlvorschlag", list: "list-wahlvorschlag" }
];

// ----------------------------
// DROPPING
// ----------------------------
function setupDrops() {

  // Globale Browser-Blockade verhindern
  document.addEventListener("dragover", e => e.preventDefault());
  document.addEventListener("drop", e => e.preventDefault());

  containers.forEach(c => {
    const el     = $(c.dropId);
    const status = $(c.status);
    const prog   = $(c.prog);
    const list   = $(c.list);

    el.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      el.classList.add("hover");
    });

    el.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove("hover");
    });

    el.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove("hover");

      const files = e.dataTransfer.files;

      // Dateien speichern
      el._files = files;

      // Dateiliste anzeigen
      list.innerHTML = "";
      for (let i = 0; i < files.length; i++) {
        const li = document.createElement("div");
        li.textContent = "📄 " + files[i].name + " (" + Math.round(files[i].size/1024) + " KB)";
        list.appendChild(li);
      }

      // Status
      status.textContent = files.length + " Datei(en) bereit";

      // Fortschritt zurücksetzen
      prog.style.display = "none";
      prog.value = 0;

      updateUploadButton();
    });
  });
}

// ----------------------------
// Upload-Button Aktivierung
// ----------------------------
function updateUploadButton() {
  const btn = $("upload-btn");

  let hasFiles = containers.some(c => {
    const el = $(c.dropId);
    return el._files && el._files.length > 0;
  });

  btn.disabled = !hasFiles;
}

// ----------------------------
// EINZELDATEI-UPLOAD mit Progress
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
    xhr.open("POST", apiBase);

    const progEl   = $(container.prog);
    const statusEl = $(container.status);

    // Progress
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
  updateUploadButton();
});
