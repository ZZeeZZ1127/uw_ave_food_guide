// === Utility ===
function escapeHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function buildNavLink(lat, lng, label, dataAddr) {
  var query = dataAddr || (label + " Seattle WA");
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
  breakfast: "#f39c12",
};
var categoryEmoji = {
  chinese: "🥢",
  japanese: "🍣",
  korean: "🇰🇷",
  southeast: "🍜",
  fastfood: "🍔",
  dessert: "🍰",
  breakfast: "🥐",
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

// Populate all card grids by category
function renderAllCards() {
  var grids = document.querySelectorAll(".card-grid[data-category]");
  grids.forEach(function (grid) {
    var cat = grid.dataset.category;
    var list = restaurants.filter(function (r) {
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
function initFoodMap(elementId) {
  var map = L.map(elementId, { zoomControl: true }).setView(
    [47.663, -122.313],
    16,
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  var bounds = [];
  restaurants.forEach(function (r) {
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
      buildNavLink(r.lat, r.lng, r.name + (r.nameEn ? " " + r.nameEn : ""), r.dataAddr) +
      '" target="_blank" rel="noopener">🗺 导航到这里</a>';

    L.marker([r.lat, r.lng], { icon: icon }).addTo(map).bindPopup(popup);
    bounds.push([r.lat, r.lng]);
  });

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
  }
  return map;
}

// === Address linkifier ===
// Converts .address div text into clickable Google Maps links
function linkifyAddresses() {
  document.querySelectorAll(".address").forEach(function (el) {
    var query;
    if (el.dataset.addr) {
      query = el.dataset.addr;
    } else {
      var card = el.closest(".card");
      var name = card ? card.dataset.name : "";
      var txt = el.textContent.replace("📍", "").trim();
      query = name + ", " + txt + ", Seattle, WA";
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

// === Category filter ===
function initFilter() {
  var filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      var filter = btn.dataset.filter;

      document
        .querySelectorAll(".section-title[data-category]")
        .forEach(function (title) {
          title.style.display =
            filter === "all" || title.dataset.category === filter ? "" : "none";
        });

      document.querySelectorAll(".section-intro").forEach(function (intro) {
        intro.style.display = filter === "all" ? "" : "none";
      });

      document
        .querySelectorAll(".card[data-category]")
        .forEach(function (card) {
          if (filter === "all" || card.dataset.category === filter) {
            card.classList.remove("hidden");
          } else {
            card.classList.add("hidden");
          }
        });

      document.querySelectorAll(".card-grid").forEach(function (grid) {
        var visible = grid.querySelectorAll(
          ".card[data-category]:not(.hidden)",
        );
        var noCatCards = grid.querySelectorAll(".card:not([data-category])");
        grid.style.display =
          visible.length === 0 && noCatCards.length === 0 ? "none" : "";
      });
    });
  });
}

// === Bootstrap ===
document.addEventListener("DOMContentLoaded", function () {
  renderAllCards();
  initFoodMap("map");
  linkifyAddresses();
  initFilter();
});
