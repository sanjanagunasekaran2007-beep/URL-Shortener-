import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs } from "firebase/firestore";
import { db } from "./src/firebase";

const app = express();
const PORT = 3000;

// Enable JSON parser for receiving URL data
app.use(express.json());

/**
 * HELPER: Build host URL dynamically based on request, or fallback to environment.
 * Handles both development (localhost) and production (Cloud Run with HTTPS reverse proxy).
 */
const getHostUrl = (req: express.Request): string => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${protocol}://${req.get("host")}`;
};

/**
 * HELPER: Generate a secure 6-character random alphanumeric code.
 */
const generateShortCode = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/*
 * ==========================================
 * COLLEGE DEMO VIVA: API ENDPOINTS
 * ==========================================
 */

// API Route: Shorten URL
app.post("/api/shorten", async (req, res) => {
  try {
    const { originalUrl, customAlias } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "originalUrl is required" });
    }

    // 1. URL Format Validation using standard URL constructor
    let validatedUrl = originalUrl.trim();
    try {
      // If the user forgot http:// or https://, prepend it for validation
      if (!/^https?:\/\//i.test(validatedUrl)) {
        validatedUrl = "http://" + validatedUrl;
      }
      new URL(validatedUrl);
    } catch (err) {
      return res.status(400).json({ error: "Invalid URL format. Please provide a fully qualified URL (e.g., https://example.com)" });
    }

    let finalCode = "";

    // 2. Custom Alias Handling & Validation
    if (customAlias && customAlias.trim().length > 0) {
      const aliasClean = customAlias.trim();
      
      // Enforce alphanumeric, hyphen and underscore constraint (3 to 30 characters)
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(aliasClean)) {
        return res.status(400).json({ error: "Custom alias must be between 3 and 30 characters and contain only letters, numbers, hyphens, or underscores." });
      }

      // Prevent users from overwriting crucial system routes
      if (["api", "assets", "vite", "favicon", "static"].includes(aliasClean.toLowerCase())) {
        return res.status(400).json({ error: "This alias is a reserved system path. Please choose another one." });
      }

      // Check Firestore to see if this alias is already taken
      const aliasDocRef = doc(db, "links", aliasClean);
      const aliasDocSnap = await getDoc(aliasDocRef);
      if (aliasDocSnap.exists()) {
        return res.status(400).json({ error: "Custom alias is already in use. Please try another one." });
      }

      finalCode = aliasClean;
    } else {
      // 3. Random Alphanumeric Short Code Generation with collision check
      let attempts = 0;
      let generatedCode = "";
      while (attempts < 5) {
        generatedCode = generateShortCode();
        const codeDocRef = doc(db, "links", generatedCode);
        const codeDocSnap = await getDoc(codeDocRef);
        if (!codeDocSnap.exists()) {
          finalCode = generatedCode;
          break;
        }
        attempts++;
      }
      if (!finalCode) {
        return res.status(500).json({ error: "Failed to generate a unique short code. Please try again." });
      }
    }

    // 4. Save mapping to Firestore Database
    const linkDocRef = doc(db, "links", finalCode);
    const linkData = {
      originalUrl: validatedUrl,
      createdAt: Date.now(),
      clicks: 0
    };
    await setDoc(linkDocRef, linkData);

    const baseUrl = getHostUrl(req);
    res.status(201).json({
      id: finalCode,
      originalUrl: validatedUrl,
      createdAt: linkData.createdAt,
      clicks: linkData.clicks,
      shortUrl: `${baseUrl}/${finalCode}`
    });

  } catch (error: any) {
    console.error("Error creating short link:", error);
    res.status(500).json({ error: "Internal server error: " + error.message });
  }
});

// API Route: Fetch History of Shortened Links
app.get("/api/history", async (req, res) => {
  try {
    // Read all links from the Firestore 'links' collection
    const querySnapshot = await getDocs(collection(db, "links"));
    const links: any[] = [];
    const baseUrl = getHostUrl(req);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      links.push({
        id: doc.id,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt || Date.now(),
        clicks: data.clicks || 0,
        shortUrl: `${baseUrl}/${doc.id}`
      });
    });

    // Sort in memory by creation time descending (avoiding index requirements)
    links.sort((a, b) => b.createdAt - a.createdAt);

    res.json(links);
  } catch (error: any) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Failed to load links: " + error.message });
  }
});

/*
 * =========================================================================================
 * COLLEGE DEMO VIVA: SERVER-SIDE REDIRECTION LOGIC
 * =========================================================================================
 * When a user visits https://linksnap.app/:shortCode, this route intercepts the request.
 * It queries Firestore to look up the shortCode document in the "links" collection:
 * 
 * 1. If the shortCode is found:
 *    - The clicks counter is atomically incremented by 1 in Firestore (database lookup & write).
 *    - The server issues a HTTP 302 redirect with the original URL, immediately routing the client.
 * 2. If not found or if the request is for system assets:
 *    - It redirects the user back to the home page with an error query parameter (?error=not_found)
 *      so that the React client-side app can display a polished, context-aware notification.
 * =========================================================================================
 */
app.get("/:shortCode", async (req, res, next) => {
  const { shortCode } = req.params;

  // Protect system-level assets & API routes from redirection lookup
  if (
    ["api", "assets", "static", "vite", "favicon.ico", "index.html"].includes(shortCode.toLowerCase()) ||
    shortCode.includes(".")
  ) {
    return next();
  }

  try {
    // 1. Create a reference to the document in Firestore
    const docRef = doc(db, "links", shortCode);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // 2. Increment the click counter atomically
      await updateDoc(docRef, {
        clicks: increment(1)
      });

      // 3. Issue HTTP 302 Found Redirect to the original URL
      return res.redirect(data.originalUrl);
    } else {
      // Redirect to homepage with query flag if shortlink is not registered
      return res.redirect("/?error=not_found");
    }
  } catch (error) {
    console.error(`Redirection error for code [${shortCode}]:`, error);
    return res.redirect("/?error=server_error");
  }
});

/*
 * ==========================================
 * VITE DEVELOPMENT VS PRODUCTION BUNDLE MIDDLEWARE
 * ==========================================
 */
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for React SPA Router
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LinkSnap running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
