import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { features } from '@/lib/featureFlags';
import {
  MessageSquare,
  Camera,
  Brain,
  Edit3,
  Share2,
  Zap,
  BookOpen,
  FileText,
  Wifi,
  CheckCircle2,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Mic,
  Send
} from 'lucide-react';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const navigate = useNavigate();

  // Simulate loading stats
  useEffect(() => {
    const timer = setTimeout(() => setStatsLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PWAInstallPrompt />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/otoqoute logo.png"
                alt="OtoQuote AI Logo"
                className="h-8 w-auto sm:h-10"
                loading="eager"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <a href="#features" className="text-sm font-medium text-[#0056D2] hover:text-[#F58220] transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-[#0056D2] hover:text-[#F58220] transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm font-medium text-[#0056D2] hover:text-[#F58220] transition-colors">
                Pricing
              </a>
              <Button
                className="bg-[#0056D2] hover:bg-[#0056D2]/90 text-white font-semibold shadow-md"
                aria-label="Get Started with OtoQuote AI"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-[#0056D2] hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <a
                href="#features"
                className="block py-2 text-base font-medium text-[#0056D2] hover:text-[#F58220] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block py-2 text-base font-medium text-[#0056D2] hover:text-[#F58220] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="block py-2 text-base font-medium text-[#0056D2] hover:text-[#F58220] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <Button
                className="w-full bg-[#0056D2] hover:bg-[#0056D2]/90 text-white font-semibold shadow-md"
                aria-label="Get Started with OtoQuote AI"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-24">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            src="/Building_transformation_video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-white/70 lg:bg-transparent lg:bg-gradient-to-r lg:from-white/95 lg:via-white/60 lg:to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#0056D2] leading-tight animate-in fade-in slide-in-from-bottom-4 duration-500">
                Generate Professional Quotes in Minutes — Just Use Your Voice
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                Built for Nigerian Electricians, Plumbers, and Builders. Turn site photos and voice notes into branded PDFs instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Button
                  size="lg"
                  className="bg-[#0056D2] hover:bg-[#0056D2]/90 text-white font-bold text-base sm:text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-200"
                  aria-label="Start Your First Quote Free"
                  onClick={() => navigate('/auth')}
                >
                  Start Your First Quote Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-[#0056D2] text-[#0056D2] hover:bg-[#0056D2] hover:text-white font-semibold text-base sm:text-lg px-8 py-6 transition-all duration-200"
                  aria-label="Watch Demo"
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Watch Demo
                </Button>
              </div>
              {/* Trust Badge */}
              <div className="flex items-center justify-center lg:justify-start gap-2 pt-4">
                <CheckCircle2 className="text-[#009A44]" size={20} />
                <span className="text-sm text-gray-600">No credit card required • Free trial</span>
              </div>
            </div>

            {/* Right Content - Mobile Mockup - Updated to match screenshot */}
            <div className="relative mx-auto max-w-sm lg:max-w-none animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
              <div className="relative aspect-[9/19] w-full max-w-[280px] sm:max-w-[320px] mx-auto bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl hover:scale-105 transition-transform duration-300">
                {/* Phone Screen */}
                <div className="h-full w-full bg-white rounded-[2rem] overflow-hidden flex flex-col">
                  {/* Status Bar */}
                  <div className="bg-[#0056D2] h-8 flex items-center justify-between px-4 text-white text-xs shrink-0">
                    <span>9:41</span>
                    <span>●●●●</span>
                  </div>

                  {/* Chat Area (Scrollable) */}
                  <div className="flex-1 overflow-y-auto bg-[#F8F9FA] px-3 py-4 space-y-4">
                    {/* AI Welcome Message */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-none px-4 py-2 max-w-[85%] shadow-sm">
                        <p className="text-sm text-gray-800">Hi! Tell me about your project or upload site photos.</p>
                      </div>
                    </div>

                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="bg-[#F58220] rounded-2xl rounded-tr-none px-4 py-2 max-w-[85%] shadow-sm">
                        <div className="bg-white/20 rounded-lg h-12 mb-2 flex items-center justify-center">
                          <Camera className="text-white" size={20} />
                        </div>
                        <p className="text-sm text-white">Wire 3 bedroom flat in Lekki with 15 sockets and 10 lights</p>
                      </div>
                    </div>

                    {/* AI Message: Draft Quote Header */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-none px-4 py-2 max-w-[85%] shadow-sm">
                        <p className="text-sm text-gray-800">I've generated a draft quote based on your requirements. You can review and edit it in the preview panel.</p>
                      </div>
                    </div>

                    {/* Detailed Quote Card - Matching Screenshot */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-none p-4 max-w-[95%] shadow-md border-l-4 border-[#009A44] w-full">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-bold text-gray-900">Generated Draft</h3>
                          <Badge className="bg-[#009A44] text-white text-[10px] px-2 py-0.5">Quote Ready</Badge>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 mb-3">Electrical Wiring Installation for 3-Bedroom Flat</p>

                        {/* Materials List */}
                        <div className="space-y-2 text-sm">
                          {/* 16mm Cable */}
                          <div className="flex flex-col border-b border-gray-100 pb-2">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-800 text-xs">16mm Single Core Cable (for AC/Cooker points)</span>
                              <span className="font-semibold text-gray-900 text-xs">₦54,000</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>30 meters</span>
                              <span>₦1,800 / meter</span>
                            </div>
                          </div>
                          {/* 6mm Cable */}
                          <div className="flex flex-col border-b border-gray-100 pb-2">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-800 text-xs">6mm Single Core Cable (for Socket rings/Water Heater)</span>
                              <span className="font-semibold text-gray-900 text-xs">₦85,000</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>100 meters</span>
                              <span>₦850 / meter</span>
                            </div>
                          </div>
                          {/* 2.5mm Cable */}
                          <div className="flex flex-col border-b border-gray-100 pb-2">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-800 text-xs">2.5mm Single Core Cable (for Lighting circuits)</span>
                              <span className="font-semibold text-gray-900 text-xs">₦100,000</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>200 meters</span>
                              <span>₦500 / meter</span>
                            </div>
                          </div>
                          {/* 1.5mm Cable */}
                          <div className="flex flex-col border-b border-gray-100 pb-2">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-800 text-xs">1.5mm Single Core Cable (for Switch drops)</span>
                              <span className="font-semibold text-gray-900 text-xs">₦35,000</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>100 meters</span>
                              <span>₦250 / meter</span>
                            </div>
                          </div>
                          {/* Consumer Unit */}
                          <div className="flex flex-col border-b border-gray-100 pb-2">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-800 text-xs">12-Way Consumer Unit</span>
                              <span className="font-semibold text-gray-900 text-xs">₦45,000</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500">
                              <span>1 piece</span>
                              <span>₦45,000 / piece</span>
                            </div>
                          </div>
                          {/* Accordant Ministration */}
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="font-medium text-gray-800 text-xs">Accordant Ministration (Criminal Records)</span>
                            <span className="font-semibold text-gray-900 text-xs">₦25,000</span>
                          </div>
                        </div>

                        {/* Grand Total */}
                        <div className="mt-3 pt-2 border-t-2 border-gray-200 flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-900">Grand Total</span>
                          <span className="text-lg font-bold text-[#0056D2]">₦852,600</span>
                        </div>

                        {/* Disclaimer */}
                        <p className="text-[9px] text-gray-400 mt-3 text-center">OtoQuote AI can make mistakes. Check important info.</p>
                      </div>
                    </div>
                  </div>

                  {/* Message Input Area */}
                  <div className="border-t border-gray-200 bg-white p-2 shrink-0">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                      <MessageSquare size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-400 flex-1">Message OtoQuote AI...</span>
                      <Mic size={16} className="text-[#F58220]" />
                      <Send size={16} className="text-[#0056D2]" />
                    </div>
                  </div>

                  {/* Bottom Navigation */}
                  <div className="border-t border-gray-200 bg-white flex justify-around items-center py-2 text-[10px] text-gray-500 shrink-0">
                    <div className="flex flex-col items-center text-[#0056D2]">
                      <MessageSquare size={18} className="mb-0.5" />
                      <span>Chat</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <FileText size={18} className="mb-0.5" />
                      <span>Quotes</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <BookOpen size={18} className="mb-0.5" />
                      <span>Price Log</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Zap size={18} className="mb-0.5" />
                      <span>Brand</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-gray-300 mb-0.5"></div>
                      <span>Profile</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 5-Minute Quote Workflow */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0056D2]">
              The 5-Minute Quote Workflow
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              From site visit to client approval in just four simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {/* Step 1 */}
            <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-[#F58220] transition-all duration-300 hover:shadow-lg hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#F58220] text-white flex items-center justify-center font-bold text-lg">
                1
              </div>
              <CardContent className="pt-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-[#F58220]/10 flex items-center justify-center">
                  <Camera className="text-[#F58220]" size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Upload or Speak</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Upload site photos or hold to record a voice note in the chat. Describe the job naturally.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-[#0056D2] transition-all duration-300 hover:shadow-lg hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#0056D2] text-white flex items-center justify-center font-bold text-lg">
                2
              </div>
              <CardContent className="pt-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-[#0056D2]/10 flex items-center justify-center">
                  <Brain className="text-[#0056D2]" size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">AI Analysis</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  AI identifies materials (2.5mm cables, cement bags, iron rods) and local labor rates automatically.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-[#009A44] transition-all duration-300 hover:shadow-lg hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#009A44] text-white flex items-center justify-center font-bold text-lg">
                3
              </div>
              <CardContent className="pt-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-[#009A44]/10 flex items-center justify-center">
                  <Edit3 className="text-[#009A44]" size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Edit & Refine</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Edit your quote using your personal Price Log. Adjust quantities and prices as needed.
                </p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="relative overflow-hidden border-2 border-gray-200 hover:border-[#F58220] transition-all duration-300 hover:shadow-lg hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#F58220] text-white flex items-center justify-center font-bold text-lg">
                4
              </div>
              <CardContent className="pt-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-[#F58220]/10 flex items-center justify-center">
                  <Share2 className="text-[#F58220]" size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Share Instantly</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Share a branded PDF to your client via WhatsApp in one tap. Professional every time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features That Matter */}
      <section id="features" className="py-12 sm:py-16 lg:py-24 bg-[#F8F9FA]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0056D2]">
              Features That Matter
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Built specifically for Nigerian tradespeople with the tools you actually need
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <Card className="bg-white border-none shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#F58220] to-[#F58220]/70 flex items-center justify-center">
                  <Zap className="text-white" size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Nigeria-Specific AI</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Understands "Carcass," "Point Wiring," "Soakaway" and other local terminology perfectly.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-white border-none shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0056D2] to-[#0056D2]/70 flex items-center justify-center">
                  <BookOpen className="text-white" size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Personal Price Log</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Build your own library of material and labor costs over time. Your prices, your way.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-white border-none shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#009A44] to-[#009A44]/70 flex items-center justify-center">
                  <FileText className="text-white" size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Branded Invoicing</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Convert approved quotes to professional invoices with your logo and bank details.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-white border-none shadow-md hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#F58220] to-[#F58220]/70 flex items-center justify-center">
                  <Wifi className="text-white" size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Works Offline/Low Data</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Optimized for small screen Android devices and slow internet connections.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing & Points System — only rendered when billing is enabled.
          Default posture is the free-tier section below. The full pricing
          tree is preserved so flipping VITE_BILLING_ENABLED=true brings it
          back without a code change. */}
      {features.billing.enabled && (
      <section id="pricing" className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0056D2]">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Pay only for what you use. No monthly subscriptions. Points never expire.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Starter Pack */}
            <Card className="relative border-2 border-gray-200 hover:border-[#F58220] transition-all duration-300 hover:shadow-lg">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Starter Pack</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0056D2]">₦2,000</span>
                  </div>
                  <Badge variant="secondary" className="bg-[#F8F9FA] text-gray-700">
                    50 Points
                  </Badge>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">10 AI-generated quotes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">Voice note processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">Photo analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">PDF export</span>
                  </li>
                </ul>

                <Button
                  className="w-full border-2 border-[#F58220] text-[#F58220] hover:bg-[#F58220] hover:text-white transition-all duration-200"
                  variant="outline"
                  aria-label="Buy 50 points for 2000 Naira"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Professional Pack - Popular */}
            <Card className="relative border-2 border-[#F58220] shadow-xl scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-[#F58220] text-white px-4 py-1 text-sm font-semibold">
                  Most Popular
                </Badge>
              </div>
              <CardContent className="pt-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Professional Pack</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0056D2]">₦3,500</span>
                    <span className="text-sm text-gray-500 line-through">₦4,000</span>
                  </div>
                  <Badge className="bg-[#F58220] text-white">
                    100 Points
                  </Badge>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">20 AI-generated quotes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">All Starter features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">Personal Price Log</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">Branded invoices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">Priority support</span>
                  </li>
                </ul>

                <Button
                  className="w-full bg-[#F58220] hover:bg-[#F58220]/90 text-white font-semibold shadow-md"
                  aria-label="Buy 100 points for 3500 Naira"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Business Pack */}
            <Card className="relative border-2 border-gray-200 hover:border-[#0056D2] transition-all duration-300 hover:shadow-lg">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Business Pack</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0056D2]">₦7,500</span>
                    <span className="text-sm text-gray-500 line-through">₦10,000</span>
                  </div>
                  <Badge className="bg-[#0056D2] text-white">
                    250 Points
                  </Badge>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">50 AI-generated quotes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">All Professional features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">Custom branding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">Analytics dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-600">Team collaboration</span>
                  </li>
                </ul>

                <Button
                  className="w-full border-2 border-[#0056D2] text-[#0056D2] hover:bg-[#0056D2] hover:text-white transition-all duration-200"
                  variant="outline"
                  aria-label="Buy 250 points for 7500 Naira"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Secure payment via Paystack • Points never expire • Cancel anytime
            </p>
          </div>
        </div>
      </section>
      )}
      {!features.billing.enabled && (
      <section id="pricing" className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge className="bg-[#009A44] text-white px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              Free for everyone
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0056D2]">
              Completely free. No catch.
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Every feature is unlocked — unlimited AI-generated quotes, PDF exports,
              branded invoices, voice notes, photo analysis, price logs, and chat history.
              No credit card. No usage caps. No paywalled templates.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto pt-4 text-left">
              {[
                'Unlimited AI quote generations',
                'Unlimited PDF & invoice exports',
                'All templates, colors, and branding',
                'Personal price log + regional pricing',
                'Voice notes & photo analysis',
                'Full chat history with image uploads',
              ].map((feat) => (
                <div key={feat} className="flex items-start gap-2.5">
                  <CheckCircle2 className="text-[#009A44] flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-sm text-gray-700">{feat}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Button
                className="bg-[#F58220] hover:bg-[#F58220]/90 text-white font-semibold px-8 py-6 text-base shadow-md"
                onClick={() => navigate('/auth')}
              >
                Start using OtoQuote — Free
              </Button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Trust & Social Proof */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50/50 mb-4 ring-8 ring-blue-50/20">
              <CheckCircle2 className="text-[#009A44]" size={36} />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0056D2]">
              Trusted by Nigerian Tradespeople
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-gray-900 pt-4">
              <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                {statsLoaded ? (
                  <>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F58220] mb-2 transition-all duration-500">
                      ₦27M+
                    </div>
                    <div className="text-sm sm:text-base text-gray-600 font-medium">
                      In Quotes Processed
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-32 bg-gray-200 rounded-lg mb-2 animate-pulse mx-auto"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </>
                )}
              </div>
              <div className="hidden sm:block w-px h-16 bg-gray-200"></div>
              <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                {statsLoaded ? (
                  <>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F58220] mb-2 transition-all duration-500">
                      5,000+
                    </div>
                    <div className="text-sm sm:text-base text-gray-600 font-medium">
                      Active Tradespeople
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-32 bg-gray-200 rounded-lg mb-2 animate-pulse mx-auto"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </>
                )}
              </div>
              <div className="hidden sm:block w-px h-16 bg-gray-200"></div>
              <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                {statsLoaded ? (
                  <>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F58220] mb-2 transition-all duration-500">
                      15k+
                    </div>
                    <div className="text-sm sm:text-base text-gray-600 font-medium">
                      Quotes Generated
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-32 bg-gray-200 rounded-lg mb-2 animate-pulse mx-auto"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Company Info */}
            <div className="space-y-4">
              <img
                src="/otoqoute logo.png"
                alt="OtoQuote AI Logo"
                className="h-8 w-auto brightness-0 invert"
                loading="lazy"
              />
              <p className="text-sm leading-relaxed">
                Empowering Nigerian tradespeople with AI-powered quote generation for professional business growth.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-base">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-[#F58220] transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-[#F58220] transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-[#F58220] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[#F58220] transition-colors">About Us</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-base">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#F58220] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#F58220] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#F58220] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#F58220] transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-base">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <MapPin className="flex-shrink-0 mt-0.5 text-[#F58220]" size={16} />
                  <span>Lagos, Nigeria</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="flex-shrink-0 text-[#F58220]" size={16} />
                  <a href="tel:+2348012345678" className="hover:text-[#F58220] transition-colors">
                    +234 801 234 5678
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="flex-shrink-0 text-[#009A44]" size={16} />
                  <a href="https://wa.me/2348012345678" className="hover:text-[#F58220] transition-colors">
                    WhatsApp Support
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="flex-shrink-0 text-[#F58220]" size={16} />
                  <a href="mailto:support@otoquote.ai" className="hover:text-[#F58220] transition-colors">
                    support@otoquote.ai
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
            <p>
              &copy; {new Date().getFullYear()} OtoQuote AI. All rights reserved.
              <span className="mx-2">•</span>
              Powered by <span className="text-[#F58220] font-semibold">OtoQuote AI</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;