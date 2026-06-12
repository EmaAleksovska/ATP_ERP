import pool from '../config/database.js';

async function clearTravelData() {
  try {
    console.log('Starting to clear travel data...');

    // First, delete all travel orders (they reference travel requests)
    console.log('Deleting travel orders...');
    const ordersResult = await pool.query('DELETE FROM travel_orders');
    console.log(`Deleted ${ordersResult.rowCount} travel order(s)`);

    // Then, delete all travel requests
    console.log('Deleting travel requests...');
    const requestsResult = await pool.query('DELETE FROM travel_requests');
    console.log(`Deleted ${requestsResult.rowCount} travel request(s)`);

    // Also clear order number tracking (optional - resets order numbering)
    console.log('Clearing order number tracking...');
    const trackingResult = await pool.query('DELETE FROM order_number_tracking');
    console.log(`Cleared ${trackingResult.rowCount} order number tracking record(s)`);

    console.log('\n✓ Successfully cleared all travel data!');
    console.log('  - All travel orders deleted');
    console.log('  - All travel requests deleted');
    console.log('  - Order number tracking cleared');
    console.log('\nNote: City dropdown will be empty until new travel orders are approved.');

    process.exit(0);
  } catch (error) {
    console.error('Error clearing travel data:', error);
    process.exit(1);
  }
}

clearTravelData();

