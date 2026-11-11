# LLM Token Benchmark

JSON bytes: 322138
Token PNG bytes: 23657
Token round-trips via @tokenpack/node decode: true

**Run total paid tokens: ~212,768 (input 211,415 + output 1,353 · cached-input 96,000 (discounted by provider))**

## Usage comparison

| provider | mode | status | paid tok | in tok | out tok | prompt | image | B/tok | elapsed | match |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| openai | raw-json | ok | 97,233 | 97,012 | 221 | 315.3 KB | 0 B | 3.33 | 4863 ms | 8/8 |
| openai | token-image | ok | 1,112 | 993 | 119 | 3.3 KB | 23.1 KB | 27.24 | 2787 ms | 0/8 |
| anthropic | raw-json | ok | 114,423 | 113,410 | 1,013 | 315.3 KB | 0 B | 2.85 | 14340 ms | 8/8 |
| anthropic | token-image | fail | — | — | — | 3.3 KB | 23.1 KB | — | 7501 ms | — |
| TOTAL |  |  | 212,768 | 211,415 | 1,353 | 637.2 KB | 46.2 KB | 3.31 | 29491 ms | 16/24 |
| openai | raw − token |  | 96,121 | 96,019 | 102 | 312.0 KB | -23657 B | — | 2076 ms | — |
| anthropic | raw − token |  | — | — | — | 312.0 KB | -23657 B | — | 6839 ms | — |

## Answer vs expected

```
Expected:
  filter.region: APAC
  filter.product: Token Pack
  filter.tier: enterprise
  matchingRecords: 8
  totalRevenue: 273,508.28
  totalRefunds: 4,070.91
  netRevenue: 269,437.37
  totalMonthlyActiveUsers: 4,100

openai / raw-json:
  ✓ filter.region: got APAC
  ✓ filter.product: got Token Pack
  ✓ filter.tier: got enterprise
  ✓ matchingRecords: got 8
  ✓ totalRevenue: got 273,508.28
  ✓ totalRefunds: got 4,070.91
  ✓ netRevenue: got 269,437.37
  ✓ totalMonthlyActiveUsers: got 4,100
  → match 8/8

openai / token-image:
  ✗ filter.region: got missing (expected APAC)
  ✗ filter.product: got missing (expected Token Pack)
  ✗ filter.tier: got missing (expected enterprise)
  ✗ matchingRecords: got missing (expected 8)
  ✗ totalRevenue: got missing (expected 273,508.28)
  ✗ totalRefunds: got missing (expected 4,070.91)
  ✗ netRevenue: got missing (expected 269,437.37)
  ✗ totalMonthlyActiveUsers: got missing (expected 4,100)
  → match 0/8

anthropic / raw-json:
  ✓ filter.region: got APAC
  ✓ filter.product: got Token Pack
  ✓ filter.tier: got enterprise
  ✓ matchingRecords: got 8
  ✓ totalRevenue: got 273,508.28
  ✓ totalRefunds: got 4,070.91
  ✓ netRevenue: got 269,437.37
  ✓ totalMonthlyActiveUsers: got 4,100
  → match 8/8

anthropic / token-image:
  (call failed: Failed after 3 attempts. Last error: This request would exceed your organization's rate limit of 30,000 input tokens per minute (org: 63d98260-d5ab-42f5-8fd9-03f2726477ba, model: claude-sonnet-4-5-20250929). For details, refer to: https://docs.claude.com/en/api/rate-limits. You can see the response headers for current usage. Reduce the prompt length or the maximum tokens requested, or try again later. View your current limits at https://console.anthropic.com/settings/limits. To raise this limit, purchase credits to advance to the next usage tier at https://console.anthropic.com/settings/billing.)
```

## Calls

