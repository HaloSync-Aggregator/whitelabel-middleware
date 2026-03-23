---
name: polarhub-zod-schemas
description: PolarHub Zod validation schemas. Use when runtime type validation is needed. Includes AirShopping, OrderCreate schemas and validation rules.
---

# PolarHub Zod Validation Schemas

Zod schema definitions for runtime type validation.

## Flight Search Schema

```typescript
// lib/polarhub/schemas/air-shopping.schema.ts
import { z } from 'zod';

const IataCodeSchema = z.string().length(3).regex(/^[A-Z]{3}$/);
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const CabinSchema = z.enum(['Y', 'W', 'C', 'F']);
const PtcSchema = z.enum(['ADT', 'CHD', 'INF']);

export const OriginDestSchema = z.object({
  origin: IataCodeSchema,
  destination: IataCodeSchema,
  departureDate: DateSchema,
});

export const PassengerSchema = z.object({
  type: PtcSchema,
  count: z.number().int().min(1).max(9),
});

export const AirShoppingRequestSchema = z.object({
  originDest: z.array(OriginDestSchema).min(1).max(4),
  passengers: z.array(PassengerSchema).min(1),
  cabin: CabinSchema.optional().default('Y'),
  directOnly: z.boolean().optional().default(false),
  airlines: z.array(z.string().length(2)).optional(),
  promotionCode: z.string().optional(),
  accountId: z.string().optional(),
  currencyCode: z.string().length(3).optional(),
}).refine(
  (data) => {
    // Validate total passenger count <= 9
    const total = data.passengers.reduce((sum, p) => sum + p.count, 0);
    return total <= 9;
  },
  { message: 'Total passengers cannot exceed 9' }
).refine(
  (data) => {
    // Validate INF count <= ADT count
    const adults = data.passengers.find(p => p.type === 'ADT')?.count || 0;
    const infants = data.passengers.find(p => p.type === 'INF')?.count || 0;
    return infants <= adults;
  },
  { message: 'Number of infants cannot exceed number of adults' }
);

export type AirShoppingRequest = z.infer<typeof AirShoppingRequestSchema>;
```

## Order Create Schema

```typescript
// lib/polarhub/schemas/order-create.schema.ts
import { z } from 'zod';

const GenderSchema = z.enum(['Male', 'Female', 'Unspecified']);
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const EmailSchema = z.string().email();
const PhoneSchema = z.string().min(5).max(20);

export const PassengerInfoSchema = z.object({
  paxId: z.string(),
  type: z.enum(['ADT', 'CHD', 'INF']),
  title: z.enum(['MR', 'MRS', 'MS', 'MISS', 'MSTR']),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  middleName: z.string().max(50).optional(),
  birthDate: DateSchema,
  gender: GenderSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  countryCode: z.string().length(2),
  passport: z.object({
    number: z.string().min(5).max(20),
    expiryDate: DateSchema,
    issuingCountry: z.string().length(2),
    nationality: z.string().length(2),
  }).optional(),
  loyaltyProgram: z.object({
    programCode: z.string(),
    accountNumber: z.string(),
  }).optional(),
});

export const PaymentInfoSchema = z.object({
  type: z.enum(['Cash', 'Card', 'Ag']),
  amount: z.number().positive(),
  currency: z.string().length(3),
  card: z.object({
    code: z.string(),        // VI, MC, AMEX
    number: z.string(),
    holderName: z.string(),
    expiryDate: z.string(),  // MMYY
    cvv: z.string().length(3),
  }).optional(),
});

export const OrderCreateRequestSchema = z.object({
  transactionId: z.string().length(32),
  responseId: z.string(),
  offerId: z.string(),
  owner: z.string().length(2),
  offerItems: z.array(z.object({
    offerItemId: z.string(),
    paxRefIds: z.array(z.string()).min(1),
  })).min(1),
  passengers: z.array(PassengerInfoSchema).min(1),
  payment: PaymentInfoSchema,
  agencyContact: z.object({
    email: EmailSchema,
    phone: PhoneSchema,
    address: z.object({
      street: z.string(),
      city: z.string(),
      postalCode: z.string(),
      country: z.string().length(2),
    }).optional(),
  }),
});

export type OrderCreateRequest = z.infer<typeof OrderCreateRequestSchema>;
```

## Validation Rules Summary

### Passenger Count Limits
- Total passenger count <= 9
- Infant (INF) count <= Adult (ADT) count

### Code Formats
| Field | Format | Example |
|-------|--------|---------|
| IATA airport code | 3 uppercase letters | `ICN`, `SIN` |
| Airline code | 2 characters | `SQ`, `KE` |
| Date | YYYY-MM-DD | `2025-09-10` |
| Currency code | 3-character ISO 4217 | `KRW`, `USD` |
| Country code | 2-character ISO 3166-1 | `KR`, `US` |

### Passenger Type Codes (PTC)
- `ADT`: Adult (12 years and older)
- `CHD`: Child (2-11 years)
- `INF`: Infant (0-1 years)

### Cabin Class
- `Y`: Economy
- `W`: Premium Economy
- `C`: Business
- `F`: First

## Usage Example

```typescript
import { AirShoppingRequestSchema } from '@/lib/polarhub/schemas/air-shopping.schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validated = AirShoppingRequestSchema.parse(body);

    // Use validated data
    const query = transformToAirShoppingQuery(validated);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
  }
}
```
