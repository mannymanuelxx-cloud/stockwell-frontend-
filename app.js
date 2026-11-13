const API_ROOT = window.STOCKWELL_API_ROOT || (
    window.location.hostname.endsWith(".onrender.com")
        ? "https://stockwell-api-nlyi.onrender.com/api"
        : "../backend/api"
);
const API_PRODUCTS = `${API_ROOT}/products`;
const API_AUTH = `${API_ROOT}/auth`;
const app = document.querySelector("#app");
const { createApp, nextTick, ref } = Vue;
const renderedContent = ref("");
createApp({
    setup() {
        return { renderedContent };
    },
    template: '<div class="vue-app-content" v-html="renderedContent"></div>'
}).mount(app);
const modalRoot = document.querySelector("#modal-root");
const toastRegion = document.querySelector("#toast-region");
let products = [];
let searchTerm = "";
let apiStatus = "loading";
let apiMessage = "";
let authStatus = "checking";
let currentUser = null;
let businessRoute = "";
let businessStatus = "idle";
let businessData = [];
let onlineSalesData = [];
let businessProducts = [];
let businessParties = [];
let businessReport = null;
let businessError = "";
let reportDateRange = null;
let authMode = "login";
let publicIntegrationsConfig = null;
let turnstileToken = "";
let manualGcashDetails = null;
let turnstileWidgetId = null;
let turnstileScriptPromise = null;
let analyticsConsent = "";
let analyticsInitialized = false;
let googleAuthError = new URLSearchParams(window.location.search).get("auth_error") === "google"
    ? "Google sign-in could not be completed. Try again or use your Stockwell username and password."
    : "";
let csrfToken = "";
let shopProducts = [];
let shopDeliveryZones = [];
let checkoutDeliveryZoneId = "";
let deliveryQuoteLoading = false;
let deliveryZonesError = "";
let shopStatus = "idle";
let shopError = "";
let shopCart = {};
let shopSearch = "";
let shopCategory = "";
let shopSort = "relevance";
let customerProfile = null;
let customerProfileStatus = "idle";
let customerProfileError = "";
let customerOrders = [];
let customerOrdersStatus = "idle";
let customerOrderPollingTimer = null;
let customerOrderRefreshInProgress = false;
let customerOrderRefreshError = "";
let customerNotifications = [];
let customerNotificationsStatus = "idle";
let customerNotificationsError = "";
let customerNotificationsExpanded = false;
let customerReturns = [];
let customerReturnsStatus = "idle";
let managedUsers = [];
let managedRoles = {};
let userManagementStatus = "idle";
let userManagementError = "";
let pendingReturnRequests = [];
let previousPendingReturnIds = null;
let returnNotificationTimer = null;
let returnNotificationRefreshInProgress = false;
let returnNotificationError = "";
let pendingAdminOrderCount = 0;
let pendingAdminOrders = [];
let previousAdminOrderIds = null;
let previousAdminPaymentEventIds = null;
let unpaidAdminOrderCount = 0;
let outstandingAdminBalance = 0;
let adminNotificationTimer = null;
let adminNotificationRefreshInProgress = false;
let adminNotificationError = "";
let orderFilters = { search: "", status: "", start: "", end: "" };

const routeTitles = {
    dashboard: "Overview",
    shop: "Shop",
    "my-orders": "My orders",
    account: "My account",
    returns: "Returns",
    "delivery-settings": "Delivery settings",
    "reset-password": "Reset password",
    inventory: "Products",
    sales: "Sales",
    orders: "Orders",
    purchases: "Purchases",
    customers: "Customers",
    suppliers: "Suppliers",
    reports: "Reports",
    activity: "Activity history",
    users: "Users & access"
};

const iconPaths = {
    overview: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    products: '<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="2.5" cy="5" r=".5"/><circle cx="2.5" cy="12" r=".5"/><circle cx="2.5" cy="19" r=".5"/>',
    sales: '<path d="M4 17l6-6 4 4 6-8"/><path d="M14 7h6v6"/>',
    orders: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    purchases: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
    customers: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1z"/><path d="M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1"/>',
    suppliers: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01"/>',
    reports: '<path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/><path d="M15 7h4v4"/>',
    activity: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    units: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="6" height="7" rx="1"/><rect x="4" y="14" width="7" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    value: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.7-1-3-1-1.7 0-3 .9-3 2.2s1.2 2 3 2.3 3 1 3 2.3-1.3 2.2-3 2.2c-1.3 0-2.3-.4-3-1"/><path d="M12 6v12"/>',
    alert: '<path d="M10.3 4.3 2.7 18a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 4.3a2 2 0 0 0-3.4 0z"/><path d="M12 9v4m0 4h.01"/>',
    add: '<path d="M12 5v14M5 12h14"/>',
    view: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>',
    edit: '<path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z"/>',
    delete: '<path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
    adjust: '<path d="M4 7h10M4 17h16M14 4l3 3-3 3M10 14l-3 3 3 3"/>'
};

function icon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || ""}</svg>`;
}

function orderStatusLabel(status)
{
    return ({
        pending: "Awaiting confirmation",
        processing: "Being prepared",
        ready_to_ship: "Ready to ship",
        shipped: "Shipped",
        delivered: "Delivered",
        completed: "Completed",
        cancelled: "Cancelled"
    })[status] || String(status).replace(/_/g, " ");
}

function matchesOrderStatus(status, filter)
{
    if (!filter) return true;
    return filter === "fulfilled"
        ? ["delivered", "completed"].includes(status)
        : status === filter;
}

function renderMarkup(markup) {
    renderedContent.value = markup;
}

document.querySelectorAll("[data-icon]").forEach((element) => {
    element.innerHTML = icon(element.dataset.icon);
});

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function productIllustration(product) {
    const name = String(product.product_name || "").toLowerCase();
    const category = String(product.category || "").toLowerCase();
    const dark = "#3b3857";
    const accent = "#8b7cf6";
    let item;

    if (name.includes("laptop") && name.includes("backpack")) {
        item = `<path d="M225 116q0-24 24-24h142q24 0 24 24v151H225z" fill="${dark}"/><path d="M247 116q0-10 10-10h126q10 0 10 10v116H247z" fill="#dce8df"/><path d="M236 178h168v70H236z" fill="${accent}"/><path d="M265 95q0-38 55-38t55 38" fill="none" stroke="${dark}" stroke-width="15"/><path d="M274 192h93v36h-93z" fill="#dce8df"/><path d="M212 135q-20 45-6 101m220-101q20 45 6 101" fill="none" stroke="${dark}" stroke-width="10"/>`;
    } else if (name.includes("laptop cooling pad")) {
        item = `<path d="m170 231 280-20 29 31-284 25z" fill="${dark}"/><path d="m191 228 253-17 19 18-258 21z" fill="#dce8df"/><circle cx="321" cy="224" r="44" fill="${accent}"/><circle cx="321" cy="224" r="9" fill="#eaf0e8"/><path d="M321 186q-20 20 0 30 20-10 0-30m38 38q-27-5-29 17 20 12 29-17m-38 38q20-20 0-30-20 10 0 30m-38-38q27 5 29-17-20-12-29 17" fill="#dce8df"/>`;
    } else if (name.includes("laptop")) {
        item = `<path d="M225 82q0-14 14-14h162q14 0 14 14v130H225z" fill="${dark}"/><path d="M239 83h162v113H239z" fill="#dce8df"/><path d="M190 219h260l28 30q4 8-7 8H169q-11 0-7-8z" fill="${accent}"/><path d="M277 222h87l10 12h-107z" fill="#eaf0e8"/>`;
    } else if (name.includes("monitor 4k")) {
        item = `<rect x="177" y="65" width="286" height="174" rx="13" fill="${dark}"/><rect x="191" y="79" width="258" height="146" rx="5" fill="#dce8df"/><path d="M300 239v39h40v-39m-91 45h142" fill="none" stroke="${accent}" stroke-width="13" stroke-linecap="round"/><path d="M215 191q45-65 91-25t102-54v94H215z" fill="#8fb49a"/>`;
    } else if (name.includes("monitor stand")) {
        item = `<rect x="206" y="71" width="228" height="129" rx="10" fill="${dark}"/><rect x="220" y="85" width="200" height="100" rx="4" fill="#dce8df"/><path d="M302 200v55h36v-55m-98 59h160" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"/><path d="M262 224h115" stroke="#253b36" stroke-width="5"/>`;
    } else if (name.includes("keyboard")) {
        const keys = Array.from({ length: 42 }, (_, index) => {
            const x = 183 + (index % 7) * 40;
            const y = 116 + Math.floor(index / 7) * 25;
            return `<rect x="${x}" y="${y}" width="31" height="15" rx="3" fill="#dce8df"/>`;
        }).join("");
        item = `<rect x="155" y="91" width="330" height="175" rx="18" fill="${dark}"/>${keys}<rect x="252" y="238" width="134" height="13" rx="6" fill="${accent}"/>`;
    } else if (name.includes("mouse")) {
        item = `<path d="M320 65q-83 0-83 88v61q0 80 83 80t83-80v-61q0-88-83-88z" fill="${dark}"/><path d="M320 67v81m-82 5h164" fill="none" stroke="#dce8df" stroke-width="8"/><rect x="310" y="87" width="20" height="40" rx="10" fill="${accent}"/>`;
    } else if (name.includes("headphone") || name.includes("headset")) {
        item = `<path d="M207 182v-22q0-113 113-113t113 113v22" fill="none" stroke="${dark}" stroke-width="25" stroke-linecap="round"/><rect x="185" y="158" width="62" height="119" rx="24" fill="${accent}"/><rect x="393" y="158" width="62" height="119" rx="24" fill="${accent}"/><rect x="199" y="174" width="34" height="86" rx="16" fill="#dce8df"/><rect x="407" y="174" width="34" height="86" rx="16" fill="#dce8df"/>${name.includes("headset") ? `<path d="M421 258q-6 52-67 52h-20" fill="none" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><circle cx="326" cy="310" r="10" fill="${accent}"/>` : ""}`;
    } else if (name.includes("webcam")) {
        item = `<rect x="190" y="104" width="260" height="112" rx="54" fill="${dark}"/><circle cx="320" cy="160" r="39" fill="#dce8df"/><circle cx="320" cy="160" r="23" fill="${accent}"/><circle cx="320" cy="160" r="10" fill="#eaf0e8"/><path d="M282 219h76l20 56H262z" fill="${dark}"/><path d="M283 276h74" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>`;
    } else if (name.includes("speaker")) {
        item = `<rect x="237" y="47" width="166" height="266" rx="34" fill="${dark}"/><rect x="252" y="62" width="136" height="236" rx="25" fill="${accent}"/><circle cx="320" cy="142" r="43" fill="#dce8df"/><circle cx="320" cy="142" r="25" fill="${dark}"/><circle cx="320" cy="231" r="31" fill="#dce8df"/><circle cx="320" cy="231" r="16" fill="${dark}"/>`;
    } else if (name.includes("ssd")) {
        item = `<rect x="180" y="86" width="280" height="188" rx="24" fill="${dark}"/><rect x="196" y="102" width="248" height="156" rx="15" fill="${accent}"/><circle cx="222" cy="128" r="7" fill="#dce8df"/><circle cx="418" cy="232" r="7" fill="#dce8df"/><path d="M259 151h124v59H259z" fill="#dce8df"/><path d="M281 174h80" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`;
    } else if (name.includes("charger")) {
        item = `<rect x="237" y="75" width="166" height="188" rx="28" fill="${dark}"/><rect x="258" y="95" width="124" height="146" rx="18" fill="${accent}"/><path d="M277 75V47m86 28V47" stroke="${dark}" stroke-width="14" stroke-linecap="round"/><rect x="298" y="143" width="44" height="9" rx="4" fill="#dce8df"/><path d="M277 195h86" stroke="#dce8df" stroke-width="8" stroke-linecap="round"/>`;
    } else if (name.includes("hub") || name.includes("dock")) {
        item = `<path d="M165 131q0-24 24-24h262q24 0 24 24v98q0 24-24 24H189q-24 0-24-24z" fill="${dark}"/><path d="M182 145h276v70H182z" fill="${accent}"/><rect x="210" y="163" width="39" height="31" rx="5" fill="#dce8df"/><rect x="267" y="163" width="39" height="31" rx="5" fill="#dce8df"/><rect x="324" y="163" width="39" height="31" rx="5" fill="#dce8df"/><circle cx="401" cy="179" r="13" fill="#dce8df"/><path d="M189 255v20m247-20v20" stroke="${dark}" stroke-width="12" stroke-linecap="round"/>`;
    } else if (name.includes("cable") || name.includes("hdmi")) {
        item = `<path d="M208 109v47q0 42 43 42h134q47 0 47 43v18" fill="none" stroke="${dark}" stroke-width="20" stroke-linecap="round"/><path d="M208 109v47q0 42 43 42h134q47 0 47 43v18" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><rect x="181" y="68" width="55" height="59" rx="8" fill="${dark}"/><rect x="192" y="58" width="33" height="15" rx="4" fill="${accent}"/><rect x="407" y="241" width="53" height="47" rx="7" fill="${dark}"/><path d="M420 241v-13m27 13v-13" stroke="${accent}" stroke-width="7"/>`;
    } else if (name.includes("surge protector")) {
        item = `<rect x="141" y="126" width="358" height="112" rx="25" fill="${dark}"/><rect x="157" y="142" width="326" height="80" rx="16" fill="${accent}"/>${[197,247,297,347,397].map((x) => `<circle cx="${x}" cy="182" r="17" fill="#dce8df"/><path d="M${x - 6} 174v10m12-10v10" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`).join("")}<circle cx="450" cy="182" r="9" fill="#dce8df"/><path d="M141 182h-34m392 0h34" stroke="${dark}" stroke-width="13" stroke-linecap="round"/>`;
    } else if (name.includes("wifi")) {
        item = `<path d="M191 139h234q20 0 20 20v42q0 20-20 20H191q-20 0-20-20v-42q0-20 20-20z" fill="${dark}"/><path d="M196 151h218v58H196z" fill="${accent}"/><rect x="171" y="153" width="36" height="54" rx="5" fill="#dce8df"/><path d="M291 128q30-30 60 0m-47 15q17-17 34 0m-21 14q4-4 8 0" fill="none" stroke="#eaf0e8" stroke-width="7" stroke-linecap="round"/><circle cx="391" cy="180" r="6" fill="#dce8df"/>`;
    } else if (name.includes("flash drive")) {
        item = `<rect x="202" y="97" width="236" height="166" rx="23" fill="${dark}"/><path d="M353 97h61v-35h-61z" fill="${accent}"/><path d="M367 62V47m33 15V47" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><rect x="221" y="116" width="198" height="128" rx="14" fill="${accent}"/><circle cx="253" cy="148" r="8" fill="#dce8df"/><path d="M278 181h97" stroke="#dce8df" stroke-width="9" stroke-linecap="round"/>`;
    } else {
        item = `<rect x="218" y="86" width="204" height="188" rx="25" fill="${dark}"/><rect x="237" y="105" width="166" height="150" rx="17" fill="${accent}"/><circle cx="320" cy="180" r="45" fill="#dce8df"/><circle cx="320" cy="180" r="23" fill="${dark}"/>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f0edff"/><stop offset="1" stop-color="#f8f7fc"/></linearGradient></defs><rect width="640" height="360" fill="url(#bg)"/><circle cx="320" cy="170" r="128" fill="#fff" opacity=".55"/><ellipse cx="320" cy="298" rx="145" ry="15" fill="#3b3857" opacity=".10"/><g stroke="${dark}" stroke-linecap="round" stroke-linejoin="round">${item}</g></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function productImageMarkup(product, className) {
    const imageUrl = product.image_url ? resolveProductImageUrl(product.image_url) : productIllustration(product);
    return `<img class="${className}" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.product_name)}" loading="lazy">`;
}

function resolveProductImageUrl(imageUrl) {
    const match = typeof imageUrl === "string"
        ? imageUrl.match(/^\/(?:[A-Za-z0-9._-]+\/)*uploads\/products\/(product-\d{2}\.jpg|[a-f0-9]{32}\.jpg)$/i)
        : null;
    return match ? `${API_ROOT.replace(/\/api\/?$/, "")}/uploads/products/${match[1]}` : imageUrl;
}

function currentRoute() {
    const route = window.location.hash.replace(/^#\/?/, "").split("/")[0];
    return routeTitles[route] ? route : "dashboard";
}

function money(value) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}

function hasPermission(permission) {
    return Array.isArray(currentUser?.permissions) && currentUser.permissions.includes(permission);
}

function hasAnyPermission(permissions) {
    return permissions.some((permission) => hasPermission(permission));
}

function updateAdminOrderNotificationBadge() {
    const badge = document.querySelector("#orders-notification-count");
    if (!badge) return;
    badge.textContent = pendingAdminOrderCount > 99 ? "99+" : String(pendingAdminOrderCount);
    badge.hidden = pendingAdminOrderCount === 0;
    badge.title = adminNotificationError
        ? `Unable to refresh order notifications: ${adminNotificationError}`
        : `${pendingAdminOrderCount} pending customer order${pendingAdminOrderCount === 1 ? "" : "s"}`;
}

async function refreshAdminNotifications({ notifyNewOrders = true } = {}) {
    if (!hasPermission("orders.manage") || adminNotificationRefreshInProgress) return;
    adminNotificationRefreshInProgress = true;
    try {
        const result = await request(`${API_ROOT}/admin-notifications`);
        const data = result?.data;
        if (!data || !Array.isArray(data.pending_orders) || !Array.isArray(data.payment_updates)) throw new Error("The notifications API did not provide valid order and payment data.");
        const nextOrders = data.pending_orders;
        const pendingIds = new Set(nextOrders.map((order) => String(order.id)));
        const paymentUpdates = data.payment_updates;
        const paymentEventIds = new Set(paymentUpdates.map((update) => String(update.id)));
        const newOrders = previousAdminOrderIds === null
            ? []
            : nextOrders.filter((order) => !previousAdminOrderIds.has(String(order.id)));
        const newPaymentUpdates = previousAdminPaymentEventIds === null
            ? []
            : paymentUpdates.filter((update) => !previousAdminPaymentEventIds.has(String(update.id)));
        const countChanged = pendingAdminOrderCount !== Number(data.pending_order_count || 0)
            || unpaidAdminOrderCount !== Number(data.unpaid_orders || 0);
        pendingAdminOrders = nextOrders;
        previousAdminOrderIds = pendingIds;
        previousAdminPaymentEventIds = paymentEventIds;
        pendingAdminOrderCount = Number(data.pending_order_count) || 0;
        unpaidAdminOrderCount = Number(data.unpaid_orders) || 0;
        outstandingAdminBalance = Number(data.outstanding_balance) || 0;
        adminNotificationError = "";
        updateAdminOrderNotificationBadge();
        if (notifyNewOrders) {
            newOrders.slice(0, 3).forEach((order) => {
                showToast(`New customer order #${order.id} from ${order.customer_name || "a customer"}.`);
            });
            newPaymentUpdates.slice(0, 3).forEach((update) => {
                showToast(`Payment updated for Order #${update.entity_id}${update.details ? `: ${update.details}` : ""}.`);
            });
        }
        if (currentRoute() === "dashboard" && countChanged && apiStatus === "ready") renderDashboard();
        if (currentRoute() === "orders" && newOrders.length) loadBusiness("orders");
    } catch (error) {
        if (error.status === 401) {
            if (adminNotificationTimer !== null) window.clearInterval(adminNotificationTimer);
            adminNotificationTimer = null;
            pendingAdminOrderCount = 0;
            pendingAdminOrders = [];
            previousAdminOrderIds = null;
            previousAdminPaymentEventIds = null;
            updateAdminOrderNotificationBadge();
            return;
        }
        const message = error.message || "Unknown error";
        const shouldReport = adminNotificationError !== message;
        adminNotificationError = message;
        updateAdminOrderNotificationBadge();
        if (shouldReport) showToast(`Could not refresh order notifications: ${message}`, true);
    } finally {
        adminNotificationRefreshInProgress = false;
    }
}

function startAdminNotificationPolling() {
    if (!hasPermission("orders.manage")) {
        if (adminNotificationTimer !== null) window.clearInterval(adminNotificationTimer);
        adminNotificationTimer = null;
        pendingAdminOrderCount = 0;
        pendingAdminOrders = [];
        previousAdminOrderIds = null;
        previousAdminPaymentEventIds = null;
        unpaidAdminOrderCount = 0;
        outstandingAdminBalance = 0;
        updateAdminOrderNotificationBadge();
        return;
    }
    if (adminNotificationTimer !== null) return;
    refreshAdminNotifications({ notifyNewOrders: false });
    adminNotificationTimer = window.setInterval(() => refreshAdminNotifications(), 30000);
}

function updateReturnNotificationBadge() {
    const badge = document.querySelector("#returns-notification-count");
    if (!badge) return;
    const count = pendingReturnRequests.length;
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.hidden = count === 0;
    badge.title = returnNotificationError
        ? `Unable to refresh return notifications: ${returnNotificationError}`
        : `${count} pending return request${count === 1 ? "" : "s"}`;
}

function updateLowStockNotificationBadge() {
    const badge = document.querySelector("#low-stock-notification-count");
    if (!badge) return;
    const count = hasPermission("inventory.manage")
        ? products.filter((product) => Number(product.quantity) <= productReorderLevel(product)).length
        : 0;
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.hidden = count === 0;
    badge.title = `${count} product${count === 1 ? "" : "s"} at or below reorder level`;
}

async function refreshReturnNotifications({ notifyNewRequests = true } = {}) {
    if (!hasPermission("orders.manage") || returnNotificationRefreshInProgress) return;
    returnNotificationRefreshInProgress = true;
    try {
        const result = await request(`${API_ROOT}/returns`);
        if (!Array.isArray(result?.data)) throw new Error("The returns API did not provide a valid request list.");
        const pending = result.data.filter((request) => request.status === "requested");
        const pendingIds = new Set(pending.map((request) => String(request.id)));
        const newRequests = previousPendingReturnIds === null
            ? []
            : pending.filter((request) => !previousPendingReturnIds.has(String(request.id)));
        const countChanged = pendingReturnRequests.length !== pending.length;
        pendingReturnRequests = pending;
        previousPendingReturnIds = pendingIds;
        returnNotificationError = "";
        updateReturnNotificationBadge();

        if (notifyNewRequests) {
            newRequests.forEach((request) => {
                showToast(`New return request from ${request.customer_name || "a customer"} for Order #${request.order_id}.`);
            });
        }
        if (currentRoute() === "dashboard" && countChanged && apiStatus === "ready") renderDashboard();
        if (currentRoute() === "returns" && newRequests.length) loadBusiness("returns");
    } catch (error) {
        if (error.status === 401) {
            if (returnNotificationTimer !== null) window.clearInterval(returnNotificationTimer);
            returnNotificationTimer = null;
            pendingReturnRequests = [];
            previousPendingReturnIds = null;
            updateReturnNotificationBadge();
            return;
        }
        const message = error.message || "Unknown error";
        const shouldReport = returnNotificationError !== message;
        returnNotificationError = message;
        updateReturnNotificationBadge();
        if (shouldReport) showToast(`Could not refresh return request notifications: ${message}`, true);
    } finally {
        returnNotificationRefreshInProgress = false;
    }
}

function startReturnNotificationPolling() {
    if (!hasPermission("orders.manage")) {
        if (returnNotificationTimer !== null) window.clearInterval(returnNotificationTimer);
        returnNotificationTimer = null;
        pendingReturnRequests = [];
        previousPendingReturnIds = null;
        updateReturnNotificationBadge();
        return;
    }
    if (returnNotificationTimer !== null) return;
    refreshReturnNotifications({ notifyNewRequests: false });
    returnNotificationTimer = window.setInterval(() => refreshReturnNotifications(), 30000);
}

function paymentMethodLabel(method, isOrder = false) {
    return ({
        cash: isOrder ? "Cash on delivery (COD)" : "Cash",
        card: "Card",
        gcash: "GCash",
        bank_transfer: "Bank transfer",
        other: "Other"
    })[method] || "—";
}

function paymentStatusLabel(status) {
    return ({
        paid: "Paid in full",
        unpaid: "Unpaid",
        partial: "Legacy partial",
        refunded: "Refunded"
    })[status] || String(status || "").replace(/_/g, " ");
}

function stockStatus(quantity, reorderLevel = 5) {
    if (quantity < 1) return '<span class="badge out-stock">Out of stock</span>';
    if (quantity <= reorderLevel) return '<span class="badge low-stock">Low stock</span>';
    return '<span class="badge in-stock">In stock</span>';
}

function productReorderLevel(product) {
    return product.reorder_level === null || product.reorder_level === undefined
        ? 5
        : Math.max(0, Number(product.reorder_level) || 0);
}

function productRows(items) {
    if (!items.length) {
        return `<tr><td colspan="5"><div class="empty-state">
            <span class="empty-icon">${icon("products")}</span><strong>No products yet</strong>
            <p>Add your first product to start tracking inventory.</p>
        </div></td></tr>`;
    }

    return items.map((product) => {
        const initial = escapeHtml((product.product_name || "?").trim().charAt(0).toUpperCase());
        return `<tr>
            <td><div class="product-cell">${productImageMarkup(product, "admin-product-thumbnail")}
                <span><span class="product-name">${escapeHtml(product.product_name)}</span>
                <span class="product-description">${escapeHtml(product.description || "No description")}</span></span>
            </div></td>
            <td>${money(product.price)}</td>
            <td>${Number(product.quantity) || 0}</td>
            <td>${stockStatus(Number(product.quantity) || 0, productReorderLevel(product))}</td>
            <td><div class="row-actions">
                <button class="icon-button" type="button" data-view="${escapeHtml(product.id)}" aria-label="View ${escapeHtml(product.product_name)}">${icon("view")}</button>
                <button class="icon-button" type="button" data-edit="${escapeHtml(product.id)}" aria-label="Edit ${escapeHtml(product.product_name)}">${icon("edit")}</button>
                <button class="icon-button" type="button" data-adjust-stock="${escapeHtml(product.id)}" aria-label="Adjust stock for ${escapeHtml(product.product_name)}">${icon("adjust")}</button>
                <button class="icon-button delete" type="button" data-delete="${escapeHtml(product.id)}" aria-label="Delete ${escapeHtml(product.product_name)}">${icon("delete")}</button>
            </div></td>
        </tr>`;
    }).join("");
}

function recentProducts(limit = 5) {
    return [...products].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, limit);
}

function renderTable(items, compact = false) {
    const actionsHeading = compact ? "" : "<th>Actions</th>";
    const rows = compact
        ? items.length
            ? items.map((product) => `<tr>
                <td><div class="product-cell">${productImageMarkup(product, "admin-product-thumbnail")}
                    <span><span class="product-name">${escapeHtml(product.product_name)}</span>
                    <span class="product-description">${escapeHtml(product.description || "No description")}</span></span></div></td>
                <td>${money(product.price)}</td><td>${Number(product.quantity) || 0}</td>
                <td>${stockStatus(Number(product.quantity) || 0, productReorderLevel(product))}</td>
            </tr>`).join("")
            : `<tr><td colspan="4"><div class="empty-state"><span class="empty-icon">${icon("products")}</span>
                <strong>No inventory to show</strong><p>Products you add will appear here.</p></div></td></tr>`
        : productRows(items);

    return `<div class="table-wrap"><table>
        <thead><tr><th>Product</th><th>Unit price</th><th>Quantity</th><th>Status</th>${actionsHeading}</tr></thead>
        <tbody>${rows}</tbody>
    </table></div>`;
}

function pageHeading(title, subtitle, action = "") {
    return `<div class="page-heading"><div><p class="eyebrow">Stockwell</p>
        <h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`;
}