### openai / gpt-5.4-mini / raw-json
Status: ok
Elapsed: 4863ms
Prompt bytes: 322838 (chars: 322838)
Image bytes: 0
Usage: in=97012 out=221 reason=0 cached=96000 total=97233
Response id: resp_096d9982d0439d6e006a076ca7d28081958b5827d7b962bb25
Steps: 1
Finish reason: stop
```text
{
  "answer": {
    "apacEnterpriseTokenPackNetRevenue": {
      "matchingRecords": 8,
      "totalRevenue": 273508.28,
      "totalRefunds": 4070.91,
      "netRevenue": 269437.37,
      "totalMonthlyActiveUsers": 4100
    }
  },
  "extractedValues": {
    "filter": {
      "region": "APAC",
      "product": "Token Pack",
      "tier": "enterprise"
    },
    "matchingRecords": 8,
    "totalRevenue": 273508.28,
    "totalRefunds": 4070.91,
    "netRevenue": 269437.37,
    "totalMonthlyActiveUsers": 4100
  },
  "evidence": [
    "expectedAnswers.apacEnterpriseTokenPackNetRevenue",
    "filter: region=APAC, product=Token Pack, tier=enterprise"
  ],
  "confidence": "high",
  "notes": []
}
```
### openai / gpt-5.4-mini / token-image
Status: ok
Elapsed: 2787ms
Prompt bytes: 3393 (chars: 3369)
Image bytes: 23657
Usage: in=993 out=119 reason=0 cached=0 total=1112
Response id: resp_0dcfa1ac97e628cb006a076cab70cc819795ded11c8732a478
Steps: 1
Finish reason: stop
```text
{
  "answer": null,
  "extractedValues": {},
  "evidence": [
    "Unable to reliably decode the embedded PNG from the provided image data in this chat context."
  ],
  "confidence": "low",
  "notes": [
    "I could not extract the raw RGB pixel stream or recover the tokenpack envelope/JSON document from the attached image.",
    "Please re-upload the PNG or provide the embedded JSON directly, and I can compute the APAC / Token Pack / enterprise aggregates."
  ]
}
```
### anthropic / claude-sonnet-4-5-20250929 / raw-json
Status: ok
Elapsed: 14340ms
Prompt bytes: 322838 (chars: 322838)
Image bytes: 0
Usage: in=113410 out=1013 cached=0 total=114423 anthropic.cacheCreationInputTokens=0
Response id: msg_01YBXTzEyap7yjjvXVaPEeTw
Steps: 1
Finish reason: stop
```text
```json
{
  "answer": {
    "matchingRecords": 8,
    "totalRevenue": 273508.28,
    "totalRefunds": 4070.91,
    "netRevenue": 269437.37,
    "totalMonthlyActiveUsers": 4100
  },
  "extractedValues": [
    {
      "id": "evt_00089",
      "region": "APAC",
      "product": "Token Pack",
      "tier": "enterprise",
      "monthlyActiveUsers": 554,
      "revenue": 14907.03,
      "refunds": 92.42,
      "netRevenue": 14814.61
    },
    {
      "id": "evt_00106",
      "region": "APAC",
      "product": "Token Pack",
      "tier": "enterprise",
      "monthlyActiveUsers": 494,
      "revenue": 17580.47,
      "refunds": 98.45,
      "netRevenue": 17482.02
    },
    {
      "id": "evt_00127",
      "region": "APAC",
      "product": "Token Pack",
      "tier": "enterprise",
      "monthlyActiveUsers": 614,
      "revenue": 26419.19,
      "refunds": 338.17,
      "netRevenue": 26081.02
    },
    {
      "id": "evt_00259",
      "region": "APAC",
      "product": "Token Pack",
      "tier": "enterprise",
      "monthlyActiveUsers": 698,
      "revenue": 42323.93,
      "refunds": 871.87,
      "netRevenue": 41452.06
    },
    {
      "id": "evt_00345",
      "region": "APAC",
      "product": "Token Pack",
      "tier": "enterprise",
      "monthlyActiveUsers": 534,
      "revenue": 56747.11,
      "refunds": 612.87,
      "netRevenue": 56134.24
    },
    {
      "id": "evt_00362",
      "region": "APAC",
      "product": "Token Pack",
      "tier": "enterprise",
      "monthlyActiveUsers": 134,
      "revenue": 12578.31,
      "refunds": 118.24,
      "netRevenue": 12460.07
    },
    {
      "id": "evt_00400",
      "region": "APAC",
      "product": "Token Pack",
      "tier": "enterprise",
      "monthlyActiveUsers": 814,
      "revenue": 70352.39,
      "refunds": 745.74,
      "netRevenue": 69606.65
    },
    {
      "id": "evt_00494",
      "region": "APAC",
      "product": "Token Pack",
      "tier": "enterprise",
      "monthlyActiveUsers": 258,
      "revenue": 32599.85,
      "refunds": 1193.15,
      "netRevenue": 31406.7
    }
  ],
  "evidence": [
    "records[88]: region='APAC', product='Token Pack', tier='enterprise'",
    "records[105]: region='APAC', product='Token Pack', tier='enterprise'",
    "records[126]: region='APAC', product='Token Pack', tier='enterprise'",
    "records[258]: region='APAC', product='Token Pack', tier='enterprise'",
    "records[344]: region='APAC', product='Token Pack', tier='enterprise'",
    "records[361]: region='APAC', product='Token Pack', tier='enterprise'",
    "records[399]: region='APAC', product='Token Pack', tier='enterprise'",
    "records[493]: region='APAC', product='Token Pack', tier='enterprise'"
  ],
  "confidence": "high",
  "notes": []
}
```
```
### anthropic / claude-sonnet-4-5-20250929 / token-image
Status: failed
Elapsed: 7501ms
Prompt bytes: 3393 (chars: 3369)
Image bytes: 23657
Usage: usage=n/a
Error: Failed after 3 attempts. Last error: This request would exceed your organization's rate limit of 30,000 input tokens per minute (org: 63d98260-d5ab-42f5-8fd9-03f2726477ba, model: claude-sonnet-4-5-20250929). For details, refer to: https://docs.claude.com/en/api/rate-limits. You can see the response headers for current usage. Reduce the prompt length or the maximum tokens requested, or try again later. View your current limits at https://console.anthropic.com/settings/limits. To raise this limit, purchase credits to advance to the next usage tier at https://console.anthropic.com/settings/billing.
```text
```
## Validation

