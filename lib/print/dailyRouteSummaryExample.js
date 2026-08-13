/**
 * Example usage for Daily Route Summary thermal bill
 * 
 * This shows how to print a daily summary for water route with columns:
 * Cust | Del | Rec | Bal | Cash
 */

import { printDailyRouteSummary } from './milkHisabThermalBill';

/**
 * Example: Print daily route summary for Khalid's route
 */
export async function exampleDailyRouteSummary() {
  const business = {
    business_name: 'Tenvo Water Supply',
    name: 'Tenvo Water Supply',
    address: 'DHA Phase 6, Korangi Industrial Area plant + city orders',
    phone: '+92-300-1234567',
    category: 'milk-shop',
    country: 'Pakistan',
    currency: 'PKR',
  };

  const routeData = {
    business,
    date: '2026-08-12',
    routeName: 'Khalid · A/C: W-R7FHWJ | Town: BTK · Precinct 1 (Villa Precinct) · Bahria Town Route',
    customers: [
      {
        customerName: 'Ahmed',
        houseNo: '123',
        delivered: 1,      // 1 bottle delivered
        received: 1,       // 1 empty returned
        balance: 0,        // 0 bottles with customer (previous bal 0 + delivered 1 - received 1)
        cash: 150.00,      // Rs 150 collected
        amount: 150.00,
      },
      {
        customerName: 'Fatima',
        houseNo: '124',
        delivered: 2,
        received: 1,
        balance: 1,        // Had 0, delivered 2, returned 1, balance = 1
        cash: 0.00,        // No cash collected (credit)
        amount: 300.00,
      },
      {
        customerName: 'Hassan',
        houseNo: '125',
        delivered: 1,
        received: 0,
        balance: 2,        // Had 1, delivered 1, returned 0, balance = 2
        cash: 150.00,
        amount: 150.00,
      },
    ],
  };

  // Print the daily summary
  await printDailyRouteSummary(routeData, 'print');
  
  // Or download as PDF
  // await printDailyRouteSummary(routeData, 'pdf');
}

/**
 * Integration with Route Hisab component:
 * 
 * In your MilkRouteHisab component or API endpoint, use like this:
 * 
 * const dailyStops = await getDailyRouteStops(businessId, date);
 * const customers = dailyStops.map(stop => ({
 *   customerName: stop.customer_name,
 *   houseNo: stop.house_no,
 *   delivered: stop.delivered_qty,
 *   received: stop.empties_returned,
 *   balance: stop.bottle_balance,
 *   cash: stop.cash_collected,
 *   amount: stop.amount,
 * }));
 * 
 * await printDailyRouteSummary({
 *   business,
 *   date: new Date(),
 *   routeName: 'Main Route',
 *   customers,
 * }, 'print');
 */