function renderDashboard() {
    if (!hasPermission("inventory.manage")) {
        const orderAlert = pendingAdminOrderCount || unpaidAdminOrderCount
            ? `<section class="return-notification-banner" role="status">
                <span class="attention-mark">${icon("orders")}</span>
                <div><h2>${pendingAdminOrderCount} pending order${pendingAdminOrderCount === 1 ? "" : "s"} · ${unpaidAdminOrderCount} payment${unpaidAdminOrderCount === 1 ? "" : "s"} to follow up</h2>
                    <p>Outstanding order balance: ${money(outstandingAdminBalance)}.</p></div>
                <a class="button secondary" href="#orders">Review orders <span aria-hidden="true">→</span></a>
            </section>` : "";
        const shortcuts = [
            ["sales.manage", "Sales"],
            ["orders.manage", "Orders"],
            ["purchases.manage", "Purchases"],
            ["customers.manage", "Customers"],
            ["suppliers.manage", "Suppliers"],
            ["reports.view", "Reports"]
        ].filter(([permission]) => hasPermission(permission))
            .map(([, title]) => `<a class="button secondary" href="#${title.toLowerCase()}">${escapeHtml(title)}</a>`).join("");
        renderMarkup(`${pageHeading("Operations overview", "Use the modules assigned to your staff account.")}${orderAlert}
            <section class="content-card"><h2>Quick access</h2><div class="page-actions">${shortcuts || '<p>No business modules have been assigned to this account.</p>'}</div></section>`);
        return;
    }
    const stockUnits = products.reduce((sum, product) => sum + (Number(product.quantity) || 0), 0);
    const stockValue = products.reduce((sum, product) => sum + (Number(product.price) || 0) * (Number(product.quantity) || 0), 0);
    const lowStock = products.filter((product) => Number(product.quantity) <= productReorderLevel(product));
    const inStock = products.filter((product) => Number(product.quantity) > productReorderLevel(product)).length;
    const maxQuantity = Math.max(1, ...products.map((product) => Number(product.quantity) || 0));
    const stockBars = [...products]
        .sort((a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0))
        .slice(0, 5)
        .map((product) => `<div class="stock-bar-row">
            <span class="stock-bar-name">${escapeHtml(product.product_name)}</span>
            <span class="stock-bar-track"><span style="width:${Math.max(4, (Number(product.quantity) / maxQuantity) * 100)}%"></span></span>
            <strong>${Number(product.quantity) || 0}</strong>
        </div>`).join("");

    renderMarkup(`
        <section class="welcome-row">
            <div>
                <p class="eyebrow">STOCKROOM <span>/</span> OVERVIEW</p>
                <h1>Stock, at a glance.</h1>
                <p class="subtitle">A clear view of what you carry and what needs attention.</p>
            </div>
            <a class="button dashboard-add" href="#inventory">${icon("add")}<span>Add a product</span></a>
        </section>

        ${pendingReturnRequests.length && hasPermission("orders.manage") ? `<section class="return-notification-banner" role="status">
            <span class="attention-mark">${icon("orders")}</span>
            <div><h2>${pendingReturnRequests.length} return request${pendingReturnRequests.length === 1 ? "" : "s"} need review</h2>
                <p>Customers are waiting for an update on their return request${pendingReturnRequests.length === 1 ? "" : "s"}.</p></div>
            <a class="button secondary" href="#returns">Review returns <span aria-hidden="true">→</span></a>
        </section>` : ""}
        ${(pendingAdminOrderCount || unpaidAdminOrderCount) && hasPermission("orders.manage") ? `<section class="return-notification-banner" role="status">
            <span class="attention-mark">${icon("orders")}</span>
            <div><h2>${pendingAdminOrderCount} pending order${pendingAdminOrderCount === 1 ? "" : "s"} · ${unpaidAdminOrderCount} unpaid order${unpaidAdminOrderCount === 1 ? "" : "s"}</h2>
                <p>Outstanding order balance: ${money(outstandingAdminBalance)}.</p></div>
            <a class="button secondary" href="#orders">Review orders <span aria-hidden="true">→</span></a>
        </section>` : ""}

        <section class="stockroom-hero" aria-label="Live inventory summary">
            <div class="hero-copy">
                <span class="hero-kicker">STOCKWELL <span>·</span> INVENTORY</span>
                <h2>Your stock,<br>in good order.</h2>
                <p>Keep your product list and on-hand quantities in one place.</p>
                <a class="hero-link" href="#inventory">Open product list <span>↗</span></a>
            </div>
            <div class="hero-divider" aria-hidden="true"></div>
            <div class="hero-number">
                <span>UNITS ON HAND</span>
                <strong>${stockUnits.toLocaleString()}</strong>
                <small>across ${products.length} products</small>
            </div>
            <div class="hero-bars" aria-label="Units on hand by product">
                <div class="hero-bars-label">QUANTITY BY PRODUCT</div>
                ${stockBars || '<p class="hero-no-products">Add products to see stock levels.</p>'}
            </div>
        </section>

        <section class="metric-strip" aria-label="Inventory figures">
            <div class="metric-item"><span>Catalog</span><strong>${products.length}<small> products</small></strong></div>
            <div class="metric-item metric-inventory-value"><span>Stock value</span><strong>${money(stockValue)}</strong></div>
            <div class="metric-item ${lowStock.length ? "metric-warning" : ""}"><span>Needs attention</span><strong>${lowStock.length}<small> products</small></strong></div>
            <div class="metric-item"><span>Healthy stock</span><strong>${inStock}<small> products</small></strong></div>
        </section>

        <section class="catalog-section">
            <div class="catalog-heading">
                <div><p class="eyebrow">THE CATALOG</p><h2>Products on hand</h2></div>
                <a class="text-link" href="#inventory">View all products <span>→</span></a>
            </div>
            <div class="content-card catalog-card">${renderTable(recentProducts(), true)}</div>
        </section>

        <section class="attention-section" role="status" aria-live="polite">
            <div class="attention-heading">
                <span class="attention-mark">${icon(lowStock.length ? "alert" : "products")}</span>
                <div><h2>${lowStock.length ? "A quick stock check" : "Stock looks good"}</h2>
                    <p>${lowStock.length ? `${lowStock.length} product${lowStock.length === 1 ? "" : "s"} at or below their reorder level.` : "No products are below the low-stock threshold."}</p></div>
            </div>
            <div class="low-stock-actions">${lowStock.length ? `<a class="text-link" href="#inventory">Review products <span>→</span></a>` : '<span class="clear-label">UP TO DATE</span>'}</div>
            ${lowStock.length ? `<div class="table-wrap"><table><thead><tr><th>Product</th><th>On hand</th><th>Reorder level</th><th>Suggested reorder (to 2× level)</th></tr></thead><tbody>
                ${lowStock.map((product) => {
                    const quantity = Number(product.quantity) || 0;
                    const level = productReorderLevel(product);
                    return `<tr><td><strong>${escapeHtml(product.product_name)}</strong></td><td>${quantity}</td><td>${level}</td><td>${Math.max(1, level * 2 - quantity)} units</td></tr>`;
                }).join("")}
            </tbody></table></div>` : ""}
        </section>`);
}

function renderInventory() {
    const filtered = products.filter((product) => {
        const query = searchTerm.toLowerCase();
        return [product.product_name, product.description, product.category, product.sku, product.barcode].some((value) => String(value || "").toLowerCase().includes(query));
    });
    const action = `<div class="page-actions"><button class="button secondary" type="button" data-stock-history>Stock history</button><button class="button secondary" type="button" data-export-current>Export CSV</button><button class="button" type="button" data-add-product>${icon("add")}<span>Add product</span></button></div>`;

    renderMarkup(`${pageHeading("Products", "Manage product details, pricing, and stock levels.", action)}
        <section class="content-card">
            <div class="toolbar"><input class="search-field" type="search" id="product-search" placeholder="Search or scan barcode..." value="${escapeHtml(searchTerm)}" aria-label="Search products or scan a barcode">
                <span class="result-count">${filtered.length} of ${products.length} products</span></div>
            ${renderTable(filtered)}
        </section>`);

    nextTick(() => {
        const search = app.querySelector("#product-search");
        if (!search) return;
        search.addEventListener("input", (event) => {
            searchTerm = event.target.value;
            renderInventory();
            nextTick(() => {
                const updatedSearch = app.querySelector("#product-search");
                if (!updatedSearch) return;
                updatedSearch.focus();
                updatedSearch.setSelectionRange(updatedSearch.value.length, updatedSearch.value.length);
            });
        });
    });
}

function businessPageHeading(route, action = "") {
    const descriptions = {
        sales: "Record manual sales and review delivered customer orders with their payment status.",
        orders: "Track fulfillment progress, payments, and reserved stock for customer orders.",
        returns: "Review return requests, receive returned items into stock, and record refunds.",
        purchases: "Track supplier purchases and add stock when deliveries are received.",
        customers: "Keep customer contact details and order history organized.",
        suppliers: "Manage supplier details and connect purchases to their source.",
        reports: "Review sales, purchasing, and current inventory performance.",
        activity: "Review important changes made by administrators and staff.",
        "delivery-settings": "Manage nationwide delivery areas, editable estimate fees, and free-delivery offers."
    };
    return pageHeading(routeTitles[route], descriptions[route], action);
}

function loadBusiness(route, params = "") {
    if (businessRoute === route && businessStatus === "loading") return;
    businessRoute = route;
    businessStatus = "loading";
    businessError = "";
    businessReport = null;
    renderBusinessPage(route);
    const url = route === "reports" ? `${API_ROOT}/reports${params}`
        : route === "delivery-settings" ? `${API_ROOT}/delivery-zones`
            : `${API_ROOT}/${route}`;
    request(url).then((result) => {
        if (businessRoute !== route) return;
        businessData = result.data || [];
        onlineSalesData = route === "sales" ? result.online_sales || [] : [];
        businessProducts = result.products || [];
        businessParties = result.parties || [];
        businessReport = route === "reports" ? result.data : null;
        businessStatus = "ready";
        renderBusinessPage(route);
    }).catch((error) => {
        if (businessRoute !== route) return;
        onlineSalesData = [];
        businessStatus = "error";
        businessError = error.message;
        renderBusinessPage(route);
    });
}

function contactRows(route) {
    const isCustomer = route === "customers";
    if (!businessData.length) return `<tr><td colspan="${isCustomer ? 6 : 4}"><div class="empty-state"><strong>No ${route} added yet</strong><p>Add a record to get started.</p></div></td></tr>`;
    return businessData.map((record) => `<tr>
        <td><strong>${escapeHtml(record.name)}</strong></td>
        <td>${escapeHtml(record.email || "—")}</td>
        ${isCustomer ? `<td>${escapeHtml(record.phone || "—")}</td>` : ""}
        <td>${escapeHtml(record.address || "—")}</td>
        ${isCustomer ? `<td>${Number(record.order_count) || 0}${record.last_order_at ? `<small class="product-description">Last: ${escapeHtml(record.last_order_at)}</small>` : ""}</td>` : ""}
        <td><div class="row-actions">
            <button class="icon-button" type="button" data-edit-contact="${record.id}" aria-label="Edit ${escapeHtml(record.name)}">${icon("edit")}</button>
            <button class="icon-button delete" type="button" data-delete-contact="${record.id}" aria-label="Delete ${escapeHtml(record.name)}">${icon("delete")}</button>
        </div></td></tr>`).join("");
}

function documentRows(route) {
    const sales = route === "sales";
    const order = route === "orders";
    let records = businessData;
    if (order) {
        const query = orderFilters.search.trim().toLowerCase();
        records = records.filter((record) => {
            const date = String(record.created_at || "").slice(0, 10);
            return (!query || [record.id, record.party_name, record.delivery_address].some((value) => String(value || "").toLowerCase().includes(query)))
                && matchesOrderStatus(record.status, orderFilters.status)
                && (!orderFilters.start || date >= orderFilters.start)
                && (!orderFilters.end || date <= orderFilters.end);
        });
    }
    if (!records.length) return `<tr><td colspan="${sales ? 8 : order ? 8 : 6}"><div class="empty-state"><strong>${businessData.length ? "No matching records" : `No ${route} recorded yet`}</strong><p>${businessData.length ? "Adjust your search or filters." : "Create a record to see it listed here."}</p></div></td></tr>`;
    return records.map((record) => {
        const status = record.status || "completed";
        const statusText = order ? orderStatusLabel(status) : status;
        const action = route === "sales" && status === "completed"
            ? `<button class="button danger mini-button" type="button" data-status="${record.id}" data-next-status="refunded">Refund</button>`
            : route === "orders" && ({ pending: "processing", processing: "ready_to_ship", ready_to_ship: "shipped", shipped: "delivered", delivered: "completed" })[status]
            ? `<button class="button mini-button" type="button" data-status="${record.id}" data-next-status="${({ pending: "processing", processing: "ready_to_ship", ready_to_ship: "shipped", shipped: "delivered", delivered: "completed" })[status]}">${({ pending: "Start processing", processing: "Ready to ship", ready_to_ship: "Mark shipped", shipped: "Mark delivered", delivered: "Complete order" })[status]}</button>
                ${status !== "shipped" ? `<button class="button danger mini-button" type="button" data-status="${record.id}" data-next-status="cancelled">Cancel</button>` : ""}`
            : route === "purchases" && status === "pending"
                ? `<button class="button mini-button" type="button" data-status="${record.id}" data-next-status="received">Receive</button>
                    <button class="button danger mini-button" type="button" data-status="${record.id}" data-next-status="cancelled">Cancel</button>` : "";
        const editable = (route === "sales" && status === "completed") || status === "pending";
        const editButton = editable
            ? `<button class="icon-button" type="button" data-edit-document="${record.id}" aria-label="Edit record">${icon("edit")}</button>` : "";
        const canDelete = route !== "orders" || !["processing", "ready_to_ship", "shipped", "delivered", "completed"].includes(status);
        const deleteButton = canDelete
            ? `<button class="icon-button delete" type="button" data-delete-document="${record.id}" aria-label="Delete record">${icon("delete")}</button>` : "";
        const count = route === "purchases" ? Number(record.unit_count) || 0 : Number(record.item_count) || 0;
        const countLabel = route === "purchases" ? (count === 1 ? "unit" : "units") : (count === 1 ? "item" : "items");
        return `<tr>
            <td><strong>#${record.id}</strong>${sales ? `<div><button class="button secondary mini-button" type="button" data-print-sale="${record.id}">Print receipt</button></div>` : ""}</td>
            <td>${escapeHtml(record.party_name || "Walk-in")}</td>
            <td>${count} ${countLabel}</td>
            <td>${money(record.total)}</td>
            <td><span class="record-status order-status-label status-${escapeHtml(status)}">${escapeHtml(statusText)}</span></td>
            ${sales || order ? `            <td><span class="record-status status-${escapeHtml(record.payment_status || (sales ? "paid" : "unpaid"))}">${escapeHtml(paymentStatusLabel(record.payment_status || (sales ? "paid" : "unpaid")))}</span><small class="product-description">${money(record.amount_paid)} paid</small></td>
                <td>${paymentMethodLabel(record.payment_method, order)}</td>` : ""}
            <td><div class="row-actions"><button class="button secondary mini-button" type="button" data-view-document="${record.id}">View</button>${order ? `<button class="button secondary mini-button" type="button" data-edit-order-payment="${record.id}">Payment</button>` : ""}${editButton}${action}${deleteButton}</div></td>
        </tr>`;
    }).join("");
}

function renderContacts(route) {
    const isCustomer = route === "customers";
    const action = `<div class="page-actions"><button class="button secondary" type="button" data-export-current>Export CSV</button><button class="button" type="button" data-create-contact>${icon("add")}<span>Add ${route === "customers" ? "customer" : "supplier"}</span></button></div>`;
    renderMarkup(`${businessPageHeading(route, action)}
        <section class="content-card">
            <div class="module-toolbar"><span>${businessData.length} ${route}</span><span>Records are saved in the connected database.</span></div>
            <div class="table-wrap"><table><thead><tr><th>${isCustomer ? "Name" : "Company name"}</th><th>Email</th>${isCustomer ? "<th>Phone</th>" : ""}<th>Address</th>${isCustomer ? "<th>Order history</th>" : ""}<th>Actions</th></tr></thead>
            <tbody>${contactRows(route)}</tbody></table></div>
        </section>`);
}

function renderDocuments(route) {
    const action = `<div class="page-actions"><button class="button secondary" type="button" data-export-current>Export CSV</button><button class="button" type="button" data-create-document>${icon("add")}<span>${route === "sales" ? "Record a sale" : route === "orders" ? "New order" : "New purchase"}</span></button></div>`;
    const hint = route === "sales"
        ? "Recording a sale reduces stock immediately; payment tracking is separate from stock movements."
        : route === "orders" ? "Stock is deducted once when processing starts (online checkout already reserves it)." : "Receiving a pending purchase adds its items to stock.";
    const onlineSalesRows = onlineSalesData.length
        ? onlineSalesData.map((record) => `<tr><td><strong>Order #${Number(record.id)}</strong><div><button class="button secondary mini-button" type="button" data-print-online-sale="${record.id}">Print receipt</button></div></td><td>${escapeHtml(record.party_name)}</td><td>${escapeHtml(record.created_at)}</td>
            <td>${Number(record.item_count)} ${Number(record.item_count) === 1 ? "item" : "items"}</td><td>${money(record.total)}</td>
            <td><span class="record-status order-status-label status-${escapeHtml(record.status)}">${escapeHtml(orderStatusLabel(record.status))}</span></td>
            <td><span class="record-status status-${escapeHtml(record.payment_status || "unpaid")}">${escapeHtml(paymentStatusLabel(record.payment_status || "unpaid"))}</span><small class="product-description">${money(record.amount_paid)} received</small></td>
            <td>${paymentMethodLabel(record.payment_method, true)}</td></tr>`).join("")
        : '<tr><td colspan="8"><div class="empty-state"><strong>No delivered online orders yet</strong><p>Customer orders appear here after they are delivered or completed.</p></div></td></tr>';
    const onlineSalesSection = route === "sales"
        ? `<section class="content-card"><div class="module-toolbar">
            <strong>Delivered / completed online orders · ${onlineSalesData.length}</strong>
            <span>Shown separately from manual sales to avoid duplicate stock deductions. Payment updates remain in Orders.</span></div>
            <div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Fulfillment</th><th>Payment</th><th>Method</th></tr></thead>
            <tbody>${onlineSalesRows}</tbody></table></div></section>`
        : "";
    renderMarkup(`${businessPageHeading(route, action)}
        <section class="content-card">
            ${route === "orders" ? `<div class="toolbar order-filters"><input class="search-field" id="order-search" type="search" placeholder="Search order, customer, address..." value="${escapeHtml(orderFilters.search)}">
                <select class="form-field" id="order-status-filter" aria-label="Filter by status"><option value="">All statuses</option>${["pending","processing","ready_to_ship","shipped","fulfilled","cancelled"].map((status) => `<option value="${status}" ${orderFilters.status === status ? "selected" : ""}>${escapeHtml(status === "fulfilled" ? "Delivered / completed" : orderStatusLabel(status))}</option>`).join("")}</select>
                <input class="form-field" type="date" id="order-start-filter" aria-label="From date" value="${escapeHtml(orderFilters.start)}"><input class="form-field" type="date" id="order-end-filter" aria-label="To date" value="${escapeHtml(orderFilters.end)}"></div>` : ""}
            <div class="module-toolbar"><span>${route === "orders" ? `${filteredOrderCount()} of ${businessData.length} orders` : route === "sales" ? `${businessData.length} manual sales · ${onlineSalesData.length} delivered online orders` : `${businessData.length} records`}</span><span>${hint}</span></div>
            <div class="table-wrap"><table><thead><tr><th>Reference</th><th>${route === "purchases" ? "Supplier" : "Customer"}</th><th>Items</th><th>Total</th><th>${route === "orders" ? "Order status" : "Status"}</th>${route === "sales" || route === "orders" ? "<th>Payment</th><th>Method</th>" : ""}<th>Actions</th></tr></thead>
            <tbody>${documentRows(route)}</tbody></table></div>
        </section>${onlineSalesSection}`);
    if (route === "orders") {
        nextTick(() => {
            if (currentRoute() !== "orders") return;
            app.querySelectorAll("#order-search, #order-status-filter, #order-start-filter, #order-end-filter").forEach((input) => {
                input.addEventListener(input.type === "search" ? "input" : "change", () => {
                    orderFilters = {
                        search: app.querySelector("#order-search").value,
                        status: app.querySelector("#order-status-filter").value,
                        start: app.querySelector("#order-start-filter").value,
                        end: app.querySelector("#order-end-filter").value
                    };
                    const activeId = document.activeElement?.id;
                    const selection = activeId === "order-search" ? app.querySelector("#order-search").selectionStart : null;
                    renderDocuments("orders");
                    if (activeId) {
                        const updated = app.querySelector(`#${activeId}`);
                        if (updated) {
                            updated.focus();
                            if (selection !== null && updated.type === "search") updated.setSelectionRange(selection, selection);
                        }
                    }
                });
            });
        });
    }
}

function renderReturnRequests()
{
    const rows = businessData.length
        ? businessData.map((request) => {
            const action = request.status === "requested"
                ? `<button class="button mini-button" type="button" data-return-status="${request.id}" data-next-status="approved">Approve</button>
                    <button class="button danger mini-button" type="button" data-return-status="${request.id}" data-next-status="rejected">Reject</button>`
                : request.status === "approved"
                    ? `<button class="button mini-button" type="button" data-return-status="${request.id}" data-next-status="received">Mark received</button>
                        <button class="button danger mini-button" type="button" data-return-status="${request.id}" data-next-status="rejected">Reject</button>`
                    : request.status === "received"
                        ? `<button class="button mini-button" type="button" data-return-status="${request.id}" data-next-status="refunded">Record refund issued</button>`
                        : "";
            return `<tr><td>#${request.id} · Order #${request.order_id}</td><td>${escapeHtml(request.customer_name)}<small class="product-description">${escapeHtml(request.customer_email || "")}</small></td>
                <td>${request.items.map((item) => `${escapeHtml(item.product_name)} × ${Number(item.quantity)}`).join("<br>")}</td>
                <td>${escapeHtml(request.reason)}<small class="product-description">${escapeHtml(request.details || "")}</small></td>
                <td>${money(request.refund_amount)}</td><td><span class="record-status status-${escapeHtml(request.status)}">${escapeHtml(request.status)}</span></td>
                <td>${action}</td></tr>`;
        }).join("")
        : '<tr><td colspan="7"><div class="empty-state"><strong>No return requests</strong><p>Customer return requests will appear here.</p></div></td></tr>';
    renderMarkup(`${businessPageHeading("returns")}
        <section class="content-card"><div class="module-toolbar"><span>${businessData.length} requests</span><span>Mark items received only after inspection. “Record refund issued” records a refund processed outside Stockwell; it does not send money.</span></div>
        <div class="table-wrap"><table><thead><tr><th>Request / order</th><th>Customer</th><th>Items</th><th>Reason</th><th>Estimated refund</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></section>`);
}

function renderDeliverySettings()
{
    const rows = businessData.length
        ? businessData.map((zone) => `<tr data-delivery-zone-row="${zone.id}">
            <td><input class="form-field" name="area_name" maxlength="120" required aria-label="Delivery area name" value="${escapeHtml(zone.area_name)}"></td>
            <td><input class="form-field" name="fee" type="number" min="0" max="99999999.99" step="0.01" required aria-label="Delivery fee in PHP" value="${escapeHtml(zone.fee)}"></td>
            <td><label class="inline-check"><input name="free_delivery_enabled" type="checkbox" ${Number(zone.free_delivery_enabled) ? "checked" : ""}> Enable</label>
                <input class="form-field" name="free_delivery_minimum" type="number" min="0" step="0.01" aria-label="Minimum order for free delivery" value="${escapeHtml(zone.free_delivery_minimum)}" placeholder="Minimum order"></td>
            <td><label class="inline-check"><input name="is_active" type="checkbox" ${Number(zone.is_active) ? "checked" : ""}> Active</label></td>
            <td><div class="row-actions"><button class="button mini-button" type="button" data-save-delivery-zone="${zone.id}">Save</button>
                <button class="icon-button delete" type="button" data-delete-delivery-zone="${zone.id}" aria-label="Delete ${escapeHtml(zone.area_name)}">${icon("delete")}</button></div></td>
        </tr>`).join("")
        : '<tr><td colspan="5"><div class="empty-state"><strong>No delivery areas yet</strong><p>Add a zone to enable nationwide checkout.</p></div></td></tr>';
    renderMarkup(`<div class="delivery-settings-page">${businessPageHeading("delivery-settings")}
        <section class="content-card delivery-zone-create-card"><h2>Add delivery area</h2><p class="subtitle">Estimates are initial editable amounts, not live courier quotes. Confirm your courier charge before launch.</p>
            <form id="delivery-zone-form" class="form-grid">
                <div class="form-group"><label for="new-delivery-area">Area / zone</label><input class="form-field" id="new-delivery-area" name="area_name" maxlength="120" required placeholder="e.g. Cebu City"></div>
                <div class="form-group"><label for="new-delivery-fee">Delivery fee (PHP)</label><input class="form-field" id="new-delivery-fee" name="fee" type="number" min="0" step="0.01" required value="199.00"></div>
                <div class="form-group"><label class="inline-check"><input name="free_delivery_enabled" type="checkbox"> Offer free delivery</label><input class="form-field" name="free_delivery_minimum" type="number" min="0" step="0.01" value="0" aria-label="Minimum order for free delivery" placeholder="Minimum order (0 = no minimum)"></div>
                <div class="form-group"><label class="inline-check"><input name="is_active" type="checkbox" checked> Active for checkout</label></div>
                <div class="form-group full"><p class="form-error" id="delivery-zone-error" role="alert"></p><button class="button" type="submit">Add delivery area</button></div>
            </form></section>
        <section class="content-card delivery-zone-list-card"><div class="module-toolbar"><span>${businessData.length} areas</span><span>Origin: Calapan City, Oriental Mindoro · Free delivery is calculated from item subtotal.</span></div>
            <div class="table-wrap"><table><thead><tr><th>Area / zone</th><th>Fee (PHP)</th><th>Free-delivery offer</th><th>Availability</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></section></div>`);
}

function filteredOrderCount() {
    const query = orderFilters.search.trim().toLowerCase();
    return businessData.filter((record) => {
        const date = String(record.created_at || "").slice(0, 10);
        return (!query || [record.id, record.party_name, record.delivery_address].some((value) => String(value || "").toLowerCase().includes(query)))
            && matchesOrderStatus(record.status, orderFilters.status)
            && (!orderFilters.start || date >= orderFilters.start)
            && (!orderFilters.end || date <= orderFilters.end);
    }).length;
}

