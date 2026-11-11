# LLM Token Benchmark

**Test goal:** does the LLM, given the token-image PNG, produce an answer that matches the expected fixture?

**Overall result:** ✗ FAIL on token-image vs expected.

## Verdict (per provider)

| provider | baseline (raw) | token-image | verdict |
| --- | --- | --- | --- |
| openai | 7/8 | 0/8 | ✗ FAIL |
| anthropic | 7/8 | 0/8 | ✗ FAIL |

## Cost — token-image vs raw-json (paid tokens)

| provider | raw paid | token paid | saved | ratio (raw / token) |
| --- | --- | --- | --- | --- |
| openai | 18,732 | 2,757 | 15,975 | 6.79× |
| anthropic | 24,263 | 2,782 | 21,481 | 8.72× |
| TOTAL | 42,995 | 5,539 | 37,456 | 7.76× |

## Token-image answers (the test)

```
Expected:
  filter.region: APAC
  filter.product: Token Pack
  filter.tier: enterprise
  matchingRecords: 1
  totalRevenue: 14,907.03
  totalRefunds: 92.42
  netRevenue: 14,814.61
  totalMonthlyActiveUsers: 554

openai / token-image:
  ✗ filter.region: got missing (expected APAC)
  ✗ filter.product: got missing (expected Token Pack)
  ✗ filter.tier: got missing (expected enterprise)
  ✗ matchingRecords: got missing (expected 1)
  ✗ totalRevenue: got null (expected 14,907.03)
  ✗ totalRefunds: got null (expected 92.42)
  ✗ netRevenue: got null (expected 14,814.61)
  ✗ totalMonthlyActiveUsers: got null (expected 554)
  → match 0/8 ✗ FAIL

  Model said (verbatim):
    {
      "answer": {
        "apacEnterpriseTokenPackNetRevenue": {
          "recordCount": null,
          "totalRevenue": null,
          "totalRefunds": null,
          "netRevenue": null,
          "totalMonthlyActiveUsers": null
        }
      },
      "extractedValues": {},
      "evidence": [],
      "confidence": "low",
      "notes": [
        "step 1: I cannot losslessly decode the attached PNG to a raw RGB pixel stream in this environment, so I could not recover the token payload or embedded JSON.",
        "If a code interpreter or sandboxed Python were available, I could decode the PNG, inspect the token headers, decompress the data, and parse the embedded UTF-8 JSON document."
      ]
    }

anthropic / token-image:
  ✗ filter.region: got missing (expected APAC)
  ✗ filter.product: got missing (expected Token Pack)
  ✗ filter.tier: got missing (expected enterprise)
  ✗ matchingRecords: got missing (expected 1)
  ✗ totalRevenue: got null (expected 14,907.03)
  ✗ totalRefunds: got null (expected 92.42)
  ✗ netRevenue: got null (expected 14,814.61)
  ✗ totalMonthlyActiveUsers: got null (expected 554)
  → match 0/8 ✗ FAIL

  Model said (verbatim):
    ```json
    {
      "answer": null,
      "extractedValues": {
        "apacEnterpriseTokenPackNetRevenue": {
          "recordCount": null,
          "totalRevenue": null,
          "totalRefunds": null,
          "netRevenue": null,
          "totalMonthlyActiveUsers": null
        }
      },
      "evidence": [],
      "confidence": "low",
      "notes": [
        "Step 1 blocked: I cannot losslessly decode the PNG to exact RGB byte values in this environment. While I can view the image (a 16×16 colorful pixel grid), I do not have access to a PNG decoder that can extract the precise raw RGB byte stream needed for the subsequent decompression steps.",
        "Visual inspection suggests the top-left pixels may contain header bytes (colors that could correspond to 0xC0, 0xDE, 0xAE for a FULL header signature), but I cannot confirm exact byte values without proper decoding.",
        "Steps 2-7 (concatenate bytes, parse header, extract data region, DEFLATE decompress with level 4/9, check wrapped-file envelope, parse JSON) cannot proceed without the exact byte stream from step 1.",
        "This task would be completable with a code interpreter / sandboxed Python environment where I could use libraries like PIL/Pillow to decode PNG → RGB bytes, then zlib to decompress DEFLATE data."
      ]
    }
    ```
```

