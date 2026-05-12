import { useEffect, useMemo, useState } from "react";

const DIAS_SEMANA = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
const API_BASE = "https://registromono.monognomo.com/api.php";

const toDateOnly = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatMonthTitle = (date) =>
  date.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();

const formatDate = (value) => {
  const d = toDateOnly(value);
  if (!d) return "-";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateRange = (start, end) => {
  if (!start && !end) return "-";
  if (start && !end) return formatDate(start);
  if (!start && end) return formatDate(end);
  if (start === end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
};

const startOfMonthGrid = (date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  first.setDate(first.getDate() - mondayOffset);
  first.setHours(0, 0, 0, 0);
  return first;
};

const startOfWeekMonday = (date) => {
  const d = new Date(date);
  const mondayOffset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetweenInclusive = (start, end) => {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86400000) + 1;
};

const normalizeRange = (startRaw, endRaw, fallbackRaw = null) => {
  const start = toDateOnly(startRaw);
  const end = toDateOnly(endRaw);
  const fallback = toDateOnly(fallbackRaw);

  if (start && end) return start <= end ? { start, end } : { start: end, end: start };
  if (start) return { start, end: start };
  if (end) return { start: end, end };
  if (fallback) return { start: fallback, end: fallback };
  return null;
};

const compactText = (value, max = 72) => {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  if (raw.length <= max) return raw;
  return `${raw.slice(0, max - 1)}…`;
};

const buildSegmentInfo = (event, phase) => {
  const place = String(event?.place || "").trim();
  const van =
    phase === "montaje"
      ? String(event?.setup_vehicle || "").trim()
      : phase === "desmontaje"
        ? String(event?.dismantle_vehicle || "").trim()
        : phase === "taller"
          ? String(event?.workshop_vehicle || "").trim()
          : phase === "mantenimiento"
            ? String(event?.maintenance_vehicle || "").trim()
        : String(event?.setup_vehicle || event?.dismantle_vehicle || "").trim();

  const parts = [];
  if (place) parts.push(`📍 ${place}`);
  if (van) parts.push(`🚐 ${van}`);
  return compactText(parts.join(" · "), 90);
};

const buildCompactMeta = (staff, team, detail, coordinators = "", projectName = "") => {
  const staffPart = staff ? `👤 ${staff}` : "";
  const teamPart = team ? `👥 ${team}` : "";
  const projectPart = projectName ? `📁 ${projectName}` : "";
  const placeMatch = String(detail || "").match(/📍\s*([^·]+)/);
  const placePart = placeMatch ? `📍 ${placeMatch[1].trim()}` : "";
  const hasVan = String(detail || "").includes("🚐");
  const vanPart = hasVan ? "🚐" : "";
  const coordPart = coordinators ? `🎯 ${coordinators}` : "";
  const visibleParts = [projectPart, staffPart, teamPart, placePart, vanPart, coordPart].filter(Boolean);
  return compactText(visibleParts.join(" · "), 95);
};

const getTeamByPhase = (event, phase) => {
  if (phase === "montaje" || phase === "evento") return String(event?.team_setup || "").trim();
  if (phase === "desmontaje") return String(event?.team_dismantle || "").trim();
  if (phase === "taller") return String(event?.team_workshop || "").trim();
  if (phase === "mantenimiento") return String(event?.team_maintenance || "").trim();
  return "";
};

const buildCoordinatorMeta = (event, workerMap) => {
  const cp = workerMap.get(String(event?.coord_project_id || "")) || "";
  const cprod = workerMap.get(String(event?.coord_prod_id || "")) || "";
  const cdis = workerMap.get(String(event?.coord_disenio_id || "")) || "";
  const parts = [];
  if (cp) parts.push(`CP ${cp}`);
  if (cprod) parts.push(`CPr ${cprod}`);
  if (cdis) parts.push(`CD ${cdis}`);
  return compactText(parts.join(" · "), 95);
};

const buildTeamByPhaseMeta = (event, phase) => {
  const team = getTeamByPhase(event, phase);
  return team ? compactText(team, 95) : "";
};

const sanitizeTeamMembers = (raw, workers) => {
  const allowed = new Set((workers || []).map((w) => String(w.name || "").trim().toLowerCase()).filter(Boolean));
  return parseTeamMembers(raw).filter((name) => allowed.has(String(name || "").trim().toLowerCase()));
};

const getLegacyNoteFromTeam = (raw, workers) => {
  const clean = sanitizeTeamMembers(raw, workers);
  const original = String(raw || "").trim();
  if (!original) return "";
  if (clean.length) return "";
  return original;
};

const buildTeamDisplayFromEvent = (event, workers, workerMap) => {
  const teamRaw =
    String(
      event?.team_setup ||
      event?.team_dismantle ||
      event?.team_workshop ||
      event?.team_maintenance ||
      ""
    );
  const teamClean = sanitizeTeamMembers(teamRaw, workers);
  const fromStaff = Object.keys(event?.staff_detalle || {})
    .map((id) => workerMap.get(String(id)))
    .filter(Boolean);
  const merged = stringifyTeamMembers([...teamClean, ...fromStaff]);
  return merged || "-";
};

const buildStaffPreview = (staffDetalle, workerMap) => {
  if (!staffDetalle || typeof staffDetalle !== "object") return "";
  const rows = Object.entries(staffDetalle)
    .map(([id, nights]) => {
      const name = workerMap.get(String(id)) || `ID ${id}`;
      const n = Number(nights) || 0;
      return `${name}${n > 0 ? ` (${n})` : ""}`;
    })
    .filter(Boolean);
  return compactText(rows.join(", "), 90);
};

const buildStaffRows = (staffDetalle, workerMap) => {
  if (!staffDetalle || typeof staffDetalle !== "object") return [];
  return Object.entries(staffDetalle).map(([id, nights]) => {
    const name = workerMap.get(String(id)) || `ID ${id}`;
    const n = Number(nights) || 0;
    return { id: String(id), name, nights: n };
  });
};

const parseTeamMembers = (raw) =>
  String(raw || "")
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);

const stringifyTeamMembers = (members) => [...new Set(members)].join(", ");

const TYPE_COLORS = {
  montaje: { background: "#DBEAFE", text: "#1E3A8A" },
  desmontaje: { background: "#DBEAFE", text: "#1E3A8A" },
  taller: { background: "#FEF3C7", text: "#92400E" },
  mantenimiento: { background: "#ECFCCB", text: "#3F6212" },
  evento: { background: "#FBCFE8", text: "#9D174D" },
  vacaciones: { background: "#FECACA", text: "#7F1D1D" },
};

const hasValue = (value) => String(value || "").trim() !== "";

const getTypeDateFields = (type) => {
  if (type === "montaje") return { start: "setup_date", end: "setup_date_end" };
  if (type === "desmontaje") return { start: "dismantle_date", end: "dismantle_date_end" };
  if (type === "taller") return { start: "workshop_date", end: "workshop_date_end" };
  if (type === "mantenimiento") return { start: "maintenance_date", end: "maintenance_date_end" };
  return { start: "event_date", end: null };
};

const getTypeTeamField = (type) => {
  if (type === "desmontaje") return "team_dismantle";
  if (type === "taller") return "team_workshop";
  if (type === "mantenimiento") return "team_maintenance";
  return "team_setup";
};

const getTypeTitleField = (type) => {
  if (type === "montaje") return "setup_title";
  if (type === "desmontaje") return "dismantle_title";
  if (type === "taller") return "workshop_title";
  if (type === "mantenimiento") return "maintenance_title";
  return "event_name";
};

const getDisplayTitleForEvent = (event) => {
  if (!event) return "";
  const phase = String(event._selectedPhase || "").trim();
  if (phase === "montaje") return event.setup_title || event.event_name || event.nombre_evento || event.name || "";
  if (phase === "desmontaje") return event.dismantle_title || event.event_name || event.nombre_evento || event.name || "";
  if (phase === "taller") return event.workshop_title || event.event_name || event.nombre_evento || event.name || "";
  if (phase === "mantenimiento") return event.maintenance_title || event.event_name || event.nombre_evento || event.name || "";
  return event.event_name || event.nombre_evento || event.setup_title || event.dismantle_title || event.workshop_title || event.maintenance_title || event.name || "";
};

const ORDEN_PRIORIDAD_EMPRESAS = [
  "Monognomo",
  "Neozink",
  "Yurmuvi",
  "Picofino",
  "Guardianes",
  "Escuela Energía",
  "Castrillo2",
  "General",
];

const sortEmpresas = (a, b) => {
  let idxA = ORDEN_PRIORIDAD_EMPRESAS.indexOf(a);
  let idxB = ORDEN_PRIORIDAD_EMPRESAS.indexOf(b);
  if (idxA === -1) idxA = 99;
  if (idxB === -1) idxB = 99;
  return idxA - idxB || a.localeCompare(b);
};

export default function Calendar() {
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [eventsRaw, setEventsRaw] = useState([]);
  const [vacationsRaw, setVacationsRaw] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [workerFilter, setWorkerFilter] = useState("");
  const [weekFocusDate, setWeekFocusDate] = useState("");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditFormExpanded, setIsEditFormExpanded] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingVacationId, setEditingVacationId] = useState(null);
  const [addType, setAddType] = useState("evento");
  const [rangoMontaje, setRangoMontaje] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [staffNights, setStaffNights] = useState({});
  const [employeeToAdd, setEmployeeToAdd] = useState("");
  const [teamSetupToAdd, setTeamSetupToAdd] = useState("");
  const [vacationWorkerId, setVacationWorkerId] = useState("");
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [newEvent, setNewEvent] = useState({
    entry_type: "evento",
    project_id: "",
    event_name: "",
    event_date: "",
    event_date_precision: "day",
    place: "",
    setup_date: "",
    setup_date_end: "",
    dismantle_date: "",
    dismantle_date_end: "",
    setup_vehicle: "",
    dismantle_vehicle: "",
    team_setup: "",
    setup_title: "",
    team_dismantle: "",
    dismantle_title: "",
    workshop_date: "",
    workshop_date_end: "",
    team_workshop: "",
    workshop_title: "",
    workshop_vehicle: "",
    maintenance_date: "",
    maintenance_date_end: "",
    team_maintenance: "",
    maintenance_title: "",
    maintenance_vehicle: "",
    notes: "",
    night_date: "",
    coord_project_id: "",
    coord_prod_id: "",
    coord_disenio_id: "",
  });

  const fetchData = async () => {
    try {
      const [eventsReq, initReq, vacReq] = await Promise.allSettled([
        fetch(`${API_BASE}?action=get_events&t=${Date.now()}`),
        fetch(`${API_BASE}?action=get_initial_data`),
        fetch(`${API_BASE}?action=get_vacaciones&t=${Date.now()}`),
      ]);

      if (eventsReq.status === "fulfilled") {
        const eventsJson = await eventsReq.value.json();
        if (eventsJson?.success) setEventsRaw(eventsJson.data || []);
      }

      if (initReq.status === "fulfilled") {
        const initJson = await initReq.value.json();
        if (initJson?.success) {
          setProjects(initJson.proyectos || []);
          setWorkers(initJson.trabajadores || []);
        }
      }

      if (vacReq.status === "fulfilled") {
        try {
          const vacJson = await vacReq.value.json();
          if (vacJson?.success) setVacationsRaw(vacJson.data || []);
          else setVacationsRaw([]);
        } catch {
          setVacationsRaw([]);
        }
      } else {
        setVacationsRaw([]);
      }
    } catch (error) {
      console.error("Error cargando calendario", error);
    }
  };


  

  useEffect(() => {
    fetchData();
  }, []);

  const projectMap = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => map.set(String(p.id), p));
    return map;
  }, [projects]);

  const companies = useMemo(() => {
    return [...new Set(projects.map((p) => String(p.company || "").trim()).filter(Boolean))].sort(sortEmpresas);
  }, [projects]);

  const projectsByCompany = useMemo(() => {
    const filtered = selectedCompany
      ? projects.filter((p) => String(p.company || "").trim() === selectedCompany)
      : projects;

    const seen = new Set();
    return filtered.filter((p) => {
      const key = `${String(p.company || "").trim()}::${String(p.name || "").trim()}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [projects, selectedCompany]);

  const projectOptions = useMemo(() => {
    const options = [...projectsByCompany];
    if (newEvent.project_id && !options.some((p) => String(p.id) === String(newEvent.project_id))) {
      const current = projects.find((p) => String(p.id) === String(newEvent.project_id));
      if (current) options.unshift(current);
    }
    return options;
  }, [projectsByCompany, newEvent.project_id, projects]);

  const projectSearchOptions = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    const base = projectOptions
      .slice()
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }));
    if (!q) return base;
    return base.filter((p) => String(p.name || "").toLowerCase().includes(q));
  }, [projectOptions, projectSearch]);
  const activeTypeDate = useMemo(() => getTypeDateFields(addType), [addType]);
  const activeTeamField = useMemo(() => getTypeTeamField(addType), [addType]);
  const activeTitleField = useMemo(() => getTypeTitleField(addType), [addType]);

  const workerMap = useMemo(() => {
    const map = new Map();
    workers.forEach((w) => map.set(String(w.id), w.name));
    return map;
  }, [workers]);

  const coordinatorsByProject = useMemo(() => {
    const map = new Map();
    eventsRaw.forEach((ev) => {
      const projectId = String(ev.project_id || "");
      if (!projectId) return;
      const coord_project_id = String(ev.coord_project_id || "");
      const coord_prod_id = String(ev.coord_prod_id || "");
      const coord_disenio_id = String(ev.coord_disenio_id || "");
      const hasAny = coord_project_id || coord_prod_id || coord_disenio_id;
      if (!hasAny) return;
      if (!map.has(projectId)) {
        map.set(projectId, { coord_project_id, coord_prod_id, coord_disenio_id });
        return;
      }
      const prev = map.get(projectId);
      map.set(projectId, {
        coord_project_id: prev.coord_project_id || coord_project_id,
        coord_prod_id: prev.coord_prod_id || coord_prod_id,
        coord_disenio_id: prev.coord_disenio_id || coord_disenio_id,
      });
    });
    return map;
  }, [eventsRaw]);

  const assignedStaffRows = useMemo(() => {
    return Object.entries(staffNights)
      .map(([id, nights]) => ({
        id: String(id),
        name: workerMap.get(String(id)) || `ID ${id}`,
        nights: Number(nights) || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staffNights, workerMap]);

  const mergeTeamWithStaff = (teamRaw, staffDetailRaw) => {
    const team = parseTeamMembers(teamRaw);
    const byIdNames = Object.keys(staffDetailRaw || {})
      .map((id) => workerMap.get(String(id)))
      .filter(Boolean);
    return stringifyTeamMembers([...team, ...byIdNames]);
  };

  const nightCandidates = useMemo(() => {
    const teamNames = sanitizeTeamMembers(newEvent[activeTeamField] || "", workers);
    if (!teamNames.length) return [];

    const byName = new Map(workers.map((w) => [String(w.name || "").trim().toLowerCase(), w]));
    return teamNames
      .map((name) => byName.get(String(name || "").trim().toLowerCase()))
      .filter(Boolean)
      .filter((w, idx, arr) => arr.findIndex((x) => String(x.id) === String(w.id)) === idx)
      .filter((w) => staffNights[String(w.id)] === undefined)
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }));
  }, [newEvent, activeTeamField, workers, staffNights]);

  const safeTeamLabel = useMemo(() => {
    const names = sanitizeTeamMembers(newEvent[activeTeamField] || "", workers);
    return names.length ? names.join(", ") : "-";
  }, [newEvent, activeTeamField, workers]);

  const events = useMemo(() => {
    const normalEvents = eventsRaw
      .map((ev) => {
        const project = projectMap.get(String(ev.project_id));
        const eventDate = String(ev.event_date || "").slice(0, 10);
        const setupDate = String(ev.setup_date || "").slice(0, 10);
        const dismantleDate = String(ev.dismantle_date || "").slice(0, 10);
        const workshopDate = String(ev.workshop_date || "").slice(0, 10);
        const maintenanceDate = String(ev.maintenance_date || "").slice(0, 10);
        const refDate = eventDate || setupDate || dismantleDate || workshopDate || maintenanceDate;
        if (!refDate) return null;

        const resolvedTitle =
          ev.event_name ||
          ev.nombre_evento ||
          ev.setup_title ||
          ev.dismantle_title ||
          ev.workshop_title ||
          ev.maintenance_title ||
          project?.name ||
          "Evento";
        const name = String(resolvedTitle).toUpperCase();
        const setupRange = normalizeRange(ev.setup_date, ev.setup_date_end, null);
        const dismantleRange = normalizeRange(ev.dismantle_date, ev.dismantle_date_end, null);
        const workshopRange = normalizeRange(ev.workshop_date, ev.workshop_date_end, null);
        const maintenanceRange = normalizeRange(ev.maintenance_date, ev.maintenance_date_end, null);

        return {
          ...ev,
          id: String(ev.id || `${ev.project_id}-${name}`),
          name,
          projectName: project?.name || "Proyecto",
          company: project?.company || "Sin empresa",
          monthKey: refDate.slice(0, 7),
          event_name: String(ev.event_name || ev.nombre_evento || ev.setup_title || ev.dismantle_title || ev.workshop_title || ev.maintenance_title || "").trim(),
          setupStart: setupRange?.start || null,
          setupEnd: setupRange?.end || null,
          dismantleStart: dismantleRange?.start || null,
          dismantleEnd: dismantleRange?.end || null,
          workshopStart: workshopRange?.start || null,
          workshopEnd: workshopRange?.end || null,
          maintenanceStart: maintenanceRange?.start || null,
          maintenanceEnd: maintenanceRange?.end || null,
        };
      })
      .filter(Boolean);

    const vacationEvents = vacationsRaw.map((v) => {
      const workerName = (v.worker_name || workerMap.get(String(v.worker_id)) || "STAFF").toUpperCase();
      const start = String(v.date_start || "").slice(0, 10);
      const end = String(v.date_end || "").slice(0, 10);
      const setupRange = normalizeRange(start, start, null);
      const dismantleRange = normalizeRange(end, end, null);
      return {
        ...v,
        id: `vac-${v.id}`,
        isVacation: true,
        vacationId: v.id,
        staff_detalle: { [String(v.worker_id)]: 0 },
        event_name: `VACACIONES ${workerName}`,
        name: `VACACIONES ${workerName}`,
        projectName: "Vacaciones",
        company: "Vacaciones",
        project_id: "",
        place: "",
        event_date: start,
        event_date_precision: "day",
        setup_date: start,
        setup_date_end: start,
        dismantle_date: end,
        dismantle_date_end: end,
        setup_vehicle: "",
        dismantle_vehicle: "",
        team_setup: workerName,
        setup_title: "",
        team_dismantle: workerName,
        dismantle_title: "",
        workshop_date: "",
        workshop_date_end: "",
        team_workshop: workerName,
        workshop_title: "",
        workshop_vehicle: "",
        maintenance_date: "",
        maintenance_date_end: "",
        team_maintenance: workerName,
        maintenance_title: "",
        maintenance_vehicle: "",
        coord_project_id: "",
        coord_prod_id: "",
        coord_disenio_id: "",
        setupStart: setupRange?.start || null,
        setupEnd: setupRange?.end || null,
        dismantleStart: dismantleRange?.start || null,
        dismantleEnd: dismantleRange?.end || null,
      };
    });

    return [...normalEvents, ...vacationEvents]
      .filter((ev) => {
        if (!workerFilter) return true;
        const workerId = String(workerFilter);
        const inStaff = ev.staff_detalle && ev.staff_detalle[workerId] !== undefined;
        const inCoords =
          String(ev.coord_project_id || "") === workerId ||
          String(ev.coord_prod_id || "") === workerId ||
          String(ev.coord_disenio_id || "") === workerId;
        const workerName = (workerMap.get(workerId) || "").toLowerCase();
        const setupTeam = String(ev.team_setup || "").toLowerCase();
        const dismantleTeam = String(ev.team_dismantle || "").toLowerCase();
        const workshopTeam = String(ev.team_workshop || "").toLowerCase();
        const maintenanceTeam = String(ev.team_maintenance || "").toLowerCase();
        const inTeams =
          workerName &&
          (setupTeam.includes(workerName) ||
            dismantleTeam.includes(workerName) ||
            workshopTeam.includes(workerName) ||
            maintenanceTeam.includes(workerName));
        return inStaff || inCoords || inTeams;
      });
  }, [eventsRaw, vacationsRaw, projectMap, workerFilter, workerMap]);

  const calendarItems = useMemo(() => {
    const items = [];
    events.forEach((ev) => {
      if (ev.isVacation) {
        const start = toDateOnly(ev.date_start || ev.setup_date || ev.event_date);
        const end = toDateOnly(ev.date_end || ev.dismantle_date || ev.event_date);
        const range = normalizeRange(start, end, ev.event_date);
        if (!range) return;
        items.push({
          id: `${ev.id}-vac`,
          event: ev,
          phase: "vacaciones",
          label: `V: ${ev.name}`,
          detail: "",
          staff: buildStaffPreview(ev.staff_detalle, workerMap),
          start: range.start,
          end: range.end,
          color: TYPE_COLORS.vacaciones,
          isVacationLine: true,
        });
        return;
      }

      const hasNights = Object.values(ev.staff_detalle || {}).some((n) => Number(n) > 0);
      const nightEmoji = hasNights ? "🌙 " : "";
      const colorWithNightPriority = (phase) => (hasNights ? { background: "#1E3A8A", text: "#EFF6FF" } : TYPE_COLORS[phase]);
      const coordinatorText = buildCoordinatorMeta(ev, workerMap);
      const staffText = buildStaffPreview(ev.staff_detalle, workerMap);
      const isPureWorkshop =
        (ev.workshopStart || hasValue(ev.workshop_date)) &&
        !hasValue(ev.setup_date) &&
        !hasValue(ev.dismantle_date) &&
        !hasValue(ev.maintenance_date);
      const isPureMaintenance =
        (ev.maintenanceStart || hasValue(ev.maintenance_date)) &&
        !hasValue(ev.setup_date) &&
        !hasValue(ev.dismantle_date) &&
        !hasValue(ev.workshop_date);
      const isPureSetup =
        (ev.setupStart || hasValue(ev.setup_date)) &&
        !hasValue(ev.dismantle_date) &&
        !hasValue(ev.workshop_date) &&
        !hasValue(ev.maintenance_date);
      const isPureDismantle =
        (ev.dismantleStart || hasValue(ev.dismantle_date)) &&
        !hasValue(ev.setup_date) &&
        !hasValue(ev.workshop_date) &&
        !hasValue(ev.maintenance_date);
      const shouldRenderEventDay = !(isPureWorkshop || isPureMaintenance || isPureSetup || isPureDismantle);

      if (ev.setupStart && ev.setupEnd) {
        const start = ev.setupStart <= ev.setupEnd ? ev.setupStart : ev.setupEnd;
        const end = ev.setupStart <= ev.setupEnd ? ev.setupEnd : ev.setupStart;
        const setupTitle = ev.setup_title || ev.event_name || ev.name;
        items.push({
          id: `${ev.id}-setup`,
          event: ev,
          phase: "montaje",
          label: `${nightEmoji}M: ${setupTitle}`,
          title: setupTitle,
          detail: buildSegmentInfo(ev, "montaje"),
          staff: staffText,
          team: buildTeamByPhaseMeta(ev, "montaje"),
          coordinators: coordinatorText,
          start,
          end,
          color: colorWithNightPriority("montaje"),
        });
      }

      const eventDay = toDateOnly(ev.event_date);
      if (eventDay && shouldRenderEventDay) {
        const eventTitle = ev.event_name || ev.name;
        items.push({
          id: `${ev.id}-event-day`,
          event: ev,
          phase: "evento",
          label: `${nightEmoji}E: ${eventTitle}`,
          title: eventTitle,
          detail: buildSegmentInfo(ev, "evento"),
          staff: staffText,
          team: buildTeamByPhaseMeta(ev, "evento"),
          coordinators: coordinatorText,
          start: eventDay,
          end: eventDay,
          color: colorWithNightPriority("evento"),
        });
      }

      if (ev.dismantleStart && ev.dismantleEnd) {
        const start = ev.dismantleStart <= ev.dismantleEnd ? ev.dismantleStart : ev.dismantleEnd;
        const end = ev.dismantleStart <= ev.dismantleEnd ? ev.dismantleEnd : ev.dismantleStart;
        const dismantleTitle = ev.dismantle_title || ev.event_name || ev.name;
        items.push({
          id: `${ev.id}-dismantle`,
          event: ev,
          phase: "desmontaje",
          label: `${nightEmoji}D: ${dismantleTitle}`,
          title: dismantleTitle,
          detail: buildSegmentInfo(ev, "desmontaje"),
          staff: staffText,
          team: buildTeamByPhaseMeta(ev, "desmontaje"),
          coordinators: coordinatorText,
          start,
          end,
          color: colorWithNightPriority("desmontaje"),
        });
      }

      if (ev.workshopStart && ev.workshopEnd) {
        const start = ev.workshopStart <= ev.workshopEnd ? ev.workshopStart : ev.workshopEnd;
        const end = ev.workshopStart <= ev.workshopEnd ? ev.workshopEnd : ev.workshopStart;
        const workshopTitle = ev.workshop_title || ev.event_name || ev.name;
        items.push({
          id: `${ev.id}-workshop`,
          event: ev,
          phase: "taller",
          label: `${nightEmoji}T: ${workshopTitle}`,
          title: workshopTitle,
          detail: buildSegmentInfo(ev, "taller"),
          staff: staffText,
          team: buildTeamByPhaseMeta(ev, "taller"),
          coordinators: coordinatorText,
          start,
          end,
          color: colorWithNightPriority("taller"),
        });
      }

      if (ev.maintenanceStart && ev.maintenanceEnd) {
        const start = ev.maintenanceStart <= ev.maintenanceEnd ? ev.maintenanceStart : ev.maintenanceEnd;
        const end = ev.maintenanceStart <= ev.maintenanceEnd ? ev.maintenanceEnd : ev.maintenanceStart;
        const maintenanceTitle = ev.maintenance_title || ev.event_name || ev.name;
        items.push({
          id: `${ev.id}-maintenance`,
          event: ev,
          phase: "mantenimiento",
          label: `${nightEmoji}MA: ${maintenanceTitle}`,
          title: maintenanceTitle,
          detail: buildSegmentInfo(ev, "mantenimiento"),
          staff: staffText,
          team: buildTeamByPhaseMeta(ev, "mantenimiento"),
          coordinators: coordinatorText,
          start,
          end,
          color: colorWithNightPriority("mantenimiento"),
        });
      }
    });
    return items;
  }, [events, workerMap]);

  const gridStart = useMemo(() => startOfMonthGrid(monthCursor), [monthCursor]);
  const gridDays = useMemo(() => {
    return Array.from({ length: 42 }, (_, idx) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + idx);
      return d;
    });
  }, [gridStart]);

  const weeks = useMemo(() => {
    return Array.from({ length: 6 }, (_, weekIndex) => {
      const weekStart = gridDays[weekIndex * 7];
      const weekEnd = gridDays[weekIndex * 7 + 6];

      const segments = [];
      const normalLanesEnd = [];
      const vacationLanesEnd = [];

      const visibleItems = calendarItems.filter((item) => !(item.end < weekStart || item.start > weekEnd));
      const vacationItems = visibleItems.filter((item) => item.isVacationLine);
      const normalItems = visibleItems.filter((item) => !item.isVacationLine);

      vacationItems.forEach((item) => {
        const segStart = item.start > weekStart ? item.start : weekStart;
        const segEnd = item.end < weekEnd ? item.end : weekEnd;
        const startCol = Math.floor((segStart.getTime() - weekStart.getTime()) / 86400000);
        const span = daysBetweenInclusive(segStart, segEnd);

        let lane = 0;
        while (vacationLanesEnd[lane] !== undefined && vacationLanesEnd[lane] >= startCol) lane += 1;
        vacationLanesEnd[lane] = startCol + span - 1;

        segments.push({
          eventId: item.id,
          event: item.event,
          phase: item.phase,
          name: item.label,
          detail: item.detail,
          staff: item.staff,
          meta: buildCompactMeta(item.staff, item.team, item.detail, item.coordinators, item.event?.projectName),
          startCol,
          span,
          lane,
          color: item.color,
          isVacationLine: true,
        });
      });

      normalItems.forEach((item) => {
        const segStart = item.start > weekStart ? item.start : weekStart;
        const segEnd = item.end < weekEnd ? item.end : weekEnd;
        const startCol = Math.floor((segStart.getTime() - weekStart.getTime()) / 86400000);
        const span = daysBetweenInclusive(segStart, segEnd);

        let lane = 0;
        while (normalLanesEnd[lane] !== undefined && normalLanesEnd[lane] >= startCol) lane += 1;
        normalLanesEnd[lane] = startCol + span - 1;

        segments.push({
          eventId: item.id,
          event: item.event,
          phase: item.phase,
          name: item.label,
          detail: item.detail,
          staff: item.staff,
          meta: buildCompactMeta(item.staff, item.team, item.detail, item.coordinators, item.event?.projectName),
          startCol,
          span,
          lane: vacationLanesEnd.length + lane,
          color: item.color,
          isVacationLine: false,
        });
      });

      return {
        days: gridDays.slice(weekIndex * 7, weekIndex * 7 + 7),
        segments,
        normalLanes: normalLanesEnd.length,
        vacationLanes: vacationLanesEnd.length,
      };
    });
  }, [gridDays, calendarItems]);

  const focusedWeek = useMemo(() => {
    if (!weekFocusDate) return null;
    const anchor = toDateOnly(weekFocusDate);
    if (!anchor) return null;

    const weekStart = startOfWeekMonday(anchor);
    const days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + idx);
      return d;
    });

    const byDay = days.map((day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const eventsForDay = calendarItems
        .filter((item) => item.start <= dayEnd && item.end >= dayStart)
        .sort((a, b) => {
          if (a.isVacationLine !== b.isVacationLine) return a.isVacationLine ? -1 : 1;
          return String(a.label || "").localeCompare(String(b.label || ""));
        });

      return { day, events: eventsForDay };
    });

    return { weekStart, days: byDay };
  }, [weekFocusDate, calendarItems]);

  const handleCreateEvent = async () => {
    if (addType === "vacaciones") {
      if (!vacationWorkerId || !vacationStart || !vacationEnd) {
        alert("Para vacaciones selecciona empleado y rango de fechas");
        return;
      }
    } else if (!newEvent.project_id) {
      alert("Proyecto obligatorio");
      return;
    }

    try {
      setIsSaving(true);
      const noches_staff = Object.entries(staffNights).map(([workerId, nights]) => ({
        worker_id: Number(workerId),
        nights: Number(nights) || 0,
      }));
      const payloadBase = newEvent;
      const payload = {
        ...payloadBase,
        id: editingEventId,
        noches_staff,
      };

      if (addType !== "vacaciones") {
        const selectedProject = projectMap.get(String(payload.project_id));
        if (!selectedProject) {
          alert("Selecciona un proyecto válido");
          setIsSaving(false);
          return;
        }
        const titleField = getTypeTitleField(addType);
        const resolvedTitle =
          String(payload[titleField] || "").trim() ||
          String(payload.event_name || "").trim() ||
          selectedProject.name ||
          "";

        payload[titleField] = resolvedTitle;
        payload.event_name = addType === "evento" ? resolvedTitle : resolvedTitle;
        // Compat: algunos endpoints antiguos usan `nombre_evento`.
        payload.nombre_evento = payload.event_name;
        const startField = activeTypeDate.start;
        const endField = activeTypeDate.end;
        if (!payload[startField]) {
          alert("Debes indicar fecha o rango");
          setIsSaving(false);
          return;
        }
        payload.event_date = payload[startField];
        const hasNights = noches_staff.some((n) => Number(n.nights) > 0);
        if (hasNights && !payload.night_date) {
          alert("Si registras noches, indica la fecha de noches");
          setIsSaving(false);
          return;
        }
        if (addType === "evento") {
          payload.setup_title = payload.event_name;
          payload.dismantle_title = payload.event_name;
          payload.workshop_title = payload.event_name;
          payload.maintenance_title = payload.event_name;
        } else {
          payload.setup_title = titleField === "setup_title" ? payload.setup_title : "";
          payload.dismantle_title = titleField === "dismantle_title" ? payload.dismantle_title : "";
          payload.workshop_title = titleField === "workshop_title" ? payload.workshop_title : "";
          payload.maintenance_title = titleField === "maintenance_title" ? payload.maintenance_title : "";
        }
        payload.setup_vehicle = String(payload.setup_vehicle || "").trim();
        payload.dismantle_vehicle = String(payload.setup_vehicle || "").trim();
        payload.workshop_vehicle = String(payload.setup_vehicle || "").trim();
        payload.maintenance_vehicle = String(payload.setup_vehicle || "").trim();

        if (addType !== "evento") {
          payload.coord_project_id = "";
          payload.coord_prod_id = "";
          payload.coord_disenio_id = "";
        }

        const allDateFields = ["setup_date", "dismantle_date", "workshop_date", "maintenance_date"];
        const allEndFields = ["setup_date_end", "dismantle_date_end", "workshop_date_end", "maintenance_date_end"];
        allDateFields.forEach((f) => {
          if (f !== startField) payload[f] = "";
        });
        allEndFields.forEach((f) => {
          if (f !== endField) payload[f] = f === "dismantle_date_end" || f === "setup_date_end" ? null : "";
        });
        if (endField && !payload[endField]) payload[endField] = endField.includes("setup") || endField.includes("dismantle") ? null : "";

        payload.team_setup = addType === "evento" || addType === "montaje" ? String(payload.team_setup || "").trim() : "";
        payload.team_dismantle = addType === "desmontaje" ? String(payload.team_dismantle || "").trim() : "";
        payload.team_workshop = addType === "taller" ? String(payload.team_workshop || "").trim() : "";
        payload.team_maintenance = addType === "mantenimiento" ? String(payload.team_maintenance || "").trim() : "";
        payload.team_setup = sanitizeTeamMembers(payload.team_setup, workers).join(", ");
        payload.team_dismantle = sanitizeTeamMembers(payload.team_dismantle, workers).join(", ");
        payload.team_workshop = sanitizeTeamMembers(payload.team_workshop, workers).join(", ");
        payload.team_maintenance = sanitizeTeamMembers(payload.team_maintenance, workers).join(", ");
      }

      if (addType === "vacaciones") {
        const vacAction = editingVacationId ? "update_vacaciones" : "add_vacaciones";
        const vacPayload = {
          worker_id: Number(vacationWorkerId),
          date_start: vacationStart,
          date_end: vacationEnd,
          notes: "",
        };
        if (editingVacationId) vacPayload.id = editingVacationId;
        const vacRes = await fetch(`${API_BASE}?action=${vacAction}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vacPayload),
        });
        const vacJson = await vacRes.json();
        if (!vacJson?.success) throw new Error(vacJson?.message || "No se pudo guardar vacaciones");

        setShowAddModal(false);
        setStaffNights({});
        setEmployeeToAdd("");
        setTeamSetupToAdd("");
        setVacationWorkerId("");
        setVacationStart("");
        setVacationEnd("");
        setSelectedCompany("");
        setEditingEventId(null);
        setEditingVacationId(null);
        await fetchData();
        return;
      }

      if (addType !== "vacaciones") {
        payload.event_date_precision = "day";
      }
      if (addType !== "vacaciones" && activeTypeDate.end) {
        const endValue = String(payload[activeTypeDate.end] || "").trim();
        const hasRangeByToggle = Boolean(rangoMontaje);
        const hasRangeByValue = Boolean(endValue);
        if (!hasRangeByToggle && !hasRangeByValue) {
          if (activeTypeDate.end === "setup_date_end" || activeTypeDate.end === "dismantle_date_end") payload[activeTypeDate.end] = null;
          else payload[activeTypeDate.end] = "";
        }
      }

      const action = editingEventId ? "update_event" : "add_event";
      const res = await fetch(`${API_BASE}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "No se pudo guardar");

      setShowAddModal(false);
      setIsEditFormExpanded(false);
      setNewEvent({
        entry_type: "evento",
        project_id: "",
        event_name: "",
        event_date: "",
        event_date_precision: "day",
        place: "",
        setup_date: "",
        setup_date_end: "",
        dismantle_date: "",
        dismantle_date_end: "",
        setup_vehicle: "",
        dismantle_vehicle: "",
        team_setup: "",
        setup_title: "",
        team_dismantle: "",
        dismantle_title: "",
        workshop_date: "",
        workshop_date_end: "",
        team_workshop: "",
        workshop_title: "",
        workshop_vehicle: "",
        maintenance_date: "",
        maintenance_date_end: "",
        team_maintenance: "",
        maintenance_title: "",
        maintenance_vehicle: "",
        notes: "",
        night_date: "",
        coord_project_id: "",
        coord_prod_id: "",
        coord_disenio_id: "",
      });
      setAddType("evento");
      setProjectSearch("");
      setRangoMontaje(false);
      setStaffNights({});
      setEmployeeToAdd("");
      setTeamSetupToAdd("");
      setVacationWorkerId("");
      setVacationStart("");
      setVacationEnd("");
      setSelectedCompany("");
      setEditingEventId(null);
      setEditingVacationId(null);
      await fetchData();
    } catch (error) {
      alert(error.message || "Error guardando evento");
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingEventId(null);
    setEditingVacationId(null);
    setStaffNights({});
    setEmployeeToAdd("");
    setNewEvent({
      entry_type: "evento",
      project_id: "",
      event_name: "",
      event_date: "",
      event_date_precision: "day",
      place: "",
      setup_date: "",
      setup_date_end: "",
      dismantle_date: "",
      dismantle_date_end: "",
      setup_vehicle: "",
      dismantle_vehicle: "",
      team_setup: "",
      setup_title: "",
      team_dismantle: "",
      dismantle_title: "",
      workshop_date: "",
      workshop_date_end: "",
      team_workshop: "",
      workshop_title: "",
      workshop_vehicle: "",
      maintenance_date: "",
      maintenance_date_end: "",
      team_maintenance: "",
      maintenance_title: "",
      maintenance_vehicle: "",
      notes: "",
      night_date: "",
      coord_project_id: "",
      coord_prod_id: "",
      coord_disenio_id: "",
    });
    setAddType("evento");
    setProjectSearch("");
    setRangoMontaje(false);
    setTeamSetupToAdd("");
    setVacationWorkerId("");
    setVacationStart("");
    setVacationEnd("");
    setSelectedCompany("");
    setShowAddModal(true);
    setIsEditFormExpanded(true);
  };

  const openEditModal = () => {
    if (!selectedEvent) return;
    const projectId = String(selectedEvent.project_id || "");
    const fallbackCoords = coordinatorsByProject.get(projectId);
    const resolvedCoordProject = String(selectedEvent.coord_project_id || fallbackCoords?.coord_project_id || "");
    const resolvedCoordProd = String(selectedEvent.coord_prod_id || fallbackCoords?.coord_prod_id || "");
    const resolvedCoordDisenio = String(selectedEvent.coord_disenio_id || fallbackCoords?.coord_disenio_id || "");
    setEditingEventId(selectedEvent.id);
    setEditingVacationId(selectedEvent.isVacation ? selectedEvent.vacationId : null);
    const precision = selectedEvent.event_date_precision || "day";
    const eventDate = String(selectedEvent.event_date || "").slice(0, 10);
    const isMontageRange =
      selectedEvent.setup_date_end &&
      String(selectedEvent.setup_date_end).slice(0, 10) !== "" &&
      String(selectedEvent.setup_date_end).slice(0, 10) !== "0000-00-00";

    setNewEvent({
      entry_type: selectedEvent.isVacation ? "vacaciones" : "evento",
      project_id: String(selectedEvent.project_id || ""),
      event_name:
        selectedEvent.event_name ||
        selectedEvent.nombre_evento ||
        selectedEvent.setup_title ||
        selectedEvent.dismantle_title ||
        selectedEvent.workshop_title ||
        selectedEvent.maintenance_title ||
        selectedEvent.name ||
        "",
      event_date: precision === "month" ? eventDate.slice(0, 7) : eventDate,
      event_date_precision: precision,
      place: selectedEvent.place || "",
      setup_date: String(selectedEvent.setup_date || "").slice(0, 10),
      setup_date_end: String(selectedEvent.setup_date_end || "").slice(0, 10),
      dismantle_date: String(selectedEvent.dismantle_date || "").slice(0, 10),
      dismantle_date_end: String(selectedEvent.dismantle_date_end || "").slice(0, 10),
      setup_vehicle: selectedEvent.setup_vehicle || "",
      dismantle_vehicle: selectedEvent.dismantle_vehicle || "",
      team_setup: mergeTeamWithStaff(sanitizeTeamMembers(selectedEvent.team_setup || "", workers).join(", "), selectedEvent.staff_detalle),
      setup_title: selectedEvent.setup_title || selectedEvent.event_name || selectedEvent.nombre_evento || "",
      team_dismantle: mergeTeamWithStaff(sanitizeTeamMembers(selectedEvent.team_dismantle || "", workers).join(", "), selectedEvent.staff_detalle),
      dismantle_title: selectedEvent.dismantle_title || selectedEvent.event_name || selectedEvent.nombre_evento || "",
      workshop_date: String(selectedEvent.workshop_date || "").slice(0, 10),
      workshop_date_end: String(selectedEvent.workshop_date_end || "").slice(0, 10),
      team_workshop: mergeTeamWithStaff(sanitizeTeamMembers(selectedEvent.team_workshop || "", workers).join(", "), selectedEvent.staff_detalle),
      workshop_title: selectedEvent.workshop_title || selectedEvent.event_name || selectedEvent.nombre_evento || "",
      workshop_vehicle: selectedEvent.workshop_vehicle || "",
      maintenance_date: String(selectedEvent.maintenance_date || "").slice(0, 10),
      maintenance_date_end: String(selectedEvent.maintenance_date_end || "").slice(0, 10),
      team_maintenance: mergeTeamWithStaff(sanitizeTeamMembers(selectedEvent.team_maintenance || "", workers).join(", "), selectedEvent.staff_detalle),
      maintenance_title: selectedEvent.maintenance_title || selectedEvent.event_name || selectedEvent.nombre_evento || "",
      maintenance_vehicle: selectedEvent.maintenance_vehicle || "",
      notes: selectedEvent.notes || "",
      night_date: String(selectedEvent.night_date || "").slice(0, 10),
      coord_project_id: resolvedCoordProject,
      coord_prod_id: resolvedCoordProd,
      coord_disenio_id: resolvedCoordDisenio,
    });
    const inferredType = selectedEvent.isVacation
      ? "vacaciones"
      : hasValue(selectedEvent.maintenance_date)
        ? "mantenimiento"
        : hasValue(selectedEvent.workshop_date)
          ? "taller"
          : hasValue(selectedEvent.dismantle_date)
            ? "desmontaje"
            : hasValue(selectedEvent.setup_date) && !hasValue(selectedEvent.event_date)
              ? "montaje"
              : "evento";
    setAddType(inferredType);
    setRangoMontaje(Boolean(isMontageRange));
    setStaffNights(
      Object.entries(selectedEvent.staff_detalle || {}).reduce((acc, [id, nights]) => {
        acc[String(id)] = Number(nights) || 0;
        return acc;
      }, {})
    );
    setEmployeeToAdd("");
    setTeamSetupToAdd("");
    setVacationWorkerId(Object.keys(selectedEvent.staff_detalle || {})[0] || "");
    setVacationStart(String(selectedEvent.setup_date || selectedEvent.event_date || "").slice(0, 10));
    setVacationEnd(String(selectedEvent.dismantle_date || selectedEvent.event_date || "").slice(0, 10));
    const p = projectMap.get(projectId);
    setSelectedCompany(p?.company || "");
    setProjectSearch(p?.name || "");
    setSelectedEvent(null);
    setShowAddModal(true);
    setIsEditFormExpanded(true);
  };

  const handleDeleteVacation = async () => {
    if (!selectedEvent?.isVacation || !selectedEvent?.vacationId) return;
    if (!window.confirm("¿Eliminar estas vacaciones?")) return;
    try {
      const res = await fetch(`${API_BASE}?action=delete_vacaciones&id=${selectedEvent.vacationId}`);
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "No se pudo eliminar vacaciones");
      setSelectedEvent(null);
      await fetchData();
    } catch (error) {
      alert(error.message || "Error eliminando vacaciones");
    }
  };

  const buildUpdatePayloadFromEvent = (ev) => {
    const eventName =
      String(
        ev?.event_name ||
          ev?.nombre_evento ||
          ev?.setup_title ||
          ev?.dismantle_title ||
          ev?.workshop_title ||
          ev?.maintenance_title ||
          ""
      ).trim() || (projectMap.get(String(ev?.project_id || ""))?.name || "");
    const normalizeEnd = (value) => {
      const raw = String(value || "").slice(0, 10);
      if (!raw || raw === "0000-00-00") return null;
      return raw;
    };
    const noches_staff = Object.entries(ev?.staff_detalle || {}).map(([workerId, nights]) => ({
      worker_id: Number(workerId),
      nights: Number(nights) || 0,
    }));
    return {
      id: String(ev?.id || ""),
      entry_type: ev?.entry_type || "evento",
      project_id: String(ev?.project_id || ""),
      event_name: eventName,
      nombre_evento: eventName,
      event_date: String(ev?.event_date || "").slice(0, 10),
      event_date_precision: ev?.event_date_precision || "day",
      place: ev?.place || "",
      setup_date: String(ev?.setup_date || "").slice(0, 10),
      setup_date_end: normalizeEnd(ev?.setup_date_end),
      dismantle_date: String(ev?.dismantle_date || "").slice(0, 10),
      dismantle_date_end: normalizeEnd(ev?.dismantle_date_end),
      setup_vehicle: ev?.setup_vehicle || "",
      dismantle_vehicle: ev?.dismantle_vehicle || "",
      team_setup: ev?.team_setup || "",
      setup_title: ev?.setup_title || "",
      team_dismantle: ev?.team_dismantle || "",
      dismantle_title: ev?.dismantle_title || "",
      workshop_date: String(ev?.workshop_date || "").slice(0, 10),
      workshop_date_end: String(ev?.workshop_date_end || "").slice(0, 10),
      team_workshop: ev?.team_workshop || "",
      workshop_title: ev?.workshop_title || "",
      workshop_vehicle: ev?.workshop_vehicle || "",
      maintenance_date: String(ev?.maintenance_date || "").slice(0, 10),
      maintenance_date_end: String(ev?.maintenance_date_end || "").slice(0, 10),
      team_maintenance: ev?.team_maintenance || "",
      maintenance_title: ev?.maintenance_title || "",
      maintenance_vehicle: ev?.maintenance_vehicle || "",
      notes: ev?.notes || "",
      night_date: String(ev?.night_date || "").slice(0, 10),
      coord_project_id: ev?.coord_project_id || "",
      coord_prod_id: ev?.coord_prod_id || "",
      coord_disenio_id: ev?.coord_disenio_id || "",
      noches_staff,
    };
  };

  const handleDeleteSelectedPhase = async () => {
    if (!selectedEvent || selectedEvent.isVacation) return;
    if (!selectedEvent.id) return;
    const phase = selectedEvent._selectedPhase;
    if (!phase) {
      alert("No se ha detectado la fase seleccionada.");
      return;
    }

    const phaseLabel =
      phase === "montaje"
        ? "Montaje"
        : phase === "evento"
          ? "Evento"
          : phase === "desmontaje"
            ? "Desmontaje"
            : phase === "taller"
              ? "Taller"
              : phase === "mantenimiento"
                ? "Mantenimiento"
                : phase;

    if (!window.confirm(`¿Eliminar solo la fase "${phaseLabel}" de esta entrada?`)) return;

    try {
      const payload = buildUpdatePayloadFromEvent(selectedEvent);

      if (phase === "montaje") {
        payload.setup_date = "";
        payload.setup_date_end = null;
        payload.team_setup = "";
        payload.setup_title = "";
        payload.setup_vehicle = "";
      } else if (phase === "evento") {
        payload.event_date = "";
        payload.event_date_precision = "day";
      } else if (phase === "desmontaje") {
        payload.dismantle_date = "";
        payload.dismantle_date_end = null;
        payload.team_dismantle = "";
        payload.dismantle_title = "";
        payload.dismantle_vehicle = "";
      } else if (phase === "taller") {
        payload.workshop_date = "";
        payload.workshop_date_end = "";
        payload.team_workshop = "";
        payload.workshop_title = "";
        payload.workshop_vehicle = "";
      } else if (phase === "mantenimiento") {
        payload.maintenance_date = "";
        payload.maintenance_date_end = "";
        payload.team_maintenance = "";
        payload.maintenance_title = "";
        payload.maintenance_vehicle = "";
      } else {
        alert("Fase no soportada para eliminar parcialmente.");
        return;
      }

      const res = await fetch(`${API_BASE}?action=update_event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "No se pudo eliminar la fase");

      setSelectedEvent(null);
      await fetchData();
    } catch (error) {
      alert(error.message || "Error eliminando la fase");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-2 pb-10 sm:px-6">
      <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 text-slate-800 shadow-xl">
        <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4 sm:px-6">
          <button
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="rounded-lg px-3 py-2 text-lg font-bold text-slate-700 hover:bg-slate-200"
          >
            ‹
          </button>

          <h2 className="text-center text-lg font-extrabold tracking-wide sm:text-3xl">{formatMonthTitle(monthCursor)}</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-emerald-400"
            >
              + Añadir
            </button>
            <button
              onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="rounded-lg px-3 py-2 text-lg font-bold text-slate-700 hover:bg-slate-200"
            >
              ›
            </button>
          </div>
        </div>

        <div className="px-4 pb-3 sm:px-6">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,24rem)_minmax(0,18rem)_auto] sm:items-center">
            <select
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-700"
            >
              <option value="">Filtrar por persona</option>
              {workers
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((w) => (
                  <option key={w.id} value={String(w.id)}>
                    {w.name}
                  </option>
                ))}
            </select>
            <input
              type="date"
              value={weekFocusDate}
              onChange={(e) => setWeekFocusDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-700"
              title="Selecciona un día para ver esa semana en columna"
            />
            {weekFocusDate && (
              <button
                type="button"
                onClick={() => setWeekFocusDate("")}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase text-slate-700"
              >
                Ver mes
              </button>
            )}
          </div>
        </div>

        {!focusedWeek && (
          <div className="grid grid-cols-7 border-b border-slate-200">
            {DIAS_SEMANA.map((day) => (
              <div key={day} className="py-2 text-center text-[11px] font-semibold tracking-wider text-slate-500 sm:text-sm">
                {day}
              </div>
            ))}
          </div>
        )}

        {!focusedWeek &&
          weeks.map((week, wIdx) => {
          const normalLaneHeight = 58;
          const vacationLaneHeight = 28;
          const barsTop = 42;
          const vacationLaneCount = week.vacationLanes;
          const normalHeight = Math.max(week.normalLanes, 1) * normalLaneHeight;
          const vacationHeight = week.vacationLanes * vacationLaneHeight;
          const barsHeight = normalHeight + vacationHeight;
          const rowHeight = Math.max(128, barsTop + barsHeight + 10);

          return (
            <div key={`week-${wIdx}`} className="relative border-b border-slate-200 last:border-b-0">
              <div className="grid grid-cols-7">
                {week.days.map((d) => {
                  const inCurrentMonth = d.getMonth() === monthCursor.getMonth();
                  return (
                    <div
                      key={d.toISOString()}
                      className="border-r border-slate-200 px-2 pt-2 text-right text-base last:border-r-0"
                      style={{ height: `${rowHeight}px` }}
                    >
                      <span className={`relative z-10 inline-block rounded-md bg-white/95 px-1.5 py-0.5 ${inCurrentMonth ? "text-slate-700" : "text-slate-400"}`}>
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="absolute inset-x-0 px-1" style={{ top: `${barsTop}px`, height: `${barsHeight}px` }}>
                {week.segments.map((seg) => (
                  <button
                    key={`${wIdx}-${seg.eventId}-${seg.lane}-${seg.startCol}`}
                    type="button"
                    onClick={() => {
                      setSelectedEvent({ ...seg.event, _selectedPhase: seg.phase });
                    }}
                    className="absolute overflow-hidden rounded-xl border border-black/5 px-2.5 py-1.5 text-left shadow-sm"
                    style={{
                      left: `calc(${(seg.startCol * 100) / 7}% + 2px)`,
                      width: `calc(${(seg.span * 100) / 7}% - 4px)`,
                      top: seg.isVacationLine
                        ? `${seg.lane * vacationLaneHeight}px`
                        : `${vacationHeight + (seg.lane - vacationLaneCount) * normalLaneHeight}px`,
                      height: seg.isVacationLine ? "24px" : "52px",
                      background: seg.color.background,
                      color: seg.color.text,
                    }}
                    title={seg.name}
                  >
                    {seg.isVacationLine ? (
                      <p className="truncate text-[11px] font-black uppercase leading-tight tracking-wide">{seg.name}</p>
                    ) : (
                      <>
                        <p className="truncate text-[11px] font-black uppercase leading-tight tracking-wide">{seg.name}</p>
                        <p className="truncate pt-1 text-[10px] font-medium normal-case leading-tight opacity-90">
                          {seg.meta}
                        </p>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
          })}

        {focusedWeek && (
          <div className="space-y-3 p-3 sm:p-4">
            {focusedWeek.days.map(({ day, events }) => (
              <div key={day.toISOString()} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-xs font-black uppercase text-slate-500">
                  {day.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "2-digit" })}
                </p>
                <div className="space-y-2">
                  {events.length > 0 ? (
                    events.map((ev) => (
                      <button
                        key={`${day.toISOString()}-${ev.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedEvent({ ...ev.event, _selectedPhase: ev.phase });
                        }}
                        className="w-full rounded-lg border border-black/5 px-2.5 py-2 text-left shadow-sm"
                        style={{ background: ev.color.background, color: ev.color.text }}
                      >
                        <p className="truncate text-[11px] font-black uppercase leading-tight tracking-wide">{ev.label}</p>
                        {!ev.isVacationLine && (
                          <p className="truncate pt-1 text-[10px] font-medium normal-case leading-tight opacity-90">
                            {buildCompactMeta(ev.staff, ev.team, ev.detail, ev.coordinators, ev.event?.projectName)}
                          </p>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Sin eventos</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
       <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 sm:items-center sm:p-3">
           <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white text-gray-800">
             <div className="sticky top-0 z-10 mb-4 flex items-start justify-between gap-3 border-b bg-white p-4 sm:p-6">
               <div>
                 <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                   {selectedEvent.isVacation ? "vacaciones" : selectedEvent._selectedPhase || selectedEvent.entry_type || "evento"}
                 </p>
                 <h3 className="text-lg font-black uppercase leading-tight">{getDisplayTitleForEvent(selectedEvent) || "-"}</h3>
                 <p className="text-[11px] font-semibold text-gray-600">{selectedEvent.projectName || "-"}</p>
               </div>
               <button className="rounded-md px-2 text-2xl leading-none text-gray-500" onClick={() => { setSelectedEvent(null); }}>×</button>
             </div>
             <div className="px-4 pb-4 sm:px-6 sm:pb-6">
             <button
               onClick={openEditModal}
               className="mb-3 w-full rounded-xl bg-black px-3 py-2 text-xs font-black uppercase text-white"
             >
               Editar este evento
             </button>
             {!selectedEvent.isVacation && selectedEvent._selectedPhase && (
               <button
                 onClick={handleDeleteSelectedPhase}
                 className="mb-3 w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white"
               >
                 Eliminar fase
               </button>
             )}
             {selectedEvent.isVacation && (
               <button
                 onClick={handleDeleteVacation}
                 className="mb-3 w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white"
               >
                 Eliminar vacaciones
               </button>
             )}

            <div className="space-y-2 text-sm">
              <p><b>Empresa:</b> {selectedEvent.company || "-"}</p>
              <p><b>Proyecto:</b> {selectedEvent.projectName || "-"}</p>
              <p><b>Tipo:</b> {selectedEvent.isVacation ? "vacaciones" : selectedEvent._selectedPhase || selectedEvent.entry_type || "evento"}</p>
              <p><b>Título:</b> {getDisplayTitleForEvent(selectedEvent) || "-"}</p>
              <p><b>Fecha del evento:</b> {formatDate(selectedEvent.event_date)}</p>
              {(String(selectedEvent.setup_date || "").slice(0, 10) &&
                (String(selectedEvent.setup_date || "").slice(0, 10) !== String(selectedEvent.event_date || "").slice(0, 10) ||
                  String(selectedEvent.setup_date_end || "").slice(0, 10))) ? (
                <p><b>Fecha/rango de trabajo:</b> {formatDateRange(selectedEvent.setup_date, selectedEvent.setup_date_end)}</p>
              ) : null}
              <p><b>Lugar:</b> {selectedEvent.place || "-"}</p>
              <p><b>Vehículo:</b> {selectedEvent.setup_vehicle || "-"}</p>
              <p><b>Equipo:</b> {buildTeamDisplayFromEvent(selectedEvent, workers, workerMap)}</p>
              <p><b>Coord. Proyecto:</b> {workerMap.get(String(selectedEvent.coord_project_id || coordinatorsByProject.get(String(selectedEvent.project_id || ""))?.coord_project_id || "")) || "-"}</p>
              <p><b>Coord. Producción:</b> {workerMap.get(String(selectedEvent.coord_prod_id || coordinatorsByProject.get(String(selectedEvent.project_id || ""))?.coord_prod_id || "")) || "-"}</p>
              <p><b>Coord. Diseño:</b> {workerMap.get(String(selectedEvent.coord_disenio_id || coordinatorsByProject.get(String(selectedEvent.project_id || ""))?.coord_disenio_id || "")) || "-"}</p>
              {selectedEvent.notes ? <p><b>Notas:</b> {selectedEvent.notes}</p> : null}
              {!selectedEvent.notes && getLegacyNoteFromTeam(selectedEvent.team_setup || "", workers) ? (
                <p><b>Notas:</b> {getLegacyNoteFromTeam(selectedEvent.team_setup || "", workers)}</p>
              ) : null}
              {selectedEvent.night_date ? <p><b>Fecha noches:</b> {formatDate(selectedEvent.night_date)}</p> : null}
              {buildStaffRows(selectedEvent.staff_detalle, workerMap).length > 0 ? (
                <div>
                  <p><b>Noches por empleado:</b></p>
                  {buildStaffRows(selectedEvent.staff_detalle, workerMap).map((row) => (
                    <p key={row.id}>{row.name}: {row.nights}</p>
                  ))}
                </div>
              ) : null}
            </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-2 sm:items-center sm:p-3">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white text-gray-800">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between border-b bg-white p-4 sm:p-6">
              <h3 className="text-lg font-black uppercase">{editingEventId ? "Editar evento" : "Añadir evento"}</h3>
              <button className="rounded-md px-2 text-2xl leading-none text-gray-500" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-black uppercase text-gray-500">Qué quieres añadir</label>
                {editingEventId ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-black uppercase text-gray-700">{addType}</div>
                ) : (
                  <select value={addType} onChange={(e) => setAddType(e.target.value)} className="w-full rounded-xl border border-gray-200 p-3">
                    <option value="evento">Evento</option>
                    <option value="montaje">Montaje</option>
                    <option value="desmontaje">Desmontaje</option>
                    <option value="taller">Taller</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="vacaciones">Vacaciones</option>
                  </select>
                )}
              </div>

              {addType !== "vacaciones" && (
                <>
                  <select
                    value={selectedCompany}
                    onChange={(e) => {
                      const company = e.target.value;
                      setSelectedCompany(company);
                      setProjectSearch("");
                      setNewEvent((p) => ({ ...p, project_id: "" }));
                    }}
                    className="rounded-xl border border-gray-200 p-3"
                  >
                    <option value="">Empresa</option>
                    {companies.map((company) => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                  <div className="sm:col-span-2 rounded-xl border border-gray-200 p-3">
                    <input
                      type="text"
                      placeholder="Buscar proyecto por nombre..."
                      value={projectSearch}
                      onChange={(e) => {
                        setProjectSearch(e.target.value);
                        const exact = projectOptions.find((p) => String(p.name || "").toLowerCase() === e.target.value.trim().toLowerCase());
                        if (exact) setNewEvent((prev) => ({ ...prev, project_id: String(exact.id) }));
                      }}
                      className="mb-2 w-full rounded-lg border border-gray-200 p-2 text-[12px]"
                    />
                    <select
                      value={newEvent.project_id}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const project = projectOptions.find((p) => String(p.id) === String(selectedId));
                        setProjectSearch(project?.name || "");
                        setNewEvent((p) => ({ ...p, project_id: selectedId }));
                      }}
                      className="w-full rounded-lg border border-gray-200 p-2 text-[12px]"
                    >
                      <option value="">Seleccionar proyecto</option>
                      {projectSearchOptions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {addType !== "vacaciones" && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-[11px] font-semibold text-gray-600 sm:col-span-2">
                  <p>
                    Nombre del proyecto:{" "}
                    <span className="font-black text-gray-800">
                      {projectMap.get(String(newEvent.project_id))?.name || "-"}
                    </span>
                  </p>
                  <p>
                    Título:{" "}
                    <span className="font-black text-gray-800">
                      {String(newEvent[activeTitleField] || "").trim() || "-"}
                    </span>
                  </p>
                </div>
              )}

              {editingEventId && !isEditFormExpanded && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-black uppercase text-gray-500">Título</label>
                  <input
                    type="text"
                    placeholder="Título"
                    value={newEvent[activeTitleField] || ""}
                    onChange={(e) => setNewEvent((p) => ({ ...p, [activeTitleField]: e.target.value }))}
                    className="mb-2 w-full rounded-xl border border-gray-200 bg-white p-3"
                  />
                  <p><b>Fecha evento:</b> {formatDate(newEvent.event_date)}</p>
                  <p><b>Fecha o rango:</b> {formatDateRange(newEvent[activeTypeDate.start], activeTypeDate.end ? newEvent[activeTypeDate.end] : null)}</p>
                  <p><b>Lugar:</b> {newEvent.place || "-"}</p>
                  <p><b>Vehículo:</b> {newEvent.setup_vehicle || "-"}</p>
                  <p><b>Equipo:</b> {safeTeamLabel}</p>
                  {addType === "evento" ? <p><b>Coord. Proyecto:</b> {workerMap.get(String(newEvent.coord_project_id || "")) || "-"}</p> : null}
                  {addType === "evento" ? <p><b>Coord. Producción:</b> {workerMap.get(String(newEvent.coord_prod_id || "")) || "-"}</p> : null}
                  {addType === "evento" ? <p><b>Coord. Diseño:</b> {workerMap.get(String(newEvent.coord_disenio_id || "")) || "-"}</p> : null}
                  <p><b>Notas:</b> {newEvent.notes || "-"}</p>
                  <button
                    type="button"
                    onClick={() => setIsEditFormExpanded(true)}
                    className="mt-3 w-full rounded-lg bg-black px-3 py-2 text-[11px] font-black uppercase text-white"
                  >
                    Editar evento
                  </button>
                </div>
              )}

              {addType !== "vacaciones" && (!editingEventId || isEditFormExpanded) && (
                <input
                  type="text"
                  placeholder="Título"
                  value={newEvent[activeTitleField] || ""}
                  onChange={(e) => setNewEvent((p) => ({ ...p, [activeTitleField]: e.target.value }))}
                  className="rounded-xl border border-gray-200 p-3 sm:col-span-2"
                />
              )}
              {(!editingEventId || isEditFormExpanded) && addType !== "vacaciones" && <p className="text-[11px] font-semibold text-gray-500 sm:col-span-2">Rellena el evento y luego asigna equipo, noches y coordinadores.</p>}

              {(!editingEventId || isEditFormExpanded) && (addType === "vacaciones" ? (
                <>
                  <input type="date" value={vacationStart} onChange={(e) => setVacationStart(e.target.value)} className="rounded-xl border border-gray-200 p-3" />
                  <input type="date" value={vacationEnd} onChange={(e) => setVacationEnd(e.target.value)} className="rounded-xl border border-gray-200 p-3" />
                  <select value={vacationWorkerId} onChange={(e) => setVacationWorkerId(e.target.value)} className="rounded-xl border border-gray-200 p-3 sm:col-span-2">
                    <option value="">Empleado vacaciones</option>
                    {workers.map((w) => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 sm:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase text-blue-700">Fecha o rango de fechas</p>
                      <button type="button" onClick={() => setRangoMontaje((v) => !v)} className="rounded bg-white px-2 py-1 text-[10px] font-black uppercase text-blue-600">
                        {rangoMontaje ? "Quitar rango" : "+ Rango"}
                      </button>
                    </div>
                    <div className={`grid gap-2 ${rangoMontaje ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                      <input type="date" value={newEvent[activeTypeDate.start] || ""} onChange={(e) => setNewEvent((p) => ({ ...p, [activeTypeDate.start]: e.target.value }))} className="rounded-xl border border-gray-200 p-3" />
                      {rangoMontaje && activeTypeDate.end ? <input type="date" value={newEvent[activeTypeDate.end] || ""} onChange={(e) => setNewEvent((p) => ({ ...p, [activeTypeDate.end]: e.target.value }))} className="rounded-xl border border-gray-200 p-3" /> : null}
                    </div>
                  </div>
                  <input type="text" placeholder="Lugar" value={newEvent.place} onChange={(e) => setNewEvent((p) => ({ ...p, place: e.target.value }))} className="rounded-xl border border-gray-200 p-3" />
                  <input type="text" placeholder="Vehículo" value={newEvent.setup_vehicle || ""} onChange={(e) => setNewEvent((p) => ({ ...p, setup_vehicle: e.target.value }))} className="rounded-xl border border-gray-200 p-3" />
                  <div className="rounded-xl border border-gray-200 p-3 sm:col-span-2">
                    <p className="mb-2 text-[11px] font-black uppercase text-gray-500">Equipo</p>
                    <div className="mb-2 flex gap-2">
                      <select value={teamSetupToAdd} onChange={(e) => setTeamSetupToAdd(e.target.value)} className="w-full rounded-lg border border-gray-200 p-2 text-[12px]">
                        <option value="">Seleccionar empleado</option>
                        {workers.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
                      </select>
                      <button type="button" onClick={() => {
                        if (!teamSetupToAdd) return;
                        const next = stringifyTeamMembers([...parseTeamMembers(newEvent[activeTeamField]), teamSetupToAdd]);
                        setNewEvent((p) => ({ ...p, [activeTeamField]: next }));
                        setTeamSetupToAdd("");
                      }} className="rounded-lg bg-blue-500 px-3 py-2 text-[11px] font-black uppercase text-white">Añadir</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {parseTeamMembers(newEvent[activeTeamField]).map((name) => (
                        <button key={`s-${name}`} type="button" onClick={() => {
                          const next = parseTeamMembers(newEvent[activeTeamField]).filter((n) => n !== name);
                          setNewEvent((p) => ({ ...p, [activeTeamField]: stringifyTeamMembers(next) }));
                        }} className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-800">{name} ×</button>
                      ))}
                    </div>
                  </div>
                  {addType === "evento" && (
                    <>
                      <select value={newEvent.coord_project_id} onChange={(e) => setNewEvent((p) => ({ ...p, coord_project_id: e.target.value }))} className="rounded-xl border border-gray-200 p-3">
                        <option value="">Coord. Proyecto</option>
                        {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                      <select value={newEvent.coord_prod_id} onChange={(e) => setNewEvent((p) => ({ ...p, coord_prod_id: e.target.value }))} className="rounded-xl border border-gray-200 p-3">
                        <option value="">Coord. Producción</option>
                        {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                      <select value={newEvent.coord_disenio_id} onChange={(e) => setNewEvent((p) => ({ ...p, coord_disenio_id: e.target.value }))} className="rounded-xl border border-gray-200 p-3 sm:col-span-2">
                        <option value="">Coord. Diseño</option>
                        {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </>
                  )}
                </>
              ))}
              {(!editingEventId || isEditFormExpanded) && (
                <>
                  <textarea
                    value={newEvent.notes || ""}
                    onChange={(e) => setNewEvent((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    className="rounded-xl border border-gray-200 p-3 text-xs sm:col-span-2"
                    placeholder="Notas"
                  />
                  {addType !== "vacaciones" && (
                    <div className="rounded-xl border border-gray-200 p-3 sm:col-span-2">
                      <p className="mb-2 text-[11px] font-black uppercase text-gray-500">Noches por empleado (con fecha)</p>
                      <input
                        type="date"
                        value={newEvent.night_date || ""}
                        onChange={(e) => setNewEvent((p) => ({ ...p, night_date: e.target.value }))}
                        className="mb-3 w-full rounded-lg border border-gray-200 p-2 text-[12px]"
                      />
                      <div className="mb-3 flex gap-2">
                        <select
                          value={employeeToAdd}
                          onChange={(e) => setEmployeeToAdd(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 p-2 text-[12px]"
                        >
                          <option value="">{nightCandidates.length ? "Seleccionar empleado del equipo" : "Primero añade equipo"}</option>
                          {nightCandidates.map((w) => (
                            <option key={w.id} value={String(w.id)}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!employeeToAdd) return;
                            setStaffNights((prev) => ({ ...prev, [employeeToAdd]: 0 }));
                            const employeeName = workerMap.get(String(employeeToAdd));
                            if (employeeName) {
                              setNewEvent((prev) => {
                                const nextTeam = stringifyTeamMembers([
                                  ...parseTeamMembers(prev[activeTeamField] || ""),
                                  employeeName,
                                ]);
                                return { ...prev, [activeTeamField]: nextTeam };
                              });
                            }
                            setEmployeeToAdd("");
                          }}
                          className="rounded-lg bg-amber-500 px-3 py-2 text-[11px] font-black uppercase text-white"
                        >
                          Añadir
                        </button>
                      </div>
                      <div className="space-y-2">
                        {assignedStaffRows.length > 0 ? (
                          assignedStaffRows.map((row) => (
                            <div key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                              <p className="truncate text-[12px] font-semibold">{row.name}</p>
                              <input
                                type="number"
                                min="0"
                                value={staffNights[row.id]}
                                onChange={(e) => setStaffNights((prev) => ({ ...prev, [row.id]: e.target.value }))}
                                className="w-20 rounded-md border border-amber-200 bg-white p-1 text-[12px]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setStaffNights((prev) => {
                                    const next = { ...prev };
                                    delete next[row.id];
                                    return next;
                                  })
                                }
                                className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase text-red-500"
                              >
                                Quitar
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-[12px] text-gray-500">No hay empleados asignados.</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleCreateEvent}
              disabled={isSaving}
              className="mt-4 w-full rounded-xl bg-black px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : editingEventId ? "Actualizar evento" : "Guardar evento"}
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
