import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Upload, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  category: z.string({
    required_error: "Please select a category",
  }),
  condition: z.string({
    required_error: "Please select the condition",
  }),
  deliveryMethod: z.string({
    required_error: "Please select a delivery method",
  }),
  location: z.string({
    required_error: "Location is required",
  }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationScope: z.enum(["community", "country", "worldwide"], {
    required_error: "Please select the location scope",
  }),
  type: z.enum(["donation", "request"]).default("donation"),
});

type FormValues = z.infer<typeof formSchema>;

interface DonationFormProps {
  onSubmit?: (values: FormValues) => void;
}

const DonationForm = ({ onSubmit = () => {} }: DonationFormProps) => {
  const [images, setImages] = useState<string[]>([]);

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      condition: "",
      deliveryMethod: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
      locationScope: "community",
      type: "donation",
    },
  });

  // Function to get user's current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        },
      );

      const { latitude, longitude } = position.coords;

      // Use reverse geocoding to get address from coordinates
      // In a real app, you would use a service like Google Maps API or Mapbox
      // For demo purposes, we'll just set the coordinates
      form.setValue("latitude", latitude);
      form.setValue("longitude", longitude);

      // Simulate getting address from coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      );
      const data = await response.json();

      if (data && data.display_name) {
        form.setValue("location", data.display_name);
      } else {
        form.setValue(
          "location",
          `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        );
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationError(
        "Unable to retrieve your location. Please enter it manually.",
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      // Import the API function dynamically to avoid circular dependencies
      const { submitDonation } = await import("@/lib/api");

      // Generate a unique ID for the donation
      const donationId = `USER-DON-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Prepare the donation data
      const donationData = {
        ...values,
        images: images,
        id: donationId,
        date: new Date().toLocaleDateString(),
        status: isUrgent ? "urgent" : "active",
        source: "User Donation",
        sourceUrl: window.location.origin,
        organization: localStorage.getItem("userName") || "Anonymous User",
        contactInfo:
          localStorage.getItem("userPhone") ||
          localStorage.getItem("userEmail") ||
          "No contact info provided",
        userId: localStorage.getItem("userId") || undefined,
        donorId: localStorage.getItem("userId") || undefined,
        type: values.type || "donation",
      };

      // Save to local storage - ensure we're adding the userId
      const existingDonations = JSON.parse(
        localStorage.getItem("userDonations") || "[]",
      );

      // Make sure userId is included
      if (!donationData.userId && localStorage.getItem("userId")) {
        donationData.userId = localStorage.getItem("userId");
      }

      existingDonations.push(donationData);
      localStorage.setItem("userDonations", JSON.stringify(existingDonations));

      // Submit the donation via the API
      const result = await submitDonation(donationData);
      console.log("Donation submitted successfully:", result);

      // Call the onSubmit callback with the values
      onSubmit({ ...values });

      // Create a donation update event
      const donationEvent = new CustomEvent("donation-update", {
        detail: donationData,
      });
      window.dispatchEvent(donationEvent);

      // Show success message
      alert(
        `Donation "${values.title}" has been successfully listed!\nDonation ID: ${donationId}`,
      );

      // Reset the form
      form.reset();
      setImages([]);
    } catch (error) {
      console.error("Error submitting donation:", error);
      alert("There was an error submitting your donation. Please try again.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real app, we would upload to storage and get URLs
      // For demo purposes, we'll create object URLs
      const newImages = Array.from(e.target.files).map((file) =>
        URL.createObjectURL(file),
      );
      setImages([...images, ...newImages]);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white shadow-md sm:rounded-lg rounded-none">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Donate an Item</CardTitle>
        <CardDescription>
          Fill out this form to list your donation. The more details you
          provide, the easier it will be to match with recipients.
        </CardDescription>
        <div className="flex items-center mt-2">
          <Checkbox checked={isUrgent} onCheckedChange={setIsUrgent} id="urgent-checkbox" />
          <label htmlFor="urgent-checkbox" className="ml-2 text-sm">Mark as Urgent</label>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="donation" />
                      </FormControl>
                      <FormLabel>I'm Donating</FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <RadioGroupItem value="request" />
                      </FormControl>
                      <FormLabel>I Need This</FormLabel>
                    </FormItem>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Winter Coat, Children's Books, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about your donation (size, color, age, etc.)"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Photos</FormLabel>
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-md overflow-hidden border"
                  >
                    <img
                      src={img}
                      alt={`Donation ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">
                    Add Photo
                  </span>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    multiple
                  />
                </label>
              </div>
              <FormDescription>
                Upload up to 5 photos of your donation.
              </FormDescription>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="toys">Toys & Games</SelectItem>
                        <SelectItem value="books">Books</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="likeNew">Like New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deliveryMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Delivery Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="pickup" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Recipient Pickup
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dropoff" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          I'll Deliver
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="either" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Either Option Works
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            placeholder="City, Neighborhood, or Zip Code"
                            {...field}
                            className="pr-10"
                          />
                          {isLocating ? (
                            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <MapPin
                              className="absolute right-3 top-3 h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                              onClick={getCurrentLocation}
                            />
                          )}
                        </div>
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={getCurrentLocation}
                        disabled={isLocating}
                      >
                        {isLocating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {locationError && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {locationError}
                      </p>
                    )}
                    <FormDescription>
                      This helps us match your donation with nearby recipients.
                      Click the location icon to use your current location.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationScope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability Scope</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select availability scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="community">
                          Within Community
                        </SelectItem>
                        <SelectItem value="country">Nationwide</SelectItem>
                        <SelectItem value="worldwide">Worldwide</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define how widely your donation can be distributed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Submitting..." : "List Donation"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DonationForm;
