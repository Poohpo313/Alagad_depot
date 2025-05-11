// Web scraper utility for extracting donation information from Filipino websites

export interface ScrapedDonation {
  id: string;
  title: string;
  description: string;
  category: string;
  source: string;
  sourceUrl: string;
  organization: string;
  contactInfo: string;
  donationLink?: string;
  imageUrl?: string;
  date: string;
  status: "active" | "completed" | "urgent";
}

// Mock data for Filipino donation campaigns
// In a real implementation, this would be replaced with actual web scraping logic
const mockFilipinoDonations: ScrapedDonation[] = [
  {
    id: "PH-DON-001",
    title: "Typhoon Relief for Bicol Region",
    description:
      "Support families affected by the recent typhoon in Bicol Region. Donations will provide food, clean water, and temporary shelter.",
    category: "disaster",
    source: "Philippine Red Cross",
    sourceUrl: "https://redcross.org.ph/",
    organization: "Philippine Red Cross",
    contactInfo: "donations@redcross.org.ph | (02) 8790-2300",
    donationLink: "https://redcross.org.ph/donate/",
    imageUrl:
      "https://images.unsplash.com/photo-1603915402670-1283f2e4d8a7?w=500&q=80",
    date: "Aug 15, 2023",
    status: "active",
  },
  {
    id: "PH-DON-002",
    title: "School Supplies for Children in Mindanao",
    description:
      "Help provide school supplies for underprivileged children in remote areas of Mindanao to support their education.",
    category: "education",
    source: "DepEd Brigada Eskwela",
    sourceUrl: "https://www.deped.gov.ph/",
    organization: "Department of Education",
    contactInfo: "brigada.eskwela@deped.gov.ph | (02) 8636-1663",
    donationLink: "https://www.deped.gov.ph/brigada-eskwela/",
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=80",
    date: "Jun 5, 2023",
    status: "active",
  },
  {
    id: "PH-DON-003",
    title: "Medical Mission in Palawan",
    description:
      "Support a medical mission providing free healthcare services to indigenous communities in Palawan.",
    category: "healthcare",
    source: "Philippine Medical Association",
    sourceUrl: "https://www.philippinemedicalassociation.org/",
    organization: "Philippine Medical Association",
    contactInfo: "info@philippinemedicalassociation.org | (02) 8635-0247",
    donationLink: "https://www.philippinemedicalassociation.org/donate/",
    imageUrl:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=500&q=80",
    date: "Jul 20, 2023",
    status: "urgent",
  },
  {
    id: "PH-DON-004",
    title: "Food Bank for Manila's Urban Poor",
    description:
      "Help stock a food bank serving Manila's urban poor communities with nutritious meals and essential groceries.",
    category: "food",
    source: "Caritas Manila",
    sourceUrl: "https://caritasmanila.org.ph/",
    organization: "Caritas Manila",
    contactInfo: "admin@caritasmanila.org.ph | (02) 8562-0020",
    donationLink: "https://caritasmanila.org.ph/donate-now/",
    imageUrl:
      "https://images.unsplash.com/photo-1593113630400-ea4288922497?w=500&q=80",
    date: "Aug 2, 2023",
    status: "active",
  },
  {
    id: "PH-DON-005",
    title: "Rebuilding Homes in Marawi",
    description:
      "Support the ongoing efforts to rebuild homes for displaced families in Marawi City following the conflict.",
    category: "housing",
    source: "Habitat for Humanity Philippines",
    sourceUrl: "https://habitat.org.ph/",
    organization: "Habitat for Humanity Philippines",
    contactInfo: "info@habitat.org.ph | (02) 8846-2177",
    donationLink: "https://habitat.org.ph/donate/",
    imageUrl:
      "https://images.unsplash.com/photo-1518707399486-6d702a30c48a?w=500&q=80",
    date: "May 15, 2023",
    status: "active",
  },
  {
    id: "PH-DON-006",
    title: "Emergency Response for Taal Volcano Evacuees",
    description:
      "Provide emergency supplies and support for families evacuated due to Taal Volcano activity.",
    category: "disaster",
    source: "DSWD",
    sourceUrl: "https://www.dswd.gov.ph/",
    organization: "Department of Social Welfare and Development",
    contactInfo: "inquiry@dswd.gov.ph | (02) 8931-8101",
    donationLink: "https://www.dswd.gov.ph/donations",
    imageUrl:
      "https://images.unsplash.com/photo-1580974852861-c381510bc98e?w=500&q=80",
    date: "Aug 10, 2023",
    status: "urgent",
  },
];

