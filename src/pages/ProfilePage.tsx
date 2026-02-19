import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { fetchUserProfile, fetchMyList, fetchMessages, fetchSentMessages, sendMessage, deleteMessage, fetchWebConfig, updateWebConfig, fetchAllContent } from "@/lib/firestore";
import { getImageUrl } from "@/lib/image";
import { contentUrl } from "@/lib/slug";
import { useNavigate } from "react-router-dom";
import { User, List, MessageSquare, Settings, Send, Trash2, CheckCheck } from "lucide-react";
import type { Message } from "@/types/content";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { getGenreName } from "@/lib/genres";

type Tab = "info" | "list" | "messages" | "settings";

const ProfilePage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [profile, setProfile] = useState<any>(null);
  const [myList, setMyList] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [webConfig, setWebConfig] = useState<any>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [allContent, setAllContent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load profile and list independently from messages
    fetchUserProfile(user.uid).then((prof) => setProfile(prof)).catch(console.error);
    fetchMyList(user.uid).then((list) => setMyList(list)).catch(console.error);

    // Messages may fail due to missing Firestore composite index
    fetchMessages(user.uid).then((received) => setMessages(received)).catch((err) => {
      console.warn("Error fetching messages (index may be needed):", err);
    });
    fetchSentMessages(user.uid).then((sentMsgs) => setSent(sentMsgs)).catch((err) => {
      console.warn("Error fetching sent messages (index may be needed):", err);
    });

    if (isAdmin) {
      fetchWebConfig().then((config) => {
        setWebConfig(config || {
          visibleCategories: [],
          visiblePlatforms: [],
          homepageSections: { enEstreno: 20, recienAgregado: 20, peliculasPopulares: 20, seriesPopulares: 20 },
        });
      }).catch(console.error);
      fetchAllContent().then((c) => setAllContent(c)).catch(console.error);
    }
  }, [user, isAdmin]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Inicia sesión para ver tu perfil</p>
            <button onClick={() => navigate("/login")} className="px-6 py-2 bg-primary text-primary-foreground rounded-md">
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Información", icon: <User className="w-4 h-4" /> },
    { id: "list", label: "Mi Lista", icon: <List className="w-4 h-4" /> },
    { id: "messages", label: "Mensajes", icon: <MessageSquare className="w-4 h-4" /> },
    ...(isAdmin ? [{ id: "settings" as Tab, label: "Configuración", icon: <Settings className="w-4 h-4" /> }] : []),
  ];

  const allMessages = [...messages, ...sent].sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return aTime - bTime;
  });

  const handleSend = async () => {
    if (!newMsg.trim() || !user) return;
    setSendingMsg(true);
    await sendMessage(user.uid, "admin", newMsg.trim());
    setNewMsg("");
    const [received, sentMsgs] = await Promise.all([
      fetchMessages(user.uid),
      fetchSentMessages(user.uid),
    ]);
    setMessages(received);
    setSent(sentMsgs);
    setSendingMsg(false);
  };

  const handleDeleteMsg = async (msgId: string) => {
    await deleteMessage(msgId);
    const [received, sentMsgs] = await Promise.all([
      fetchMessages(user.uid),
      fetchSentMessages(user.uid),
    ]);
    setMessages(received);
    setSent(sentMsgs);
  };

  const handleSaveConfig = async () => {
    if (!webConfig) return;
    setSavingConfig(true);
    try {
      await updateWebConfig(webConfig);
      toast({ title: "Configuración guardada correctamente" });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
    setSavingConfig(false);
  };

  const registeredDate = profile?.registeredAt?.toDate
    ? profile.registeredAt.toDate().toLocaleDateString("es")
    : profile?.registeredAt
    ? new Date(profile.registeredAt).toLocaleDateString("es")
    : "No disponible";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 md:px-12 max-w-4xl mx-auto pb-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.name || user.email}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Info Tab */}
        {activeTab === "info" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-4">Detalles de Usuario</h2>
            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground text-sm">Nombre</span>
                <span className="font-medium">{profile?.name || "No disponible"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground text-sm">Correo</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground text-sm">Fecha de registro</span>
                <span className="font-medium">{registeredDate}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* My List Tab */}
        {activeTab === "list" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {myList.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center">
                <List className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Tu lista está vacía</h3>
                <p className="text-muted-foreground text-sm">Añade películas y series para verlas aquí.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {myList.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(contentUrl({ ...item, docId: String(item.id) }))}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                      <img
                        src={getImageUrl(item.poster_path)}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-xs font-medium mt-1 line-clamp-2">{item.title}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-4 min-h-[400px] flex flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto mb-4 max-h-[500px]">
              {allMessages.length === 0 && (
                <p className="text-muted-foreground text-center py-8 text-sm">No hay mensajes aún</p>
              )}
              {allMessages.map((msg) => {
                const isMine = msg.from === user.uid;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${isMine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                      <p>{msg.message}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-60 text-xs">
                        {msg.createdAt && new Date(msg.createdAt.seconds * 1000).toLocaleString("es")}
                        {isMine && msg.read && <CheckCheck className="w-3 h-3" />}
                        {isMine && msg.id && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteMsg(msg.id!); }} className="ml-2 hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Escribe un mensaje al admin..."
                className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={sendingMsg || !newMsg.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Settings Tab (Admin only) */}
        {activeTab === "settings" && isAdmin && webConfig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-semibold">Configuración</h2>

            {/* Category Visibility */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase">Secciones Fijas</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: "Películas Populares", key: "peliculas" },
                  { label: "Series Populares", key: "series" },
                  { label: "En Estreno/Emisión", key: "enEstreno" },
                  { label: "Recién Agregado", key: "recienAgregado" },
                ].map(({ label, key }) => {
                  const visible = (webConfig.visibleCategories || []).includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        const cats = webConfig.visibleCategories || [];
                        setWebConfig({
                          ...webConfig,
                          visibleCategories: visible ? cats.filter((c: string) => c !== key) : [...cats, key],
                        });
                      }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        visible ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase">Géneros</h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const genreSet = new Set<string>();
                  allContent.forEach((c: any) => {
                    c.genres?.forEach((g: string) => genreSet.add(getGenreName(g)));
                  });
                  return Array.from(genreSet).sort();
                })().map((genre) => {
                  const key = genre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const visible = (webConfig.visibleCategories || []).includes(key);
                  return (
                    <button
                      key={genre}
                      onClick={() => {
                        const cats = webConfig.visibleCategories || [];
                        setWebConfig({
                          ...webConfig,
                          visibleCategories: visible ? cats.filter((c: string) => c !== key) : [...cats, key],
                        });
                      }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        visible ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform Visibility */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase">Visibilidad de Plataformas</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Netflix", key: "netflix" },
                  { label: "Disney+", key: "disney" },
                  { label: "Max", key: "hbo" },
                  { label: "Prime Video", key: "prime" },
                  { label: "Paramount+", key: "paramount" },
                ].map(({ label: plat, key }) => {
                  const visible = (webConfig.visiblePlatforms || []).includes(key);
                  return (
                    <button
                      key={plat}
                      onClick={() => {
                        const plats = webConfig.visiblePlatforms || [];
                        setWebConfig({
                          ...webConfig,
                          visiblePlatforms: visible ? plats.filter((p: string) => p !== key) : [...plats, key],
                        });
                      }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        visible ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {plat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Homepage Poster Counts */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">Cantidad de Posters en Secciones de Inicio</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "enEstreno", label: "En Estreno/Emisión" },
                  { key: "recienAgregado", label: "Recién Agregado" },
                  { key: "peliculasPopulares", label: "Películas Populares" },
                  { key: "seriesPopulares", label: "Series Populares" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={webConfig.homepageSections?.[key] || 20}
                      onChange={(e) =>
                        setWebConfig({
                          ...webConfig,
                          homepageSections: {
                            ...webConfig.homepageSections,
                            [key]: parseInt(e.target.value) || 20,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-secondary text-foreground rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {savingConfig ? "Guardando..." : "Guardar Configuración"}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
