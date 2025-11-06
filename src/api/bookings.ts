// api/bookings.ts
import api from "./client";

export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Declined = 2,
  CancelledByParent = 3,
  CancelledBySpecialist = 4,
  Completed = 5, // NEW
}

export type Booking = {
  id: string; specialistUserId: string; parentUserId: string;
  startsAtUtc: string; endsAtUtc: string;
  status: BookingStatus; messageFromParent?: string;
  availabilitySlotId?: string;
  childId?: string | null;
  createdAtUtc: string; updatedAtUtc: string;
};

export type CloseBookingRequest = {
  summary: string;
  recommendations?: string | null;
  nextSteps?: string | null;
  specialistPrivateNotes?: string | null;
};

export type BookingOutcome = {
  bookingId: string;
  summary: string;
  recommendations?: string | null;
  nextSteps?: string | null;
  createdAtUtc: string;
  parentAcknowledgedAtUtc?: string | null;
};

// Parent
export async function createBooking(
  availabilitySlotId: string,
  childId: string,
  messageFromParent?: string
) {
  const { data } = await api.post<Booking>("/api/parent/bookings", {
    availabilitySlotId,
    childId,
    messageFromParent
  });
  return data;
}
export async function myBookings(status?: BookingStatus, fromUtc?: string, toUtc?: string) {
  const params: any = {};
  if (status !== undefined) params.status = status;
  if (fromUtc && toUtc) { params.fromUtc = fromUtc; params.toUtc = toUtc; }
  const { data } = await api.get<Booking[]>("/api/parent/bookings", { params });
  return data;
}
export async function cancelBooking(id: string) {
  await api.post(`/api/parent/bookings/${id}/cancel`, {});
}
// NEW: outcome для родителя
export async function getOutcomeForParent(bookingId: string) {
  const { data } = await api.get<BookingOutcome>(`/api/parent/bookings/${bookingId}/outcome`);
  return data;
}
export async function acknowledgeOutcome(bookingId: string) {
  await api.post(`/api/parent/bookings/${bookingId}/outcome/ack`, {});
}

// Specialist
export async function incomingBookings(status?: BookingStatus, fromUtc?: string, toUtc?: string) {
  const params: any = {};
  if (status !== undefined) params.status = status;
  if (fromUtc && toUtc) { params.fromUtc = fromUtc; params.toUtc = toUtc; }
  const { data } = await api.get<Booking[]>("/api/specialist/bookings", { params });
  return data;
}
export async function confirmBooking(id: string) {
  await api.post(`/api/specialist/bookings/${id}/confirm`);
}
export async function declineBooking(id: string) {
  await api.post(`/api/specialist/bookings/${id}/decline`);
}
// NEW: закрыть визит
export async function closeBooking(id: string, body: CloseBookingRequest) {
  await api.post(`/api/specialist/bookings/${id}/close`, body);
}
// (опционально) деталка для спеца, если захочешь
export async function getBookingDetailsForSpec(id: string) {
  const { data } = await api.get(`/api/specialist/bookings/${id}`);
  return data;
}
