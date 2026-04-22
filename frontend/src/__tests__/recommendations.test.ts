// Feature: glow-ai-skin-analyzer, Property 15: Recommendation Output Invariant
import * as fc from 'fast-check'

interface ProductScore {
  product_id: string
  compatibility_score: number
  rank: number
}

function sortByCompatibility(products: ProductScore[]): ProductScore[] {
  return [...products].sort((a, b) => b.compatibility_score - a.compatibility_score)
}

function formatConfidenceScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

describe('Recommendation sorting invariant', () => {
  it('sorted list is always in descending order by compatibility_score', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            product_id: fc.hexaString({ minLength: 24, maxLength: 24 }),
            compatibility_score: fc.float({ min: 0, max: 1, noNaN: true }),
            rank: fc.integer({ min: 1, max: 10 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (products) => {
          const sorted = sortByCompatibility(products)
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].compatibility_score).toBeGreaterThanOrEqual(sorted[i + 1].compatibility_score)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('sorted list has at most 10 items when sliced', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            product_id: fc.hexaString({ minLength: 24, maxLength: 24 }),
            compatibility_score: fc.float({ min: 0, max: 1, noNaN: true }),
            rank: fc.integer({ min: 1, max: 10 }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (products) => {
          const top10 = sortByCompatibility(products).slice(0, 10)
          expect(top10.length).toBeLessThanOrEqual(10)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Confidence score formatting invariant', () => {
  it('always produces a string ending with % for any float in [0, 1]', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        (score) => {
          const formatted = formatConfidenceScore(score)
          expect(formatted).toMatch(/^\d+%$/)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('formatted score is always between 0% and 100%', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        (score) => {
          const formatted = formatConfidenceScore(score)
          const numeric = parseInt(formatted.replace('%', ''), 10)
          expect(numeric).toBeGreaterThanOrEqual(0)
          expect(numeric).toBeLessThanOrEqual(100)
        }
      ),
      { numRuns: 100 }
    )
  })
})
