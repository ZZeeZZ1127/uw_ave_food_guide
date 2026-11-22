// === Utility ===
function escapeHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
// === Region config ===
// Restaurants carry an optional `region` field: "ave" (default) or "bellevue"
var regionConfig = {
  ave: {
    city: "Seattle, WA",
    center: [47.663, -122.313],
    zoom: 16,
    docTitle: "UW Ave 美食攻略 · 华盛顿大学美食地图",
  },
  bellevue: {
    city: "Bellevue, WA",
    center: [47.6101, -122.2015],
    zoom: 13,
    docTitle: "Bellevue 美食攻略 · 华盛顿大学美食地图",
  },
};
var currentRegion = "ave";
var currentFilter = "all";
var regionCounts = {};

function regionOf(r) {
  return r && r.region && regionConfig[r.region] ? r.region : "ave";
}
function regionFromHash() {
  var h = (location.hash || "").replace(/^#/, "").toLowerCase();
  return regionConfig[h] ? h : "ave";
}
function regionRestaurants() {
  return restaurants.filter(function (r) {
    return regionOf(r) === currentRegion;
  });
}

function buildNavLink(lat, lng, label, dataAddr, region) {
  var city = regionConfig[region || currentRegion].city;
  var query = dataAddr || label + " " + city.replace(",", "");
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(query)
  );
}

// === Category config ===
var categoryColors = {
  chinese: "#c0392b",
  japanese: "#2c3e50",
  korean: "#8e44ad",
  southeast: "#16a085",
  fastfood: "#e67e22",
  dessert: "#e91e63",
  hotpot: "#d35400",
  western: "#5d4037",
};
var categoryEmoji = {
  chinese: "🥢",
  japanese: "🍣",
  korean: "🇰🇷",
  southeast: "🍜",
  fastfood: "🍔",
  dessert: "🍰",
  hotpot: "🍲",
  western: "🍽️",
};

// === Card renderer ===
// Generates one card's HTML from a restaurant data object
function renderCard(r) {
  var classes = "card";
  if (r.visited) classes += " visited";

  // Badges
  var badgeHTML = "";
  r.tags.forEach(function (t) {
    badgeHTML += '<span class="badge cat">' + escapeHTML(t) + "</span>\n";
  });
  badgeHTML += '<span class="badge price">' + escapeHTML(r.price) + "</span>\n";
  if (r.visited) {
    badgeHTML += '<span class="badge visited-badge">✅ 已探</span>\n';
  }
  (r.badges || []).forEach(function (b) {
    // Determine badge class based on emoji prefix
    var cls = "badge";
    if (b.startsWith("🔥")) cls += " hot";
    else if (b.startsWith("🆕")) cls += " new-badge";
    else if (b.startsWith("🍬")) cls += " sweet-badge";
    else if (b.startsWith("⚠️")) cls += " warn-badge";
    badgeHTML += '<span class="' + cls + '">' + escapeHTML(b) + "</span>\n";
  });

  // Dishes
  var dishHTML = "";
  r.dishes.forEach(function (d) {
    dishHTML += "<li>";
    dishHTML += '<span class="dish-name">' + escapeHTML(d.name) + "</span>";
    if (d.note) {
      dishHTML +=
        '<span class="dish-price">' + escapeHTML(d.note) + "</span>";
    }
    dishHTML += "</li>\n";
  });

  // Notes
  var noteHTML = "";
  (r.notes || []).forEach(function (n) {
    var cls = n.type === "caution" ? "note caution" : "note";
    noteHTML +=
      '<div class="' + cls + '">' + escapeHTML(n.text) + "</div>\n";
  });

  // Address attribute
  var addrAttr = r.dataAddr
    ? ' data-addr="' + escapeHTML(r.dataAddr) + '"'
    : "";

  return (
    '<div class="' +
    classes +
    '" data-category="' +
    r.category +
    '" data-region="' +
    regionOf(r) +
    '" data-lat="' +
    r.lat +
    '" data-lng="' +
    r.lng +
    '" data-name="' +
    escapeHTML(r.name + (r.nameEn ? " " + r.nameEn : "")) +
    '">\n' +
    '  <div class="card-body">\n' +
    '    <div class="card-header">\n' +
    "      <div>\n" +
    '        <h3>' +
    escapeHTML(r.name) +
    (r.nameEn
      ? ' <span class="name-en">' + escapeHTML(r.nameEn) + "</span>"
      : "") +
    "</h3>\n" +
    '        <div class="address"' +
    addrAttr +
    ">📍 " +
    escapeHTML(r.address) +
    "</div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    '    <div class="badge-row">\n' +
    "      " +
    badgeHTML +
    "\n" +
    "    </div>\n" +
    (r.dishes.length
      ? '    <ul class="dish-list">\n      ' + dishHTML + "    </ul>\n"
      : "") +
    ((r.notes || []).length ? "    " + noteHTML : "") +
    "  </div>\n" +
    "</div>"
  );
}

