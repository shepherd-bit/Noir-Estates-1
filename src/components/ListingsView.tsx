import { motion } from "framer-motion";
import { formatPrice, type Property } from "../data/properties";
import FiltersSidebar, { type FilterState } from "./FiltersSidebar";
import { fadeUp, staggerParent } from "../lib/anim";

export type SortKey = "featured" | "price-low" | "price-high" | "newest" | "sqft";
export type Layout = "grid" | "list";

interface Props {
  results: Property[];
  layout: Layout;
  setLayout: (v: Layout) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  filters: FilterState;
  setLocations: (v: string[]) => void;
  setPrice: (v: [number, number]) => void;
  setTypes: (updater: (prev: string[]) => string[]) => void;
  setBeds: (v: number) => void;
  setBaths: (v: number) => void;
  setSqft: (v: [number, number]) => void;
  setAmenities: (updater: (prev: string[]) => string[]) => void;
  setYears: (v: [number, number]) => void;
  onClear: () => void;
  onBack: () => void;
  onOpen: (id: number) => void;
  saved: Set<number>;
  onToggleSave: (id: number, e?: React.MouseEvent) => void;
}

export default function ListingsView({
  results,
  layout,
  setLayout,
  sort,
  setSort,
  filters,
  setLocations,
  setPrice,
  setTypes,
  setBeds,
  setBaths,
  setSqft,
  setAmenities,
  setYears,
  onClear,
  onBack,
  onOpen,
  saved,
  onToggleSave,
}: Props) {
  return (
    <motion.main
      initial="hidden"
      animate="show"
      variants={staggerParent}
      className="mx-auto max-w-[90rem] px-6 md:px-10 py-8 lg:h-[calc(100vh-4.5rem)] lg:py-6 lg:flex lg:flex-col lg:overflow-hidden"
    >
      <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-4 mb-8 lg:mb-5 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="tap w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center hover:bg-black transition"
          >
            ←
          </button>
          <div>
            <div className="text-[1.375rem] font-[700] tracking-[-0.03em] leading-none">{results.length} Properties</div>
            <div className="text-[0.6875rem] tracking-[0.1em] opacity-50 mt-1">
              {filters.types.join(", ") || "ALL TYPES"} • {filters.locations.join(", ") || "ALL LOCATIONS"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-[2.5rem] rounded-full bg-white border border-[#0A0A0A]/10 px-4 text-[0.75rem] font-[600] outline-none"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price Low → High</option>
            <option value="price-high">Price High → Low</option>
            <option value="newest">Newest Built</option>
            <option value="sqft">Largest</option>
          </select>
          <div className="flex p-1 rounded-full bg-[#E8E2DB]">
            <button
              onClick={() => setLayout("grid")}
              className={`tap w-8 h-8 rounded-full flex items-center justify-center transition ${
                layout === "grid" ? "bg-[#0A0A0A] text-white" : "opacity-60"
              }`}
            >
              ⊞
            </button>
            <button
              onClick={() => setLayout("list")}
              className={`tap w-8 h-8 rounded-full flex items-center justify-center transition ${
                layout === "list" ? "bg-[#0A0A0A] text-white" : "opacity-60"
              }`}
            >
              ☰
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[20rem_1fr] gap-8 items-start lg:items-stretch lg:gap-6 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <div className="lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:pb-2">
          <FiltersSidebar
            filters={filters}
            setLocations={setLocations}
            setPrice={setPrice}
            setTypes={setTypes}
            setBeds={setBeds}
            setBaths={setBaths}
            setSqft={setSqft}
            setAmenities={setAmenities}
            setYears={setYears}
            onClear={onClear}
          />
        </div>

        <div className="lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:pb-6">
          {results.length === 0 ? (
            <div className="rounded-[2rem] bg-white border border-dashed border-[#0A0A0A]/15 p-16 text-center">
              <div className="text-[1.125rem] font-[600]">No matches — loosen filters</div>
              <div className="text-[0.8125rem] opacity-60 mt-2 max-w-[32ch] mx-auto">
                Try clearing amenities or expanding price range. Noir keeps it tight.
              </div>
              <button
                onClick={onClear}
                className="tap mt-6 h-10 px-5 rounded-full bg-[#0A0A0A] text-white text-[0.75rem] font-[700]"
              >
                CLEAR ALL FILTERS
              </button>
            </div>
          ) : (
            <motion.div
              variants={staggerParent}
              className={layout === "grid" ? "grid md:grid-cols-2 gap-6" : "grid grid-cols-1 gap-4"}
            >
              {results.map((c, i) => (
                <motion.button
                  key={c.id}
                  variants={fadeUp}
                  custom={i}
                  layout
                  onClick={() => onOpen(c.id)}
                  className={`group text-left rounded-[1.75rem] overflow-hidden bg-white border border-[#0A0A0A]/[0.06] shadow-[0_0.625rem_1.875rem_-1.125rem_rgba(0,0,0,0.2)] hover:shadow-[0_1.875rem_3.75rem_-1.5rem_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-500 ${
                    layout === "list" ? "flex h-[9.375rem] sm:h-[12.5rem]" : ""
                  } `}
                >
                  <div
                    className={`relative bg-[#E8E2DB] overflow-hidden ${
                      layout === "list" ? "w-[42%] sm:w-[20rem] shrink-0" : "aspect-[1.35/1]"
                    }`}
                  >
                    <img
                      src={c.images[0]}
                      alt={c.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[1.2s]"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-white text-[0.6875rem] font-[800]">
                        {formatPrice(c.price)}
                      </span>
                      {c.featured && (
                        <span className="px-3 py-1 rounded-full bg-[#C96A4A] text-white text-[0.625rem] font-[700] tracking-[0.06em]">
                          FEATURED
                        </span>
                      )}
                    </div>
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full backdrop-blur flex items-center justify-center transition opacity-100">
                      <span
                        onClick={(e) => onToggleSave(c.id, e)}
                        className={`tap w-8 h-8 rounded-full flex items-center justify-center ${
                          saved.has(c.id) ? "bg-[#0A0A0A] text-white" : "bg-white/90"
                        }`}
                      >
                        {saved.has(c.id) ? "♥" : "♡"}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[1.125rem] font-[700] tracking-[-0.02em] leading-[1.1]">{c.title}</h3>
                        <div className="mt-1 text-[0.6875rem] tracking-[0.06em] opacity-50 uppercase">
                          {c.location} • {c.type}
                        </div>
                      </div>
                      <div className="text-[0.6875rem] font-[600] opacity-40">{c.yearBuilt}</div>
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-[0.6875rem] font-[500]">
                      <span className="px-2.5 py-1 rounded-full bg-[#F7F5F2]">
                        {c.beds === 0 ? "Land" : `${c.beds} bd`} • {c.baths === 0 ? "—" : `${c.baths} ba`}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#F7F5F2]">
                        {c.sqft.toLocaleString()} ft²
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.main>
  );
}
