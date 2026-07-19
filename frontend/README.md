# PaperPilot — Frontend UI Client (React)

The frontend for PaperPilot is a premium Single Page Application (SPA) built using **React 19**, styled with **Tailwind CSS**, and utilizing **Radix UI primitives** (via shadcn/ui configuration).

---

## 🎨 Premium Features

*   **Responsive Faculty Dashboards**: Dynamic overview of class performance and average grading drift.
*   **Interactive Evaluation & Review**: Interfaces for submitting subjective tests and correcting AI grades.
*   **Model Monitoring Dashboard**: Visual metrics for model error, response times, and RAG retrieval scores powered by `recharts`.
*   **Seamless Database Explorer**: View current collections and document counts directly.

---

## ⚙️ Environment Variables

The application relies on the following build-time environment variable:

| Key | Description | Example |
| :--- | :--- | :--- |
| `REACT_APP_BACKEND_URL` | The HTTP root URL of the running API (no trailing `/api` prefix). | `https://paperpilot-api.onrender.com` |

> ⚠️ **Important**: CRA bundles environment variables during compile/build time. If deploying to Vercel, define this variable in the **Vercel Project Settings** *before* deploying or triggering a new build.

---

## 🛠️ Local Development

1.  Ensure you have Node.js 18+ installed.
2.  Install dependencies using `--legacy-peer-deps` (needed for some UI packages matching React 19):
    ```bash
    npm install --legacy-peer-deps
    ```
3.  Configure local environment in `frontend/.env`:
    ```env
    REACT_APP_BACKEND_URL=http://localhost:8000
    ```
4.  Run development server:
    ```bash
    npm start
    ```

---

## 🚀 Build & Vercel Deployment

### Build Command
To compile the React bundle for production:
```bash
npm run build
```

### Vercel Deployment Settings
When deploying to Vercel, use the following configuration settings:
*   **Framework Preset**: Create React App (auto-detected).
*   **Root Directory**: `frontend` (crucial since this is a monorepo).
*   **Build Command**: `npm run build` (runs `craco build`).
*   **Install Command**: `npm install --legacy-peer-deps`.
*   **Output Directory**: `build`.
*   **Rewrites (vercel.json)**: Redirects all routes to `index.html` to support client-side React Router routing.
