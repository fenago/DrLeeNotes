import React from 'react';
import { CheckCircle } from 'lucide-react';

interface FeatureItemProps {
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ title, description }) => {
  return (
    <div className="flex gap-4 items-start">
      <div className="mt-1 flex-shrink-0">
        <CheckCircle className="h-6 w-6 text-purple-600" />
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

interface FeatureSectionProps {
  title: string;
  description: string;
  features: FeatureItemProps[];
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ title, description, features }) => {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, index) => (
          <FeatureItem key={index} title={feature.title} description={feature.description} />
        ))}
      </div>
    </div>
  );
};

const FeaturesSection = () => {
  const agenticFeatures = {
    title: "Agentic AI Workflow",
    description: "Transform your learning experience with AI agents that adapt to your needs and work for you.",
    features: [
      {
        title: "Study Agent",
        description: "Automatically detects knowledge gaps, creates personalized study plans, and tracks your comprehension of different topics over time."
      },
      {
        title: "Research Agent",
        description: "Finds citations, verifies facts, and suggests related research materials to enrich your notes with credible information."
      },
      {
        title: "Writing Agent",
        description: "Converts your notes into structured outlines, enhances arguments, and ensures consistent writing style across all your content."
      },
      {
        title: "Concept Mapping",
        description: "Automatically maps relationships between concepts, building a knowledge graph that shows connections across all your notes."
      }
    ]
  };

  const voiceFeatures = {
    title: "Advanced Voice Processing",
    description: "Capture and understand your spoken thoughts with unprecedented clarity and insight.",
    features: [
      {
        title: "3-Hour Classroom Recording Support",
        description: "Capture entire lectures with our optimized recording system designed specifically for classroom environments."
      },
      {
        title: "Multi-language Support",
        description: "Transcribe and process notes in 15+ languages with automatic language detection and language-specific processing."
      },
      {
        title: "Speaker Diarization",
        description: "Automatically identifies and labels different speakers in your recordings, distinguishing between instructors and students."
      },
      {
        title: "Noise Reduction",
        description: "Advanced audio cleaning technology filters out background noise for crystal-clear transcriptions even in busy environments."
      }
    ]
  };

  const multimodalFeatures = {
    title: "Multimodal Learning",
    description: "Capture and process information in whatever form works best for your learning style.",
    features: [
      {
        title: "Handwriting Recognition",
        description: "Convert handwritten notes to text and integrate them seamlessly with your voice notes."
      },
      {
        title: "Rich Media Notes",
        description: "Embed images, audio clips, and video into your notes for a complete multimedia learning experience."
      },
      {
        title: "Diagram Interpretation",
        description: "Extract concepts and relationships from diagrams and whiteboard photos automatically."
      },
      {
        title: "Cross-Media Search",
        description: "Find exactly what you need across all your notes regardless of format - text, audio, or visual."
      }
    ]
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Features That Transform Your Learning</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            <span className="font-bold">A</span>gentic<span className="font-bold">N</span>otes doesn't just record information - it helps you understand, organize, and master it.
          </p>
        </div>

        <FeatureSection 
          title={agenticFeatures.title}
          description={agenticFeatures.description}
          features={agenticFeatures.features}
        />

        <FeatureSection 
          title={voiceFeatures.title}
          description={voiceFeatures.description}
          features={voiceFeatures.features}
        />

        <FeatureSection 
          title={multimodalFeatures.title}
          description={multimodalFeatures.description}
          features={multimodalFeatures.features}
        />

        <div className="mt-16 text-center">
          <a 
            href="/dashboard" 
            className="primary-gradient primary-shadow inline-block mx-auto px-8 py-4 text-xl text-light rounded-full"
          >
            Start Taking Smarter Notes
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
