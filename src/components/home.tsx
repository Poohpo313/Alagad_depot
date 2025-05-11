import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchDonations, DonationData } from "@/lib/api";
import FilipinoDonationCard from "./FilipinoDonationCard";
import DonationDetailModal from "./DonationDetailModal";

const Home = () => {
  const navigate = useNavigate();
  const [featuredDonations, setFeaturedDonations] = useState<DonationData[]>(
    [],
  );
  const [urgentDonations, setUrgentDonations] = useState<DonationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadDonations = async () => {
      try {
        setIsLoading(true);
        const donations = await fetchDonations();

        // Filter for featured (active) and urgent donations
        const featured = donations
          .filter((d) => d.status === "active")
          .slice(0, 3);
        const urgent = donations.filter((d) => d.status === "urgent");

        setFeaturedDonations(featured);
        setUrgentDonations(urgent);
      } catch (error) {
        console.error("Error loading donations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDonations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleDonationClick = (id: string) => {
    setSelectedDonationId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Connect Donations with Those in Need
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Alagad Depot makes it easy to donate items to Filipino
                  communities in need. List your donations or find items that
                  can help your organization.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button onClick={() => navigate("/donate")} size="lg">
                  Start Donating
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                  size="lg"
                >
                  Browse Donations
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1593113630400-ea4288922497?w=800&q=80"
                alt="People helping each other"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-muted/50 rounded-lg">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Find Donations
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Search for specific items or browse by category
              </p>
            </div>
            <div className="w-full max-w-md">
              <form
                onSubmit={handleSearch}
                className="flex w-full max-w-md items-center space-x-2"
              >
                <Input
                  type="text"
                  placeholder="Search donations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Donations */}
      <section className="py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-start space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
                Featured Donations
              </h2>
              <p className="max-w-[600px] text-muted-foreground">
                Recent donations that need your support
              </p>
            </div>
            {isLoading ? (
              <div className="w-full py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : featuredDonations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {featuredDonations.map((donation, index) => (
                  <motion.div
                    key={donation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <FilipinoDonationCard
                      donation={donation}
                      onClick={() => handleDonationClick(donation.id)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="w-full py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium">
                  No featured donations
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back later for new donations
                </p>
              </div>
            )}
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="mt-4"
            >
              View All Donations
            </Button>
          </div>
        </div>
      </section>

      {/* Urgent Needs */}
      <section className="py-12 bg-muted/30 rounded-lg">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-start space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
                Urgent Needs
              </h2>
              <p className="max-w-[600px] text-muted-foreground">
                These donations require immediate attention
              </p>
            </div>
            {isLoading ? (
              <div className="w-full py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : urgentDonations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {urgentDonations.map((donation, index) => (
                  <motion.div
                    key={donation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <FilipinoDonationCard
                      donation={donation}
                      onClick={() => handleDonationClick(donation.id)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="w-full py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium">
                  No urgent donations
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back later for urgent needs
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                How It Works
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Simple steps to make a difference
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
              <div className="flex flex-col items-center space-y-2 p-4 rounded-lg border bg-card text-card-foreground shadow">
                <div className="p-2 bg-primary/10 rounded-full">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-bold">List Your Donation</h3>
                <p className="text-muted-foreground text-sm text-center">
                  Fill out a simple form with details about the items you want
                  to donate
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 rounded-lg border bg-card text-card-foreground shadow">
                <div className="p-2 bg-primary/10 rounded-full">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-bold">Get Matched</h3>
                <p className="text-muted-foreground text-sm text-center">
                  Our system connects your donation with recipients who need
                  those items
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 rounded-lg border bg-card text-card-foreground shadow">
                <div className="p-2 bg-primary/10 rounded-full">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-bold">Complete the Donation</h3>
                <p className="text-muted-foreground text-sm text-center">
                  Arrange pickup or delivery and track your donation until
                  completion
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/donate")} className="mt-4">
              Start Donating Now
            </Button>
          </div>
        </div>
      </section>

      {/* Donation Detail Modal */}
      <DonationDetailModal
        donationId={selectedDonationId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Home;
