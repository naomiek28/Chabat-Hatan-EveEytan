// Collez ici l'URL /exec obtenue après le déploiement de Code.gs.
const GOOGLE_SCRIPT_URL = "";

// Quand vous aurez choisi une musique, mettez le fichier dans audio/ et
// remplacez la valeur par exemple par "audio/musique.mp3".
const MUSIC_FILE = "";

const form = document.getElementById("rsvpForm");
const statusLine = document.getElementById("formStatus");
const submitButton = document.getElementById("submitButton");
const attendance = document.getElementById("attendance");
const guestCount = document.getElementById("guestCount");
const countField = document.getElementById("countField");
const music = document.getElementById("pageMusic");
const musicButton = document.getElementById("musicButton");
const musicLabel = document.getElementById("musicLabel");
const guestName = form.elements.namedItem("guestName");
const guestContact = form.elements.namedItem("guestContact");
const guestMessage = form.elements.namedItem("guestMessage");
const website = form.elements.namedItem("website");

function setStatus(message, type = "") {
  statusLine.textContent = message;
  statusLine.className = `form-status ${type}`.trim();
}

function updateAttendance() {
  const isAbsent = attendance.value === "Absent(e)";
  guestCount.disabled = isAbsent;
  guestCount.required = !isAbsent;
  countField.style.opacity = isAbsent ? ".5" : "1";
  if (isAbsent) guestCount.value = "0";
  else if (guestCount.value === "0") guestCount.value = "1";
}

attendance.addEventListener("change", updateAttendance);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");
  if (!form.reportValidity()) return;
  if (website.value) return; // Champ invisible contre les envois automatisés.

  if (!GOOGLE_SCRIPT_URL.trim()) {
    setStatus("Le formulaire n’est pas encore relié à Google Sheets. Merci de réessayer plus tard.", "error");
    return;
  }

  const data = new URLSearchParams({
    guestName: guestName.value.trim(),
    guestContact: guestContact.value.trim(),
    attendance: attendance.value,
    guestCount: attendance.value === "Absent(e)" ? "0" : guestCount.value,
    guestMessage: guestMessage.value.trim(),
    website: website.value
  });

  submitButton.disabled = true;
  submitButton.textContent = "Envoi en cours…";

  try {
    // Apps Script ne permet généralement pas de lire sa réponse depuis un
    // autre domaine. Le mode no-cors transmet le formulaire au script.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: data.toString()
    });
    form.reset();
    updateAttendance();
    setStatus("Merci, votre réponse a été transmise.", "success");
  } catch {
    setStatus("L’envoi a échoué. Vérifiez votre connexion et réessayez.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Envoyer ma réponse";
  }
});

if (MUSIC_FILE.trim()) {
  music.src = MUSIC_FILE;
  musicButton.hidden = false;
  musicButton.addEventListener("click", async () => {
    if (music.paused) {
      try { await music.play(); }
      catch { musicLabel.textContent = "Lecture impossible"; }
    } else music.pause();
  });
  music.addEventListener("play", () => {
    musicLabel.textContent = "Pause";
    musicButton.setAttribute("aria-label", "Mettre la musique en pause");
  });
  music.addEventListener("pause", () => {
    musicLabel.textContent = "Musique";
    musicButton.setAttribute("aria-label", "Lancer la musique");
  });
}
