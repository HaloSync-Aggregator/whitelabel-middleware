---
name: polarhub-airline-rules
description: "PolarHub airline-specific rules. Use when checking airline-specific payment methods, passport requirements, Trip Type restrictions, etc."
---

# PolarHub Airline-Specific Rules

Airline-specific requirements and constraints. Must be verified during implementation.

## Form of Payment

| Airline | BSP Cash | Credit Card | Agent Deposit |
|---------|----------|-------------|---------------|
| AA | O | X | X |
| AF | O | X | X |
| AY | O | X | X |
| BA | O | X | X |
| EK | O | X | X |
| **HA** | O | **O** | X |
| **KE** | O | **O** | X |
| KL | O | X | X |
| LH | O | X | X |
| QR | O | X | X |
| SQ | O | X | X |
| **TR** | X | X | **O** |

### Key Points
- **Only HA and KE** support credit card payments
- **TR (Scoot)** only supports Agent Deposit (BSP Cash not available)
- All others only support BSP Cash

```typescript
// Payment method validation example
function validatePaymentType(airline: string, paymentType: string): boolean {
  const rules = {
    TR: ['Ag'],           // Agent Deposit only
    HA: ['Cash', 'Card'],
    KE: ['Cash', 'Card'],
    DEFAULT: ['Cash'],
  };

  const allowed = rules[airline] || rules.DEFAULT;
  return allowed.includes(paymentType);
}
```

## Agency Contact Required Fields

| Airline | Required Fields |
|---------|----------------|
| **BA** | Email + **PostalAddress** |
| **AF** | Email + Phone |
| **KL** | Email + Phone |

### BA Contact Example
```typescript
// BA requires PostalAddress
const agencyContact = {
  ContactInfoID: 'CTC_TA1',
  EmailAddress: ['agency@example.com'],
  Phone: [{ PhoneNumber: '02-1234-5678' }],
  PostalAddress: [{  // Required for BA
    Street: ['123 Agency Street'],
    CityName: 'Seoul',
    PostalCode: '06000',
    CountryCode: 'KR',
  }],
};
```

## Passport Information Requirements

| Airline | IssuingCountryCode | CitizenshipCountryCode | Full Passport Info |
|---------|-------------------|------------------------|--------------------|
| **HA** | O Required | O Required | - |
| **KE** | O Required | O Required | - |
| **BA (US routes)** | O Required | O Required | O Required |

### HA/KE Passport Information Example
```typescript
// HA, KE require issuing country and citizenship
IdentityDoc: [{
  IdentityDocumentNumber: 'M12345678',
  IdentityDocumentType: 'PT',
  IssuingCountryCode: 'KR',      // Required
  CitizenshipCountryCode: 'KR', // Required
  ExpiryDate: '2030-12-31',
}]
```

## Frequent Flyer Number (FFN) Support

| Supported | Not Supported |
|-----------|---------------|
| **AF, KL** | AA, AY, BA, EK, HA, KE, LH, QR, SQ, TR |

### FFN Addition Example
```typescript
// Only AF and KL supported
if (['AF', 'KL'].includes(airline)) {
  pax.LoyaltyProgramAccount = [{
    ProgramCode: 'FB',  // Flying Blue
    AccountNumber: '123456789',
  }];
}
```

## Direct Flight Search Support

| Supported | Not Supported |
|-----------|---------------|
| AA, AF, BA, EK, HA, KE, KL, LH | AY, QR, SQ, TR |

### Direct Flight Search Configuration
```typescript
// Use Direct option only for airlines that support it
const directSupported = ['AA', 'AF', 'BA', 'EK', 'HA', 'KE', 'KL', 'LH'];

const criteria = {
  Direct: directSupported.includes(airline) ? directOnly : false,
};
```

## Trip Type Support

| Airline | One-Way | Round-Trip | Multi-City | Open Jaw |
|---------|---------|------------|------------|----------|
| **KE** | O | O | **X** | **X** |
| Others | O | O | O | O |

