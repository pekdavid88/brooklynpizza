/**
 * BROOKLYN PIZZA — GOOGLE APPS SCRIPT BACKEND (EUR & BILINGUAL HU/SK & EMAIL NOTIFICATIONS)
 *
 * Beállítási útmutató:
 * 1. Nyiss meg egy Google Táblázatot.
 * 2. Menü: Bővítmények > Apps Script (Extensions > Apps Script).
 * 3. Töröld ki az ott lévő alapértelmezett kódot, és másold be ezt a TELJES kódot.
 * 4. A SPREADSHEET_ID változóhoz illeszd be a táblázatod ID-ját (az URL-ből: https://docs.google.com/spreadsheets/d/ITT_VAN_AZ_ID/edit).
 * 5. Kattints a jobb felső kék "Központi telepítés" (Deploy) > "Új telepítés" (New deployment) gombra:
 *    - Típus választása: Webalkalmazás (Web app)
 *    - Leírás: Brooklyn Pizza API
 *    - Végrehajtás mint: Én (Me - a te Google fiókod)
 *    - Ki férhet hozzá: Bárki (Anyone)
 * 6. Kattints a "Telepítés" gombra, és engedélyezd a jogosultságokat (Google Fiók hozzáférés: Táblázat írás + Email küldés).
 * 7. A kapott Webalkalmazás URL-t (https://script.google.com/macros/s/.../exec) másold be az admin felület Beállítások fülébe!
 */

// Ide másold be a Google Táblázatod ID-ját:
const SPREADSHEET_ID = "1TkCG4TXrhoG7kAPYYFW6ke7r9GYFAsj9CPQCiuH83ME";
const SHEET_ORDERS = "Rendelések";
const SHEET_MENU = "Étlap";
const SHEET_SUBSCRIBERS = "Feliratkozók";

// Címzett email cím az azonnali értesítésekhez:
const NOTIFICATION_EMAIL = "order.brooklynpizza@gmail.com";

