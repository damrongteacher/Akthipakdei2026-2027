# ATHIPATEY Classroom Hub

Static Khmer classroom directory for GitHub Pages. HTML, CSS, JavaScript and JSON; no database or build dependencies.

## JSON-only data

All class records, URLs, custom button names, formatted teacher information, tags, descriptions, tag order and Hero/Stats/Search settings are included in data.json. The app always loads the hosted JSON on startup. It never reads or writes browser drafts, cookies, sessionStorage or IndexedDB. An old localStorage draft is deleted on startup. Runtime edits exist temporarily in memory only.

Changes remain temporarily in memory. Editing or importing JSON enables the header Save Json Update Your change button. Click it to download the complete data.json file; edits do not automatically download files. Verify that the download completed. If automatic downloads are blocked, use Save JSON (Export). Files may receive numbered names in Downloads; rename the latest one to data.json before publishing. Import opens an existing JSON file for editing without changing the hosted file. Reload published data discards the current in-memory view.

After a JSON file is imported successfully, its filename remains visible in the Admin data panel to confirm which file is loaded. GitHub upload publishes the current in-memory data, including an imported file and any later edits.

The Admin data panel can also upload the current data.json directly to the configured GitHub repository's main branch. Create a fine-grained personal access token limited to that repository with Contents: Read and write permission, then enter it in the upload field. The token is sent directly from your browser to GitHub over HTTPS, used only for the upload, and cleared from the field afterward; it is not saved in browser storage or included in the site code. Never use a broad-scope token or publish a token in source code. Revoke the token when it is no longer needed. Anyone who can access the page and obtain a valid token can use it, so this client-side upload is not a substitute for server-side authentication. GitHub branch protection rules may prevent direct uploads. Reloading without publishing or importing your latest data shows the hosted version again.

The service worker caches app assets only; JSON requests bypass its cache and use network with cache disabled. Old app caches are removed on upgrade. Loading classroom data requires connectivity.

If a GitHub upload fails, its status message shows the error and the token remains in the field for a retry. The token is cleared after a successful upload.

## Hosting and preview

Upload this folder's contents to a GitHub repository. Enable Settings → Pages → Deploy from a branch → main → root. Relative paths support project Pages URLs. Replace the sample class links with your links.

For local preview run `python -m http.server 8080` from this folder and visit http://localhost:8080. Do not open index.html as a file.

## Features

Classes group by tags in saved order, sorted A–Z within each group. Untagged classes appear at the end. Multi-tag classes appear in each group. Sidebar filters, teacher rich text, custom button labels, and HTTP/HTTPS class links are supported. The Tags workspace supports creation, rename, descriptions, deletion, and reordering. Card tags appear only for admin.

Opening a class link displays it in an in-app, tab-style viewer when the destination permits embedding. Some sites block embedded views or require a sign-in flow that does not work inside an iframe; use the viewer's “Open in Browser” button for those links. Browsers do not expose a reliable way for the app to detect every site that blocks embedding.

Admin controls Hero, Stats and Search visibility for viewers. Siemreap loads from Google Fonts with a system fallback. Desktop navigation collapses; mobile navigation is a modal drawer with keyboard support. Chrome installation is available through the install button or browser menu on HTTPS; a downloadable URL shortcut is also available.

## Admin

Username: admin. Password: admin. Switching to Viewer preserves the admin login; return to Admin without signing in again. The Logout button stays available in both modes. Clicking Logout ends the login. Reloading also clears the in-memory session because login state is not stored in the browser. This is a browser UI lock, not server authentication. Source credentials and published JSON are public; GitHub repository permissions control publication.

Admin navigation includes Card, Tags and Setting. Setting contains Hero, Stats and Search switches. Both viewers and admins have Show all and tag filters. Leaving with edits that have not been exported triggers a browser warning.

In Admin mode, Hero and Stats appear only in the Setting workspace. Viewer visibility continues to follow the saved showHero/showStats settings.
