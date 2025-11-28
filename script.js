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
      status.textContent = files.length + " Datei(en) be

