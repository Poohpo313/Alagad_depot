// API utility functions for the donation management system
// Now using web scraping to get donation information from Filipino websites

import {
  scrapeDonations,
  scrapeDonationById,
  searchDonations,
  getDonationsByCategory,
  refreshDonationData,
  ScrapedDonation,
} from "./webScraper";

// Export the ScrapedDonation interface as DonationData for backward compatibility
export type DonationData = ScrapedDonation;

// Function to fetch all donations from Filipino websites and local storage
export async function fetchDonations(): Promise<DonationData[]> {
  try {
    // Get donations from web scraping - filter out personal AI-generated donations
    const scrapedDonations = await scrapeDonations();
    const filteredScrapedDonations = scrapedDonations.filter(
      (donation) =>
        !(
          donation.source === "User Donation" &&
          (donation.title === "School Supplies for Children" ||
            donation.title === "Books")
        ),
    );

    // Get user donations from local storage
    const userDonations = JSON.parse(
      localStorage.getItem("userDonations") || "[]",
    );

    // Combine both sources
    const allDonations = [...filteredScrapedDonations, ...userDonations];
    console.log(
      "API: Fetched donations from Filipino websites and local users",
      allDonations,
    );

    // Dispatch an event to notify about the fetched donations
    const fetchEvent = new CustomEvent("donations-fetched", {
      detail: { count: allDonations.length },
    });
    window.dispatchEvent(fetchEvent);

    // No limit on donations returned - return all available donations
    return allDonations;
  } catch (error) {
    console.error("Error fetching donations:", error);
    return [];
  }
}

// Function to fetch only user-created donations
export async function fetchUserDonations(
  userId: string,
): Promise<DonationData[]> {
  try {
    // Get user donations from local storage
    const userDonations = JSON.parse(
      localStorage.getItem("userDonations") || "[]",
    );

    console.log(`API: All donations in localStorage:`, userDonations);
    console.log(`API: Looking for donations with userId: ${userId}`);

    // Filter donations by user ID and ensure they're actually created by the user
    // (not AI-generated donations)
    const filteredDonations = userDonations.filter(
      (donation: DonationData & { userId?: string }) => {
        const isMatch =
          donation.userId === userId && donation.source === "User Donation";
        console.log(
          `Checking donation ${donation.id}: userId=${donation.userId}, source=${donation.source}, isMatch=${isMatch}`,
        );
        return isMatch;
      },
    );

    console.log(`API: Fetched donations for user ${userId}`, filteredDonations);

    return filteredDonations;
  } catch (error) {
    console.error(`Error fetching donations for user ${userId}:`, error);
    return [];
  }
}

// Function to delete a user donation
export async function deleteUserDonation(
  donationId: string,
  userId: string,
): Promise<boolean> {
  try {
    // Get user donations from local storage
    const userDonations = JSON.parse(
      localStorage.getItem("userDonations") || "[]",
    );

    // Find the donation index
    const donationIndex = userDonations.findIndex(
      (donation: DonationData & { userId?: string }) =>
        donation.id === donationId && donation.userId === userId,
    );

    if (donationIndex === -1) {
      console.error(
        `Donation ${donationId} not found or not owned by user ${userId}`,
      );
      return false;
    }

    // Remove the donation
    userDonations.splice(donationIndex, 1);

    // Save back to local storage
    localStorage.setItem("userDonations", JSON.stringify(userDonations));

    // Create a notification for deletion
    const notificationEvent = new CustomEvent("donation-update", {
      detail: { id: donationId, action: "deleted" },
    });
    window.dispatchEvent(notificationEvent);

    console.log(`API: Deleted donation ${donationId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting donation ${donationId}:`, error);
    return false;
  }
}

// Function to fetch a single donation by ID
export async function fetchDonationById(
  id: string,
): Promise<DonationData | null> {
  try {
    // Get donation by ID from web scraping
    const donation = await scrapeDonationById(id);
    if (donation) return donation;
    // If not found, check userDonations in localStorage
    const userDonations = JSON.parse(
      localStorage.getItem("userDonations") || "[]",
    );
    const userDonation = userDonations.find((d: DonationData) => d.id === id);
    if (userDonation) return userDonation;
    return null;
  } catch (error) {
    console.error(`Error fetching donation with ID ${id}:`, error);
    return null;
  }
}

// Function to search for donations by keyword
export async function searchDonationsByKeyword(
  keyword: string,
): Promise<DonationData[]> {
  try {
    // Search donations by keyword
    const donations = await searchDonations(keyword);
    console.log(`API: Searched donations with keyword "${keyword}"`, donations);
    return donations;
  } catch (error) {
    console.error(
      `Error searching donations with keyword "${keyword}":`,
      error,
    );
    return [];
  }
}

