"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, LayoutGrid, FileText, 
  Github, Plus, Edit2, Trash2, FileEdit, Eye, RefreshCw, Database 
} from "lucide-react";
import { useToast } from "@/providers/toast-provider";
import ReactMarkdown from "react-markdown";

interface KnowledgeStatus {
  knowledge_version: string;
  updated_at: string;
  sources: Record<string, {
    source: string;
    loaded: boolean;
    last_updated: string;
    content_hash: string;
    path: string;
    error: string | null;
  }>;
  github_repositories: number;
  data_dir?: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "blogs">("overview");
  const [isSyncing, setIsSyncing] = useState(false);
  const [knowledge, setKnowledge] = useState<KnowledgeStatus | null>(null);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(true);

  const loadKnowledgeStatus = useCallback(async () => {
    setIsLoadingKnowledge(true);
    try {
      const response = await fetch(`/api/ai/knowledge/status`, { cache: "no-store" });
      if (response.ok) {
        setKnowledge((await response.json()) as KnowledgeStatus);
      }
    } catch (err) {
      console.error("Failed to load knowledge status:", err);
    } finally {
      setIsLoadingKnowledge(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ai/knowledge/status`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setKnowledge(data as KnowledgeStatus);
      })
      .catch((err) => console.error("Failed to load knowledge status:", err))
      .finally(() => {
        if (!cancelled) setIsLoadingKnowledge(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Editor states
  const [editingItem, setEditingItem] = useState<{ id: string; title: string; content: string; type: "project" | "blog" } | null>(null);
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");

  const [projects, setProjects] = useState([
    { id: "1", title: "AI-First Portfolio Platform", category: "AI/RAG", status: "published", date: "2026-07-30" },
    { id: "2", title: "CodeTrace Visualization", category: "Developer Tool", status: "published", date: "2026-06-15" },
    { id: "3", title: "Supabase RBAC Auth Guard", category: "Security", status: "draft", date: "2026-08-01" }
  ]);

  const [blogs, setBlogs] = useState([
    { id: "1", title: "Decoupled LLM APIs in Production Gateways", category: "AI", status: "published", date: "2026-07-28" },
    { id: "2", title: "Optimizing Server-Sent Events (SSE) in Next.js 15", category: "Next.js", status: "published", date: "2026-06-15" }
  ]);

  const handleSync = async () => {
    setIsSyncing(true);
    toast("Initiating GitHub synchronization process...", "info");
    
    try {
      const response = await fetch(`/api/admin/github-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (response.ok) {
        toast(`GitHub repositories synchronized (${result.count} repositories).`, "success");
      } else {
        toast(result.message || "GitHub sync failed.", "error");
      }
    } catch (err) {
      console.error("GitHub sync error:", err);
      toast("GitHub sync request failed.", "error");
    } finally {
      setIsSyncing(false);
      loadKnowledgeStatus();
    }
  };

  const handleRefreshKnowledge = async () => {
    try {
      const response = await fetch(`/api/ai/knowledge/refresh`, { method: "POST" });
      const result = await response.json();
      toast(result.changed ? "Knowledge refreshed from data sources." : "Knowledge already up to date.", "success");
      loadKnowledgeStatus();
    } catch (err) {
      console.error("Knowledge refresh error:", err);
      toast("Knowledge refresh failed.", "error");
    }
  };

  const handleSave = () => {
    if (!editingItem) return;
    
    if (editingItem.type === "project") {
      setProjects(prev => prev.map(p => p.id === editingItem.id ? { ...p, title: editingItem.title } : p));
      toast("Project details saved successfully.", "success");
    } else {
      setBlogs(prev => prev.map(b => b.id === editingItem.id ? { ...b, title: editingItem.title } : b));
      toast("Blog article changes saved.", "success");
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string, type: "project" | "blog") => {
    if (type === "project") {
      setProjects(prev => prev.filter(p => p.id !== id));
      toast("Project successfully removed.", "warning");
    } else {
      setBlogs(prev => prev.filter(b => b.id !== id));
      toast("Blog post removed.", "warning");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-12rem)]">
      
      {/* Sidebar Control Panel */}
      <aside className="w-full md:w-64 border border-border bg-card rounded-xl p-5 shrink-0 h-fit space-y-4">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">CMS Management</h2>
        
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => { setActiveTab("overview"); setEditingItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all ${
              activeTab === "overview" && !editingItem ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard Overview</span>
          </button>
          
          <button
            onClick={() => { setActiveTab("projects"); setEditingItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all ${
              activeTab === "projects" && !editingItem ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Projects Editor</span>
          </button>
          
          <button
            onClick={() => { setActiveTab("blogs"); setEditingItem(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all ${
              activeTab === "blogs" && !editingItem ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Blogs Publisher</span>
          </button>
        </nav>

        <div className="border-t border-border pt-4 mt-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold px-2">
            <span>LLM GATEWAY</span>
            <span className="text-emerald-500 font-bold">ACTIVE</span>
          </div>
          <div className="p-2.5 border border-border bg-muted/40 rounded-lg text-[10px] text-muted-foreground/80 leading-relaxed font-mono">
            Provider: Google Gemini<br />
            Status: Sub-500ms
          </div>
        </div>
      </aside>

      {/* Main Workspace content */}
      <main className="flex-1 min-w-0">
        
        {/* Editor Screen Overlay */}
        {editingItem ? (
          <div className="p-6 border border-border bg-card rounded-xl space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{editingItem.type} publisher</span>
                <h2 className="text-xl font-bold text-foreground">Editing Document</h2>
              </div>
              
              {/* Mode toggles */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditorMode("edit")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                    editorMode === "edit" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  <FileEdit className="h-3.5 w-3.5" />
                  <span>Editor</span>
                </button>
                <button
                  onClick={() => setEditorMode("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                    editorMode === "preview" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Document details form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Document Title</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border bg-background rounded-lg text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Textarea vs Markdown Render view */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Markdown Content</label>
                {editorMode === "edit" ? (
                  <textarea
                    rows={12}
                    value={editingItem.content}
                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                    className="w-full p-4 border border-border bg-background rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <div className="p-4 border border-border bg-muted/20 rounded-lg min-h-[300px] text-sm prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{editingItem.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end border-t border-border pt-4">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-border bg-card rounded-lg text-xs font-semibold hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          /* Tab workspaces list */
          <div className="space-y-6">
            
            {/* Tab: Overview / Dashboard */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* Stats cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 border border-border bg-card rounded-xl space-y-2 shadow-sm">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Projects</span>
                    <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                  </div>
                  <div className="p-5 border border-border bg-card rounded-xl space-y-2 shadow-sm">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Blogs</span>
                    <p className="text-2xl font-bold text-foreground">{blogs.length}</p>
                  </div>
                  <div className="p-5 border border-border bg-card rounded-xl space-y-2 shadow-sm">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Conversations Today</span>
                    <p className="text-2xl font-bold text-foreground">12</p>
                  </div>
                  <div className="p-5 border border-border bg-card rounded-xl space-y-2 shadow-sm">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Gemini Status</span>
                    <p className="text-2xl font-bold text-emerald-500">100%</p>
                  </div>
                </div>

                {/* GitHub Sync panel */}
                <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5 text-foreground" />
                    <h3 className="font-bold text-sm text-foreground">GitHub Integration Sync</h3>
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                    Synchronize your repository stars, readme logs, and project metadata dynamically to populate grounded database knowledge fields.
                  </p>

                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Syncing Repositories..." : "Synchronize Now"}</span>
                  </button>
                </div>

                {/* Knowledge Base diagnostic panel */}
                <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-foreground" />
                    <h3 className="font-bold text-sm text-foreground">AI Knowledge Base Status</h3>
                    <button
                      onClick={handleRefreshKnowledge}
                      className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground border border-border bg-background px-2.5 py-1.5 rounded-md hover:text-foreground transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Refresh
                    </button>
                  </div>

                  {isLoadingKnowledge && !knowledge ? (
                    <p className="text-xs text-muted-foreground">Loading knowledge status...</p>
                  ) : knowledge ? (
                    <div className="space-y-3">
                      {Object.entries(knowledge.sources || {}).map(([name, info]) => (
                        <div key={name} className="p-3 border border-border bg-muted/40 rounded-lg space-y-1 text-[10px] font-mono leading-relaxed text-muted-foreground/90">
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase tracking-wider text-foreground">{name}</span>
                            <span className={info.loaded ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                              {info.loaded ? "Loaded" : "Missing"}
                            </span>
                          </div>
                          <div>Last updated: {info.last_updated || "N/A"}</div>
                          <div className="break-all">Content hash: {info.content_hash || "N/A"}</div>
                        </div>
                      ))}
                      <div className="p-3 border border-border bg-muted/40 rounded-lg space-y-1 text-[10px] font-mono text-muted-foreground/90">
                        <div>GitHub repositories: {knowledge.github_repositories}</div>
                        <div className="break-all">Knowledge version: {knowledge.knowledge_version}</div>
                        <div>Last refresh: {knowledge.updated_at}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Could not load knowledge status.</p>
                  )}
                </div>
                
              </div>
            )}

            {/* Tab: Projects Table view */}
            {activeTab === "projects" && (
              <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-lg text-foreground">Projects catalog</h3>
                  <button
                    onClick={() => toast("Initiating document setup...", "info")}
                    className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {projects.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="py-3.5 px-4 font-bold text-foreground">{p.title}</td>
                          <td className="py-3.5 px-4 text-muted-foreground">{p.category}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 border rounded-full font-semibold text-[10px] ${
                              p.status === "published" ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/25" : "bg-muted text-muted-foreground border-border"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground/60">{p.date}</td>
                          <td className="py-3.5 px-4 text-right flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingItem({ id: p.id, title: p.title, content: "# Details \n Write markdown logic here.", type: "project" })}
                              className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, "project")}
                              className="p-1 hover:bg-rose-500/10 rounded text-muted-foreground hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Blogs Table view */}
            {activeTab === "blogs" && (
              <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-lg text-foreground">Blog Articles</h3>
                  <button
                    onClick={() => toast("Initiating editor workspace...", "info")}
                    className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Write Post</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Article</th>
                        <th className="py-3 px-4">Topic</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {blogs.map((b) => (
                        <tr key={b.id} className="hover:bg-muted/30">
                          <td className="py-3.5 px-4 font-bold text-foreground">{b.title}</td>
                          <td className="py-3.5 px-4 text-muted-foreground">{b.category}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 border border-emerald-500/25 bg-emerald-500/5 text-emerald-500 rounded-full font-semibold text-[10px]">
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground/60">{b.date}</td>
                          <td className="py-3.5 px-4 text-right flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingItem({ id: b.id, title: b.title, content: "# Markdown post \n Begin writing here.", type: "blog" })}
                              className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(b.id, "blog")}
                              className="p-1 hover:bg-rose-500/10 rounded text-muted-foreground hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

    </div>
  );
}
