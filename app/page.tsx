import Header from '@/components/ui/Header';
import Banner from '@/components/pages/home/Banner';
import DeviceSection from '@/components/pages/home/DeviceSection';
import FeaturesSection from '@/components/pages/home/FeaturesSection';

const HomePage = () => {
  return (
    <div>
      <Header />
      <Banner />
      <DeviceSection />
      <FeaturesSection />
    </div>
  );
};

export default HomePage;
