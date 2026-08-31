// ============================================================================
// Sample payloads. Loaded by an explicit pick, never on their own.
// ----------------------------------------------------------------------------
// Two of them are deliberately not clean JSON: `broken` exercises the repair
// pass, and `bigint` shows the precision guard doing something `JSON.parse`
// cannot. Handing someone a working example of the failure mode explains the
// feature better than a paragraph does.
// ============================================================================

export type SampleId = 'user' | 'products' | 'weather' | 'broken' | 'bigint';

export const SAMPLES: Record<SampleId, string> = {
  user: `{
  "id": 101,
  "name": "Jane Doe",
  "username": "janedoe",
  "email": "jane.doe@example.com",
  "address": {
    "street": "123 Tech Lane",
    "suite": "Apt. 45",
    "city": "San Francisco",
    "zipcode": "94101"
  },
  "skills": ["JavaScript", "React", "TypeScript", "Node.js"],
  "isActive": true,
  "preferences": {
    "theme": "dark",
    "notifications": { "email": true, "sms": false }
  }
}`,

  products: `[
  {
    "productId": "P001",
    "title": "Ultra-Wide Developer Monitor",
    "price": 449.99,
    "specs": { "size": "34 inch", "resolution": "3440 x 1440", "refreshRate": "144Hz" },
    "inStock": true,
    "tags": ["hardware", "monitor", "developer"]
  },
  {
    "productId": "P002",
    "title": "Mechanical Keyboard (Hot-swappable)",
    "price": 129.5,
    "specs": { "layout": "75%", "switches": "Linear Red", "backlight": "RGB" },
    "inStock": true,
    "tags": ["hardware", "keyboard"]
  },
  {
    "productId": "P003",
    "title": "Ergonomic Office Chair",
    "price": 319,
    "specs": { "material": "Mesh", "armrests": "4D adjustable" },
    "inStock": false,
    "tags": ["furniture", "office"]
  }
]`,

  weather: `{
  "location": "Madrid, Spain",
  "coordinates": { "latitude": 40.4168, "longitude": -3.7038 },
  "forecast": [
    { "day": "Monday", "temperature": { "high": 28, "low": 16 }, "condition": "Sunny", "humidity": 35 },
    { "day": "Tuesday", "temperature": { "high": 30, "low": 18 }, "condition": "Clear", "humidity": 30 },
    { "day": "Wednesday", "temperature": { "high": 25, "low": 15 }, "condition": "Partly Cloudy", "humidity": 45 }
  ],
  "updatedAt": "2026-06-15T12:00:00Z"
}`,

  broken: `{
  // a config file, the way people actually write them
  name: 'staging',
  replicas: 3,
  debug: True,
  limits: { cpu: '500m', memory: '1Gi', },
  hosts: [
    "api.example.com",
    "cdn.example.com",
  ],
}`,

  bigint: `{
  "tweetId": 1789456123789456384,
  "authorId": 7203584821901201408,
  "text": "Every online formatter quietly rounds these ids.",
  "metrics": { "likes": 12043, "reposts": 981 }
}`,
};
