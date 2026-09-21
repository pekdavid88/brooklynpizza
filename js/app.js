/**
 * BROOKLYN PIZZA — CLIENT APPLICATION JAVASCRIPT (js/app.js)
 * Támogatja a Magyar (/) és Szlovák (/sk/) dedikált oldalakat
 */

(function () {
  'use strict';

  // 1. Nyelv meghatározása (HTML lang attribútum vagy URL alapján)
  const isSkPage = document.documentElement.lang === 'sk' || window.location.pathname.includes('/sk');
  const currentLang = isSkPage ? 'sk' : 'hu';

  // 2. Storage kulcsok (közös tárhely HU és SK oldal között)
  const CONFIG_KEY = 'brooklyn_pizza_config';
  const MENU_STORAGE_KEY = 'brooklyn_pizza_menu';
  const ORDERS_STORAGE_KEY = 'brooklyn_pizza_orders';
  const STORE_STATUS_KEY = 'brooklyn_store_status';
  const CART_STORAGE_KEY = 'brooklyn_pizza_cart';
  const HOURS_STORAGE_KEY = 'brooklyn_store_hours';

  const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_1b0B9s3U9h8VjI2mF0oK4tL6yP8rE3wQ1aZ5x/exec";

  // 3. Alapértelmezett valós 6 db Brooklyn Pizza kínálat (9,50 €)
  const DEFAULT_MENU = [
    {
      id: 'p1',
      name_hu: 'Margherita',
      name_sk: 'Margherita',
      name: 'Margherita',
      price: 9.50,
      badge_hu: 'CLASSIC',
      badge_sk: 'KLASIKA',
      badge: 'CLASSIC',
      desc_hu: 'Paradicsomos alap 90 g, Mozzarella 110 g, Grana Padano 15 g',
      desc_sk: 'Paradajkový základ 90 g, Mozzarella 110 g, Grana Padano 15 g',
      description: 'Paradicsomos alap 90 g, Mozzarella 110 g, Grana Padano 15 g',
      image: isSkPage ? '../images/margherita.jpg' : 'images/margherita.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
      available: true
    },
    {
      id: 'p2',
      name_hu: 'Pepperoni',
      name_sk: 'Pepperoni',
      name: 'Pepperoni',
      price: 9.50,
      badge_hu: 'BESTSELLER',
      badge_sk: 'BESTSELLER',
      badge: 'BESTSELLER',
      desc_hu: 'Paradicsomos alap 90 g, Mozzarella 120 g, Pepperoni 70 g',
      desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, Pepperoni 70 g',
      description: 'Paradicsomos alap 90 g, Mozzarella 120 g, Pepperoni 70 g',
      image: isSkPage ? '../images/pepperoni.jpg' : 'images/pepperoni.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
      available: true
    },
    {
      id: 'p3',
      name_hu: 'Prosciutto e Mais',
      name_sk: 'Prosciutto e Mais',
      name: 'Prosciutto e Mais',
      price: 9.50,
      badge_hu: 'FAVOURITE',
      badge_sk: 'OBĽÚBENÁ',
      badge: 'FAVOURITE',
      desc_hu: 'Paradicsomos alap 90 g, Mozzarella 120 g, sonka 70 g, kukorica 60 g',
      desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, šunka 70 g, kukurica 60 g',
      description: 'Paradicsomos alap 90 g, Mozzarella 120 g, sonka 70 g, kukorica 60 g',
      image: isSkPage ? '../images/prosciutto.jpg' : 'images/prosciutto.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
      available: true
    },
    {
      id: 'p4',
      name_hu: 'Prosciutto e Funghi',
      name_sk: 'Prosciutto e Funghi',
      name: 'Prosciutto e Funghi',
      price: 9.50,
      badge_hu: '',
      badge_sk: '',
      badge: '',
      desc_hu: 'Paradicsomos alap 90 g, Mozzarella 120 g, sonka 70 g, friss csiperkegomba 50 g',
      desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, šunka 70 g, čerstvé šampiňóny 50 g',
      description: 'Paradicsomos alap 90 g, Mozzarella 120 g, sonka 70 g, friss csiperkegomba 50 g',
      image: isSkPage ? '../images/prosciutto.jpg' : 'images/prosciutto.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
      available: true
    },
    {
      id: 'p5',
      name_hu: 'Bacon & Cheddar',
      name_sk: 'Bacon & Cheddar',
      name: 'Bacon & Cheddar',
      price: 9.50,
      badge_hu: '',
      badge_sk: '',
      badge: '',
      desc_hu: 'Paradicsomos alap 90 g, Mozzarella 90 g, Cheddar 35 g, bacon 40 g',
      desc_sk: 'Paradajkový základ 90 g, Mozzarella 90 g, Cheddar 35 g, slanina 40 g',
      description: 'Paradicsomos alap 90 g, Mozzarella 90 g, Cheddar 35 g, bacon 40 g',
      image: isSkPage ? '../images/custom.jpg' : 'images/custom.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
      available: true
    },
    {
      id: 'p6',
      name_hu: 'Spicy Jalapeno',
      name_sk: 'Spicy Jalapeno',
      name: 'Spicy Jalapeno',
      price: 9.50,
      badge_hu: 'Csípős 🌶️',
      badge_sk: 'Pikantné 🌶️',
      badge: 'Csípős 🌶️',
      desc_hu: 'Paradicsomos alap 90 g, Mozzarella 120 g, Pepperoni 50 g, Jalapeno 40 g',
      desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, Pepperoni 50 g, Jalapeño 40 g',
      description: 'Paradicsomos alap 90 g, Mozzarella 120 g, Pepperoni 50 g, Jalapeno 40 g',
      image: isSkPage ? '../images/inferno.jpg' : 'images/inferno.jpg',
      fallbackImage: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80',
      available: true
    }
  ];

  // 4. Szótár és fordítási segédletek
  const KNOWN_TRANSLATIONS = {
    p1: { name_sk: 'Margherita', desc_sk: 'Paradajkový základ 90 g, Mozzarella 110 g, Grana Padano 15 g', badge_sk: 'KLASIKA' },
    p2: { name_sk: 'Pepperoni', desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, Pepperoni 70 g', badge_sk: 'BESTSELLER' },
    p3: { name_sk: 'Prosciutto e Mais', desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, šunka 70 g, kukurica 60 g', badge_sk: 'OBĽÚBENÁ' },
    p4: { name_sk: 'Prosciutto e Funghi', desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, šunka 70 g, čerstvé šampiňóny 50 g', badge_sk: '' },
    p5: { name_sk: 'Bacon & Cheddar', desc_sk: 'Paradajkový základ 90 g, Mozzarella 90 g, Cheddar 35 g, slanina 40 g', badge_sk: '' },
    p6: { name_sk: 'Spicy Jalapeno', desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, Pepperoni 50 g, Jalapeño 40 g', badge_sk: 'Pikantné 🌶️' }
  };

  const I18N = {
    hu: {
      statusOpen: 'Rendelhető',
      statusClosed: 'Jelenleg zárva vagyunk',
      closedBanner: '🔒 Jelenleg nem fogadunk új rendeléseket. Hamarosan újra nyitunk!',
      closedAlert: 'Sajnáljuk, jelenleg zárva vagyunk és nem fogadunk új rendeléseket!',
      menuCount: count => `${count} féle pizza`,
      emptyMenu: 'Jelenleg nincs elérhető pizza az étlapon.',
      addBtn: '+ Hozzáadás',
      itemsSelected: count => `${count} tétel kiválasztva`,
      checkoutBtn: 'Rendelés leadása',
      modalTitle: '🛍️ Rendelés összegzése',
      totalPayable: 'Fizetendő összeg:',
      submitBtn: '🍕 Rendelés elküldése',
      submittingBtn: '⏳ Rendelés rögzítése...',
      alertSelectPizza: 'Kérlek válassz legalább egy pizzát a rendeléshez!',
      alertFillRequired: 'Kérlek töltsd ki a neved és telefonszámod a rendeléshez!',
      footerHours: 'Nyitvatartás: Péntek 17:00 - 21:00',
      pieceUnit: 'db',
      reminderSubmitting: '⏳ Feliratkozás...',
      reminderSuccess: 'Köszönjük! A sütési napokon időben értesítünk emailben!'
    },
    sk: {
      statusOpen: 'Prijímame objednávky',
      statusClosed: 'Momentálne máme zatvorené',
      closedBanner: '🔒 Momentálne neprijímame nové objednávky. Čoskoro opäť otvárame!',
      closedAlert: 'Prepáčte, momentálne máme zatvorené a neprijímame nové objednávky!',
      menuCount: count => `${count} druhov pizze`,
      emptyMenu: 'Momentálne nie je v ponuke žiadna pizza.',
      addBtn: '+ Pridať',
      itemsSelected: count => `${count} položiek vybraných`,
      checkoutBtn: 'Odoslať objednávku',
      modalTitle: '🛍️ Zhrnutie objednávky',
      totalPayable: 'Celková suma na úhradu:',
      submitBtn: '🍕 Odoslať objednávku',
      submittingBtn: '⏳ Odosielanie objednávky...',
      alertSelectPizza: 'Prosím, vyberte aspoň jednu pizzu do objednávky!',
      alertFillRequired: 'Prosím, vyplňte vaše meno a telefónne číslo!',
      footerHours: 'Otváracie hodiny: Piatok 17:00 - 21:00',
      pieceUnit: 'ks',
      reminderSubmitting: '⏳ Prihlasovanie...',
      reminderSuccess: 'Ďakujeme! V dňoch pečenia vás včas upozorníme emailom!'
    }
  };

  const t = I18N[currentLang];

  // 5. Állapotváltozók
  let currentMenu = DEFAULT_MENU;
  let cart = {};
  let isStoreOpen = true;

  function getApiUrl() {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed && parsed.scriptUrl && parsed.scriptUrl.trim()) return parsed.scriptUrl.trim();
      } catch (e) {}
    }
    return DEFAULT_SCRIPT_URL;
  }

  function formatPrice(amount) {
    const num = Number(amount) || 0;
    return num.toFixed(2).replace('.', ',') + ' €';
  }

  function translateDescToSk(text) {
    if (!text) return '';
    let res = text;
    res = res.replace(/Paradicsomos alap/gi, 'Paradajkový základ');
    res = res.replace(/Paradicsom alap/gi, 'Paradajkový základ');
    res = res.replace(/friss csiperkegomba/gi, 'čerstvé šampiňóny');
    res = res.replace(/csiperkegomba/gi, 'šampiňóny');
    res = res.replace(/gomba/gi, 'šampiňóny');
    res = res.replace(/sonka/gi, 'šunka');
    res = res.replace(/kukorica/gi, 'kukurica');
    res = res.replace(/bacon/gi, 'slanina');
    res = res.replace(/lilahagyma/gi, 'červená cibuľa');
    res = res.replace(/hagyma/gi, 'cibuľa');
    res = res.replace(/fokhagymás olívaolaj/gi, 'cesnakový olivový olej');
    res = res.replace(/olívaolaj/gi, 'olivový olej');
    res = res.replace(/bazsalikom/gi, 'bazalka');
    res = res.replace(/oregánó/gi, 'oregano');
    res = res.replace(/csípős/gi, 'pikantné');
    return res;
  }

  function getPizzaField(pizza, field) {
    if (!pizza) return '';
    const id = String(pizza.id || '').toLowerCase();
    const pName = String(pizza.name || pizza.name_hu || pizza.name_sk || '').trim().toLowerCase();

    let known = KNOWN_TRANSLATIONS[id];
    if (!known) {
      if (pName.includes('margherita')) known = KNOWN_TRANSLATIONS.p1;
      else if (pName.includes('pepperoni')) known = KNOWN_TRANSLATIONS.p2;
      else if (pName.includes('mais') || (pName.includes('kukoric') && pName.includes('sonk'))) known = KNOWN_TRANSLATIONS.p3;
      else if (pName.includes('funghi') || (pName.includes('gomb') && pName.includes('sonk'))) known = KNOWN_TRANSLATIONS.p4;
      else if (pName.includes('bacon') || pName.includes('cheddar')) known = KNOWN_TRANSLATIONS.p5;
      else if (pName.includes('jalapeno') || pName.includes('inferno') || pName.includes('csípős')) known = KNOWN_TRANSLATIONS.p6;
    }

    if (currentLang === 'sk') {
      if (field === 'name') {
        if (pizza.name_sk && pizza.name_sk.trim() && pizza.name_sk !== pizza.name_hu) {
          return pizza.name_sk;
        }
        if (known && known.name_sk) return known.name_sk;
        return pizza.name_sk || pizza.name || pizza.name_hu || '';
      }
      if (field === 'desc') {
        if (pizza.desc_sk && pizza.desc_sk.trim() && !pizza.desc_sk.includes('Paradicsomos') && !pizza.desc_sk.includes('sonka') && !pizza.desc_sk.includes('alap')) {
          return pizza.desc_sk;
        }
        if (known && known.desc_sk) return known.desc_sk;
        const rawDesc = pizza.desc_sk || pizza.description || pizza.desc_hu || '';
        return translateDescToSk(rawDesc);
      }
      if (field === 'badge') {
        if (pizza.badge_sk && pizza.badge_sk.trim()) return pizza.badge_sk;
        if (known && known.badge_sk !== undefined) return known.badge_sk;
        const rawBadge = pizza.badge || pizza.badge_hu || '';
        if (rawBadge.toUpperCase() === 'CLASSIC' || rawBadge === 'Klasszikus') return 'KLASIKA';
        if (rawBadge.toUpperCase() === 'FAVOURITE' || rawBadge === 'Kedvenc') return 'OBĽÚBENÁ';
        if (rawBadge.includes('Csípős')) return 'Pikantné 🌶️';
        return rawBadge;
      }
    } else {
      if (field === 'name') return pizza.name_hu || pizza.name || pizza.name_sk || '';
      if (field === 'desc') return pizza.desc_hu || pizza.description || pizza.desc_sk || '';
      if (field === 'badge') return pizza.badge_hu || pizza.badge || pizza.badge_sk || '';
    }
    return '';
  }

  // 6. Nyitvatartás felirat lekérése
  function getOpeningHoursText() {
    const saved = localStorage.getItem(HOURS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (currentLang === 'sk' && parsed.sk && parsed.sk.trim()) {
          return parsed.sk.startsWith('Otváracie') ? parsed.sk : `Otváracie hodiny: ${parsed.sk}`;
        } else if (currentLang === 'hu' && parsed.hu && parsed.hu.trim()) {
          return parsed.hu.startsWith('Nyitvatartás') ? parsed.hu : `Nyitvatartás: ${parsed.hu}`;
        }
      } catch (e) {}
    }
    return t.footerHours;
  }

  // 7. Bolt nyitvatartási állapotának kezelése
  function loadStoreStatus() {
    const saved = localStorage.getItem(STORE_STATUS_KEY);
    isStoreOpen = (saved !== 'closed');
    updateStoreStatusUI();
  }

  function updateStoreStatusUI() {
    const badge = document.getElementById('storeStatusBadge');
    const textSpan = document.getElementById('txtStatusBadge');
    const closedBanner = document.getElementById('closedStoreBanner');
    const heroBanner = document.getElementById('txtHeroBanner');

    if (!badge || !textSpan) return;

    if (isStoreOpen) {
      badge.className = 'status-badge open';
      textSpan.innerText = t.statusOpen;
      if (closedBanner) closedBanner.style.display = 'none';
      if (heroBanner) heroBanner.style.display = 'inline-flex';
    } else {
      badge.className = 'status-badge closed';
      textSpan.innerText = t.statusClosed;
      if (closedBanner) {
        closedBanner.style.display = 'flex';
        const cbText = document.getElementById('txtClosedBanner');
        if (cbText) cbText.innerText = t.closedBanner;
      }
      if (heroBanner) heroBanner.style.display = 'none';
    }
  }

  // 8. Kosár perzisztencia
  function loadCart() {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart) || {};
      } catch (e) {
        cart = {};
      }
    } else {
      cart = {};
    }
  }

  function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }

  // 9. Étlap betöltése és kirajzolása
  function loadMenu() {
    const saved = localStorage.getItem(MENU_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(p => p && p.available !== false)) {
          const isCorrupt = parsed.some(p => !p || !p.id || typeof p.price !== 'number' || p.price <= 0);
          if (isCorrupt) {
            currentMenu = DEFAULT_MENU;
            localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(DEFAULT_MENU));
          } else {
            currentMenu = parsed;
          }
        } else {
          currentMenu = DEFAULT_MENU;
          localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(DEFAULT_MENU));
        }
      } catch (e) {
        currentMenu = DEFAULT_MENU;
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(DEFAULT_MENU));
      }
    } else {
      currentMenu = DEFAULT_MENU;
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(DEFAULT_MENU));
    }
    renderMenu();
  }

  function renderMenu() {
    const grid = document.getElementById('pizzaGrid');
    if (!grid) return;

    if (!currentMenu || !Array.isArray(currentMenu) || currentMenu.length === 0) {
      currentMenu = DEFAULT_MENU;
    }

    const availableItems = currentMenu.filter(item => item && item.available !== false);
    const countLabel = document.getElementById('menuCountLabel');
    if (countLabel) countLabel.innerText = t.menuCount(availableItems.length);

    if (availableItems.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">${t.emptyMenu}</div>`;
      return;
    }

    grid.innerHTML = availableItems.map(pizza => {
      const qty = cart[pizza.id] || 0;
      const fallbackImg = pizza.fallbackImage || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80";
      let imgSrc = pizza.image || fallbackImg;
      if (isSkPage && imgSrc.startsWith('images/')) {
        imgSrc = '../' + imgSrc;
      }

      const pName = getPizzaField(pizza, 'name');
      const pDesc = getPizzaField(pizza, 'desc');
      const pBadge = getPizzaField(pizza, 'badge');

      return `
        <div class="pizza-card" data-id="${pizza.id}">
          <div class="pizza-image-wrapper">
            <img src="${imgSrc}" alt="${pName}" class="pizza-image" loading="lazy" onerror="this.src='${fallbackImg}'">
            ${pBadge ? `<span class="pizza-badge">${pBadge}</span>` : ''}
          </div>
          <div class="pizza-content">
            <div>
              <div class="pizza-title-row">
                <h4 class="pizza-name">${pName}</h4>
                <span class="pizza-price">${formatPrice(pizza.price)}</span>
              </div>
              <p class="pizza-desc">${pDesc}</p>
            </div>

            <div class="card-actions">
              ${qty === 0 ? `
                <button class="add-first-btn" onclick="window.BrooklynApp.updateQty('${pizza.id}', 1)">
                  <span>${t.addBtn}</span>
                </button>
              ` : `
                <div class="qty-control">
                  <button class="qty-btn" onclick="window.BrooklynApp.updateQty('${pizza.id}', -1)">-</button>
                  <span class="qty-number has-items">${qty} ${t.pieceUnit}</span>
                  <button class="qty-btn" onclick="window.BrooklynApp.updateQty('${pizza.id}', 1)">+</button>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    updateCartBar();
  }

  function updateQty(pizzaId, delta) {
    if (!isStoreOpen && delta > 0) {
      alert(t.closedAlert);
      return;
    }
    const current = cart[pizzaId] || 0;
    const next = current + delta;
    if (next <= 0) {
      delete cart[pizzaId];
    } else {
      cart[pizzaId] = next;
    }
    saveCart();
    renderMenu();
  }

  function getCartSummary() {
    let totalCount = 0;
    let totalPrice = 0;
    const items = [];

    for (const [id, qty] of Object.entries(cart)) {
      if (qty > 0) {
        const pizza = currentMenu.find(p => p.id === id) || DEFAULT_MENU.find(p => p.id === id);
        if (pizza) {
          totalCount += qty;
          const price = Number(pizza.price) || 9.50;
          totalPrice += price * qty;
          items.push({
            id: pizza.id,
            name: getPizzaField(pizza, 'name'),
            price: price,
            qty: qty
          });
        }
      }
    }
    return { totalCount, totalPrice, items };
  }

  function updateCartBar() {
    const bar = document.getElementById('stickyCartBar');
    if (!bar) return;

    const { totalCount, totalPrice } = getCartSummary();

    if (totalCount > 0) {
      document.getElementById('cartTotalCount').innerText = t.itemsSelected(totalCount);
      document.getElementById('cartTotalPrice').innerText = formatPrice(totalPrice);
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  }

  function openOrderModal() {
    const { totalCount, totalPrice, items } = getCartSummary();
    if (totalCount === 0) {
      alert(t.alertSelectPizza);
      return;
    }

    const itemsContainer = document.getElementById('orderItemsList');
    if (itemsContainer) {
      itemsContainer.innerHTML = items.map(it => `
        <div class="order-item-row">
          <div>
            <span class="order-item-qty">${it.qty}x</span>
            <span class="order-item-title">${it.name}</span>
          </div>
          <span class="order-item-price">${formatPrice(it.price * it.qty)}</span>
        </div>
      `).join('');
    }

    const modalTotal = document.getElementById('modalTotalPrice');
    if (modalTotal) modalTotal.innerText = formatPrice(totalPrice);

    document.getElementById('orderFormView').style.display = 'block';
    document.getElementById('orderSuccessView').style.display = 'none';
    document.getElementById('orderModal').classList.add('active');
  }

  function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.classList.remove('active');
  }

  async function submitOrder(e) {
    if (e) e.preventDefault();
    if (!isStoreOpen) {
      alert(t.closedAlert);
      return;
    }

    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const notesInput = document.getElementById('orderNotes');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!name || !phone) {
      alert(t.alertFillRequired);
      return;
    }

    const { totalCount, totalPrice, items } = getCartSummary();
    if (totalCount === 0) {
      alert(t.alertSelectPizza);
      return;
    }

    const submitBtn = document.getElementById('submitOrderBtn');
    const submitBtnText = document.getElementById('txtSubmitBtnText');
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtnText) submitBtnText.innerText = t.submittingBtn;

    const orderData = {
      action: 'newOrder',
      name: name,
      phone: phone,
      notes: notes,
      items: items,
      totalAmount: totalPrice,
      currency: 'EUR',
      lang: currentLang,
      timestamp: new Date().toISOString()
    };

    // Helyi mentés
    let localOrders = [];
    try {
      localOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
    } catch (err) {}
    localOrders.unshift({
      rowIndex: localOrders.length + 2,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      name: name,
      phone: phone,
      pizza: items.map(it => `${it.qty}x ${it.name}`).join(', '),
      items: items,
      totalAmount: totalPrice,
      currency: 'EUR',
      lang: currentLang,
      notes: notes,
      status: 'Új'
    });
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(localOrders));

    // Felhőbe küldés
    const scriptUrl = getApiUrl();
    if (scriptUrl) {
      try {
        fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(orderData)
        });
      } catch (err) {
        console.warn('Hálózati figyelmeztetés:', err);
      }
    }

    // Sikeres képernyő megjelenítése
    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
      if (submitBtnText) submitBtnText.innerText = t.submitBtn;

      const summaryHtml = `
        <strong>${isSkPage ? 'Meno:' : 'Rendelő:'}</strong> ${name}<br>
        <strong>${isSkPage ? 'Telefón:' : 'Telefonszám:'}</strong> ${phone}<br>
        <strong>${isSkPage ? 'Objednávka:' : 'Rendelt tételek:'}</strong> ${items.map(it => `${it.qty}x ${it.name}`).join(', ')}<br>
        <strong>${isSkPage ? 'Celková suma:' : 'Végösszeg:'}</strong> ${formatPrice(totalPrice)}<br>
        ${notes ? `<strong>${isSkPage ? 'Poznámka:' : 'Megjegyzés:'}</strong> ${notes}` : ''}
      `;
      const sDetails = document.getElementById('successDetails');
      if (sDetails) sDetails.innerHTML = summaryHtml;

      document.getElementById('orderFormView').style.display = 'none';
      document.getElementById('orderSuccessView').style.display = 'block';

      // Kosár ürítése
      cart = {};
      saveCart();
      renderMenu();
    }, 600);
  }

  function resetOrderForm() {
    closeOrderModal();
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const notesInput = document.getElementById('orderNotes');
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (notesInput) notesInput.value = '';
  }

  // 10. Sütési emlékeztető email feliratkozás
  async function submitReminder(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('reminderEmailInput');
    const btn = document.getElementById('btnReminderSubmit');
    const btnText = document.getElementById('txtReminderBtn');
    const successEl = document.getElementById('reminderSuccessMsg');

    const email = emailInput ? emailInput.value.trim() : '';
    if (!email || !email.includes('@')) return;

    if (btn) btn.disabled = true;
    if (btnText) btnText.innerText = t.reminderSubmitting;

    const scriptUrl = getApiUrl();
    if (scriptUrl) {
      try {
        fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'subscribeReminder',
            email: email,
            lang: currentLang
          })
        });
      } catch (err) {}
    }

    setTimeout(() => {
      if (btn) btn.disabled = false;
      if (btnText) btnText.innerText = isSkPage ? '🔔 Chcem pripomienku' : '🔔 Emlékeztetőt kérek';
      if (emailInput) emailInput.value = '';
      if (successEl) successEl.style.display = 'inline-flex';
      setTimeout(() => {
        if (successEl) successEl.style.display = 'none';
      }, 5000);
    }, 500);
  }

  // 11. Felhő adatok szinkronizálása
  async function fetchCloudData() {
    const scriptUrl = getApiUrl();
    if (scriptUrl) {
      try {
        const res = await fetch(scriptUrl);
        if (!res.ok) return;
        const data = await res.json();
        let hasChanges = false;

        if (data.menu && Array.isArray(data.menu) && data.menu.length > 0) {
          const validCloudMenu = data.menu.filter(p => p && p.id && typeof p.price === 'number' && p.price > 0);
          if (validCloudMenu.length > 0 && validCloudMenu.some(p => p.available !== false)) {
            currentMenu = validCloudMenu;
            localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(currentMenu));
            hasChanges = true;
          }
        }

        if (data.storeStatus) {
          const nextOpen = (data.storeStatus !== 'closed');
          if (isStoreOpen !== nextOpen) {
            isStoreOpen = nextOpen;
            localStorage.setItem(STORE_STATUS_KEY, isStoreOpen ? 'open' : 'closed');
            updateStoreStatusUI();
          }
        }

        if (data.openingHours && (data.openingHours.hu || data.openingHours.sk)) {
          localStorage.setItem(HOURS_STORAGE_KEY, JSON.stringify(data.openingHours));
          const hoursEl = document.getElementById('txtFooterHours');
          if (hoursEl) hoursEl.innerText = getOpeningHoursText();
        }

        if (hasChanges) {
          renderMenu();
        }
      } catch (err) {
        console.warn('Felhő szinkronizációs figyelmeztetés:', err);
      }
    }
  }

  // 12. Inicializálás
  function initApp() {
    // Lábléc nyitvatartás beállítása
    const hoursEl = document.getElementById('txtFooterHours');
    if (hoursEl) hoursEl.innerText = getOpeningHoursText();

    loadStoreStatus();
    loadCart();
    loadMenu();

    // Modal bezárás kattintásra
    const modalEl = document.getElementById('orderModal');
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target.id === 'orderModal') closeOrderModal();
      });
    }

    // Háttérben szinkronizálás
    fetchCloudData();
    setInterval(fetchCloudData, 30000);

    // Lap visszatéréskor frissítés
    window.addEventListener('focus', () => {
      loadStoreStatus();
      loadCart();
      loadMenu();
    });

    // Tároló változásakor (pl. másik fülön változtatva)
    window.addEventListener('storage', (e) => {
      if (e.key === MENU_STORAGE_KEY || e.key === CART_STORAGE_KEY || e.key === STORE_STATUS_KEY || e.key === HOURS_STORAGE_KEY) {
        loadStoreStatus();
        loadCart();
        loadMenu();
        if (hoursEl) hoursEl.innerText = getOpeningHoursText();
      }
    });
  }

  // Globális scope-ra exportálás
  window.BrooklynApp = {
    updateQty,
    openOrderModal,
    closeOrderModal,
    submitOrder,
    resetOrderForm,
    submitReminder
  };

  // DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
