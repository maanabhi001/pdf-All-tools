const out = document.getElementById("output");
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("pdfFiles");  // drag upload
const fileBrowse = document.getElementById("pdfBrowse"); // browse upload
const fileName = document.getElementById("fileName");
const filePreview = document.getElementById("filePreview");
const loader = document.getElementById("loader");

// 🔹 Show message function
const showMessage = (msg, color = "#333") => {
  out.style.color = color;
  out.textContent = msg;
};

// 🔹 Disable / Enable all buttons
const toggleButtons = (disabled) => {
  document.querySelectorAll("button").forEach((btn) => {
    btn.disabled = disabled;
    btn.style.opacity = disabled ? "0.6" : "1";
    btn.style.cursor = disabled ? "not-allowed" : "pointer";
  });
};

// 🔹 Update Filename label
function updateFileName(files) {
  if (files.length > 0) {
    fileName.textContent = [...files].map(f => f.name).join(", ");
  } else {
    fileName.textContent = "No files selected";
  }
}

// 🔹 Show Preview Cards
function refreshPreview(files) {
  filePreview.innerHTML = "";

  [...files].forEach((file, index) => {
    const card = document.createElement("div");
    card.className = "file-card";

    card.innerHTML = `
            <div class="file-info">
                <strong>${file.name}</strong>
                <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button class="remove-btn" data-index="${index}">Remove</button>
        `;

    filePreview.appendChild(card);
  });

  // Remove individual file
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.dataset.index;
      const dt = new DataTransfer();

      [...fileInput.files].forEach((file, i) => {
        if (i != idx) dt.items.add(file);
      });

      fileInput.files = dt.files;
      fileBrowse.files = dt.files; // sync browse input

      updateFileName(dt.files);
      refreshPreview(dt.files);

      if (dt.files.length === 0) {
        showMessage("No files selected.");
      }
    });
  });
}

// 🔹 Sync browse input → drag input
fileBrowse.addEventListener("change", () => {
  fileInput.files = fileBrowse.files;
  updateFileName(fileInput.files);
  refreshPreview(fileInput.files);
});

// 🔹 Sync drag input → browse input
fileInput.addEventListener("change", () => {
  fileBrowse.files = fileInput.files;
  updateFileName(fileInput.files);
  refreshPreview(fileInput.files);
});

// *********************************
//        DRAG & DROP SYSTEM
// *********************************

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  dropZone.classList.add("dropped");

  const files = [...e.dataTransfer.files].filter(f => f.type === "application/pdf");

  if (files.length === 0) {
    showMessage("⚠️ Only PDF files allowed!", "red");
    return;
  }

  const dt = new DataTransfer();
  files.forEach(f => dt.items.add(f));

  fileInput.files = dt.files;
  fileBrowse.files = dt.files;

  updateFileName(dt.files);
  refreshPreview(dt.files);

  showMessage("📄 Files added successfully!", "green");

  setTimeout(() => dropZone.classList.remove("dropped"), 500);
});

// ******************************************************************
//                         MERGE PDF
// ******************************************************************
document.getElementById("mergeBtn").onclick = async () => {
  const files = fileInput.files;
  if (files.length < 2) return showMessage("⚠️ Select at least 2 PDFs!", "red");

  toggleButtons(true);
  loader.classList.remove("hidden");
  showMessage("Merging your PDFs...");

  const firstName = files[0].name.replace(/\.[^/.]+$/, "");
  const outName = `${firstName}-merge.pdf`;

  const formData = new FormData();
  [...files].forEach(f => formData.append("pdfs", f));

  try {
    const res = await fetch("https://pdf-tools-vxz7.onrender.com/merge", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error();

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = outName;
    a.click();

    URL.revokeObjectURL(url);
    showMessage("✅ Merge complete!", "green");


  } catch {
    showMessage("❌ Failed to merge PDFs!", "red");
  }
  filePreview.style.display = "none";

  loader.classList.add("hidden");
  toggleButtons(false);
};

// ******************************************************************
//                        SPLIT PDF
// ******************************************************************
document.getElementById("splitBtn").onclick = async () => {
  const files = fileInput.files;
  if (files.length !== 1) return showMessage("⚠️ Select exactly 1 PDF!", "red");

  const pdf = files[0];

  toggleButtons(true);
  loader.classList.remove("hidden");
  showMessage("Splitting PDF... please wait.");

  // Submit form for ZIP download
  const form = document.createElement("form");
  form.action = "https://pdf-tools-vxz7.onrender.com/split";
  form.method = "POST";
  form.enctype = "multipart/form-data";
  form.style.display = "none";

  const input = document.createElement("input");
  input.type = "file";
  input.name = "pdf";

  const dt = new DataTransfer();
  dt.items.add(pdf);
  input.files = dt.files;

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  setTimeout(() => {
    showMessage("✅ Split complete! ZIP download started.", "green");
    loader.classList.add("hidden");
    toggleButtons(false);
    filePreview.style.display = "none";
  }, 3500);
};

// ******************************************************************
//                     COMPRESS PDF
// ******************************************************************
document.getElementById("compressBtn").onclick = () => {
  const files = fileInput.files;
  if (files.length !== 1) return showMessage("⚠️ Select 1 PDF!", "red");

  const pdf = files[0];
  const quality = document.getElementById("qualitySelect").value;

  toggleButtons(true);
  loader.classList.remove("hidden");
  showMessage("Compressing...");

  // Form submit
  const form = document.createElement("form");
  form.action = "https://pdf-tools-vxz7.onrender.com/compress";
  form.method = "POST";
  form.enctype = "multipart/form-data";
  form.style.display = "none";

  const f1 = document.createElement("input");
  f1.type = "file";
  f1.name = "pdf";

  const dt = new DataTransfer();
  dt.items.add(pdf);
  f1.files = dt.files;

  const q = document.createElement("input");
  q.type = "hidden";
  q.name = "quality";
  q.value = quality;

  form.appendChild(f1);
  form.appendChild(q);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  setTimeout(() => {
    showMessage("✅ Compression complete! Download started.", "green");
    loader.classList.add("hidden");
    toggleButtons(false);
    filePreview.style.display = "none";
  }, 3500);
};
