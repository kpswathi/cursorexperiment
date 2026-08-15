/* AI Compass — static browser app. Reads window.AI_COMPASS. No npm. */
(function () {
  const DB = window.AI_COMPASS;
  if (!DB) {
    document.getElementById("view").innerHTML =
      '<div class="page"><p class="muted">Missing app/data.js. Run <code>python3 scripts/export_app.py</code>.</p></div>';
    return;
  }

  const CAP_LABELS = {
    reasoning: "Reasoning",
    coding: "Coding",
    vision: "Vision",
    audio: "Audio",
    video: "Video",
    imageGeneration: "Image gen",
    longContext: "Long context",
    agentSupport: "Agents",
  };
  const CAPS = Object.keys(CAP_LABELS);
  const REGION_LABELS = {
    "north-america": "North America",
    europe: "Europe",
    china: "China",
    india: "India",
    "middle-east": "Middle East",
    japan: "Japan",
    korea: "Korea",
    "southeast-asia": "Southeast Asia",
    "latin-america": "Latin America",
  };
  const PRIMARY_REGIONS = ["north-america", "europe", "china", "india"];
  const OPEN_CLOSED = { open: "Open", "open-weights": "Open weights", closed: "Closed" };

  const companies = DB.companies;
  const models = DB.models;
  const founders = DB.founders;
  const news = DB.news;
  const index = DB.index;
  const byId = (list) => Object.fromEntries(list.map((item) => [item.id, item]));
  const companyById = byId(companies);
  const modelById = byId(models);
  const founderById = byId(founders);
  const companyBySlug = Object.fromEntries(companies.map((c) => [c.slug, c]));
  const modelBySlug = Object.fromEntries(models.map((m) => [m.slug, m]));
  const founderBySlug = Object.fromEntries(founders.map((f) => [f.slug, f]));

  const compare = {
    ids: JSON.parse(sessionStorage.getItem("ai-compass-compare") || "[]"),
    save() {
      sessionStorage.setItem("ai-compass-compare", JSON.stringify(this.ids));
    },
    toggle(id) {
      if (this.ids.includes(id)) this.ids = this.ids.filter((x) => x !== id);
      else this.ids = this.ids.concat(id).slice(-4);
      this.save();
    },
    clear() {
      this.ids = [];
      this.save();
    },
  };

  const filters = {
    regionId: null,
    countryId: null,
    companyId: null,
    modelFamily: null,
    capability: null,
    openSource: false,
    closedSource: false,
    consumer: false,
    enterprise: false,
  };

  let map;
  let mapPopup;
  let selectedId = null;

  function usd(n) {
    if (n == null) return "—";
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (abs >= 1e12) return sign + "$" + (abs / 1e12).toFixed(1) + "T";
    if (abs >= 1e9) return sign + "$" + (abs / 1e9).toFixed(1) + "B";
    if (abs >= 1e6) return sign + "$" + (abs / 1e6).toFixed(1) + "M";
    return sign + "$" + abs;
  }
  function num(n) {
    return n == null ? "—" : Number(n).toLocaleString("en-US");
  }
  function date(v) {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function year(v) {
    return v ? v.slice(0, 4) : "—";
  }
  function ctx(n) {
    if (!n) return "—";
    if (n >= 1e6) return n / 1e6 + "M";
    if (n >= 1e3) return Math.round(n / 1e3) + "K";
    return String(n);
  }
  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function badge(text, tone) {
    return `<span class="badge ${tone || ""}">${esc(text)}</span>`;
  }
  function logo(src, alt, cls) {
    return `<img class="logo ${cls || ""}" src="${esc(src)}" alt="${esc(alt)}" />`;
  }
  function capsHtml(c) {
    return `<div class="cap-grid">${CAPS.map((name) => capBar(name, c[name] || 0)).join("")}</div>`;
  }
  function capBar(name, value) {
    const cells = Array.from({ length: 5 }, (_, i) => {
      const on = i < value ? (value >= 4 ? "on" : "mid") : "";
      return `<span class="${on}"></span>`;
    }).join("");
    return `<div class="cap"><div class="meta"><span>${CAP_LABELS[name]}</span><span>${value}/5</span></div><div class="bars">${cells}</div></div>`;
  }
  function timelineHtml(events) {
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    return `<ol class="timeline">${sorted
      .map(
        (e) =>
          `<li class="tl-item" data-event="${encodeURIComponent(JSON.stringify(e))}">
            <div class="muted" style="font-family:var(--mono);font-size:12px">${esc(date(e.date))} ${badge(e.type)}</div>
            <div>${esc(e.title)}</div>
            <div class="muted">${esc(e.description)}</div>
          </li>`,
      )
      .join("")}</ol>`;
  }

  function companyMatches(c) {
    if (filters.regionId && c.regionId !== filters.regionId) return false;
    if (filters.countryId && c.countryId !== filters.countryId) return false;
    if (filters.companyId && c.id !== filters.companyId) return false;
    if (filters.openSource && !c.openSource) return false;
    if (filters.closedSource && !c.closedSource) return false;
    if (filters.consumer && !c.consumer) return false;
    if (filters.enterprise && !c.enterprise) return false;
    if (filters.modelFamily) {
      const ok = models.some((m) => m.companyId === c.id && m.family === filters.modelFamily);
      if (!ok) return false;
    }
    if (filters.capability) {
      const latest = modelById[c.latestModelId];
      if (!latest || (latest.capabilities[filters.capability] || 0) < 3) return false;
    }
    return true;
  }

  function filterBar() {
    const families = Array.from(new Set(models.map((m) => m.family))).sort();
    const countries = (index.countries || []).filter((c) => c.companyCount > 0);
    const opt = (id, label, selected) =>
      `<option value="${esc(id)}" ${selected ? "selected" : ""}>${esc(label)}</option>`;
    return `<div class="filters">
      <select class="select" data-filter="regionId">
        <option value="">All regions</option>
        ${PRIMARY_REGIONS.map((id) => opt(id, REGION_LABELS[id], filters.regionId === id)).join("")}
        ${opt("middle-east", "Middle East", filters.regionId === "middle-east")}
      </select>
      <select class="select" data-filter="countryId">
        <option value="">All countries</option>
        ${countries.map((c) => opt(c.id, c.name, filters.countryId === c.id)).join("")}
      </select>
      <select class="select" data-filter="companyId">
        <option value="">All companies</option>
        ${companies.map((c) => opt(c.id, c.name, filters.companyId === c.id)).join("")}
      </select>
      <select class="select" data-filter="modelFamily">
        <option value="">Model family</option>
        ${families.map((f) => opt(f, f, filters.modelFamily === f)).join("")}
      </select>
      <select class="select" data-filter="capability">
        <option value="">Capability</option>
        ${CAPS.map((n) => opt(n, CAP_LABELS[n], filters.capability === n)).join("")}
      </select>
      ${[
        ["openSource", "Open"],
        ["closedSource", "Closed"],
        ["consumer", "Consumer"],
        ["enterprise", "Enterprise"],
      ]
        .map(
          ([k, label]) =>
            `<button type="button" class="toggle ${filters[k] ? "on" : ""}" data-toggle="${k}">${label}</button>`,
        )
        .join("")}
      <button type="button" class="toggle" data-reset>Reset</button>
    </div>`;
  }

  function bindFilters(root) {
    root.querySelectorAll("[data-filter]").forEach((el) => {
      el.addEventListener("change", () => {
        filters[el.getAttribute("data-filter")] = el.value || null;
        render();
      });
    });
    root.querySelectorAll("[data-toggle]").forEach((el) => {
      el.addEventListener("click", () => {
        const k = el.getAttribute("data-toggle");
        filters[k] = !filters[k];
        render();
      });
    });
    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      Object.assign(filters, {
        regionId: null,
        countryId: null,
        companyId: null,
        modelFamily: null,
        capability: null,
        openSource: false,
        closedSource: false,
        consumer: false,
        enterprise: false,
      });
      render();
    });
  }

  function parseRoute() {
    const hash = (location.hash || "#/").replace(/^#/, "");
    const [path] = hash.split("?");
    const parts = path.split("/").filter(Boolean);
    return { parts, path: "/" + parts.join("/") };
  }

  function destroyMap() {
    if (map) {
      map.remove();
      map = null;
      mapPopup = null;
    }
  }

  function activityColor(score) {
    if (score <= 0) return "#151b24";
    if (score < 20) return "#1c3340";
    if (score < 40) return "#1f4d52";
    if (score < 70) return "#1f6b62";
    return "#1f8f78";
  }

  function renderMap() {
    const visible = companies.filter(companyMatches);
    const view = document.getElementById("view");
    view.innerHTML = `
      <div class="map-wrap">
        <div id="map"></div>
        <div class="map-hud"><div class="inner">
          <div class="row" style="margin-bottom:8px">
            ${PRIMARY_REGIONS.map(
              (id) =>
                `<button class="toggle ${filters.regionId === id ? "on" : ""}" data-region="${id}">${REGION_LABELS[id]}</button>`,
            ).join("")}
            <span class="muted" style="margin-left:auto;font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase">${visible.length} companies in view</span>
          </div>
          ${filterBar()}
        </div></div>
        <div class="legend">AI activity <span class="swatch" style="background:#151b24"></span>Low <span class="swatch" style="background:#1f4d52"></span><span class="swatch" style="background:#1f8f78"></span>High</div>
        <div id="drawer"></div>
      </div>`;
    bindFilters(view);
    view.querySelectorAll("[data-region]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-region");
        filters.regionId = filters.regionId === id ? null : id;
        filters.countryId = null;
        render();
      });
    });

    if (!window.maplibregl) {
      document.getElementById("map").innerHTML =
        '<div class="page muted">Map library did not load (network required for OpenFreeMap tiles).</div>';
      return;
    }

    map = new maplibregl.Map({
      container: "map",
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [12, 22],
      zoom: 1.55,
      minZoom: 1.1,
      maxZoom: 8,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    mapPopup = new maplibregl.Popup({ closeButton: false, offset: 12 });

    map.on("load", () => {
      if (DB.geo) {
        map.addSource("countries", { type: "geojson", data: DB.geo });
        const expr = ["match", ["get", "iso_a2"]];
        (index.countries || []).forEach((c) => {
          expr.push(c.id, activityColor(c.activityScore || 0));
        });
        expr.push("#151b24");
        const firstSymbol = (map.getStyle().layers || []).find((l) => l.type === "symbol");
        map.addLayer(
          { id: "country-fill", type: "fill", source: "countries", paint: { "fill-color": expr, "fill-opacity": 0.78 } },
          firstSymbol && firstSymbol.id,
        );
        map.addLayer({
          id: "country-line",
          type: "line",
          source: "countries",
          paint: { "line-color": "#3a4658", "line-width": 0.6 },
        });
        map.on("click", "country-fill", (e) => {
          if (map.queryRenderedFeatures(e.point, { layers: ["unclustered", "clusters"] }).length) return;
          const iso = e.features && e.features[0] && e.features[0].properties.iso_a2;
          if (iso && iso !== "-99") {
            filters.countryId = filters.countryId === iso ? null : iso;
            render();
          }
        });
      }

      const fc = {
        type: "FeatureCollection",
        features: visible.map((c) => ({
          type: "Feature",
          properties: { id: c.id, name: c.name, color: c.color, city: c.countryId },
          geometry: { type: "Point", coordinates: [c.coordinates.lng, c.coordinates.lat] },
        })),
      };
      map.addSource("companies", { type: "geojson", data: fc, cluster: true, clusterMaxZoom: 5, clusterRadius: 46 });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "companies",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#3ee0c2",
          "circle-radius": ["step", ["get", "point_count"], 16, 4, 20, 8, 26],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#07090d",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "companies",
        filter: ["has", "point_count"],
        layout: { "text-field": ["to-string", ["get", "point_count"]], "text-size": 12 },
        paint: { "text-color": "#07090d" },
      });
      map.addLayer({
        id: "unclustered",
        type: "circle",
        source: "companies",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#07090d",
        },
      });

      map.on("click", "clusters", (e) => {
        const f = e.features[0];
        const source = map.getSource("companies");
        source.getClusterExpansionZoom(f.properties.cluster_id).then((zoom) => {
          map.easeTo({ center: f.geometry.coordinates, zoom });
        });
      });
      map.on("click", "unclustered", (e) => {
        selectedId = e.features[0].properties.id;
        filters.companyId = selectedId;
        renderDrawer();
        const c = companyById[selectedId];
        if (c) map.easeTo({ center: [c.coordinates.lng, c.coordinates.lat], zoom: Math.max(map.getZoom(), 4.6) });
      });
      map.on("mouseenter", "unclustered", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features[0];
        mapPopup
          .setLngLat(f.geometry.coordinates)
          .setHTML(`<strong>${esc(f.properties.name)}</strong>`)
          .addTo(map);
      });
      map.on("mouseleave", "unclustered", () => {
        map.getCanvas().style.cursor = "";
        mapPopup.remove();
      });
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      if (filters.regionId) {
        const region = (index.regions || []).find((r) => r.id === filters.regionId);
        if (region) map.easeTo({ center: [region.center.lng, region.center.lat], zoom: region.zoom, duration: 800 });
      }
      if (selectedId) renderDrawer();
    });
  }

  function renderDrawer() {
    const el = document.getElementById("drawer");
    if (!el) return;
    const c = companyById[selectedId];
    if (!c) {
      el.innerHTML = "";
      return;
    }
    const latest = modelById[c.latestModelId];
    const people = c.founderIds.map((id) => founderById[id]).filter(Boolean);
    const country = (index.countries || []).find((x) => x.id === c.countryId);
    el.innerHTML = `<aside class="drawer">
      <div class="drawer-body">
        <div class="entity" style="margin-bottom:12px">
          ${logo(c.logo, c.name)}
          <div><div style="font-size:18px">${esc(c.name)}</div><div class="muted">${esc(c.headquarters)} · ${esc(country && country.name)}</div></div>
        </div>
        <p class="muted">${esc(c.description)}</p>
        <div class="row" style="margin:10px 0">
          ${c.openSource ? badge("Open", "accent") : ""}
          ${c.closedSource ? badge("Closed") : ""}
          ${c.consumer ? badge("Consumer", "gold") : ""}
          ${c.enterprise ? badge("Enterprise") : ""}
        </div>
        <div class="grid-4">
          <div class="mini"><div class="lbl">Founded</div><div class="val">${esc(year(c.founded))}</div></div>
          <div class="mini"><div class="lbl">Employees</div><div class="val">${esc(num(c.employees))}</div></div>
          <div class="mini"><div class="lbl">Funding</div><div class="val">${esc(usd(c.totalFundingUsd))}</div></div>
          <div class="mini"><div class="lbl">Valuation</div><div class="val">${esc(usd(c.valuationUsd))}</div></div>
        </div>
        ${
          latest
            ? `<div class="cell" style="margin-top:12px"><div class="lbl muted">Latest frontier model</div><a class="linkish" href="#/models/${latest.slug}">${esc(latest.name)}</a><div style="margin-top:10px">${capsHtml(latest.capabilities)}</div></div>`
            : `<div class="empty" style="margin-top:12px">No public frontier model yet.</div>`
        }
        <div class="space"></div>
        <h2>Founders</h2>
        ${people.map((p) => `<a class="entity" href="#/founders/${p.slug}" style="margin-bottom:8px">${logo(p.photo, p.name, "sm round")}<span>${esc(p.name)}</span></a>`).join("")}
        <div class="space"></div>
        <h2>Timeline</h2>
        ${timelineHtml(c.timeline.slice().reverse().slice(0, 8).reverse())}
      </div>
      <div class="drawer-foot">
        <a class="btn accent grow" href="#/companies/${c.slug}">Full dossier</a>
        <button class="btn" data-compare="${c.id}">Compare</button>
        <a class="btn" href="${esc(c.website)}" target="_blank" rel="noreferrer">Web</a>
        <button class="btn" data-close>✕</button>
      </div>
    </aside>`;
    el.querySelector("[data-close]").addEventListener("click", () => {
      selectedId = null;
      filters.companyId = null;
      render();
    });
    el.querySelector("[data-compare]").addEventListener("click", () => {
      compare.toggle(c.id);
    });
    el.querySelectorAll(".tl-item").forEach((item) => item.addEventListener("click", onTimelineClick));
  }

  function renderCompanies() {
    const visible = companies.filter(companyMatches);
    return `<div class="page">
      <div class="row" style="justify-content:space-between;margin-bottom:16px">
        <div><h1>Companies</h1><p class="muted">Frontier labs in the current filter set.</p></div>
      </div>
      ${filterBar()}
      <div class="space"></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Company</th><th>HQ</th><th>Founded</th><th>People</th><th>Funding</th><th>Valuation</th><th>Latest model</th><th></th></tr></thead>
        <tbody>
          ${visible
            .map((c) => {
              const m = modelById[c.latestModelId];
              return `<tr>
                <td><a class="entity" href="#/companies/${c.slug}">${logo(c.logo, c.name, "sm")}<span>${esc(c.name)}</span></a></td>
                <td class="muted">${esc(c.headquarters)}</td>
                <td>${esc(year(c.founded))}</td>
                <td>${esc(num(c.employees))}</td>
                <td>${esc(usd(c.totalFundingUsd))}</td>
                <td>${esc(usd(c.valuationUsd))}</td>
                <td>${m ? `<a class="linkish" href="#/models/${m.slug}">${esc(m.name)}</a>` : "—"}</td>
                <td><button class="toggle" data-compare="${c.id}">${compare.ids.includes(c.id) ? "Added" : "Compare"}</button></td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table></div>
    </div>`;
  }

  function renderCompany(slug) {
    const c = companyBySlug[slug];
    if (!c) return `<div class="page muted">Company not found.</div>`;
    const people = c.founderIds.map((id) => founderById[id]).filter(Boolean);
    const ceo = founderById[c.ceoId];
    const companyModels = models.filter((m) => m.companyId === c.id).sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
    const latest = modelById[c.latestModelId];
    const rounds = (index.funding || []).filter((r) => r.companyId === c.id);
    const country = (index.countries || []).find((x) => x.id === c.countryId);
    const announcement = news.find((n) => n.id === c.latestNewsId);
    const areas = (index.researchAreas || []).filter((a) => c.researchAreaIds.includes(a.id));
    return `<div>
      <div class="page" style="background:var(--panel);border-bottom:1px solid var(--line)">
        <div class="row" style="justify-content:space-between">
          <div class="entity">
            ${logo(c.logo, c.name)}
            <div>
              <div class="kicker">Company dossier</div>
              <h1>${esc(c.name)}</h1>
              <p class="muted" style="max-width:720px">${esc(c.longDescription)}</p>
              <div class="row" style="margin-top:8px">
                ${badge(c.headquarters)} ${badge((country && country.name) || c.countryId)} ${badge(REGION_LABELS[c.regionId])}
                ${c.openSource ? badge("Open / open-weights", "accent") : ""}
                ${c.closedSource ? badge("Closed") : ""}
                ${c.consumer ? badge("Consumer", "gold") : ""}
                ${c.enterprise ? badge("Enterprise") : ""}
              </div>
            </div>
          </div>
          <div class="row">
            <button class="btn" data-compare="${c.id}">${compare.ids.includes(c.id) ? "In compare" : "Add to compare"}</button>
            <a class="btn accent" href="${esc(c.website)}" target="_blank" rel="noreferrer">Website</a>
          </div>
        </div>
      </div>
      <div class="page">
        <div class="grid-4">
          <div class="stat"><div class="lbl">Founded</div><div class="val">${esc(date(c.founded))}</div></div>
          <div class="stat"><div class="lbl">Employees</div><div class="val">${esc(num(c.employees))}</div><div class="muted">${esc(c.employeesAsOf || "")}</div></div>
          <div class="stat"><div class="lbl">Funding</div><div class="val">${esc(usd(c.totalFundingUsd))}</div></div>
          <div class="stat"><div class="lbl">Valuation</div><div class="val">${esc(usd(c.valuationUsd))}</div><div class="muted">${esc(c.valuationAsOf || "")}</div></div>
        </div>
        <div class="space"></div>
        <div class="grid-2">
          <div>
            <h2>Latest frontier model</h2>
            ${
              latest
                ? `<a class="card" href="#/models/${latest.slug}"><div style="font-size:18px">${esc(latest.name)}</div><div class="muted">${esc(date(latest.releaseDate))} · ${esc(latest.family)} · ${esc(latest.openClosed)}</div><div style="margin-top:12px">${capsHtml(latest.capabilities)}</div></a>`
                : `<div class="empty">No public model released.</div>`
            }
            <div class="space"></div>
            <h2>Model timeline</h2>
            ${companyModels.map((m) => `<a class="cell" href="#/models/${m.slug}" style="display:flex;justify-content:space-between;margin-bottom:8px"><span>${esc(m.name)}</span><span class="muted">${esc(date(m.releaseDate))}</span></a>`).join("") || `<div class="empty">Stealth — no public models.</div>`}
            <div class="space"></div>
            <h2>Company history</h2>
            ${timelineHtml(c.timeline)}
          </div>
          <div>
            <h2>Leadership</h2>
            ${
              ceo
                ? `<a class="card entity" href="#/founders/${ceo.slug}">${logo(ceo.photo, ceo.name, "round")}<div>CEO · ${esc(ceo.name)}<div class="muted">${esc(ceo.title || "")}</div></div></a>`
                : `<div class="empty">No named CEO in dataset.</div>`
            }
            <div class="space"></div>
            ${people.map((p) => `<a class="entity" href="#/founders/${p.slug}" style="margin-bottom:8px">${logo(p.photo, p.name, "sm round")}<span>${esc(p.name)}</span></a>`).join("")}
            <div class="space"></div>
            <h2>Investors</h2>
            <div class="row">${c.investors.map((n) => badge(n)).join("")}</div>
            ${rounds.map((r) => `<div class="cell" style="margin-top:8px"><div style="display:flex;justify-content:space-between"><span>${esc(r.round)}</span><span>${esc(usd(r.amountUsd))}</span></div><div class="muted">${esc(date(r.date))}${r.valuationUsd ? " · val " + usd(r.valuationUsd) : ""}</div></div>`).join("")}
            <div class="space"></div>
            <h2>Products</h2>
            ${["consumerProducts", "enterpriseProducts"]
              .map((k) =>
                c[k].length
                  ? `<div class="muted" style="margin:8px 0 6px">${k.startsWith("c") ? "Consumer" : "Enterprise"}</div>` +
                    c[k].map((p) => `<div class="cell" style="margin-bottom:8px"><div>${esc(p.name)}</div><div class="muted">${esc(p.description)}</div></div>`).join("")
                  : "",
              )
              .join("")}
            <div class="space"></div>
            <h2>Research areas</h2>
            <div class="row">${areas.map((a) => badge(a.name)).join("")}</div>
            <div class="space"></div>
            <h2>Latest announcement</h2>
            ${announcement ? `<a class="card" href="${esc(announcement.url)}" target="_blank">${esc(announcement.title)}<div class="muted">${esc(date(announcement.date))}</div></a>` : `<div class="empty">No linked announcement.</div>`}
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderModels() {
    const allowed = new Set(companies.filter(companyMatches).map((c) => c.id));
    const visible = models.filter((m) => {
      if (!allowed.has(m.companyId)) return false;
      if (filters.modelFamily && m.family !== filters.modelFamily) return false;
      if (filters.capability && (m.capabilities[filters.capability] || 0) < 3) return false;
      if (filters.openSource && m.openClosed === "closed") return false;
      if (filters.closedSource && m.openClosed !== "closed") return false;
      return true;
    });
    return `<div class="page">
      <h1>Models</h1><p class="muted">Foundation-model catalog, newest first.</p>
      <div class="space"></div>${filterBar()}<div class="space"></div>
      <div class="grid-cards">${visible
        .map((m) => {
          const c = companyById[m.companyId];
          return `<a class="card" href="#/models/${m.slug}">
            <div class="row" style="justify-content:space-between"><div><div style="font-size:18px">${esc(m.name)}</div><div class="muted">${esc(c && c.name)} · ${esc(m.family)}</div></div>${badge(OPEN_CLOSED[m.openClosed] || m.openClosed, m.openClosed === "closed" ? "" : "accent")}</div>
            <div class="muted" style="margin-top:8px;font-family:var(--mono);font-size:12px">${esc(date(m.releaseDate))}</div>
            <p class="muted">${esc(m.description)}</p>
          </a>`;
        })
        .join("")}</div>
    </div>`;
  }

  function renderModel(slug) {
    const m = modelBySlug[slug];
    if (!m) return `<div class="page muted">Model not found.</div>`;
    const c = companyById[m.companyId];
    const previous = modelById[m.previousModelId];
    const next = models.find((x) => x.previousModelId === m.id);
    const scores = (index.benchmarkScores || []).filter((s) => s.modelId === m.id);
    const family = models.filter((x) => x.companyId === m.companyId && x.family === m.family).sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
    return `<div>
      <div class="page" style="background:var(--panel);border-bottom:1px solid var(--line)">
        <div class="kicker">Model dossier</div>
        <h1>${esc(m.name)}</h1>
        <div class="muted">${c ? `<a class="linkish" href="#/companies/${c.slug}">${esc(c.name)}</a>` : ""} · ${esc(m.family)} · ${esc(date(m.releaseDate))}</div>
        <div class="row" style="margin-top:8px">${badge(OPEN_CLOSED[m.openClosed] || m.openClosed, m.openClosed === "closed" ? "" : "accent")} ${badge(m.apiAvailable ? "API available" : "No public API")}</div>
        <p class="muted" style="max-width:720px;margin-top:12px">${esc(m.description)}</p>
      </div>
      <div class="page">
        <div class="grid-4">
          <div class="stat"><div class="lbl">Release</div><div class="val">${esc(date(m.releaseDate))}</div></div>
          <div class="stat"><div class="lbl">Context</div><div class="val">${esc(ctx(m.contextWindow))}</div></div>
          <div class="stat"><div class="lbl">Family</div><div class="val">${esc(m.family)}</div></div>
        </div>
        <div class="space"></div>
        <div class="grid-2">
          <div>
            <h2>Capabilities</h2>${capsHtml(m.capabilities)}
            <div class="space"></div>
            <h2>What is new</h2>
            <div class="card">${esc(m.whatsNew)}</div>
            ${previous ? `<div class="muted" style="margin-top:8px">Previous: <a class="linkish" href="#/models/${previous.slug}">${esc(previous.name)}</a></div>` : ""}
            ${next ? `<div class="muted">Successor: <a class="linkish" href="#/models/${next.slug}">${esc(next.name)}</a></div>` : ""}
            <div class="space"></div>
            <h2>Family line</h2>
            ${family.map((x) => `<a class="cell" href="#/models/${x.slug}" style="display:flex;justify-content:space-between;margin-bottom:8px;${x.id === m.id ? "border-color:var(--accent)" : ""}"><span>${esc(x.name)}</span><span class="muted">${esc(date(x.releaseDate))}</span></a>`).join("")}
          </div>
          <div>
            <h2>Benchmark improvements</h2>
            ${
              scores.length
                ? scores
                    .map((s) => {
                      const b = (index.benchmarks || []).find((x) => x.id === s.benchmarkId);
                      const prior = previous && (index.benchmarkScores || []).find((x) => x.modelId === previous.id && x.benchmarkId === s.benchmarkId);
                      const delta = prior ? (s.score - prior.score).toFixed(1) : null;
                      return `<div class="cell" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between"><span>${esc(b && b.name)}</span><span>${s.score}${s.unit === "percent" ? "%" : ""}</span></div><div class="muted">${esc(b && b.category)}${delta != null ? " · " + (delta > 0 ? "+" : "") + delta + " vs " + previous.name : ""}</div></div>`;
                    })
                    .join("")
                : `<div class="empty">No benchmark rows recorded yet.</div>`
            }
            <div class="space"></div>
            <h2>Links</h2>
            ${m.announcementUrl ? `<a class="linkish" href="${esc(m.announcementUrl)}" target="_blank">Official announcement ↗</a><br>` : ""}
            ${m.paperUrl ? `<a class="linkish" href="${esc(m.paperUrl)}" target="_blank">Paper ↗</a><br>` : ""}
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderFounders() {
    return `<div class="page"><h1>Founders</h1><p class="muted">People who started or scientifically defined the labs in this graph.</p>
      <div class="space"></div>
      <div class="grid-cards">${founders
        .map((f) => {
          const labs = f.companyIds.map((id) => companyById[id] && companyById[id].name).filter(Boolean);
          return `<a class="card entity" href="#/founders/${f.slug}">${logo(f.photo, f.name, "round")}<div><div style="font-size:18px">${esc(f.name)}</div><div class="muted">${esc(f.title || "")}</div><div class="muted">${esc(labs.join(" · "))}</div></div></a>`;
        })
        .join("")}</div></div>`;
  }

  function renderFounder(slug) {
    const f = founderBySlug[slug];
    if (!f) return `<div class="page muted">Founder not found.</div>`;
    const labs = companies.filter((c) => f.companyIds.includes(c.id));
    return `<div>
      <div class="page" style="background:var(--panel);border-bottom:1px solid var(--line)">
        <div class="entity">${logo(f.photo, f.name, "round")}<div><div class="kicker">Founder dossier</div><h1>${esc(f.name)}</h1><p class="muted">${esc(f.title || "")}</p><p class="muted" style="max-width:720px">${esc(f.biography)}</p></div></div>
      </div>
      <div class="page grid-2">
        <div>
          <h2>Companies founded</h2>
          ${labs.map((c) => `<a class="card entity" href="#/companies/${c.slug}" style="margin-bottom:8px">${logo(c.logo, c.name)}<div>${esc(c.name)}<div class="muted">${esc(c.headquarters)}</div></div></a>`).join("")}
          <div class="space"></div>
          <h2>Previous companies</h2>
          ${f.previousCompanies.map((p) => `<div class="cell" style="margin-bottom:8px"><div>${esc(p.name)}</div><div class="muted">${esc(p.role)}${p.years ? " · " + p.years : ""}</div></div>`).join("")}
        </div>
        <div>
          <h2>Research contributions</h2>
          <div class="row">${f.researchContributions.map((x) => badge(x)).join("")}</div>
          <div class="space"></div>
          <h2>Timeline</h2>
          ${timelineHtml(f.timeline)}
        </div>
      </div>
    </div>`;
  }

  function renderCompare() {
    const selected = compare.ids.map((id) => companyById[id]).filter(Boolean);
    return `<div class="page">
      <div class="row" style="justify-content:space-between"><div><h1>Compare</h1><p class="muted">Up to four labs.</p></div><button class="toggle" data-clear-compare>Clear set</button></div>
      <div class="row" style="margin:12px 0">${companies
        .map((c) => `<button class="toggle ${compare.ids.includes(c.id) ? "on" : ""}" data-compare="${c.id}">${esc(c.name)}</button>`)
        .join("")}</div>
      ${
        selected.length < 2
          ? `<div class="empty">Select at least two companies.</div>`
          : `<div class="table-wrap"><table>
            <thead><tr><th>Field</th>${selected.map((c) => `<th><a class="entity" href="#/companies/${c.slug}">${logo(c.logo, c.name, "sm")}${esc(c.name)}</a></th>`).join("")}</tr></thead>
            <tbody>
              ${[
                ["Region", selected.map((c) => REGION_LABELS[c.regionId])],
                ["Founded", selected.map((c) => year(c.founded))],
                ["Employees", selected.map((c) => num(c.employees))],
                ["Funding", selected.map((c) => usd(c.totalFundingUsd))],
                ["Valuation", selected.map((c) => usd(c.valuationUsd))],
                ["Revenue", selected.map((c) => usd(c.revenueUsd))],
                ["Open vs closed", selected.map((c) => (c.openSource && c.closedSource ? "Mixed" : c.openSource ? "Open" : "Closed"))],
                ["Founders", selected.map((c) => String(c.founderIds.length))],
                ["Latest model", selected.map((c) => (modelById[c.latestModelId] && modelById[c.latestModelId].name) || "—")],
              ]
                .map((row) => `<tr><td class="muted">${row[0]}</td>${row[1].map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`)
                .join("")}
              <tr><td class="muted">Capabilities</td>${selected
                .map((c) => {
                  const m = modelById[c.latestModelId];
                  return `<td>${m ? CAPS.map((n) => capBar(n, m.capabilities[n] || 0)).join("") : "No public model"}</td>`;
                })
                .join("")}</tr>
            </tbody></table></div>`
      }
    </div>`;
  }

  function renderTimeline() {
    const rows = [];
    companies.forEach((c) => c.timeline.forEach((e) => rows.push({ ...e, companyId: c.id })));
    models.forEach((m) =>
      rows.push({
        id: "model-" + m.id,
        date: m.releaseDate,
        title: m.name,
        description: m.whatsNew,
        type: "model",
        companyId: m.companyId,
        url: m.announcementUrl,
      }),
    );
    (index.funding || []).forEach((r) =>
      rows.push({
        id: "fund-" + r.id,
        date: r.date,
        title: r.round + " · " + ((companyById[r.companyId] && companyById[r.companyId].name) || r.companyId),
        description: r.notes || (r.leadInvestors[0] ? "Led by " + r.leadInvestors.join(", ") : "Financing round"),
        type: "funding",
        companyId: r.companyId,
      }),
    );
    const seen = new Set();
    const events = rows
      .filter((e) => {
        const k = e.date + e.title;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    return `<div class="page"><h1>Timeline</h1><p class="muted">Merged founding, models, funding and launches. Click any node.</p><div class="space"></div><div style="max-width:720px">${timelineHtml(events)}</div></div>`;
  }

  function renderNews() {
    const items = [...news].sort((a, b) => b.date.localeCompare(a.date));
    return `<div class="page"><h1>News & launches</h1><p class="muted">Editorial seed items plus generated RSS / GitHub / Hugging Face entries.</p>
      ${items
        .map(
          (n) => `<article class="card" style="margin-bottom:10px">
            <div class="row">${badge(date(n.date))} ${badge(n.generated ? "generated" : "editorial", n.generated ? "" : "gold")} ${badge(n.source)}</div>
            <a href="${esc(n.url)}" target="_blank" style="display:block;font-size:18px;margin-top:8px">${esc(n.title)}</a>
            <p class="muted">${esc(n.summary)}</p>
            <div class="row">${(n.companyIds || [])
              .map((id) => companyById[id] && `<a class="linkish" href="#/companies/${companyById[id].slug}">${esc(companyById[id].name)}</a>`)
              .filter(Boolean)
              .join("")}</div>
          </article>`,
        )
        .join("")}</div>`;
  }

  function renderResearch() {
    const labs = index.researchLabs || [];
    const areas = index.researchAreas || [];
    return `<div class="page"><h1>Research</h1>
      <h2>Focus areas</h2>
      <div class="grid-cards">${areas.map((a) => `<div class="card"><div>${esc(a.name)}</div><div class="muted">${esc(a.description)}</div></div>`).join("")}</div>
      <div class="space"></div>
      <h2>Labs</h2>
      <div class="grid-cards">${labs
        .map((lab) => {
          const c = companyById[lab.companyId];
          return `<div class="card"><div style="font-size:18px">${esc(lab.name)}</div><div class="muted">${esc((lab.city ? lab.city + ", " : "") + lab.countryId)}</div><p class="muted">${esc(lab.description)}</p>${c ? `<a class="linkish" href="#/companies/${c.slug}">${esc(c.name)}</a>` : ""}</div>`;
        })
        .join("")}</div></div>`;
  }

  function renderCountry(id) {
    const country = (index.countries || []).find((c) => c.id.toLowerCase() === String(id).toLowerCase());
    if (!country) return `<div class="page muted">Country not found.</div>`;
    const local = companies.filter((c) => c.countryId === country.id);
    const localModels = models.filter((m) => local.some((c) => c.id === m.companyId));
    return `<div class="page">
      <div class="kicker">${esc(REGION_LABELS[country.regionId])}</div>
      <h1>${esc(country.name)}</h1>
      <p class="muted" style="max-width:720px">${esc(country.description)}</p>
      <div class="grid-4" style="margin-top:16px">
        <div class="stat"><div class="lbl">Companies</div><div class="val">${local.length}</div></div>
        <div class="stat"><div class="lbl">Models</div><div class="val">${localModels.length}</div></div>
        <div class="stat"><div class="lbl">Activity</div><div class="val">${country.activityScore}</div></div>
      </div>
      <div class="space"></div>
      <h2>Companies</h2>
      ${
        local.length
          ? `<div class="grid-cards">${local.map((c) => `<a class="card entity" href="#/companies/${c.slug}">${logo(c.logo, c.name)}<div>${esc(c.name)}<div class="muted">${esc(c.headquarters)}</div></div></a>`).join("")}</div>`
          : `<div class="empty">No companies seeded yet. Add JSON under data/companies/ with countryId ${esc(country.id)}.</div>`
      }
    </div>`;
  }

  function headerStats() {
    const valuation = companies.reduce((s, c) => s + (c.valuationUsd || 0), 0);
    document.getElementById("header-stats").innerHTML = `
      <div><div class="lbl">Companies</div><div class="val">${companies.length}</div></div>
      <div><div class="lbl">Models</div><div class="val">${models.length}</div></div>
      <div><div class="lbl">Tracked value</div><div class="val">${usd(valuation)}</div></div>`;
  }

  function setNav(active) {
    document.querySelectorAll(".rail nav a").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("data-nav") === active);
    });
  }

  function onTimelineClick(event) {
    const item = event.currentTarget;
    const raw = item.getAttribute("data-event");
    let ev;
    try {
      ev = JSON.parse(decodeURIComponent(raw));
    } catch {
      return;
    }
    const modal = document.getElementById("event-modal");
    document.getElementById("event-modal-body").innerHTML = `
      ${badge(ev.type)}
      <h1 style="margin-top:10px">${esc(ev.title)}</h1>
      <div class="muted">${esc(date(ev.date))}</div>
      <p>${esc(ev.description)}</p>
      ${ev.url ? `<a class="linkish" href="${esc(ev.url)}" target="_blank">Open source ↗</a>` : ""}
      <div class="space"></div>
      <button class="btn" id="close-event">Close</button>`;
    modal.classList.remove("hidden");
    document.getElementById("close-event").onclick = () => modal.classList.add("hidden");
  }

  function bindView(root) {
    bindFilters(root);
    root.querySelectorAll("[data-compare]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        compare.toggle(btn.getAttribute("data-compare"));
        render();
      });
    });
    root.querySelector("[data-clear-compare]")?.addEventListener("click", () => {
      compare.clear();
      render();
    });
    root.querySelectorAll(".tl-item").forEach((item) => {
      item.addEventListener("click", onTimelineClick);
    });
  }

  function render() {
    const { parts } = parseRoute();
    const view = document.getElementById("view");
    const page = parts[0] || "";
    if (page !== "") destroyMap();

    if (!page) {
      setNav("map");
      renderMap();
      return;
    }
    const html = {
      companies: parts[1] ? renderCompany(parts[1]) : renderCompanies(),
      models: parts[1] ? renderModel(parts[1]) : renderModels(),
      founders: parts[1] ? renderFounder(parts[1]) : renderFounders(),
      compare: renderCompare(),
      timeline: renderTimeline(),
      news: renderNews(),
      research: renderResearch(),
      countries: renderCountry(parts[1]),
    }[page] || renderCompanies();
    setNav(page);
    view.innerHTML = html;
    bindView(view);
  }

  function searchIndex() {
    const rows = [];
    companies.forEach((c) => {
      rows.push({ type: "company", title: c.name, subtitle: c.headquarters + " · " + c.countryId, href: "#/companies/" + c.slug });
      [...c.consumerProducts, ...c.enterpriseProducts].forEach((p) => {
        rows.push({ type: "product", title: p.name, subtitle: c.name + " · " + p.kind, href: "#/companies/" + c.slug });
      });
    });
    models.forEach((m) => {
      const c = companyById[m.companyId];
      rows.push({ type: "model", title: m.name, subtitle: (c && c.name) + " · " + m.family, href: "#/models/" + m.slug });
    });
    founders.forEach((f) => rows.push({ type: "founder", title: f.name, subtitle: f.title || "Founder", href: "#/founders/" + f.slug }));
    (index.countries || [])
      .filter((c) => c.enabled || c.companyCount > 0)
      .forEach((c) => rows.push({ type: "country", title: c.name, subtitle: c.companyCount + " companies", href: "#/countries/" + c.id.toLowerCase() }));
    return new Fuse(rows, { keys: ["title", "subtitle"], threshold: 0.38, ignoreLocation: true });
  }

  const fuse = searchIndex();
  const modal = document.getElementById("search-modal");
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  function openSearch() {
    modal.classList.remove("hidden");
    input.value = "";
    results.innerHTML = "";
    input.focus();
  }
  function closeSearch() {
    modal.classList.add("hidden");
  }
  document.getElementById("search-open").addEventListener("click", openSearch);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeSearch();
  });
  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (!q) {
      results.innerHTML = "";
      return;
    }
    results.innerHTML = fuse
      .search(q)
      .slice(0, 12)
      .map(
        (r) =>
          `<button class="search-hit" data-href="${esc(r.item.href)}"><div><div>${esc(r.item.title)}</div><div class="muted">${esc(r.item.subtitle)}</div></div><span class="hit-type">${esc(r.item.type)}</span></button>`,
      )
      .join("");
    results.querySelectorAll("[data-href]").forEach((btn) => {
      btn.addEventListener("click", () => {
        location.hash = btn.getAttribute("data-href").replace(/^#/, "#");
        closeSearch();
      });
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
      e.preventDefault();
      openSearch();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearch();
    }
    if (e.key === "Escape") {
      closeSearch();
      document.getElementById("event-modal").classList.add("hidden");
    }
  });
  document.getElementById("event-modal").addEventListener("click", (e) => {
    if (e.target.id === "event-modal") e.target.classList.add("hidden");
  });

  headerStats();
  window.addEventListener("hashchange", render);
  render();
})();
