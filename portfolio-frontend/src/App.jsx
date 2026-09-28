import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

const featuredProjects = [
  {
    index: "01",
    title: "Automated Classroom Attendance System Using Face Recognition and IoT Integration",
    role: "Full-Stack Engineer & Architect",
    date: "September 2026",
    description:
      "Architected an automated facial recognition attendance system for university environments. Eliminated manual roll calls by using IoT cameras and AI to instantly verify student identities, logging the data to a live KPI web dashboard and sending mobile push notifications.",
    tags: [
      "Python",
      "FastAPI",
      "YOLOv8",
      "FaceNet",
      "OpenCV",
      "PostgreSQL",
      "React",
      "Flutter",
      "Supabase",
      "Firebase",
      "ESP32-CAM",
    ],
    liveUrl: "https://interventions-gale-meaningful-deviation.trycloudflare.com/login",
    sourceUrl: "https://github.com/wisdo23/ClassTrack",
  },
  {
    index: "02",
    title: "Bellabeat Consumer Data Analysis (Google Capstone)",
    role: "Data Analyst",
    description:
      "Engineered a cloud-based Python data pipeline to process and visualize smart device fitness data. Utilized Pandas and Seaborn to discover key consumer activity trends, mathematically proving the correlation between daily steps and caloric burn to drive high-level marketing strategy recommendations.",
    tags: ["Python", "Pandas", "Data Visualization", "Matplotlib", "Data Analytics"],
    image: "/bellabeat-chart.png",
    imageAlt: "Scatter plot of daily steps versus calories burned from the Bellabeat analysis",
  },
  {
    index: "03",
    title: "Nyatefe (OSINT Platform)",
    role: "Software Engineer",
    description:
      "An OSINT workspace for gathering, organizing, and reviewing publicly available information in one place.",
    tags: [],
  },
];

const hiddenProjectNames = new Set(["Bellabeat Data Analysis", "Nyatefe (OSINT Platform)"]);

const emptyProject = {
  name: "",
  date: "",
  description: "",
  liveUrl: "",
  sourceUrl: "",
};

async function api(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) {
    throw new Error("The database request failed");
  }
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  return type.includes("application/json") ? response.json() : null;
}

