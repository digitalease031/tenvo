// Test formatCurrency coercion
const { formatCurrency, formatAmount } = require('../lib/currency');
console.log('Test 1 (number 204.16):', formatCurrency(204.16, 'PKR'));
console.log('Test 2 (string "204.16"):', formatCurrency('204.16', 'PKR'));
console.log('Test 3 (string "2520000.00"):', formatCurrency('2520000.00', 'PKR'));
console.log('Test 4 (formatAmount "7424.00"):', formatAmount('7424.00', 'PKR'));