// Populate all card grids by category (current region only)
function renderAllCards() {
  var inRegion = regionRestaurants();
  var grids = document.querySelectorAll(".card-grid[data-category]");
  grids.forEach(function (grid) {
    var cat = grid.dataset.category;
    var list = inRegion.filter(function (r) {
      return r.category === cat;
    });
    var html = "";
    list.forEach(function (r) {
      html += renderCard(r) + "\n";
    });
    grid.innerHTML = html;
  });
}

// === Map ===
// Map is created once; markers live in a layerGroup that is rebuilt per region
var foodMap = null;
var markerLayer = null;

function initFoodMap(elementId) {
  var cfg = regionConfig[currentRegion];
  foodMap = L.map(elementId, { zoomControl: true }).setView(
    cfg.center,
    cfg.zoom,
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(foodMap);

  markerLayer = L.layerGroup().addTo(foodMap);
  renderMarkers();
  return foodMap;
}

function renderMarkers() {
  if (!foodMap || !markerLayer) return;
  markerLayer.clearLayers();

  var bounds = [];
  regionRestaurants().forEach(function (r) {
    var color = categoryColors[r.category] || "#999";
    var emoji = categoryEmoji[r.category] || "";

    var icon = L.divIcon({
      className: "food-marker",
      html:
        '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:' +
        color +
        ";color:#fff;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid " +
        (r.visited ? "#2e7d32" : "#fff") +
        ';">' +
        emoji +
        "</div>",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    var catLabel = r.category
      ? r.category.charAt(0).toUpperCase() + r.category.slice(1)
      : "";

    var popup =
      "<b>" +
      escapeHTML(r.name + (r.nameEn ? " " + r.nameEn : "")) +
      "</b><br>" +
      '<span style="font-size:12px;color:#666;">' +
      catLabel +
      "</span>" +
      (r.visited
        ? ' <span style="color:#2e7d32;font-size:11px;">✅ 已探</span>'
        : "") +
      '<br><a href="' +
      buildNavLink(
        r.lat,
        r.lng,
        r.name + (r.nameEn ? " " + r.nameEn : ""),
        r.dataAddr,
        regionOf(r),
      ) +
      '" target="_blank" rel="noopener">🗺 导航到这里</a>';

    L.marker([r.lat, r.lng], { icon: icon })
      .addTo(markerLayer)
      .bindPopup(popup);
    bounds.push([r.lat, r.lng]);
  });

  if (bounds.length) {
    foodMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
  } else {
    var cfg = regionConfig[currentRegion];
    foodMap.setView(cfg.center, cfg.zoom);
  }
}

// === Address linkifier ===
// Converts .address div text into clickable Google Maps links
// Idempotent: safe to re-run after cards are re-rendered for a new region
function linkifyAddresses() {
  document.querySelectorAll(".address").forEach(function (el) {
    if (el.dataset.linked) return;
    el.dataset.linked = "1";
    var query;
    if (el.dataset.addr) {
      query = el.dataset.addr;
    } else {
      var card = el.closest(".card");
      var name = card ? card.dataset.name : "";
      var scope = el.closest("[data-region]");
      var region =
        scope && regionConfig[scope.dataset.region]
          ? scope.dataset.region
          : currentRegion;
      var txt = el.textContent.replace("📍", "").trim();
      query = name + ", " + txt + ", " + regionConfig[region].city;
    }
    var link = document.createElement("a");
    link.href =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(query);
    link.target = "_blank";
    link.rel = "noopener";
    link.title = "在 Google Maps 中打开";
    link.style.cssText =
      "color:inherit;text-decoration:underline;text-decoration-color:#4285f4;text-underline-offset:3px;text-decoration-thickness:1.5px;";
    link.innerHTML = el.innerHTML;
    el.innerHTML = "";
    el.style.cursor = "pointer";
    el.appendChild(link);
  });
}

// === Counts ===
// Header total + per-category section counts, computed from data for the current region
function updateCounts() {
  var inRegion = regionRestaurants();
  regionCounts = {};
  inRegion.forEach(function (r) {
    regionCounts[r.category] = (regionCounts[r.category] || 0) + 1;
  });

  var total = document.getElementById("restaurant-count");
  if (total) total.textContent = "🏪 " + inRegion.length + " 家餐厅收录";

  document
    .querySelectorAll(".section-title[data-category]")
    .forEach(function (title) {
      var count = title.querySelector(".count");
      if (count) {
        count.textContent = (regionCounts[title.dataset.category] || 0) + " 家";
      }
    });
}

// === View (region + category filter) ===
// Single source of visibility for region-scoped blocks and category sections
function applyView() {
  // Region-scoped static blocks (header text, tags, guides, placeholders).
  // Rendered cards also carry data-region but always match the current region.
  document.querySelectorAll("[data-region]").forEach(function (el) {
    el.style.display = el.dataset.region === currentRegion ? "" : "none";
  });

  var filter = currentFilter;
  function catVisible(cat) {
    return (filter === "all" || cat === filter) && (regionCounts[cat] || 0) > 0;
  }

  document
    .querySelectorAll(".section-title[data-category]")
    .forEach(function (title) {
      title.style.display = catVisible(title.dataset.category) ? "" : "none";
    });

  document
    .querySelectorAll(".section-intro[data-category]")
    .forEach(function (intro) {
      var regionOk =
        !intro.dataset.region || intro.dataset.region === currentRegion;
      intro.style.display =
        filter === "all" && regionOk && catVisible(intro.dataset.category)
          ? ""
          : "none";
    });

  document.querySelectorAll(".card[data-category]").forEach(function (card) {
    if (filter === "all" || card.dataset.category === filter) {
      card.classList.remove("hidden");
    } else {
      card.classList.add("hidden");
    }
  });

  var anyVisible = false;
  document
    .querySelectorAll(".card-grid[data-category]")
    .forEach(function (grid) {
      var show = catVisible(grid.dataset.category);
      grid.style.display = show ? "" : "none";
      if (show) anyVisible = true;
    });

  var empty = document.getElementById("empty-state");
  if (empty) {
    empty.style.display = anyVisible ? "none" : "";
    empty.textContent =
      filter === "all"
        ? "🚧 这个区域的餐厅还在整理中，敬请期待"
        : "🥲 这个区域暂时还没有收录该分类的餐厅，换个分类看看吧";
  }
}

// === Category filter ===
function initFilter() {
  var filterBtns = document.querySelectorAll(".filter-btn[data-filter]");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      applyView();
      scrollToResults();
    });
  });
}