function renderReports() {
    const now = new Date();
    const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    const firstDay = `${today.slice(0, 8)}01`;
    const report = businessReport || {};
    const sales = report.sales || {};
    const purchases = report.purchases || {};
    const profit = report.profit || {};
    const stock = report.stock || {};
    renderMarkup(`${businessPageHeading("reports", '<div class="page-actions"><button class="button secondary" type="button" data-export-report>CSV for Google Sheets</button><button class="button secondary" type="button" data-print-report>Print summary / PDF</button></div>')}
        <form class="report-filter content-card" id="report-filter">
            <div class="form-group"><label for="report-start">From</label><input class="form-field" type="date" id="report-start" name="start" value="${escapeHtml(reportDateRange?.start || firstDay)}" required></div>
            <div class="form-group"><label for="report-end">To</label><input class="form-field" type="date" id="report-end" name="end" value="${escapeHtml(reportDateRange?.end || today)}" required></div>
            <button class="button" type="submit">Apply dates</button>
            <div class="report-presets" aria-label="Quick report ranges">
                <button class="button secondary" type="button" data-report-range="today">Today</button>
                <button class="button secondary" type="button" data-report-range="week">Last 7 days</button>
                <button class="button secondary" type="button" data-report-range="month">This month</button>
            </div>
        </form>
        <p class="product-description">Download the report as CSV, then import it into Google Sheets using File → Import. No Google account connection or automatic data sync is used.</p>
        ${businessStatus === "loading" ? '<div class="content-card loading">Loading report data…</div>' : ""}
        <section class="stat-grid report-stat-grid">
            <article class="stat-card"><div class="stat-top"><span>Sales revenue</span></div><div class="stat-value">${money(sales.total)}</div><div class="stat-note">${Number(sales.count) || 0} sales in period</div></article>
            <article class="stat-card"><div class="stat-top"><span>Purchases received</span></div><div class="stat-value">${money(purchases.total)}</div><div class="stat-note">${Number(purchases.count) || 0} received purchases in period</div></article>
            <article class="stat-card"><div class="stat-top"><span>Estimated gross profit</span></div><div class="stat-value">${money(profit.gross_profit)}</div><div class="stat-note">On ${money(profit.recorded_cost_revenue)} with recorded costs and ${money(profit.estimated_cost_revenue)} with estimates</div></article>
            <article class="stat-card"><div class="stat-top"><span>Estimated gross margin</span></div><div class="stat-value">${profit.gross_margin_percent === null || profit.gross_margin_percent === undefined ? "—" : `${Number(profit.gross_margin_percent).toFixed(1)}%`}</div><div class="stat-note">${money(profit.uncosted_revenue)} sales still have no cost; excludes overhead and taxes</div></article>
            <article class="stat-card inventory-value-card"><div class="stat-top"><span>Inventory value</span></div><div class="stat-value">${money(stock.value)}</div><div class="stat-note">${Number(stock.units) || 0} units across ${Number(stock.products) || 0} products</div></article>
            <article class="stat-card"><div class="stat-top"><span>Low-stock products</span></div><div class="stat-value">${Number(stock.low_stock) || 0}</div><div class="stat-note">At or below reorder level</div></article>
        </section>
        <section class="report-columns">
            <article class="content-card"><div class="card-heading"><h2>Top-selling products</h2></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Units sold</th><th>Sales total</th></tr></thead>
            <tbody>${(report.top_products || []).length ? report.top_products.map((row) => `<tr><td>${escapeHtml(row.product_name)}</td><td>${Number(row.quantity) || 0}</td><td>${money(row.total)}</td></tr>`).join("") : '<tr><td colspan="3">No sales in this date range.</td></tr>'}</tbody></table></div></article>
            <article class="content-card"><div class="card-heading"><h2>Daily sales</h2></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Revenue</th></tr></thead>
            <tbody>${(report.daily_sales || []).length ? report.daily_sales.map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>${money(row.total)}</td></tr>`).join("") : '<tr><td colspan="2">No sales in this date range.</td></tr>'}</tbody></table></div></article>
        </section>
        <section class="content-card report-activity-card"><div class="card-heading"><h2>Low-stock products</h2></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Quantity</th><th>Reorder level</th></tr></thead>
        <tbody>${(report.low_stock_products || []).length ? report.low_stock_products.map((row) => `<tr><td>${escapeHtml(row.product_name)}</td><td>${Number(row.quantity) || 0}</td><td>${Number(row.reorder_level) || 0}</td></tr>`).join("") : '<tr><td colspan="3">No products are at or below their reorder level.</td></tr>'}</tbody></table></div></section>
        <section class="content-card report-activity-card"><div class="card-heading"><h2>Stock movement history</h2></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Product</th><th>Units</th></tr></thead>
        <tbody>${(report.stock_activity || []).length ? report.stock_activity.map((row) => `<tr><td>${escapeHtml(row.activity_date)}</td><td>${escapeHtml(row.activity_type)}</td><td>#${escapeHtml(row.reference_id)}</td><td>${escapeHtml(row.product_name)}</td><td class="${Number(row.quantity) < 0 ? "movement-out" : "movement-in"}">${Number(row.quantity) > 0 ? "+" : ""}${Number(row.quantity) || 0}</td></tr>`).join("") : '<tr><td colspan="5">No stock movement in this date range.</td></tr>'}</tbody></table></div></section>`);
}

function dateInputValue(date)
{
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function loadReportRange(preset)
{
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    if (preset === "today") start.setTime(new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime());
    else if (preset === "week") start.setTime(new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6).getTime());
    else if (preset !== "month") return;
    reportDateRange = { start: dateInputValue(start), end: dateInputValue(end) };
    businessStatus = "idle";
    loadBusiness("reports", `?start=${encodeURIComponent(reportDateRange.start)}&end=${encodeURIComponent(reportDateRange.end)}`);
}

function printReportSummary()
{
    const report = businessReport || {};
    const profit = report.profit || {};
    const range = reportDateRange || {
        start: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
        end: [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, "0"), String(new Date().getDate()).padStart(2, "0")].join("-")
    };
    const topProducts = (report.top_products || []).map((row) =>
        `<tr><td>${escapeHtml(row.product_name)}</td><td>${Number(row.quantity) || 0}</td><td>${money(row.total)}</td></tr>`
    ).join("");
    const dailySales = (report.daily_sales || []).map((row) =>
        `<tr><td>${escapeHtml(row.date)}</td><td>${money(row.total)}</td></tr>`
    ).join("");
    const lowStockProducts = (report.low_stock_products || []).map((row) =>
        `<tr><td>${escapeHtml(row.product_name)}</td><td>${Number(row.quantity) || 0}</td><td>${Number(row.reorder_level) || 0}</td></tr>`
    ).join("");
    const logoUrl = new URL("stockwell-mark.svg", window.location.href).href;
    const printView = `<section class="report-print-summary">
        <header class="report-print-header">
            <div class="report-print-brand"><img src="${escapeHtml(logoUrl)}" alt="Stockwell logo"><div><strong>Stockwell</strong><span>Inventory &amp; Business Operations</span></div></div>
            <div class="report-print-document"><span>BUSINESS REPORT</span><strong>Sales summary</strong></div>
        </header>
        <div class="report-print-range"><span>Reporting period</span><strong>${escapeHtml(range.start)} <i>to</i> ${escapeHtml(range.end)}</strong><small>Prepared ${escapeHtml(new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }))}</small></div>
        <section class="summary">
            <div class="report-print-metric report-print-metric-primary"><span>Sales revenue</span><strong>${money(report.sales?.total)}</strong><small>${Number(report.sales?.count) || 0} sales in period</small></div>
            <div class="report-print-metric"><span>Estimated gross profit</span><strong>${money(profit.gross_profit)}</strong><small>Excludes overhead and taxes</small></div>
            <div class="report-print-metric"><span>Estimated gross margin</span><strong>${profit.gross_margin_percent === null || profit.gross_margin_percent === undefined ? "—" : `${Number(profit.gross_margin_percent).toFixed(1)}%`}</strong><small>Based on available cost data</small></div>
            <div class="report-print-metric"><span>Costed using estimates</span><strong>${money(profit.estimated_cost_revenue)}</strong><small>Sales revenue with estimated costs</small></div>
            <div class="report-print-metric"><span>Sales without cost</span><strong>${money(profit.uncosted_revenue)}</strong><small>Not included in gross profit</small></div>
        </section>
        <p class="report-print-note"><strong>Profit note:</strong> Gross profit is an estimate. Overhead, taxes, and other expenses are excluded.</p>
        <section class="report-print-table-section"><div class="report-print-section-heading"><span>01</span><h2>Top-selling products</h2></div>
            <table><thead><tr><th>Product</th><th>Units sold</th><th>Sales total</th></tr></thead><tbody>${topProducts || '<tr><td colspan="3">No sales in this date range.</td></tr>'}</tbody></table></section>
        <section class="report-print-table-section"><div class="report-print-section-heading"><span>02</span><h2>Daily sales</h2></div>
            <table><thead><tr><th>Date</th><th>Revenue</th></tr></thead><tbody>${dailySales || '<tr><td colspan="2">No sales in this date range.</td></tr>'}</tbody></table></section>
        <section class="report-print-table-section"><div class="report-print-section-heading"><span>03</span><h2>Low-stock products</h2></div>
            <table><thead><tr><th>Product</th><th>Quantity on hand</th><th>Reorder level</th></tr></thead><tbody>${lowStockProducts || '<tr><td colspan="3">No products are at or below their reorder level.</td></tr>'}</tbody></table></section>
        <footer class="report-print-footer"><span>Stockwell · Inventory &amp; Business Operations</span><span>Generated ${escapeHtml(new Date().toLocaleString("en-PH"))}</span></footer>
        </section>`;
    document.querySelector(".report-print-summary")?.remove();
    document.body.insertAdjacentHTML("beforeend", printView);
    const cleanup = () => {
        document.body.classList.remove("printing-report");
        document.querySelector(".report-print-summary")?.remove();
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    document.body.classList.add("printing-report");
    window.print();
}

function exportReportCsv() {
    const report = businessReport || {};
    const profit = report.profit || {};
    const rows = [["Section", "Date", "Type", "Reference", "Product", "Units", "Amount"]];
    rows.push(["Profit summary", "", "Estimated gross profit", "", "", "", profit.gross_profit || 0]);
    rows.push(["Profit summary", "", "Sales with recorded costs", "", "", "", profit.costed_revenue || 0]);
    rows.push(["Profit summary", "", "Sales costed from purchase records", "", "", "", profit.recorded_cost_revenue || 0]);
    rows.push(["Profit summary", "", "Sales costed from estimates", "", "", "", profit.estimated_cost_revenue || 0]);
    rows.push(["Profit summary", "", "Sales without recorded costs", "", "", "", profit.uncosted_revenue || 0]);
    rows.push(["Profit summary", "", "Estimated gross margin percent", "", "", "", profit.gross_margin_percent ?? ""]);
    (report.daily_sales || []).forEach((row) => rows.push(["Daily sales", row.date, "Sale", "", "", "", row.total]));
    (report.low_stock_products || []).forEach((row) => rows.push(["Low stock", "", "At or below reorder level", row.id, row.product_name, row.quantity, row.reorder_level]));
    (report.stock_activity || []).forEach((row) => rows.push(["Stock movement", row.activity_date, row.activity_type, row.reference_id, row.product_name, row.quantity, ""]));
    downloadCsv(`stockwell-report-${new Date().toISOString().slice(0, 10)}.csv`, rows[0], rows.slice(1));
}

function renderBusinessPage(route) {
    if (businessStatus === "error") {
        renderMarkup(`${businessPageHeading(route)}<section class="content-card api-state"><div class="error-panel">${escapeHtml(businessError)}</div><button class="button secondary" type="button" data-retry-business>Retry</button></section>`);
        return;
    }
    if (businessStatus === "loading") {
        if (route === "reports") {
            renderReports();
            return;
        }
        renderMarkup(`${businessPageHeading(route)}<section class="content-card loading">Loading ${escapeHtml(route)} from the database…</section>`);
        return;
    }
    if (route === "customers" || route === "suppliers") renderContacts(route);
    else if (route === "reports") renderReports();
    else if (route === "activity") renderActivity();
    else if (route === "returns") renderReturnRequests();
    else if (route === "delivery-settings") renderDeliverySettings();
    else renderDocuments(route);
}

function renderActivity() {
    const action = `<div class="page-actions"><button class="button secondary" type="button" data-export-current>Export CSV</button><button class="button" type="button" data-download-backup>Download database backup</button></div>`;
    renderMarkup(`${businessPageHeading("activity", action)}
        <section class="content-card">
            <div class="module-toolbar"><span>Latest ${businessData.length} events</span><span>Backups contain account hashes and private business data; store them securely.</span></div>
            <div class="table-wrap"><table><thead><tr><th>Date</th><th>Who</th><th>Action</th><th>Record</th><th>Details</th></tr></thead><tbody>
                ${businessData.length ? businessData.map((item) => `<tr><td>${escapeHtml(item.created_at)}</td><td>${escapeHtml(item.actor_name || "System")}</td><td>${escapeHtml(item.action)}</td>
                    <td>${escapeHtml(item.entity_type)} ${item.entity_id ? `#${escapeHtml(item.entity_id)}` : ""}</td><td>${escapeHtml(item.details || "—")}</td></tr>`).join("")
                    : '<tr><td colspan="5"><div class="empty-state"><strong>No activity recorded yet</strong><p>Changes will appear here as staff work in the system.</p></div></td></tr>'}
            </tbody></table></div>
        </section>
        <section class="content-card backup-recovery-card">
            <div class="card-heading"><h2>Backup recovery</h2></div>
            <p>Download a private SQL backup, then test restoring it into a separate empty database before relying on it. Restoring replaces database contents and is intentionally not an in-app action.</p>
            <ol><li>Create a new, empty test database in MySQL.</li><li>Import the downloaded file with a MySQL-compatible client.</li><li>Check that tables and records load and that Stockwell can connect to the test database.</li></ol>
            <p class="product-description">Never test a restore against your live database. The SQL includes user password hashes and business records; do not email or share the file.</p>
        </section>`);
}

function downloadCsv(filename, headers, rows) {
    const escapeCell = (value) => {
        let text = String(value ?? "");
        if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportCurrentCsv() {
    const route = currentRoute();
    const date = new Date().toISOString().slice(0, 10);
    if (route === "inventory") {
        downloadCsv(`stockwell-products-${date}.csv`,
            ["ID", "Product", "Category", "SKU", "Barcode", "Price", "Quantity", "Reorder level", "Supplier"],
            products.map((product) => [product.id, product.product_name, product.category, product.sku, product.barcode, product.price, product.quantity, productReorderLevel(product), product.supplier_id]));
    } else if (route === "customers" || route === "suppliers") {
        const headers = route === "customers" ? ["ID", "Name", "Email", "Phone", "Address", "Notes"] : ["ID", "Company", "Email", "Address", "Notes"];
        downloadCsv(`stockwell-${route}-${date}.csv`, headers,
            businessData.map((item) => route === "customers"
                ? [item.id, item.name, item.email, item.phone, item.address, item.notes]
                : [item.id, item.name, item.email, item.address, item.notes]));
    } else if (route === "sales") {
        downloadCsv(`stockwell-${route}-${date}.csv`,
            ["Source", "ID", "Party", "Date", "Items", "Total", "Status", "Payment status", "Payment method", "Amount paid"],
            [
                ...businessData.map((item) => ["Manual sale", item.id, item.party_name, item.created_at, item.item_count, item.total, item.status, item.payment_status, item.payment_method, item.amount_paid]),
                ...onlineSalesData.map((item) => ["Online order", item.id, item.party_name, item.created_at, item.item_count, item.total, item.status, item.payment_status, item.payment_method, item.amount_paid])
            ]);
    } else if (["orders", "purchases"].includes(route)) {
        downloadCsv(`stockwell-${route}-${date}.csv`,
            ["ID", "Party", "Date", "Items", "Total", "Status", "Payment status", "Payment method", "Amount paid"],
            businessData.map((item) => [item.id, item.party_name, item.created_at, item.item_count, item.total, item.status, item.payment_status, item.payment_method, item.amount_paid]));
    } else if (route === "activity") {
        downloadCsv(`stockwell-activity-${date}.csv`,
            ["Date", "Actor", "Action", "Record type", "Record ID", "Details"],
            businessData.map((item) => [item.created_at, item.actor_name, item.action, item.entity_type, item.entity_id, item.details]));
    } else {
        showToast("There is no export available for this page.", true);
    }
}

async function loadManagedUsers() {
    userManagementStatus = "loading";
    userManagementError = "";
    renderManagedUsers();
    try {
        const result = await request(`${API_ROOT}/users`);
        managedUsers = Array.isArray(result?.data) ? result.data : [];
        managedRoles = result?.roles || {};
        userManagementStatus = "ready";
    } catch (error) {
        userManagementStatus = "error";
        userManagementError = error.message;
    }
    if (currentRoute() === "users") renderManagedUsers();
}

function renderManagedUsers() {
    if (userManagementStatus === "loading") {
        renderMarkup(`${pageHeading("Users & access", "Assign a role to control each account’s access.")}<section class="content-card loading">Loading users and roles…</section>`);
        return;
    }
    if (userManagementStatus === "error") {
        renderMarkup(`${pageHeading("Users & access", "Assign a role to control each account’s access.")}<section class="content-card api-state"><div class="error-panel">${escapeHtml(userManagementError)}</div><button class="button secondary" type="button" data-retry-users>Retry</button></section>`);
        return;
    }

    const permissionLabels = {
        "inventory.manage": "Inventory",
        "sales.manage": "Sales",
        "orders.manage": "Orders",
        "purchases.manage": "Purchases",
        "customers.manage": "Customers",
        "suppliers.manage": "Suppliers",
        "reports.view": "Reports",
        "users.manage": "User and role management",
        "activity.view": "Activity history",
        "backup.manage": "Database backups",
        "shop.use": "Storefront",
        "orders.view_own": "Own order history"
    };
    const roleCards = Object.entries(managedRoles).map(([role, details]) => `
        <article class="role-card">
            <div class="role-card-heading"><h3>${escapeHtml(details.label)}</h3><span class="record-status">${escapeHtml(role)}</span></div>
            <p>${escapeHtml(details.description)}</p>
            <div class="permission-list">${(details.permissions || []).map((permission) => `<span>${escapeHtml(permissionLabels[permission] || permission)}</span>`).join("")}</div>
        </article>`).join("");
    const rows = managedUsers.length
        ? managedUsers.map((user) => {
            const name = `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username;
            const isSelf = String(user.id) === String(currentUser?.id);
            return `<tr>
                <td><strong>${escapeHtml(name)}</strong><small class="product-description">${escapeHtml(user.username)}${isSelf ? " · Signed in" : ""}</small></td>
                <td>${escapeHtml(user.email || "—")}</td>
                <td><form class="user-role-form" data-id="${escapeHtml(user.id)}">
                    <select class="form-field user-role-select" name="role" aria-label="Role for ${escapeHtml(name)}" ${isSelf ? "disabled" : ""}>
                        ${Object.entries(managedRoles).map(([role, details]) => `<option value="${escapeHtml(role)}" ${user.role === role ? "selected" : ""}>${escapeHtml(details.label)}</option>`).join("")}
                    </select>
                    <button class="button secondary mini-button" type="submit" ${isSelf ? "disabled" : ""}>Save role</button>
                    ${user.role === "staff" ? `<button class="button secondary mini-button" type="button" data-edit-staff-permissions="${escapeHtml(user.id)}">Permissions</button>` : ""}
                </form></td>
                <td>${isSelf ? '<span class="product-description">Protected</span>' : `<button class="button danger mini-button" type="button" data-delete-user="${escapeHtml(user.id)}" data-username="${escapeHtml(user.username)}" data-role="${escapeHtml(user.role)}">Delete</button>`}</td>
            </tr>`;
        }).join("")
        : '<tr><td colspan="4"><div class="empty-state"><strong>No accounts found</strong><p>Customer accounts are created through storefront registration.</p></div></td></tr>';

    const action = `<button class="button" type="button" data-create-managed-user>${icon("add")}<span>Add staff account</span></button>`;
    renderMarkup(`${pageHeading("Users & access", "Assign a role to control each account’s access.", action)}
        <section class="role-grid">${roleCards}</section>
        <section class="content-card user-list-card">
            <div class="module-toolbar"><span>${managedUsers.length} accounts</span><span>Role changes apply immediately; at least one administrator must remain.</span></div>
            <div class="table-wrap"><table><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
        </section>`);
}

function openStaffPermissionsModal(userId) {
    const user = managedUsers.find((item) => String(item.id) === String(userId));
    if (!user || user.role !== "staff") return;
    const labels = {
        "inventory.manage": "Inventory and stock adjustments",
        "sales.manage": "Sales and payments",
        "orders.manage": "Orders, returns, delivery settings",
        "purchases.manage": "Purchases",
        "customers.manage": "Customer records",
        "suppliers.manage": "Supplier records",
        "reports.view": "Reports"
    };
    const name = `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username;
    const allowed = managedRoles.staff?.customizable_permissions || [];
    modalRoot.innerHTML = `<div class="modal-backdrop" data-business-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="staff-permissions-title">
        <div class="modal-heading"><div><h2 id="staff-permissions-title">Staff permissions</h2><p>Choose the modules ${escapeHtml(name)} can access. Administrators retain full access.</p></div>
            <button class="modal-close" type="button" data-close-business aria-label="Close dialog">×</button></div>
        <form id="staff-permissions-form" data-id="${escapeHtml(user.id)}">
            <div class="permission-checkbox-list">${allowed.map((permission) => `<label class="permission-checkbox">
                <input type="checkbox" name="permissions" value="${escapeHtml(permission)}" ${user.permissions.includes(permission) ? "checked" : ""}>
                <span>${escapeHtml(labels[permission] || permission)}</span></label>`).join("")}</div>
            <p class="form-error" id="staff-permissions-error" role="alert"></p>
            <div class="modal-actions"><button class="button secondary" type="button" data-close-business>Cancel</button><button class="button" type="submit">Save permissions</button></div>
        </form></section></div>`;
    modalRoot.querySelectorAll("[data-close-business]").forEach((button) => button.addEventListener("click", closeBusinessModal));
    modalRoot.querySelector("[data-business-backdrop]").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeBusinessModal();
    });
}

function openManagedUserModal() {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-business-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="managed-user-title">
        <div class="modal-heading"><div><h2 id="managed-user-title">Add staff account</h2><p>Create an administrator or staff login. Customers can register from the storefront.</p></div>
            <button class="modal-close" type="button" data-close-business aria-label="Close dialog">×</button></div>
        <form id="managed-user-form" novalidate>
            <div class="form-grid">
                <div class="form-group"><label for="managed-firstname">First name</label><input class="form-field" id="managed-firstname" name="firstname" maxlength="100" required></div>
                <div class="form-group"><label for="managed-lastname">Last name</label><input class="form-field" id="managed-lastname" name="lastname" maxlength="100" required></div>
                <div class="form-group"><label for="managed-email">Email</label><input class="form-field" id="managed-email" name="email" type="email" maxlength="150" required></div>
                <div class="form-group"><label for="managed-username">Username</label><input class="form-field" id="managed-username" name="username" minlength="3" maxlength="100" required></div>
                <div class="form-group"><label for="managed-password">Temporary password</label><input class="form-field" id="managed-password" name="password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>
                <div class="form-group"><label for="managed-role">Role</label><select class="form-field" id="managed-role" name="role"><option value="staff">Staff</option><option value="admin">Administrator</option></select></div>
            </div>
            <p class="form-error" id="managed-user-error" role="alert"></p>
            <div class="modal-actions"><button class="button secondary" type="button" data-close-business>Cancel</button><button class="button" type="submit">Create account</button></div>
        </form></section></div>`;
    modalRoot.querySelector("#managed-firstname").focus();
    modalRoot.querySelectorAll("[data-close-business]").forEach((button) => button.addEventListener("click", closeBusinessModal));
    modalRoot.querySelector("[data-business-backdrop]").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeBusinessModal();
    });
}

function render() {
    document.body.classList.toggle("login-mode", authStatus !== "authenticated");
    const isCustomer = currentUser?.role === "customer";
    document.body.classList.toggle("customer-mode", authStatus === "authenticated" && isCustomer);
    if (currentRoute() === "reset-password") {
        renderResetPassword();
        return;
    }
    if (authStatus !== "authenticated") {
        updateLowStockNotificationBadge();
        modalRoot.innerHTML = "";
        if (authStatus === "checking") {
            renderMarkup('<div class="loading">Checking your sign-in…</div>');
        } else {
            renderLogin();
        }
        return;
    }

    const route = currentRoute();
    startReturnNotificationPolling();
    startAdminNotificationPolling();
    updateLowStockNotificationBadge();
    const usersLink = document.querySelector('[data-route="users"]');
    usersLink.hidden = !hasPermission("users.manage");
    const activityLink = document.querySelector('[data-route="activity"]');
    activityLink.hidden = !hasPermission("activity.view");
    const deliverySettingsLink = document.querySelector('[data-route="delivery-settings"]');
    deliverySettingsLink.hidden = !hasPermission("orders.manage");
    const navigationPermissions = {
        inventory: "inventory.manage",
        sales: "sales.manage",
        orders: "orders.manage",
        returns: "orders.manage",
        purchases: "purchases.manage",
        customers: "customers.manage",
        suppliers: "suppliers.manage",
        reports: "reports.view"
    };
    Object.entries(navigationPermissions).forEach(([module, permission]) => {
        const link = document.querySelector(`[data-route="${module}"]`);
        if (link) link.hidden = !hasPermission(permission);
    });
    if (isCustomer) {
        document.querySelector("#breadcrumb-current").textContent = routeTitles[route] || "Shop";
        document.querySelector("#account-name").textContent = currentUser?.firstname || currentUser?.username || "Account";
        if (route === "my-orders") {
            startCustomerOrderPolling();
        } else {
            stopCustomerOrderPolling();
        }
        if (route === "my-orders") {
            if (customerOrdersStatus === "idle") loadCustomerOrders();
            else renderCustomerOrders();
        } else if (route === "account") {
            if (customerProfileStatus === "idle") loadCustomerProfile();
            else renderCustomerAccount();
        } else if (route === "returns") {
            if (customerReturnsStatus === "idle") loadCustomerReturns();
            else renderCustomerReturns();
        } else {
            if (customerProfileStatus === "idle") loadCustomerProfile();
            if (shopStatus === "idle") loadShopProducts();
            else renderShop();
        }
        return;
    }
    if (route === "shop" || route === "my-orders" || route === "account") {
        window.location.hash = "#dashboard";
        return;
    }
    if (route === "activity" && !hasPermission("activity.view")) {
        window.location.hash = "#dashboard";
        return;
    }
    if (route === "delivery-settings" && !hasPermission("orders.manage")) {
        window.location.hash = "#dashboard";
        return;
    }
    const routePermissions = {
        inventory: "inventory.manage",
        sales: "sales.manage",
        orders: "orders.manage",
        returns: "orders.manage",
        purchases: "purchases.manage",
        customers: "customers.manage",
        suppliers: "suppliers.manage",
        reports: "reports.view"
    };
    if (routePermissions[route] && !hasPermission(routePermissions[route])) {
        window.location.hash = "#dashboard";
        return;
    }
    if (route === "users") {
        if (!hasPermission("users.manage")) {
            window.location.hash = "#dashboard";
            return;
        }
        if (userManagementStatus === "idle") loadManagedUsers();
        else renderManagedUsers();
        document.querySelector("#breadcrumb-current").textContent = routeTitles.users;
        document.querySelector("#account-name").textContent = currentUser?.username || "Account";
        document.querySelectorAll(".nav-link").forEach((link) => {
            const active = link.dataset.route === route;
            link.classList.toggle("active", active);
            if (active) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
        return;
    }
    document.querySelector("#breadcrumb-current").textContent = routeTitles[route];
    document.querySelector("#account-name").textContent = currentUser?.username || "Account";
    document.querySelectorAll(".nav-link").forEach((link) => {
        const active = link.dataset.route === route;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
    });
    document.querySelector("#product-nav-count").textContent = String(products.length);

    if ((route === "inventory" || (route === "dashboard" && hasPermission("inventory.manage"))) && apiStatus !== "ready") {
        const body = apiStatus === "loading"
            ? '<div class="loading">Connecting to the LavaLust inventory API…</div>'
            : `<div class="api-state"><div class="error-panel">Inventory data is unavailable. ${escapeHtml(apiMessage)}</div>
                <button class="button secondary" type="button" data-retry>Retry connection</button></div>`;
        renderMarkup(`${pageHeading(route === "dashboard" ? "Inventory overview" : routeTitles[route], route === "dashboard"
            ? "A summary of current products and stock levels."
            : "Manage product details, pricing, and stock levels.")}<section class="content-card">${body}</section>`);
        return;
    }

    if (route === "dashboard") renderDashboard();
    else if (route === "inventory") renderInventory();
    else if (businessRoute !== route || businessStatus === "idle") loadBusiness(route);
    else renderBusinessPage(route);
}

function renderLogin(errorMessage = "") {
    const registering = authMode === "register";
    const recovering = authMode === "forgot";
    const fields = registering
        ? `<div class="form-group"><label for="register-firstname">First name</label><input class="form-field" id="register-firstname" name="firstname" maxlength="100" autocomplete="given-name" required></div>
            <div class="form-group"><label for="register-lastname">Last name</label><input class="form-field" id="register-lastname" name="lastname" maxlength="100" autocomplete="family-name" required></div>
            <div class="form-group"><label for="register-email">Email</label><input class="form-field" id="register-email" name="email" type="email" maxlength="150" autocomplete="email" required></div>
            <div class="form-group"><label for="register-username">Username</label><input class="form-field" id="register-username" name="username" minlength="3" maxlength="100" autocomplete="username" required></div>
            <div class="form-group"><label for="register-password">Password</label><input class="form-field" id="register-password" name="password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>
            <div class="form-group"><label for="register-address">Delivery address</label><textarea class="form-field" id="register-address" name="address" maxlength="500" autocomplete="street-address" required></textarea></div>`
        : recovering
            ? `<div class="form-group"><label for="forgot-email">Email address</label><input class="form-field" id="forgot-email" name="email" type="email" maxlength="150" autocomplete="email" required></div>`
            : `<div class="form-group"><label for="login-username">Username or email</label>
                    <input class="form-field" id="login-username" name="username" autocomplete="username" required></div>
                <div class="form-group"><label for="login-password">Password</label>
                    <input class="form-field" id="login-password" name="password" type="password" autocomplete="current-password" required></div>`;
    renderMarkup(`<section class="login-layout">
        <div class="login-brand-panel">
            <img class="login-brand-mark" src="stockwell-mark.svg" alt="">
            <p class="login-overline">STOCKWELL <span>·</span> STORE</p>
            <h1>Good finds<br>start here.</h1>
            <p class="login-brand-copy">Browse products, place an order, and keep track of your purchases.</p>
            <span class="login-panel-note">SHOP · ORDER · TRACK</span>
        </div>
        <div class="login-form-panel">
            <p class="eyebrow">${registering ? "NEW CUSTOMER" : recovering ? "ACCOUNT RECOVERY" : "WELCOME BACK"}</p>
            <h2>${registering ? "Create your account" : recovering ? "Reset your password" : "Sign in to continue"}</h2>
            <p class="login-intro">${registering ? "Create an account to shop Stockwell and track your orders." : recovering ? "Enter the email address linked to your Stockwell account. If it matches, we’ll email a reset link. If no email arrives after a few minutes, check Spam/Junk, confirm the account email, and wait 60 seconds before retrying." : "Sign in as a customer to shop, or as staff or an administrator to manage store operations."}</p>
            <form id="${registering ? "register-form" : recovering ? "forgot-password-form" : "login-form"}" novalidate>
                ${fields}
                ${registering && publicIntegrationsConfig?.turnstileSiteKey ? '<div class="form-group"><div id="registration-turnstile"></div><p class="login-error" id="turnstile-error" role="alert"></p></div>' : ""}
                <p class="login-error" role="alert">${escapeHtml(errorMessage || (!registering && !recovering ? googleAuthError : ""))}</p>
                <button class="button login-submit" type="submit">${registering ? "Create account" : recovering ? "Send reset link" : "Sign in"} <span aria-hidden="true">→</span></button>
            </form>
            ${!registering && !recovering ? `<div class="login-divider" aria-hidden="true"><span>OR</span></div>
                <a class="google-login-button" href="${escapeHtml(API_AUTH)}/google/start"><span class="google-login-mark" aria-hidden="true">G</span>Continue with Google</a>` : ""}
            <p class="login-footnote">${registering ? "Already have an account?" : recovering ? "Remembered your password?" : "New to Stockwell?"}
                <button class="auth-mode-button" type="button" data-auth-mode="${registering || recovering ? "login" : "register"}">${registering || recovering ? "Sign in" : "Create a customer account"}</button></p>
            ${!registering && !recovering ? '<p class="login-footnote"><button class="auth-mode-button" type="button" data-auth-mode="forgot">Forgot your password?</button></p>' : ""}
        </div>
    </section>`);
    nextTick(() => {
        app.querySelector(registering ? "#register-firstname" : recovering ? "#forgot-email" : "#login-username")?.focus();
        if (registering && publicIntegrationsConfig?.turnstileSiteKey) renderRegistrationTurnstile();
    });
}

function ensureTurnstileScript() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstileScriptPromise) return turnstileScriptPromise;
    turnstileScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("Cloudflare Turnstile did not initialize."));
        script.onerror = () => reject(new Error("Could not load Cloudflare Turnstile."));
        document.head.append(script);
    }).catch((error) => {
        turnstileScriptPromise = null;
        throw error;
    });
    return turnstileScriptPromise;
}

