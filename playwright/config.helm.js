/**
 * Helm-tenant variant of config.js — used for the Citizen AI Helm migration.
 * Do not overwrite config.js (that stays pointed at iAltA for any remaining iAltA-side work).
 */

module.exports = {
  tenant: 'helmmarkets',
  siteName: 'Citizen AI Developer Program',
  siteSlug: 'citizenai',
  siteDescription: 'Internal training program for using Claude and AI tools effectively.',
  teamsChannelName: 'Citizen AI Developer Program',
  authStatePath: './auth/auth.helm.json',
  contentDir: '../course-content',
};
