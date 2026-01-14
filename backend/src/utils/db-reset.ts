import { AppDataSource } from '../db/data-source';
import { Hospital } from '../entities/Hospital';
import { Ambulance } from '../entities/Ambulance';
import { Incident } from '../entities/Incident';

/**
 * Reset database by clearing all data from tables
 * This will delete all incidents, hospitals and ambulances
 */
export async function resetDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const hospitalRepo = AppDataSource.getRepository(Hospital);
    const ambulanceRepo = AppDataSource.getRepository(Ambulance);
    const incidentRepo = AppDataSource.getRepository(Incident);

    // Delete all records in FK-safe order using DELETE 
    await incidentRepo
      .createQueryBuilder()
      .delete()
      .from(Incident)
      .execute();

    await ambulanceRepo
      .createQueryBuilder()
      .delete()
      .from(Ambulance)
      .execute();

    await hospitalRepo
      .createQueryBuilder()
      .delete()
      .from(Hospital)
      .execute();

    console.log('✓ Database cleared successfully');
    console.log('  - All incidents deleted');
    console.log('  - All ambulances deleted');
    console.log('  - All hospitals deleted');
    console.log('\n  Restart the backend to reseed with fresh data.');
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
}

// Allow running this script directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('\n✓ Reset complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Reset failed:', error);
      process.exit(1);
    });
}

