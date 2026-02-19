import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import {
  fetchAllContent,
  updateContent,
  deleteContent,
  fetchAllMessages,
  sendMessage as sendFirestoreMessage,
  markMessageRead,
  deleteMessage,
  fetchPosterClicks,
  fetchWebConfig,
  updateWebConfig,
  fetchHomeSections,
  fetchAllUsers,
  updateUser,
  deleteUser as deleteFirestoreUser,
  fetchSplashConfig,
  updateSplashConfig,
  importContent,
} from "@/lib/firestore";
import {
  searchTmdb,
  fetchTmdbDetails,
  fetchTmdbSeasonDetails,
  TMDB_IMG_BASE,
  type TmdbSearchResult,
  type TmdbEpisode,
} from "@/lib/tmdb";
import type { Content, Message } from "@/types/content";
import { serverTimestamp } from "firebase/firestore";
import {
  Search, Trash2, Edit, MessageSquare, BarChart3, Settings,
  Film, Users, Home, Download, ChevronDown, ChevronUp,
  CheckCheck, Send, Plus, Shield, Star, Eye, X, Save,
  RefreshCw, ToggleLeft, ToggleRight, Image,
} from "lucide-react";
import { getImageUrl } from "@/lib/image";
import { useToast } from "@/components/ui/use-toast";

type Tab = "tmdb" | "content" | "users" | "messages" | "sections" | "analytics" | "settings";

// ─── TMDB Import Modal ────────────────────────────────────────────────────────
interface ImportModalProps {
  item: TmdbSearchResult;
  onClose: () => void;
  onImported: () => void;
  adminEmail: string;
}

const PLATFORMS = [
  { id: "netflix", label: "Netflix" },
  { id: "disney", label: "Disney+" },
  { id: "hbo", label: "Max (HBO)" },
  { id: "prime", label: "Prime Video" },
  { id: "paramount", label: "Paramount+" },
];
const HOME_SECTIONS = [
  { id: "slider", label: "Slider Principal" },
  { id: "estreno", label: "En Estreno/Emisión" },
  { id: "agregado", label: "Recién Agregado" },
];
const MAIN_SECTIONS = [
  { id: "movies", label: "Películas" },
  { id: "series", label: "Series" },
  { id: "animes", label: "Animes" },
  { id: "doramas", label: "Doramas" },
];