## Baseline (raw-json) — sanity check only

```
  openai: 7/8 ✗ — baseline didn't reproduce expected, the question may be ambiguous
  anthropic: 7/8 ✗ — baseline didn't reproduce expected, the question may be ambiguous
```

JSON bytes: 58913
Token PNG bytes: 5192
Token round-trips via @tokenpack/node decode: true

## Usage comparison

| provider | mode | status | paid tok | in tok | out tok | prompt | image | B/tok | elapsed | match |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| openai | raw-json | ok | 18,732 | 17,910 | 822 | 58.2 KB | 0 B | 3.33 | 6139 ms | 7/8 |
| openai | token-image | ok | 2,757 | 1,233 | 1,524 | 4.3 KB | 5.1 KB | 7.81 | 13926 ms | 0/8 |
| anthropic | raw-json | ok | 24,263 | 20,975 | 3,288 | 58.2 KB | 0 B | 2.84 | 33603 ms | 7/8 |
| anthropic | token-image | ok | 2,782 | 1,394 | 1,388 | 4.3 KB | 5.1 KB | 6.91 | 29811 ms | 0/8 |

## Calls

### openai / gpt-5.4-mini / raw-json
Status: ok
Elapsed: 6139ms
Prompt bytes: 59613 (chars: 59613)
Image bytes: 0
Usage: in=17910 out=822 reason=516 cached=0 total=18732
Response id: resp_0f8bf60d61c1cfc3006a077a209610819ab7245eb298a21e78
Steps: 1
Finish reason: stop
```text
{
  "answer": {
    "apacEnterpriseTokenPackNetRevenue": {
      "matchingRecordCount": 1,
      "totalRevenue": 14907.03,
      "totalRefunds": 92.42,
      "netRevenue": 14814.61,
      "totalMonthlyActiveUsers": 554
    }
  },
  "extractedValues": {
    "matchingRecordIds": ["evt_00089"],
    "region": "APAC",
    "product": "Token Pack",
    "tier": "enterprise",
    "totalRevenue": 14907.03,
    "totalRefunds": 92.42,
    "netRevenue": 14814.61,
    "totalMonthlyActiveUsers": 554
  },
  "evidence": [
    "records[88] (id: evt_00089): \"region\": \"APAC\", \"product\": \"Token Pack\", \"tier\": \"enterprise\", \"monthlyActiveUsers\": 554, \"revenue\": 14907.03, \"refunds\": 92.42, \"netRevenue\": 14814.61",
    "expectedAnswers.apacEnterpriseTokenPackNetRevenue: matchingRecords=1, totalRevenue=14907.03, totalRefunds=92.42, netRevenue=14814.61, totalMonthlyActiveUsers=554"
  ],
  "confidence": "high",
  "notes": []
}
```
### openai / gpt-5.4-mini / token-image
Status: ok
Elapsed: 13926ms
Prompt bytes: 4442 (chars: 4414)
Image bytes: 5192
Usage: in=1233 out=1524 reason=1357 cached=0 total=2757
Response id: resp_09dfc225d0fcdd17006a077a635b488196b01103489daa5561
Steps: 1
Finish reason: stop
```text
{
  "answer": {
    "apacEnterpriseTokenPackNetRevenue": {
      "recordCount": null,
      "totalRevenue": null,
      "totalRefunds": null,
      "netRevenue": null,
      "totalMonthlyActiveUsers": null
    }
  },
  "extractedValues": {},
  "evidence": [],
  "confidence": "low",
  "notes": [
    "step 1: I cannot losslessly decode the attached PNG to a raw RGB pixel stream in this environment, so I could not recover the token payload or embedded JSON.",
    "If a code interpreter or sandboxed Python were available, I could decode the PNG, inspect the token headers, decompress the data, and parse the embedded UTF-8 JSON document."
  ]
}
```
### anthropic / claude-sonnet-4-5-20250929 / raw-json
Status: ok
Elapsed: 33603ms
Prompt bytes: 59613 (chars: 59613)
Image bytes: 0
Usage: in=20975 out=3288 cached=0 total=24263 anthropic.cacheCreationInputTokens=0
Response id: msg_018cuXxpSGpWxrpacGp6H4Va
Steps: 1
Finish reason: stop
```text
```json
{
  "answer": {
    "apacEnterpriseTokenPackNetRevenue": {
      "matchingRecordCount": 1,
      "totalRevenue": 14907.03,
      "totalRefunds": 92.42,
      "netRevenue": 14814.61,
      "totalMonthlyActiveUsers": 554
    }
  },
  "extractedValues": {
    "matchingRecord": {
      "id": "evt_00089",
      "month": "2026-05",
      "accountId": "acct_0225",
      "region": "APAC",
      "product": "Token Pack",
      "tier": "enterprise",
      "channel": "direct",
      "monthlyActiveUsers": 554,
      "revenue": 14907.03,
      "refunds": 92.42,
      "netRevenue": 14814.61
    }
  },
  "evidence": [
    "records[88]: id='evt_00089', region='APAC', product='Token Pack', tier='enterprise'",
    "records[88].revenue: 14907.03",
    "records[88].refunds: 92.42",
    "records[88].netRevenue: 14814.61",
    "records[88].monthlyActiveUsers: 554"
  ],
  "confidence": "high",
  "notes": [
    "Only 1 record matches all three filter criteria (region=APAC, product=Token Pack, tier=enterprise)",
    "The result matches the expectedAnswers.apacEnterpriseTokenPackNetRevenue provided in the dataset"
  ]
}
```
```
### anthropic / claude-sonnet-4-5-20250929 / token-image
Status: ok
Elapsed: 29811ms
Prompt bytes: 4442 (chars: 4414)
Image bytes: 5192
Usage: in=1394 out=1388 cached=0 total=2782 anthropic.cacheCreationInputTokens=0
Response id: msg_01Tdk8t8LUB87L3rcAdspA7V
Steps: 1
Finish reason: stop
```text
```json
{
  "answer": null,
  "extractedValues": {
    "apacEnterpriseTokenPackNetRevenue": {
      "recordCount": null,
      "totalRevenue": null,
      "totalRefunds": null,
      "netRevenue": null,
      "totalMonthlyActiveUsers": null
    }
  },
  "evidence": [],
  "confidence": "low",
  "notes": [
    "Step 1 blocked: I cannot losslessly decode the PNG to exact RGB byte values in this environment. While I can view the image (a 16×16 colorful pixel grid), I do not have access to a PNG decoder that can extract the precise raw RGB byte stream needed for the subsequent decompression steps.",
    "Visual inspection suggests the top-left pixels may contain header bytes (colors that could correspond to 0xC0, 0xDE, 0xAE for a FULL header signature), but I cannot confirm exact byte values without proper decoding.",
    "Steps 2-7 (concatenate bytes, parse header, extract data region, DEFLATE decompress with level 4/9, check wrapped-file envelope, parse JSON) cannot proceed without the exact byte stream from step 1.",
    "This task would be completable with a code interpreter / sandboxed Python environment where I could use libraries like PIL/Pillow to decode PNG → RGB bytes, then zlib to decompress DEFLATE data."
  ]
}
```
```
## Raw vs token cross-check

