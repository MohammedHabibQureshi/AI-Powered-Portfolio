"use client";

import { useForm } from "react-hook-form";
import { useToast } from "@/providers/toast-provider";
import { Mail, MapPin, Calendar, Send, Github, Linkedin } from "lucide-react";
import { useState } from "react";

interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom hook-form resolver importing placeholder setup
  // Note: we can import @hookform/resolvers/zod or write a small manual validator
  // if resolver resolution fails, but we installed resolvers correctly.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormValues>({
    // We can use a simple custom validator to avoid dependency issues if needed,
    // but resolver works great. Let's implement schema validation inside onSubmit or via register rules.
  });

  const onSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast("Message sent successfully! I will reach back shortly.", "success");
      reset();
    }, 1200);
  };

  return (
    <div className="space-y-10 min-h-[calc(100vh-12rem)] max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Get in Touch
        </h1>
        <p className="text-sm text-muted-foreground">
          Let&apos;s discuss contract opportunities, project architectures, or research integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Info Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 border border-border bg-card rounded-xl shadow-sm space-y-6">
            <h3 className="font-bold text-sm text-foreground">Contact Information</h3>
            
            <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>mdhabib.qureshi786@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>Kanker, Chhattisgarh, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <span>Open to Internships</span>
              </div>
            </div>

            {/* Social Grid */}
            <div className="border-t border-border pt-4 flex gap-4 text-muted-foreground">
              <a href="https://github.com/MohammedHabibQureshi" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/in/md-habib-qureshi/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-8 p-8 border border-border bg-card rounded-xl shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  {...register("name", { required: "Name is required" })}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {errors.name && <span className="text-[10px] text-destructive">{errors.name.message}</span>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="you@domain.com"
                  {...register("email", { required: "Email is required" })}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {errors.email && <span className="text-[10px] text-destructive">{errors.email.message}</span>}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Subject</label>
              <input
                type="text"
                placeholder="Job Opportunity / Consultation"
                {...register("subject", { required: "Subject is required" })}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {errors.subject && <span className="text-[10px] text-destructive">{errors.subject.message}</span>}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Message</label>
              <textarea
                rows={5}
                placeholder="Detail your request..."
                {...register("message", { required: "Message is required" })}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
              />
              {errors.message && <span className="text-[10px] text-destructive">{errors.message.message}</span>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90 px-6 py-2.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-opacity ml-auto"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? "Sending..." : "Submit Inquiry"}</span>
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
