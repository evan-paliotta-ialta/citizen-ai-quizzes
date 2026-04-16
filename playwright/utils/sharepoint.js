/**
 * SharePoint helper utilities.
 *
 * Provides:
 *  - createSharePointPage()  : creates or updates a modern SharePoint Site Page via REST API
 *  - pageExists()            : checks if a page with a given title already has content
 */

const config = require('../config');

const SITE_URL = `https://${config.tenant}.sharepoint.com/sites/${config.siteSlug}`;

/**
 * Creates or updates a SharePoint Site Page with HTML content.
 *
 * - If the page does not exist: create shell → checkout → saveDraft → publish
 * - If the page exists but has no content (empty shell from failed run): checkout → saveDraft → publish
 * - If the page exists and already has content: skip (returns null)
 *
 * @param {import('playwright').Page} playwrightPage
 * @param {string} title
 * @param {string} htmlContent
 */
async function createSharePointPage(playwrightPage, title, htmlContent) {
  await playwrightPage.goto(SITE_URL);

  const result = await playwrightPage.evaluate(
    async ({ siteUrl, pageTitle, content }) => {
      // ── 1. Get request digest ──────────────────────────────────────────────
      const digestRes = await fetch(`${siteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: { Accept: 'application/json;odata=verbose' },
      });
      const digestData = await digestRes.json();
      const digest = digestData.d.GetContextWebInformation.FormDigestValue;

      // ── 2. Check if page already exists ───────────────────────────────────
      const escapedTitle = pageTitle.replace(/'/g, "''");
      const checkRes = await fetch(
        `${siteUrl}/_api/sitepages/pages?$filter=Title eq '${escapedTitle}'&$select=Id,Title,CanvasContent1`,
        { headers: { Accept: 'application/json;odata=verbose' } }
      );
      const checkData = await checkRes.json();

      let pageId = null;
      let existingCanvas = null;

      if (checkData.d && checkData.d.results.length > 0) {
        const existing = checkData.d.results[0];
        pageId = existing.Id;
        existingCanvas = existing.CanvasContent1 || '';
      }

      // Skip only if content exists AND is already in the correct format (has position field)
      if (existingCanvas && existingCanvas.trim().length > 10) {
        try {
          const canvas = JSON.parse(existingCanvas);
          if (canvas.length > 0 && canvas[0].position) {
            return { id: pageId, title: pageTitle, status: 'skipped' };
          }
          // No position field — fall through to rewrite with correct format
        } catch(e) {
          return { id: pageId, title: pageTitle, status: 'skipped' };
        }
      }

      // ── 3. Create page shell if needed ─────────────────────────────────────
      if (!pageId) {
        const createRes = await fetch(`${siteUrl}/_api/sitepages/pages`, {
          method: 'POST',
          headers: {
            Accept: 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': digest,
          },
          body: JSON.stringify({
            __metadata: { type: 'SP.Publishing.SitePage' },
            Title: pageTitle,
            PromotedState: 0,
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          throw new Error(`Page creation failed (${createRes.status}): ${errText}`);
        }
        const pageData = await createRes.json();
        pageId = pageData.d.Id;
      }

      // ── 4. Checkout the page ───────────────────────────────────────────────
      await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/checkout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
      });

      // ── 5. Build canvas content (single full-width text web part) ──────────
      const instanceId = `text-${Math.random().toString(36).substr(2, 9)}`;
      const canvasContent = JSON.stringify([
        {
          position: {
            layoutIndex: 1,
            zoneIndex: 1,
            sectionIndex: 1,
            sectionFactor: 12,
            controlIndex: 1,
            isLayoutReflowing: false,
          },
          controlType: 4,
          id: instanceId,
          innerHTML: content,
          editorType: 'CKEditor',
          textEditorVersion: 3,
          addedFromPersistedData: false,
          reservedHeight: 100,
          reservedWidth: 0,
        },
      ]);

      // ── 6. Set canvas content via MERGE ───────────────────────────────────
      const saveRes = await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'X-HTTP-Method': 'MERGE',
          'IF-MATCH': '*',
        },
        body: JSON.stringify({
          __metadata: { type: 'SP.Publishing.SitePage' },
          CanvasContent1: canvasContent,
        }),
      });

      if (!saveRes.ok) {
        const errText = await saveRes.text();
        throw new Error(`Page save failed (${saveRes.status}): ${errText}`);
      }

      // ── 7. Publish ─────────────────────────────────────────────────────────
      await fetch(`${siteUrl}/_api/sitepages/pages(${pageId})/publish`, {
        method: 'POST',
        headers: {
          Accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
      });

      return { id: pageId, title: pageTitle, status: 'published' };
    },
    { siteUrl: SITE_URL, pageTitle: title, content: htmlContent }
  );

  return result;
}

/**
 * Checks if a page with the given title exists AND has content.
 * Returns false for pages that are empty shells (from failed runs).
 */
async function pageExists(playwrightPage, title) {
  await playwrightPage.goto(SITE_URL);

  const exists = await playwrightPage.evaluate(
    async ({ siteUrl, pageTitle }) => {
      const escapedTitle = pageTitle.replace(/'/g, "''");
      const res = await fetch(
        `${siteUrl}/_api/sitepages/pages?$filter=Title eq '${escapedTitle}'&$select=Id,Title,CanvasContent1`,
        { headers: { Accept: 'application/json;odata=verbose' } }
      );
      const data = await res.json();
      if (!data.d || data.d.results.length === 0) return false;
      const p = data.d.results[0];
      if (!p.CanvasContent1 || p.CanvasContent1.trim().length <= 10) return false;
      // Only consider it "exists" if it has the correct format (position field present)
      try {
        const canvas = JSON.parse(p.CanvasContent1);
        return canvas.length > 0 && !!canvas[0].position;
      } catch(e) {
        return false;
      }
    },
    { siteUrl: SITE_URL, pageTitle: title }
  );

  return exists;
}

module.exports = { createSharePointPage, pageExists, SITE_URL };