// Opcionális: Telegram értesítés új rendeléskor
const TELEGRAM_TOKEN = ""; // pl. "123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
const TELEGRAM_CHAT_ID = ""; // pl. "-100123456789" vagy "12345678"

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. Rendelések beolvasása
  let orderSheet = ss.getSheetByName(SHEET_ORDERS);
  if (!orderSheet) {
    orderSheet = ss.insertSheet(SHEET_ORDERS);
    orderSheet.appendRow(["Időbélyeg", "Név", "Telefonszám", "Pizzák", "Megjegyzés", "Státusz", "Végösszeg (€)", "Nyelv"]);
  }

  const orderRows = orderSheet.getDataRange().getValues();
  const orderDisplayRows = orderSheet.getDataRange().getDisplayValues();
  const orders = [];

  for (let i = 1; i < orderRows.length; i++) {
    const row = orderRows[i];
    const dispRow = orderDisplayRows[i] || [];
    if (row[1]) {
      const rawDate = new Date(row[0]);

      // Megjegyzés helyes formázása (hogy a "20:00" pontosan 20:00 maradjon)
      let notesVal = "";
      if (dispRow && dispRow[4]) {
        notesVal = String(dispRow[4]).trim();
      } else if (row[4] instanceof Date) {
        notesVal = Utilities.formatDate(row[4], ss.getSpreadsheetTimeZone(), "HH:mm");
      } else {
        notesVal = String(row[4] || "");
      }

      orders.push({
        rowIndex: i + 1,
        date: Utilities.formatDate(rawDate, "GMT+2", "yyyy-MM-dd"),
        time: Utilities.formatDate(rawDate, "GMT+2", "HH:mm"),
        name: row[1],
        phone: String(row[2]).replace(/[^0-9+]/g, ''),
        pizza: row[3],
        notes: notesVal,
        status: row[5] || "Új",
        totalAmount: row[6] ? Number(row[6]) : null,
        lang: row[7] || "hu"
      });
    }
  }

  // 2. Étlap beolvasása (kétnyelvű támogatással)
  let menuSheet = ss.getSheetByName(SHEET_MENU);
  let menu = [];
  if (menuSheet) {
    const menuRows = menuSheet.getDataRange().getValues();
    for (let j = 1; j < menuRows.length; j++) {
      const mRow = menuRows[j];
      if (mRow[0] && mRow[1]) {
        const rawAvail = String(mRow[8] !== undefined ? mRow[8] : '').trim().toLowerCase();
        const isAvail = mRow[8] !== false && rawAvail !== 'false' && rawAvail !== 'hamis' && rawAvail !== '0' && rawAvail !== 'nem';
        menu.push({
          id: String(mRow[0]),
          name_hu: mRow[1],
          name_sk: mRow[2] || mRow[1],
          name: mRow[1],
          price: Number(mRow[3]) || 9.50,
          badge_hu: mRow[4] || "",
          badge_sk: mRow[4] || "",
          badge: mRow[4] || "",
          desc_hu: mRow[5] || "",
          desc_sk: mRow[6] || mRow[5] || "",
          description: mRow[5] || "",
          image: mRow[7] || "images/margherita.jpg",
          available: isAvail
        });
      }
    }
  }

  // Ha az Étlap még üres a Google Táblázatban, adjuk vissza az alapértelmezett 6 prémium pizzát:
  if (menu.length === 0) {
    menu = [
      { id: 'p1', name_hu: 'Margherita', name_sk: 'Margherita', name: 'Margherita', price: 9.50, badge_hu: 'CLASSIC', badge_sk: 'KLASIKA', badge: 'CLASSIC', desc_hu: 'Paradicsomos alap 90 g, Mozzarella 110 g, Grana Padano 15 g', desc_sk: 'Paradajkový základ 90 g, Mozzarella 110 g, Grana Padano 15 g', description: 'Paradicsomos alap 90 g, Mozzarella 110 g, Grana Padano 15 g', image: 'images/margherita.jpg', available: true },
      { id: 'p2', name_hu: 'Pepperoni', name_sk: 'Pepperoni', name: 'Pepperoni', price: 9.50, badge_hu: 'BESTSELLER', badge_sk: 'BESTSELLER', badge: 'BESTSELLER', desc_hu: 'Paradicsomos alap 90 g, Mozzarella 120 g, Pepperoni 70 g', desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, Pepperoni 70 g', description: 'Paradicsomos alap 90 g, Mozzarella 120 g, Pepperoni 70 g', image: 'images/pepperoni.jpg', available: true },
      { id: 'p3', name_hu: 'Prosciutto e Mais', name_sk: 'Prosciutto e Mais', name: 'Prosciutto e Mais', price: 9.50, badge_hu: 'FAVOURITE', badge_sk: 'OBĽÚBENÁ', badge: 'FAVOURITE', desc_hu: 'Paradicsomos alap 90 g, Mozzarella 120 g, sonka 70 g, kukorica 60 g', desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, šunka 70 g, kukurica 60 g', description: 'Paradicsomos alap 90 g, Mozzarella 120 g, sonka 70 g, kukorica 60 g', image: 'images/prosciutto.jpg', available: true },
      { id: 'p4', name_hu: 'Prosciutto e Funghi', name_sk: 'Prosciutto e Funghi', name: 'Prosciutto e Funghi', price: 9.50, badge_hu: '', badge_sk: '', badge: '', desc_hu: 'Paradicsomos alap 90 g, Mozzarella 120 g, sonka 70 g, friss csiperkegomba 50 g', desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, šunka 70 g, čerstvé šampiňóny 50 g', description: 'Paradicsomos alap 90 g, Mozzarella 120 g, sonka 70 g, friss csiperkegomba 50 g', image: 'images/prosciutto.jpg', available: true },
      { id: 'p5', name_hu: 'Bacon & Cheddar', name_sk: 'Bacon & Cheddar', name: 'Bacon & Cheddar', price: 9.50, badge_hu: '', badge_sk: '', badge: '', desc_hu: 'Paradicsomos alap 90 g, Mozzarella 90 g, Cheddar 35 g, bacon 40 g', desc_sk: 'Paradajkový základ 90 g, Mozzarella 90 g, Cheddar 35 g, slanina 40 g', description: 'Paradicsomos alap 90 g, Mozzarella 90 g, Cheddar 35 g, bacon 40 g', image: 'images/custom.jpg', available: true },
      { id: 'p6', name_hu: 'Spicy Jalapeno', name_sk: 'Spicy Jalapeno', name: 'Spicy Jalapeno', price: 9.50, badge_hu: 'Csípős 🌶️', badge_sk: 'Pikantné 🌶️', badge: 'Csípős 🌶️', desc_hu: 'Paradicsomos alap 90 g, Mozzarella 120 g, Pepperoni 50 g, Jalapeno 40 g', desc_sk: 'Paradajkový základ 90 g, Mozzarella 120 g, Pepperoni 50 g, Jalapeño 40 g', description: 'Paradicsomos alap 90 g, Mozzarella 120 g, Pepperoni 50 g, Jalapeno 40 g', image: 'images/inferno.jpg', available: true }
    ];
  }

  // 3. Nyitvatartási állapot és nyitvatartási idő lekérése
  const props = PropertiesService.getScriptProperties();
  const storeStatus = props.getProperty('STORE_STATUS') || 'open';
  const openingHoursHu = props.getProperty('OPENING_HOURS_HU') || 'Péntek 17:00 - 21:00';
  const openingHoursSk = props.getProperty('OPENING_HOURS_SK') || 'Piatok 17:00 - 21:00';

  // 4. Emlékeztetőre feliratkozottak száma
  let subSheet = ss.getSheetByName(SHEET_SUBSCRIBERS);
  let subscribersCount = 0;
  let subscribers = [];
  if (subSheet) {
    const subRows = subSheet.getDataRange().getValues();
    for (let s = 1; s < subRows.length; s++) {
      if (subRows[s][1]) {
        subscribers.push({
          email: String(subRows[s][1]).trim(),
          lang: subRows[s][2] || 'hu',
          date: subRows[s][0]
        });
      }
    }
    subscribersCount = subscribers.length;
  }

  return ContentService.createTextOutput(JSON.stringify({
    orders: orders.reverse(),
    menu: menu,
    storeStatus: storeStatus,
    openingHours: {
      hu: openingHoursHu,
      sk: openingHoursSk
    },
    subscribersCount: subscribersCount,
    subscribers: subscribers
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // --- Nyitvatartási Állapot Mentése (Nyitva / Zárva) ---
    if (data.action === "setStoreStatus") {
      const newStatus = (data.status === 'closed') ? 'closed' : 'open';
      PropertiesService.getScriptProperties().setProperty('STORE_STATUS', newStatus);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", storeStatus: newStatus })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- Nyitvatartási Idő Beállítása (Opening Hours) ---
    if (data.action === "setOpeningHours") {
      if (data.hu) PropertiesService.getScriptProperties().setProperty('OPENING_HOURS_HU', String(data.hu).trim());
      if (data.sk) PropertiesService.getScriptProperties().setProperty('OPENING_HOURS_SK', String(data.sk).trim());
      return ContentService.createTextOutput(JSON.stringify({ status: "success", openingHours: { hu: data.hu, sk: data.sk } })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- Új Rendelés Rögzítése ---
    if (data.action === "newOrder") {
      let orderSheet = ss.getSheetByName(SHEET_ORDERS);
      if (!orderSheet) {
        orderSheet = ss.insertSheet(SHEET_ORDERS);
        orderSheet.appendRow(["Időbélyeg", "Név", "Telefonszám", "Pizzák", "Megjegyzés", "Státusz", "Végösszeg (€)", "Nyelv"]);
      }

      const timestamp = new Date();
      const rawNotes = data.notes ? String(data.notes).trim() : "";
      const safeNotes = (/^\d{1,2}:\d{2}/.test(rawNotes) || /^\d+$/.test(rawNotes)) ? ("'" + rawNotes) : rawNotes;

      orderSheet.appendRow([
        timestamp,
        data.name,
        "'" + String(data.phone || ''),
        data.pizza,
        safeNotes,
        data.status || "Új",
        data.totalAmount ? Number(data.totalAmount) : "",
        data.lang || "hu"
      ]);

      // 1. Azonnali Email Értesítés küldése az order.brooklynpizza@gmail.com címre
      if (NOTIFICATION_EMAIL) {
        sendEmailAlert(data);
      }

      // 2. Telegram értesítés küldése ha be van állítva
      if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
        sendTelegramAlert(data);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- Sütési Emlékeztető Feliratkozás ---
    if (data.action === "subscribeReminder" && data.email) {
      let subSheet = ss.getSheetByName(SHEET_SUBSCRIBERS);
      if (!subSheet) {
        subSheet = ss.insertSheet(SHEET_SUBSCRIBERS);
        subSheet.appendRow(["Időbélyeg", "Email cím", "Nyelv", "Státusz"]);
      }

      const email = String(data.email).trim().toLowerCase();
      const lang = data.lang === 'sk' ? 'sk' : 'hu';
      const existingRows = subSheet.getDataRange().getValues();
      let alreadySubscribed = false;

      for (let k = 1; k < existingRows.length; k++) {
        if (String(existingRows[k][1]).trim().toLowerCase() === email) {
          alreadySubscribed = true;
          break;
        }
      }

      if (!alreadySubscribed) {
        subSheet.appendRow([new Date(), email, lang, "Aktív"]);
        // Visszaigazoló email küldése a vásárlónak
        sendSubscriberConfirmationEmail(email, lang);
        // Értesítés a pizzériának
        if (NOTIFICATION_EMAIL) {
          try {
            MailApp.sendEmail({
              to: NOTIFICATION_EMAIL,
              subject: `📬 Új sütési emlékeztető feliratkozó: ${email}`,
              body: `Új vásárló iratkozott fel a sütési nap értesítőre:\nEmail: ${email}\nNyelv: ${lang === 'sk' ? 'Szlovák (SK)' : 'Magyar (HU)'}\nIdőpont: ${new Date().toLocaleString()}`
            });
          } catch(e) {}
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "subscribed", email: email })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- Sütési Nap Emlékeztető Kiküldése az Összes Feliratkozónak ---
    if (data.action === "sendBakingDayReminder") {
      let subSheet = ss.getSheetByName(SHEET_SUBSCRIBERS);
      if (!subSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "no_subscribers", count: 0 })).setMimeType(ContentService.MimeType.JSON);
      }

      const subRows = subSheet.getDataRange().getValues();
      let sentCount = 0;

      for (let m = 1; m < subRows.length; m++) {
        const row = subRows[m];
        const email = String(row[1]).trim();
        const lang = row[2] || 'hu';
        const status = row[3] || 'Aktív';

        if (email && email.includes('@') && status !== 'Leiratkozott') {
          try {
            sendBakingDayReminderEmail(email, lang, data.customMessage || "");
            sentCount++;
          } catch (err) {
            Logger.log("Hiba az email küldésekor: " + email + " " + err.toString());
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "reminders_sent", count: sentCount })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- Státusz Frissítése ---
    if (data.action === "updateStatus") {
      const orderSheet = ss.getSheetByName(SHEET_ORDERS);
      if (orderSheet && data.rowIndex) {
        orderSheet.getRange(data.rowIndex, 6).setValue(data.newStatus);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "status_updated" })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- Étlap Mentése ---
    if (data.action === "saveMenu" && Array.isArray(data.menu)) {
      let menuSheet = ss.getSheetByName(SHEET_MENU);
      if (menuSheet) {
        menuSheet.clear();
      } else {
        menuSheet = ss.insertSheet(SHEET_MENU);
      }

      menuSheet.appendRow(["ID", "Név (HU)", "Názov (SK)", "Ár (€)", "Címke", "Leírás (HU)", "Popis (SK)", "Kép URL", "Elérhető"]);
      data.menu.forEach(item => {
        menuSheet.appendRow([
          item.id || "",
          item.name_hu || item.name || "",
          item.name_sk || item.name_hu || item.name || "",
          item.price ? Number(item.price) : 0,
          item.badge_hu || item.badge || "",
          item.desc_hu || item.description || "",
          item.desc_sk || item.desc_hu || item.description || "",
          item.image || "",
          item.available !== false
        ]);
      });

      return ContentService.createTextOutput(JSON.stringify({ status: "menu_saved" })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "unknown_action" })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Azonnali Email értesítő küldése az order.brooklynpizza@gmail.com címre
 */
function sendEmailAlert(data) {
  try {
    const isSk = data.lang === 'sk';
    const totalFormatted = data.totalAmount ? Number(data.totalAmount).toFixed(2) + ' €' : '';
    const subject = `🍕 ÚJ RENDELÉS: ${data.name} — ${data.pizza} ${totalFormatted ? '(' + totalFormatted + ')' : ''}`;

    const plainText =
`🍕 ÚJ BROOKLYN PIZZA RENDELÉS ÉRKEZETT!

----------------------------------------
🍕 Pizza típusa: ${data.pizza}
👤 Név: ${data.name}
📱 Telefonszám: ${data.phone}
📝 Megjegyzés: ${data.notes || 'Nincs megjegyzés'}
💰 Végösszeg: ${totalFormatted || '-'}
🌐 Nyelv: ${isSk ? '🇸🇰 Szlovák (SK)' : '🇭🇺 Magyar (HU)'}
🕒 Időpont: ${Utilities.formatDate(new Date(), "GMT+2", "yyyy-MM-dd HH:mm:ss")}
----------------------------------------

Ez egy automatikus értesítés a Brooklyn Pizza online rendelési felületéről.`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #090d16; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 540px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 16px;">
          <h1 style="color: #f97316; margin: 0; font-size: 24px; letter-spacing: -0.5px;">🍕 Brooklyn Pizza</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Új online rendelés érkezett!</p>
        </div>

        <div style="background-color: #131b2e; border: 1px solid #1e293b; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; width: 130px;"><strong>🍕 Pizza típusa:</strong></td>
              <td style="padding: 8px 0; color: #fff; font-weight: bold; font-size: 15px;">${data.pizza}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;"><strong>👤 Név:</strong></td>
              <td style="padding: 8px 0; color: #fff; font-weight: bold;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;"><strong>📱 Telefonszám:</strong></td>
              <td style="padding: 8px 0;"><a href="tel:${data.phone}" style="color: #38bdf8; text-decoration: none; font-weight: bold;">${data.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;"><strong>📝 Megjegyzés:</strong></td>
              <td style="padding: 8px 0; color: #fde047;">${data.notes ? data.notes : '<em style="color:#64748b;">Nincs megjegyzés</em>'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;"><strong>💰 Végösszeg:</strong></td>
              <td style="padding: 8px 0; color: #f97316; font-weight: bold; font-size: 16px;">${totalFormatted || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;"><strong>🌐 Nyelv:</strong></td>
              <td style="padding: 8px 0; color: #cbd5e1;">${isSk ? '🇸🇰 Szlovák (SK)' : '🇭🇺 Magyar (HU)'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;"><strong>🕒 Időpont:</strong></td>
              <td style="padding: 8px 0; color: #94a3b8; font-size: 12px;">${Utilities.formatDate(new Date(), "GMT+2", "yyyy-MM-dd HH:mm")}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center;">
          <a href="tel:${String(data.phone).replace(/[^0-9+]/g, '')}"
             style="display: inline-block; background-color: #3b82f6; color: #fff; padding: 10px 18px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 13px; margin: 4px;">
            📞 Hívás
          </a>
          <a href="sms:${String(data.phone).replace(/[^0-9+]/g, '')}"
             style="display: inline-block; background-color: #22c55e; color: #022c22; padding: 10px 18px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 13px; margin: 4px;">
            💬 SMS küldése
          </a>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: subject,
      body: plainText,
      htmlBody: htmlBody
    });
  } catch (err) {
    Logger.log("Email küldési hiba: " + err.toString());
  }
}

function sendTelegramAlert(data) {
  try {
    const isSk = data.lang === 'sk';
    const text = `🍕 *${isSk ? 'NOVÁ OBJEDNÁVKA' : 'ÚJ RENDELÉS'} — BROOKLYN PIZZA*\n\n👤 *${isSk ? 'Meno' : 'Név'}:* ${data.name}\n📱 *Tel:* ${data.phone}\n🍕 *${isSk ? 'Položky' : 'Tételek'}:* ${data.pizza}\n💰 *${isSk ? 'Suma' : 'Végösszeg'}:* ${data.totalAmount ? Number(data.totalAmount).toFixed(2) + ' €' : '-'}\n🌐 *${isSk ? 'Jazyk' : 'Nyelv'}:* ${isSk ? '🇸🇰 SK' : '🇭🇺 HU'}\n📝 *${isSk ? 'Poznámka' : 'Megjegyzés'}:* ${data.notes || '-'}`;

    UrlFetchApp.fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "post",
      payload: {
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: "Markdown"
      }
    });
  } catch (e) {
    // Értesítési hiba naplózása
  }
}

/**
 * Feliratkozás megerősítő email küldése az új feliratkozónak
 */
function sendSubscriberConfirmationEmail(email, lang) {
  try {
    const isSk = lang === 'sk';
    const subject = isSk
      ? "🍕 Brooklyn Pizza — Pripomienka pečenia potvrdená!"
      : "🍕 Brooklyn Pizza — Sütési emlékeztető feliratkozás megerősítve!";

    const plainText = isSk
      ? `Ahoj!\n\nĎakujeme za prihlásenie na odber pripomienok pečenia Brooklyn Pizza.\nKeď najbližšie rozkúrime pec a budeme piecť čerstvú remeselnú pizzu, pošleme vám e-mailovú pripomienku, aby ste si stihli včas objednať.\n\nTešíme sa na vás!\nBrooklyn Pizza`
      : `Szia!\n\nKöszönjük, hogy feliratkoztál a Brooklyn Pizza sütési emlékeztetőjére!\nAmikor legközelebb begyújtjuk a kemencét és friss kézműves pizzákat sütünk, időben küldünk egy emlékeztető emailt, hogy le ne maradj a kedvenc pizzádról!\n\nSzeretettel várunk,\nBrooklyn Pizza`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #090d16; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 540px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 16px;">
          <h1 style="color: #f97316; margin: 0; font-size: 24px;">🍕 Brooklyn Pizza</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">
            ${isSk ? 'Pripomienka pečenia' : 'Sütési nap értesítő'}
          </p>
        </div>

        <div style="background-color: #131b2e; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 18px; line-height: 1.6; font-size: 15px;">
          <h3 style="color: #4ade80; margin-top: 0;">🎉 ${isSk ? 'Úspešné prihlásenie!' : 'Sikeres feliratkozás!'}</h3>
          <p style="color: #e2e8f0; margin-bottom: 12px;">
            ${isSk
              ? 'Ďakujeme, že ste sa pridali k našim pizzovým nadšencom. V dňoch, keď budeme piecť čerstvú remeselnú pizzu, vám pošleme rannú e-mailovú správu, aby ste si stihli včas objednať.'
              : 'Köszönjük, hogy csatlakoztál a pizzabarátokhoz! A sütési napokon időben küldünk egy rövid emlékeztető emailt, hogy biztosan ne maradj le a ropogós, kemencében sült pizzáinkról.'}
          </p>
          <div style="background: rgba(249, 115, 22, 0.1); border-left: 3px solid #f97316; padding: 10px 14px; border-radius: 6px; font-size: 13px; color: #fed7aa;">
            💡 ${isSk ? 'Objednávku zadáte jednoducho online cez mobil či počítač.' : 'A rendelésedet egyszerűen és gyorsan leadhatod a weboldalunkon!'}
          </div>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: plainText,
      htmlBody: htmlBody
    });
  } catch (err) {
    Logger.log("Subscriber confirmation error: " + err.toString());
  }
}

/**
 * Sütési nap emlékeztető küldése egy feliratkozónak
 */
function sendBakingDayReminderEmail(email, lang, customMessage) {
  try {
    const isSk = lang === 'sk';
    const subject = isSk
      ? "🍕 Dnes pečieme čerstvú pizzu v Brooklyn Pizza! Nezabudnite si objednať!"
      : "🍕 Ma pizzát sütünk a Brooklyn Pizzában! Ne felejts el rendelni!";

    const plainText = isSk
      ? `Ahoj Pizzalover!\n\nDnes rozkurujeme pec a pečieme čerstvú remeselnú pizzu v Brooklyn Pizza!\n${customMessage ? '\nOdkaz od nás: ' + customMessage + '\n' : ''}\nVyberte si svoju obľúbenú pizzu a pošlite objednávku online.\nHneď ako vložíme vašu pizzu do pece, pošleme vám SMS a o cca 10 minút si ju môžete vyzdvihnúť čerstvú a chrumkavú!\n\nTešíme sa na vašu objednávku!\nBrooklyn Pizza`
      : `Kedves Pizzabarát!\n\nMa begyújtjuk a kemencét és friss, ropogós kézműves pizzákat sütünk a Brooklyn Pizzában!\n${customMessage ? '\nÜzenetünk mára: ' + customMessage + '\n' : ''}\nVálaszd ki a kedvencedet és add le rendelésed online.\nAmint a sütőbe tesszük a pizzádat, SMS-ben jelezzük, és kb. 10 perc múlva már veheted is át forrón!\n\nSzeretettel várunk,\nBrooklyn Pizza`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #090d16; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 540px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 16px;">
          <h1 style="color: #f97316; margin: 0; font-size: 26px; letter-spacing: -0.5px;">🍕 Brooklyn Pizza</h1>
          <p style="color: #38bdf8; font-size: 14px; margin: 6px 0 0; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">
            🔥 ${isSk ? 'DNES PEČIEME PIZZU!' : 'MA PIZZÁT SÜTÜNK!'}
          </p>
        </div>

        <div style="background-color: #131b2e; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 20px; line-height: 1.6;">
          <h2 style="color: #fff; font-size: 18px; margin-top: 0;">
            ${isSk ? 'Máte dnes chuť na chrumkavú remeselnú pizzu?' : 'Megéheztél egy igazi forró kézműves pizzára?'}
          </h2>
          <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 16px;">
            ${isSk
              ? 'Pec je rozpálená a pripravujeme tie najchutnejšie pizze s prémiovými surovinami. Pošlite svoju objednávku online, a hneď ako ju dáme piecť, pošleme vám SMS notifikáciu!'
              : 'A kemence felfűtve, a tészta megkelt, és ma újra a legfinomabb prémium feltétekkel sütünk! Add le a rendelésed gyorsan a weboldalon, és SMS-ben szólunk, amint a sütőbe került a pizzád!'}
          </p>

          ${customMessage ? `
            <div style="background: rgba(59, 130, 246, 0.15); border-left: 3px solid #38bdf8; padding: 12px 14px; border-radius: 6px; font-size: 14px; color: #bae6fd; margin-bottom: 16px;">
              📢 <strong>${isSk ? 'Odkaz:' : 'Külön üzenet:'}</strong> ${customMessage}
            </div>
          ` : ''}

          <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); padding: 12px; border-radius: 8px; text-align: center;">
            <span style="color: #4ade80; font-weight: bold; font-size: 14px;">⚡ 10-15 perc sütési idő • SMS értesítés</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 10px; padding-bottom: 10px;">
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
            ${isSk ? 'Tento e-mail ste dostali, pretože ste sa prihlásili na odber noviniek Brooklyn Pizza.' : 'Ezt az emailt azért kaptad, mert feliratkoztál a Brooklyn Pizza sütési emlékeztetőjére.'}
          </p>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: plainText,
      htmlBody: htmlBody
    });
  } catch (err) {
    Logger.log("Baking reminder email error (" + email + "): " + err.toString());
  }
}