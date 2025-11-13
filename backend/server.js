import express from "express";
import cors from "cors";
import mergeRoute from "./routes/merge.js";
import splitRoute from "./routes/split.js";
import compressRoute from "./routes/compress.js"


const app = express(); // ✅ app create FIRST
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  exposedHeaders: ["Content-Disposition"]
}));
app.use(express.json());

// ✅ after app created
app.use("/merge", mergeRoute);
app.use("/split", splitRoute);
app.use("/compress", compressRoute);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => console.log(`✅ Server running on PORT:3000`));