async function renderRegistrationTurnstile() {
    const container = app.querySelector("#registration-turnstile");
    if (!container) return;
    turnstileToken = "";
    try {
        const turnstile = await ensureTurnstileScript();
        if (!container.isConnected) return;
        if (turnstileWidgetId !== null) turnstile.remove(turnstileWidgetId);
        turnstileWidgetId = turnstile.render(container, {
            sitekey: publicIntegrationsConfig.turnstileSiteKey,
            action: "customer_registration",
            callback: (token) => {
                turnstileToken = token;
                const errorNode = app.querySelector("#turnstile-error");
                if (errorNode) errorNode.textContent = "";
            },
            "expired-callback": () => {
                turnstileToken = "";
                const errorNode = app.querySelector("#turnstile-error");
                if (errorNode) errorNode.textContent = "The security check expired. Please complete it again.";
            },
            "error-callback": () => {
                turnstileToken = "";
                const errorNode = app.querySelector("#turnstile-error");
                if (errorNode) errorNode.textContent = "The security check could not load. Refresh the page and try again.";
            }
        });
    } catch (error) {
        const errorNode = app.querySelector("#turnstile-error");
        if (errorNode) errorNode.textContent = error.message;
    }
}

async function loadPublicIntegrationsConfig() {
    try {
        const response = await fetch(`${API_AUTH}/public-config`, {
            credentials: "include",
            headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error(`Integration settings could not be loaded (${response.status}).`);
        const result = await response.json();
        const integrations = result?.integrations || {};
        publicIntegrationsConfig = {
            turnstileSiteKey: typeof integrations.turnstile_site_key === "string" ? integrations.turnstile_site_key : "",
            ga4MeasurementId: typeof integrations.ga4_measurement_id === "string" ? integrations.ga4_measurement_id : "",
            manualGcash: integrations.manual_gcash
                && typeof integrations.manual_gcash.account_name === "string"
                && typeof integrations.manual_gcash.account_number === "string"
                && typeof integrations.manual_gcash.qr_image_url === "string"
                ? integrations.manual_gcash
                : null
        };
        document.querySelector("[data-analytics-settings]").hidden = !publicIntegrationsConfig.ga4MeasurementId;
        initializeAnalyticsConsent();
        if (authMode === "register" && authStatus !== "authenticated") renderLogin();
    } catch (error) {
        publicIntegrationsConfig = { turnstileSiteKey: "", ga4MeasurementId: "", manualGcash: null };
        manualGcashDetails = null;
        const settingsButton = document.querySelector("[data-analytics-settings]");
        if (settingsButton) settingsButton.hidden = true;
        if (authMode === "register" && authStatus !== "authenticated") {
            renderLogin("Could not load registration security settings. Refresh the page and try again.");
        }
    }
}

function readAnalyticsConsent() {
    try {
        return localStorage.getItem("stockwell.analytics.consent") || "";
    } catch {
        return "";
    }
}

function initializeAnalyticsConsent() {
    if (!publicIntegrationsConfig?.ga4MeasurementId) return;
    analyticsConsent = readAnalyticsConsent();
    const banner = document.querySelector("#analytics-consent");
    banner.hidden = analyticsConsent === "accepted" || analyticsConsent === "rejected";
    if (analyticsConsent === "accepted") {
        startGoogleAnalytics();
        trackAnalyticsPageView();
    }
}

        manualGcashDetails = publicIntegrationsConfig.manualGcash;
        const paymentSelect = app.querySelector("#checkout-payment-method");
        if (paymentSelect && manualGcashDetails
            && !paymentSelect.querySelector('option[value="gcash"]')) {
            paymentSelect.add(new Option("GCash QR / manual transfer", "gcash"));
        }
function saveAnalyticsConsent(choice) {
    if (!["accept", "reject"].includes(choice)) return;
    analyticsConsent = choice === "accept" ? "accepted" : "rejected";
    try {
        localStorage.setItem("stockwell.analytics.consent", analyticsConsent);
    } catch {
        showToast("Your analytics choice could not be saved in this browser.", true);
    }
    document.querySelector("#analytics-consent").hidden = true;
    if (analyticsConsent === "accepted") {
        startGoogleAnalytics();
        trackAnalyticsPageView();
    } else if (analyticsInitialized) {
        window.gtag("consent", "update", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied"
        });
    }
}

function startGoogleAnalytics() {
    const measurementId = publicIntegrationsConfig?.ga4MeasurementId;
    if (!measurementId || analyticsConsent !== "accepted" || analyticsInitialized) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
    });
    window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.append(script);
    analyticsInitialized = true;
}

function trackAnalyticsPageView() {
    if (!analyticsInitialized || analyticsConsent !== "accepted" || authStatus === "checking") return;
    if (currentUser && currentUser.role !== "customer") return;
    const route = currentUser
        ? currentRoute()
        : currentRoute() === "reset-password"
            ? "reset-password"
            : authMode === "register"
                ? "register"
                : authMode === "forgot"
                    ? "forgot-password"
                    : "login";
    window.gtag("event", "page_view", {
        page_title: `Stockwell | ${routeTitles[route] || "Store"}`,
        page_path: `${window.location.pathname}#${route}`,
        page_location: `${window.location.origin}${window.location.pathname}#${route}`
    });
}

function renderResetPassword(errorMessage = "") {
    const token = window.location.hash.split("/")[1] || "";
    renderMarkup(`<section class="login-layout"><div class="login-brand-panel">
        <img class="login-brand-mark" src="stockwell-mark.svg" alt=""><p class="login-overline">STOCKWELL <span>·</span> ACCOUNT</p>
        <h1>Secure your<br>account.</h1><p class="login-brand-copy">Choose a new password for your Stockwell account.</p></div>
        <div class="login-form-panel"><p class="eyebrow">ACCOUNT RECOVERY</p><h2>Set a new password</h2>
        <p class="login-intro">Reset links expire after 30 minutes and can only be used once.</p>
        <form id="reset-password-form" data-token="${escapeHtml(token)}" novalidate>
            <div class="form-group"><label for="reset-password">New password</label><input class="form-field" id="reset-password" name="password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>
            <div class="form-group"><label for="reset-password-confirm">Confirm new password</label><input class="form-field" id="reset-password-confirm" name="confirm_password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>
            <p class="login-error" role="alert">${escapeHtml(errorMessage)}</p>
            <button class="button login-submit" type="submit" ${token ? "" : "disabled"}>Update password <span aria-hidden="true">→</span></button>
            ${token ? "" : '<p class="login-error">This reset link is invalid. Request a new one from the sign-in page.</p>'}
        </form><p class="login-footnote"><button class="auth-mode-button" type="button" data-reset-login>Return to sign in</button></p></div></section>`);
    nextTick(() => app.querySelector("#reset-password")?.focus());
}

