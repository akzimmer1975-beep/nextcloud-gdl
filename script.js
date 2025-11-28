const apiBase = "https://nextcloud-backend1.onrender.com/api/upload";

function $(id) { return document.getElementById(id); }

const containers = [
  { dropId: "drop-wahlausschreiben", filetype: "wahlausschreiben", prog: "prog-wahlausschreiben", status: "status-wahlausschreiben" },
  { dropId: "drop-niederschrift", filetype: "niederschrift", prog: "prog-niederschrift", status: "status-niederschrift" },
  { dropId: "drop-wahlvorschlag", filetype: "wahlvorschlag", prog: "prog-wahlvorschlag", status: "status-wahlvorschlag" }
];

function setupDrops() {
  containers.forEach(c => {
    const el = $(c.dropId);
    el.addEventListener("dragover", e => { e.preventDefault(); el.style.background = "#eef"; });
    el.addEventListener("dragleave", e => { el.style.background = ""; });
    el.addEventListener("drop", e => {
      e.preventDefault();
      el.style.background = "";
      const files = e.dataTransfer.files;
      el._files = files;
      $(c.status).textContent = files.length + " Datei(en) bereit";
    });
  });
}

// Upload mit Fortschritt
async function uploadAll() {
  const bezirk = $("bezirk").value;
  const bkz = $("bkz").value;
  const code = $("code").value || "";

  if (!bezirk || !bkz) {
    alert("Bitte Bezirk und BKZ ausfüllen.");
    return;
  }

  for (let c of containers) {
    const el = $(c.dropId);
    const files = el._files;

    if (!files || files.length === 0) continue;

    for (let i = 0; i < files.length; i++) {
      await uploadSingleFile(files[i], c.filetype, c);
    }
  }

  alert("Alle Uploads fertig.");
}

// Upload für EIN FILE – mit Fortschrittsanzeige
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

    // Fortschritt
    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable) {
        const p = Math.round((e.loaded / e.total) * 100);
        const progEl = $(container.prog);
        progEl.style.display = "block";
        progEl.value = p;
        $(container.status).textContent = `Upload: ${p}%`;
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        $(container.status).textContent = "✓ Erfolgreich hochgeladen";
        resolve(true);
      } else {
        $(container.status).textContent = "❌ Fehler: " + xhr.status;
        reject(xhr.status);
      }
    };

    xhr.onerror = () => {
      $(container.status).textContent = "❌ Netzwerkfehler";
      reject("network");
    };

    xhr.send(form);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupDrops();
  $("upload-btn").addEventListener("click", uploadAll);
