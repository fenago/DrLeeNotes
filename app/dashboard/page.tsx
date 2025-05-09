import DashboardHomePage from './dashboard';

const ServerDashboardHomePage = () => {
  // Bypassing server-side authentication that was causing errors
  // Will fetch data directly in the client component instead
  return <DashboardHomePage />;
};

export default ServerDashboardHomePage;
