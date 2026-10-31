const siteUrl = process.env.WATTWISE_SITE_URL ?? "http://localhost:3000";

const response = await fetch(new URL("/api/communities/demo", siteUrl), {
  method: "POST",
});
const body = await response.json();

if (!response.ok) {
  console.error(body?.error?.message ?? `Demo community seeding failed (${response.status})`);
  process.exitCode = 1;
} else {
  console.log(`${body.data.label}: ${body.data.communitiesCreated} communities, ${body.data.readingsCreated} daily readings created.`);
}
