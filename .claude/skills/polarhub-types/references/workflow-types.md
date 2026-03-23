# Workflow Types Reference

17 workflow definitions and carrier-specific support matrix.

## Workflow ID Types

```typescript
export type PrimeBookingWorkflow =
  | 'WF_PB_DEFERRED'
  | 'WF_PB_IMMEDIATE'
  | 'WF_PB_SEAT'
  | 'WF_PB_SERVICE'
  | 'WF_PB_SEAT_SERVICE';

export type PostBookingHeldWorkflow =
  | 'WF_HELD_SEAT'
  | 'WF_HELD_SERVICE'
  | 'WF_HELD_CONFIRM'
  | 'WF_HELD_CANCEL'
  | 'WF_HELD_ITIN'
  | 'WF_HELD_PAX'
  | 'WF_HELD_SPLIT';

export type PostBookingTicketedWorkflow =
  | 'WF_TKT_SEAT'
  | 'WF_TKT_SERVICE'
  | 'WF_TKT_VOLCHANGE'
  | 'WF_TKT_REFUND'
  | 'WF_TKT_OCN';

export type WorkflowId =
  | PrimeBookingWorkflow
  | PostBookingHeldWorkflow
  | PostBookingTicketedWorkflow;
```

## Workflow Definition Interface

```typescript
export interface WorkflowDefinition {
  id: WorkflowId;
  description: string;
  phase: 'prime_booking' | 'post_booking_held' | 'post_booking_ticketed';
  apiSequence: string[];
  requiresFop: boolean;
}
```

## All Workflow Definitions

```typescript
export const WORKFLOW_DEFINITIONS: Record<WorkflowId, WorkflowDefinition> = {
  // Prime Booking (5)
  WF_PB_DEFERRED: {
    id: 'WF_PB_DEFERRED',
    description: 'Create booking, ticket later',
    phase: 'prime_booking',
    apiSequence: ['AirShopping', 'OfferPrice', 'OrderCreate'],
    requiresFop: false,
  },
  WF_PB_IMMEDIATE: {
    id: 'WF_PB_IMMEDIATE',
    description: 'Book and ticket simultaneously',
    phase: 'prime_booking',
    apiSequence: ['AirShopping', 'OfferPrice', 'OrderCreate'],
    requiresFop: true,
  },
  WF_PB_SEAT: {
    id: 'WF_PB_SEAT',
    description: 'Booking with seat selection',
    phase: 'prime_booking',
    apiSequence: ['AirShopping', 'SeatAvailability', 'OfferPrice', 'OrderCreate'],
    requiresFop: true,
  },
  WF_PB_SERVICE: {
    id: 'WF_PB_SERVICE',
    description: 'Booking with ancillary services',
    phase: 'prime_booking',
    apiSequence: ['AirShopping', 'ServiceList', 'OfferPrice', 'OrderCreate'],
    requiresFop: true,
  },
  WF_PB_SEAT_SERVICE: {
    id: 'WF_PB_SEAT_SERVICE',
    description: 'Booking with seat + ancillary services',
    phase: 'prime_booking',
    apiSequence: ['AirShopping', 'SeatAvailability', 'ServiceList', 'OfferPrice', 'OrderCreate'],
    requiresFop: true,
  },

  // Post-Booking Held (7)
  WF_HELD_SEAT: {
    id: 'WF_HELD_SEAT',
    description: 'Seat change while in Hold status',
    phase: 'post_booking_held',
    apiSequence: ['OrderRetrieve', 'SeatAvailability', 'OrderChange'],
    requiresFop: false,
  },
  WF_HELD_SERVICE: {
    id: 'WF_HELD_SERVICE',
    description: 'Add service while in Hold status',
    phase: 'post_booking_held',
    apiSequence: ['OrderRetrieve', 'ServiceList', 'OrderQuote', 'OrderChange'],
    requiresFop: false,
  },
  WF_HELD_CONFIRM: {
    id: 'WF_HELD_CONFIRM',
    description: 'Confirm held booking (ticketing)',
    phase: 'post_booking_held',
    apiSequence: ['OrderRetrieve', 'OrderChange'],
    requiresFop: true,
  },
  WF_HELD_CANCEL: {
    id: 'WF_HELD_CANCEL',
    description: 'Cancel held booking',
    phase: 'post_booking_held',
    apiSequence: ['OrderRetrieve', 'OrderCancel'],
    requiresFop: false,
  },
  WF_HELD_ITIN: {
    id: 'WF_HELD_ITIN',
    description: 'Itinerary change while in Hold status',
    phase: 'post_booking_held',
    apiSequence: ['OrderRetrieve', 'OrderReshop', 'OrderChange'],
    requiresFop: false,
  },
  WF_HELD_PAX: {
    id: 'WF_HELD_PAX',
    description: 'Passenger info change while in Hold status',
    phase: 'post_booking_held',
    apiSequence: ['OrderRetrieve', 'OrderChange'],
    requiresFop: false,
  },
  WF_HELD_SPLIT: {
    id: 'WF_HELD_SPLIT',
    description: 'PNR split',
    phase: 'post_booking_held',
    apiSequence: ['OrderRetrieve', 'OrderChange'],
    requiresFop: false,
  },

  // Post-Booking Ticketed (5)
  WF_TKT_SEAT: {
    id: 'WF_TKT_SEAT',
    description: 'Seat change after ticketing',
    phase: 'post_booking_ticketed',
    apiSequence: ['OrderRetrieve', 'SeatAvailability', 'OrderQuote', 'OrderChange'],
    requiresFop: false,
  },
  WF_TKT_SERVICE: {
    id: 'WF_TKT_SERVICE',
    description: 'Add service after ticketing',
    phase: 'post_booking_ticketed',
    apiSequence: ['OrderRetrieve', 'ServiceList', 'OrderQuote', 'OrderChange'],
    requiresFop: false,
  },
  WF_TKT_VOLCHANGE: {
    id: 'WF_TKT_VOLCHANGE',
    description: 'Voluntary itinerary change',
    phase: 'post_booking_ticketed',
    apiSequence: ['OrderRetrieve', 'OrderReshop', 'OrderChange'],
    requiresFop: false,
  },
  WF_TKT_REFUND: {
    id: 'WF_TKT_REFUND',
    description: 'Voluntary refund',
    phase: 'post_booking_ticketed',
    apiSequence: ['OrderRetrieve', 'OrderReshop', 'OrderCancel'],
    requiresFop: false,
  },
  WF_TKT_OCN: {
    id: 'WF_TKT_OCN',
    description: 'Accept involuntary change (OCN)',
    phase: 'post_booking_ticketed',
    apiSequence: ['OrderRetrieve', 'OrderChange'],
    requiresFop: false,
  },
};
```