_Not the headline; the headline is the verdict above. This block compares the raw-json and token-image answers to each other (consistency check)._

```json
{
  "openai": {
    "ok": false,
    "kind": "json",
    "rawParseable": true,
    "tokenParseable": true,
    "rawComparable": {
      "matchingRecordIds": [
        "evt_00089"
      ],
      "netRevenue": 14814.61,
      "product": "Token Pack",
      "region": "APAC",
      "tier": "enterprise",
      "totalMonthlyActiveUsers": 554,
      "totalRefunds": 92.42,
      "totalRevenue": 14907.03
    },
    "tokenComparable": {},
    "tokenDecodeMatchedJson": true
  },
  "anthropic": {
    "ok": false,
    "kind": "json",
    "rawParseable": true,
    "tokenParseable": true,
    "rawComparable": {
      "matchingRecord": {
        "accountId": "acct_0225",
        "channel": "direct",
        "id": "evt_00089",
        "month": "2026-05",
        "monthlyActiveUsers": 554,
        "netRevenue": 14814.61,
        "product": "Token Pack",
        "refunds": 92.42,
        "region": "APAC",
        "revenue": 14907.03,
        "tier": "enterprise"
      }
    },
    "tokenComparable": {
      "apacEnterpriseTokenPackNetRevenue": {
        "netRevenue": null,
        "recordCount": null,
        "totalMonthlyActiveUsers": null,
        "totalRefunds": null,
        "totalRevenue": null
      }
    },
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
        "inputTokens": 17910,
        "outputTokens": 822,
        "totalTokens": 18732,
        "reasoningTokens": 516,
        "cachedInputTokens": 0,
        "calls": 1,
        "elapsedMs": 6139,
        "promptBytes": 59613,
        "imageBytes": 0
      }
    },
    {
      "provider": "openai",
      "mode": "token-image",
      "usage": {
        "inputTokens": 1233,
        "outputTokens": 1524,
        "totalTokens": 2757,
        "reasoningTokens": 1357,
        "cachedInputTokens": 0,
        "calls": 1,
        "elapsedMs": 13926,
        "promptBytes": 4442,
        "imageBytes": 5192
      }
    },
    {
      "provider": "anthropic",
      "mode": "raw-json",
      "usage": {
        "inputTokens": 20975,
        "outputTokens": 3288,
        "totalTokens": 24263,
        "cachedInputTokens": 0,
        "anthropic.cacheCreationInputTokens": 0,
        "calls": 1,
        "elapsedMs": 33603,
        "promptBytes": 59613,
        "imageBytes": 0
      }
    },
    {
      "provider": "anthropic",
      "mode": "token-image",
      "usage": {
        "inputTokens": 1394,
        "outputTokens": 1388,
        "totalTokens": 2782,
        "cachedInputTokens": 0,
        "anthropic.cacheCreationInputTokens": 0,
        "calls": 1,
        "elapsedMs": 29811,
        "promptBytes": 4442,
        "imageBytes": 5192
      }
    }
  ],
  "perProvider": {
    "openai": {
      "inputTokens": 19143,
      "outputTokens": 2346,
      "totalTokens": 21489,
      "reasoningTokens": 1873,
      "cachedInputTokens": 0,
      "calls": 2,
      "elapsedMs": 20065,
      "promptBytes": 64055,
      "imageBytes": 5192
    },
    "anthropic": {
      "inputTokens": 22369,
      "outputTokens": 4676,
      "totalTokens": 27045,
      "cachedInputTokens": 0,
      "anthropic.cacheCreationInputTokens": 0,
      "calls": 2,
      "elapsedMs": 63414,
      "promptBytes": 64055,
      "imageBytes": 5192
    }
  },
  "perMode": {
    "raw-json": {
      "inputTokens": 38885,
      "outputTokens": 4110,
      "totalTokens": 42995,
      "reasoningTokens": 516,
      "cachedInputTokens": 0,
      "calls": 2,
      "elapsedMs": 39742,
      "promptBytes": 119226,
      "imageBytes": 0,
      "anthropic.cacheCreationInputTokens": 0
    },
    "token-image": {
      "inputTokens": 2627,
      "outputTokens": 2912,
      "totalTokens": 5539,
      "reasoningTokens": 1357,
      "cachedInputTokens": 0,
      "calls": 2,
      "elapsedMs": 43737,
      "promptBytes": 8884,
      "imageBytes": 10384,
      "anthropic.cacheCreationInputTokens": 0
    }
  },
  "perProviderMode": {
    "openai/raw-json": {
      "inputTokens": 17910,
      "outputTokens": 822,
      "totalTokens": 18732,
      "reasoningTokens": 516,
      "cachedInputTokens": 0,
      "calls": 1,
      "elapsedMs": 6139,
      "promptBytes": 59613,
      "imageBytes": 0
    },
    "openai/token-image": {
      "inputTokens": 1233,
      "outputTokens": 1524,
      "totalTokens": 2757,
      "reasoningTokens": 1357,
      "cachedInputTokens": 0,
      "calls": 1,
      "elapsedMs": 13926,
      "promptBytes": 4442,
      "imageBytes": 5192
    },
    "anthropic/raw-json": {
      "inputTokens": 20975,
      "outputTokens": 3288,
      "totalTokens": 24263,
      "cachedInputTokens": 0,
      "anthropic.cacheCreationInputTokens": 0,
      "calls": 1,
      "elapsedMs": 33603,
      "promptBytes": 59613,
      "imageBytes": 0
    },
    "anthropic/token-image": {
      "inputTokens": 1394,
      "outputTokens": 1388,
      "totalTokens": 2782,
      "cachedInputTokens": 0,
      "anthropic.cacheCreationInputTokens": 0,
      "calls": 1,
      "elapsedMs": 29811,
      "promptBytes": 4442,
      "imageBytes": 5192
    }
  },
  "grandTotal": {
    "inputTokens": 41512,
    "outputTokens": 7022,
    "totalTokens": 48534,
    "reasoningTokens": 1873,
    "cachedInputTokens": 0,
    "calls": 4,
    "elapsedMs": 83479,
    "promptBytes": 128110,
    "imageBytes": 10384,
    "anthropic.cacheCreationInputTokens": 0
  },
  "inputBytes": {
    "perCall": [
      {
        "provider": "openai",
        "mode": "raw-json",
        "promptBytes": 59613,
        "imageBytes": 0
      },
      {
        "provider": "openai",
        "mode": "token-image",
        "promptBytes": 4442,
        "imageBytes": 5192
      },
      {
        "provider": "anthropic",
        "mode": "raw-json",
        "promptBytes": 59613,
        "imageBytes": 0
      },
      {
        "provider": "anthropic",
        "mode": "token-image",
        "promptBytes": 4442,
        "imageBytes": 5192
      }
    ],
    "grandTotalPromptBytes": 128110,
    "grandTotalImageBytes": 10384
  },
  "efficiency": [
    {
      "provider": "openai",
      "mode": "raw-json",
      "promptBytes": 59613,
      "imageBytes": 0,
      "inputTokens": 17910,
      "bytesPerInputToken": 3.33
    },
    {
      "provider": "openai",
      "mode": "token-image",
      "promptBytes": 4442,
      "imageBytes": 5192,
      "inputTokens": 1233,
      "bytesPerInputToken": 7.81
    },
    {
      "provider": "anthropic",
      "mode": "raw-json",
      "promptBytes": 59613,
      "imageBytes": 0,
      "inputTokens": 20975,
      "bytesPerInputToken": 2.84
    },
    {
      "provider": "anthropic",
      "mode": "token-image",
      "promptBytes": 4442,
      "imageBytes": 5192,
      "inputTokens": 1394,
      "bytesPerInputToken": 6.91
    }
  ]
}
```
