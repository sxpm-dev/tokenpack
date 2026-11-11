# Reproduce
1. Load input.json.
2. Multiply unit price by quantity.
3. Apply the 10% discount.
4. Round once to integer cents: Math.round(1999 * 3 * 0.9) = 5397.
Compare against expected.json.
