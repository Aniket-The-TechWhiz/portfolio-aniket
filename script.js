// PAGE SWITCHING
const pages = document.querySelectorAll(".page");
const navs = document.querySelectorAll("[data-nav]");

navs.forEach(nav => {
  nav.addEventListener("click", () => {
    const target = nav.dataset.nav;

    pages.forEach(p => p.classList.remove("active"));
    navs.forEach(n => n.classList.remove("active"));

    document.querySelector(`[data-page="${target}"]`).classList.add("active");
    nav.classList.add("active");
  });
});

// PORTFOLIO FILTER
const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".portfolio-card");

filters.forEach(filter => {
  filter.addEventListener("click", () => {
    const type = filter.dataset.filter;

    filters.forEach(f => f.classList.remove("active"));
    filter.classList.add("active");

    cards.forEach(card => {
      card.style.display =
        type === "all" || card.dataset.type === type
          ? "block"
          : "none";
    });
  });
});

// PROFILE SHOW MORE (mobile)
const profileToggle = document.querySelector('.profile-toggle');
const sidebar = document.querySelector('.sidebar');
if (profileToggle && sidebar) {
  profileToggle.addEventListener('click', () => {
    const isExpanded = sidebar.classList.toggle('expanded');
    profileToggle.setAttribute('aria-expanded', String(isExpanded));
    profileToggle.textContent = isExpanded ? 'Show less' : 'Show more';
  });
}

/* MAP INITIALIZATION (Leaflet) */
const MAP_COORDS = [18.485805, 73.954091]; // lat, lng
let mapInitialized = false;
let mapInstance;

function initMap() {
  if (mapInitialized) return;
  mapInitialized = true;

  // Create map
  mapInstance = L.map('map', { scrollWheelZoom: false }).setView(MAP_COORDS, 15);

  // Tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapInstance);

  // Pulsing marker using a DivIcon with CSS animation
  const pulsingHtml = '<div class="pulse-marker"></div>';
  const pulseIcon = L.divIcon({ className: 'pulse-icon', html: pulsingHtml, iconSize: [20, 20] });
  L.marker(MAP_COORDS, { icon: pulseIcon }).addTo(mapInstance).bindPopup('Aniket\'s location').openPopup();

  // small white circle overlay for better contrast (optional)
  L.circleMarker(MAP_COORDS, { radius: 6, color: '#fff', weight: 2, fillColor: '#f5c542', fillOpacity: 1 }).addTo(mapInstance);
}

// Initialize the map on DOMContentLoaded in case contact section is default
document.addEventListener('DOMContentLoaded', () => {
  initMap();
});

// When switching pages, if contact becomes active ensure map resizes correctly
navs.forEach(nav => {
  nav.addEventListener('click', () => {
    if (nav.dataset.nav === 'contact') {
      // small timeout to allow layout changes, then invalidate size
      setTimeout(() => {
        initMap();
        if (mapInstance) mapInstance.invalidateSize();
      }, 220);
    }
  });
});

/* RESUME DOWNLOAD: force download via fetch+blob to ensure file is downloaded to user */
document.querySelectorAll('.download-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const url = btn.getAttribute('href');
    try {
      const resp = await fetch(url, { cache: 'no-cache' });
      if (!resp.ok) throw new Error('Network error');
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      const filename = url.split('/').pop() || 'resume.pdf';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // fallback: navigate to the file which may trigger browser download
      window.location.href = url;
    }
  });
});

/* CONTACT FORM - FIXED FOR CORS */
const GOOGLE_SCRIPT_API = "https://script.google.com/macros/s/AKfycbyUsV2a_oo6SKMdRGHC9AL_OaMW1ZL_Qc9ii0QwWasIYwTSmKr_sJg3jC75jjD-2mn4Tg/exec";
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    contactStatus.textContent = "Sending...";

    const formData = new URLSearchParams();
    formData.append("name", document.getElementById("c-name").value.trim());
    formData.append("email", document.getElementById("c-email").value.trim());
    formData.append("subject", document.getElementById("c-subject").value.trim());
    formData.append("message", document.getElementById("c-message").value.trim());

    try {
      await fetch(GOOGLE_SCRIPT_API, {
        method: "POST",
        mode: "no-cors", // Crucial for Google Apps Script from local files
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });

      // Since mode is 'no-cors', we won't get a readable response body,
      // but if we reach here, the request was dispatched.
      contactStatus.textContent = "Message sent successfully!";
      contactForm.reset();
    } catch (err) {
      contactStatus.textContent = "Error sending message.";
      console.error(err);
    }
  });
}