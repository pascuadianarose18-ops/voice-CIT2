const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose.connect("mongodb://localhost:27017/cit", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Complaint schema
const complaintSchema = new mongoose.Schema({
  student: String,
  category: String,
  details: String,
  evidence: String, // Base64 or file path
  status: { type: String, default: "Submitted" },
  history: [{ status: String, timestamp: String }],
}, { timestamps: true });

const Complaint = mongoose.model("Complaint", complaintSchema);

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Routes
app.get("/complaints", async (req, res) => {
  const complaints = await Complaint.find();
  res.json(complaints);
});

app.post("/complaint", upload.single("evidence"), async (req, res) => {
  const { student, category, details } = req.body;
  const evidence = req.file ? `/uploads/${req.file.filename}` : "No file";

  const newComplaint = new Complaint({
    student,
    category,
    details,
    evidence,
    history: [{ status: "Submitted", timestamp: new Date().toLocaleString() }]
  });

  await newComplaint.save();
  res.json({ success: true, complaint: newComplaint });
});

app.put("/complaint/:id/status", async (req, res) => {
  const { status } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ error: "Not found" });

  complaint.status = status;
  complaint.history.push({ status, timestamp: new Date().toLocaleString() });
  await complaint.save();
  res.json({ success: true, complaint });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));