// Filtering shortens the page, so the browser clamps the scroll position and
// (on phones especially) lands at the footer. If the user was already below
// the start of the results, bring the first visible section up to just under
// the sticky filter bar; if they were above it (e.g. looking at the map), stay put.
function scrollToResults() {
  var first = null;
  document
    .querySelectorAll(".section-title[data-category], #empty-state")
    .forEach(function (el) {
      if (!first && el.style.display !== "none") first = el;
    });
  if (!first) return;
  var bar = document.querySelector(".filter-bar");
  var barBottom = bar ? bar.getBoundingClientRect().bottom : 0;
  var target = first.getBoundingClientRect().top + window.scrollY - barBottom - 8;
  if (window.scrollY > target) window.scrollTo(0, Math.max(0, target));
}

// === Region switch ===
function applyRegion() {
  document.title = regionConfig[currentRegion].docTitle;
  document
    .querySelectorAll(".filter-btn[data-region-switch]")
    .forEach(function (btn) {
      btn.classList.toggle(
        "active",
        btn.dataset.regionSwitch === currentRegion,
      );
    });
  renderAllCards();
  updateCounts();
  renderMarkers();
  linkifyAddresses();
  applyView();
}

function setRegion(region) {
  if (!regionConfig[region] || region === currentRegion) return;
  currentRegion = region;
  applyRegion();
}

function initRegionSwitch() {
  document
    .querySelectorAll(".filter-btn[data-region-switch]")
    .forEach(function (btn) {
      btn.addEventListener("click", function () {
        // Hash is the source of truth: survives reload, works as a deep link
        location.hash = btn.dataset.regionSwitch;
        setRegion(btn.dataset.regionSwitch);
      });
    });
  window.addEventListener("hashchange", function () {
    setRegion(regionFromHash());
  });
}

// === Bootstrap ===
document.addEventListener("DOMContentLoaded", function () {
  currentRegion = regionFromHash();
  initFoodMap("map");
  initFilter();
  initRegionSwitch();
  applyRegion();
});
