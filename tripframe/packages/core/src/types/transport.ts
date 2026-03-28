export type TransportMode = 'PUBLIC' | 'TAXI' | 'RENTAL';

export interface TransportOption {
  id: string;
  mode: TransportMode;
  label: string;
  durationMinutes: number;
  pricePerPerson: number; // KRW
  bookingUrl?: string;
  notes?: string;
  requiresBooking: boolean;
}

export interface UserPreferences {
  luggageSize: 'CARRY_ON' | 'LARGE';
  transportPreference: 'PUBLIC' | 'TAXI' | 'ANY';
  timeBuffer: 'TIGHT' | 'RELAXED';
}
