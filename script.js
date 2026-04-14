// PAGE SWITCHING
const pages = document.querySelectorAll(".page");
const navs = document.querySelectorAll("[data-nav]");

const GITHUB_USERNAME = "Aniket-The-TechWhiz";
const TOP_PROJECTS_LIMIT = 4;

async function loadRepoTrafficMetrics() {
  try {
    const response = await fetch(`data/repo-traffic.json?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) return new Map();
    const payload = await response.json();
    const repos = Array.isArray(payload.repos) ? payload.repos : [];

    return new Map(
      repos.map(repo => [repo.name, {
        viewsCount: Number(repo.viewsCount) || 0,
        uniqueVisitors: Number(repo.uniqueVisitors) || 0
      }])
    );
  } catch {
    return new Map();
  }
}

function formatRepoUpdatedDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Updated recently";
  return `Updated ${date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadLatestProjects() {
  const projectsContainer = document.getElementById("latest-projects-list");
  if (!projectsContainer) return;

  const endpoint = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&direction=desc&per_page=20&type=owner`;

  try {
    const [response, trafficMetrics] = await Promise.all([
      fetch(endpoint, {
        headers: {
          Accept: "application/vnd.github+json"
        }
      }),
      loadRepoTrafficMetrics()
    ]);

    if (!response.ok) throw new Error("Failed to fetch repositories");

    const repos = await response.json();
    const latestRepos = repos
      .filter(repo => !repo.fork && !repo.archived)
      .slice(0, TOP_PROJECTS_LIMIT);

    if (!latestRepos.length) {
      projectsContainer.innerHTML = '<p class="projects-loading">No recent public repositories found.</p>';
      return;
    }

    projectsContainer.innerHTML = latestRepos.map(repo => {
      const description = escapeHtml(repo.description || "Active repository with recent commits and updates.");
      const language = escapeHtml(repo.language || "Multi-language");
      const repoName = escapeHtml(repo.name);
      const traffic = trafficMetrics.get(repo.name) || { viewsCount: 0, uniqueVisitors: 0 };
      return `
        <article class="latest-project-card">
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="latest-project-link">
            <div class="latest-project-top">
              <h3>${repoName}</h3>
              <span class="project-language">${language}</span>
            </div>
            <p>${description}</p>
            <div class="latest-project-meta">
              <span><i class="fa-solid fa-star" aria-hidden="true"></i> ${repo.stargazers_count}</span>
              <span><i class="fa-solid fa-code-fork" aria-hidden="true"></i> ${repo.forks_count}</span>
              <span><i class="fa-solid fa-eye" aria-hidden="true"></i> ${traffic.viewsCount} views</span>
              <span title="Unique visitors in last 14 days"><i class="fa-solid fa-users" aria-hidden="true"></i> ${traffic.uniqueVisitors}</span>
              <span class="meta-updated">${formatRepoUpdatedDate(repo.pushed_at)}</span>
            </div>
          </a>
        </article>
      `;
    }).join("");
  } catch (error) {
    projectsContainer.innerHTML = `
      <p class="projects-loading">
        Unable to load projects right now.
        <a href="https://github.com/${GITHUB_USERNAME}?tab=repositories" target="_blank" rel="noopener noreferrer">View repositories on GitHub</a>.
      </p>
    `;
  }
}

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
  loadLatestProjects();
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