// Cache for storing scraped data with timestamp
let scrapedDataCache: {
  data: ScrapedDonation[];
  timestamp: number;
} | null = null;

// Function to check if cache is valid (less than 24 hours old)
function isCacheValid(): boolean {
  if (!scrapedDataCache) return false;

  const now = Date.now();
  const cacheAge = now - scrapedDataCache.timestamp;
  const oneDayInMs = 24 * 60 * 60 * 1000;

  return cacheAge < oneDayInMs;
}

// Function to scrape donation data from Filipino websites
async function scrapeRealDonations(): Promise<ScrapedDonation[]> {
  try {
    // In a real implementation, this would use a web scraping library like Cheerio or Puppeteer
    // to extract data from actual Philippine donation websites

    // Example websites that could be scraped:
    // - Philippine Red Cross: https://redcross.org.ph/
    // - DSWD: https://www.dswd.gov.ph/
    // - Caritas Manila: https://caritasmanila.org.ph/
    // - Habitat for Humanity Philippines: https://habitat.org.ph/
    // - UNICEF Philippines: https://www.unicef.org/philippines/

    // For now, we'll simulate a network delay and return mock data
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real implementation, we would transform the scraped HTML into our ScrapedDonation format
    return mockFilipinoDonations;
  } catch (error) {
    console.error("Error scraping donation data:", error);
    return [];
  }
}

// Function to fetch donation data from Filipino websites with caching
export async function scrapeDonations(): Promise<ScrapedDonation[]> {
  // Check if we have valid cached data
  if (isCacheValid() && scrapedDataCache) {
    console.log("Using cached donation data");
    return scrapedDataCache.data;
  }

  // If cache is invalid or doesn't exist, scrape new data
  console.log("Scraping fresh donation data");
  const freshData = await scrapeRealDonations();

  // Update cache with new data and timestamp
  scrapedDataCache = {
    data: freshData,
    timestamp: Date.now(),
  };

  return freshData;
}

// Function to fetch a single donation by ID
export async function scrapeDonationById(
  id: string,
): Promise<ScrapedDonation | null> {
  // Try to get data from cache first
  if (isCacheValid() && scrapedDataCache) {
    const donation = scrapedDataCache.data.find((d) => d.id === id);
    if (donation) return donation;
  }

  // If not in cache or cache invalid, get fresh data
  const donations = await scrapeDonations();
  return donations.find((d) => d.id === id) || null;
}

// Function to search for donations by keyword
export async function searchDonations(
  keyword: string,
): Promise<ScrapedDonation[]> {
  const donations = await scrapeDonations();

  // Filter donations by keyword in title, description or organization
  return donations.filter(
    (donation) =>
      donation.title.toLowerCase().includes(keyword.toLowerCase()) ||
      donation.description.toLowerCase().includes(keyword.toLowerCase()) ||
      donation.organization.toLowerCase().includes(keyword.toLowerCase()),
  );
}

// Function to get donations by category
export async function getDonationsByCategory(
  category: string,
): Promise<ScrapedDonation[]> {
  const donations = await scrapeDonations();

  // Filter donations by category
  return donations.filter((donation) => donation.category === category);
}

// Function to set up real-time updates (simulated)
export function setupRealTimeUpdates(
  callback: (donation: ScrapedDonation) => void,
): () => void {
  // In a real implementation, this would set up WebSocket or SSE connections
  // For now, we'll simulate real-time updates with setInterval

  const interval = setInterval(() => {
    // Randomly select a donation to update
    if (!scrapedDataCache || !scrapedDataCache.data.length) return;

    const randomIndex = Math.floor(
      Math.random() * scrapedDataCache.data.length,
    );
    const updatedDonation = { ...scrapedDataCache.data[randomIndex] };

    // Simulate a status change or update
    const statusOptions: ScrapedDonation["status"][] = [
      "active",
      "completed",
      "urgent",
    ];
    updatedDonation.status =
      statusOptions[Math.floor(Math.random() * statusOptions.length)];

    // Call the callback with the updated donation
    callback(updatedDonation);
  }, 30000); // Update every 30 seconds

  // Return a cleanup function
  return () => clearInterval(interval);
}

// Function to force refresh the donation data cache
export async function refreshDonationData(): Promise<ScrapedDonation[]> {
  // Clear the cache
  scrapedDataCache = null;

  // Fetch fresh data
  return await scrapeDonations();
}
