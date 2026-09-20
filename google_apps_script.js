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
  const orders = [];

  for (let i = 1; i < orderRows.length; i++) {
    const row = orderRows[i];
    if (row[1]) {
      const rawDate = new Date(row[0]);
      orders.push({
        rowIndex: i + 1,
        date: Utilities.formatDate(rawDate, "GMT+2", "yyyy-MM-dd"),
        time: Utilities.formatDate(rawDate, "GMT+2", "HH:mm"),
        name: row[1],
        phone: String(row[2]).replace(/[^0-9+]/g, ''),
        pizza: row[3],
        notes: row[4] || "",
        status: row[5] || "Új",
        totalAmount: row[6] ? Number(row[6]) : null,
        lang: row[7] || "hu"
      });
    }
  }

  // 2. Étlap beolvasása (kétnyelvű támogatással)
  let menuSheet = ss.getSheetByName(SHEET_MENU);
  const menu = [];
  if (menuSheet) {
    const menuRows = menuSheet.getDataRange().getValues();
    for (let j = 1; j < menuRows.length; j++) {
      const mRow = menuRows[j];
      if (mRow[0]) {
        menu.push({
          id: String(mRow[0]),
          name_hu: mRow[1],
          name_sk: mRow[2] || mRow[1],
          name: mRow[1],
          price: Number(mRow[3]),
          badge_hu: mRow[4] || "",
          badge_sk: mRow[4] || "",
          badge: mRow[4] || "",
          desc_hu: mRow[5] || "",
          desc_sk: mRow[6] || mRow[5] || "",
          description: mRow[5] || "",
          image: mRow[7] || "",
          available: mRow[8] !== false && String(mRow[8]).toLowerCase() !== "false"
        });
      }
    }
  }

  // 3. Nyitvatartási állapot lekérése (open / closed)
  const props = PropertiesService.getScriptProperties();
  const storeStatus = props.getProperty('STORE_STATUS') || 'open';

  return ContentService.createTextOutput(JSON.stringify({
    orders: orders.reverse(),
    menu: menu,
    storeStatus: storeStatus
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

    // --- Új Rendelés Rögzítése ---
    if (data.action === "newOrder") {
      let orderSheet = ss.getSheetByName(SHEET_ORDERS);
      if (!orderSheet) {
        orderSheet = ss.insertSheet(SHEET_ORDERS);
        orderSheet.appendRow(["Időbélyeg", "Név", "Telefonszám", "Pizzák", "Megjegyzés", "Státusz", "Végösszeg (€)", "Nyelv"]);
      }

      const timestamp = new Date();
      orderSheet.appendRow([
        timestamp,
        data.name,
        data.phone,
        data.pizza,
        data.notes || "",
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