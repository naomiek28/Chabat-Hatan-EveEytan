// Collez ici l'URL /exec obtenue après le déploiement de Code.gs.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw66m8ztIcxU7QUxhDxKCrgq0Sz7_QIZl_15uWAXgeZTUZajNcq1oxeNkNHt-6yuXVG/exec";

const MUSIC_FILE = "audio/musique.mp3";

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
const website = form.elements.namedItem("website");

function setStatus(message, type = "") {
  statusLine.textContent = message;
  statusLine.className = `form-status ${type}`.trim();
}

function updateAttendance() {
  const isAbsent = attendance.value === "Je ne pourrai pas être présent";
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
    attendance: attendance.value,
    guestCount: attendance.value === "Je ne pourrai pas être présent" ? "0" : guestCount.value,
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

  let automaticStartEnabled = true;
  let starting = false;
  let isActuallyPlaying = false;
  let lastScrollAttempt = -Infinity;
  // Le défilement est tenté, puis le tap ou le clic sert de secours si Safari le refuse.
  const automaticStartEvents = ["scroll", "touchend", "click", "keydown"];

  function removeAutomaticStart() {
    automaticStartEnabled = false;
    automaticStartEvents.forEach((eventName) => {
      window.removeEventListener(eventName, startMusicOnInteraction);
    });
  }

  async function startMusicOnInteraction(event) {
    if (!automaticStartEnabled || event.target.closest?.("#musicButton")) return;
    if (event.type === "scroll") {
      const now = performance.now();
      if (starting || now - lastScrollAttempt < 1500) return;
      lastScrollAttempt = now;
    }
    starting = true;
    try {
      await music.play();
      removeAutomaticStart();
    } catch {
      // Certains navigateurs attendent un toucher ou un clic : on réessaie au prochain geste.
    } finally {
      starting = false;
    }
  }

  automaticStartEvents.forEach((eventName) => {
    window.addEventListener(eventName, startMusicOnInteraction, { passive: true });
  });

  musicButton.addEventListener("click", async () => {
    removeAutomaticStart();
    if (isActuallyPlaying && !music.paused) {
      music.pause();
      return;
    }
    try {
      await music.play();
    } catch {
      // Si le bouton personnalisé est bloqué, proposer le lecteur de l'iPhone.
      music.controls = true;
      musicLabel.textContent = "Utiliser ▶ ci-dessous";
      musicButton.setAttribute("aria-label", "Utiliser le lecteur audio ci-dessous");
    }
  });
  music.addEventListener("playing", () => {
    isActuallyPlaying = true;
    music.controls = false;
    musicLabel.textContent = "Couper la musique";
    musicButton.setAttribute("aria-label", "Couper la musique");
  });
  music.addEventListener("pause", () => {
    isActuallyPlaying = false;
    musicLabel.textContent = "Lancer la musique";
    musicButton.setAttribute("aria-label", "Lancer la musique");
  });
  music.addEventListener("error", () => {
    musicLabel.textContent = "Audio indisponible";
    musicButton.setAttribute("aria-label", "Audio indisponible");
  });
}
