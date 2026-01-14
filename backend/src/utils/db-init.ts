import { AppDataSource } from '../db/data-source';
import { Hospital } from '../entities/Hospital';
import { Ambulance, AmbulanceStatus } from '../entities/Ambulance';
import { Incident, IncidentPriority, IncidentStatus } from '../entities/Incident';
import { env } from '../config/env';

/**
 * Initialize database with PostGIS extension and seed data
 * Note: PostGIS extension must be installed in PostgreSQL first
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Enable PostGIS extension (will fail if PostGIS is not installed)
    await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('✓ PostGIS extension enabled');

    // Create tables if they don't exist (ONLY when TypeORM synchronize is enabled).
    // In production, this should be handled by migrations.
    if (env.NODE_ENV !== 'production') {
      await AppDataSource.synchronize();
      console.log('✓ Database tables synchronized');
    } else {
      console.log('ℹ Skipping schema synchronize in production (use migrations)');
    }

    // Check if data already exists
    const hospitalRepo = AppDataSource.getRepository(Hospital);
    const ambulanceRepo = AppDataSource.getRepository(Ambulance);
    const incidentRepo = AppDataSource.getRepository(Incident);

    const existingHospitals = await hospitalRepo.count();
    const existingAmbulances = await ambulanceRepo.count();
    const existingIncidents = await incidentRepo.count();

    // If ambulances exist but all are available, update them to have realistic statuses
    if (existingAmbulances > 0) {
      const allAmbulances = await ambulanceRepo.find();
      const allAvailable = allAmbulances.every(a => a.status === AmbulanceStatus.AVAILABLE);
      
      if (allAvailable && allAmbulances.length > 0) {
        // Update ambulances to have a realistic mix (50% available, 50% busy)
        const updatePromises = allAmbulances.map((ambulance, index) => {
          const newStatus = index % 2 === 0 ? AmbulanceStatus.AVAILABLE : AmbulanceStatus.BUSY;
          return ambulanceRepo.update(ambulance.id, { status: newStatus });
        });
        await Promise.all(updatePromises);
        console.log(`✓ Updated ${allAmbulances.length} ambulances with realistic statuses`);
      }
    }

    // Production-safe: do not auto-seed unless explicitly enabled.
    if (!env.SEED_DATABASE) {
      console.log('ℹ SEED_DATABASE is disabled; skipping seed step');
      return;
    }

    // Only skip seeding if all main tables have data
    // If one is empty, we'll seed it
    if (existingHospitals > 0 && existingAmbulances > 0 && existingIncidents > 0) {
      console.log('✓ Database already seeded');
      return;
    }

    // If tables exist but are empty, proceed with seeding
    if (existingHospitals === 0 || existingAmbulances === 0 || existingIncidents === 0) {
      console.log('⚠ Some tables are empty, seeding data...');
    }

    // Seed hospitals (Lagos)
    // Note: coordinates are lon/lat (WGS84 / EPSG:4326)
    const hospitals = [
      { name: 'Lagos University Teaching Hospital', lon: 3.3516, lat: 6.4944 }, // Idi-Araba
      { name: 'LASUTH Ikeja', lon: 3.3422, lat: 6.5895 },
      { name: 'Reddington Hospital Ikeja', lon: 3.3578709, lat: 6.586960347 }, // Cardiac Centre (Mobolaji Bank Anthony Way)
      { name: 'Eko Hospital Ikeja', lon: 3.341, lat: 6.585 }, // approx (12/14 Olu Adeshina Street, Ikeja)
      { name: 'St. Nicholas Clinic Ikeja', lon: 3.37, lat: 6.56 }, // approx (Maryland/Anthony Village area)
      { name: 'Duchess International Hospital', lon: 3.352313, lat: 6.585562 }, // provided coords
      { name: 'Ikeja Medical Centre', lon: 3.352, lat: 6.597 }, // approx
      { name: "George's Memorial Medical Centre", lon: 3.46, lat: 6.45 }, // approx (Lekki Phase 1)
      { name: 'Gbagada General Hospital', lon: 3.3868, lat: 6.5523 },
      { name: 'Ikeja Central Hospital', lon: 3.35, lat: 6.6 }, // approx
    ];

    for (const hospital of hospitals) {
      await hospitalRepo
        .createQueryBuilder()
        .insert()
        .into(Hospital)
        .values({
          name: hospital.name,
          location: () =>
            `ST_SetSRID(ST_MakePoint(${hospital.lon}, ${hospital.lat}), 4326)`,
        })
        .execute();
    }
    console.log('✓ Seeded 10 hospitals');

    // Seed ambulances (8 around Ikeja with realistic status distribution)
    // ~50% available, 50% busy
    const ambulances = [
      { status: AmbulanceStatus.AVAILABLE, lon: 3.3475, lat: 6.6030 },
      { status: AmbulanceStatus.BUSY, lon: 3.3552, lat: 6.5987 },
      { status: AmbulanceStatus.AVAILABLE, lon: 3.3418, lat: 6.6075 },
      { status: AmbulanceStatus.BUSY, lon: 3.3612, lat: 6.5938 },
      { status: AmbulanceStatus.AVAILABLE, lon: 3.3526, lat: 6.6059 },
      { status: AmbulanceStatus.BUSY, lon: 3.3391, lat: 6.5998 },
      { status: AmbulanceStatus.AVAILABLE, lon: 3.3589, lat: 6.5884 },
      { status: AmbulanceStatus.BUSY, lon: 3.3655, lat: 6.5799 },
    ];

    for (const ambulance of ambulances) {
      await ambulanceRepo
        .createQueryBuilder()
        .insert()
        .into(Ambulance)
        .values({
          status: ambulance.status,
          location: () =>
            `ST_SetSRID(ST_MakePoint(${ambulance.lon}, ${ambulance.lat}), 4326)`,
        })
        .execute();
    }
    console.log('✓ Seeded 8 ambulances');

    // Seed a few sample incidents around Ikeja only if there are none
    if (existingIncidents === 0) {
      const incidents = [
        {
          address: 'Computer Village, Ikeja, Lagos',
          lon: 3.3453,
          lat: 6.5966,
          priority: IncidentPriority.HIGH,
          status: IncidentStatus.PENDING,
          notes: 'Multiple vehicle collision reported near Computer Village.',
        },
        {
          address: 'Allen Avenue, Ikeja, Lagos',
          lon: 3.3495,
          lat: 6.6038,
          priority: IncidentPriority.MEDIUM,
          status: IncidentStatus.PENDING,
          notes: 'Pedestrian hit-and-run reported along Allen Avenue.',
        },
        {
          address: 'Ikeja City Mall, Alausa, Lagos',
          lon: 3.3615,
          lat: 6.6175,
          priority: IncidentPriority.CRITICAL,
          status: IncidentStatus.PENDING,
          notes: 'Crowd incident reported inside Ikeja City Mall.',
        },
      ];

      for (const incident of incidents) {
        await incidentRepo
          .createQueryBuilder()
          .insert()
          .into(Incident)
          .values({
            address: incident.address,
            priority: incident.priority,
            status: incident.status,
            notes: incident.notes,
            location: () =>
              `ST_SetSRID(ST_MakePoint(${incident.lon}, ${incident.lat}), 4326)`,
          })
          .execute();
      }
      console.log('✓ Seeded 3 sample incidents around Ikeja');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

