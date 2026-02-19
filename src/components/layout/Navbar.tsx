
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background/95 to-transparent backdrop-blur-sm">
      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center bg-background/98 backdrop-blur-md px-4 md:px-12"
            style={{ height: "64px" }}
          >
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3 h-full">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar películas, series… (español o inglés)"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-4 md:px-12 py-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 md:h-9 object-contain" />
            ) : (
              <span className="text-2xl font-extrabold tracking-tight text-primary">StreamFusion</span>
            )}
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-secondary-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
            <Link to="/movies" className="hover:text-foreground transition-colors">Películas</Link>
            <Link to="/series" className="hover:text-foreground transition-colors">Series</Link>
            <Link to="/animes" className="hover:text-foreground transition-colors">Animes</Link>
            <Link to="/doramas" className="hover:text-foreground transition-colors">Doramas</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search button — always visible */}
          <button
            onClick={openSearch}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            title="Buscar"
          >
            <Search className="w-5 h-5" />
          </button>

          {user ? (
            <>
              {isAdmin && (
                <button onClick={() => navigate("/admin")} className="p-2 rounded-md hover:bg-accent transition-colors" title="Admin">
                  <Shield className="w-5 h-5 text-primary" />
                </button>
              )}
              <button onClick={() => navigate("/profile")} className="p-2 rounded-md hover:bg-accent transition-colors" title="Perfil">
                <User className="w-5 h-5" />
              </button>
              <button onClick={logout} className="p-2 rounded-md hover:bg-accent transition-colors" title="Salir">
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors">
              Iniciar sesión
            </button>
          )}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-md px-4 pb-4"
          >
            <Link to="/" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>Inicio</Link>
            <Link to="/movies" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>Películas</Link>
            <Link to="/series" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>Series</Link>
            <Link to="/animes" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>Animes</Link>
            <Link to="/doramas" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>Doramas</Link>
            <button
              onClick={() => { setMobileOpen(false); openSearch(); }}
              className="block py-2 text-sm w-full text-left"
            >
              Buscar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