function renderShop()
{
    const categories = [...new Set(shopProducts.map((product) => String(product.category || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const searchQuery = shopSearch.trim().toLowerCase();
    const visibleProducts = shopProducts.filter((product) => {
        return (!searchQuery || [product.product_name, product.description, product.category, product.sku, product.barcode]
            .some((value) => String(value || "").toLowerCase().includes(searchQuery)))
            && (!shopCategory || String(product.category || "") === shopCategory);
    }).sort((a, b) => {
        if (shopSort === "best-selling") {
            return Number(b.units_sold || 0) - Number(a.units_sold || 0)
                || Number(b.review_count || 0) - Number(a.review_count || 0)
                || String(a.product_name).localeCompare(String(b.product_name));
        }
        if (shopSort === "price-low") return Number(a.price) - Number(b.price);
        if (shopSort === "price-high") return Number(b.price) - Number(a.price);
        if (shopSort === "relevance" && searchQuery) {
            const relevance = (product) => {
                const name = String(product.product_name || "").toLowerCase();
                if (name === searchQuery) return 0;
                if (name.startsWith(searchQuery)) return 1;
                if (name.includes(searchQuery)) return 2;
                if ([product.category, product.sku, product.barcode]
                    .some((value) => String(value || "").toLowerCase().includes(searchQuery))) return 3;
                return 4;
            };
            const difference = relevance(a) - relevance(b);
            if (difference) return difference;
        }
        if (shopSort === "relevance") {
            return Number(b.review_count || 0) - Number(a.review_count || 0)
                || Number(b.average_rating || 0) - Number(a.average_rating || 0)
                || Number(b.units_sold || 0) - Number(a.units_sold || 0);
        }
        return String(a.product_name).localeCompare(String(b.product_name));
    });
    const cartEntries = Object.entries(shopCart)
        .map(([id, quantity]) => ({ product: shopProducts.find((item) => String(item.id) === id), quantity }))
        .filter((entry) => entry.product && entry.quantity > 0);
    const cartTotal = cartEntries.reduce((total, entry) => total + Number(entry.product.price) * entry.quantity, 0);
    if (!shopDeliveryZones.some((zone) => String(zone.id) === String(checkoutDeliveryZoneId))) {
        checkoutDeliveryZoneId = "";
    }
    const checkoutZone = shopDeliveryZones.find((zone) => String(zone.id) === String(checkoutDeliveryZoneId));
    const quote = checkoutZone ? quoteDelivery(checkoutZone, cartTotal) : null;
    const cartCount = cartEntries.reduce((total, entry) => total + entry.quantity, 0);
    const cartRows = cartEntries.length
        ? cartEntries.map(({ product, quantity }) => `<div class="cart-row">
            <div><strong>${escapeHtml(product.product_name)}</strong><small>${money(product.price)} each</small></div>
            <div class="cart-quantity"><button type="button" data-cart-change="${product.id}" data-change="-1" aria-label="Remove one ${escapeHtml(product.product_name)}">−</button>
                <span>${quantity}</span><button type="button" data-cart-change="${product.id}" data-change="1" aria-label="Add one ${escapeHtml(product.product_name)}">+</button></div>
        </div>`).join("")
        : '<p class="cart-empty">Your cart is empty. Add a product to get started.</p>';
    const productCards = visibleProducts.length
        ? visibleProducts.map((product) => `<article class="shop-product-card">
            ${productImageMarkup(product, "shop-product-image")}
            <div class="shop-product-info"><span class="shop-stock">${Number(product.quantity)} available</span>
                <h3>${escapeHtml(product.product_name)}</h3><p>${escapeHtml(product.description || "A Stockwell store favorite.")}</p>
                <p class="product-rating" aria-label="${Number(product.review_count) ? `${Number(product.average_rating).toFixed(1)} out of 5 stars from ${Number(product.review_count)} reviews` : "No reviews yet"}">${Number(product.review_count) ? `★ ${Number(product.average_rating).toFixed(1)} · ${Number(product.review_count)} ${Number(product.review_count) === 1 ? "review" : "reviews"}` : "No reviews yet"}</p>
                <div class="shop-product-bottom"><strong>${money(product.price)}</strong>
                    <span><button class="button secondary" type="button" data-product-details="${product.id}">Details</button>
                    <button class="button" type="button" data-cart-add="${product.id}" ${Number(shopCart[product.id]) >= Number(product.quantity) ? "disabled" : ""}>Add to cart</button></span></div></div>
        </article>`).join("")
        : `<div class="empty-state"><strong>${shopProducts.length ? "No matching products" : "No products available right now"}</strong><p>${shopProducts.length ? "Try changing the search or category filter." : "Please check back later."}</p></div>`;
    const productContent = shopStatus === "loading"
        ? '<div class="content-card loading">Loading the store…</div>'
        : shopStatus === "error"
            ? `<div class="content-card"><div class="error-panel">${escapeHtml(shopError)}</div><button class="button secondary" type="button" data-retry-shop>Retry</button></div>`
            : `<div class="shop-product-grid">${productCards}</div>`;
    const defaultAddress = customerProfile?.addresses?.find((address) => Number(address.is_default)) || customerProfile?.addresses?.[0];
    renderMarkup(`<div class="shop-toolbar"><div><p class="eyebrow">STOCKWELL STORE</p><h1>Shop products</h1><p class="subtitle">Choose from items currently in stock. ${shopProducts.length} products available.</p></div>
        <nav class="shop-nav" aria-label="Customer navigation"><a class="shop-nav-link active" href="#shop">Shop</a><a class="shop-nav-link" href="#my-orders">My orders</a><a class="shop-nav-link" href="#account">My account</a><span class="cart-count">${cartCount} in cart</span></nav></div>
        <div class="shop-toolbar shop-filters"><input class="form-field" type="search" data-shop-search placeholder="Search products, SKU, or details" aria-label="Search products" value="${escapeHtml(shopSearch)}">
            <select class="form-field" data-shop-category aria-label="Filter by category"><option value="">All categories</option>${categories.map((category) => `<option value="${escapeHtml(category)}" ${category === shopCategory ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}</select>
            <select class="form-field" data-shop-sort aria-label="Sort products"><option value="relevance" ${shopSort === "relevance" ? "selected" : ""}>Most relevant</option><option value="best-selling" ${shopSort === "best-selling" ? "selected" : ""}>Best selling</option><option value="name" ${shopSort === "name" ? "selected" : ""}>Name: A to Z</option><option value="price-low" ${shopSort === "price-low" ? "selected" : ""}>Price: low to high</option><option value="price-high" ${shopSort === "price-high" ? "selected" : ""}>Price: high to low</option></select></div>
        <div class="shop-layout"><section>${productContent}</section>
            <aside class="cart-panel"><div class="cart-panel-heading"><div><p class="eyebrow">YOUR CART</p><h2>Order summary</h2></div><span class="cart-count">${cartCount} items</span></div>
                <div class="cart-items">${cartRows}</div><div class="cart-total"><span>Total</span><strong>${money(cartTotal)}</strong></div>
                <form id="checkout-form"><div class="form-group"><label for="delivery-address-select">Saved delivery address</label><select class="form-field" id="delivery-address-select" data-checkout-address><option value="">Enter a new delivery address</option>${(customerProfile?.addresses || []).map((address) => `<option value="${address.id}" ${Number(address.id) === Number(defaultAddress?.id) ? "selected" : ""}>${escapeHtml(address.label)}${Number(address.is_default) ? " · Default" : ""}</option>`).join("")}</select></div>
                    <div class="form-group"><label for="checkout-delivery-zone">Delivery area</label><select class="form-field" id="checkout-delivery-zone" name="delivery_zone_id" required ${deliveryQuoteLoading || !shopDeliveryZones.length ? "disabled" : ""}><option value="">${deliveryQuoteLoading ? "Loading delivery areas…" : deliveryZonesError ? "Delivery areas unavailable" : "Choose your delivery area"}</option>${shopDeliveryZones.map((zone) => `<option value="${zone.id}" ${String(zone.id) === String(checkoutDeliveryZoneId) ? "selected" : ""}>${escapeHtml(zone.area_name)} · ${money(zone.fee)}${Number(zone.free_delivery_enabled) ? ` · Free delivery${Number(zone.free_delivery_minimum) > 0 ? ` over ${money(zone.free_delivery_minimum)}` : ""}` : ""}</option>`).join("")}</select><small class="product-description">${deliveryZonesError ? `Delivery areas could not be loaded: ${escapeHtml(deliveryZonesError)}` : "Choose the area matching your destination. Fees are editable estimates; the actual courier charge may vary."}</small></div>
                    <div class="form-group"><label for="delivery-recipient">Recipient name</label><input class="form-field" id="delivery-recipient" name="recipient_name" maxlength="160" required value="${escapeHtml(defaultAddress?.recipient_name || `${currentUser?.firstname || ""} ${currentUser?.lastname || ""}`.trim())}"></div>
                    <div class="form-group"><label for="delivery-phone">Contact phone</label><input class="form-field" id="delivery-phone" name="phone" type="tel" maxlength="40" autocomplete="tel" required value="${escapeHtml(defaultAddress?.phone || customerProfile?.phone || "")}"></div>
                    <div class="form-group"><label for="delivery-address">Delivery address</label><textarea class="form-field" id="delivery-address" name="address" maxlength="500" autocomplete="street-address" required>${escapeHtml(defaultAddress?.address || customerProfile?.address || "")}</textarea></div>
                    <div class="form-group"><label for="delivery-notes">Delivery notes <span class="optional-label">Optional</span></label><textarea class="form-field" id="delivery-notes" name="delivery_notes" maxlength="1000" placeholder="Landmark, preferred delivery time, or instructions"></textarea></div>
                    <div class="checkout-total-breakdown" id="checkout-delivery-summary">${quote ? checkoutQuoteMarkup(quote) : '<p class="product-description">Select a delivery area to see the final total.</p>'}</div>
                    <div class="form-group"><label for="checkout-payment-method">Payment method</label><select class="form-field" id="checkout-payment-method" name="payment_method"><option value="cash">Cash on delivery</option>${manualGcashDetails ? '<option value="gcash">GCash QR / manual transfer</option>' : ""}</select></div>
                    <p class="checkout-note">Stock is reserved when your order is placed. For GCash, open the order details after checkout to view the QR and submit your transaction reference. An admin must verify the transfer before marking it paid. COD remains available. Manage saved addresses in <a href="#account">My account</a>.</p>
                    <p class="form-error" id="checkout-error" role="alert"></p>
                    <button class="button checkout-button" type="submit" ${!cartEntries.length || shopStatus !== "ready" || !checkoutZone ? "disabled" : ""}>Place order</button></form></aside></div>`);
    nextTick(() => {
        const search = app.querySelector("[data-shop-search]");
        if (search) search.addEventListener("input", () => {
            shopSearch = search.value;
            const start = search.selectionStart;
            renderShop();
            nextTick(() => {
                const updated = app.querySelector("[data-shop-search]");
                updated?.focus();
                if (updated && start !== null) updated.setSelectionRange(start, start);
            });
        });
        app.querySelector("[data-shop-category]")?.addEventListener("change", (event) => {
            shopCategory = event.target.value;
            renderShop();
        });
        app.querySelector("[data-shop-sort]")?.addEventListener("change", (event) => {
            shopSort = event.target.value;
            renderShop();
        });
        app.querySelector("[data-checkout-address]")?.addEventListener("change", (event) => {
            const address = customerProfile?.addresses?.find((item) => String(item.id) === event.target.value);
            app.querySelector("#delivery-recipient").value = address?.recipient_name || "";
            app.querySelector("#delivery-phone").value = address?.phone || "";
            app.querySelector("#delivery-address").value = address?.address || "";
        });
        app.querySelector("#checkout-delivery-zone")?.addEventListener("change", (event) => {
            checkoutDeliveryZoneId = event.target.value;
            updateCheckoutQuote(cartTotal);
        });
    });
}

function quoteDelivery(zone, subtotal)
{
    const fee = Math.max(0, Number(zone.fee) || 0);
    const freeDelivery = Number(zone.free_delivery_enabled) === 1
        && subtotal >= Math.max(0, Number(zone.free_delivery_minimum) || 0);
    const discount = freeDelivery ? fee : 0;
    return {
        subtotal,
        delivery_fee: fee,
        delivery_discount: discount,
        total: subtotal + fee - discount,
        free_delivery_applied: freeDelivery
    };
}

function checkoutQuoteMarkup(quote)
{
    return `<dl class="checkout-breakdown"><div><dt>Items</dt><dd>${money(quote.subtotal)}</dd></div>
        <div><dt>Delivery fee</dt><dd>${money(quote.delivery_fee)}</dd></div>
        ${quote.free_delivery_applied ? `<div><dt>Free delivery discount</dt><dd>−${money(quote.delivery_discount)}</dd></div>` : ""}
        <div class="checkout-grand-total"><dt>Total due on delivery</dt><dd>${money(quote.total)}</dd></div></dl>`;
}

function updateCheckoutQuote(subtotal)
{
    const zone = shopDeliveryZones.find((item) => String(item.id) === String(checkoutDeliveryZoneId));
    const summary = app.querySelector("#checkout-delivery-summary");
    const button = app.querySelector('#checkout-form [type="submit"]');
    if (summary) summary.innerHTML = zone
        ? checkoutQuoteMarkup(quoteDelivery(zone, subtotal))
        : '<p class="product-description">Select a delivery area to see the final total.</p>';
    if (button) button.disabled = !zone || !Object.keys(shopCart).some((id) => Number(shopCart[id]) > 0) || shopStatus !== "ready";
}

function renderCustomerOrders()
{
    const existingNotifications = app.querySelector("[data-order-updates]");
    if (existingNotifications) customerNotificationsExpanded = existingNotifications.open;
    const refreshNotice = customerOrderRefreshError
        ? `<p class="form-error" role="status">${escapeHtml(customerOrderRefreshError)} Order status will retry automatically.</p>`
        : "";
    const notifications = customerNotificationsStatus === "error"
        ? `<section class="content-card"><div class="error-panel">${escapeHtml(customerNotificationsError)}</div></section>`
        : customerNotifications.length
            ? `<details class="content-card order-updates" data-order-updates ${customerNotificationsExpanded ? "open" : ""}>
                <summary><span>Order updates</span><span class="order-updates-count">${customerNotifications.length}</span><span class="order-updates-toggle"></span></summary>
                <div class="order-updates-body"><div class="module-toolbar"><span>Recent updates</span><button class="button secondary mini-button" type="button" data-mark-notifications-read>Mark all as seen</button></div>
                <ul class="notification-list">${customerNotifications.map((notice) => `<li class="notification-item ${notice.read_at ? "" : "notification-unread"}"><strong>${escapeHtml(notice.title)}</strong><p>${escapeHtml(notice.message)}</p><small>${escapeHtml(formatCustomerDate(notice.created_at))}</small></li>`).join("")}</ul></div></details>`
            : customerNotificationsStatus === "loading"
                ? '<section class="content-card loading">Loading order updates…</section>'
                : "";
    const content = customerOrdersStatus === "loading"
        ? '<section class="content-card loading">Loading your orders…</section>'
        : customerOrdersStatus === "error"
            ? `<section class="content-card"><div class="error-panel">${escapeHtml(shopError)}</div><button class="button secondary" type="button" data-retry-orders>Retry</button></section>`
            : customerOrders.length
                ? `<section class="content-card"><div class="table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Delivery / ETA</th><th>Actions</th></tr></thead><tbody>
                    ${customerOrders.map((order) => `<tr><td><strong>#${order.id}</strong></td><td>${escapeHtml(formatCustomerDate(order.created_at))}</td><td><div class="customer-order-items-cell">${order.preview_product_name ? productImageMarkup({ product_name: order.preview_product_name, image_url: order.preview_image_url }, "order-item-thumbnail") : ""}<span>${Number(order.item_count)} ${Number(order.item_count) === 1 ? "item" : "items"}</span></div></td><td>${money(order.total)}</td><td><span class="record-status status-${escapeHtml(order.status)}">${escapeHtml(orderStatusLabel(order.status))}</span></td><td><span class="record-status status-${escapeHtml(order.payment_status || "unpaid")}">${escapeHtml(paymentStatusLabel(order.payment_status || "unpaid"))}</span><small class="product-description">${paymentMethodLabel(order.payment_method, true)}</small>${order.payment_method === "gcash" && order.gcash_payment_reference ? `<small class="product-description">Reference submitted · ${order.payment_status === "paid" ? "verified" : "awaiting admin verification"}</small>` : ""}</td><td>${escapeHtml(order.delivery_address || "—")}<small class="product-description">${order.estimated_delivery_at ? `Estimated delivery: ${escapeHtml(formatCustomerDate(order.estimated_delivery_at))}` : "ETA not provided yet"}</small></td><td><button class="button secondary" type="button" data-customer-order="${order.id}">Details</button>${order.status === "pending" && (order.payment_status || "unpaid") === "unpaid" && Number(order.amount_paid || 0) === 0 && (order.payment_method !== "gcash" || !order.gcash_payment_reference) ? ` <button class="button danger" type="button" data-cancel-customer-order="${order.id}">Cancel</button>` : ""}${["delivered", "completed"].includes(order.status) && Number(order.returnable_quantity) > 0 ? ` <button class="button secondary" type="button" data-request-return="${order.id}">Request return</button>` : ""}</td></tr>`).join("")}
                    </tbody></table></div></section>`
                : '<section class="content-card"><div class="empty-state"><strong>No orders yet</strong><p>Your placed orders will appear here.</p><a class="button" href="#shop">Browse products</a></div></section>';
    renderMarkup(`<div class="shop-toolbar"><div><p class="eyebrow">YOUR ACCOUNT</p><h1>My orders</h1><p class="subtitle">Check the status and details of your Stockwell orders.</p></div>
        <nav class="shop-nav" aria-label="Customer navigation"><a class="shop-nav-link" href="#shop">Shop</a><a class="shop-nav-link active" href="#my-orders">My orders</a><a class="shop-nav-link" href="#returns">Returns</a><a class="shop-nav-link" href="#account">My account</a></nav></div>${refreshNotice}${notifications}${content}`);
}

function renderCustomerReturns()
{
    const body = customerReturnsStatus === "loading"
        ? '<section class="content-card loading">Loading your return requests…</section>'
        : customerReturnsStatus === "error"
            ? `<section class="content-card"><div class="error-panel">${escapeHtml(shopError)}</div><button class="button secondary" type="button" data-retry-customer-returns>Retry</button></section>`
            : customerReturns.length
                ? `<section class="content-card"><div class="table-wrap"><table><thead><tr><th>Request</th><th>Order</th><th>Items</th><th>Reason</th><th>Requested refund</th><th>Status</th></tr></thead><tbody>${customerReturns.map((request) => `<tr>
                    <td>#${request.id}<small class="product-description">${escapeHtml(request.created_at)}</small></td><td>#${request.order_id}</td>
                    <td>${request.items.map((item) => `${escapeHtml(item.product_name)} × ${Number(item.quantity)}`).join("<br>")}</td>
                    <td>${escapeHtml(request.reason)}<small class="product-description">${escapeHtml(request.details || "")}</small></td>
                    <td>${money(request.refund_amount)}<small class="product-description">${request.status === "refunded" ? "Refund marked issued" : "Requested amount; final amount may change"}</small></td><td><div class="return-status-detail"><strong class="record-status status-${escapeHtml(request.status)}">${escapeHtml(returnStatusLabel(request.status))}</strong>
                        <small>${escapeHtml(returnStatusDescription(request.status))}</small><small>Last updated ${escapeHtml(formatCustomerDate(request.updated_at))}</small>
                        ${request.status !== "rejected" ? `<ol class="return-timeline">${["requested", "approved", "received", "refunded"].map((status, index) => {
                            const currentIndex = ["requested", "approved", "received", "refunded"].indexOf(request.status);
                            return `<li class="${index < currentIndex ? "timeline-done" : index === currentIndex ? "timeline-current" : ""}">${escapeHtml(returnStatusLabel(status))}</li>`;
                        }).join("")}</ol>` : ""}</div></td></tr>`).join("")}</tbody></table></div></section>`
                : '<section class="content-card"><div class="empty-state"><strong>No return requests yet</strong><p>Eligible delivered orders can be submitted within 14 days of delivery.</p><a class="button" href="#my-orders">View my orders</a></div></section>';
    renderMarkup(`<div class="shop-toolbar"><div><p class="eyebrow">YOUR ACCOUNT</p><h1>Returns</h1><p class="subtitle">Track return and refund requests for your orders.</p></div>
        <nav class="shop-nav" aria-label="Customer navigation"><a class="shop-nav-link" href="#shop">Shop</a><a class="shop-nav-link" href="#my-orders">My orders</a><a class="shop-nav-link active" href="#returns">Returns</a><a class="shop-nav-link" href="#account">My account</a></nav></div>${body}`);
}

function returnStatusLabel(status)
{
    return ({
        requested: "Submitted",
        approved: "Approved",
        rejected: "Not approved",
        received: "Item received",
        refunded: "Refund issued"
    })[status] || String(status).replace(/_/g, " ");
}

function returnStatusDescription(status)
{
    return ({
        requested: "Waiting for the store to review your request.",
        approved: "Approved. Follow the return instructions from the store.",
        rejected: "This request was not approved. Contact the store if you need help.",
        received: "The store received the item. The refund is being reviewed; this status does not mean money has been sent.",
        refunded: "The store marked the refund as issued outside Stockwell. Contact the store if you have not received it."
    })[status] || "Check with the store for an update.";
}

function formatCustomerDate(value)
{
    const text = String(value || "");
    const parts = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    const date = parts
        ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(parts[4] || 0), Number(parts[5] || 0), Number(parts[6] || 0))
        : new Date(text);
    if (!text || Number.isNaN(date.getTime())) return "date unavailable";
    return new Intl.DateTimeFormat("en-PH", {
        year: "numeric", month: "short", day: "numeric",
        ...(parts?.[4] ? { hour: "numeric", minute: "2-digit" } : {})
    }).format(date);
}

function renderCustomerAccount()
{
    const profile = customerProfile || {};
    const accountName = `${profile.firstname || ""} ${profile.lastname || ""}`.trim() || "Your Stockwell profile";
    const accountInitials = accountName === "Your Stockwell profile"
        ? "S"
        : accountName.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
    const savedAddressCount = (profile.addresses || []).length;
    const content = customerProfileStatus === "loading"
        ? '<section class="content-card loading">Loading your account…</section>'
        : customerProfileStatus === "error"
            ? `<section class="content-card"><div class="error-panel">${escapeHtml(customerProfileError)}</div><button class="button secondary" type="button" data-retry-profile>Retry</button></section>`
            : `<section class="account-overview"><span class="account-avatar" aria-hidden="true">${escapeHtml(accountInitials)}</span>
                    <div class="account-overview-identity"><p class="eyebrow">ACCOUNT OVERVIEW</p><strong>${escapeHtml(accountName)}</strong><span>${escapeHtml(profile.email || "Keep your contact details up to date.")}</span></div>
                    <div class="account-overview-count"><strong>${savedAddressCount}</strong><span>saved ${savedAddressCount === 1 ? "address" : "addresses"}</span></div>
                </section>
                <div class="account-grid">
                <section class="content-card account-card account-profile-card">
                    <header class="account-card-header"><span class="account-section-icon" aria-hidden="true">${icon("customers")}</span><div><h2>Personal information</h2><p>Keep your contact details up to date.</p></div></header>
                <form id="customer-profile-form"><div class="form-grid">
                    <div class="form-group"><label for="profile-firstname">First name</label><input class="form-field" id="profile-firstname" name="firstname" maxlength="100" required value="${escapeHtml(profile.firstname)}"></div>
                    <div class="form-group"><label for="profile-lastname">Last name</label><input class="form-field" id="profile-lastname" name="lastname" maxlength="100" required value="${escapeHtml(profile.lastname)}"></div>
                    <div class="form-group full"><label for="profile-email">Email</label><input class="form-field" id="profile-email" name="email" type="email" maxlength="150" required value="${escapeHtml(profile.email)}"></div>
                    <div class="form-group full"><label for="profile-phone">Phone</label><input class="form-field" id="profile-phone" name="phone" type="tel" maxlength="40" value="${escapeHtml(profile.phone)}"></div>
                    <div class="form-group full"><label for="profile-address">Default delivery address</label><textarea class="form-field" id="profile-address" name="address" maxlength="500">${escapeHtml(profile.address)}</textarea></div>
                </div><div class="account-form-footer"><p class="form-error" id="profile-error" role="alert"></p><button class="button" type="submit">Save changes <span aria-hidden="true">→</span></button></div></form></section>
                <section class="content-card account-card account-address-card">
                    <header class="account-card-header"><span class="account-section-icon address-icon" aria-hidden="true">${icon("purchases")}</span><div><h2>Delivery addresses</h2><p>Choose an address for a faster checkout.</p></div><span class="account-section-count">${savedAddressCount}</span></header>
                    ${(profile.addresses || []).length ? `<div class="saved-address-list">${profile.addresses.map((address) => `<article class="saved-address"><div class="saved-address-copy"><div class="saved-address-title"><strong>${escapeHtml(address.label)}</strong>${Number(address.is_default) ? '<span class="address-default-badge">Default</span>' : ""}</div><p class="saved-address-recipient">${escapeHtml(address.recipient_name)} <span>·</span> ${escapeHtml(address.phone)}</p><p class="saved-address-location">${escapeHtml(address.address)}</p></div><div class="saved-address-actions">${Number(address.is_default) ? "" : `<button class="button secondary" type="button" data-default-address="${address.id}">Set as default</button>`}<button class="button danger" type="button" data-delete-address="${address.id}">Remove</button></div></article>`).join("")}</div>` : '<div class="account-empty-address"><span class="account-empty-icon" aria-hidden="true">+</span><div><strong>No saved addresses yet</strong><p>Add a delivery address below to make checkout quicker.</p></div></div>'}
                    <form id="customer-address-form" class="address-form"><div class="address-form-heading"><div><h3>Add a new address</h3><p>Save another place for your deliveries.</p></div></div><div class="form-grid">
                        <div class="form-group"><label for="address-label">Label</label><input class="form-field" id="address-label" name="label" maxlength="80" placeholder="Home, Work" required></div>
                        <div class="form-group"><label for="address-recipient">Recipient name</label><input class="form-field" id="address-recipient" name="recipient_name" maxlength="160" required></div>
                        <div class="form-group full"><label for="address-phone">Phone</label><input class="form-field" id="address-phone" name="phone" type="tel" maxlength="40" required></div>
                        <div class="form-group full"><label for="address-text">Address</label><textarea class="form-field" id="address-text" name="address" maxlength="500" required></textarea></div>
                        <label class="checkbox-label"><input type="checkbox" name="is_default" value="1"> Make this my default address</label>
                    </div><div class="account-form-footer"><p class="form-error" id="address-error" role="alert"></p><button class="button" type="submit">Save address <span aria-hidden="true">→</span></button></div></form></section></div>`;
    renderMarkup(`<div class="shop-toolbar"><div><p class="eyebrow">YOUR ACCOUNT</p><h1>My account</h1><p class="subtitle">Manage profile and saved delivery addresses.</p></div>
        <nav class="shop-nav" aria-label="Customer navigation"><a class="shop-nav-link" href="#shop">Shop</a><a class="shop-nav-link" href="#my-orders">My orders</a><a class="shop-nav-link active" href="#account">My account</a></nav></div>${content}`);
}

function cartStorageKey()
{
    return `stockwell-customer-cart-${Number(currentUser?.id) || 0}`;
}

function saveShopCart()
{
    if (!currentUser?.id) return;
    try {
        window.localStorage.setItem(cartStorageKey(), JSON.stringify(shopCart));
    } catch (error) {
        showToast(`Your cart could not be saved on this device: ${error.message}`, true);
    }
}

function restoreShopCart()
{
    if (!currentUser?.id) return;
    try {
        const saved = JSON.parse(window.localStorage.getItem(cartStorageKey()) || "{}");
        shopCart = saved && typeof saved === "object" && !Array.isArray(saved)
            ? Object.fromEntries(Object.entries(saved)
                .filter(([id, quantity]) => /^[1-9]\d*$/.test(id) && Number.isInteger(Number(quantity)) && Number(quantity) > 0)
                .map(([id, quantity]) => [id, Number(quantity)]))
            : {};
    } catch (error) {
        shopCart = {};
        showToast(`Saved cart data could not be read: ${error.message}`, true);
    }
}

async function loadCustomerProfile()
{
    customerProfileStatus = "loading";
    if (currentRoute() === "account") renderCustomerAccount();
    try {
        const result = await request(`${API_ROOT}/shop/profile`);
        customerProfile = result.data;
        customerProfileStatus = "ready";
        customerProfileError = "";
    } catch (error) {
        customerProfileStatus = "error";
        customerProfileError = error.message;
    }
    if (currentUser?.role === "customer" && currentRoute() === "account") renderCustomerAccount();
    if (currentUser?.role === "customer" && currentRoute() === "shop") renderShop();
}

async function showProductDetails(id, purchasedProduct = null)
{
    const product = shopProducts.find((item) => String(item.id) === String(id)) || purchasedProduct;
    if (!product) return;
    const openedFromOrder = purchasedProduct !== null;
    modalRoot.innerHTML = '<div class="modal-backdrop"><section class="modal"><div class="loading">Loading product details and reviews…</div></section></div>';
    let reviewData;
    try {
        const result = await request(`${API_ROOT}/shop/products/${encodeURIComponent(id)}/reviews`);
        reviewData = result.data;
    } catch (error) {
        modalRoot.innerHTML = "";
        showToast(`Product reviews could not be loaded: ${error.message}`, true);
        return;
    }
    if (!modalRoot.querySelector(".modal")) return;
    const reviews = Array.isArray(reviewData.reviews) ? reviewData.reviews : [];
    const reviewRows = reviews.length
        ? reviews.map((review) => `<article class="product-review"><div class="review-heading"><strong>${escapeHtml(review.title)}</strong><span aria-label="${Number(review.rating)} out of 5 stars">${"★".repeat(Number(review.rating))}${"☆".repeat(5 - Number(review.rating))}</span></div>
            <p>${escapeHtml(review.review)}</p><small>Verified purchase · ${escapeHtml(formatCustomerDate(review.created_at))}</small></article>`).join("")
        : '<p class="cart-empty">No reviews yet. Verified buyers can share their experience here.</p>';
    const ownReview = reviewData.own_review || {};
    const reviewForm = reviewData.can_review
        ? `<form id="customer-review-form" data-product-id="${Number(product.id)}" data-purchased-context="${openedFromOrder ? "true" : "false"}" data-product-name="${escapeHtml(product.product_name)}" data-product-image="${escapeHtml(product.image_url || "")}" data-product-category="${escapeHtml(product.category || "")}" data-unit-price="${Number(purchasedProduct?.unit_price ?? product.price ?? 0)}" data-purchased-quantity="${Number(purchasedProduct?.quantity ?? 0)}"><h4>${ownReview.id ? "Update your review" : "Write a review"}</h4>
            <div class="form-group"><label for="review-rating">Rating</label><select class="form-field" id="review-rating" name="rating" required>${[5, 4, 3, 2, 1].map((rating) => `<option value="${rating}" ${Number(ownReview.rating || 5) === rating ? "selected" : ""}>${rating} out of 5 stars</option>`).join("")}</select></div>
            <div class="form-group"><label for="review-title">Title</label><input class="form-field" id="review-title" name="title" maxlength="160" required value="${escapeHtml(ownReview.title || "")}"></div>
            <div class="form-group"><label for="review-text">Your review</label><textarea class="form-field" id="review-text" name="review" maxlength="2000" required>${escapeHtml(ownReview.review || "")}</textarea></div>
            <p class="form-error" id="customer-review-error" role="alert"></p><button class="button" type="submit">${ownReview.id ? "Save changes" : "Submit review"}</button></form>`
        : currentUser?.role === "customer"
            ? '<p class="product-description">A delivered or completed purchase is required to review this item.</p>'
            : '<p class="product-description">Sign in with a customer account after delivery to leave a verified review.</p>';
    modalRoot.innerHTML = `<div class="modal-backdrop" data-shop-modal-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="shop-product-title">
        <div class="modal-heading"><div><p class="eyebrow">${escapeHtml(product.category || "STOCKWELL PRODUCT")}</p><h2 id="shop-product-title">${escapeHtml(product.product_name)}</h2></div><button class="modal-close" type="button" data-close-shop-modal aria-label="Close dialog">×</button></div>
        ${productImageMarkup(product, "shop-detail-image")}
        <p>${escapeHtml(product.description || "No additional description is available.")}</p>
        <dl class="product-specifications"><div><dt>${openedFromOrder ? "Paid price" : "Price"}</dt><dd>${money(openedFromOrder ? purchasedProduct.unit_price : product.price)}</dd></div><div><dt>${openedFromOrder ? "Purchased" : "Availability"}</dt><dd>${openedFromOrder ? `${Number(purchasedProduct.quantity)} ${Number(purchasedProduct.quantity) === 1 ? "unit" : "units"}` : `${Number(product.quantity)} in stock`}</dd></div>
        <div><dt>Category</dt><dd>${escapeHtml(product.category || "—")}</dd></div><div><dt>SKU</dt><dd>${escapeHtml(product.sku || "—")}</dd></div>
        <div><dt>Barcode</dt><dd>${escapeHtml(product.barcode || "—")}</dd></div></dl>
        <section class="product-reviews"><h3>Customer reviews <span>${Number(reviewData.review_count) ? `★ ${Number(reviewData.average_rating).toFixed(1)} · ${Number(reviewData.review_count)}` : "—"}</span></h3>${reviewForm}<div class="product-review-list">${reviewRows}</div></section>
        <div class="modal-actions"><button class="button secondary" type="button" data-close-shop-modal>Close</button>${openedFromOrder ? "" : `<button class="button" type="button" data-modal-add-cart="${product.id}" ${Number(shopCart[product.id]) >= Number(product.quantity) ? "disabled" : ""}>Add to cart</button>`}</div>
        </section></div>`;
    modalRoot.querySelectorAll("[data-close-shop-modal]").forEach((button) => button.addEventListener("click", () => { modalRoot.innerHTML = ""; }));
    modalRoot.querySelector("[data-modal-add-cart]")?.addEventListener("click", () => {
        const productId = String(product.id);
        if (Number(shopCart[productId] || 0) >= Number(product.quantity)) return;
        shopCart[productId] = Number(shopCart[productId] || 0) + 1;
        saveShopCart();
        modalRoot.innerHTML = "";
        renderShop();
    });
    modalRoot.querySelector("[data-shop-modal-backdrop]").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) modalRoot.innerHTML = "";
    });
}

async function showCustomerOrderDetails(id)
{
    modalRoot.innerHTML = '<div class="modal-backdrop"><section class="modal"><div class="loading">Loading order details…</div></section></div>';
    try {
        const result = await request(`${API_ROOT}/shop/orders/${encodeURIComponent(id)}`);
        const order = result.data;
        const steps = ["pending", "processing", "ready_to_ship", "shipped", "delivered"];
        const cancelled = order.status === "cancelled";
        const statusIndex = order.status === "completed" ? steps.length - 1 : steps.indexOf(order.status);
        const timeline = cancelled
            ? `<ol class="order-timeline"><li class="timeline-current"><strong>Cancelled</strong><small>Stock reservation released</small></li></ol>`
            : `<ol class="order-timeline">${steps.map((step, index) => `<li class="${index < statusIndex ? "timeline-done" : index === statusIndex ? "timeline-current" : ""}"><strong>${escapeHtml(orderStatusLabel(step))}</strong>${index === statusIndex ? "<small>Current status</small>" : ""}</li>`).join("")}</ol>`;
        modalRoot.innerHTML = `<div class="modal-backdrop" data-order-modal-backdrop><section class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="customer-order-title">
            <div class="modal-heading"><div><p class="eyebrow">ORDER #${order.id}</p><h2 id="customer-order-title">Order details</h2><p>${escapeHtml(order.created_at)}</p></div><button class="modal-close" type="button" data-close-order-modal aria-label="Close dialog">×</button></div>
            <div class="order-timeline-wrap"><h3>Fulfillment progress</h3>${timeline}</div>
            <dl class="sale-payment-summary"><div><dt>Status</dt><dd>${escapeHtml(orderStatusLabel(order.status))}</dd></div><div><dt>Payment</dt><dd>${escapeHtml(paymentStatusLabel(order.payment_status))} · ${paymentMethodLabel(order.payment_method, true)}</dd></div>
            <div><dt>Recipient</dt><dd>${escapeHtml(order.delivery_name || "—")}</dd></div><div><dt>Phone</dt><dd>${escapeHtml(order.delivery_phone || "—")}</dd></div>
            <div><dt>Address</dt><dd>${escapeHtml(order.delivery_address || "—")}</dd></div><div><dt>Delivery notes</dt><dd>${escapeHtml(order.delivery_notes || "—")}</dd></div>
            <div><dt>Courier</dt><dd>${escapeHtml(order.courier || "—")}</dd></div><div><dt>Tracking number</dt><dd>${escapeHtml(order.tracking_number || "—")}</dd></div>
            <div><dt>Estimated delivery</dt><dd>${escapeHtml(order.estimated_delivery_at ? formatCustomerDate(order.estimated_delivery_at) : "Not provided yet")}</dd></div>
            <div><dt>Courier tracking</dt><dd>${order.tracking_url ? `<a href="${escapeHtml(order.tracking_url)}" target="_blank" rel="noopener noreferrer">Open ${escapeHtml(order.courier || "courier")} tracking ↗</a>` : "Tracking link not available yet."}</dd></div>
            ${order.payment_method === "gcash" && order.gcash_payment_reference ? `<div><dt>GCash reference</dt><dd>${escapeHtml(order.gcash_payment_reference)} · ${order.payment_status === "paid" ? "Verified" : "Awaiting admin verification"}</dd></div>` : ""}</dl>
            ${showManualGcash ? `<section class="content-card"><h3>Pay with GCash</h3><p>Transfer exactly <strong>${money(order.total)}</strong> to the account below. Submit the transaction reference after sending. The order stays unpaid until the store verifies the transfer.</p>
            <div class="customer-gcash-payment"><img src="${escapeHtml(manualGcashDetails.qr_image_url)}" alt="GCash payment QR code" loading="lazy"><div><p><strong>Account name</strong><br>${escapeHtml(manualGcashDetails.account_name)}</p><p><strong>GCash number</strong><br>${escapeHtml(manualGcashDetails.account_number)}</p></div></div>
            <form id="gcash-payment-reference-form" data-id="${escapeHtml(order.id)}"><div class="form-group"><label for="gcash-payment-reference">GCash transaction reference</label><input class="form-field" id="gcash-payment-reference" name="reference" minlength="6" maxlength="100" required value="${escapeHtml(order.gcash_payment_reference || "")}" placeholder="Enter the reference from your GCash receipt"></div>
                <p class="product-description">${order.gcash_payment_reference ? "Reference submitted. You may update it while the order remains unpaid." : "Submitting a reference does not automatically confirm payment."}</p><p class="form-error" id="gcash-reference-error" role="alert"></p><button class="button" type="submit">${order.gcash_payment_reference ? "Update reference" : "Submit reference"}</button></form></section>` : ""}
                <div class="table-wrap"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${order.items.map((item) => `<tr><td><div class="product-cell">${productImageMarkup(item, "order-item-thumbnail")}<span class="product-name">${escapeHtml(item.product_name)}</span></div>${["delivered", "completed"].includes(order.status) ? `<button class="button secondary" type="button" data-review-order-product="${Number(item.product_id)}">Leave feedback</button>` : ""}</td><td>${Number(item.quantity)}</td><td>${money(item.unit_price)}</td><td>${money(item.line_total)}</td></tr>`).join("")}</tbody></table></div>
            <dl class="checkout-breakdown order-cost-breakdown"><div><dt>Items</dt><dd>${money(order.subtotal ?? order.total)}</dd></div>
                <div><dt>Delivery · ${escapeHtml(order.delivery_zone || "No delivery area recorded")}</dt><dd>${money(order.delivery_fee)}</dd></div>
                ${Number(order.delivery_discount) > 0 ? `<div><dt>Free delivery discount</dt><dd>−${money(order.delivery_discount)}</dd></div>` : ""}
                <div class="checkout-grand-total"><dt>Order total</dt><dd>${money(order.total)}</dd></div>
                <div><dt>Balance due</dt><dd>${money(Math.max(0, Number(order.total) - Number(order.amount_paid || 0)))}</dd></div></dl>
            <div class="modal-actions"><button class="button secondary" type="button" data-close-order-modal>Close</button><button class="button" type="button" data-print-order-receipt>Print receipt / Save as PDF</button></div>
            </section></div>`;
        modalRoot.querySelectorAll("[data-close-order-modal]").forEach((button) => button.addEventListener("click", closeBusinessModal));
        modalRoot.querySelector("[data-print-order-receipt]")?.addEventListener("click", () => printCustomerReceipt(order));
        modalRoot.querySelectorAll("[data-review-order-product]").forEach((button) => {
            button.addEventListener("click", () => {
                const item = order.items.find((orderItem) => String(orderItem.product_id) === button.dataset.reviewOrderProduct);
                if (item) showProductDetails(item.product_id, item);
            });
        });
        modalRoot.querySelector("[data-order-modal-backdrop]").addEventListener("click", (event) => {
            if (event.target === event.currentTarget) closeBusinessModal();
        });
        const showManualGcash = order.payment_method === "gcash"
            && order.payment_status === "unpaid"
            && !cancelled
            && manualGcashDetails;
    } catch (error) {
        closeBusinessModal();
        showToast(error.message, true);
    }
}

function printCustomerReceipt(order, printWindow = window.open("", "_blank"))
{
    if (!printWindow) {
        showToast("Allow pop-ups for Stockwell to print or save this receipt as PDF.", true);
        return;
    }
    const itemRows = order.items.map((item) => `<tr><td>${escapeHtml(item.product_name)}</td><td>${Number(item.quantity)}</td><td>${money(item.unit_price)}</td><td>${money(item.line_total)}</td></tr>`).join("");
    const subtotal = order.subtotal ?? order.total;
    const logoUrl = new URL("stockwell-mark.svg", window.location.href).href;
    printWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Receipt · Order #${Number(order.id)}</title>
        <style>
            *{box-sizing:border-box}body{font:14px/1.5 Arial,sans-serif;color:#25243a;max-width:760px;margin:32px auto;padding:0 20px}
            .brand{display:flex;align-items:center;gap:14px;padding-bottom:20px;border-bottom:2px solid #c4b5fd}
            .brand img{width:52px;height:52px}.brand h1{margin:0;font-size:24px}.brand p{margin:3px 0;color:#6b6b80}
            .heading{display:flex;justify-content:space-between;gap:20px;margin:24px 0}
            .heading h2{margin:0;font-size:20px}.heading p,.meta{margin:4px 0;color:#67677b}.receipt-no{text-align:right}.receipt-no strong{display:block}
            .customer{padding:13px 15px;border-radius:9px;background:#f6f5fb}.customer strong{display:block}
            table{width:100%;border-collapse:collapse;margin:22px 0}
            th{background:#f2f1f8;color:#55546b;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
            th,td{padding:10px 8px;border-bottom:1px solid #e8e7ef;text-align:left}th:last-child,td:last-child{text-align:right}
            .totals{margin-left:auto;max-width:360px}.totals div{display:flex;justify-content:space-between;padding:6px 0}
            .grand{font-size:18px;font-weight:bold;border-top:2px solid #25243a;margin-top:8px;padding-top:12px!important}
            .footer{font-size:12px;margin-top:26px;padding-top:14px;border-top:1px solid #e8e7ef;text-align:center;color:#67677b}
            @page{size:auto;margin:14mm}@media print{body{margin:0 auto;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
        </style></head><body><header class="brand"><img src="${escapeHtml(logoUrl)}" alt="Stockwell logo"><div><h1>Stockwell</h1><p>Inventory &amp; Store</p></div></header>
        <section class="heading"><div><h2>Sales receipt</h2><p>Thank you for your purchase.</p></div><div class="receipt-no"><strong>Order #${Number(order.id)}</strong><span class="meta">${escapeHtml(order.created_at || "Date unavailable")}</span></div></section>
        <p>${escapeHtml(order.created_at)} · ${escapeHtml(order.status)}</p>
        <p class="customer"><strong>Customer / recipient: ${escapeHtml(order.delivery_name || order.party_name || "—")}</strong><span>Phone: ${escapeHtml(order.delivery_phone || "—")}<br>
        <strong>Delivery area:</strong> ${escapeHtml(order.delivery_zone || "—")}<br><strong>Address:</strong> ${escapeHtml(order.delivery_address || "—")}</p>
        <table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
        <div class="totals"><div><span>Items</span><strong>${money(subtotal)}</strong></div>
        <div><span>Delivery fee</span><strong>${money(order.delivery_fee)}</strong></div>
async function submitCustomerGcashReference(form)
{
    const reference = String(new FormData(form).get("reference") || "").trim();
    const errorNode = form.querySelector("#gcash-reference-error");
    const button = form.querySelector('[type="submit"]');
    if (reference.length < 6 || reference.length > 100) {
        errorNode.textContent = "Enter a transaction reference between 6 and 100 characters.";
        return;
    }
    button.disabled = true;
    errorNode.textContent = "";
    try {
        await request(`${API_ROOT}/shop/orders/${encodeURIComponent(form.dataset.id)}/payment-reference`, {
            method: "POST",
            body: JSON.stringify({ reference })
        });
        customerOrdersStatus = "idle";
        await loadCustomerOrders();
        showToast("GCash reference submitted. The store will verify the payment.");
        await showCustomerOrderDetails(form.dataset.id);
    } catch (error) {
        errorNode.textContent = error.message;
        button.disabled = false;
    }
}

        ${Number(order.delivery_discount) > 0 ? `<div><span>Free delivery discount</span><strong>−${money(order.delivery_discount)}</strong></div>` : ""}
        <div class="grand"><span>Total</span><strong>${money(order.total)}</strong></div>
        <div><span>Payment</span><strong>${escapeHtml(paymentStatusLabel(order.payment_status))} · ${paymentMethodLabel(order.payment_method, true)}</strong></div>
        <div><span>Balance due</span><strong>${money(Math.max(0, Number(order.total) - Number(order.amount_paid || 0)))}</strong></div></div>
        <p class="footer">This is a sales receipt, not a tax invoice. Keep it for your records.</p>
        <script>window.onload=()=>window.print();</script></body></html>`);
    printWindow.document.close();
}

async function printOnlineSaleReceiptById(id)
{
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        showToast("Allow pop-ups for Stockwell to print or save this receipt as PDF.", true);
        return;
    }

    try {
        const result = await request(`${API_ROOT}/orders/${encodeURIComponent(id)}`);
        if (!result?.data || !Array.isArray(result.data.items)) {
            throw new Error("The order details are unavailable for printing.");
        }
        printCustomerReceipt(result.data, printWindow);
    } catch (error) {
        printWindow.close();
        showToast(error.message, true);
    }
}

async function updateCustomerAddress(action, id)
{
    try {
        const result = await request(`${API_ROOT}/shop/addresses/${encodeURIComponent(id)}${action === "default" ? "/default" : ""}`, {
            method: action === "default" ? "PATCH" : "DELETE"
        });
        if (Array.isArray(result?.data)) {
            customerProfileStatus = "idle";
            await loadCustomerProfile();
            showToast(action === "default" ? "Default address updated." : "Saved address removed.");
        }
    } catch (error) {
        showToast(error.message, true);
    }
}

async function cancelCustomerOrder(id)
{
    try {
        const result = await request(`${API_ROOT}/shop/orders/${encodeURIComponent(id)}/cancel`, { method: "POST" });
        customerOrdersStatus = "idle";
        shopStatus = "idle";
        showToast(`Order #${id} cancelled. Reserved stock has been released.`);
        if (result?.notification_warning) showToast(result.notification_warning, true);
        await Promise.all([loadCustomerOrders(), loadShopProducts()]);
    } catch (error) {
        showToast(error.message, true);
    }
}

async function loadShopProducts()
{
    shopStatus = "loading";
    deliveryQuoteLoading = true;
    deliveryZonesError = "";
    renderShop();
    try {
        const result = await request(`${API_ROOT}/shop/products`);
        if (!Array.isArray(result?.data)) throw new Error("The store did not return a valid product list.");
        shopProducts = result.data;
        try {
            const zoneResult = await request(`${API_ROOT}/shop/delivery-zones`);
            if (!Array.isArray(zoneResult?.data)) throw new Error("The delivery-area list is invalid.");
            shopDeliveryZones = zoneResult.data;
        } catch (error) {
            shopDeliveryZones = [];
            checkoutDeliveryZoneId = "";
            deliveryZonesError = error.message;
        }
        deliveryQuoteLoading = false;
        for (const [id, quantity] of Object.entries(shopCart)) {
            const product = shopProducts.find((item) => String(item.id) === id);
            if (!product) delete shopCart[id];
            else if (Number(quantity) > Number(product.quantity)) shopCart[id] = Number(product.quantity);
        }
        saveShopCart();
        shopStatus = "ready";
        shopError = "";
    } catch (error) {
        shopStatus = "error";
        deliveryQuoteLoading = false;
        shopError = error.message;
    }
    if (currentUser?.role === "customer" && currentRoute() === "shop") renderShop();
}

async function loadCustomerOrders()
{
    customerOrdersStatus = "loading";
    renderCustomerOrders();
    try {
        const result = await request(`${API_ROOT}/shop/orders`);
        customerOrders = Array.isArray(result?.data) ? result.data : [];
        customerOrdersStatus = "ready";
        customerOrderRefreshError = "";
        shopError = "";
    } catch (error) {
        customerOrdersStatus = "error";
        shopError = error.message;
    }
    await loadCustomerNotifications();
    if (currentUser?.role === "customer" && currentRoute() === "my-orders") renderCustomerOrders();
}

function startCustomerOrderPolling()
{
    if (customerOrderPollingTimer !== null) return;
    customerOrderPollingTimer = window.setInterval(() => {
        if (document.visibilityState === "visible") refreshCustomerOrders();
    }, 5000);
}

function stopCustomerOrderPolling()
{
    if (customerOrderPollingTimer !== null) {
        window.clearInterval(customerOrderPollingTimer);
        customerOrderPollingTimer = null;
    }
}

async function refreshCustomerOrders()
{
    if (customerOrderRefreshInProgress
        || customerOrdersStatus === "loading"
        || currentUser?.role !== "customer"
        || currentRoute() !== "my-orders") return;

    customerOrderRefreshInProgress = true;
    try {
        const [ordersResult, notificationsResult] = await Promise.all([
            request(`${API_ROOT}/shop/orders`),
            request(`${API_ROOT}/shop/notifications`)
        ]);
        if (!Array.isArray(ordersResult?.data) || !Array.isArray(notificationsResult?.data)) {
            throw new Error("The latest order information is invalid.");
        }

        const previousStatuses = new Map(customerOrders.map((order) => [String(order.id), order.status]));
        const changedOrder = ordersResult.data.find((order) =>
            previousStatuses.has(String(order.id)) && previousStatuses.get(String(order.id)) !== order.status
        );
        const previousNotificationIds = new Set(customerNotifications.map((notice) => String(notice.id)));
        const newNotification = notificationsResult.data.find((notice) => !previousNotificationIds.has(String(notice.id)));
        const changed = JSON.stringify(customerOrders) !== JSON.stringify(ordersResult.data)
            || JSON.stringify(customerNotifications) !== JSON.stringify(notificationsResult.data);
        customerOrders = ordersResult.data;
        customerOrdersStatus = "ready";
        customerNotifications = notificationsResult.data;
        customerNotificationsStatus = "ready";
        customerNotificationsError = "";
        customerOrderRefreshError = "";

        if (changed) {
            if (currentUser?.role === "customer" && currentRoute() === "my-orders") {
                if (changedOrder) {
                    showToast(`Order #${changedOrder.id}: ${orderStatusLabel(changedOrder.status)}.`);
                } else if (newNotification) {
                    showToast(`${newNotification.title}: ${newNotification.message}`);
                }
                renderCustomerOrders();
            }
        }
    } catch (error) {
        customerOrderRefreshError = `Could not refresh order updates: ${error.message}`;
        if (currentUser?.role === "customer" && currentRoute() === "my-orders") renderCustomerOrders();
    } finally {
        customerOrderRefreshInProgress = false;
    }
}

async function loadCustomerNotifications()
{
    customerNotificationsStatus = "loading";
    try {
        const result = await request(`${API_ROOT}/shop/notifications`);
        if (!Array.isArray(result?.data)) throw new Error("The order updates response is invalid.");
        customerNotifications = result.data;
        customerNotificationsStatus = "ready";
        customerNotificationsError = "";
    } catch (error) {
        customerNotificationsStatus = "error";
        customerNotificationsError = error.message;
    }
}

async function markCustomerNotificationsRead()
{
    try {
        await request(`${API_ROOT}/shop/notifications/read`, { method: "PATCH" });
        await loadCustomerNotifications();
        if (currentRoute() === "my-orders") renderCustomerOrders();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function loadCustomerReturns()
{
    customerReturnsStatus = "loading";
    renderCustomerReturns();
    try {
        const result = await request(`${API_ROOT}/shop/returns`);
        customerReturns = Array.isArray(result?.data) ? result.data : [];
        customerReturnsStatus = "ready";
        shopError = "";
    } catch (error) {
        customerReturnsStatus = "error";
        shopError = error.message;
    }
    if (currentUser?.role === "customer" && currentRoute() === "returns") renderCustomerReturns();
}

async function openReturnRequestModal(orderId)
{
    modalRoot.innerHTML = '<div class="modal-backdrop"><section class="modal"><div class="loading">Loading eligible order items…</div></section></div>';
    try {
        const result = await request(`${API_ROOT}/shop/orders/${encodeURIComponent(orderId)}`);
        const order = result.data;
        const items = order.items.map((item) => {
            const available = Math.max(0, Number(item.quantity) - Number(item.returned_quantity || 0));
            return `<div class="return-item-row"><label><span>${escapeHtml(item.product_name)} · ${Number(item.quantity)} purchased · ${available} returnable</span>
                <input class="form-field" type="number" min="0" max="${available}" step="1" name="quantity_${item.id}" value="0" ${available ? "" : "disabled"} aria-label="Quantity of ${escapeHtml(item.product_name)} to return"></label></div>`;
        }).join("");
        modalRoot.innerHTML = `<div class="modal-backdrop" data-return-modal-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="return-modal-title">
            <div class="modal-heading"><div><p class="eyebrow">ORDER #${order.id}</p><h2 id="return-modal-title">Request a return</h2><p>Returns are accepted within 14 days of delivery.</p></div><button class="modal-close" type="button" data-close-return aria-label="Close dialog">×</button></div>
            <form id="customer-return-form" data-order-id="${order.id}"><div class="form-group"><label for="return-reason">Reason</label><select class="form-field" id="return-reason" name="reason" required><option value="">Choose a reason</option><option>Damaged item</option><option>Wrong item</option><option>Missing parts</option><option>Changed my mind</option><option>Other</option></select></div>
                <div class="form-group"><label for="return-details">Details <span class="optional-label">Optional</span></label><textarea class="form-field" id="return-details" name="details" maxlength="2000"></textarea></div>
                <fieldset class="return-items"><legend>Items and quantities</legend>${items}</fieldset>
                <p class="form-error" id="return-form-error" role="alert"></p><div class="modal-actions"><button class="button secondary" type="button" data-close-return>Close</button><button class="button" type="submit">Submit request</button></div>
            </form></section></div>`;
        modalRoot.querySelectorAll("[data-close-return]").forEach((button) => button.addEventListener("click", closeBusinessModal));
        modalRoot.querySelector("[data-return-modal-backdrop]").addEventListener("click", (event) => {
            if (event.target === event.currentTarget) closeBusinessModal();
        });
    } catch (error) {
        closeBusinessModal();
        showToast(error.message, true);
    }
}

async function updateReturnStatus(id, status)
{
    const confirmation = status === "received"
        ? "Confirm the returned items have arrived and passed inspection? Inventory stock will increase."
        : status === "refunded"
            ? "Confirm the refund has already been processed outside Stockwell? This only records the refund; it does not send money."
            : `${status === "approved" ? "Approve" : "Reject"} this customer return request?`;
    if (!window.confirm(confirmation)) return;
    try {
        const result = await request(`${API_ROOT}/returns/${encodeURIComponent(id)}`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });
        showToast(status === "received" ? "Returned items received and added to stock." : status === "refunded" ? "Refund recorded." : `Return request ${status}.`);
        if (result?.notification_warning) showToast(result.notification_warning, true);
        await refreshReturnNotifications();
        businessStatus = "idle";
        loadBusiness("returns");
        if (status === "received") loadProducts();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function saveDeliveryZone(id, row)
{
    const payload = {
        area_name: row.querySelector('[name="area_name"]').value.trim(),
        fee: row.querySelector('[name="fee"]').value,
        free_delivery_enabled: row.querySelector('[name="free_delivery_enabled"]').checked,
        free_delivery_minimum: row.querySelector('[name="free_delivery_minimum"]').value || "0",
        is_active: row.querySelector('[name="is_active"]').checked
    };
    const button = row.querySelector("[data-save-delivery-zone]");
    button.disabled = true;
    try {
        const result = await request(`${API_ROOT}/delivery-zones/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        businessData = Array.isArray(result?.data) ? result.data : businessData;
        showToast("Delivery area saved.");
        renderDeliverySettings();
    } catch (error) {
        showToast(error.message, true);
        button.disabled = false;
    }
}

async function request(url, options = {}) {
    const method = String(options.method || "GET").toUpperCase();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (csrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        headers["X-CSRF-Token"] = csrfToken;
    }
    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers
    });
    if (response.status === 204) return null;
    if (!response.ok) {
        let result = null;
        try {
            result = await response.json();
        } catch {
            result = null;
        }
        const error = new Error(result?.error || `Request failed (${response.status}).`);
        error.status = response.status;
        if (response.status === 401 && url.includes("/api/")) {
            authStatus = "unauthenticated";
            currentUser = null;
            render();
            trackAnalyticsPageView();
        }
        throw error;
    }

    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error("The backend returned an invalid JSON response.");
    }
    return result;
}

async function loadProducts() {
    if (authStatus !== "authenticated") return;
    if (!hasAnyPermission(["inventory.manage", "sales.manage", "orders.manage", "purchases.manage"])) {
        products = [];
        apiStatus = "ready";
        render();
        return;
    }
    const previousLowStockIds = new Set(products
        .filter((product) => Number(product.quantity) <= productReorderLevel(product))
        .map((product) => String(product.id)));
    const hadLoadedInventory = apiStatus === "ready";
    apiStatus = "loading";
    apiMessage = "";
    document.querySelector("#connection-label").textContent = "Checking connection…";
    document.querySelector("#connection-dot").classList.remove("offline");
    render();
    try {
        const result = await request(API_PRODUCTS);
        if (!Array.isArray(result?.data)) {
            throw new Error("The backend response did not include a product list.");
        }
        products = result.data;
        apiStatus = "ready";
        const newlyLowStock = hadLoadedInventory
            ? products.filter((product) => Number(product.quantity) <= productReorderLevel(product)
                && !previousLowStockIds.has(String(product.id)))
            : [];
        if (newlyLowStock.length) {
            const names = newlyLowStock.slice(0, 3).map((product) => product.product_name).join(", ");
            const more = newlyLowStock.length > 3 ? ` and ${newlyLowStock.length - 3} more` : "";
            showToast(`Low-stock alert: ${names}${more}.`);
        }
        document.querySelector("#connection-label").textContent = "Connected";
        render();
    } catch (error) {
        if (error.status === 401) return;
        apiStatus = "error";
        apiMessage = error.message;
        document.querySelector("#connection-label").textContent = "Unavailable";
        document.querySelector("#connection-dot").classList.add("offline");
        render();
    }
}

async function checkSession() {
    try {
        const result = await request(`${API_AUTH}/session`);
        csrfToken = typeof result.csrf_token === "string" ? result.csrf_token : "";
        currentUser = result.authenticated ? result.user : null;
        authStatus = currentUser ? "authenticated" : "unauthenticated";
        if (currentUser?.role === "customer" && !["shop", "my-orders", "account", "returns", "reset-password"].includes(currentRoute())) window.location.hash = "#shop";
        if (currentUser?.role === "customer") restoreShopCart();
        render();
        trackAnalyticsPageView();
        startReturnNotificationPolling();
        if (currentUser?.role !== "customer" && currentUser
            && hasAnyPermission(["inventory.manage", "sales.manage", "orders.manage", "purchases.manage"])) await loadProducts();
    } catch (error) {
        authStatus = "unavailable";
        render();
        showToast(`Could not check sign-in status: ${error.message}`, true);
    }
}

async function signOut() {
    try {
        await request(`${API_AUTH}/logout`, { method: "POST" });
        csrfToken = "";
        stopCustomerOrderPolling();
        customerOrderRefreshInProgress = false;
        customerOrderRefreshError = "";
        if (returnNotificationTimer !== null) window.clearInterval(returnNotificationTimer);
        returnNotificationTimer = null;
        if (adminNotificationTimer !== null) window.clearInterval(adminNotificationTimer);
        adminNotificationTimer = null;
        currentUser = null;
        pendingReturnRequests = [];
        previousPendingReturnIds = null;
        returnNotificationError = "";
        pendingAdminOrders = [];
        pendingAdminOrderCount = 0;
        previousAdminOrderIds = null;
        previousAdminPaymentEventIds = null;
        unpaidAdminOrderCount = 0;
        outstandingAdminBalance = 0;
        adminNotificationError = "";
        updateReturnNotificationBadge();
        updateAdminOrderNotificationBadge();
        products = [];
        shopProducts = [];
        shopCart = {};
        shopStatus = "idle";
        customerOrders = [];
        customerOrdersStatus = "idle";
        customerNotifications = [];
        customerNotificationsStatus = "idle";
        customerNotificationsError = "";
        customerProfile = null;
        customerProfileStatus = "idle";
        apiStatus = "loading";
        authStatus = "unauthenticated";
        render();
    } catch (error) {
        showToast(error.message, true);
    }
}

function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " error" : ""}`;
    toast.textContent = message;
    toastRegion.append(toast);
    window.setTimeout(() => toast.remove(), 3500);
}

async function openProductModal(product = null) {
    const editing = Boolean(product);
    modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal-heading"><div><h2 id="modal-title">${editing ? "Edit product" : "Add product"}</h2>
                <p>${editing ? "Update product information and stock." : "Add a product to your inventory catalog."}</p></div>
                <button class="modal-close" type="button" data-close-modal aria-label="Close dialog">×</button></div>
            <form id="product-form" novalidate>
                <div class="form-grid">
                    <div class="form-group full"><label for="product-name">Product name</label>
                        <input class="form-field" id="product-name" name="product_name" maxlength="255" required value="${escapeHtml(product?.product_name || "")}"></div>
                    <div class="form-group"><label for="product-category">Category</label><input class="form-field" id="product-category" name="category" maxlength="120" value="${escapeHtml(product?.category || "")}" placeholder="e.g. Accessories"></div>
                    <div class="form-group"><label for="product-sku">SKU</label><input class="form-field" id="product-sku" name="sku" maxlength="80" value="${escapeHtml(product?.sku || "")}" placeholder="e.g. LAP-001"></div>
                    <div class="form-group"><label for="product-barcode">Barcode</label><input class="form-field" id="product-barcode" name="barcode" maxlength="80" value="${escapeHtml(product?.barcode || "")}"></div>
                    <div class="form-group"><label for="product-reorder">Reorder level</label><input class="form-field" id="product-reorder" name="reorder_level" type="number" min="0" step="1" value="${escapeHtml(product?.reorder_level ?? 5)}"></div>
                    <div class="form-group"><label for="product-supplier">Supplier company</label><select class="form-field" id="product-supplier" name="supplier_id"><option value="">No supplier linked</option></select></div>
                    <div class="form-group full"><label for="product-description">Description</label>
                        <textarea class="form-field" id="product-description" name="description">${escapeHtml(product?.description || "")}</textarea></div>
                    <div class="form-group full"><label for="product-image-url">Product image URL <span class="optional-label">Optional · HTTP or HTTPS</span></label>
                        <input class="form-field" id="product-image-url" name="image_url" type="url" maxlength="1000" value="${escapeHtml(product?.image_url || "")}" placeholder="https://example.com/product.jpg"></div>
                    ${editing ? `<div class="form-group full"><label for="product-image-file">Upload a product photo</label><div class="image-upload-row"><input class="form-field" id="product-image-file" type="file" accept="image/jpeg,image/png,image/webp"><button class="button secondary" id="upload-product-image" type="button">Upload image</button></div><small class="product-description">JPG, PNG, or WebP · max 5 MB. Uploading replaces this product’s current image.</small><img class="admin-product-image-preview" id="product-image-preview" ${product?.image_url ? `src="${escapeHtml(product.image_url)}"` : ""} alt="${escapeHtml(product?.product_name || "Product")} preview" ${product?.image_url ? "" : "hidden"}><p class="form-error" id="image-upload-error" role="alert"></p></div>` : ""}
                    <div class="form-group"><label for="product-price">Unit price (PHP)</label>
                        <input class="form-field" id="product-price" name="price" type="number" min="0.01" step="0.01" required value="${escapeHtml(product?.price ?? "")}"></div>
                    <div class="form-group"><label for="product-estimated-cost">Estimated unit cost (PHP)</label>
                        <input class="form-field" id="product-estimated-cost" name="estimated_unit_cost" type="number" min="0.01" step="0.01" value="${escapeHtml(product?.estimated_unit_cost ?? "")}">
                        <small class="product-description">Unverified demo estimate using 65% of retail price. This estimate takes priority over demo purchase records; replace it with a verified cost when available.</small></div>
                    <div class="form-group"><label for="product-quantity">Quantity</label>
                        <input class="form-field" id="product-quantity" name="quantity" type="number" min="0" step="1" required value="${escapeHtml(product?.quantity ?? 0)}" ${editing ? "readonly" : ""}>
                        ${editing ? '<small class="product-description">Use Adjust stock to record a quantity change and its reason.</small>' : ""}</div>
                </div>
                <p class="form-error" id="form-error" role="alert"></p>
                <div class="modal-actions"><button class="button secondary" type="button" data-close-modal>Cancel</button>
                    <button class="button" type="submit">${editing ? "Save changes" : "Add product"}</button></div>
            </form>
        </section>
    </div>`;

    const imagePreview = modalRoot.querySelector("#product-image-preview");
    if (product?.image_url && imagePreview) imagePreview.src = resolveProductImageUrl(product.image_url);
    const form = modalRoot.querySelector("#product-form");
    modalRoot.querySelector("#product-name").focus();

    try {
        const supplierResult = await request(`${API_ROOT}/suppliers`);
        const suppliers = supplierResult.data || [];
        const supplierSelect = modalRoot.querySelector("#product-supplier");
        if (supplierSelect) supplierSelect.innerHTML = `<option value="">No supplier linked</option>${suppliers.map((supplier) => `<option value="${escapeHtml(supplier.id)}" ${String(supplier.id) === String(product?.supplier_id || "") ? "selected" : ""}>${escapeHtml(supplier.name)}</option>`).join("")}`;
    } catch (error) {
        showToast("Supplier list could not be loaded.", true);
    }

    modalRoot.querySelectorAll("[data-close-modal]").forEach((button) => {
        button.addEventListener("click", closeProductModal);
    });
    modalRoot.querySelector("[data-backdrop]").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeProductModal();
    });
    modalRoot.querySelector("#upload-product-image")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        const fileInput = modalRoot.querySelector("#product-image-file");
        const errorNode = modalRoot.querySelector("#image-upload-error");
        const file = fileInput.files?.[0];
        errorNode.textContent = "";
        if (!file) {
            errorNode.textContent = "Choose a photo to upload.";
            return;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
            errorNode.textContent = "Choose a JPG, PNG, or WebP image smaller than 5 MB.";
            return;
        }
        const uploadData = new FormData();
        uploadData.append("image", file);
        button.disabled = true;
        try {
            const response = await fetch(`${API_PRODUCTS}/${encodeURIComponent(product.id)}/image`, {
                method: "POST",
                body: uploadData,
                credentials: "include",
                headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {}
            });
            let result;
            try {
                result = await response.json();
            } catch {
                throw new Error("The backend returned an invalid image upload response.");
            }
            if (!response.ok) throw new Error(result?.error || `Image upload failed (${response.status}).`);
            modalRoot.querySelector("#product-image-url").value = result.data.image_url || "";
            const preview = modalRoot.querySelector("#product-image-preview");
            preview.src = result.data.image_url ? resolveProductImageUrl(result.data.image_url) : "";
            preview.hidden = !result.data.image_url;
            fileInput.value = "";
            showToast("Product photo uploaded.");
        } catch (error) {
            errorNode.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    });
    modalRoot.querySelector(".modal").addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeProductModal();
    });
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = {
            product_name: String(formData.get("product_name") || "").trim(),
            description: String(formData.get("description") || "").trim(),
            price: Number(formData.get("price")),
            quantity: Number(formData.get("quantity")),
            estimated_unit_cost: formData.get("estimated_unit_cost") === "" ? null : Number(formData.get("estimated_unit_cost")),
            category: String(formData.get("category") || "").trim(), sku: String(formData.get("sku") || "").trim(), barcode: String(formData.get("barcode") || "").trim(), reorder_level: Number(formData.get("reorder_level")), supplier_id: Number(formData.get("supplier_id")) || null,
            image_url: String(formData.get("image_url") || "").trim()
        };
        const errorNode = modalRoot.querySelector("#form-error");
        if (!payload.product_name || !Number.isFinite(payload.price) || payload.price <= 0
            || (payload.estimated_unit_cost !== null && (!Number.isFinite(payload.estimated_unit_cost) || payload.estimated_unit_cost <= 0))
            || !Number.isInteger(payload.quantity) || payload.quantity < 0 || !Number.isInteger(payload.reorder_level) || payload.reorder_level < 0) {
            errorNode.textContent = "Enter a product name, a positive price, and a whole-number quantity of zero or more.";
            return;
        }

        const submitButton = form.querySelector('[type="submit"]');
        submitButton.disabled = true;
        try {
            if (editing) {
                await request(`${API_PRODUCTS}/${encodeURIComponent(product.id)}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
                showToast("Product updated.");
            } else {
                await request(API_PRODUCTS, { method: "POST", body: JSON.stringify(payload) });
                showToast("Product added.");
            }
            closeProductModal();
            await loadProducts();
        } catch (error) {
            errorNode.textContent = error.message;
            submitButton.disabled = false;
        }
    });
}

function closeProductModal() {
    modalRoot.innerHTML = "";
}

function openStockAdjustmentModal(id) {
    const product = products.find((item) => String(item.id) === String(id));
    if (!product) {
        showToast("Product not found. Refresh inventory and try again.", true);
        return;
    }
    modalRoot.innerHTML = `<div class="modal-backdrop" data-stock-modal-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="stock-adjustment-title">
        <div class="modal-heading"><div><h2 id="stock-adjustment-title">Adjust stock</h2><p>${escapeHtml(product.product_name)} · currently ${Number(product.quantity) || 0} units</p></div>
            <button class="modal-close" type="button" data-close-stock-modal aria-label="Close dialog">×</button></div>
        <form id="stock-adjustment-form" data-product-id="${escapeHtml(product.id)}">
            <div class="form-group"><label for="stock-quantity-change">Quantity change</label><input class="form-field" id="stock-quantity-change" name="quantity_change" type="number" min="-1000000" max="1000000" step="1" required placeholder="Example: 5 or -2"></div>
            <small class="product-description">Use a positive number to add stock or a negative number to remove stock.</small>
            <div class="form-group stock-adjustment-reason"><label for="stock-adjustment-reason">Reason</label><input class="form-field" id="stock-adjustment-reason" name="reason" maxlength="255" required placeholder="Example: damaged items or count correction"></div>
            <p class="form-error" id="stock-adjustment-error" role="alert"></p>
            <div class="modal-actions"><button class="button secondary" type="button" data-close-stock-modal>Cancel</button><button class="button" type="submit">Save adjustment</button></div>
        </form></section></div>`;
    modalRoot.querySelectorAll("[data-close-stock-modal]").forEach((button) => button.addEventListener("click", closeProductModal));
    modalRoot.querySelector("[data-stock-modal-backdrop]").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeProductModal();
    });
    const form = modalRoot.querySelector("#stock-adjustment-form");
    form.querySelector("#stock-quantity-change").focus();
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = {
            quantity_change: Number(formData.get("quantity_change")),
            reason: String(formData.get("reason") || "").trim()
        };
        const errorNode = form.querySelector("#stock-adjustment-error");
        const button = form.querySelector('[type="submit"]');
        if (!Number.isInteger(payload.quantity_change) || payload.quantity_change === 0 || !payload.reason) {
            errorNode.textContent = "Enter a non-zero whole-number change and a reason.";
            return;
        }
        button.disabled = true;
        try {
            const result = await request(`${API_PRODUCTS}/${encodeURIComponent(product.id)}/stock-adjustments`, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            closeProductModal();
            await loadProducts();
            showToast(`Stock adjusted: ${result.data.quantity_before} → ${result.data.quantity_after}.`);
        } catch (error) {
            errorNode.textContent = error.message;
            button.disabled = false;
        }
    });
}

async function openStockHistoryModal(productId = null) {
    const product = productId === null
        ? null
        : products.find((item) => String(item.id) === String(productId));
    modalRoot.innerHTML = `<div class="modal-backdrop" data-stock-history-backdrop><section class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="stock-history-title">
        <div class="modal-heading"><div><h2 id="stock-history-title">Stock adjustment history</h2><p>${product ? escapeHtml(product.product_name) : "Latest recorded manual stock changes"} · up to 100 records</p></div>
            <button class="modal-close" type="button" data-close-stock-history aria-label="Close dialog">×</button></div>
        <div class="loading">Loading stock history…</div></section></div>`;
    modalRoot.querySelectorAll("[data-close-stock-history]").forEach((button) => button.addEventListener("click", closeProductModal));
    modalRoot.querySelector("[data-stock-history-backdrop]").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeProductModal();
    });
    try {
        const query = product ? `?product_id=${encodeURIComponent(product.id)}` : "";
        const result = await request(`${API_ROOT}/stock-adjustments${query}`);
        if (!Array.isArray(result?.data)) throw new Error("The stock history response was invalid.");
        const modal = modalRoot.querySelector(".modal");
        if (!modal) return;
        modal.innerHTML = `<div class="modal-heading"><div><h2 id="stock-history-title">Stock adjustment history</h2><p>${product ? escapeHtml(product.product_name) : "Latest recorded manual stock changes"} · up to 100 records</p></div>
            <button class="modal-close" type="button" data-close-stock-history aria-label="Close dialog">×</button></div>
            ${result.data.length ? `<div class="table-wrap stock-history-table"><table><thead><tr><th>Date</th><th>Product</th><th>Change</th><th>Before → after</th><th>Reason</th><th>Adjusted by</th></tr></thead><tbody>
                ${result.data.map((record) => `<tr><td>${escapeHtml(record.created_at || "")}</td><td>${escapeHtml(record.product_name)}</td><td class="${Number(record.quantity_change) > 0 ? "movement-in" : "movement-out"}">${Number(record.quantity_change) > 0 ? "+" : ""}${Number(record.quantity_change)}</td><td>${Number(record.quantity_before)} → ${Number(record.quantity_after)}</td><td>${escapeHtml(record.reason)}</td><td>${escapeHtml(record.actor_name)}</td></tr>`).join("")}
            </tbody></table></div>` : '<div class="empty-state"><strong>No manual stock adjustments yet</strong><p>Changes made with Adjust stock will appear here.</p></div>'}
            <div class="modal-actions"><button class="button secondary" type="button" data-close-stock-history>Close</button></div>`;
        modal.querySelectorAll("[data-close-stock-history]").forEach((button) => button.addEventListener("click", closeProductModal));
    } catch (error) {
        const modal = modalRoot.querySelector(".modal");
        if (modal) modal.innerHTML = `<div class="modal-heading"><div><h2 id="stock-history-title">Stock adjustment history</h2></div><button class="modal-close" type="button" data-close-stock-history aria-label="Close dialog">×</button></div><p class="error-panel">${escapeHtml(error.message)}</p><div class="modal-actions"><button class="button secondary" type="button" data-close-stock-history>Close</button></div>`;
        modalRoot.querySelectorAll("[data-close-stock-history]").forEach((button) => button.addEventListener("click", closeProductModal));
    }
}