## Carrier Support Matrix

```typescript
export type SupportLevel = 'PROD' | 'SANDBOX' | 'PARTIAL' | 'NONE' | 'NA';

export const WORKFLOW_SUPPORT: Record<string, OfferPriceWorkflow[]> = {
  // Full Support
  AY: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE', 'WF_PB_SEAT', 'WF_PB_SERVICE', 'WF_PB_SEAT_SERVICE'],
  SQ: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE', 'WF_PB_SEAT', 'WF_PB_SERVICE', 'WF_PB_SEAT_SERVICE'],
  TK: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE', 'WF_PB_SEAT', 'WF_PB_SERVICE', 'WF_PB_SEAT_SERVICE'],
  HA: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE', 'WF_PB_SEAT', 'WF_PB_SERVICE', 'WF_PB_SEAT_SERVICE'],

  // Partial (SEAT_SERVICE is PARTIAL)
  AF: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE', 'WF_PB_SEAT', 'WF_PB_SERVICE'],
  KL: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE', 'WF_PB_SEAT', 'WF_PB_SERVICE'],

  // Seat Only
  QR: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE', 'WF_PB_SEAT', 'WF_PB_SERVICE'],
  TR: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE', 'WF_PB_SEAT'],

  // Basic Only
  AA: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE'],
  BA: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE'],
  EK: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE'],
  LH: ['WF_PB_DEFERRED', 'WF_PB_IMMEDIATE'],

  // Not Supported
  KE: [],
};
```

## Helper Functions

```typescript
export function isWorkflowSupported(carrier: string, workflow: OfferPriceWorkflow): boolean {
  return WORKFLOW_SUPPORT[carrier]?.includes(workflow) ?? false;
}

export function getSupportedWorkflows(carrier: string): OfferPriceWorkflow[] {
  return WORKFLOW_SUPPORT[carrier] ?? [];
}

export function getCarriersForWorkflow(workflow: OfferPriceWorkflow): string[] {
  return Object.entries(WORKFLOW_SUPPORT)
    .filter(([_, workflows]) => workflows.includes(workflow))
    .map(([carrier]) => carrier);
}

export function getWorkflowDefinition(id: WorkflowId): WorkflowDefinition {
  return WORKFLOW_DEFINITIONS[id];
}

export function getWorkflowsByPhase(
  phase: 'prime_booking' | 'post_booking_held' | 'post_booking_ticketed'
): WorkflowDefinition[] {
  return Object.values(WORKFLOW_DEFINITIONS).filter(wf => wf.phase === phase);
}

export function getApiSequence(workflowId: WorkflowId): string[] {
  return WORKFLOW_DEFINITIONS[workflowId]?.apiSequence ?? [];
}
```
