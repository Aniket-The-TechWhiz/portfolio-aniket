const API_URL = "https://script.google.com/macros/s/AKfycbyUsV2a_oo6SKMdRGHC9AL_OaMW1ZL_Qc9ii0QwWasIYwTSmKr_sJg3jC75jjD-2mn4Tg/exec";
const container = document.getElementById("messages");

async function loadMessages() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!data || data.length === 0) {
      container.innerHTML = "<p>No messages found.</p>";
      return;
    }

    container.innerHTML = ""; // Clear loader
    data.reverse().forEach(msg => {
      const div = document.createElement("div");
      div.className = "message-card";
      div.innerHTML = `
        <h3>${msg.name || 'No Name'}</h3>
        <p><b>Email:</b> ${msg.email || 'N/A'}</p>
        <p><b>Subject:</b> ${msg.subject || 'N/A'}</p>
        <p>${msg.message || ''}</p>
        <small>${msg.time || ''}</small>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = "<p>Error loading messages. Ensure the Script is deployed as 'Anyone'.</p>";
    console.error(err);
  }
}

loadMessages();