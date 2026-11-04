# Blackmore Entertainment Website

## What's here

| Page | File | Notes |
|---|---|---|
| Home | `index.html` | |
| Weddings | `weddings/index.html` | Package showcase (hover swaps the photo) |
| Events | `events/index.html` | Corporate events and private parties. Add non-wedding photos when you have them |
| Services | `services/index.html` | |
| Foam Parties | `foam-parties/index.html` | Needs a real photo + "bookings include" details |
| About | `about/index.html` | Needs photos of Brian & Matt |
| 404 page | `404.html` | Shown for any address that doesn't exist |
| Contact | `contact/index.html` | "Check your date" form, emailed to you (see Contact form setup below) |
| Wedding planning form | `plan/index.html` | Unlisted, hidden from Google. Send the link to booked couples |

Shared look: `css/site.css`. Shared behavior (menu, showcase on Home/Weddings/Events, contact form, package list): `js/site.js`.

**Editing pages:** the header and footer are shared. Edit the page content in `_build/pages/`, then run
`python3 _build/build.py` from this folder to rebuild the pages. (Or ask Claude to make the change.)
The `/plan` form is a standalone file and is edited directly.

**Hosting:** this whole folder is the website. It needs no build step on the host, so drag it to
Netlify Drop, or connect the GitHub repo to Vercel / Netlify / Cloudflare Pages with the output folder set to this one.

## Contact form ("Check your date"): setup

The Contact page emails each inquiry to you. It uses its own small script, **not** the Google Form.

1. Go to [script.google.com](https://script.google.com) → **New project**. Name it "Blackmore contact form".
2. Delete what's in the editor, paste in everything from `contact-email-script.gs`, and click 💾 save.
   To send inquiries somewhere else, change `INQUIRY_EMAIL` at the top.
3. **Deploy → New deployment** → ⚙️ → **Web app**. Execute as: **Me**. Who has access: **Anyone**. Click **Deploy**.
4. Authorize it (Advanced → Go to project → Allow). It only asks to send email as you.
5. Copy the **Web app URL** and paste it into `js/site.js` on the `const CONTACT_URL = "...";` line (already done).
   Or send the URL to Claude.


---

# Wedding Planning Form (/plan): Setup

The branded page sends each couple's answers to a small script that lives
**inside your Google Form** ("Blackmore Ent. Wedding Form"). The script saves them as a
normal response, so they show up under **Responses** like always. No Google Sheet is involved.

## 1. Add the script to your Google Form (about 5 minutes, one time)

1. Open your Google Form in **edit** mode.
2. Click the **⋮** (three dots, top right) → **Apps Script**.
3. Delete what's in the editor, then paste in everything from `google-form-script.gs`. Click the 💾 save icon.
4. Click **Deploy → New deployment**.
   - Click the ⚙️ gear next to "Select type" → **Web app**
   - **Execute as:** Me
   - **Who has access:** Anyone. This only lets the page *send* answers in. Nobody can see your responses.
   - Click **Deploy**
5. Click **Authorize access** and pick your Google account. Google will say the app isn't verified,
   because it's your own script. Click **Advanced → Go to (project name) → Allow**.
   It asks to manage this form and send email as you, for the notifications.
6. Copy the **Web app URL** (ends in `/exec`).

## 2. Connect the page

Open `index.html`, find this line near the bottom:

```js
const SUBMIT_URL = "";
```

and paste the URL between the quotes. Or send the URL to Claude and it will do it.

## 3. Test it

Fill out the page with your own email and submit. Within a few seconds you should see:
- a new response in your Google Form under **Responses**, and
- an email summary in your inbox.

Then delete the test response.

## 4. Put it online

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the `intake-form` folder onto the page.
2. Create a free account to keep it permanent. Rename it (e.g. `blackmore-weddings.netlify.app`)
   or connect your own domain (e.g. `plan.yourdomain.com`).

To update the page later, drag the folder onto your site's **Deploys** tab in Netlify.
You don't need to put `google-form-script.gs` online, but it does no harm.

## Good to know

- **Couple's email:** Google won't accept script responses while the form's built-in
  "Collect email addresses" setting is on, so set it to **Do not collect** (Settings → Responses).
  Then add a **Short answer** question titled exactly **Email** to the form, and the script fills it in
  automatically. Without that question, the email goes at the top of their "Keeping In Touch → Anything else?"
  answer. Either way, the summary email you get has Reply set to the couple's address.
- **Booth color and "Help me decide":** these have no question in the Google Form, so they're noted at the
  top of "The perfect DJ would..." answer, e.g. `[Booth Color: White]`.
- **Notifications:** the script emails you a summary of each submission (set `NOTIFY_EMAIL` at the top
  of the script, or `""` to turn it off). Google Forms' own notification setting may not fire for
  script-saved responses. The automatic "copy of your responses" email to the couple is not sent either.
- **Updating answers:** couples can come back anytime. Their answers are saved in their browser, so when
  they return on the same device everything is still filled in. Each submit is a new response, so the
  newest response from a couple is their current one.

## If you edit the Google Form

- **Rewording a question or a choice** is fine. Package choices are matched by their name (e.g. "Pro"),
  so you can freely rewrite the descriptions.
- **Deleting a question and re-adding it** gives it a new ID. Update `FIELD_TO_ITEM` in the script
  (or ask Claude to).
- **After changing the script**, use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**
  so the same URL keeps working.

## Troubleshooting

If the page says "Something went wrong" or nothing shows up in Responses:
- Open the Web app URL in your browser. It should say *"Blackmore wedding form connector is running..."*
- In the Apps Script editor, open **Executions** (left sidebar) to see the error.
- If the error mentions email: in the Google Form, go to **Settings → Responses → Collect email addresses**
  and set it to **Do not collect**. The couple's email is still saved, inside the "Anything else?" answer.

## Editing the look

- **Package names, descriptions and photos:** the `PACKAGES` list near the bottom of `index.html`.
- **Photos:** in `assets/`.
- **Colors:** the `:root` block at the top of `index.html` (`--gold` is the accent).