// Function to get donations by category
export async function fetchDonationsByCategory(
  category: string,
): Promise<DonationData[]> {
  try {
    // Get donations by category
    const donations = await getDonationsByCategory(category);
    console.log(`API: Fetched donations in category "${category}"`, donations);
    return donations;
  } catch (error) {
    console.error(`Error fetching donations in category "${category}":`, error);
    return [];
  }
}

// Function to set up real-time updates
export function setupDonationUpdates(
  callback: (donation: DonationData) => void,
): () => void {
  // Import the setupRealTimeUpdates function dynamically
  // to avoid circular dependencies
  let cleanupFunction: () => void = () => {};

  // Reduce the update interval for more frequent notifications (for demo purposes)
  const setupRealTimeUpdatesWithFrequency = (
    cb: (donation: DonationData) => void,
  ) => {
    import("./webScraper")
      .then(({ setupRealTimeUpdates }) => {
        cleanupFunction = setupRealTimeUpdates(cb);
      })
      .catch((error) => {
        console.error("Error importing setupRealTimeUpdates:", error);

        // Fallback implementation if import fails
        const interval = setInterval(() => {
          // Create a random donation update
          const mockStatuses: Array<"active" | "completed" | "urgent"> = [
            "active",
            "completed",
            "urgent",
          ];
          const mockDonation: DonationData = {
            id: `PH-DON-00${Math.floor(Math.random() * 6) + 1}`,
            title: "Donation Update",
            description: "This is a simulated donation update",
            category: "disaster",
            source: "Philippine Red Cross",
            sourceUrl: "https://redcross.org.ph/",
            organization: "Philippine Red Cross",
            contactInfo: "donations@redcross.org.ph",
            date: new Date().toISOString(),
            status:
              mockStatuses[Math.floor(Math.random() * mockStatuses.length)],
          };

          cb(mockDonation);
        }, 5000); // Update every 5 seconds for more real-time updates

        cleanupFunction = () => clearInterval(interval);
      });
  };

  // Listen for donation updates from other parts of the app
  const handleDonationUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<DonationData>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener("donation-update", handleDonationUpdate);
  window.addEventListener("new-donation", handleDonationUpdate);

  // Start the real-time updates
  setupRealTimeUpdatesWithFrequency(callback);

  // Return a cleanup function that will be called when the component unmounts
  return () => {
    cleanupFunction();
    window.removeEventListener("donation-update", handleDonationUpdate);
    window.removeEventListener("new-donation", handleDonationUpdate);
  };
}

// Function to manually refresh donation data
export async function refreshDonations(): Promise<DonationData[]> {
  try {
    const refreshedData = await refreshDonationData();

    // Also get user donations from local storage to include them in the refresh
    const userDonations = JSON.parse(
      localStorage.getItem("userDonations") || "[]",
    );

    // Combine both sources
    const allDonations = [...refreshedData, ...userDonations];

    console.log("API: Manually refreshed donation data", allDonations);
    return allDonations;
  } catch (error) {
    console.error("Error refreshing donation data:", error);
    return [];
  }
}

// Set up automatic refresh at shorter intervals (1 minute instead of daily for more real-time updates)
let refreshInterval: number | null = null;

export function setupFrequentRefresh(): void {
  if (refreshInterval) {
    // Clear existing interval if it exists
    clearInterval(refreshInterval);
  }

  // Set up new interval for refresh every 1 minute
  const oneMinuteInMs = 60 * 1000;
  refreshInterval = window.setInterval(async () => {
    console.log("Performing automatic refresh of donation data");
    await refreshDonations();
  }, oneMinuteInMs);

  // Also refresh immediately on setup
  refreshDonations();
}

// Set up automatic daily refresh
let dailyRefreshInterval: number | null = null;

