// api/reviews.ts
import api from "./client";

export type ReviewItem = {
  id: string;
  rating: number;
  comment?: string;
  authorName: string;
  createdAtUtc: string;
};

export type ReviewsSummary = {
  average: number;
  count: number;
  items: ReviewItem[];
};

export async function getReviews(userId: string, skip = 0, take = 10) {
  const { data } = await api.get<ReviewsSummary>(`/api/specialists/${userId}/reviews`, {
    params: { skip, take },
  });
  return data;
}

export async function addReview(
  userId: string,
  payload: { bookingId?: string; rating: number; comment?: string; isAnonymous?: boolean }
) {
  await api.post(`/api/specialists/${userId}/reviews`, payload);
}
