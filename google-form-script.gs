/**
 * Blackmore Entertainment: Wedding Form connector
 *
 * Lives INSIDE your Google Form (form editor → ⋮ → Script editor).
 * The branded intake page sends answers here, and this script saves
 * them as a normal response in your Google Form. No Google Sheet needed.
 * See SETUP.md for install steps.
 */

// Optional: also email a summary of each submission to you.
// Google Forms' own "email notifications for new responses" may not fire for
// responses created by a script, so this is on by default. Set to "" to turn off.
const NOTIFY_EMAIL = "blackmoreentertainment@gmail.com";

// Which Google Form question each answer from the page goes into.
// Left: the field name the page sends. Right: the Google Form question ID.
const FIELD_TO_ITEM = {
  "My Name":                    1752662345,
  "Partner Name":               1875528109,
  "Wedding Date":               1457192797,
  "Wedding Time":               1024210906,
  "Phone":                      1675454254,
  "Our Address":                582678356,
  "Contact - Anything Else":    48686671,
  "Ceremony Venue Address":     732887475,
  "Reception Venue Address":    2060554188,
  "Music Needed":               1563599018,
  "Outdoor Event":              1357177616,
  "Wedding Planner":            295434332,
  "Scene - Anything Else":      1901813387,
  "Guest Count":                1681776518,
  "Ceremony Guest Arrival":     1505300248,
  "Ceremony Start":             1811790372,
  "Ceremony End":               1849953766,
  "Seating Music Requests":     1033958379,
  "Wedding Party Size":         660719128,
  "Wedding Party Processional": 1046211868,
  "Couple Processional":        199453208,
  "Recessional":                1739277089,
  "Ceremony - Anything Else":   994594228,
  "Cocktail Hour Arrival":      2146246568,
  "Bridal Party Entrance Time": 90257573,
  "Entrance Order":             992984962,
  "Announce Us As":             1539738784,
  "Our Entrance Song":          1063722857,
  "Dinner Time":                1580389759,
  "Cake Cutting":               1476997927,
  "Cake Cutting Time":          2008029775,
  "Cake Cutting Song":          1463281405,
  "Cake Announcement":          1771899901,
  "Vendor Food":                325339381,
  "Dinner - Anything Else":     909207788,
  "Traditional Dances":         2138248117,
  "First Dance":                1114659236,
  "Father Daughter Dance":      745978089,
  "Mother Son Dance":           1719250074,
  "Custom Dances":              589436338,
  "Bouquet Garter Toss":        41057671,
  "Other Dance Events":         2126243064,
  "Gotta Have It Songs":        1490493890,
  "Do Not Play Songs":          1083630806,
  "Package":                    195912306,   // "Choose Your Experience"
  "The Perfect DJ Would":       1201480962,
};

// The couple's email goes into a short-answer question titled "Email"
// if your form has one. If it doesn't, it goes at the top of this answer
// ("Keeping In Touch → Anything else?") so you always have it.
const EMAIL_QUESTION_TITLE = "Email";
const EMAIL_NOTE_ITEM = 48686671;

// Anything without a matching question (booth color, "help me decide",
// or an answer that no longer matches a choice) is noted at the top of
// "The perfect DJ would..." so nothing is lost.
const EXTRAS_NOTE_ITEM = 1201480962;