function ImportModal({ item, onClose, onImported, adminEmail }: ImportModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"urls" | "options">("urls");
  const [loading, setLoading] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [movieUrl, setMovieUrl] = useState("");
  const [seasons, setSeasons] = useState<any[]>([]);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [episodeUrls, setEpisodeUrls] = useState<Record<string, string>>({});
  const [selectedMainSections, setSelectedMainSections] = useState<string[]>(
    item.media_type === "movie" ? ["movies"] : ["series"]
  );
  const [selectedHomeSections, setSelectedHomeSections] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    if (item.media_type === "tv") loadSeasons();
  }, []);

  const loadSeasons = async () => {
    setLoadingSeasons(true);
    try {
      const details = await fetchTmdbDetails(item.id, "tv");
      const seasonsData: any[] = [];
      for (const s of (details.seasons || [])) {
        if (s.season_number === 0) continue;
        const seasonDetail = await fetchTmdbSeasonDetails(item.id, s.season_number);
        seasonsData.push({ ...s, episodes: seasonDetail.episodes || [] });
      }
      setSeasons(seasonsData);
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar las temporadas", variant: "destructive" });
    } finally {
      setLoadingSeasons(false);
    }
  };

  const handleEpUrl = (seasonNum: number, epNum: number, value: string) => {
    setEpisodeUrls(prev => ({ ...prev, [`s${seasonNum}e${epNum}`]: value }));
  };

  const toggleSection = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const displayOptions = {
        main_sections: selectedMainSections,
        home_sections: selectedHomeSections,
        platforms: selectedPlatforms,
      };

      const base: any = {
        id: item.id,
        media_type: item.media_type,
        title: item.title || item.name || "",
        original_title: item.original_title || item.original_name,
        overview: item.overview,
        poster_path: item.poster_path || "",
        backdrop_path: item.backdrop_path,
        release_date: item.release_date || item.first_air_date,
        vote_average: item.vote_average,
        genres: item.genre_ids || [],
        display_options: displayOptions,
        imported_by: adminEmail,
        imported_at: serverTimestamp(),
      };

      if (item.media_type === "movie") {
        base.video_url = movieUrl;
      } else {
        const seasonsMap: any = {};
        for (const season of seasons) {
          const eps: any = {};
          for (const ep of (season.episodes || [])) {
            eps[ep.episode_number] = {
              episode_number: ep.episode_number,
              name: ep.name,
              overview: ep.overview || "",
              still_path: ep.still_path || "",
              video_url: episodeUrls[`s${season.season_number}e${ep.episode_number}`] || "",
            };
          }
          seasonsMap[season.season_number] = {
            season_number: season.season_number,
            episodes: eps,
          };
        }
        base.seasons = seasonsMap;
      }

      await importContent(base, item.id);
      toast({ title: "Importado", description: `"${base.title}" importado correctamente` });
      onImported();
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error al importar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-secondary text-foreground rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            {item.poster_path && (
              <img src={`${TMDB_IMG_BASE}/w92${item.poster_path}`} alt={item.title || item.name} className="w-10 h-14 object-cover rounded" />
            )}
            <div>
              <h3 className="font-bold text-sm">{item.title || item.name}</h3>
              <p className="text-xs text-muted-foreground">{item.media_type === "movie" ? "Película" : "Serie"} · {(item.release_date || item.first_air_date || "").split("-")[0]}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: URLs */}
          {step === "urls" && (
            <>
              <h4 className="font-semibold text-sm flex items-center gap-2"><Film className="w-4 h-4" /> Agregar URLs de Video</h4>
              {item.media_type === "movie" ? (
                <div>
                  <label className="text-xs text-muted-foreground">URL del Video</label>
                  <input value={movieUrl} onChange={e => setMovieUrl(e.target.value)} className={inputCls} placeholder="https://..." />
                </div>
              ) : loadingSeasons ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {seasons.map(season => (
                    <div key={season.season_number} className="border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedSeason(expandedSeason === season.season_number ? null : season.season_number)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-secondary hover:bg-accent text-sm font-medium"
                      >
                        <span>Temporada {season.season_number} · {season.episodes?.length || 0} episodios</span>
                        {expandedSeason === season.season_number ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedSeason === season.season_number && (
                        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                          {(season.episodes || []).map((ep: TmdbEpisode) => (
                            <div key={ep.episode_number} className="space-y-1">
                              <label className="text-xs text-muted-foreground">Ep. {ep.episode_number}: {ep.name}</label>
                              <input
                                value={episodeUrls[`s${season.season_number}e${ep.episode_number}`] || ""}
                                onChange={e => handleEpUrl(season.season_number, ep.episode_number, e.target.value)}
                                className={inputCls}
                                placeholder="https://..."
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setStep("options")} className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90">
                Siguiente → Opciones de Importación
              </button>
            </>
          )}

          {/* Step 2: Options */}
          {step === "options" && (
            <>
              <h4 className="font-semibold text-sm">Opciones de Importación</h4>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Secciones Principales:</p>
                <div className="grid grid-cols-2 gap-2">
                  {MAIN_SECTIONS.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={selectedMainSections.includes(s.id)} onChange={() => toggleSection(selectedMainSections, setSelectedMainSections, s.id)} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Secciones de Inicio:</p>
                <div className="grid grid-cols-2 gap-2">
                  {HOME_SECTIONS.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={selectedHomeSections.includes(s.id)} onChange={() => toggleSection(selectedHomeSections, setSelectedHomeSections, s.id)} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Plataformas:</p>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={selectedPlatforms.includes(p.id)} onChange={() => toggleSection(selectedPlatforms, setSelectedPlatforms, p.id)} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep("urls")} className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-accent">
                  ← Volver
                </button>
                <button onClick={handleImport} disabled={loading} className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                  {loading ? "Importando..." : "Importar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Display Options Modal ───────────────────────────────────────────────
function EditOptionsModal({ content, onClose, onSaved }: { content: Content; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [mainSections, setMainSections] = useState<string[]>(content.display_options?.main_sections || []);
  const [homeSections, setHomeSections] = useState<string[]>(content.display_options?.home_sections || []);
  const [platforms, setPlatforms] = useState<string[]>(content.display_options?.platforms || []);
  const [saving, setSaving] = useState(false);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);

  const handleSave = async () => {
    if (!content.docId) return;
    setSaving(true);
    try {
      await updateContent(content.docId, {
        display_options: { main_sections: mainSections, home_sections: homeSections, platforms },
      } as any);
      toast({ title: "Guardado", description: "Opciones actualizadas" });
      onSaved();
      onClose();
    } catch {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold">Editar opciones: {content.title}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Secciones Principales:</p>
          <div className="grid grid-cols-2 gap-2">
            {MAIN_SECTIONS.map(s => (
              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={mainSections.includes(s.id)} onChange={() => toggle(mainSections, setMainSections, s.id)} />
                {s.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Secciones de Inicio:</p>
          <div className="grid grid-cols-2 gap-2">
            {HOME_SECTIONS.map(s => (
              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={homeSections.includes(s.id)} onChange={() => toggle(homeSections, setHomeSections, s.id)} />
                {s.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Plataformas:</p>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={platforms.includes(p.id)} onChange={() => toggle(platforms, setPlatforms, p.id)} />
                {p.label}
              </label>
            ))}
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────
const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("tmdb");
  const [loading, setLoading] = useState(false);

  // TMDB
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [importingItem, setImportingItem] = useState<TmdbSearchResult | null>(null);
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set());

  // Content management
  const [contentList, setContentList] = useState<Content[]>([]);
  const [contentSearch, setContentSearch] = useState("");
  const [editingOptions, setEditingOptions] = useState<Content | null>(null);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [msgToUser, setMsgToUser] = useState<string | null>(null);
  const [msgToAll, setMsgToAll] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyMsg, setReplyMsg] = useState("");

  // Home sections
  const [homeSections, setHomeSections] = useState<any[]>([]);

  // Analytics
  const [clicks, setClicks] = useState<any[]>([]);

  // Settings
  const [config, setConfig] = useState<Record<string, any>>({});
  const [splashConfig, setSplashConfig] = useState<any>({});

  const inputCls = "w-full px-3 py-2 bg-secondary text-foreground rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm";

  useEffect(() => {
    loadTabData(tab);
  }, [tab]);

  const loadTabData = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === "tmdb" || t === "content") {
        const c = await fetchAllContent();
        setContentList(c);
        setImportedIds(new Set(c.map(item => item.id)));
      }
      if (t === "users") {
        const u = await fetchAllUsers();
        setUsers(u);
      }
      if (t === "messages") {
        const m = await fetchAllMessages();
        setMessages(m);
      }
      if (t === "sections") {
        const s = await fetchHomeSections();
        setHomeSections(s);
      }
      if (t === "analytics") {
        const cl = await fetchPosterClicks();
        setClicks(cl.sort((a: any, b: any) => (b.clicks || b.clickCount || 0) - (a.clicks || a.clickCount || 0)));
      }
      if (t === "settings") {
        const [cfg, splash] = await Promise.all([fetchWebConfig(), fetchSplashConfig()]);
        if (cfg) setConfig(cfg);
        if (splash) setSplashConfig(splash);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── TMDB Search ──
  const handleTmdbSearch = async () => {
    if (!tmdbQuery.trim()) return;
    setTmdbLoading(true);
    try {
      const results = await searchTmdb(tmdbQuery);
      setTmdbResults(results);
    } catch {
      toast({ title: "Error", description: "Error buscando en TMDB", variant: "destructive" });
    } finally {
      setTmdbLoading(false);
    }
  };

  // ── Content delete ──
  const handleDeleteContent = async (docId: string) => {
    if (!confirm("¿Eliminar este contenido?")) return;
    await deleteContent(docId);
    const c = await fetchAllContent();
    setContentList(c);
    setImportedIds(new Set(c.map(item => item.id)));
    toast({ title: "Eliminado", description: "Contenido eliminado" });
  };

  // ── Users ──
  const handleSendMsgToUser = async (toUid: string) => {
    if (!adminMsg.trim() || !user) return;
    await sendFirestoreMessage(user.uid, toUid, adminMsg.trim());
    setAdminMsg("");
    setMsgToUser(null);
    toast({ title: "Enviado", description: "Mensaje enviado" });
  };

  const handleSendToAll = async () => {
    if (!adminMsg.trim() || !user) return;
    for (const u of users) {
      await sendFirestoreMessage(user.uid, u.id, adminMsg.trim());
    }
    setAdminMsg("");
    setMsgToAll(false);
    toast({ title: "Enviado", description: `Mensaje enviado a ${users.length} usuarios` });
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    await deleteFirestoreUser(uid);
    const u = await fetchAllUsers();
    setUsers(u);
    toast({ title: "Eliminado", description: "Usuario eliminado" });
  };

  // ── Messages ──
  const handleReply = async (toUid: string) => {
    if (!replyMsg.trim() || !user) return;
    await sendFirestoreMessage(user.uid, toUid, replyMsg.trim());
    setReplyMsg("");
    setReplyTo(null);
    const m = await fetchAllMessages();
    setMessages(m);
    toast({ title: "Enviado", description: "Respuesta enviada" });
  };

  // ── Settings ──
  const handleSaveConfig = async () => {
    await updateWebConfig(config);
    toast({ title: "Guardado", description: "Configuración guardada" });
  };

  const handleSaveSplash = async () => {
    await updateSplashConfig(splashConfig);
    toast({ title: "Guardado", description: "Splash guardado" });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "tmdb", label: "Importar TMDB", icon: <Download className="w-4 h-4" /> },
    { id: "content", label: "Gestionar", icon: <Film className="w-4 h-4" /> },
    { id: "users", label: "Usuarios", icon: <Users className="w-4 h-4" /> },
    { id: "messages", label: "Mensajes", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "sections", label: "Secciones", icon: <Home className="w-4 h-4" /> },
    { id: "analytics", label: "Estadísticas", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "settings", label: "Configuración", icon: <Settings className="w-4 h-4" /> },
  ];

  const filteredContent = contentList.filter(c =>
    c.title.toLowerCase().includes(contentSearch.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {importingItem && (
        <ImportModal
          item={importingItem}
          adminEmail={user?.email || ""}
          onClose={() => setImportingItem(null)}
          onImported={() => loadTabData("tmdb")}
        />
      )}
      {editingOptions && (
        <EditOptionsModal
          content={editingOptions}
          onClose={() => setEditingOptions(null)}
          onSaved={() => loadTabData("content")}
        />
      )}

      <div className="pt-20 px-4 md:px-8 pb-16 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Contenido", value: contentList.length, icon: <Film className="w-5 h-5" /> },
            { label: "Usuarios", value: users.length, icon: <Users className="w-5 h-5" /> },
            { label: "Mensajes", value: messages.length, icon: <MessageSquare className="w-5 h-5" /> },
            { label: "Clicks totales", value: clicks.reduce((a: number, c: any) => a + (c.clicks || c.clickCount || 0), 0), icon: <BarChart3 className="w-5 h-5" /> },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">{s.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ══ TMDB IMPORT TAB ══════════════════════════════════════════════ */}
            {tab === "tmdb" && (
              <div>
                <div className="flex gap-2 mb-4">
                  <input
                    value={tmdbQuery}
                    onChange={e => setTmdbQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleTmdbSearch()}
                    placeholder="Buscar película o serie en TMDB..."
                    className={inputCls}
                  />
                  <button
                    onClick={handleTmdbSearch}
                    disabled={tmdbLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {tmdbLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Buscar
                  </button>
                </div>

                {tmdbResults.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {tmdbResults.map(item => {
                      const alreadyImported = importedIds.has(item.id);
                      return (
                        <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden group">
                          <div className="relative aspect-[2/3]">
                            {item.poster_path ? (
                              <img
                                src={`${TMDB_IMG_BASE}/w300${item.poster_path}`}
                                alt={item.title || item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-secondary flex items-center justify-center">
                                <Film className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.media_type === "movie" ? "bg-primary" : "bg-accent"} text-primary-foreground`}>
                                {item.media_type === "movie" ? "PELI" : "SERIE"}
                              </span>
                            </div>
                            {alreadyImported && (
                              <div className="absolute inset-0 bg-primary/60 flex items-center justify-center">
                                <span className="text-primary-foreground text-xs font-bold bg-primary px-2 py-1 rounded">✓ Importado</span>
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{item.title || item.name}</p>
                            <p className="text-xs text-muted-foreground">{(item.release_date || item.first_air_date || "").split("-")[0]}</p>
                            <div className="mt-2">
                              {alreadyImported ? (
                                <button
                                  onClick={() => {
                                    const existing = contentList.find(c => c.id === item.id);
                                    if (existing) handleDeleteContent(existing.docId!);
                                  }}
                                  className="w-full py-1 text-xs bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors"
                                >
                                  Eliminar
                                </button>
                              ) : (
                                <button
                                  onClick={() => setImportingItem(item)}
                                  className="w-full py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> Importar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {tmdbResults.length === 0 && tmdbQuery && !tmdbLoading && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No se encontraron resultados para "{tmdbQuery}"</p>
                  </div>
                )}

                {tmdbResults.length === 0 && !tmdbQuery && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Download className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">Importar desde TMDB</p>
                    <p className="text-sm">Busca películas y series para importarlas a tu catálogo</p>
                  </div>
                )}
              </div>
            )}

            {/* ══ CONTENT MANAGEMENT TAB ══════════════════════════════════════ */}
            {tab === "content" && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={contentSearch}
                      onChange={e => setContentSearch(e.target.value)}
                      placeholder="Buscar contenido..."
                      className={inputCls + " pl-9"}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{filteredContent.length} títulos</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredContent.map(c => (
                    <div key={c.docId} className="bg-card rounded-lg border border-border overflow-hidden flex flex-col group relative">
                      <div className="aspect-[2/3] relative overflow-hidden">
                        <img
                          src={c.poster_path ? `${TMDB_IMG_BASE}/w342${c.poster_path}` : "/placeholder.svg"}
                          alt={c.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <button
                            onClick={() => setEditingOptions(c)}
                            className="w-full py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => c.docId && handleDeleteContent(c.docId)}
                            className="w-full py-1.5 bg-destructive text-destructive-foreground rounded-md text-xs font-medium hover:bg-destructive/90 flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                          </button>
                        </div>
                        {c.media_type && (
                          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-[10px] font-bold px-1.5 py-0.5 rounded uppercase text-white">
                            {c.media_type === "movie" ? "PELI" : "SERIE"}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-sm line-clamp-1 mb-1">{c.title}</h4>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                          <span>{(c.release_date || "").split("-")[0]}</span>
                          <div className="flex gap-1">
                            {c.display_options?.home_sections?.includes("slider") && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            {c.display_options?.home_sections?.includes("estreno") && <Eye className="w-3 h-3 text-primary" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredContent.length === 0 && (
                    <div className="col-span-full text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                      <Film className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No hay contenido</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ USERS TAB ════════════════════════════════════════════════════ */}
            {tab === "users" && (
              <div>
                {/* Send message to all */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Send className="w-4 h-4" /> Enviar mensaje
                  </h3>
                  <div className="flex gap-2">
                    <input
                      value={adminMsg}
                      onChange={e => setAdminMsg(e.target.value)}
                      placeholder="Escribe el mensaje..."
                      className={inputCls}
                    />
                    <button
                      onClick={handleSendToAll}
                      disabled={!adminMsg.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                    >
                      A todos
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Buscar usuarios..."
                      className={inputCls + " pl-9"}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{filteredUsers.length} usuarios</span>
                </div>

                <div className="space-y-2">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{u.name || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">Conectado</span>
                            {u.registeredAt && (
                              <span className="text-xs text-muted-foreground">
                                Registro: {u.registeredAt?.toDate?.()?.toLocaleDateString("es") || "N/A"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setMsgToUser(msgToUser === u.id ? null : u.id)}
                            className="p-2 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
                            title="Enviar mensaje"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 hover:bg-destructive/20 rounded-md transition-colors text-destructive"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {msgToUser === u.id && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                          <input
                            value={adminMsg}
                            onChange={e => setAdminMsg(e.target.value)}
                            placeholder="Mensaje individual..."
                            className={inputCls + " flex-1"}
                          />
                          <button
                            onClick={() => handleSendMsgToUser(u.id)}
                            disabled={!adminMsg.trim()}
                            className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No hay usuarios registrados</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ MESSAGES TAB ═════════════════════════════════════════════════ */}
            {tab === "messages" && (
              <div className="space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className="bg-card rounded-lg p-4 border border-border">
                    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                      <div>
                        <span className="text-xs text-muted-foreground">De: <span className="text-foreground">{msg.from}</span></span>
                        <span className="text-xs text-muted-foreground ml-3">A: <span className="text-foreground">{msg.to}</span></span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${msg.read ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>
                          {msg.read ? "Leído" : "No leído"}
                        </span>
                        {!msg.read && (
                          <button onClick={() => msg.id && markMessageRead(msg.id).then(() => loadTabData("messages"))} className="text-xs text-primary hover:underline">
                            Marcar leído
                          </button>
                        )}
                        <button onClick={() => msg.id && deleteMessage(msg.id).then(() => loadTabData("messages"))} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{msg.message}</p>
                    {msg.createdAt && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(msg.createdAt.seconds * 1000).toLocaleString("es")}
                      </p>
                    )}
                    <button onClick={() => setReplyTo(replyTo === msg.from ? null : msg.from)} className="text-xs text-primary hover:underline">
                      {replyTo === msg.from ? "Cancelar" : "Responder"}
                    </button>
                    {replyTo === msg.from && (
                      <div className="flex gap-2 mt-2">
                        <input value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Responder..." className={inputCls + " flex-1"} />
                        <button onClick={() => handleReply(msg.from)} className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No hay mensajes</p>
                  </div>
                )}
              </div>
            )}

            {/* ══ HOME SECTIONS TAB ════════════════════════════════════════════ */}
            {tab === "sections" && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">Secciones configuradas en Firestore (colección home_sections).</p>
                <div className="space-y-2">
                  {homeSections
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map(s => (
                      <div key={s.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{s.title}</p>
                          <p className="text-xs text-muted-foreground">Tipo: {s.type} · Orden: {s.order ?? "—"}</p>
                        </div>
                      </div>
                    ))}
                  {homeSections.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      <Home className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No hay secciones configuradas</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ ANALYTICS TAB ════════════════════════════════════════════════ */}
            {tab === "analytics" && (
              <div>
                <h2 className="text-lg font-bold mb-4">Top Contenido por Clicks</h2>
                <div className="space-y-2">
                  {clicks.map((c: any, i) => (
                    <div key={c.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-4">
                      <span className="text-2xl font-black text-primary/40 w-8 text-center">{i + 1}</span>
                      {c.posterPath && (
                        <img src={`${TMDB_IMG_BASE}/w92${c.posterPath}`} alt={c.title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.title || c.id}</p>
                        <p className="text-xs text-muted-foreground">{c.mediaType === "movie" ? "Película" : "Serie"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{c.clicks || c.clickCount || 0}</p>
                        <p className="text-xs text-muted-foreground">clicks</p>
                      </div>
                    </div>
                  ))}
                  {clicks.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Sin datos de clicks aún</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ SETTINGS TAB ═════════════════════════════════════════════════ */}
            {tab === "settings" && (
              <div className="space-y-6">
                {/* Web Config */}
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5" /> Configuración Web</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Nombre del sitio</label>
                      <input value={config.site_name || ""} onChange={e => setConfig({ ...config, site_name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Idioma de importación</label>
                      <select value={config.importLanguage || "es-MX"} onChange={e => setConfig({ ...config, importLanguage: e.target.value })} className={inputCls}>
                        <option value="es-MX">Español (MX)</option>
                        <option value="es-ES">Español (ES)</option>
                        <option value="en-US">English (US)</option>
                        <option value="pt-BR">Português (BR)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Posters en slider hero</label>
                      <input type="number" value={config.heroSlider?.posters || 8} onChange={e => setConfig({ ...config, heroSlider: { ...(config.heroSlider || {}), posters: Number(e.target.value) } })} className={inputCls} min={1} max={20} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Posters aleatorios en hero</label>
                      <input type="number" value={config.heroSlider?.random || 4} onChange={e => setConfig({ ...config, heroSlider: { ...(config.heroSlider || {}), random: Number(e.target.value) } })} className={inputCls} min={0} max={10} />
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="mt-6 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Image className="w-4 h-4" /> Logo del Sitio</h3>
                    <div>
                      <label className="text-xs text-muted-foreground">URL de la imagen del logo (dejar vacío para mostrar texto)</label>
                      <input value={config.logoUrl || ""} onChange={e => setConfig({ ...config, logoUrl: e.target.value })} className={inputCls} placeholder="https://..." />
                    </div>
                    {config.logoUrl && (
                      <img src={config.logoUrl} alt="Logo preview" className="mt-2 h-10 object-contain rounded border border-border bg-background p-1" onError={e => (e.currentTarget.style.display = "none")} />
                    )}
                  </div>

                  {/* Platform Images */}
                  <div className="mt-6 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Image className="w-4 h-4" /> Imágenes de Plataformas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PLATFORMS.map(p => (
                        <div key={p.id}>
                          <label className="text-xs text-muted-foreground">{p.label} — URL de imagen</label>
                          <input
                            value={config.platformImages?.[p.id] || ""}
                            onChange={e => setConfig({
                              ...config,
                              platformImages: { ...(config.platformImages || {}), [p.id]: e.target.value }
                            })}
                            className={inputCls}
                            placeholder="https://..."
                          />
                          {config.platformImages?.[p.id] && (
                            <img src={config.platformImages[p.id]} alt={p.label} className="mt-1 h-8 object-contain rounded" onError={e => (e.currentTarget.style.display = "none")} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleSaveConfig} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 flex items-center gap-2">
                    <Save className="w-4 h-4" /> Guardar Configuración
                  </button>
                </div>

                {/* Splash Screen */}
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Image className="w-5 h-5" /> Splash Screen</h2>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <span className="text-sm font-medium">Activar Splash Screen</span>
                      <div
                        onClick={() => setSplashConfig({ ...splashConfig, enabled: !splashConfig.enabled })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${splashConfig.enabled ? "bg-primary" : "bg-secondary"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${splashConfig.enabled ? "translate-x-7" : "translate-x-1"}`} />
                      </div>
                    </label>
                    <div>
                      <label className="text-xs text-muted-foreground">URL de la Imagen</label>
                      <input value={splashConfig.imageUrl || ""} onChange={e => setSplashConfig({ ...splashConfig, imageUrl: e.target.value })} className={inputCls} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Duración (segundos)</label>
                      <input type="number" value={splashConfig.duration || 5} onChange={e => setSplashConfig({ ...splashConfig, duration: Number(e.target.value) })} className={inputCls} min={1} max={30} />
                    </div>
                    {splashConfig.imageUrl && (
                      <img src={splashConfig.imageUrl} alt="Preview" className="w-48 h-auto rounded-lg border border-border" onError={e => (e.currentTarget.style.display = "none")} />
                    )}
                    <button onClick={handleSaveSplash} className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 flex items-center gap-2">
                      <Save className="w-4 h-4" /> Guardar Splash
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
