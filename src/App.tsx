import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import Hero from "./components/Hero";
import CuratedSection from "./components/CuratedSection";
import ListingsView, { type Layout, type SortKey } from "./components/ListingsView";
import PropertyDetail, { type DetailTab } from "./components/PropertyDetail";
import Footer from "./components/Footer";
import { pageVariants } from "./lib/anim";
import {
  PRICE_MAX,
  PRICE_MIN,
  PROPERTIES,
  SQFT_MAX,
  SQFT_MIN,
  YEAR_MAX,
  YEAR_MIN,
} from "./data/properties";

export type View = "landing" | "listings" | "detail";

function pathFor(view: View, id: number): string {
  if (view === "listings") return "/listings";
  if (view === "detail") return `/property/${id}`;
  return "/";
}

function scrollKeyFor(view: View, id: number): string {
  if (view === "detail") return `/property/${id}`;
  if (view === "listings") return "/listings";
  return "/";
}

function routeFromLocation(): { view: View; id: number } {
  try {
    const path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    const params = new URLSearchParams(window.location.search || "");
    const propertyMatch = path.match(/^\/property\/(\d+)$/);
    if (propertyMatch) {
      const id = parseInt(propertyMatch[1], 10);
      if (PROPERTIES.some((p) => p.id === id)) return { view: "detail", id };
      return { view: "listings", id: 1 };
    }
    if (path === "/listings" || path === "/detail") {
      const qid = parseInt(params.get("id") || "", 10);
      if (path === "/detail" && PROPERTIES.some((p) => p.id === qid))
        return { view: "detail", id: qid };
      return { view: "listings", id: 1 };
    }
    // Query-param fallback (works on file:// and hosts without SPA rewrites)
    const qview = params.get("view");
    const qid = parseInt(params.get("id") || "", 10);
    if (qview === "listings") return { view: "listings", id: 1 };
    if (qview === "detail" && PROPERTIES.some((p) => p.id === qid))
      return { view: "detail", id: qid };
    // Session fallback: last visited route before refresh/close
    const stored = sessionStorage.getItem("noir-route");
    if (!params.get("view") && (path === "/" || path === "") && stored) {
      try {
        const parsed = JSON.parse(stored) as { view: View; id: number };
        if (parsed.view === "detail" && PROPERTIES.some((p) => p.id === parsed.id))
          return parsed;
        if (parsed.view === "listings" || parsed.view === "landing") return { view: parsed.view, id: 1 };
      } catch {
        /* ignore corrupt storage */
      }
    }
  } catch {
    /* SSR / non-browser safety: fall through to landing */
  }
  return { view: "landing", id: 1 };
}

