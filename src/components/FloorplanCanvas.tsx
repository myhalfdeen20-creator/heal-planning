import React, { useState } from 'react';
import {
  FileText,
  Grid,
  Lock,
  Plus,
  Search,
  Trash2,
  Unlock,
  UserCheck,
  Users,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { FloorplanTable, GuestItem } from '../types/planner';
import { calculateFloorplanStats } from '../utils/plannerLogic';

interface FloorplanCanvasProps {
  tables: FloorplanTable[];
  guests: GuestItem[];
  onAddTable: (seats: number, diameterFt: number, label: string) => void;
  onAssignGuestToTable: (guestId: string, tableId: string | null) => void;
  onResetFloorplan: () => void;
  onAutoLayoutGrid?: (rows: number, cols: number, seatsPerTable: number) => void;
  clientCanEdit?: boolean;
  onToggleClientCanEdit?: () => void;
}

export const FloorplanCanvas: React.FC<FloorplanCanvasProps> = ({
  tables,
  guests,
  onAddTable,
  onAssignGuestToTable,
  onResetFloorplan,
  onAutoLayoutGrid,
  clientCanEdit = true,
  onToggleClientCanEdit,
}) => {
  const [leftTab, setLeftTab] = useState<'library' | 'room'>('room');
  const [librarySearch, setLibrarySearch] = useState('');
  const [showClearAreas, setShowClearAreas] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showTableNumbers, setShowTableNumbers] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [useMetric, setUseMetric] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedTableId, setSelectedTableId] = useState<string | null>('tbl-1010');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showAutoGridModal, setShowAutoGridModal] = useState(false);
  const [gridRows, setGridRows] = useState(3);
  const [gridCols, setGridCols] = useState(5);
  const [gridSeats, setGridSeats] = useState(8);

  const stats = calculateFloorplanStats(tables, guests, useMetric);
  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  const seatedAtSelected = guests.filter(
    (g) => g.rsvpStatus === 'Attending' && g.tableId === selectedTable?.id
  );
  const unseatedAttending = guests.filter(
    (g) => g.rsvpStatus === 'Attending' && !g.tableId
  );

  const libraryTemplates = [
    { name: 'Meja Bundar 3ft', sub: '(3 kursi)', seats: 3, diameterFt: 3 },
    { name: 'Meja Bundar 4ft', sub: '(5 kursi)', seats: 5, diameterFt: 4 },
    { name: 'Meja Bundar 5ft', sub: '(8 kursi)', seats: 8, diameterFt: 5 },
    { name: 'Meja Bundar 6ft', sub: '(10 kursi)', seats: 10, diameterFt: 6 },
    { name: 'Meja Koktail 30in', sub: '(tinggi 42")', seats: 4, diameterFt: 2.5 },
    { name: 'Meja Koktail 36in', sub: '(tinggi 42")', seats: 4, diameterFt: 3 },
  ].filter((item) => item.name.toLowerCase().includes(librarySearch.toLowerCase()));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
      {/* Top Action Bar matching image_661568b8.png */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Templat Denah - Ballroom - Susunan Banquet - Meja Bundar
          </h2>
          <p className="text-xs text-slate-500">
            Tata Letak Ballroom Interaktif · Klik meja mana saja untuk menempatkan Tamu Hadir dari
            Daftar Tamu Terintegrasi (beserta pilihan menu BEO)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onAutoLayoutGrid && (
            <button
              type="button"
              onClick={() => setShowAutoGridModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Susun Otomatis Grid Meja</span>
            </button>
          )}
          {onToggleClientCanEdit && (
            <button
              type="button"
              onClick={onToggleClientCanEdit}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                clientCanEdit
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {clientCanEdit ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Portal Klien: Boleh Edit &amp; Atur Kursi</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Portal Klien: Hanya Lihat</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#48a5b3] hover:bg-[#3d919e] text-white text-xs font-medium cursor-pointer"
          >
            Edit Nama/Kanvas &amp; Tautan BEO
          </button>
          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#595959] hover:bg-[#454545] text-white text-xs font-medium cursor-pointer"
          >
            Instruksi Penataan
          </button>
          <button
            type="button"
            aria-label="Ekspor PDF Denah"
            onClick={() => setShowSetupModal(true)}
            className="w-8 h-8 rounded-full bg-[#595959] hover:bg-[#454545] text-white flex items-center justify-center cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Reset Denah Ballroom"
            onClick={onResetFloorplan}
            className="w-8 h-8 rounded-full bg-[#595959] hover:bg-[#454545] text-white flex items-center justify-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3-Column Floorplan Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Library / Room Palette */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="grid grid-cols-2 border-b border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLeftTab('library')}
              className={`py-2.5 text-center cursor-pointer ${
                leftTab === 'library'
                  ? 'text-[#2b90a0] border-b-2 border-[#2b90a0] bg-slate-50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Pustaka
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('room')}
              className={`py-2.5 text-center cursor-pointer ${
                leftTab === 'room'
                  ? 'text-[#2b90a0] border-b-2 border-[#2b90a0] bg-slate-50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Ruangan
            </button>
          </div>

          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <input
                type="text"
                aria-label="Cari Elemen Denah"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Cari meja..."
                className="w-full pl-2.5 pr-7 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#2b90a0]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2" />
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
            {libraryTemplates.map((item) => (
              <div
                key={item.name}
                className="p-3 flex flex-col items-center text-center hover:bg-slate-50 transition-colors"
              >
                <div className="text-[11px] font-medium text-slate-700">{item.name}</div>
                <div className="text-[10px] text-slate-400 mb-2">{item.sub}</div>
                {/* Mini SVG Table Icon */}
                <svg viewBox="0 0 60 60" className="w-12 h-12 mb-2">
                  <circle cx="30" cy="30" r="14" fill="#64748b" />
                  {Array.from({ length: item.seats }).map((_, idx) => {
                    const angle = (idx * 2 * Math.PI) / item.seats;
                    const cx = 30 + Math.cos(angle) * 21;
                    const cy = 30 + Math.sin(angle) * 21;
                    return <circle key={idx} cx={cx} cy={cy} r="3.2" fill="#334155" />;
                  })}
                </svg>
                <button
                  type="button"
                  onClick={() => onAddTable(item.seats, item.diameterFt, item.name)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#48a5b3] hover:text-white text-slate-700 text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah Meja</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Center Ballroom Architectural Canvas matching image_661568b8.png */}
        <div className="lg:col-span-8 border border-slate-200 rounded-xl bg-[#f8fafc] p-3 relative overflow-x-auto">
          <div
            className="relative mx-auto w-full min-w-[680px] aspect-[16/10] bg-white border border-slate-300 shadow-inner select-none overflow-hidden"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              backgroundImage: showGrid
                ? 'linear-gradient(to right, rgba(148, 163, 184, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.22) 1px, transparent 1px)'
                : 'none',
              backgroundSize: '18px 18px',
            }}
          >
            {/* Architectural Ballroom Walls SVG */}
            <svg viewBox="0 0 1000 620" className="w-full h-full">
              {/* Outer Ballroom Perimeter with Curved East Music Bay */}
              <path
                d="M 60 80 L 900 80 L 900 280 Q 985 375 900 470 L 900 560 L 650 560 M 595 560 L 60 560 L 60 390 M 60 325 L 60 80"
                fill="none"
                stroke="#64748b"
                strokeWidth="5"
              />

              {/* Dimension Callouts */}
              <text x="480" y="70" textAnchor="middle" className="text-[11px] fill-slate-700 font-bold">
                {stats.convertLength(85.8)}
              </text>
              <text x="38" y="210" textAnchor="middle" className="text-[11px] fill-slate-700 font-bold">
                {stats.convertLength(22.1)}
              </text>
              <text x="38" y="475" textAnchor="middle" className="text-[11px] fill-slate-700 font-bold">
                {stats.convertLength(22.1)}
              </text>
              <text x="340" y="552" textAnchor="middle" className="text-[11px] fill-slate-700 font-bold">
                {stats.convertLength(54.3)}
              </text>
              <text x="795" y="552" textAnchor="middle" className="text-[11px] fill-slate-700 font-bold">
                {stats.convertLength(24.11)}
              </text>
              <text x="920" y="215" textAnchor="middle" className="text-[11px] fill-slate-700 font-bold">
                {stats.convertLength(16.6)}
              </text>
              <text x="955" y="380" textAnchor="middle" className="text-[11px] fill-slate-700 font-bold">
                {stats.convertLength(22.11)}
              </text>

              {/* West Double Door Swing Arcs */}
              <path d="M 60 325 L 90 325 A 30 30 0 0 1 60 355" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M 60 390 L 90 390 A 30 30 0 0 0 60 360" fill="none" stroke="#94a3b8" strokeWidth="1.5" />

              {/* South Double Door Swing Arcs */}
              <path d="M 595 560 L 595 530 A 30 30 0 0 1 625 560" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M 650 560 L 650 530 A 30 30 0 0 0 625 560" fill="none" stroke="#94a3b8" strokeWidth="1.5" />

              {/* North Stage / Bar Table */}
              <rect x="430" y="96" width="140" height="36" fill="#0284c7" rx="2" />
              <circle cx="500" cy="114" r="6" fill="#ffffff" />

              {/* Left Circular Beverage / Bar Stations */}
              <g transform="translate(175, 195)">
                <circle cx="0" cy="0" r="40" fill="#0284c7" />
                <circle cx="0" cy="0" r="14" fill="#ffffff" />
                <text x="0" y="-52" textAnchor="middle" className="text-[10px] fill-slate-600 font-bold">
                  {stats.convertLength(6.6)}
                </text>
              </g>
              <g transform="translate(175, 455)">
                <circle cx="0" cy="0" r="40" fill="#0284c7" />
                <circle cx="0" cy="0" r="14" fill="#ffffff" />
                <text x="0" y="58" textAnchor="middle" className="text-[10px] fill-slate-600 font-bold">
                  {stats.convertLength(6.6)}
                </text>
              </g>

              {/* South Serpentine Buffet Table + Plants */}
              <path
                d="M 405 510 Q 430 490 455 510 T 505 510 T 555 510 T 605 510"
                fill="none"
                stroke="#0284c7"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <circle cx="390" cy="512" r="9" fill="#4ade80" />
              <circle cx="620" cy="512" r="9" fill="#4ade80" />

              {/* Northeast & Southeast Lounge Sofas */}
              <g transform="translate(815, 130) rotate(40)">
                <rect x="-35" y="-12" width="70" height="22" fill="#0284c7" rx="3" />
                <ellipse cx="0" cy="24" rx="18" ry="10" fill="#0284c7" />
              </g>
              <g transform="translate(815, 485) rotate(-40)">
                <rect x="-35" y="-12" width="70" height="22" fill="#0284c7" rx="3" />
                <ellipse cx="0" cy="-24" rx="18" ry="10" fill="#0284c7" />
              </g>

              {/* Grand Piano in Curved East Bay */}
              <g transform="translate(860, 365)">
                <path
                  d="M -22 -18 L 15 -18 Q 28 0 12 22 L -22 22 Z"
                  fill="#334155"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <rect x="-26" y="-14" width="5" height="32" fill="#f8fafc" />
                <circle cx="35" cy="-42" r="8" fill="#4ade80" />
                <circle cx="50" cy="-18" r="8" fill="#4ade80" />
                <circle cx="52" cy="14" r="8" fill="#4ade80" />
                <circle cx="36" cy="40" r="8" fill="#4ade80" />
              </g>

              {/* Interactive Round Banquet Tables */}
              {tables.map((tbl) => {
                const cx = tbl.x * 10;
                const cy = tbl.y * 6.2;
                const isSelected = tbl.id === selectedTable?.id;
                const occupied = stats.tableOccupancy[tbl.id] || 0;
                const radius = tbl.type === 'head-table' ? 18 : 24;

                return (
                  <g
                    key={tbl.id}
                    transform={`translate(${cx}, ${cy})`}
                    onClick={() => setSelectedTableId(tbl.id)}
                    className="cursor-pointer"
                  >
                    {/* Clear Area Ring */}
                    {showClearAreas && (
                      <circle
                        cx="0"
                        cy="0"
                        r={radius + 18}
                        fill="none"
                        stroke="#f43f5e"
                        strokeDasharray="4 3"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Radial Chairs */}
                    {Array.from({ length: tbl.seats }).map((_, idx) => {
                      const angle =
                        tbl.type === 'head-table'
                          ? -Math.PI / 3 + (idx * Math.PI) / 3
                          : (idx * 2 * Math.PI) / tbl.seats;
                      const chX = Math.cos(angle) * (radius + 8);
                      const chY = Math.sin(angle) * (radius + 8);
                      const chairOccupied = idx < occupied;
                      return (
                        <circle
                          key={idx}
                          cx={chX}
                          cy={chY}
                          r="4.8"
                          fill={chairOccupied ? '#0f766e' : '#334155'}
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Table Surface */}
                    <circle
                      cx="0"
                      cy="0"
                      r={radius}
                      fill={isSelected ? '#0369a1' : '#0284c7'}
                      stroke={isSelected ? '#facc15' : '#ffffff'}
                      strokeWidth={isSelected ? '3' : '1.5'}
                    />

                    {/* Table Number */}
                    {showTableNumbers && (
                      <text
                        x="0"
                        y={showLabels ? '-2' : '4'}
                        textAnchor="middle"
                        className="text-[10px] fill-white font-bold"
                      >
                        {tbl.number}
                      </text>
                    )}

                    {/* Seat Occupancy Label */}
                    {showLabels && (
                      <text
                        x="0"
                        y="9"
                        textAnchor="middle"
                        className="text-[8px] fill-sky-100 font-medium"
                      >
                        {occupied}/{tbl.seats}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Bottom-Left Canvas Dimensions & Bottom-Right Zoom Controls */}
            <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-500">
              KANVAS: 100&apos; 0&quot; x 62&apos; 0&quot; (30,5m x 18,9m)
            </div>

            <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-white/90 border border-slate-200 rounded-md p-1 shadow-2xs">
              <button
                type="button"
                aria-label="Perbesar Denah"
                onClick={() => setZoom((z) => Math.min(1.25, +(z + 0.1).toFixed(2)))}
                className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded cursor-pointer"
              >
                RESET
              </button>
              <button
                type="button"
                aria-label="Perkecil Denah"
                onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(2)))}
                className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Controls & Live Table Seating Assignment Panel matching image_661568b8.png */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Total Kursi</span>
              <span
                data-testid="floorplan-total-seats"
                className="px-2 py-0.5 rounded-full bg-[#595959] text-white text-xs font-bold tabular-nums"
              >
                {stats.totalSeats}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Terisi dari RSVP</span>
              <span className="font-bold text-[#2b90a0] tabular-nums">
                {stats.assignedSeats} / {stats.totalSeats}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClearAreas}
                  onChange={(e) => setShowClearAreas(e.target.checked)}
                  className="rounded border-slate-300 text-[#2b90a0]"
                />
                <span>Tampilkan Area Bebas Meja</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded border-slate-300 text-[#2b90a0]"
                />
                <span>Tampilkan Label</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTableNumbers}
                  onChange={(e) => setShowTableNumbers(e.target.checked)}
                  className="rounded border-slate-300 text-[#2b90a0]"
                />
                <span>Tampilkan Nomor Meja</span>
              </label>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="rounded border-slate-300 text-[#2b90a0]"
                  />
                  <span>Ratakan ke Grid</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded border-slate-300 text-[#2b90a0]"
                  />
                  <span>Tampilkan Grid</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useMetric}
                    onChange={(e) => setUseMetric(e.target.checked)}
                    className="rounded border-slate-300 text-[#2b90a0]"
                  />
                  <span>Gunakan Satuan Metrik (m)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Selected Table Guest Assignment Box */}
          {selectedTable && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Meja {selectedTable.number}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Kapasitas: {stats.tableOccupancy[selectedTable.id] || 0} / {selectedTable.seats}{' '}
                    kursi
                  </div>
                </div>
                <Users className="w-4 h-4 text-[#2b90a0]" />
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-600">
                  Tamu di Meja Ini (Nama &amp; Menu):
                </div>
                {seatedAtSelected.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    Belum ada tamu ditempatkan di meja ini.
                  </p>
                ) : (
                  seatedAtSelected.map((g) => (
                    <div
                      key={g.id}
                      className="text-[11px] bg-slate-50 p-2 rounded border border-slate-200 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate">
                          {g.firstName} {g.lastName} (+{g.plusOnes})
                        </span>
                        <button
                          type="button"
                          onClick={() => onAssignGuestToTable(g.id, null)}
                          className="text-red-600 hover:underline text-[10px] ml-1 shrink-0 cursor-pointer"
                        >
                          Lepas
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Menu: {g.mealChoice || 'Standar'}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {unseatedAttending.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-600">
                    Tempatkan Tamu Belum Duduk:
                  </div>
                  {unseatedAttending.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => onAssignGuestToTable(g.id, selectedTable.id)}
                      className="w-full flex items-center justify-between px-2 py-1 rounded bg-[#48a5b3]/10 hover:bg-[#48a5b3]/20 text-[#2b90a0] text-[11px] font-medium cursor-pointer"
                    >
                      <span className="truncate">
                        + {g.firstName} {g.lastName} ({1 + g.plusOnes} org)
                      </span>
                      <UserCheck className="w-3 h-3 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auto-Layout Grid Generator Modal */}
      {showAutoGridModal && onAutoLayoutGrid && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">
              Susun Otomatis Grid Meja &amp; Kursi (Auto-Layout)
            </h3>
            <p className="text-xs text-slate-500">
              Buat susunan grid meja bundar secara otomatis dan presisi di tengah Ballroom.
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Baris</label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={gridRows}
                  onChange={(e) => setGridRows(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Kolom</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={gridCols}
                  onChange={(e) => setGridCols(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kursi / Meja</label>
                <select
                  value={gridSeats}
                  onChange={(e) => setGridSeats(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value={8}>8 Kursi</option>
                  <option value={10}>10 Kursi</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAutoGridModal(false)}
                className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onAutoLayoutGrid(gridRows, gridCols, gridSeats);
                  setShowAutoGridModal(false);
                }}
                className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white text-xs font-medium cursor-pointer"
              >
                Terapkan Grid ({gridRows * gridCols} Meja)
              </button>
            </div>
          </div>
        </div>
      )}

      {showSetupModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-slate-800">
              Instruksi Penataan Denah Ballroom &amp; Tautan BEO
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Terhubung otomatis dengan <strong>BEO Paket Makan Malam Platinum</strong>. Seluruh
              meja bundar 60 inci dan Meja Pelaminan (1001) dikonfigurasi untuk{' '}
              <strong>{stats.totalSeats} total kursi</strong> dengan stasiun minuman berjarak aman
              6,6 kaki serta jalur pelayanan prasmanan.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-1.5 rounded-full bg-[#48a5b3] text-white text-xs font-medium cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