async function openProductDetails(id) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="loading">Loading product details…</div></section></div>`;
    modalRoot.querySelector("[data-backdrop]").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeProductModal();
    });

    try {
        const result = await request(`${API_PRODUCTS}/${encodeURIComponent(id)}`);
        const product = result?.data;
        if (!product) throw new Error("The backend did not return this product.");
        if (!modalRoot.querySelector(".modal")) return;
        modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop>
            <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-heading"><div><p class="eyebrow">Product details</p><h2 id="modal-title">${escapeHtml(product.product_name)}</h2>
                    <p>Record #${escapeHtml(product.id)}</p></div><button class="modal-close" type="button" data-close-modal aria-label="Close dialog">×</button></div>
                <dl class="details-grid">
                    <div><dt>Description</dt><dd>${escapeHtml(product.description || "No description")}</dd></div>
                    <div><dt>Unit price</dt><dd>${money(product.price)}</dd></div>
                    <div><dt>Category</dt><dd>${escapeHtml(product.category || "Not set")}</dd></div>
                    <div><dt>SKU / Barcode</dt><dd>${escapeHtml(product.sku || "—")} / ${escapeHtml(product.barcode || "—")}</dd></div>
                    <div><dt>Quantity on hand</dt><dd>${Number(product.quantity) || 0} units</dd></div>
                    <div><dt>Reorder level</dt><dd>${productReorderLevel(product)} units</dd></div>
                    <div><dt>Stock status</dt><dd>${stockStatus(Number(product.quantity) || 0, productReorderLevel(product))}</dd></div>
                    <div><dt>Created</dt><dd>${escapeHtml(product.created_at || "Not available")}</dd></div>
                </dl>
                <div class="modal-actions"><button class="button secondary" type="button" data-close-modal>Close</button>
                    <button class="button secondary" type="button" data-detail-adjust-stock="${escapeHtml(product.id)}">Adjust stock</button>
                    <button class="button" type="button" data-detail-edit="${escapeHtml(product.id)}">Edit product</button></div>
            </section></div>`;
        modalRoot.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeProductModal));
        modalRoot.querySelector("[data-backdrop]").addEventListener("click", (event) => {
            if (event.target === event.currentTarget) closeProductModal();
        });
        modalRoot.querySelector("[data-detail-adjust-stock]").addEventListener("click", () => openStockAdjustmentModal(product.id));
        modalRoot.querySelector("[data-detail-edit]").addEventListener("click", () => openProductModal(product));
    } catch (error) {
        closeProductModal();
        showToast(error.message, true);
    }
}

