// Wait for the page to load fully, then hide the loading screen
window.addEventListener("load", () => {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) loadingScreen.style.display = "none";
});

// Safety timeout
setTimeout(() => {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) loadingScreen.style.display = "none";
}, 4000);

// Login
const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const complaintSection = document.getElementById("complaint-section");
const adminPanel = document.getElementById("admin-panel");
const anonymousBtn = document.getElementById("anonymous-btn");

// Complaint lists
const complaintsList = document.getElementById("complaints-list");
const studentComplaintsList = document.getElementById("student-complaints-list");

// Logout
const logoutBtn = document.getElementById("logout-btn");

// Store current logged-in user
let currentUser = "";

// Login event
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "admin" && password === "admin") {
    currentUser = "admin";
    loginSection.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    loadComplaints();
  } else if (username && password) {
    currentUser = username;
    loginSection.classList.add("hidden");
    complaintSection.classList.remove("hidden");
    loadStudentComplaints();
  } else {
    alert("Please enter valid credentials.");
  }
});

// Anonymous
anonymousBtn.addEventListener("click", () => {
  currentUser = "Anonymous";
  loginSection.classList.add("hidden");
  complaintSection.classList.remove("hidden");
  loadStudentComplaints();
});

// Complaint submission
const complaintForm = document.getElementById("complaint-form");
complaintForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const category = document.getElementById("category").value;
  const details = document.getElementById("details").value.trim();
  const evidenceFile = document.getElementById("evidence").files[0];

  if (!category || !details) return alert("Please complete all fields.");

  if (evidenceFile) {
    const reader = new FileReader();
    reader.onload = function() { saveComplaint(reader.result); };
    reader.readAsDataURL(evidenceFile);
  } else {
    saveComplaint("No file");
  }

  function saveComplaint(evidenceData) {
    const complaint = {
      id: Date.now(),
      student: currentUser,
      category,
      details,
      evidence: evidenceData,
      status: "Submitted",
      history: [{ status: "Submitted", timestamp: new Date().toLocaleString() }]
    };
    const complaints = JSON.parse(localStorage.getItem("complaints")) || [];
    complaints.push(complaint);
    localStorage.setItem("complaints", JSON.stringify(complaints));

    alert("Complaint submitted successfully!");
    complaintForm.reset();
    loadStudentComplaints();
    loadComplaints();
  }
});

// Load admin complaints
function loadComplaints() {
  const complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  complaintsList.innerHTML = "";

  if (complaints.length === 0) {
    complaintsList.innerHTML = "<p>No complaints submitted yet.</p>";
    return;
  }

  complaints.forEach(c => {
    const div = document.createElement("div");
    div.classList.add("complaint-card");

    div.innerHTML = `
      <p><strong>Student:</strong> ${c.student}</p>
      <p><strong>Category:</strong> ${c.category}</p>
      <p><strong>Details:</strong> ${c.details}</p>
      <p><strong>Evidence:</strong></p>
      ${c.evidence !== "No file" ? `<img src="${c.evidence}" class="admin-evidence">` : "No file"}
      <p><strong>Status:</strong> 
        <select class="status-select" data-id="${c.id}">
          <option ${c.status==="Submitted"?"selected":""}>Submitted</option>
          <option ${c.status==="In Review"?"selected":""}>In Review</option>
          <option ${c.status==="Pending"?"selected":""}>Pending</option>
          <option ${c.status==="Resolved"?"selected":""}>Resolved</option>
        </select>
      </p>
      <hr>
    `;
    complaintsList.appendChild(div);
  });

  document.querySelectorAll(".status-select").forEach(select => {
    select.addEventListener("change", (e) => {
      const id = parseInt(e.target.getAttribute("data-id"));
      const complaints = JSON.parse(localStorage.getItem("complaints")) || [];
      const index = complaints.findIndex(c => c.id === id);
      if (index > -1) {
        complaints[index].status = e.target.value;
        complaints[index].history.push({ status: e.target.value, timestamp: new Date().toLocaleString() });
        localStorage.setItem("complaints", JSON.stringify(complaints));
        loadStudentComplaints();
      }
    });
  });
}

// Load student complaints (filter by current user)
function loadStudentComplaints() {
  const complaints = JSON.parse(localStorage.getItem("complaints")) || [];
  studentComplaintsList.innerHTML = "<h3>Your Complaints</h3>";

  const studentComplaints = complaints.filter(c => c.student === currentUser);

  if (!studentComplaints.length) {
    studentComplaintsList.innerHTML += "<p>No complaints submitted yet.</p>";
    return;
  }

  studentComplaints.forEach(c => {
    const div = document.createElement("div");
    div.classList.add("complaint-card");

    let statusClass = "";
    switch(c.status){
      case "Submitted": statusClass="submitted"; break;
      case "In Review": statusClass="reviewed"; break;
      case "Pending": statusClass="pending"; break;
      case "Resolved": statusClass="resolved"; break;
    }

    let historyHTML = "<ul>";
    c.history.forEach(h => historyHTML += `<li>${h.timestamp}: ${h.status}</li>`);
    historyHTML += "</ul>";

    div.innerHTML = `
      <p><strong>Category:</strong> ${c.category}</p>
      <p><strong>Details:</strong> ${c.details}</p>
      <p><strong>Evidence:</strong> ${c.evidence !== "No file" ? `<img src="${c.evidence}" class="student-evidence">` : "No file"}</p>
      <p><strong>Current Status:</strong> <span class="status ${statusClass}">${c.status}</span></p>
      <p><strong>Status History:</strong> ${historyHTML}</p>
      <hr>
    `;
    studentComplaintsList.appendChild(div);
  });
}

// Logout
document.addEventListener("click", (e)=>{
  if(e.target && e.target.id === "logout-btn"){
    const msg = document.createElement("div");
    msg.id="logout-message";
    msg.textContent="You have logged out successfully!";
    document.body.appendChild(msg);

    complaintSection.classList.add("hidden");
    adminPanel.classList.add("hidden");
    msg.style.display="block";

    setTimeout(()=>{
      msg.remove();
      loginSection.classList.remove("hidden");
      currentUser = "";
    }, 2000);
  }
});

// Lightbox for evidence images
const lightboxOverlay = document.createElement("div");
lightboxOverlay.id = "lightbox-overlay";
lightboxOverlay.style.display = "none";
lightboxOverlay.style.position = "fixed";
lightboxOverlay.style.inset = "0";
lightboxOverlay.style.background = "rgba(0,0,0,0.8)";
lightboxOverlay.style.justifyContent = "center";
lightboxOverlay.style.alignItems = "center";
lightboxOverlay.style.zIndex = "9999";
lightboxOverlay.style.cursor = "pointer";
document.body.appendChild(lightboxOverlay);

const lightboxImage = document.createElement("img");
lightboxImage.style.maxWidth = "90%";
lightboxImage.style.maxHeight = "90%";
lightboxImage.style.borderRadius = "10px";
lightboxOverlay.appendChild(lightboxImage);

document.addEventListener("click", (e)=>{
  if(e.target.tagName==="IMG" && (e.target.classList.contains("admin-evidence") || e.target.classList.contains("student-evidence"))){
    lightboxImage.src = e.target.src;
    lightboxOverlay.style.display = "flex";
  }
});

lightboxOverlay.addEventListener("click", ()=>{
  lightboxOverlay.style.display = "none";
  lightboxImage.src = "";
});