function doPost(e) {
  try {
    const data = (e && e.parameter) || {};
    const form = FormApp.getActiveForm();
    const response = form.createResponse();
    const answers = {};   // itemId -> value to save
    const extras = [];

    Object.keys(data).forEach(field => {
      const value = String(data[field] || "").trim();
      if (!value || field === "Email") return;
      const itemId = FIELD_TO_ITEM[field];
      if (!itemId) { extras.push(field + ": " + value); return; }
      answers[itemId] = value;
    });

    // The couple's email: its own "Email" question if there is one,
    // otherwise a note at the top of "Anything else?"
    const email = String(data["Email"] || "").trim();
    if (email) {
      const emailItem = form.getItems(FormApp.ItemType.TEXT)
        .find(i => i.getTitle().trim().toLowerCase() === EMAIL_QUESTION_TITLE.toLowerCase());
      if (emailItem) answers[emailItem.getId()] = email;
      else answers[EMAIL_NOTE_ITEM] = "Email: " + email + (answers[EMAIL_NOTE_ITEM] ? "\n\n" + answers[EMAIL_NOTE_ITEM] : "");
    }

    // Build each item response; bad choices get moved into extras
    const built = [];
    Object.keys(answers).forEach(id => {
      if (Number(id) === EXTRAS_NOTE_ITEM) return; // handled last
      const item = form.getItemById(Number(id));
      if (!item) { extras.push("Unknown question " + id + ": " + answers[id]); return; }
      const r = makeItemResponse(item, answers[id]);
      if (r) built.push(r);
      else extras.push(item.getTitle().replace(/\.\.\.$/, "") + ": " + answers[id]);
    });

    // "The perfect DJ would..." plus any extras
    const notesItem = form.getItemById(EXTRAS_NOTE_ITEM);
    let notes = answers[EXTRAS_NOTE_ITEM] || "";
    if (extras.length) notes = "[" + extras.join(" | ") + "]" + (notes ? "\n\n" + notes : "");
    if (notesItem && notes) built.push(makeItemResponse(notesItem, notes));

    built.forEach(r => response.withItemResponse(r));
    const saved = response.submit();

    if (NOTIFY_EMAIL) sendSummary(form, saved, data);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function makeItemResponse(item, value) {
  switch (item.getType()) {
    case FormApp.ItemType.TEXT:
      return item.asTextItem().createResponse(value);
    case FormApp.ItemType.PARAGRAPH_TEXT:
      return item.asParagraphTextItem().createResponse(value);
    case FormApp.ItemType.MULTIPLE_CHOICE: {
      const choice = matchChoice(item.asMultipleChoiceItem().getChoices(), value);
      return choice ? item.asMultipleChoiceItem().createResponse(choice) : null;
    }
    case FormApp.ItemType.CHECKBOX: {
      const choice = matchChoice(item.asCheckboxItem().getChoices(), value);
      return choice ? item.asCheckboxItem().createResponse([choice]) : null;
    }
    case FormApp.ItemType.DATE: {
      const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return m ? item.asDateItem().createResponse(new Date(+m[1], +m[2] - 1, +m[3], 12)) : null;
    }
    case FormApp.ItemType.TIME: {
      const m = value.match(/^(\d{1,2}):(\d{2})/);
      return m ? item.asTimeItem().createResponse(+m[1], +m[2]) : null;
    }
    default:
      return null;
  }
}

// Exact match first; otherwise a choice that starts with the value
// (so "Pro" matches "Pro: Everything in Select...", even if you reword it).
function matchChoice(choices, value) {
  const v = value.toLowerCase();
  const values = choices.map(c => c.getValue());
  const exact = values.find(c => c.toLowerCase() === v);
  if (exact) return exact;
  return values.find(c => c.toLowerCase().startsWith(v + ":") || c.toLowerCase().startsWith(v + " ")) || null;
}

function sendSummary(form, saved, data) {
  const couple = [data["My Name"], data["Partner Name"]].filter(Boolean).join(" & ") || data["Email"] || "New couple";
  const lines = saved.getItemResponses().map(r => {
    const a = r.getResponse();
    return r.getItem().getTitle() + "\n  " + (Array.isArray(a) ? a.join(", ") : a);
  });
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "Wedding form: " + couple + (data["Wedding Date"] ? " (" + data["Wedding Date"] + ")" : ""),
    body: lines.join("\n\n") + "\n\nAll responses: " + form.getEditUrl().replace(/edit$/, "edit#responses"),
    replyTo: data["Email"] || NOTIFY_EMAIL,
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Open the web app URL in a browser to confirm it's live.
function doGet() {
  return ContentService.createTextOutput("Blackmore wedding form connector is running for: " + FormApp.getActiveForm().getTitle());
}
