// Mock users for leaderboard when real users < 5
// These blend in naturally with real users

export interface MockUser {
  id: string;
  humanNumber: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  totalVerifications: number;
  currentStreak: number;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: "mock-1",
    humanNumber: 1,
    username: "sarahchen",
    displayName: "Sarah Chen",
    avatarUrl: "/testimonials/hong kong girl professional 30 years old marketing.jpg",
    totalVerifications: 247,
    currentStreak: 42,
  },
  {
    id: "mock-2",
    humanNumber: 2,
    username: "alexmueller",
    displayName: "Alex Mueller",
    avatarUrl: "/testimonials/german business man middle age in office setting.jpg",
    totalVerifications: 198,
    currentStreak: 31,
  },
  {
    id: "mock-3",
    humanNumber: 3,
    username: "priyasharma",
    displayName: "Priya Sharma",
    avatarUrl: "/testimonials/young muslim girl from south asia studying law.jpg",
    totalVerifications: 156,
    currentStreak: 28,
  },
  {
    id: "mock-4",
    humanNumber: 4,
    username: "marcusthompson",
    displayName: "Marcus Thompson",
    avatarUrl: "/testimonials/black student in america building a personal brand for recruiting.jpg",
    totalVerifications: 134,
    currentStreak: 19,
  },
  {
    id: "mock-5",
    humanNumber: 5,
    username: "emilyliu",
    displayName: "Emily Liu",
    avatarUrl: "/testimonials/chinese student applying to university from high school girl.jpg",
    totalVerifications: 112,
    currentStreak: 15,
  },
  {
    id: "mock-6",
    humanNumber: 6,
    username: "juliawest",
    displayName: "Julia West",
    avatarUrl: "/testimonials/american middle aged women business professional.jpg",
    totalVerifications: 89,
    currentStreak: 12,
  },
  {
    id: "mock-7",
    humanNumber: 7,
    username: "thomasbergman",
    displayName: "Thomas Bergman",
    avatarUrl: "/testimonials/storyteller animation 40 somthing man from europe.jpg",
    totalVerifications: 67,
    currentStreak: 8,
  },
  {
    id: "mock-8",
    humanNumber: 8,
    username: "sophiemartin",
    displayName: "Sophie Martin",
    avatarUrl: "/testimonials/creative professional european 27 years old.jpg",
    totalVerifications: 45,
    currentStreak: 5,
  },
  {
    id: "mock-9",
    humanNumber: 9,
    username: "davidpark",
    displayName: "David Park",
    avatarUrl: "/testimonials/german business man middle age in office setting.jpg",
    totalVerifications: 23,
    currentStreak: 3,
  },
  {
    id: "mock-10",
    humanNumber: 10,
    username: "ameliastone",
    displayName: "Amelia Stone",
    avatarUrl: "/testimonials/hong kong girl professional 30 years old marketing.jpg",
    totalVerifications: 12,
    currentStreak: 2,
  },
];
