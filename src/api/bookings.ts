import api from "./client";

export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Declined = 2,
  CancelledByParent = 3,
  CancelledBySpecialist = 4
}
export type Booking = {
  id: string; specialistUserId: string; parentUserId: string;
  startsAtUtc: string; endsAtUtc: string;
  status: BookingStatus; messageFromParent?: string; availabilitySlotId?: string;
  createdAtUtc: string; updatedAtUtc: string;
};

// Parent
export async function createBooking(availabilitySlotId: string, messageFromParent?: string) {
  const { data } = await api.post<Booking>("/api/parent/bookings", { availabilitySlotId, messageFromParent });
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