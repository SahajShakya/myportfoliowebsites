// src/layouts/DefaultLayout.tsx
import { Outlet } from "react-router-dom";
import Nav from "../../Components/NavBar/Nav";

const DefaultLayout = () => {
  return (
    <div className="bg-gray-200">
      <Nav />
      <div>
        {/* Adds gap between navbar and outlet */}
        <Outlet />
      </div>
    </div>
  );
};

export default DefaultLayout;
