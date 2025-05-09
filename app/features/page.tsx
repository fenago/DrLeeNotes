import React from 'react';
import Link from 'next/link';
import { Zap, Brain, Target, Mic, MessageSquare, FileText, Users, Globe, SlidersHorizontal, Puzzle, BarChart3, Lightbulb, BookOpenCheck } from 'lucide-react'; // Example icons

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-primary-500 dark:bg-primary-400 text-white rounded-full mb-4">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300 text-sm flex-grow">{description}</p>
  </div>
);

const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 dark:from-gray-900 dark:to-slate-800 text-gray-700 dark:text-gray-200 font-sans">
      {/* Hero Section */}
      <section className="py-20 md:py-32 text-center relative overflow-hidden bg-gradient-to-br from-primary-500 via-purple-600 to-indigo-700 dark:from-primary-600 dark:via-purple-700 dark:to-indigo-800">
        {/* Optional: You can add a subtle pattern overlay here if desired */}
        {/* e.g. <div className="absolute inset-0 bg-[url('/path/to/subtle-pattern.svg')] opacity-5 z-0"></div> */}
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-tight tracking-tight">
            Unlock a New Era of Learning with<br className="block sm:hidden" /> {/* Break on small screens */}
            <span className="block mt-2 sm:mt-0 sm:inline text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-pink-300 to-orange-300 drop-shadow-sm">AgenticNotes</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-50 mb-12 max-w-3xl mx-auto"> {/* Changed to gray-50 for max brightness on dark bg */}
            The AI-powered platform that transforms your notes, lectures, and study materials into actionable knowledge and personalized learning experiences.
          </p>
          <Link href="/dashboard" legacyBehavior>
            <a className="inline-block bg-gradient-to-r from-sky-400 to-pink-400 hover:from-sky-500 hover:to-pink-500 text-white font-bold py-4 px-10 rounded-lg text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-opacity-75">
              Get Started For Free
            </a>
          </Link>
        </div>
      </section>

      {/* The Challenge Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-6">The Old Way of Learning is <span className="text-red-500">Broken</span></h2>
          <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-16 max-w-3xl mx-auto">
            Endless recordings, scattered notes, information overload... Sound familiar? Students and educators alike struggle to keep up, extract real value, and make learning truly effective in today's fast-paced world.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-8 bg-slate-50 dark:bg-slate-700 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <FileText className="w-16 h-16 mx-auto mb-5 text-primary-500 dark:text-primary-400" />
              <h3 className="text-2xl font-semibold mb-3 text-center text-gray-700 dark:text-white">Information Overwhelm</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">Drowning in digital files, struggling to find what you need when you need it, and missing critical connections.</p>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-700 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <MessageSquare className="w-16 h-16 mx-auto mb-5 text-primary-500 dark:text-primary-400" />
              <h3 className="text-2xl font-semibold mb-3 text-center text-gray-700 dark:text-white">Passive Consumption</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">Lectures become a blur, and notes stay static, failing to spark real engagement or deep understanding.</p>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-700 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <Users className="w-16 h-16 mx-auto mb-5 text-primary-500 dark:text-primary-400" />
              <h3 className="text-2xl font-semibold mb-3 text-center text-gray-700 dark:text-white">One-Size-Fits-All</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">Generic study approaches don't cater to individual learning styles, paces, or specific knowledge gaps.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet AgenticNotes Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <Brain className="w-24 h-24 mx-auto mb-8 text-primary-500 dark:text-primary-400" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-8">Meet AgenticNotes: Your AI-Powered Learning Partner</h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-12">
            AgenticNotes isn't just another note-taking app. It's an intelligent learning ecosystem designed to proactively assist you. Our platform understands your content, anticipates your needs, and provides personalized tools to help you learn smarter, not just harder. Finally, an AI that works <span className="italic">with</span> you, every step of the way.
          </p>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 md:py-24 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-20">Unlock Superpowers for Your Studies & Teaching</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureCard 
              icon={Mic}
              title="Effortless Knowledge Capture"
              description="Seamlessly import Zoom recordings, audio files, transcripts, and all your study materials. AgenticNotes automatically organizes everything, so you can focus on learning, not logistics."
            />
            <FeatureCard 
              icon={Lightbulb}
              title="Unlock Deeper Understanding"
              description="Ask questions directly to your lectures, visualize complex concepts with AI-generated diagrams, and discover hidden connections. Transform passive recordings into interactive knowledge goldmines."
            />
            <FeatureCard 
              icon={Target}
              title="Personalized Learning, Accelerated"
              description="Get AI-powered study plans tailored to your progress, summaries that adapt to your learning style, and automated flashcards to supercharge recall. Your personal tutor, available 24/7."
            />
            <FeatureCard 
              icon={Zap}
              title="Supercharge Your Workflow"
              description="Automate repetitive tasks, effortlessly convert notes into podcasts or outlines, and integrate learning with your favorite productivity tools. Reclaim your time and energy!"
            />
            <FeatureCard 
              icon={Globe}
              title="Learn Without Borders"
              description="Break down language barriers. Transcribe, translate, and listen to your notes in multiple languages. AgenticNotes makes learning accessible to everyone, everywhere."
            />
            <FeatureCard 
              icon={BookOpenCheck}
              title="Interactive Conversational Learning"
              description="Chat with your notes! Ask clarifying questions, get instant summaries of specific sections, and explore topics in depth with our RAG-powered AI that understands your content."
            />
             <FeatureCard 
              icon={SlidersHorizontal}
              title="AI Model Your Way"
              description="Choose your preferred AI for transcription, summarization, and more. Tailor AgenticNotes to your exact needs for cost, speed, and unique capabilities."
            />
            <FeatureCard 
              icon={Puzzle}
              title="Automated Content Augmentation"
              description="AgenticNotes proactively enriches your transcripts with relevant links, academic citations, and visual aids, fostering deeper exploration and critical thinking skills."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Actionable Insights & Plans"
              description="From intelligent action item extraction to personalized study plans and even AI-generated quizzes with spaced repetition, turn insights into tangible progress and mastery."
            />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 md:py-32 text-center bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 dark:text-white mb-8">Ready to Revolutionize Your Learning?</h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Stop just taking notes. Start building knowledge. AgenticNotes is here to help you achieve your academic and professional goals faster and more effectively than ever before.
          </p>
          <Link href="/dashboard" legacyBehavior>
            <a className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-12 rounded-lg text-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Sign Up Now & Get Early Access
            </a>
          </Link>
          <p className="mt-8 text-md text-gray-500 dark:text-gray-400">
            Questions? <Link href="/contact" className="text-primary-500 dark:text-primary-400 hover:underline font-semibold">Contact our team</Link> for a personalized demo.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-200 dark:border-gray-700 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto px-6 text-center text-gray-500 dark:text-gray-400">
          <div className="mb-4">
            <Link href="/features" className="mx-3 hover:text-primary-500 dark:hover:text-primary-400">Features</Link>
            <Link href="/pricing" className="mx-3 hover:text-primary-500 dark:hover:text-primary-400">Pricing</Link> {/* Assuming a pricing page might exist */}
            <Link href="/contact" className="mx-3 hover:text-primary-500 dark:hover:text-primary-400">Contact</Link>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} AgenticNotes. All rights reserved. </p>
          <p className="text-xs mt-1">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span className="mx-2">|</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
