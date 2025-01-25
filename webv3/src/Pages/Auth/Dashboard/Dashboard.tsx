import React from 'react';

interface DashboardProps {
  role: string;
}

const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</h1>
      <p className="mt-4">Welcome to your {role} dashboard!</p>
    </div>
  );
};

export default Dashboard;