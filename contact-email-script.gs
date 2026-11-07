/**
 * Blackmore Entertainment: "Check your date" contact form → email
 *
 * A standalone Google Apps Script (NOT attached to any Google Form).
 * The website's Contact page sends each inquiry here, and this script
 * emails it to you. Nothing is saved anywhere else.
 * See SETUP.md for install steps.
 *
 * Spam protection:
 *  - DROPPED silently (never emailed): the hidden honeypot field was filled in,
 *    or the form was sent in under MIN_FILL_MS, or it didn't come from the
 *    website form at all (no timing field). Real people basically never trip these.
 *  - FLAGGED (still emailed, subject starts with "[Possible spam]"): event date
 *    in the past, or a name/message/venue that looks like random characters.
 *    You never lose a real inquiry, it just arrives labeled.
 */

// Where inquiries are emailed.
const INQUIRY_EMAIL = "blackmoreentertainment@gmail.com";

// Faster than this (milliseconds) from page load to submit = a bot.
const MIN_FILL_MS = 3000;

function doPost(e) {
  try {
    const data = (e && e.parameter) || {};
    if (!String(data["Email"] || "").trim()) return json({ ok: false, error: "Missing email" });

    // Bots get the same "ok" answer as people, so they can't tell they were filtered.
    if (isBot(data)) return json({ ok: true });

    const flags = spamFlags(data);
    const fields = Object.keys(data)
      .filter(k => k.charAt(0) !== "_" && String(data[k]).trim())
      .map(k => k + ": " + data[k]);
    const body = (flags.length ? ["Spam check: " + flags.join("; "), ""] : [])
      .concat(fields)
      .join("\n");

    MailApp.sendEmail({
      to: INQUIRY_EMAIL,
      subject: (flags.length ? "[Possible spam] " : "") +
        "Website inquiry: " + (data["Name"] || "New inquiry") +
        (data["Event Type"] ? " (" + data["Event Type"] + ")" : "") +
        (data["Event Date"] ? " " + data["Event Date"] : ""),
      body: body,
      replyTo: data["Email"],
    });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Hard checks: only things a real visitor on the website can't trigger.
function isBot(data) {
  if (String(data["_hp"] || "").trim()) return true;          // honeypot filled
  const ms = Number(data["_ms"]);
  if (!data["_ms"] || isNaN(ms)) return true;                  // didn't come from the website form
  return ms < MIN_FILL_MS;                                     // filled out impossibly fast
}

// Soft checks: suspicious, but could be a real person, so only label the email.
function spamFlags(data) {
  const flags = [];
  const date = String(data["Event Date"] || "").trim();
  if (date) {
    const yesterday = Utilities.formatDate(new Date(Date.now() - 86400000), "America/New_York", "yyyy-MM-dd");
    if (date < yesterday) flags.push("event date is in the past");
  }
  ["Name", "Message", "Venue"].forEach(k => {
    if (looksRandom(data[k])) flags.push(k.toLowerCase() + " looks like random characters");
  });
  return flags;
}

// A long word with no spaces that looks machine-generated, like "THjVBIsUROcJvRMGRSQ".
// Two signs: lots of jumbled capitals mid-word, or 7+ consonants in a row.
// Names like "MacKenzieLynn", "DeShawnWilliams" or "xXSceneQueenXx" pass.
function looksRandom(value) {
  const s = String(value || "").trim();
  if (s.length < 10 || /\s/.test(s) || !/^[A-Za-z]+$/.test(s)) return false;
  const camelBreaks = (s.match(/[a-z][A-Z]/g) || []).length;
  const capRuns = (s.slice(1).match(/[A-Z]{2,}/g) || []).length;
  const longestConsonants = Math.max(0, ...(s.match(/[^aeiouyAEIOUY]+/g) || []).map(r => r.length));
  return camelBreaks + capRuns >= 5 || longestConsonants >= 7;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Open the web app URL in a browser to confirm it's live.
function doGet() {
  return ContentService.createTextOutput("Blackmore contact form email script is running.");
}