export function setupDailyRefresh(): void {
  if (dailyRefreshInterval) {
    // Clear existing interval if it exists
    clearInterval(dailyRefreshInterval);
  }

  // Set up new interval for daily refresh (24 hours)
  // For testing purposes, we're setting it to 1 hour instead of 24 hours
  const refreshIntervalInMs = 60 * 60 * 1000; // 1 hour
  dailyRefreshInterval = window.setInterval(async () => {
    console.log("Performing daily refresh of donation data");
    const refreshedData = await refreshDonations();

    // Create notifications for new donations
    try {
      // Import the setupDonationUpdates function dynamically
      const { setupRealTimeUpdates } = await import("./webScraper");

      // Notify about each refreshed donation
      refreshedData.forEach((donation) => {
        // Create a notification for this donation
        const notificationEvent = new CustomEvent("donation-update", {
          detail: donation,
        });
        window.dispatchEvent(notificationEvent);
      });
    } catch (error) {
      console.error("Error creating notifications for refreshed data:", error);
    }
  }, refreshIntervalInMs);

  // Also refresh immediately on setup
  refreshDonations().then((refreshedData) => {
    // Create notifications for initial donations
    try {
      // Notify about each initial donation (limit to 2 for initial load)
      refreshedData.slice(0, 2).forEach((donation) => {
        // Create a notification for this donation
        const notificationEvent = new CustomEvent("donation-update", {
          detail: donation,
        });
        window.dispatchEvent(notificationEvent);
      });
    } catch (error) {
      console.error("Error creating notifications for initial data:", error);
    }
  });
}

// Function to update a user donation status
export async function updateUserDonationStatus(
  donationId: string,
  userId: string,
  newStatus: "active" | "urgent" | "completed",
): Promise<boolean> {
  try {
    // Get user donations from local storage
    const userDonations = JSON.parse(
      localStorage.getItem("userDonations") || "[]",
    );

    // Find the donation index
    const donationIndex = userDonations.findIndex(
      (donation: DonationData & { userId?: string }) =>
        donation.id === donationId && donation.userId === userId,
    );

    if (donationIndex === -1) {
      console.error(
        `Donation ${donationId} not found or not owned by user ${userId}`,
      );
      return false;
    }

    // Update the donation status
    userDonations[donationIndex].status = newStatus;

    // Save back to local storage
    localStorage.setItem("userDonations", JSON.stringify(userDonations));

    // Create a notification for the status update
    const notificationEvent = new CustomEvent("donation-update", {
      detail: userDonations[donationIndex],
    });
    window.dispatchEvent(notificationEvent);

    console.log(`API: Updated donation ${donationId} status to ${newStatus}`);
    return true;
  } catch (error) {
    console.error(`Error updating donation ${donationId} status:`, error);
    return false;
  }
}

// Clean up function to clear intervals
export function cleanupRefreshIntervals(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  if (dailyRefreshInterval) {
    clearInterval(dailyRefreshInterval);
    dailyRefreshInterval = null;
  }
}

// Function to submit a donation
export async function submitDonation(
  donationData: any,
): Promise<{ id: string }> {
  // In a real app, this would send the data to a server
  // For demo purposes, we'll just return the ID from the donation data
  return new Promise((resolve) => {
    setTimeout(() => {
      // Make sure userId is included if available
      if (!donationData.userId && localStorage.getItem("userId")) {
        donationData.userId = localStorage.getItem("userId");
      }

      // Debug log to check donation data before saving
      console.log("Submitting donation with data:", donationData);

      // Save to local storage if it's a user donation
      if (donationData.userId) {
        const userDonations = JSON.parse(
          localStorage.getItem("userDonations") || "[]",
        );
        userDonations.push(donationData);
        localStorage.setItem("userDonations", JSON.stringify(userDonations));

        // Debug log after saving
        console.log("Updated userDonations in localStorage:", userDonations);
      }

      // Broadcast the new donation to all users
      const donationEvent = new CustomEvent("new-donation", {
        detail: donationData,
      });
      window.dispatchEvent(donationEvent);

      resolve({
        id: donationData.id || `DON-${Date.now()}`,
      });
    }, 1000);
  });
}

// Interface for user needs/preferences
export interface UserNeedsPreferences {
  userId: string;
  categories: string[];
  locationScope: string;
  location?: { latitude: number; longitude: number };
  urgency?: "high" | "medium" | "low";
  maxDistance?: number; // in kilometers
}

// Interface for match result
export interface MatchResult {
  donationId: string;
  recipientId: string;
  score: number; // 0-100 score indicating match quality
  matchReason: string[];
}

