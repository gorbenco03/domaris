import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Home, Users } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Browse Listings",
    description: "Search through hundreds of verified rental properties in your desired location.",
  },
  {
    icon: FileText,
    title: "Apply Online",
    description: "Submit your application and required documents securely through our platform.",
  },
  {
    icon: Users,
    title: "Connect with Landlords",
    description: "Communicate directly with property owners to schedule viewings and ask questions.",
  },
  {
    icon: Home,
    title: "Move In",
    description: "Complete the rental agreement and move into your new home hassle-free.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Finding your perfect rental property has never been easier
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="text-center hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
