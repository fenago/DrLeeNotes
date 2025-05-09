import React from 'react';
import { UserProfile } from '@clerk/nextjs'; 

const ProfilePage = () => {
  return (
    <div className="container mx-auto py-10 px-4 md:px-0 flex justify-center">
      {/* Centering the UserProfile component */}
      <UserProfile 
        path="/dashboard/profile" 
        routing="path" 
        appearance={{
          elements: {
            card: "shadow-xl",
            headerTitle: "text-gray-800 dark:text-white",
            headerSubtitle: "text-gray-600 dark:text-gray-400",
            profileSectionTitleText: "text-gray-700 dark:text-gray-300",
            // Add more custom styling as needed
          }
        }}
      />
    </div>
  );
};

export default ProfilePage;
