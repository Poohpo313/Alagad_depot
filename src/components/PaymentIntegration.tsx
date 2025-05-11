import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Wallet, Smartphone, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { DonationData } from "@/lib/api";

interface PaymentIntegrationProps {
  donation: DonationData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PaymentIntegration = ({
  donation,
  onSuccess = () => {},
  onCancel = () => {},
}: PaymentIntegrationProps) => {
  // Automatically scroll to the payment form when it's shown
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  const [paymentMethod, setPaymentMethod] = useState<string>("gcash");
  const [amount, setAmount] = useState<string>("500");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real implementation, this would call an API to process the payment
      // For now, we'll simulate a successful payment

      setIsSuccess(true);
      toast({
        title: "Payment Successful",
        description: `You have successfully donated ₱${amount} to ${donation.organization}`,
        variant: "default",
      });

      // Notify parent component of success
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description:
          "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDonateNow = () => {
    // Navigate directly to the contact section of the donation link
    if (donation.donationLink) {
      const contactUrl = `${donation.donationLink}#contact`;
      window.open(contactUrl, "_blank");
    }
  };

  const predefinedAmounts = ["100", "500", "1000", "5000"];

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md mx-auto bg-white shadow-md">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Thank You!</h2>
            <p className="text-center text-muted-foreground mb-4">
              Your donation of ₱{amount} to {donation.organization} has been
              processed successfully.
            </p>
            <p className="text-sm text-center text-muted-foreground">
              A confirmation has been sent to your email. Your generosity makes
              a difference!
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={onSuccess}>
              Return to Donations
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md mx-auto bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Make a Donation</CardTitle>
          <CardDescription>
            Support {donation.organization} with your contribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="amount">Donation Amount (PHP)</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {predefinedAmounts.map((presetAmount) => (
                  <Button
                    key={presetAmount}
                    type="button"
                    variant={amount === presetAmount ? "default" : "outline"}
                    onClick={() => setAmount(presetAmount)}
                    className="h-10"
                  >
                    ₱{presetAmount}
                  </Button>
                ))}
              </div>
              <div className="mt-2">
                <Input
                  id="amount"
                  placeholder="Other amount"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Payment Method</Label>
              <Tabs
                defaultValue="gcash"
                className="mt-2"
                onValueChange={setPaymentMethod}
                value={paymentMethod}
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="gcash">
                    <Smartphone className="h-4 w-4 mr-2" /> GCash
                  </TabsTrigger>
                  <TabsTrigger value="paymaya">
                    <Wallet className="h-4 w-4 mr-2" /> PayMaya
                  </TabsTrigger>
                  <TabsTrigger value="card">
                    <CreditCard className="h-4 w-4 mr-2" /> Card
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="gcash" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="gcash-number">GCash Number</Label>
                    <Input
                      id="gcash-number"
                      placeholder="09XX XXX XXXX"
                      maxLength={11}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="paymaya" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymaya-number">PayMaya Account</Label>
                    <Input
                      id="paymaya-number"
                      placeholder="09XX XXX XXXX or email"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="card" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      placeholder="XXXX XXXX XXXX XXXX"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input id="expiry" placeholder="MM/YY" maxLength={5} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" placeholder="XXX" maxLength={3} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Donation Frequency</Label>
              <RadioGroup defaultValue="one-time" className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="one-time" id="one-time" />
                  <Label htmlFor="one-time">One-time donation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Monthly donation</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDonateNow}
            >
              Donate Now
            </Button>
            <Button
              className="flex-1"
              onClick={handlePayment}
              disabled={isProcessing || !amount || parseInt(amount) <= 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Donate ₱{amount}</>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PaymentIntegration;