```json
{
  "openai": {
    "ok": false,
    "kind": "json",
    "rawParseable": true,
    "tokenParseable": true,
    "rawComparable": {
      "filter": {
        "product": "Token Pack",
        "region": "APAC",
        "tier": "enterprise"
      },
      "matchingRecords": 8,
      "netRevenue": 269437.37,
      "totalMonthlyActiveUsers": 4100,
      "totalRefunds": 4070.91,
      "totalRevenue": 273508.28
    },
    "tokenComparable": {},
    "tokenDecodeMatchedJson": true
  },
  "anthropic": {
    "ok": false,
    "reason": "one or both calls failed",
    "tokenDecodeMatchedJson": true
  }
}
```

## Raw usage aggregate

```json
{
  "perCall": [
    {
      "provider": "openai",
      "mode": "raw-json",
      "usage": {
        "inputTokens": 97012,
        "outputTokens": 221,
        "totalTokens": 97233,
        "reasoningTokens": 0,
        "cachedInputTokens": 96000,
        "calls": 1,
        "elapsedMs": 4863,
        "promptBytes": 322838,
        "imageBytes": 0
      }
    },
    {
      "provider": "openai",
      "mode": "token-image",
      "usage": {
        "inputTokens": 993,
        "outputTokens": 119,
        "totalTokens": 1112,
        "reasoningTokens": 0,
        "cachedInputTokens": 0,
        "calls": 1,
        "elapsedMs": 2787,
        "promptBytes": 3393,
        "imageBytes": 23657
      }
    },
    {
      "provider": "anthropic",
      "mode": "raw-json",
      "usage": {
        "inputTokens": 113410,
        "outputTokens": 1013,
        "totalTokens": 114423,
        "cachedInputTokens": 0,
        "anthropic.cacheCreationInputTokens": 0,
        "calls": 1,
        "elapsedMs": 14340,
        "promptBytes": 322838,
        "imageBytes": 0
      }
    },
    {
      "provider": "anthropic",
      "mode": "token-image",
      "usage": {
        "calls": 1,
        "elapsedMs": 7501,
        "promptBytes": 3393,
        "imageBytes": 23657
      }
    }
  ],
  "perProvider": {
    "openai": {
      "inputTokens": 98005,
      "outputTokens": 340,
      "totalTokens": 98345,
      "reasoningTokens": 0,
      "cachedInputTokens": 96000,
      "calls": 2,
      "elapsedMs": 7650,
      "promptBytes": 326231,
      "imageBytes": 23657
    },
    "anthropic": {
      "inputTokens": 113410,
      "outputTokens": 1013,
      "totalTokens": 114423,
      "cachedInputTokens": 0,
      "anthropic.cacheCreationInputTokens": 0,
      "calls": 2,
      "elapsedMs": 21841,
      "promptBytes": 326231,
      "imageBytes": 23657
    }
  },
  "perMode": {
    "raw-json": {
      "inputTokens": 210422,
      "outputTokens": 1234,
      "totalTokens": 211656,
      "reasoningTokens": 0,
      "cachedInputTokens": 96000,
      "calls": 2,
      "elapsedMs": 19203,
      "promptBytes": 645676,
      "imageBytes": 0,
      "anthropic.cacheCreationInputTokens": 0
    },
    "token-image": {
      "inputTokens": 993,
      "outputTokens": 119,
      "totalTokens": 1112,
      "reasoningTokens": 0,
      "cachedInputTokens": 0,
      "calls": 2,
      "elapsedMs": 10288,
      "promptBytes": 6786,
      "imageBytes": 47314
    }
  },
  "perProviderMode": {
    "openai/raw-json": {
      "inputTokens": 97012,
      "outputTokens": 221,
      "totalTokens": 97233,
      "reasoningTokens": 0,
      "cachedInputTokens": 96000,
      "calls": 1,
      "elapsedMs": 4863,
      "promptBytes": 322838,
      "imageBytes": 0
    },
    "openai/token-image": {
      "inputTokens": 993,
      "outputTokens": 119,
      "totalTokens": 1112,
      "reasoningTokens": 0,
      "cachedInputTokens": 0,
      "calls": 1,
      "elapsedMs": 2787,
      "promptBytes": 3393,
      "imageBytes": 23657
    },
    "anthropic/raw-json": {
      "inputTokens": 113410,
      "outputTokens": 1013,
      "totalTokens": 114423,
      "cachedInputTokens": 0,
      "anthropic.cacheCreationInputTokens": 0,
      "calls": 1,
      "elapsedMs": 14340,
      "promptBytes": 322838,
      "imageBytes": 0
    },
    "anthropic/token-image": {
      "calls": 1,
      "elapsedMs": 7501,
      "promptBytes": 3393,
      "imageBytes": 23657
    }
  },
  "grandTotal": {
    "inputTokens": 211415,
    "outputTokens": 1353,
    "totalTokens": 212768,
    "reasoningTokens": 0,
    "cachedInputTokens": 96000,
    "calls": 4,
    "elapsedMs": 29491,
    "promptBytes": 652462,
    "imageBytes": 47314,
    "anthropic.cacheCreationInputTokens": 0
  },
  "inputBytes": {
    "perCall": [
      {
        "provider": "openai",
        "mode": "raw-json",
        "promptBytes": 322838,
        "imageBytes": 0
      },
      {
        "provider": "openai",
        "mode": "token-image",
        "promptBytes": 3393,
        "imageBytes": 23657
      },
      {
        "provider": "anthropic",
        "mode": "raw-json",
        "promptBytes": 322838,
        "imageBytes": 0
      },
      {
        "provider": "anthropic",
        "mode": "token-image",
        "promptBytes": 3393,
        "imageBytes": 23657
      }
    ],
    "grandTotalPromptBytes": 652462,
    "grandTotalImageBytes": 47314
  },
  "efficiency": [
    {
      "provider": "openai",
      "mode": "raw-json",
      "promptBytes": 322838,
      "imageBytes": 0,
      "inputTokens": 97012,
      "bytesPerInputToken": 3.33
    },
    {
      "provider": "openai",
      "mode": "token-image",
      "promptBytes": 3393,
      "imageBytes": 23657,
      "inputTokens": 993,
      "bytesPerInputToken": 27.24
    },
    {
      "provider": "anthropic",
      "mode": "raw-json",
      "promptBytes": 322838,
      "imageBytes": 0,
      "inputTokens": 113410,
      "bytesPerInputToken": 2.85
    },
    {
      "provider": "anthropic",
      "mode": "token-image",
      "promptBytes": 3393,
      "imageBytes": 23657
    }
  ]
}
```
