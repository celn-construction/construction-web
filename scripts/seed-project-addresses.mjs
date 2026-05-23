// One-off dev script: assigns a fake but real-looking US address + matching
// lat/lng to every project in the local DB that doesn't already have
// coordinates. Safe to re-run — projects with non-null lat/lng are skipped.
//
// Usage:
//   node scripts/seed-project-addresses.mjs
//
// Optional env vars:
//   SEED_ORG_SLUG  — only seed projects in this org (default: every org)

import { PrismaClient } from "../generated/prisma/index.js";

const ORG_SLUG = process.env.SEED_ORG_SLUG;

// Real US addresses with their actual geocoded coordinates (Google-verified).
// Chosen for visual spread across the continental US.
const SAMPLE_ADDRESSES = [
  { address: "1 World Trade Center, New York, NY 10007", latitude: 40.7127,  longitude: -74.0134  },
  { address: "1111 S Figueroa St, Los Angeles, CA 90015",  latitude: 34.0430,  longitude: -118.2673 },
  { address: "233 S Wacker Dr, Chicago, IL 60606",         latitude: 41.8788,  longitude: -87.6359  },
  { address: "1500 Biscayne Blvd, Miami, FL 33132",        latitude: 25.7886,  longitude: -80.1903  },
  { address: "400 Broad St, Seattle, WA 98109",            latitude: 47.6205,  longitude: -122.3493 },
  { address: "1701 Wynkoop St, Denver, CO 80202",          latitude: 39.7530,  longitude: -105.0011 },
  { address: "1100 Congress Ave, Austin, TX 78701",        latitude: 30.2747,  longitude: -97.7404  },
  { address: "1 Market St, San Francisco, CA 94105",       latitude: 37.7937,  longitude: -122.3947 },
  { address: "100 Federal St, Boston, MA 02110",           latitude: 42.3568,  longitude: -71.0571  },
  { address: "191 Peachtree St NE, Atlanta, GA 30303",     latitude: 33.7569,  longitude: -84.3870  },
];

const db = new PrismaClient();

async function main() {
  const where = {
    AND: [
      { OR: [{ latitude: null }, { longitude: null }] },
      ...(ORG_SLUG ? [{ organization: { slug: ORG_SLUG } }] : []),
    ],
  };

  const projects = await db.project.findMany({
    where,
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, location: true, organizationId: true },
  });

  if (projects.length === 0) {
    console.log("No projects need seeding (all have coords already).");
    return;
  }

  console.log(`Seeding ${projects.length} project(s)…`);

  const updates = [];
  for (let i = 0; i < projects.length; i += 1) {
    const project = projects[i];
    const sample = SAMPLE_ADDRESSES[i % SAMPLE_ADDRESSES.length];
    await db.project.update({
      where: { id: project.id },
      data: {
        location: sample.address,
        latitude: sample.latitude,
        longitude: sample.longitude,
      },
    });
    updates.push({
      project: project.name,
      slug: project.slug,
      address: sample.address,
      lat: sample.latitude,
      lng: sample.longitude,
    });
  }

  console.log(JSON.stringify({ ok: true, updated: updates.length, details: updates }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