export default function App() {
  const initialRoute = useMemo(routeFromLocation, []);
  const [view, setView] = useState<View>(initialRoute.view);
  const [selectedId, setSelectedId] = useState(initialRoute.id);
  const routeRef = useRef({ view: initialRoute.view, id: initialRoute.id });
  routeRef.current = { view, id: selectedId };
  const [layout, setLayout] = useState<Layout>("grid");
  const [sort, setSort] = useState<SortKey>("featured");
  const [tab, setTab] = useState<DetailTab>("neighborhood");
  const [imageIndex, setImageIndex] = useState(0);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleSave = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    showToast(saved.has(id) ? "Removed from moodboard" : "Saved to moodboard — 1 added");
  };

  const [locations, setLocations] = useState<string[]>([]);
  const [price, setPrice] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [types, setTypes] = useState<string[]>([]);
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);
  const [sqft, setSqft] = useState<[number, number]>([SQFT_MIN, SQFT_MAX]);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [years, setYears] = useState<[number, number]>([YEAR_MIN, YEAR_MAX]);

  const [searchLocation, setSearchLocation] = useState("");
  const [searchType, setSearchType] = useState("");
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");

  const selected = useMemo(
    () => PROPERTIES.find((c) => c.id === selectedId) || PROPERTIES[0],
    [selectedId],
  );

  const filtered = useMemo(() => {
    let c = [...PROPERTIES];
    if (locations.length > 0)
      c = c.filter((V) =>
        locations.some((W) => {
          const vn = W.toLowerCase();
          return (
            (V.location + " " + V.city).toLowerCase().includes(vn.split(" ")[0]) ||
            W.toLowerCase().includes(V.location.toLowerCase())
          );
        }),
      );
    c = c.filter((V) => V.price >= price[0] && V.price <= price[1]);
    if (types.length > 0) c = c.filter((V) => types.includes(V.type));
    if (beds > 0) c = c.filter((V) => V.beds >= beds);
    if (baths > 0) c = c.filter((V) => V.baths >= baths);
    c = c.filter((V) => V.sqft >= sqft[0] && V.sqft <= sqft[1]);
    if (amenityFilters.length > 0)
      c = c.filter((V) => amenityFilters.every((W) => V.amenities.includes(W)));
    c = c.filter((V) => V.yearBuilt >= years[0] && V.yearBuilt <= years[1]);
    switch (sort) {
      case "price-low":
        c.sort((V, W) => V.price - W.price);
        break;
      case "price-high":
        c.sort((V, W) => W.price - V.price);
        break;
      case "newest":
        c.sort((V, W) => W.yearBuilt - V.yearBuilt);
        break;
      case "sqft":
        c.sort((V, W) => W.sqft - V.sqft);
        break;
      default:
        c.sort((V, W) => (W.featured ? 1 : 0) - (V.featured ? 1 : 0));
    }
    return c;
  }, [locations, price, types, beds, baths, sqft, amenityFilters, years, sort]);

  const curated = useMemo(() => {
    return PROPERTIES.filter((V) => V.featured).slice(0, 4);
  }, []);

  const handleSearch = () => {
    const c: string[] = [];
    if (searchLocation) c.push(searchLocation);
    setLocations(c);
    if (searchType) setTypes([searchType]);
    const V = minInput ? parseInt(minInput.replace(/[^0-9]/g, "")) : PRICE_MIN;
    const W = maxInput ? parseInt(maxInput.replace(/[^0-9]/g, "")) : PRICE_MAX;
    if (!isNaN(V) || !isNaN(W))
      setPrice([isNaN(V) ? PRICE_MIN : V, isNaN(W) ? PRICE_MAX : W]);
    navigate("listings");
    window.scrollTo(0, 0);
  };

  const clearAll = () => {
    setLocations([]);
    setPrice([PRICE_MIN, PRICE_MAX]);
    setTypes([]);
    setBeds(0);
    setBaths(0);
    setSqft([SQFT_MIN, SQFT_MAX]);
    setAmenityFilters([]);
    setYears([YEAR_MIN, YEAR_MAX]);
  };

  const persistRoute = (v: View, id: number) => {
    try {
      sessionStorage.setItem("noir-route", JSON.stringify({ view: v, id }));
    } catch {
      /* storage unavailable (private mode) — URL still carries the route */
    }
  };

  const pushUrl = (v: View, id: number, replace = false) => {
    const path = pathFor(v, id);
    persistRoute(v, id);
    try {
      if (window.location.pathname !== path) {
        if (replace) window.history.replaceState({ view: v, id }, "", path);
        else window.history.pushState({ view: v, id }, "", path);
      }
    } catch {
      /* file:// or restricted context — sessionStorage fallback covers refresh */
    }
  };

  const saveScroll = (v: View, id: number) => {
    try {
      sessionStorage.setItem(`noir-scroll:${scrollKeyFor(v, id)}`, String(window.scrollY));
    } catch {
      /* ignore */
    }
  };

  const navigate = (v: View, msg?: string) => {
    const cur = routeRef.current;
    if (cur.view !== v || (v === "detail" && cur.id !== selectedId)) saveScroll(cur.view, cur.id);
    setView(v);
    pushUrl(v, v === "detail" ? selectedId : cur.id);
    window.scrollTo(0, 0);
    if (msg) showToast(msg);
  };

  const openDetail = (id: number) => {
    const cur = routeRef.current;
    saveScroll(cur.view, cur.id);
    setSelectedId(id);
    setImageIndex(0);
    setView("detail");
    pushUrl("detail", id);
    window.scrollTo(0, 0);
  };

  // Normalize URL on first mount + restore exact scroll offset after refresh.
  useEffect(() => {
    const { view: v, id } = routeRef.current;
    pushUrl(v, id, true);
    try {
      if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    } catch {
      /* ignore */
    }
    const saved = sessionStorage.getItem(`noir-scroll:${scrollKeyFor(v, id)}`);
    if (saved) {
      const y = parseInt(saved, 10);
      if (!isNaN(y) && y > 0) {
        requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back/forward buttons + scroll persistence across refresh.
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const state = e.state as { view?: View; id?: number } | null;
      const route = state?.view ? { view: state.view, id: state.id ?? 1 } : routeFromLocation();
      if (route.view === "detail") {
        setSelectedId(route.id);
        setImageIndex(0);
      }
      setView(route.view);
      persistRoute(route.view, route.id);
      const saved = sessionStorage.getItem(`noir-scroll:${scrollKeyFor(route.view, route.id)}`);
      const y = saved ? parseInt(saved, 10) : 0;
      requestAnimationFrame(() => window.scrollTo(0, !isNaN(y) ? y : 0));
    };
    const onBeforeUnload = () => {
      const cur = routeRef.current;
      saveScroll(cur.view, cur.id);
      persistRoute(cur.view, cur.id);
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#0A0A0A] antialiased selection:bg-[#C96A4A] selection:text-white pt-[4.5rem]">
      <Toast message={toast} />
      <Navbar view={view} onNavigate={navigate} onResetFilters={clearAll} />

      <AnimatePresence mode="wait">
      {view === "landing" && (
        <motion.main
          key="landing"
          variants={pageVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="mx-auto max-w-[90rem] px-6 md:px-10 overflow-hidden"
        >
          <Hero hero={PROPERTIES[0]} isSaved={saved.has(1)} onToggleSave={toggleSave} />
          <CuratedSection
            items={curated}
            saved={saved}
            onToggleSave={toggleSave}
            onOpen={openDetail}
            onViewAll={() => navigate("listings")}
          />
          <Footer />
        </motion.main>
      )}

      {view === "listings" && (
        <motion.div key="listings" variants={pageVariants} initial="hidden" animate="show" exit="exit">
        <ListingsView
          results={filtered}
          layout={layout}
          setLayout={setLayout}
          sort={sort}
          setSort={setSort}
          filters={{
            locations,
            price,
            types,
            beds,
            baths,
            sqft,
            amenities: amenityFilters,
            years,
          }}
          setLocations={setLocations}
          setPrice={setPrice}
          setTypes={setTypes}
          setBeds={setBeds}
          setBaths={setBaths}
          setSqft={setSqft}
          setAmenities={setAmenityFilters}
          setYears={setYears}
          onClear={clearAll}
          onBack={() => navigate("landing")}
          onOpen={openDetail}
          saved={saved}
          onToggleSave={toggleSave}
        />
        </motion.div>
      )}

      {view === "detail" && (
        <motion.div key={`detail-${selectedId}`} variants={pageVariants} initial="hidden" animate="show" exit="exit">
        <PropertyDetail
          property={selected}
          imageIndex={imageIndex}
          setImageIndex={setImageIndex}
          tab={tab}
          setTab={setTab}
          onBackToListings={() => navigate("listings")}
          onBackToLanding={() => navigate("landing")}
          onOpen={openDetail}
        />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
