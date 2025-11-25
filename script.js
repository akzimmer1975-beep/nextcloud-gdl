// script.js (with Render placeholder)
const apiBase = "https://nextcloud-backend1.onrender.com/api/upload";

function $(id){ return document.getElementById(id); }

const containers = [
  {dropId: "drop-wahlausschreiben", filetype: "wahlausschreiben"},
  {dropId: "drop-niederschrift", filetype: "niederschrift"},
  {dropId: "drop-wahlvorschlag", filetype: "wahlvorschlag"}
];

function setupDrops(){
  containers.forEach(c=>{
    const el = $(c.dropId);
    el.addEventListener("dragover", e => { e.preventDefault(); el.style.background="#eef"; });
    el.addEventListener("dragleave", e => { el.style.background=""; });
    el.addEventListener("drop", e => {
      e.preventDefault();
      el.style.background="";
      const files = e.dataTransfer.files;
      el._files = files;
      const s = el.querySelector(".status");
      if(s) s.textContent = files.length + " Datei(en) bereit";
      const dbg = document.getElementById("debug");
      if(dbg) dbg.textContent += "\n" + files.length + " Datei(en) in " + c.dropId;
    });
  });
}

async function uploadAll(){
  const bezirk = $("bezirk").value;
  const bkz = $("bkz").value;
  const code = $("code").value || "";

  if(!bezirk || !bkz){ alert("Bitte Bezirk und BKZ ausfüllen."); return; }

  const form = new FormData();
  form.append("bezirk", bezirk);
  form.append("bkz", bkz);
  form.append("code", code);

  containers.forEach(c=>{
    const el = $(c.dropId);
    const files = el._files;
    if(files){
      for(let i=0;i<files.length;i++){
        form.append("files", files[i], files[i].name);
        form.append("containers", c.filetype);
      }
    }
  });

  try{
    const resp = await fetch(apiBase, { method: "POST", body: form });
    const json = await resp.json();
    if(resp.ok){
      alert("Upload erfolgreich.");
      document.getElementById("debug").textContent += "\n" + JSON.stringify(json, null, 2);
    } else {
      alert("Fehler: " + json.message);
    }
  } catch(e){
    alert("Netzwerkfehler: " + e.message);
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  setupDrops();
  $("upload-btn").addEventListener("click", uploadAll);
});