async function deleteProduct(id) {
    const product = products.find((item) => String(item.id) === String(id));
    if (!product || !window.confirm(`Delete "${product.product_name}" from the inventory?`)) return;

    try {
        await request(`${API_PRODUCTS}/${encodeURIComponent(id)}`, { method: "DELETE" });
        showToast("Product deleted.");
        await loadProducts();
    } catch (error) {
        showToast(error.message, true);
    }
}

function openContactModal(route, record = null) {
    const isCustomer = route === "customers";
    const label = isCustomer ? "customer" : "supplier company";
    modalRoot.innerHTML = `<div class="modal-backdrop" data-business-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="business-modal-title">
        <div class="modal-heading"><div><h2 id="business-modal-title">${record ? "Edit" : "Add"} ${label}</h2><p>${isCustomer ? "Contact details are stored in the business database." : "Use the registered company name and business details."}</p></div>
        <button class="modal-close" type="button" data-close-business aria-label="Close dialog">×</button></div>
        <form id="contact-form" data-route="${route}" data-id="${record?.id || ""}" novalidate>
            <div class="form-grid">
                <div class="form-group full"><label for="contact-name">${isCustomer ? "Name" : "Company name"}</label><input class="form-field" id="contact-name" name="name" maxlength="160" required placeholder="${isCustomer ? "" : "e.g. Unilever Philippines, Inc."}" value="${escapeHtml(record?.name || "")}"></div>
                <div class="form-group"><label for="contact-email">Email</label><input class="form-field" id="contact-email" name="email" type="email" maxlength="190" value="${escapeHtml(record?.email || "")}"></div>
                ${isCustomer ? `<div class="form-group"><label for="contact-phone">Phone</label><input class="form-field" id="contact-phone" name="phone" maxlength="40" value="${escapeHtml(record?.phone || "")}"></div>` : ""}
                <div class="form-group full"><label for="contact-address">Address</label><input class="form-field" id="contact-address" name="address" maxlength="500" value="${escapeHtml(record?.address || "")}"></div>
                <div class="form-group full"><label for="contact-notes">Notes</label><textarea class="form-field" id="contact-notes" name="notes">${escapeHtml(record?.notes || "")}</textarea></div>
            </div>
            <p class="form-error" id="business-form-error" role="alert"></p>
            <div class="modal-actions"><button class="button secondary" type="button" data-close-business>Cancel</button><button class="button" type="submit">${record ? "Save changes" : `Add ${label}`}</button></div>
        </form></section></div>`;
    modalRoot.querySelector("#contact-name").focus();
    modalRoot.querySelectorAll("[data-close-business]").forEach((button) => button.addEventListener("click", closeBusinessModal));
    modalRoot.querySelector("[data-business-backdrop]").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeBusinessModal();
    });
}

function documentItemRow(route, item = {}) {
    const purchase = route === "purchases";
    const productOptions = businessProducts.map((product) => `<option value="${product.id}" ${String(product.id) === String(item.product_id || "") ? "selected" : ""}>${escapeHtml(product.product_name)} · ${Number(product.quantity)} in stock · ${money(product.price)}</option>`).join("");
    const selected = businessProducts.find((product) => String(product.id) === String(item.product_id || ""));
    const cost = item.unit_cost ?? item.unit_price ?? selected?.price ?? "";
    return `<div class="document-item-row">
        <div class="form-group item-product"><label>Product or scan barcode</label><select class="form-field item-product-select" required><option value="">Select product</option>${productOptions}</select><input class="form-field item-barcode-input" type="text" maxlength="80" autocomplete="off" spellcheck="false" aria-label="Scan product barcode" placeholder="Scan barcode, then press Enter"><small class="item-scan-status" aria-live="polite"></small></div>
        <div class="form-group item-quantity"><label>Quantity</label><input class="form-field" type="number" min="1" max="1000000" step="1" value="${escapeHtml(item.quantity || 1)}" required></div>
        ${purchase ? `<div class="form-group item-cost"><label>Unit cost (PHP)</label><input class="form-field" type="number" min="0.01" step="0.01" value="${escapeHtml(cost)}" required></div>` : ""}
        <button class="icon-button delete item-remove" type="button" data-remove-item aria-label="Remove item">${icon("delete")}</button>
    </div>`;
}

function openDocumentModal(route, record = null) {
    const partyLabel = route === "purchases" ? "Supplier" : "Customer";
    const partyKey = route === "purchases" ? "supplier_id" : "customer_id";
    const partyOptions = businessParties.map((party) => `<option value="${party.id}" ${String(party.id) === String(record?.[partyKey] || "") ? "selected" : ""}>${escapeHtml(party.name)}</option>`).join("");
    const canMarkOrderPaid = route !== "orders" || ["delivered", "completed"].includes(record?.status);
    const choosePaymentStatus = record?.payment_status === "partial"
        || (route === "orders" && record?.payment_status === "paid" && !canMarkOrderPaid);
    const explanation = record
        ? route === "sales" ? "Saving adjusts stock to match the updated sale; payment tracking remains separate."
            : "Only pending records can be edited."
        : route === "sales" ? "Stock is deducted when saved. Payment status and method track what was collected."
        : route === "orders" ? "A new order starts unpaid and pending; stock is deducted when processing begins."
            : "A new purchase stays pending until received; stock is added when received.";
    modalRoot.innerHTML = `<div class="modal-backdrop" data-business-backdrop><section class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="business-modal-title">
        <div class="modal-heading"><div><h2 id="business-modal-title">${record ? "Edit" : route === "sales" ? "Record a sale" : route === "orders" ? "Create customer order" : "Create supplier purchase"}</h2><p>${escapeHtml(explanation)}</p></div>
        <button class="modal-close" type="button" data-close-business aria-label="Close dialog">×</button></div>
        ${!businessProducts.length ? '<p class="error-panel">Add products to the inventory before creating this record.</p>' : ""}
        ${!businessParties.length ? `<p class="error-panel">Add at least one ${partyLabel.toLowerCase()} before creating this record.</p>` : ""}
        <form id="document-form" data-route="${route}" data-id="${record?.id || ""}" novalidate>
            <div class="form-group"><label for="document-party">${partyLabel}</label><select class="form-field" id="document-party" required><option value="">Select ${partyLabel.toLowerCase()}</option>${partyOptions}</select></div>
            ${route === "sales" || route === "orders" ? `<div class="form-grid sale-payment-fields">
                <div class="form-group"><label for="sale-payment-status">Payment status</label><select class="form-field" id="sale-payment-status" name="payment_status" required>
                    ${choosePaymentStatus ? '<option value="" selected disabled>Choose paid in full or unpaid</option>' : ""}
                    <option value="paid" ${route === "orders" && !canMarkOrderPaid ? "disabled" : ""} ${record?.payment_status === "paid" && canMarkOrderPaid || (route === "sales" && !record) ? "selected" : ""}>Paid in full${route === "orders" && !canMarkOrderPaid ? " (after delivery)" : ""}</option>
                    <option value="unpaid" ${record?.payment_status === "unpaid" || (route === "orders" && !record) ? "selected" : ""}>Unpaid</option>
                </select></div>
                <div class="form-group"><label for="sale-payment-method">Payment method</label><select class="form-field" id="sale-payment-method" name="payment_method">
                    <option value="cash" ${!record || record.payment_method === "cash" ? "selected" : ""}>${route === "orders" ? "Cash / COD" : "Cash"}</option>
                    <option value="card" ${record?.payment_method === "card" ? "selected" : ""}>Card</option>
                    <option value="gcash" ${record?.payment_method === "gcash" ? "selected" : ""}>GCash</option>
                    <option value="bank_transfer" ${record?.payment_method === "bank_transfer" ? "selected" : ""}>Bank transfer</option>
                    <option value="other" ${record?.payment_method === "other" ? "selected" : ""}>Other</option>
                </select></div>
            </div>${record?.payment_status === "partial" ? `<p class="payment-reconcile-note">This record has a previously recorded partial payment of ${money(record.amount_paid)}. Choose “Paid in full” or “Unpaid” to reconcile it; the saved amount will not change until you save.</p>` : route === "orders" && record?.payment_status === "paid" && !canMarkOrderPaid ? '<p class="payment-reconcile-note">This order is marked paid before delivery. Choose unpaid to correct it before saving.</p>' : ""}` : ""}
            <div class="document-item-list">${(record?.items?.length ? record.items : [{}]).map((item) => documentItemRow(route, item)).join("")}</div>
            <button class="button secondary add-item-button" type="button" data-add-item>Add another product</button>
            <p class="form-error" id="business-form-error" role="alert"></p>
            <div class="modal-actions"><button class="button secondary" type="button" data-close-business>Cancel</button><button class="button" type="submit" ${!businessProducts.length || !businessParties.length ? "disabled" : ""}>${record ? "Save changes" : route === "sales" ? "Save sale" : route === "orders" ? "Save order" : "Save purchase"}</button></div>
        </form></section></div>`;
    modalRoot.querySelectorAll("[data-close-business]").forEach((button) => button.addEventListener("click", closeBusinessModal));
    modalRoot.querySelector("[data-business-backdrop]").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeBusinessModal();
    });
    modalRoot.querySelector("[data-add-item]").addEventListener("click", () => {
        modalRoot.querySelector(".document-item-list").insertAdjacentHTML("beforeend", documentItemRow(route));
    });
    modalRoot.querySelector(".document-item-list").addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-remove-item]");
        if (removeButton && modalRoot.querySelectorAll(".document-item-row").length > 1) removeButton.closest(".document-item-row").remove();
    });
    modalRoot.querySelector(".document-item-list").addEventListener("change", (event) => {
        if (!event.target.matches(".item-product-select") || route !== "purchases") return;
        const product = businessProducts.find((entry) => String(entry.id) === event.target.value);
        const costInput = event.target.closest(".document-item-row").querySelector(".item-cost input");
        if (product && !costInput.value) costInput.value = product.price;
    });
    modalRoot.querySelector(".document-item-list").addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || !event.target.matches(".item-barcode-input")) return;
        event.preventDefault();
        const row = event.target.closest(".document-item-row");
        const scanned = event.target.value.trim().toLocaleLowerCase();
        const product = businessProducts.find((entry) => [entry.barcode, entry.sku]
            .some((code) => String(code || "").trim().toLocaleLowerCase() === scanned));
        const status = row.querySelector(".item-scan-status");
        if (!product) {
            status.textContent = scanned ? "No product matches that barcode or SKU." : "Scan a barcode first.";
            status.classList.add("error");
            return;
        }
        row.querySelector(".item-product-select").value = String(product.id);
        const costInput = row.querySelector(".item-cost input");
        if (costInput) costInput.value = product.price;
        row.querySelector(".item-product-select").dispatchEvent(new Event("change", { bubbles: true }));
        event.target.value = "";
        status.classList.remove("error");
        status.textContent = `Matched ${product.product_name}.`;
    });
}

async function openOrderPaymentModal(id) {
    try {
        const result = await request(`${API_ROOT}/orders/${encodeURIComponent(id)}`);
        const order = result.data;
        if (!order) throw new Error("Order payment details are unavailable.");
        const canMarkOrderPaid = ["delivered", "completed"].includes(order.status)
            || (order.status !== "cancelled" && order.payment_method === "gcash" && Boolean(order.gcash_payment_reference));
        const choosePaymentStatus = order.payment_status === "partial"
            || (order.payment_status === "paid" && !canMarkOrderPaid);
        modalRoot.innerHTML = `<div class="modal-backdrop" data-business-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="business-modal-title">
            <div class="modal-heading"><div><h2 id="business-modal-title">Order #${escapeHtml(order.id)} payment</h2><p>Total ${money(order.total)} · Payment changes do not affect stock.</p></div>
            <button class="modal-close" type="button" data-close-business aria-label="Close dialog">×</button></div>
            <form id="order-payment-form" data-id="${escapeHtml(order.id)}">
                <div class="form-group"><label for="order-payment-status">Payment status</label><select class="form-field" id="order-payment-status" name="payment_status" required>
                    ${choosePaymentStatus ? '<option value="" selected disabled>Choose paid in full or unpaid</option>' : ""}
                    <option value="unpaid" ${order.payment_status === "unpaid" ? "selected" : ""}>Unpaid</option>
                    <option value="paid" ${canMarkOrderPaid ? "" : "disabled"} ${order.payment_status === "paid" && canMarkOrderPaid ? "selected" : ""}>Paid in full${canMarkOrderPaid ? "" : " (after delivery)"}</option>
                </select></div>
                <div class="form-group"><label for="order-payment-method">Payment method</label><select class="form-field" id="order-payment-method" name="payment_method">
                    <option value="cash" ${order.payment_method === "cash" ? "selected" : ""}>Cash on delivery (COD)</option>
                    <option value="card" ${order.payment_method === "card" ? "selected" : ""}>Card</option>
                    <option value="gcash" ${order.payment_method === "gcash" ? "selected" : ""}>GCash</option>
                    <option value="bank_transfer" ${order.payment_method === "bank_transfer" ? "selected" : ""}>Bank transfer</option>
                    <option value="other" ${order.payment_method === "other" ? "selected" : ""}>Other</option>
                </select></div>
                ${order.payment_status === "partial" ? `<p class="payment-reconcile-note">This order has a previously recorded partial payment of ${money(order.amount_paid)}. Choose “Paid in full” or “Unpaid” to reconcile it; the saved amount will not change until you save.</p>` : ""}
                ${!canMarkOrderPaid ? '<p class="payment-reconcile-note">COD stays unpaid while the order is in transit. Mark it paid only after the customer receives it and pays.</p>' : ""}
                <p class="form-error" id="business-form-error" role="alert"></p>
                <div class="modal-actions"><button class="button secondary" type="button" data-close-business>Cancel</button><button class="button" type="submit">Save payment</button></div>
            </form></section></div>`;
        modalRoot.querySelectorAll("[data-close-business]").forEach((button) => button.addEventListener("click", closeBusinessModal));
        modalRoot.querySelector("[data-business-backdrop]").addEventListener("click", (event) => {
            if (event.target === event.currentTarget) closeBusinessModal();
        });
    } catch (error) {
        showToast(error.message, true);
    }
}

function closeBusinessModal() {
    modalRoot.innerHTML = "";
}

async function deleteContact(route, id) {
    const record = businessData.find((item) => String(item.id) === String(id));
    if (!record || !window.confirm(`Delete ${record.name}? Records linked to past activity cannot be deleted.`)) return;
    try {
        await request(`${API_ROOT}/${route}/${encodeURIComponent(id)}`, { method: "DELETE" });
        showToast(`${route === "customers" ? "Customer" : "Supplier"} deleted.`);
        businessStatus = "idle";
        loadBusiness(route);
    } catch (error) {
        showToast(error.message, true);
    }
}

async function changeDocumentStatus(route, id, status) {
                ${order.payment_method === "gcash" && order.gcash_payment_reference ? `<p class="payment-reconcile-note">Customer GCash reference: <strong>${escapeHtml(order.gcash_payment_reference)}</strong>. ${order.payment_status === "paid" ? "This payment is marked paid." : "Verify it in the GCash account before marking the order paid."}</p>` : ""}
    const action = status === "refunded" ? "refund this sale and return its stock"
        : status === "processing" ? "start processing this order and deduct or confirm reserved stock"
        : status === "ready_to_ship" ? "mark this order ready to ship"
        : status === "shipped" ? "mark this order as shipped"
        : status === "delivered" ? "mark this order as delivered"
        : status === "completed" ? "complete this order and deduct its stock"
        : status === "cancelled" ? `cancel this ${route === "purchases" ? "purchase" : "order"}`
            : "mark this purchase received and add its stock";
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    try {
        const result = await request(`${API_ROOT}/${route}/${encodeURIComponent(id)}`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });
        showToast(status === "refunded" ? "Sale refunded and stock restored."
            : status === "processing" ? "Order processing started; stock has been reserved."
            : status === "delivered" ? "Order marked delivered."
            : status === "shipped" ? "Order marked shipped."
            : status === "ready_to_ship" ? "Order is ready to ship."
            : status === "completed" ? "Order completed."
            : status === "cancelled" ? `${route === "purchases" ? "Purchase" : "Order"} cancelled.`
                : "Purchase received and stock updated.");
        businessStatus = "idle";
        if (route === "orders") orderFilters.status = "";
        loadBusiness(route);
        loadProducts();
        if (result?.notification_warning) showToast(result.notification_warning, true);
    } catch (error) {
        showToast(error.message, true);
    }
}

async function deleteDocument(route, id) {
    const record = businessData.find((item) => String(item.id) === String(id));
    const action = route === "sales" ? "delete this sale and restore its sold stock"
        : route === "orders" && record?.status === "completed" ? "delete this completed order and restore its stock"
            : route === "purchases" && record?.status === "received" ? "delete this received purchase and remove its stock (only if still available)"
                : "delete this record";
    if (!window.confirm(`Are you sure you want to ${action}? This cannot be undone.`)) return;
    try {
        await request(`${API_ROOT}/${route}/${encodeURIComponent(id)}`, { method: "DELETE" });
        showToast("Record deleted.");
        businessStatus = "idle";
        loadBusiness(route);
    } catch (error) {
        showToast(error.message, true);
    }
}

async function editDocument(route, id) {
    try {
        const result = await request(`${API_ROOT}/${route}/${encodeURIComponent(id)}`);
        openDocumentModal(route, result.data);
    } catch (error) {
        showToast(error.message, true);
    }
}

async function deleteManagedUser(id, username, role) {
    const accountType = role === "customer" ? "customer account" : `${role} account`;
    const confirmation = role === "customer"
        ? `Delete the customer account "${username}"? Accounts with sales or orders on record cannot be deleted.`
        : `Permanently delete the ${accountType} "${username}"? This cannot be undone.`;
    if (!window.confirm(confirmation)) return;

    try {
        await request(`${API_ROOT}/users/${encodeURIComponent(id)}`, { method: "DELETE" });
        showToast(`Account "${username}" deleted.`);
        await loadManagedUsers();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function showDocumentDetails(route, id) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-business-backdrop><section class="modal"><div class="loading">Loading record details…</div></section></div>`;
    try {
        const result = await request(`${API_ROOT}/${route}/${encodeURIComponent(id)}`);
        const record = result.data;
        const itemRows = record.items.map((item) => `<tr><td>${escapeHtml(item.product_name)}</td><td>${Number(item.quantity)}</td><td>${money(route === "purchases" ? item.unit_cost : item.unit_price)}</td><td>${money(item.line_total)}</td></tr>`).join("");
        modalRoot.innerHTML = `<div class="modal-backdrop" data-business-backdrop><section class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="business-modal-title">
            <div class="modal-heading"><div><p class="eyebrow">${routeTitles[route]} · #${record.id}</p><h2 id="business-modal-title">${escapeHtml(record.party_name || "Record")}</h2>
            <p>${escapeHtml(record.created_at)} ${record.status ? `· ${escapeHtml(record.status)}` : ""}</p></div><button class="modal-close" type="button" data-close-business aria-label="Close dialog">×</button></div>
            ${route === "sales" || route === "orders" ? `<dl class="sale-payment-summary">
                <div><dt>Payment status</dt><dd><span class="record-status status-${escapeHtml(record.payment_status || (route === "sales" ? "paid" : "unpaid"))}">${escapeHtml(paymentStatusLabel(record.payment_status || (route === "sales" ? "paid" : "unpaid")))}</span></dd></div>
                <div><dt>Payment method</dt><dd>${paymentMethodLabel(record.payment_method)}</dd></div>
                <div><dt>Amount received</dt><dd>${money(record.amount_paid)}</dd></div>
                <div><dt>Balance due</dt><dd>${money(Math.max(0, Number(record.total) - Number(record.amount_paid)))}</dd></div>
                ${route === "orders" ? `<div><dt>Delivery address</dt><dd>${escapeHtml(record.delivery_address || "—")}</dd></div>` : ""}
                ${route === "orders" ? `<div><dt>Courier</dt><dd>${escapeHtml(record.courier || "—")}</dd></div><div><dt>Tracking number</dt><dd>${escapeHtml(record.tracking_number || "—")}</dd></div><div><dt>Tracking link</dt><dd>${record.tracking_url ? `<a href="${escapeHtml(record.tracking_url)}" target="_blank" rel="noopener noreferrer">Open courier tracking ↗</a>` : "—"}</dd></div><div><dt>Estimated delivery</dt><dd>${escapeHtml(record.estimated_delivery_at || "—")}</dd></div>` : ""}
            </dl>` : ""}
            <div class="table-wrap"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price/cost</th><th>Total</th></tr></thead><tbody>${itemRows}</tbody></table></div>
            <div class="document-total">Total <strong>${money(record.total)}</strong></div>
            <div class="modal-actions">${route === "orders" ? `<button class="button secondary" type="button" data-edit-order-tracking="${record.id}">Update delivery tracking</button>` : ""}${route === "sales" ? `<button class="button" type="button" data-print-sale-receipt>Print receipt / Save as PDF</button>` : ""}<button class="button secondary" type="button" data-close-business>Close</button></div></section></div>`;
        modalRoot.querySelectorAll("[data-close-business]").forEach((button) => button.addEventListener("click", closeBusinessModal));
        modalRoot.querySelector("[data-print-sale-receipt]")?.addEventListener("click", () => printSaleReceipt(record));
        modalRoot.querySelector("[data-business-backdrop]").addEventListener("click", (event) => {
            if (event.target === event.currentTarget) closeBusinessModal();
        });
    } catch (error) {
        closeBusinessModal();
        showToast(error.message, true);
    }
}

function printSaleReceipt(sale, printWindow = window.open("", "_blank"))
{
    if (!printWindow) {
        showToast("Allow pop-ups for Stockwell to print or save this receipt as PDF.", true);
        return;
    }

    const logoUrl = new URL("stockwell-mark.svg", window.location.href).href;
    const itemRows = sale.items.map((item) => `<tr>
        <td>${escapeHtml(item.product_name)}</td><td>${Number(item.quantity)}</td>
        <td>${money(item.unit_price)}</td><td>${money(item.line_total)}</td></tr>`).join("");
    const amountPaid = Number(sale.amount_paid || 0);
    const balanceDue = Math.max(0, Number(sale.total) - amountPaid);

    printWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8">
                ${route === "orders" && record.gcash_payment_reference ? `<div><dt>GCash reference</dt><dd>${escapeHtml(record.gcash_payment_reference)} · ${record.payment_status === "paid" ? "Marked paid" : "Verify before marking paid"}</dd></div>` : ""}
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Sales receipt · #${Number(sale.id)}</title>
        <style>
            *{box-sizing:border-box}body{margin:0;padding:36px 20px;font:14px/1.5 Arial,sans-serif;color:#25243a;background:#f3f4f8}
            .receipt{max-width:760px;margin:0 auto;padding:36px;background:#fff;border:1px solid #e6e5ed;border-radius:16px}
            .brand{display:flex;align-items:center;gap:14px;padding-bottom:24px;border-bottom:2px solid #c4b5fd}
            .brand img{width:56px;height:56px}.brand h1{margin:0;font-size:25px;letter-spacing:.02em}.brand p{margin:3px 0 0;color:#6b6b80}
            .receipt-heading{display:flex;justify-content:space-between;gap:20px;margin:26px 0}
            .receipt-heading h2{margin:0;font-size:21px}.receipt-heading p,.meta{margin:5px 0;color:#67677b}
            .receipt-no{text-align:right}.receipt-no strong{display:block;font-size:16px}
            .customer{margin:0 0 22px;padding:14px 16px;border-radius:10px;background:#f6f5fb}
            .customer strong{display:block;margin-bottom:4px}.customer span{color:#626276}
            table{width:100%;border-collapse:collapse;margin:18px 0 24px}
            th{background:#f2f1f8;color:#55546b;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
            th,td{padding:12px 10px;border-bottom:1px solid #e8e7ef;text-align:left}
            th:nth-child(n+2),td:nth-child(n+2){text-align:right}
            .totals{width:min(100%,360px);margin-left:auto}.totals div{display:flex;justify-content:space-between;gap:20px;padding:7px 0}
            .totals .grand{margin-top:7px;padding-top:13px;border-top:2px solid #25243a;font-size:19px;font-weight:700}
            .payment{margin-top:16px;padding:14px 16px;border:1px solid #e8e7ef;border-radius:10px}
            .payment div{display:flex;justify-content:space-between;gap:18px;padding:4px 0}
            .footer{margin-top:30px;padding-top:16px;border-top:1px solid #e8e7ef;text-align:center;color:#747487;font-size:12px}
            @page{size:auto;margin:14mm}
            @media print{body{padding:0;background:#fff}.receipt{max-width:none;padding:0;border:0;border-radius:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
        </style></head><body><main class="receipt">
            <header class="brand"><img src="${escapeHtml(logoUrl)}" alt="Stockwell logo"><div><h1>Stockwell</h1><p>Inventory &amp; Store</p></div></header>
            <section class="receipt-heading"><div><h2>Sales receipt</h2><p>Thank you for your purchase.</p></div>
                <div class="receipt-no"><strong>Receipt #${Number(sale.id)}</strong><span class="meta">${escapeHtml(sale.created_at || "Date unavailable")}</span></div></section>
            <section class="customer"><strong>Customer</strong><span>${escapeHtml(sale.party_name || "Walk-in")}</span></section>
            <table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
            <section class="totals"><div><span>Subtotal</span><strong>${money(sale.total)}</strong></div>
                <div class="grand"><span>Total</span><strong>${money(sale.total)}</strong></div></section>
            <section class="payment"><div><span>Payment status</span><strong>${escapeHtml(paymentStatusLabel(sale.payment_status || "paid"))}</strong></div>
                <div><span>Payment method</span><strong>${paymentMethodLabel(sale.payment_method)}</strong></div>
                <div><span>Amount received</span><strong>${money(amountPaid)}</strong></div>
                <div><span>Balance due</span><strong>${money(balanceDue)}</strong></div></section>
            <footer class="footer">This is a sales receipt, not a tax invoice. Please keep it for your records.</footer>
        </main><script>window.onload=()=>window.print();</script></body></html>`);
    printWindow.document.close();
}

