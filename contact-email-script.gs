/**
 * Blackmore Entertainment: "Check your date" contact form → email
 *
 * A standalone Google Apps Script (NOT attached to any Google Form).
 * The website's Contact page sends each inquiry here, and this script
 * emails it to you. Nothing is saved anywhere else.
 * See SETUP.md for install steps.
 */

// Where inquiries are emailed.
const INQUIRY_EMAIL = "blackmoreentertainment@gmail.com";

function doPost(e) {
  try {
    const data = (e && e.parameter) || {};
    if (!String(data["Email"] || "").trim()) return json({ ok: false, error: "Missing email" });

    const body = Object.keys(data)
      .filter(k => String(data[k]).trim())
      .map(k => k + ": " + data[k])
      .join("\n");

    MailApp.sendEmail({
      to: INQUIRY_EMAIL,
      subject: "Website inquiry: " + (data["Name"] || "New inquiry") +
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

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Open the web app URL in a browser to confirm it's live.
function doGet() {
  return ContentService.createTextOutput("Blackmore contact form email script is running.");
}