// Function to find potential matches for a recipient
export async function findMatchesForRecipient(
  recipientNeeds: UserNeedsPreferences,
): Promise<MatchResult[]> {
  try {
    // Get donations based on location scope
    const availableDonations = await fetchDonationsByLocationScope(
      recipientNeeds.locationScope,
      recipientNeeds.location,
    );

    // Filter and score donations based on recipient needs
    const matches = availableDonations
      .map((donation) => {
        const matchReasons: string[] = [];
        let score = 0;

        // Category match (30 points)
        if (recipientNeeds.categories.includes(donation.category)) {
          score += 30;
          matchReasons.push(`Category match: ${donation.category}`);
        }

        // Status match - prioritize urgent donations for high urgency needs (25 points)
        if (recipientNeeds.urgency === "high" && donation.status === "urgent") {
          score += 25;
          matchReasons.push("Urgent donation matches high urgency need");
        }

        // Location proximity (up to 25 points)
        if (
          recipientNeeds.location &&
          donation.latitude &&
          donation.longitude
        ) {
          const distance = calculateDistance(
            recipientNeeds.location.latitude,
            recipientNeeds.location.longitude,
            donation.latitude,
            donation.longitude,
          );

          // Calculate distance score - closer is better
          const maxDistance = recipientNeeds.maxDistance || 50;
          if (distance <= maxDistance) {
            const distanceScore = Math.round(25 * (1 - distance / maxDistance));
            score += distanceScore;
            matchReasons.push(
              `Location proximity: ${Math.round(distance)}km away`,
            );
          }
        }

        // Recent donation bonus (up to 20 points)
        const donationDate = new Date(donation.date);
        const daysSinceDonation =
          (Date.now() - donationDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDonation <= 7) {
          const freshnessScore = Math.round(20 * (1 - daysSinceDonation / 7));
          score += freshnessScore;
          matchReasons.push("Recently listed donation");
        }

        return {
          donationId: donation.id,
          recipientId: recipientNeeds.userId,
          score,
          matchReason: matchReasons,
        };
      })
      .filter((match) => match.score > 30) // Only include matches with a score above 30
      .sort((a, b) => b.score - a.score); // Sort by score descending

    return matches;
  } catch (error) {
    console.error("Error finding matches for recipient:", error);
    return [];
  }
}

// Function to find potential recipients for a donation
export async function findRecipientsForDonation(
  donationId: string,
  userPreferences: UserNeedsPreferences[], // Array of recipient preferences
): Promise<MatchResult[]> {
  try {
    // Get the donation details
    const donation = await fetchDonationById(donationId);
    if (!donation) return [];

    // Match with recipients based on their preferences
    const matches = userPreferences
      .map((recipient) => {
        const matchReasons: string[] = [];
        let score = 0;

        // Category match (30 points)
        if (recipient.categories.includes(donation.category)) {
          score += 30;
          matchReasons.push(`Category match: ${donation.category}`);
        }

        // Status match - prioritize urgent donations for high urgency needs (25 points)
        if (recipient.urgency === "high" && donation.status === "urgent") {
          score += 25;
          matchReasons.push("Urgent donation matches high urgency need");
        }

        // Location proximity (up to 25 points)
        if (recipient.location && donation.latitude && donation.longitude) {
          const distance = calculateDistance(
            recipient.location.latitude,
            recipient.location.longitude,
            donation.latitude,
            donation.longitude,
          );

          // Calculate distance score - closer is better
          const maxDistance = recipient.maxDistance || 50;
          if (distance <= maxDistance) {
            const distanceScore = Math.round(25 * (1 - distance / maxDistance));
            score += distanceScore;
            matchReasons.push(
              `Location proximity: ${Math.round(distance)}km away`,
            );
          }
        }

        return {
          donationId: donation.id,
          recipientId: recipient.userId,
          score,
          matchReason: matchReasons,
        };
      })
      .filter((match) => match.score > 30) // Only include matches with a score above 30
      .sort((a, b) => b.score - a.score); // Sort by score descending

    return matches;
  } catch (error) {
    console.error("Error finding recipients for donation:", error);
    return [];
  }
}

// Function to fetch donations based on location scope
export async function fetchDonationsByLocationScope(
  locationScope: string,
  userLocation?: { latitude?: number; longitude?: number },
): Promise<DonationData[]> {
  try {
    const allDonations = await fetchDonations();

    // Filter based on location scope
    if (locationScope === "community" && userLocation) {
      // For community scope, filter donations within ~50km radius (if coordinates available)
      return allDonations.filter((donation) => {
        // If donation has coordinates, calculate distance
        if (
          donation.latitude &&
          donation.longitude &&
          userLocation.latitude &&
          userLocation.longitude
        ) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            donation.latitude,
            donation.longitude,
          );
          return distance <= 50; // 50km radius
        }
        return true; // Include if no coordinates (can't determine distance)
      });
    } else if (locationScope === "country") {
      // For country scope, we would ideally filter by country
      // For demo purposes, return all donations
      return allDonations;
    } else {
      // For worldwide scope, return all donations
      return allDonations;
    }
  } catch (error) {
    console.error(
      `Error fetching donations by location scope ${locationScope}:`,
      error,
    );
    return [];
  }
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