async function printSaleReceiptById(id)
{
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        showToast("Allow pop-ups for Stockwell to print or save this receipt as PDF.", true);
        return;
    }

    try {
        const result = await request(`${API_ROOT}/sales/${encodeURIComponent(id)}`);
        if (!result?.data || !Array.isArray(result.data.items)) {
            throw new Error("The sale details are unavailable for printing.");
        }
        printSaleReceipt(result.data, printWindow);
    } catch (error) {
        printWindow.close();
        showToast(error.message, true);
    }
}

async function openOrderTrackingModal(id)
{
    try {
        const result = await request(`${API_ROOT}/orders/${encodeURIComponent(id)}`);
        const order = result.data;
        modalRoot.innerHTML = `<div class="modal-backdrop" data-tracking-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="tracking-modal-title">
            <div class="modal-heading"><div><p class="eyebrow">ORDER #${order.id}</p><h2 id="tracking-modal-title">Delivery tracking</h2></div><button class="modal-close" type="button" data-close-tracking aria-label="Close dialog">×</button></div>
            <form id="order-tracking-form" data-id="${order.id}"><div class="form-group"><label for="tracking-courier">Courier</label><input class="form-field" id="tracking-courier" name="courier" maxlength="120" value="${escapeHtml(order.courier || "")}" placeholder="Courier or delivery service"></div>
            <div class="form-group"><label for="tracking-number">Tracking number</label><input class="form-field" id="tracking-number" name="tracking_number" maxlength="160" value="${escapeHtml(order.tracking_number || "")}"></div>
            <div class="form-group"><label for="tracking-url">Courier tracking link</label><input class="form-field" id="tracking-url" name="tracking_url" type="url" maxlength="1000" value="${escapeHtml(order.tracking_url || "")}" placeholder="https://courier.example/track/…"></div>
            <div class="form-group"><label for="tracking-estimate">Estimated delivery date</label><input class="form-field" id="tracking-estimate" name="estimated_delivery_at" type="date" value="${escapeHtml(order.estimated_delivery_at || "")}"></div>
            <p class="form-error" id="tracking-form-error" role="alert"></p><div class="modal-actions"><button class="button secondary" type="button" data-close-tracking>Cancel</button><button class="button" type="submit">Save tracking</button></div></form></section></div>`;
        modalRoot.querySelectorAll("[data-close-tracking]").forEach((button) => button.addEventListener("click", closeBusinessModal));
        modalRoot.querySelector("[data-tracking-backdrop]").addEventListener("click", (event) => {
            if (event.target === event.currentTarget) closeBusinessModal();
        });
    } catch (error) {
        closeBusinessModal();
        showToast(error.message, true);
    }
}

app.addEventListener("click", (event) => {
    const authModeButton = event.target.closest("[data-auth-mode]");
    const retryShopButton = event.target.closest("[data-retry-shop]");
    const retryOrdersButton = event.target.closest("[data-retry-orders]");
    const addCartButton = event.target.closest("[data-cart-add]");
    const changeCartButton = event.target.closest("[data-cart-change]");
    const retryUsersButton = event.target.closest("[data-retry-users]");
    const productDetailsButton = event.target.closest("[data-product-details]");
    const customerOrderButton = event.target.closest("[data-customer-order]");
    const cancelCustomerOrderButton = event.target.closest("[data-cancel-customer-order]");
    const markNotificationsReadButton = event.target.closest("[data-mark-notifications-read]");
    const retryProfileButton = event.target.closest("[data-retry-profile]");
    const setDefaultAddressButton = event.target.closest("[data-default-address]");
    const deleteAddressButton = event.target.closest("[data-delete-address]");
    const requestReturnButton = event.target.closest("[data-request-return]");
    const retryCustomerReturnsButton = event.target.closest("[data-retry-customer-returns]");
    const returnStatusButton = event.target.closest("[data-return-status]");
    const editTrackingButton = event.target.closest("[data-edit-order-tracking]");
    const createManagedUserButton = event.target.closest("[data-create-managed-user]");
    const editStaffPermissionsButton = event.target.closest("[data-edit-staff-permissions]");
    const deleteUserButton = event.target.closest("[data-delete-user]");
    if (authModeButton) {
        authMode = authModeButton.dataset.authMode;
        turnstileToken = "";
        renderLogin();
        trackAnalyticsPageView();
    }
    if (event.target.closest("[data-reset-login]")) {
        authMode = "login";
        window.location.hash = "#dashboard";
        renderLogin();
    }
    if (retryShopButton) loadShopProducts();
    if (retryOrdersButton) loadCustomerOrders();
    if (retryProfileButton) {
        customerProfileStatus = "idle";
        loadCustomerProfile();
    }
    if (productDetailsButton) showProductDetails(productDetailsButton.dataset.productDetails);
    if (customerOrderButton) showCustomerOrderDetails(customerOrderButton.dataset.customerOrder);
    if (cancelCustomerOrderButton && window.confirm(`Cancel order #${cancelCustomerOrderButton.dataset.cancelCustomerOrder}? Reserved stock will be released.`)) {
        cancelCustomerOrder(cancelCustomerOrderButton.dataset.cancelCustomerOrder);
    }
    if (markNotificationsReadButton) markCustomerNotificationsRead();
    if (setDefaultAddressButton) updateCustomerAddress("default", setDefaultAddressButton.dataset.defaultAddress);
    if (deleteAddressButton && window.confirm("Remove this saved delivery address?")) {
        updateCustomerAddress("delete", deleteAddressButton.dataset.deleteAddress);
    }
    if (requestReturnButton) openReturnRequestModal(requestReturnButton.dataset.requestReturn);
    if (retryCustomerReturnsButton) loadCustomerReturns();
    if (returnStatusButton) updateReturnStatus(returnStatusButton.dataset.returnStatus, returnStatusButton.dataset.nextStatus);
    if (editTrackingButton) openOrderTrackingModal(editTrackingButton.dataset.editOrderTracking);
    if (retryUsersButton) loadManagedUsers();
    if (createManagedUserButton) openManagedUserModal();
    if (editStaffPermissionsButton) openStaffPermissionsModal(editStaffPermissionsButton.dataset.editStaffPermissions);
    if (deleteUserButton) {
        deleteManagedUser(deleteUserButton.dataset.deleteUser, deleteUserButton.dataset.username, deleteUserButton.dataset.role);
    }
    if (addCartButton) {
        const id = addCartButton.dataset.cartAdd;
        const product = shopProducts.find((item) => String(item.id) === id);
        if (product && Number(shopCart[id] || 0) < Number(product.quantity)) {
            shopCart[id] = Number(shopCart[id] || 0) + 1;
            saveShopCart();
            renderShop();
        }
    }
    if (changeCartButton) {
        const id = changeCartButton.dataset.cartChange;
        const nextQuantity = Number(shopCart[id] || 0) + Number(changeCartButton.dataset.change);
        const product = shopProducts.find((item) => String(item.id) === id);
        if (nextQuantity > 0 && product && nextQuantity <= Number(product.quantity)) shopCart[id] = nextQuantity;
        else delete shopCart[id];
        saveShopCart();
        renderShop();
    }
    const addButton = event.target.closest("[data-add-product]");
    const viewButton = event.target.closest("[data-view]");
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");
    const retryButton = event.target.closest("[data-retry]");
    const retryBusinessButton = event.target.closest("[data-retry-business]");
    const createContactButton = event.target.closest("[data-create-contact]");
    const editContactButton = event.target.closest("[data-edit-contact]");
    const deleteContactButton = event.target.closest("[data-delete-contact]");
    const createDocumentButton = event.target.closest("[data-create-document]");
    const editDocumentButton = event.target.closest("[data-edit-document]");
    const viewDocumentButton = event.target.closest("[data-view-document]");
    const printSaleButton = event.target.closest("[data-print-sale]");
    const printOnlineSaleButton = event.target.closest("[data-print-online-sale]");
    const statusButton = event.target.closest("[data-status]");
    const deleteDocumentButton = event.target.closest("[data-delete-document]");
    const exportReportButton = event.target.closest("[data-export-report]");
    const exportCurrentButton = event.target.closest("[data-export-current]");
    const editOrderPaymentButton = event.target.closest("[data-edit-order-payment]");
    const adjustStockButton = event.target.closest("[data-adjust-stock]");
    const stockHistoryButton = event.target.closest("[data-stock-history]");
    const saveDeliveryZoneButton = event.target.closest("[data-save-delivery-zone]");
    const deleteDeliveryZoneButton = event.target.closest("[data-delete-delivery-zone]");
    const backupButton = event.target.closest("[data-download-backup]");
    const printReportButton = event.target.closest("[data-print-report]");
    const reportRangeButton = event.target.closest("[data-report-range]");
    if (retryButton) loadProducts();
    if (retryBusinessButton) {
        businessStatus = "idle";
        loadBusiness(currentRoute(), currentRoute() === "reports" && reportDateRange ? `?start=${reportDateRange.start}&end=${reportDateRange.end}` : "");
    }
    if (addButton) openProductModal();
    if (adjustStockButton) openStockAdjustmentModal(adjustStockButton.dataset.adjustStock);
    if (stockHistoryButton) openStockHistoryModal();
    if (viewButton) openProductDetails(viewButton.dataset.view);
    if (editButton) {
        const product = products.find((item) => String(item.id) === editButton.dataset.edit);
        if (product) openProductModal(product);
    }
    if (deleteButton) deleteProduct(deleteButton.dataset.delete);
    if (createContactButton) openContactModal(currentRoute());
    if (editContactButton) {
        const record = businessData.find((item) => String(item.id) === editContactButton.dataset.editContact);
        if (record) openContactModal(currentRoute(), record);
    }
    if (deleteContactButton) deleteContact(currentRoute(), deleteContactButton.dataset.deleteContact);
    if (createDocumentButton) openDocumentModal(currentRoute());
    if (editDocumentButton) editDocument(currentRoute(), editDocumentButton.dataset.editDocument);
    if (viewDocumentButton) showDocumentDetails(currentRoute(), viewDocumentButton.dataset.viewDocument);
    if (printSaleButton) printSaleReceiptById(printSaleButton.dataset.printSale);
    if (printOnlineSaleButton) printOnlineSaleReceiptById(printOnlineSaleButton.dataset.printOnlineSale);
    if (statusButton) changeDocumentStatus(currentRoute(), statusButton.dataset.status, statusButton.dataset.nextStatus);
    if (deleteDocumentButton) deleteDocument(currentRoute(), deleteDocumentButton.dataset.deleteDocument);
    if (exportReportButton) exportReportCsv();
    if (exportCurrentButton) exportCurrentCsv();
    if (editOrderPaymentButton) openOrderPaymentModal(editOrderPaymentButton.dataset.editOrderPayment);
    if (saveDeliveryZoneButton) saveDeliveryZone(saveDeliveryZoneButton.dataset.saveDeliveryZone, saveDeliveryZoneButton.closest("[data-delivery-zone-row]"));
    if (deleteDeliveryZoneButton) {
        const zone = businessData.find((item) => String(item.id) === deleteDeliveryZoneButton.dataset.deleteDeliveryZone);
        if (zone && window.confirm(`Delete delivery area "${zone.area_name}"? Saved orders will keep their original fee and area.`)) {
            request(`${API_ROOT}/delivery-zones/${encodeURIComponent(zone.id)}`, { method: "DELETE" }).then((result) => {
                businessData = Array.isArray(result?.data) ? result.data : businessData.filter((item) => String(item.id) !== String(zone.id));
                showToast("Delivery area deleted.");
                renderDeliverySettings();
            }).catch((error) => showToast(error.message, true));
        }
    }
    if (backupButton && window.confirm("This SQL backup contains user account hashes and business data. Save it somewhere private?")) {
        window.location.href = `${API_ROOT}/backup`;
    }
    if (printReportButton) printReportSummary();
    if (reportRangeButton) loadReportRange(reportRangeButton.dataset.reportRange);
});

document.querySelector("[data-logout]").addEventListener("click", signOut);

app.addEventListener("submit", async (event) => {
    if (!["login-form", "register-form", "forgot-password-form", "reset-password-form"].includes(event.target.id)) return;
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('[type="submit"]');
    const errorNode = form.querySelector(".login-error");
    submitButton.disabled = true;
    errorNode.textContent = "";
    try {
        if (form.id === "forgot-password-form") {
            const email = String(new FormData(form).get("email") || "").trim();
            await request(`${API_AUTH}/forgot-password`, {
                method: "POST",
                body: JSON.stringify({ email })
            });
            errorNode.textContent = "If an account matches that email, a password reset link will be sent shortly.";
            submitButton.disabled = true;
            return;
        }
        if (form.id === "reset-password-form") {
            const formData = new FormData(form);
            const password = String(formData.get("password") || "");
            if (password !== String(formData.get("confirm_password") || "")) {
                throw new Error("The passwords do not match.");
            }
            await request(`${API_AUTH}/reset-password`, {
                method: "POST",
                body: JSON.stringify({ token: form.dataset.token, password })
            });
            authStatus = "unauthenticated";
            currentUser = null;
            authMode = "login";
            window.location.hash = "#dashboard";
            render();
            showToast("Password updated. Sign in with your new password.");
            return;
        }
        const isRegistration = form.id === "register-form";
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        if (isRegistration && publicIntegrationsConfig?.turnstileSiteKey) {
            if (!turnstileToken) throw new Error("Complete the security check before creating your account.");
            payload.turnstile_token = turnstileToken;
        }
        if (!isRegistration) {
            payload.username = String(payload.username || "").trim();
            if (!payload.username || !payload.password) throw new Error("Enter your username and password.");
        }
        const result = await request(`${API_AUTH}/${isRegistration ? "register" : "login"}`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        if (typeof result.csrf_token === "string") csrfToken = result.csrf_token;
        currentUser = result.user;
        authStatus = "authenticated";
        authMode = "login";
        googleAuthError = "";
        window.location.hash = currentUser.role === "customer" ? "#shop" : "#dashboard";
        render();
        if (currentUser.role !== "customer"
            && hasAnyPermission(["inventory.manage", "sales.manage", "orders.manage", "purchases.manage"])) await loadProducts();
    } catch (error) {
        errorNode.textContent = error.message;
        if (form.id === "register-form" && turnstileWidgetId !== null && window.turnstile) {
            turnstileToken = "";
            window.turnstile.reset(turnstileWidgetId);
        }
        submitButton.disabled = false;
    }
});

document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (form.id === "delivery-zone-form") {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.free_delivery_enabled = formData.has("free_delivery_enabled");
        payload.is_active = formData.has("is_active");
        const button = form.querySelector('[type="submit"]');
        const errorNode = form.querySelector("#delivery-zone-error");
        button.disabled = true;
        errorNode.textContent = "";
        try {
            const result = await request(`${API_ROOT}/delivery-zones`, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            businessData = Array.isArray(result?.data) ? result.data : businessData;
            showToast("Delivery area added.");
            renderDeliverySettings();
        } catch (error) {
            errorNode.textContent = error.message;
            button.disabled = false;
        }
        return;
    }
    if (form.id === "order-tracking-form") {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(form).entries());
        const button = form.querySelector('[type="submit"]');
        const errorNode = form.querySelector("#tracking-form-error");
        button.disabled = true;
        try {
            const result = await request(`${API_ROOT}/orders/${encodeURIComponent(form.dataset.id)}/tracking`, {
                method: "PATCH",
                body: JSON.stringify(payload)
    if (form.id === "gcash-payment-reference-form") {
        event.preventDefault();
        await submitCustomerGcashReference(form);
        return;
    }
            });
            closeBusinessModal();
            showToast("Delivery tracking saved.");
            businessStatus = "idle";
            loadBusiness("orders");
            if (result?.notification_warning) showToast(result.notification_warning, true);
        } catch (error) {
            errorNode.textContent = error.message;
            button.disabled = false;
        }
        return;
    }
    if (form.id === "customer-return-form") {
        event.preventDefault();
        const formData = new FormData(form);
        const items = [...form.querySelectorAll('input[name^="quantity_"]')]
            .map((input) => ({ order_item_id: Number(input.name.substring("quantity_".length)), quantity: Number(input.value) }))
            .filter((item) => item.quantity > 0);
        const payload = {
            order_id: Number(form.dataset.orderId),
            reason: String(formData.get("reason") || ""),
            details: String(formData.get("details") || "").trim(),
            items
        };
        const errorNode = form.querySelector("#return-form-error");
        const button = form.querySelector('[type="submit"]');
        if (!items.length || items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
            errorNode.textContent = "Select at least one item and quantity to return.";
            return;
        }
        button.disabled = true;
        try {
            const result = await request(`${API_ROOT}/shop/returns`, { method: "POST", body: JSON.stringify(payload) });
            closeBusinessModal();
            showToast("Return request submitted for store review.");
            if (result?.notification_warning) showToast(result.notification_warning, true);
            customerReturnsStatus = "idle";
            if (currentRoute() === "returns") loadCustomerReturns();
        } catch (error) {
            errorNode.textContent = error.message;
            button.disabled = false;
        }
        return;
    }
    if (form.id === "order-payment-form") {
        event.preventDefault();
        const payment = Object.fromEntries(new FormData(form).entries());
        const errorNode = form.querySelector("#business-form-error");
        const button = form.querySelector('[type="submit"]');
        if (!["paid", "unpaid"].includes(payment.payment_status)) {
            errorNode.textContent = "Choose whether the order is paid in full or unpaid.";
            return;
        }
        button.disabled = true;
        try {
            const result = await request(`${API_ROOT}/orders/${encodeURIComponent(form.dataset.id)}/payment`, {
                method: "PATCH",
                body: JSON.stringify(payment)
            });
            closeBusinessModal();
            showToast("Order payment updated.");
            businessStatus = "idle";
            loadBusiness("orders");
            if (result?.notification_warning) showToast(result.notification_warning, true);
        } catch (error) {
            errorNode.textContent = error.message;
            button.disabled = false;
        }
        return;
    }
    if (form.classList.contains("user-role-form")) {
        event.preventDefault();
        const userId = form.dataset.id;
        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        try {
            const result = await request(`${API_ROOT}/users/${encodeURIComponent(userId)}`, {
                method: "PATCH",
                body: JSON.stringify({ role: form.querySelector('[name="role"]').value })
            });
            managedUsers = Array.isArray(result?.data) ? result.data : managedUsers;
            showToast("User role updated.");
            renderManagedUsers();
        } catch (error) {
            showToast(error.message, true);
            button.disabled = false;
        }
        return;
    }
    if (form.id === "staff-permissions-form") {
        event.preventDefault();
        const permissions = [...form.querySelectorAll('input[name="permissions"]:checked')].map((input) => input.value);
        const button = form.querySelector('[type="submit"]');
        const errorNode = form.querySelector("#staff-permissions-error");
        button.disabled = true;
        errorNode.textContent = "";
        try {
            const result = await request(`${API_ROOT}/users/${encodeURIComponent(form.dataset.id)}/permissions`, {
                method: "PUT",
                body: JSON.stringify({ permissions })
            });
            managedUsers = Array.isArray(result?.data) ? result.data : managedUsers;
            closeBusinessModal();
            showToast("Staff permissions updated.");
            renderManagedUsers();
        } catch (error) {
            errorNode.textContent = error.message;
            button.disabled = false;
        }
        return;
    }
    if (form.id === "managed-user-form") {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        const button = form.querySelector('[type="submit"]');
        const errorNode = form.querySelector("#managed-user-error");
        button.disabled = true;
        errorNode.textContent = "";
        try {
            const result = await request(`${API_ROOT}/users`, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            managedUsers = Array.isArray(result?.data) ? result.data : managedUsers;
            userManagementStatus = "ready";
            closeBusinessModal();
            showToast("Account created.");
            renderManagedUsers();
        } catch (error) {
            errorNode.textContent = error.message;
            button.disabled = false;
        }
        return;
    }
    if (form.id === "customer-profile-form") {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(form).entries());
        const button = form.querySelector('[type="submit"]');
        const errorNode = form.querySelector("#profile-error");
        button.disabled = true;
        errorNode.textContent = "";
        try {
            await request(`${API_ROOT}/shop/profile`, { method: "PUT", body: JSON.stringify(payload) });
            customerProfileStatus = "idle";
            await loadCustomerProfile();
            showToast("Profile details saved.");
        } catch (error) {
            errorNode.textContent = error.message;
            button.disabled = false;
        }
        return;
    }
    if (form.id === "customer-address-form") {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.is_default = formData.has("is_default");
        const button = form.querySelector('[type="submit"]');
        const errorNode = form.querySelector("#address-error");
        button.disabled = true;
        errorNode.textContent = "";
        try {
            await request(`${API_ROOT}/shop/addresses`, { method: "POST", body: JSON.stringify(payload) });
            customerProfileStatus = "idle";
            await loadCustomerProfile();
            showToast("Delivery address saved.");
        } catch (error) {
            errorNode.textContent = error.message;
            button.disabled = false;
        }
        return;
    }
    if (form.id === "checkout-form") {
        event.preventDefault();
        const errorNode = form.querySelector("#checkout-error");
        const button = form.querySelector('[type="submit"]');
        const items = Object.entries(shopCart)
            .filter(([, quantity]) => quantity > 0)
            .map(([product_id, quantity]) => ({ product_id: Number(product_id), quantity }));
        const formData = new FormData(form);
        const payload = {
            items,
            address: String(formData.get("address") || "").trim(),
            recipient_name: String(formData.get("recipient_name") || "").trim(),
            phone: String(formData.get("phone") || "").trim(),
            delivery_notes: String(formData.get("delivery_notes") || "").trim(),
            delivery_zone_id: Number(formData.get("delivery_zone_id")),
            payment_method: String(formData.get("payment_method") || "cash")
        };
        if (!items.length || !payload.address || !payload.recipient_name || !payload.phone || !Number.isInteger(payload.delivery_zone_id) || payload.delivery_zone_id < 1) {
            errorNode.textContent = "Add at least one product, choose a delivery area, and enter the recipient, phone number, and delivery address.";
            return;
        }
        button.disabled = true;
        errorNode.textContent = "";
        try {
            const result = await request(`${API_ROOT}/shop/orders`, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            shopCart = {};
            saveShopCart();
            customerOrdersStatus = "idle";
            shopStatus = "idle";
            showToast(`Order #${result.data.id} placed. Payment is due on delivery.`);
            if (result.notification_warning) showToast(result.notification_warning, true);
            window.location.hash = "#my-orders";
        } catch (error) {
            const currentErrorNode = document.querySelector("#checkout-error");
            if (currentErrorNode) currentErrorNode.textContent = error.message;
            if (button.isConnected) button.disabled = false;
        }
        return;
    }
    if (form.id === "customer-review-form") {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = {
            rating: Number(formData.get("rating")),
            title: String(formData.get("title") || "").trim(),
            review: String(formData.get("review") || "").trim()
        };
        const button = form.querySelector('[type="submit"]');
        const errorNode = form.querySelector("#customer-review-error");
        button.disabled = true;
        errorNode.textContent = "";
        try {
            await request(`${API_ROOT}/shop/products/${encodeURIComponent(form.dataset.productId)}/reviews`, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            showToast("Your verified-purchase review was saved.");
            await loadShopProducts();
            const purchasedProduct = form.dataset.purchasedContext === "true"
                ? {
                    id: Number(form.dataset.productId),
                    product_name: form.dataset.productName,
                    image_url: form.dataset.productImage,
            if (payload.payment_method === "gcash") {
                showToast(`Order #${result.data.id} placed. Transfer the total and submit your GCash reference.`);
                if (result.notification_warning) showToast(result.notification_warning, true);
                window.location.hash = "#my-orders";
                await showCustomerOrderDetails(result.data.id);
                return;
            }
                    category: form.dataset.productCategory,
                    unit_price: Number(form.dataset.unitPrice),
                    quantity: Number(form.dataset.purchasedQuantity)
                }
                : null;
            await showProductDetails(form.dataset.productId, purchasedProduct);
        } catch (error) {
            errorNode.textContent = error.message;
            button.disabled = false;
        }
        return;
    }

    if (form.id === "report-filter") {
        event.preventDefault();
        const formData = new FormData(form);
        reportDateRange = {
            start: String(formData.get("start") || ""),
            end: String(formData.get("end") || "")
        };
        if (!reportDateRange.start || !reportDateRange.end || reportDateRange.start > reportDateRange.end) {
            showToast("Choose a valid date range.", true);
            return;
        }
        businessStatus = "idle";
        loadBusiness("reports", `?start=${encodeURIComponent(reportDateRange.start)}&end=${encodeURIComponent(reportDateRange.end)}`);
        return;
    }

    if (form.id === "contact-form") {
        event.preventDefault();
        const route = form.dataset.route;
        const formData = new FormData(form);
        const fields = route === "customers" ? ["name", "email", "phone", "address", "notes"] : ["name", "email", "address", "notes"];
        const payload = Object.fromEntries(fields.map((key) => [key, String(formData.get(key) || "").trim()]));
        if (!payload.name) {
            modalRoot.querySelector("#business-form-error").textContent = "Name is required.";
            return;
        }
        const id = form.dataset.id;
        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        try {
            await request(`${API_ROOT}/${route}${id ? `/${encodeURIComponent(id)}` : ""}`, {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            closeBusinessModal();
            showToast(`${route === "customers" ? "Customer" : "Supplier"} ${id ? "updated" : "added"}.`);
            businessStatus = "idle";
            loadBusiness(route);
        } catch (error) {
            modalRoot.querySelector("#business-form-error").textContent = error.message;
            button.disabled = false;
        }
        return;
    }

    if (form.id === "document-form") {
        event.preventDefault();
        const route = form.dataset.route;
        const id = form.dataset.id;
        const items = [...form.querySelectorAll(".document-item-row")].map((row) => ({
            product_id: Number(row.querySelector(".item-product-select").value),
            quantity: Number(row.querySelector(".item-quantity input").value),
            ...(route === "purchases" ? { unit_cost: Number(row.querySelector(".item-cost input").value) } : {})
        }));
        const payment = route === "sales" || route === "orders" ? {
            payment_status: form.querySelector("#sale-payment-status").value,
            payment_method: form.querySelector("#sale-payment-method").value
        } : {};
        if (!Number(form.querySelector("#document-party").value)
            || items.some((item) => !Number.isInteger(item.product_id) || item.product_id < 1 || !Number.isInteger(item.quantity) || item.quantity < 1
                || (route === "purchases" && (!Number.isFinite(item.unit_cost) || item.unit_cost <= 0)))
            || ((route === "sales" || route === "orders") && !["paid", "unpaid"].includes(payment.payment_status))) {
            modalRoot.querySelector("#business-form-error").textContent = "Choose a party, enter valid line items, and select paid in full or unpaid.";
            return;
        }
        const configKey = route === "purchases" ? "supplier_id" : "customer_id";
        const payload = { [configKey]: Number(form.querySelector("#document-party").value), items, ...payment };
        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        try {
            await request(`${API_ROOT}/${route}${id ? `/${encodeURIComponent(id)}` : ""}`, {
                method: id ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            closeBusinessModal();
            showToast(id ? "Record updated and stock adjusted." : route === "sales" ? "Sale recorded and stock updated." : route === "orders" ? "Customer order created." : "Purchase created.");
            businessStatus = "idle";
            loadBusiness(route);
            if (route === "sales") loadProducts();
        } catch (error) {
            modalRoot.querySelector("#business-form-error").textContent = error.message;
            button.disabled = false;
        }
    }
});

window.addEventListener("hashchange", () => { modalRoot.innerHTML = ""; render(); trackAnalyticsPageView(); });
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentRoute() === "my-orders") {
        refreshCustomerOrders();
    }
});
document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
}).format(new Date());

if (!window.location.hash) window.location.hash = "#dashboard";
document.querySelector("[data-analytics-settings]").addEventListener("click", () => {
    if (publicIntegrationsConfig?.ga4MeasurementId) document.querySelector("#analytics-consent").hidden = false;
});
document.querySelectorAll("[data-analytics-consent]").forEach((button) => {
    button.addEventListener("click", () => saveAnalyticsConsent(button.dataset.analyticsConsent));
});
render();
loadPublicIntegrationsConfig();
checkSession();
