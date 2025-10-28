import React from 'react';


const Dashboard  = ({ role }) => {
  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">
        {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
      </h1>
      <p className="mt-4 text-base sm:text-lg">Welcome to your {role} dashboard!</p>
    </div>
  );
};

export default Dashboard;