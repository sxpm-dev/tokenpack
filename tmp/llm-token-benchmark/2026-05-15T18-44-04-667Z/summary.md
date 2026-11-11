# LLM Token Benchmark

JSON bytes: 1288326
Token PNG bytes: 67158
Token round-trips via @tokenpack/node decode: true

## Calls

### openai / gpt-5.4-mini / raw-json
Status: failed
Elapsed: 5769ms
Prompt bytes: 1289026 (chars: 1289026)
Image bytes: 0
Usage: usage=n/a
Error: Your input exceeds the context window of this model. Please adjust your input and try again.
```text
```
### openai / gpt-5.4-mini / token-image
Status: ok
Elapsed: 3704ms
Prompt bytes: 2873 (chars: 2871)
Image bytes: 67158
Usage: in=867 out=174 reason=0 cached=0 total=1041
Response id: resp_00537a5248dd6f12006a07697be5e08199a9cdb3ed328b8116
Steps: 1
Finish reason: stop
```text
{
  "answer": {
    "apacEnterpriseTokenPackNetRevenue": {
      "matchingRecordCount": null,
      "totalRevenue": null,
      "totalRefunds": null,
      "netRevenue": null,
      "totalMonthlyActiveUsers": null
    }
  },
  "extractedValues": {},
  "evidence": [
    "Unable to decode embedded PNG data in this environment.",
    "No JSON payload could be recovered for filtering."
  ],
  "confidence": "low",
  "notes": [
    "The provided image appears as visually random noise, but I cannot perform the required lossless PNG-to-RGB extraction and Brotli/header decoding here.",
    "Because the underlying dataset JSON was not recovered, the requested APAC / Token Pack / enterprise aggregation could not be computed."
  ]
}
```
### anthropic / claude-sonnet-4-5-20250929 / raw-json
Status: failed
Elapsed: 7633ms
Prompt bytes: 1289026 (chars: 1289026)
Image bytes: 0
Usage: usage=n/a
Error: Failed after 3 attempts. Last error: Failed to process error response
```text
```
### anthropic / claude-sonnet-4-5-20250929 / token-image
Status: failed
Elapsed: 2822ms
Prompt bytes: 2873 (chars: 2871)
Image bytes: 67158
Usage: usage=n/a
Error: Failed after 2 attempts with non-retryable error: 'invalid x-api-key'
```text
```
## Usage totals

```json
{
  "perCall": [
    {
      "provider": "openai",
      "mode": "raw-json",
      "usage": {
        "calls": 1,
        "elapsedMs": 5769,
        "promptBytes": 1289026,
        "imageBytes": 0
      }
    },
    {
      "provider": "openai",
      "mode": "token-image",
      "usage": {
        "inputTokens": 867,
        "outputTokens": 174,
        "totalTokens": 1041,
        "reasoningTokens": 0,
        "cachedInputTokens": 0,
        "calls": 1,
        "elapsedMs": 3704,
        "promptBytes": 2873,
        "imageBytes": 67158
      }
    },
    {
      "provider": "anthropic",
      "mode": "raw-json",
      "usage": {
        "calls": 1,
        "elapsedMs": 7633,
        "promptBytes": 1289026,
        "imageBytes": 0
      }
    },
    {
      "provider": "anthropic",
      "mode": "token-image",
      "usage": {
        "calls": 1,
        "elapsedMs": 2822,
        "promptBytes": 2873,
        "imageBytes": 67158
      }
    }
  ],
  "perProvider": {
    "openai": {
      "calls": 2,
      "elapsedMs": 9473,
      "promptBytes": 1291899,
      "imageBytes": 67158,
      "inputTokens": 867,
      "outputTokens": 174,
      "totalTokens": 1041,
      "reasoningTokens": 0,
      "cachedInputTokens": 0
    },
    "anthropic": {
      "calls": 2,
      "elapsedMs": 10455,
      "promptBytes": 1291899,
      "imageBytes": 67158
    }
  },
  "perMode": {
    "raw-json": {
      "calls": 2,
      "elapsedMs": 13402,
      "promptBytes": 2578052,
      "imageBytes": 0
    },
    "token-image": {
      "inputTokens": 867,
      "outputTokens": 174,
      "totalTokens": 1041,
      "reasoningTokens": 0,
      "cachedInputTokens": 0,
      "calls": 2,
      "elapsedMs": 6526,
      "promptBytes": 5746,
      "imageBytes": 134316
    }
  },
  "perProviderMode": {
    "openai/raw-json": {
      "calls": 1,
      "elapsedMs": 5769,
      "promptBytes": 1289026,
      "imageBytes": 0
    },
    "openai/token-image": {
      "inputTokens": 867,
      "outputTokens": 174,
      "totalTokens": 1041,
      "reasoningTokens": 0,
      "cachedInputTokens": 0,
      "calls": 1,
      "elapsedMs": 3704,
      "promptBytes": 2873,
      "imageBytes": 67158
    },
    "anthropic/raw-json": {
      "calls": 1,
      "elapsedMs": 7633,
      "promptBytes": 1289026,
      "imageBytes": 0
    },
    "anthropic/token-image": {
      "calls": 1,
      "elapsedMs": 2822,
      "promptBytes": 2873,
      "imageBytes": 67158
    }
  },
  "grandTotal": {
    "calls": 4,
    "elapsedMs": 19928,
    "promptBytes": 2583798,
    "imageBytes": 134316,
    "inputTokens": 867,
    "outputTokens": 174,
    "totalTokens": 1041,
    "reasoningTokens": 0,
    "cachedInputTokens": 0
  },
  "inputBytes": {
    "perCall": [
      {
        "provider": "openai",
        "mode": "raw-json",
        "promptBytes": 1289026,
        "imageBytes": 0
      },
      {
        "provider": "openai",
        "mode": "token-image",
        "promptBytes": 2873,
        "imageBytes": 67158
      },
      {
        "provider": "anthropic",
        "mode": "raw-json",
        "promptBytes": 1289026,
        "imageBytes": 0
      },
      {
        "provider": "anthropic",
        "mode": "token-image",
        "promptBytes": 2873,
        "imageBytes": 67158
      }
    ],
    "grandTotalPromptBytes": 2583798,
    "grandTotalImageBytes": 134316
  },
  "efficiency": [
    {
      "provider": "openai",
      "mode": "raw-json",
      "promptBytes": 1289026,
      "imageBytes": 0
    },
    {
      "provider": "openai",
      "mode": "token-image",
      "promptBytes": 2873,
      "imageBytes": 67158,
      "inputTokens": 867,
      "bytesPerInputToken": 80.77
    },
    {
      "provider": "anthropic",
      "mode": "raw-json",
      "promptBytes": 1289026,
      "imageBytes": 0
    },
    {
      "provider": "anthropic",
      "mode": "token-image",
      "promptBytes": 2873,
      "imageBytes": 67158
    }
  ]
}
```

## Validation

```json
{
  "openai": {
    "ok": false,
    "reason": "one or both calls failed",
    "tokenDecodeMatchedJson": true
  },
  "anthropic": {
    "ok": false,
    "reason": "one or both calls failed",
    "tokenDecodeMatchedJson": true
  }
}
```