function formatProjectDate(value) {
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

const skills = [
  { name: "SQL", detail: "Queries that answer a specific business question" },
  { name: "PostgreSQL", detail: "Local relational storage, modeled and queried directly" },
  { name: "Python", detail: "Analysis pipelines and the APIs behind the product" },
  { name: "React", detail: "Interfaces for exploring data and using the tools" },
  { name: "Excel", detail: "Cleaning, modeling, and fast stakeholder analysis" },
  { name: "Tableau", detail: "Visual analysis people can read without a walkthrough" },
];

const certificatePoints = [
  "Frame the question before touching the dataset",
  "Prepare and clean data in spreadsheets and SQL",
  "Analyze it, then present the result in Tableau",
  "Document the work so someone else can follow it",
];

function App() {
  const [portfolio, setPortfolio] = useState({ projects: [], deleted: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(emptyProject);
  const [formError, setFormError] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [binOpen, setBinOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);
  const { projects, deleted } = portfolio;
  const extraProjects = projects.filter((project) => !hiddenProjectNames.has(project.name));

  useEffect(() => {
    let active = true;
    api("/api/projects")
      .then((data) => {
        if (active) setPortfolio(data);
      })
      .catch(() => {
        if (active) setLoadError("Projects could not be loaded from PostgreSQL.");
      });
    api("/api/profile")
      .then((data) => {
        if (active) setHasPhoto(data.hasPhoto);
      })
      .catch(() => {
        if (active) setLoadError("The profile could not be loaded from PostgreSQL.");
      });
    return () => {
      active = false;
    };
  }, []);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function addProject(event) {
    event.preventDefault();
    const name = draft.name.trim();
    const description = draft.description.trim();
    const liveUrl = draft.liveUrl.trim();
    const sourceUrl = draft.sourceUrl.trim();

    if (!name || !draft.date || !description) {
      setFormError("Name, date, and description are required.");
      return;
    }
    if (liveUrl && !safeHttpUrl(liveUrl)) {
      setFormError("The working page link must start with http:// or https://.");
      return;
    }
    if (sourceUrl && !safeHttpUrl(sourceUrl)) {
      setFormError("The source code link must start with http:// or https://.");
      return;
    }

    setFormError("");
    try {
      const created = await api("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date: draft.date,
          description,
          liveUrl: liveUrl ? safeHttpUrl(liveUrl) : "",
          sourceUrl: sourceUrl ? safeHttpUrl(sourceUrl) : "",
        }),
      });
      setPortfolio((current) => ({ ...current, projects: [created, ...current.projects] }));
      setDraft(emptyProject);
      setFormOpen(false);
    } catch {
      setFormError("The project could not be saved to PostgreSQL.");
    }
  }

  async function confirmRemoval() {
    if (!pendingRemoval) return;
    try {
      await api(`/api/projects/${pendingRemoval.id}/remove`, { method: "POST" });
      setPortfolio((current) => ({
        projects: current.projects.filter((project) => project.id !== pendingRemoval.id),
        deleted: [pendingRemoval, ...current.deleted.filter((project) => project.id !== pendingRemoval.id)],
      }));
      setPendingRemoval(null);
      setBinOpen(true);
    } catch {
      setLoadError("The project could not be moved to the recycle bin.");
    }
  }

  async function restoreProject(id) {
    const project = deleted.find((item) => item.id === id);
    if (!project) return;
    try {
      await api(`/api/projects/${id}/restore`, { method: "POST" });
      setPortfolio((current) => ({
        projects: [project, ...current.projects.filter((item) => item.id !== id)],
        deleted: current.deleted.filter((item) => item.id !== id),
      }));
    } catch {
      setLoadError("The project could not be restored.");
    }
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    try {
      const result = await api("/api/profile/photo", { method: "PUT", body });
      setHasPhoto(result.hasPhoto);
      setPhotoVersion((version) => version + 1);
    } catch {
      setLoadError("The photo could not be saved to PostgreSQL.");
    }
  }

  return (
    <div className="min-h-screen bg-ink text-paper">
      <header className="relative z-10 w-full border-b border-line bg-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
          <a href="#top" className="font-serif text-lg tracking-tight">
            Wisdom Kudzo
          </a>
          <nav className="flex min-w-0 items-center gap-6 text-sm text-muted">
            <a className="transition-colors hover:text-paper" href="#certificate">
              Certificate
            </a>
            <a className="transition-colors hover:text-paper" href="#projects">
              Projects
            </a>
            <a className="transition-colors hover:text-paper" href="#skills">
              Skills
            </a>
            <button
              type="button"
              onClick={() => setBinOpen(true)}
              aria-label={`Recycle bin, ${deleted.length} removed`}
              className="relative flex h-9 w-9 items-center justify-center border border-line text-brass hover:border-brass"
            >
              <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
              {deleted.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-brass px-1 text-[10px] font-medium text-ink">
                  {deleted.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {binOpen && (
        <div className="fixed inset-0 z-30 flex items-start justify-center bg-ink/80 px-6 pt-24">
          <button
            type="button"
            aria-label="Close recycle bin"
            onClick={() => setBinOpen(false)}
            className="absolute inset-0"
          />
          <section className="relative z-10 w-full max-w-md border border-line bg-panel p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center border border-line text-brass">
                  <Trash2 size={18} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h2 className="font-serif text-2xl tracking-tight">Recycle bin</h2>
              </div>
              <button
                type="button"
                onClick={() => setBinOpen(false)}
                className="border border-line px-3 py-2 text-xs uppercase tracking-[0.14em] text-paper hover:border-brass"
              >
                Close
              </button>
            </div>
            {deleted.length > 0 ? (
              <ul className="mt-6 flex flex-col border border-line bg-ink">
                {deleted.map((project) => (
                  <li
                    key={project.id}
                    className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0"
                  >
                    <span>{project.name}</span>
                    <button
                      type="button"
                      onClick={() => restoreProject(project.id)}
                      className="border border-line px-3 py-2 text-xs uppercase tracking-[0.14em] text-paper hover:border-brass hover:text-brass"
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 border border-line bg-ink px-4 py-4 text-sm text-muted">
                No removed projects.
              </p>
            )}
          </section>
        </div>
      )}

      {pendingRemoval && (
        <div className="border-b border-line bg-panel">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
            <p className="text-sm">
              Are you sure you want to remove{" "}
              <span className="text-brass">{pendingRemoval.name}</span>? It will move to the recycle bin.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingRemoval(null)}
                className="border border-line px-4 py-2 text-sm text-paper hover:border-brass"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoval}
                className="bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-brass"
              >
                Yes, remove
              </button>
            </div>
          </div>
        </div>
      )}

      <main id="top">
        {loadError && (
          <p className="mx-auto max-w-6xl px-6 pt-6 text-sm text-brass lg:px-8">{loadError}</p>
        )}
        <section className="mx-auto grid max-w-6xl items-end gap-10 px-6 pb-24 pt-20 lg:grid-cols-[auto_1fr] lg:px-8 lg:pb-32 lg:pt-28">
          <div>
            <div className="h-36 w-36 overflow-hidden border border-line bg-panel">
              {hasPhoto ? (
                <img
                  src={`/api/profile/photo?v=${photoVersion}`}
                  alt="Wisdom Kudzo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-serif text-3xl text-brass">WK</div>
              )}
            </div>
            <label className="mt-3 block cursor-pointer text-xs uppercase tracking-[0.18em] text-muted hover:text-paper">
              {hasPhoto ? "Edit photo" : "Upload photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadPhoto} />
            </label>
          </div>
          <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-brass">
            Google Certified Data Analyst
          </p>
          <h1 className="mt-6 max-w-4xl font-serif text-[clamp(2.7rem,6.4vw,5.6rem)] leading-[0.96] tracking-tight">
            Wisdom Kudzo <span className="text-brass">|</span>{" "}
            <span className="italic">Data Analyst & Software Engineer</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
            I analyze operational data until the decision is obvious, then build
            the software that keeps that decision close to the work.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#projects"
              className="bg-paper px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass"
            >
              View projects
            </a>
            <a
              href="#certificate"
              className="border border-line px-5 py-3 text-sm text-paper transition-colors hover:border-brass hover:text-brass"
            >
              Google certificate
            </a>
          </div>
          </div>
        </section>

        <section id="certificate" className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-24">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-brass">
                01 — Credential
              </p>
              <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
                Google Data Analytics Certificate
              </h2>
            </div>
            <div className="border border-line bg-panel p-8 sm:p-10">
              <p className="text-sm uppercase tracking-[0.22em] text-muted">
                Google · Professional Certificate
              </p>
              <p className="mt-6 text-lg leading-relaxed">
                Training across the full analyst workflow: ask a precise
                question, prepare the data, analyze it, and share a result a
                stakeholder can act on.
              </p>
              <ul className="mt-8 space-y-4">
                {certificatePoints.map((point) => (
                  <li key={point} className="flex gap-4 text-muted">
                    <span className="mt-2 h-px w-6 shrink-0 bg-brass" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="projects" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-24">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-brass">
              02 — Selected work
            </p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">Projects</h2>
              <button
                type="button"
                onClick={() => {
                  setFormOpen((open) => !open);
                  setFormError("");
                }}
                className="bg-paper px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-brass"
              >
                {formOpen ? "Close" : "Add project"}
              </button>
            </div>

            {formOpen && (
              <form onSubmit={addProject} className="mt-8 border border-line bg-panel p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm text-muted">
                    Project name
                    <input
                      required
                      value={draft.name}
                      onChange={(event) => updateDraft("name", event.target.value)}
                      className="mt-2 w-full border border-line bg-ink px-3 py-3 text-paper outline-none focus:border-brass"
                    />
                  </label>
                  <label className="block text-sm text-muted">
                    Date
                    <input
                      required
                      type="month"
                      value={draft.date}
                      onChange={(event) => updateDraft("date", event.target.value)}
                      className="mt-2 w-full border border-line bg-ink px-3 py-3 text-paper outline-none focus:border-brass"
                    />
                  </label>
                </div>
                <label className="mt-5 block text-sm text-muted">
                  Description
                  <textarea
                    required
                    rows={4}
                    value={draft.description}
                    onChange={(event) => updateDraft("description", event.target.value)}
                    className="mt-2 w-full resize-y border border-line bg-ink px-3 py-3 text-paper outline-none focus:border-brass"
                  />
                </label>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm text-muted">
                    Working page
                    <input
                      type="url"
                      placeholder="https://"
                      value={draft.liveUrl}
                      onChange={(event) => updateDraft("liveUrl", event.target.value)}
                      className="mt-2 w-full border border-line bg-ink px-3 py-3 text-paper outline-none placeholder:text-muted/60 focus:border-brass"
                    />
                  </label>
                  <label className="block text-sm text-muted">
                    Source code
                    <input
                      type="url"
                      placeholder="https://"
                      value={draft.sourceUrl}
                      onChange={(event) => updateDraft("sourceUrl", event.target.value)}
                      className="mt-2 w-full border border-line bg-ink px-3 py-3 text-paper outline-none placeholder:text-muted/60 focus:border-brass"
                    />
                  </label>
                </div>
                {formError && <p className="mt-4 text-sm text-brass">{formError}</p>}
                <button
                  type="submit"
                  className="mt-6 border border-brass px-5 py-3 text-sm text-brass transition-colors hover:bg-brass hover:text-ink"
                >
                  Save project
                </button>
              </form>
            )}

            <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-2">
              {featuredProjects.map((project) => (
                <article
                  key={project.title}
                  className="flex h-full flex-col border border-line bg-panel p-8 transition-colors hover:border-brass/50 sm:p-10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">{project.index}</p>
                    <p className="text-right text-xs uppercase tracking-[0.18em] text-muted">
                      {project.role}
                      {project.date ? ` · ${project.date}` : ""}
                    </p>
                  </div>
                  {project.image && (
                    <img
                      src={project.image}
                      alt={project.imageAlt}
                      className="mt-6 w-full border border-line bg-white object-contain"
                    />
                  )}
                  <h3 className="mt-6 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{project.title}</h3>
                  <p className="mt-5 flex-1 leading-relaxed text-muted">{project.description}</p>
                  {project.tags.length > 0 && (
                    <ul className="mt-8 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <li
                          key={tag}
                          className="border border-line bg-ink px-3 py-1.5 text-xs tracking-wide text-paper"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                  {(project.liveUrl || project.sourceUrl) && (
                    <div className="mt-8 flex flex-wrap gap-4 text-sm">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-paper underline decoration-brass underline-offset-4 hover:text-brass"
                        >
                          Working page
                        </a>
                      )}
                      {project.sourceUrl && (
                        <a
                          href={project.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-paper underline decoration-brass underline-offset-4 hover:text-brass"
                        >
                          View Code on GitHub
                        </a>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {extraProjects.length > 0 && (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {extraProjects.map((project) => {
                const liveUrl = safeHttpUrl(project.liveUrl);
                const sourceUrl = safeHttpUrl(project.sourceUrl);
                return (
                  <article key={project.id} className="flex flex-col border border-line bg-panel p-8">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-brass">
                        {formatProjectDate(project.date)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPendingRemoval(project)}
                        className="text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-paper"
                      >
                        Remove
                      </button>
                    </div>
                    <h3 className="mt-4 font-serif text-3xl tracking-tight">{project.name}</h3>
                    <p className="mt-4 flex-1 leading-relaxed text-muted">{project.description}</p>
                    <div className="mt-8 flex flex-wrap gap-4 text-sm">
                      {liveUrl && (
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-paper underline decoration-brass underline-offset-4 hover:text-brass"
                        >
                          Working page
                        </a>
                      )}
                      {sourceUrl && (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-paper underline decoration-brass underline-offset-4 hover:text-brass"
                        >
                          Source code
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            )}
          </div>
        </section>

        <section id="skills" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-24">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-brass">
              03 — Toolkit
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">Skills</h2>
            <ul className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <li key={skill.name} className="bg-ink p-6 sm:p-8">
                  <h3 className="font-serif text-2xl tracking-tight">{skill.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{skill.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>Wisdom Kudzo</p>
          <p>Data Analyst & Software Engineer</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