### KE Trip Type Restrictions
```typescript
// KE does not support Multi-City or Open Jaw
if (airline === 'KE') {
  if (originDestList.length > 2) {
    throw new Error('KE does not support Multi-City trips');
  }
  // Open Jaw check: first origin != last destination
  const isOpenJaw = originDestList[0].OriginCode !==
    originDestList[originDestList.length - 1].DestCode;
  if (isOpenJaw) {
    throw new Error('KE does not support Open Jaw trips');
  }
}
```

## BA Special Case: Error Code 50202

**CRITICAL**: BA may return error code 50202 even on successful bookings

```typescript
// BA booking success determination
if (error.code === '50202' && error.message.includes('booking has been created')) {
  // Actually a success - process normally
  return { success: true, warning: error.message };
}
```

## AY Special Case: UpdatePax Operation Modes

**CRITICAL**: AY (Finnair) **does not support the Update mode** in UpdatePax.

### UpdatePax 3 Modes and AY Support Status

| Mode | Request Structure | Behavior | AY Support |
|------|-------------------|----------|------------|
| **Add** | `{ newPaxRefId: "PAX1" }` | Add info | Yes |
| **Delete** | `{ currentPaxRefId: "PAX1" }` | Delete info | Yes |
| **Update** | `{ currentPaxRefId: "PAX1", newPaxRefId: "PAX1" }` | Modify info | **Not Supported** |

### Important Notes

> **WARNING**: When sending an Update mode request to AY, it returns a **success response (00000)** but the **actual data is not changed.**
>
> This is an **airline-side limitation**, not a middleware bug.

### Recommended Implementation Pattern

```typescript
// When contact info change is needed for AY:
// Step 1: Add new info (Add mode)
{
  "ChangeOrderChoice": {
    "UpdatePax": [{ "NewPaxRefID": "PAX2" }]  // Add mode
  },
  "ContactInfoList": [{
    "ContactInfoID": "CTCPAX2_NEW",
    "Phone": [{ "CountryDialingCode": "82", "PhoneNumber": "1099998888" }]
  }]
}

// Step 2: Delete existing info (Delete mode) - if needed
{
  "ChangeOrderChoice": {
    "UpdatePax": [{ "CurrentPaxRefID": "PAX2" }]  // Delete mode
  },
  "ContactInfoList": [{
    "ContactInfoID": "CTCPAX2_OLD",
    "Phone": [{ "CountryDialingCode": "82", "PhoneNumber": "1012345678" }]
  }]
}
```

### AY UpdatePax Test Results (2026-01-15)

| Test | Request | Response | Actually Applied |
|------|---------|----------|------------------|
| Add | `{ newPaxRefId }` | 00000 SUCCESS | Applied |
| Delete | `{ currentPaxRefId }` | 00000 SUCCESS | Applied |
| Update | `{ currentPaxRefId, newPaxRefId }` | 00000 SUCCESS | **Not Applied** |

## Airline-Specific Checklist

### BA (British Airways)
- [ ] Include PostalAddress in Agency Contact
- [ ] Full passport information required for US routes
- [ ] Handle error code 50202 success case

### KE (Korean Air)
- [ ] Block Multi-City and Open Jaw requests
- [ ] Passport issuing country/citizenship required
- [ ] Credit card payment supported

### HA (Hawaiian Airlines)
- [ ] Passport issuing country/citizenship required
- [ ] Credit card payment supported

### TR (Scoot)
- [ ] Only Agent Deposit payment available
- [ ] BSP Cash not available

### AF/KL (Air France / KLM)
- [ ] FFN (frequent flyer) supported
- [ ] Email + Phone required in Agency Contact

### AY (Finnair)
- [ ] UpdatePax **Update mode not supported** (only Add/Delete available)
- [ ] Process contact changes in Add then Delete order
- [ ] Direct flight search not supported
